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
