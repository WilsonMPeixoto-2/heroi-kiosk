param(
  [string]$Url = "http://localhost:4173/?theme=neon",
  [switch]$OpenSpectator,
  [string]$SpectatorUrl = "http://localhost:4173/spectator.html?theme=neon"
)

$ErrorActionPreference = "Stop"

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
  if ($edgeCmd) {
    return $edgeCmd.Source
  }

  $edgeCmd = Get-Command msedge -ErrorAction SilentlyContinue
  if ($edgeCmd) {
    return $edgeCmd.Source
  }

  throw "Microsoft Edge não foi encontrado. Verifique a instalação do navegador."
}

$edgePath = Resolve-EdgePath

$kioskArgs = @(
  "--kiosk",
  $Url,
  "--edge-kiosk-type=fullscreen",
  "--kiosk-idle-timeout-minutes=0",
  "--no-first-run",
  "--disable-session-crashed-bubble"
)

Write-Host "Iniciando Edge em modo kiosk..." -ForegroundColor Cyan
Write-Host "URL: $Url" -ForegroundColor Gray
Start-Process -FilePath $edgePath -ArgumentList $kioskArgs | Out-Null

if ($OpenSpectator.IsPresent) {
  $spectatorArgs = @(
    "--new-window",
    $SpectatorUrl,
    "--start-fullscreen",
    "--no-first-run"
  )

  Start-Sleep -Milliseconds 850
  Write-Host "Abrindo janela do público..." -ForegroundColor Cyan
  Write-Host "URL: $SpectatorUrl" -ForegroundColor Gray
  Start-Process -FilePath $edgePath -ArgumentList $spectatorArgs | Out-Null
}

Write-Host "Pronto. Use Alt+F4 para encerrar o modo kiosk." -ForegroundColor Green
