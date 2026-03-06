param(
  [string]$RepoPath = (Get-Location).Path,
  [int]$Port = 4173,
  [switch]$RunNpmCi,
  [switch]$RunBuild,
  [switch]$RunPreviewTest,
  [switch]$RequireSecondDisplay
)

$ErrorActionPreference = "Stop"

function Write-Section($t) { Write-Host "`n=== $t ===" -ForegroundColor Cyan }
function Write-OK($t) { Write-Host "[OK]  $t" -ForegroundColor Green }
function Write-WARN($t) { Write-Host "[WARN] $t" -ForegroundColor Yellow }
function Write-FAIL($t) { Write-Host "[FAIL] $t" -ForegroundColor Red }

function Get-SemVer($v) {
  $v = $v.Trim()
  if ($v.StartsWith("v")) { $v = $v.Substring(1) }
  $parts = $v.Split(".")
  return [pscustomobject]@{
    Major = [int]$parts[0]
    Minor = [int]$parts[1]
    Patch = [int]$parts[2]
    Raw = $v
  }
}

function Assert-NodeVersion {
  Write-Section "Node.js / npm"
  try {
    $nodeV = & node -v
    $npmV = & npm -v
  } catch {
    Write-FAIL "Node.js ou npm nao encontrados no PATH. Instalar Node LTS."
    return $false
  }

  $sv = Get-SemVer $nodeV
  Write-OK "Node: $($sv.Raw) | npm: $npmV"

  $ok = $false
  if ($sv.Major -eq 20 -and $sv.Minor -ge 19) { $ok = $true }
  if ($sv.Major -ge 22) { $ok = $true }

  if (-not $ok) {
    Write-FAIL "Versao do Node potencialmente incompativel (recomendado 20.19+ ou 22.12+)."
    return $false
  }

  return $true
}

function Assert-Edge {
  Write-Section "Microsoft Edge"
  $edgeCandidates = @(
    "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe",
    "$env:ProgramFiles(x86)\Microsoft\Edge\Application\msedge.exe"
  )
  $edge = $null
  foreach ($p in $edgeCandidates) { if (Test-Path $p) { $edge = $p; break } }

  if (-not $edge) {
    try {
      $cmd = Get-Command msedge -ErrorAction Stop
      $edge = $cmd.Source
    } catch {}
  }

  if (-not $edge) {
    Write-FAIL "Microsoft Edge nao encontrado. Instalar Edge Stable."
    return $false
  }

  Write-OK "Edge encontrado em: $edge"
  return $true
}

function Assert-PortFree($port) {
  Write-Section "Porta localhost"
  $listeners = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
  if ($listeners) {
    Write-FAIL "Porta $port ja esta em uso (LISTEN). Libere a porta ou ajuste o projeto."
    return $false
  }
  Write-OK "Porta $port livre."
  return $true
}

function Assert-RepoPath($path) {
  Write-Section "Repositorio"
  if (-not (Test-Path $path)) {
    Write-FAIL "RepoPath nao existe: $path"
    return $false
  }
  if (-not (Test-Path (Join-Path $path "package.json"))) {
    Write-FAIL "package.json nao encontrado em: $path"
    return $false
  }
  Write-OK "RepoPath OK: $path"
  return $true
}

function Run-Npm($args, $cwd) {
  $pinfo = New-Object System.Diagnostics.ProcessStartInfo
  $pinfo.FileName = "npm"
  $pinfo.Arguments = $args
  $pinfo.WorkingDirectory = $cwd
  $pinfo.RedirectStandardOutput = $true
  $pinfo.RedirectStandardError = $true
  $pinfo.UseShellExecute = $false
  $p = New-Object System.Diagnostics.Process
  $p.StartInfo = $pinfo
  [void]$p.Start()
  $out = $p.StandardOutput.ReadToEnd()
  $err = $p.StandardError.ReadToEnd()
  $p.WaitForExit()
  return [pscustomobject]@{ Code = $p.ExitCode; Out = $out; Err = $err }
}

function Assert-NpmCi($path) {
  Write-Section "npm ci"
  $r = Run-Npm "ci" $path
  if ($r.Code -ne 0) {
    Write-FAIL "npm ci falhou.`n$r.Err"
    return $false
  }
  Write-OK "npm ci OK."
  return $true
}

function Assert-Build($path) {
  Write-Section "Build"
  $r = Run-Npm "run build" $path
  if ($r.Code -ne 0) {
    Write-FAIL "npm run build falhou.`n$r.Err"
    return $false
  }
  Write-OK "Build OK."
  return $true
}

