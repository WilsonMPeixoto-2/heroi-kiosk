# Heroi Kiosk

Projeto web para experiencia kiosk (arcade + spectator), com fallback operacional para evento.

## Execucao rapida (evento)

### 1) Preflight completo
```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\evento\preflight-evento.ps1 -RepoPath . -Port 4173 -RunNpmCi -RunBuild -RunPreviewTest -RequireSecondDisplay
```

### 2) Rodar evento em 1 comando
```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\evento\run-evento.ps1 -RepoPath . -Port 4173 -OpenSpectator -Theme neon
```

### 3) Encerrar ambiente
```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\evento\STOP-EVENTO.ps1
```

## Checklist humano
- [scripts/evento/CHECKLIST-EVENTO.md](scripts/evento/CHECKLIST-EVENTO.md)

## Release gates
- [docs/RELEASE-GATES.md](docs/RELEASE-GATES.md)
