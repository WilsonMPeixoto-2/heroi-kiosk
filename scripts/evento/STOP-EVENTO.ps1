$ErrorActionPreference = "SilentlyContinue"

Write-Host "Encerrando Edge (se necessario)..." -ForegroundColor Cyan
Get-Process msedge -ErrorAction SilentlyContinue | Stop-Process -Force

Write-Host "Encerrando servidores Node (vite preview)..." -ForegroundColor Cyan
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force

Write-Host "OK. Ambiente encerrado." -ForegroundColor Green