function Start-Preview($path) {
  $scripts = Get-Content (Join-Path $path "package.json") -Raw
  $scriptName = "preview"
  if ($scripts -match '"preview:host"\s*:') { $scriptName = "preview:host" }

  $psi = New-Object System.Diagnostics.ProcessStartInfo
  $psi.FileName = "npm"
  $psi.Arguments = "run $scriptName"
  $psi.WorkingDirectory = $path
  $psi.UseShellExecute = $false
  $psi.RedirectStandardOutput = $true
  $psi.RedirectStandardError = $true

  $p = New-Object System.Diagnostics.Process
  $p.StartInfo = $psi
  [void]$p.Start()
  return $p
}

function Wait-HttpOk($url, $timeoutSec = 20) {
  $sw = [Diagnostics.Stopwatch]::StartNew()
  while ($sw.Elapsed.TotalSeconds -lt $timeoutSec) {
    try {
      $resp = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 4
      if ($resp.StatusCode -ge 200 -and $resp.StatusCode -lt 400) { return $true }
    } catch {}
    Start-Sleep -Milliseconds 350
  }
  return $false
}

function Assert-PreviewAndRoutes($path, $port) {
  Write-Section "Preview + Rotas"
  $p = Start-Preview $path
  try {
    $base = "http://localhost:$port/"
    if (-not (Wait-HttpOk $base 25)) {
      Write-FAIL "Servidor nao respondeu em $base (timeout). Verifique porta, firewall, scripts."
      return $false
    }
    Write-OK "GET / OK ($base)"

    $spec = "http://localhost:$port/spectator.html"
    if (Wait-HttpOk $spec 10) {
      Write-OK "GET /spectator.html OK"
    } else {
      Write-WARN "GET /spectator.html nao respondeu. Se dual-screen for necessario, investigar build/input do Vite."
    }

    return $true
  } finally {
    try { $p.Kill() | Out-Null } catch {}
  }
}

function Assert-Displays($requireSecond) {
  Write-Section "Displays"
  try {
    $mon = Get-CimInstance -ClassName Win32_DesktopMonitor -ErrorAction Stop
    $count = @($mon).Count
    Write-OK "Monitores detectados (Win32_DesktopMonitor): $count"
    if ($requireSecond -and $count -lt 2) {
      Write-FAIL "Requer 2 telas, mas so 1 monitor detectado."
      return $false
    }
  } catch {
    Write-WARN "Nao foi possivel enumerar monitores via WMI. Continuar."
  }
  return $true
}

function Assert-AudioDevices {
  Write-Section "Audio"
  try {
    $aud = Get-CimInstance Win32_SoundDevice
    if (@($aud).Count -eq 0) {
      Write-WARN "Nenhum dispositivo de audio listado (Win32_SoundDevice). Verificar drivers/saida."
    } else {
      Write-OK ("Dispositivos de audio detectados: " + @($aud).Count)
    }
  } catch {
    Write-WARN "Falha ao consultar Win32_SoundDevice. Continuar."
  }
  return $true
}

function Assert-UsbHints {
  Write-Section "USB / HID (indicativo)"
  try {
    $pnp = Get-PnpDevice -PresentOnly -ErrorAction Stop
    $hid = $pnp | Where-Object { $_.Class -match "HIDClass|Keyboard|Mouse" }
    if (@($hid).Count -gt 0) {
      Write-OK "Dispositivos HID/Keyboard detectaveis: $(@($hid).Count)"
    } else {
      Write-WARN "Nenhum dispositivo HID listado. Pode ser restricao de permissoes."
    }
  } catch {
    Write-WARN "Get-PnpDevice indisponivel/negado. Continuar."
  }
  return $true
}

$allOk = $true

$allOk = (Assert-RepoPath $RepoPath) -and $allOk
$allOk = (Assert-NodeVersion) -and $allOk
$allOk = (Assert-Edge) -and $allOk
$allOk = (Assert-PortFree $Port) -and $allOk

if ($RunNpmCi) { $allOk = (Assert-NpmCi $RepoPath) -and $allOk }
if ($RunBuild) { $allOk = (Assert-Build $RepoPath) -and $allOk }
if ($RunPreviewTest) { $allOk = (Assert-PreviewAndRoutes $RepoPath $Port) -and $allOk }

$allOk = (Assert-Displays $RequireSecondDisplay) -and $allOk
$allOk = (Assert-AudioDevices) -and $allOk
$allOk = (Assert-UsbHints) -and $allOk

Write-Section "Resultado"
if ($allOk) {
  Write-OK "PRE-FLIGHT APROVADO."
  exit 0
} else {
  Write-FAIL "PRE-FLIGHT REPROVADO. Corrigir itens FAIL e reexecutar."
  exit 1
}

