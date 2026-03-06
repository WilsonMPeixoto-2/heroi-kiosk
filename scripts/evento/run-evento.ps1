param(
  [string]$RepoPath = (Get-Location).Path,
  [int]$Port = 4173,
  [switch]$OpenSpectator,
  [string]$Theme = "neon"
)

$ErrorActionPreference = "Stop"

function Run-Npm($args, $cwd) {
  Write-Host ">> npm $args" -ForegroundColor Cyan
  $p = Start-Process -FilePath "npm" -ArgumentList $args -WorkingDirectory $cwd -PassThru -NoNewWindow
  $p.WaitForExit()
  if ($p.ExitCode -ne 0) { throw "npm $args falhou (ExitCode=$($p.ExitCode))" }
}

Run-Npm "run build" $RepoPath

$pkg = Get-Content (Join-Path $RepoPath "package.json") -Raw
$scriptName = "preview"
if ($pkg -match '"preview:host"\s*:') { $scriptName = "preview:host" }

Write-Host ">> Iniciando preview ($scriptName)..." -ForegroundColor Cyan
$preview = Start-Process -FilePath "npm" -ArgumentList "run $scriptName" -WorkingDirectory $RepoPath -PassThru -NoNewWindow

Start-Sleep -Seconds 2

$edge = "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe"
if (-not (Test-Path $edge)) { $edge = "$env:ProgramFiles(x86)\Microsoft\Edge\Application\msedge.exe" }
if (-not (Test-Path $edge)) { throw "Edge nao encontrado" }

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

