param(
  [string]$RepoPath = (Get-Location).Path,
  [int]$Port = 4173,
  [switch]$OpenSpectator,
  [string]$Theme = "neon"
)

$ErrorActionPreference = "Stop"

function Resolve-NpmPath {
  $npmCmd = Get-Command npm.cmd -ErrorAction SilentlyContinue
  if ($npmCmd) { return $npmCmd.Source }

  $npm = Get-Command npm -ErrorAction SilentlyContinue
  if ($npm) { return $npm.Source }

  throw "npm nao encontrado no PATH."
}

function Resolve-EdgePath {
  $candidates = @(
    "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe",
    "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe"
  )

  foreach ($path in $candidates) {
    if (Test-Path $path) {
      return $path
    }
  }

  $edgeCmd = Get-Command msedge.exe -ErrorAction SilentlyContinue
  if ($edgeCmd) { return $edgeCmd.Source }

  $edgeCmd = Get-Command msedge -ErrorAction SilentlyContinue
  if ($edgeCmd) { return $edgeCmd.Source }

  throw "Edge nao encontrado"
}

$npmExe = Resolve-NpmPath

function Run-Npm($npmArgs, $cwd) {
  Write-Host ">> npm $npmArgs" -ForegroundColor Cyan
  $p = Start-Process -FilePath $npmExe -ArgumentList $npmArgs -WorkingDirectory $cwd -PassThru -NoNewWindow
  $p.WaitForExit()
  if ($p.ExitCode -ne 0) { throw "npm $npmArgs falhou (ExitCode=$($p.ExitCode))" }
}

Run-Npm "run build" $RepoPath

$pkg = Get-Content (Join-Path $RepoPath "package.json") -Raw
$scriptName = "preview"
if ($pkg -match '"preview:host"\s*:') { $scriptName = "preview:host" }

Write-Host ">> Iniciando preview ($scriptName)..." -ForegroundColor Cyan
$preview = Start-Process -FilePath $npmExe -ArgumentList "run $scriptName" -WorkingDirectory $RepoPath -PassThru -NoNewWindow

Start-Sleep -Seconds 2

$edge = Resolve-EdgePath

$url = "http://localhost:$Port/?theme=$Theme"
Write-Host ">> Abrindo Edge kiosk em $url" -ForegroundColor Cyan

Start-Process -FilePath $edge -ArgumentList @(
  "--kiosk", $url,
  "--edge-kiosk-type=fullscreen",
  "--no-first-run",
  "--disable-features=TranslateUI"
)

if ($OpenSpectator) {
  Start-Sleep -Seconds 1
  $spec = "http://localhost:$Port/spectator.html?theme=$Theme"
  Write-Host ">> Abrindo spectator em $spec" -ForegroundColor Cyan
  Start-Process -FilePath $edge -ArgumentList @(
    $spec,
    "--new-window",
    "--no-first-run"
  )
}

Write-Host ""
Write-Host "Servidor preview esta rodando (PID: $($preview.Id))." -ForegroundColor Green
Write-Host "Para encerrar: powershell -ExecutionPolicy Bypass -File .\scripts\evento\STOP-EVENTO.ps1" -ForegroundColor Green

