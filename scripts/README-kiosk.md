# Modo Kiosk (Edge)

## 1) Suba o preview local

```powershell
npm run build
npm run preview:host
```

## 2) Abra o Edge em kiosk

```powershell
npm run kiosk:edge
```

## 3) Abrir também a tela do público

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\launch-edge-kiosk.ps1 -OpenSpectator
```

## 4) Definir URL customizada

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\launch-edge-kiosk.ps1 -Url "http://localhost:4173/?theme=clean&admin=1"
```

## 5) Rodar preflight de seguranca (recomendado antes do evento)

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\preflight-kiosk.ps1 -Build
```

## 6) Kit de evento (preflight + run + stop)

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\evento\preflight-evento.ps1 -RepoPath . -Port 4173 -RunNpmCi -RunBuild -RunPreviewTest -RequireSecondDisplay
powershell -ExecutionPolicy Bypass -File .\scripts\evento\run-evento.ps1 -RepoPath . -Port 4173 -OpenSpectator -Theme neon
powershell -ExecutionPolicy Bypass -File .\scripts\evento\STOP-EVENTO.ps1
```
