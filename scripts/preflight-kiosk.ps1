param(
  [switch]$Build,
  [switch]$SkipInstall
)

$ErrorActionPreference = "Stop"

function Write-Section($text) {
  Write-Host ""
  Write-Host "=== $text ===" -ForegroundColor Cyan
}

function Pass($text) {
  Write-Host "[PASS] $text" -ForegroundColor Green
}

function Warn($text) {
  Write-Host "[WARN] $text" -ForegroundColor Yellow
}

function Fail($text) {
  Write-Host "[FAIL] $text" -ForegroundColor Red
}

$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

$hasFailure = $false

Write-Section "Heroi Kiosk Preflight"
Write-Host "Repo: $repoRoot"
Write-Host "Data: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"

Write-Section "Toolchain"
try {
  $nodeVersion = node --version
  Pass "Node detectado: $nodeVersion"
} catch {
  Fail "Node nao encontrado."
  $hasFailure = $true
}

try {
  $npmVersion = npm --version
  Pass "npm detectado: $npmVersion"
} catch {
  Fail "npm nao encontrado."
  $hasFailure = $true
}

Write-Section "Arquivos Criticos"
$criticalFiles = @(
  "index.html",
  "spectator.html",
  "vite.config.ts",
  "src/main.ts",
  "src/ui-preact/App.tsx",
  "src/ui-preact/ScreenHost.tsx",
  "src/core/store/gameStore.ts",
  "public/assets/audio/ambient-loop.wav",
  "public/assets/audio/ui-sprites.wav",
  "public/assets/lottie/result-celebration.json",
  "public/assets/lottie/slot-complete.json"
)

foreach ($file in $criticalFiles) {
  if (Test-Path (Join-Path $repoRoot $file)) {
    Pass "Arquivo presente: $file"
  } else {
    Fail "Arquivo ausente: $file"
    $hasFailure = $true
  }
}

Write-Section "Dependencias"
if (-not $SkipInstall) {
  try {
    npm ci | Out-Null
    Pass "npm ci executado com sucesso."
  } catch {
    Fail "npm ci falhou."
    $hasFailure = $true
  }
} else {
  Warn "Instalacao de dependencias ignorada por parametro -SkipInstall."
}

Write-Section "Validacao de Build"
try {
  npm run typecheck | Out-Null
  Pass "typecheck OK."
} catch {
  Fail "typecheck falhou."
  $hasFailure = $true
}

if ($Build) {
  try {
    npm run build | Out-Null
    Pass "build OK."
  } catch {
    Fail "build falhou."
    $hasFailure = $true
  }
} else {
  Warn "Build completo nao executado (use -Build para habilitar)."
}

Write-Section "Checklist Manual (evento)"
Write-Host "- Fullscreen inicia no START (com fallback)."
Write-Host "- Audio desbloqueia no START (com fallback silencioso)."
Write-Host "- Fluxo completo sem travar em 1 tela."
Write-Host "- Bancada/gamepad com foco estavel."
Write-Host "- Spectator opcional (se popup bloquear, jogo continua)."
Write-Host "- Offline validado (apos primeira carga)."

Write-Section "Resultado"
if ($hasFailure) {
  Fail "PRE-FLIGHT REPROVADO. Corrija os itens [FAIL] antes do evento."
  exit 1
}

Pass "PRE-FLIGHT APROVADO."
exit 0

