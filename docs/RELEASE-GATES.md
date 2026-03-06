# Heroi Kiosk - Release Gates
Data de referencia: 2026-03-06

## Objetivo
Garantir que o jogo rode em evento publico com degradacao elegante:
- sem quebra de fluxo
- sem dependencia de internet
- com fallback para fullscreen, audio, spectator e VFX

## Gate 1 - Core Basico (1 tela, teclado)
Critico: BLOQUEANTE

Checklist:
- App abre em `http://localhost:4173` sem erro fatal.
- Fluxo completo funciona: `ATTRACT -> INTRO -> AVATAR -> TOOLKIT -> REPAIR -> RESULT`.
- Sessao reinicia por inatividade (idle reset).
- Sessao reinicia no fim do `RESULT`.
- Sem travamentos por 10 execucoes seguidas.
- Funciona com audio mudo (sem depender de som para jogar).

Saida esperada:
- `PASS` somente se todos os itens acima estiverem aprovados.

## Gate 2 - Bancada / Input Arcade
Critico: BLOQUEANTE

Checklist:
- Entrada por teclado funciona (`setas`, `confirm`, `cancel`, `start`).
- Gamepad/HID detectado em `DiagnosticsOverlay`.
- Remapeamento executado com sucesso (`RemapWizard`).
- Mapeamento permanece estavel apos reinicio da pagina.
- Foco nao se perde durante navegacao por controles.

Fallback aceito:
- Se bancada falhar, executar com teclado/mouse sem interromper evento.

## Gate 3 - Spectator / Segunda Tela
Critico: ALTO

Checklist:
- `spectator.html` abre e sincroniza estado.
- Se popup bloqueado, jogo principal continua 100%.
- Sem dependencia obrigatoria da segunda tela para completar partida.

Fallback aceito:
- Operacao 1 tela completa.

## Gate 4 - Premium Visual e Sonoro
Critico: ALTO

Checklist:
- VFX responde em `REPAIR` (hit, slot complete, result).
- Audio responde em `start`, `hit`, `slot complete`, `result`.
- Se performance cair, qualidade reduz sem travar (degradacao).
- `prefers-reduced-motion` reduz animacoes e flashes.

Fallback aceito:
- Se VFX falhar, gameplay continua.
- Se audio falhar ou bloquear, captions + UI continuam.

## Politica de Fallback Obrigatoria
Sempre seguir:
- fullscreen falhou -> segue sem fullscreen
- audio bloqueado -> segue com captions
- TTS ruim/inexistente -> captions only
- popup spectator bloqueado -> modo 1 tela
- WebGPU indisponivel -> WebGL
- VFX indisponivel -> sem VFX, gameplay intacto

## Preflight no Dia do Evento
Executar:
```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\preflight-kiosk.ps1 -Build
```

Depois validar manualmente:
- 3 partidas completas com teclado
- 3 partidas completas com bancada/gamepad
- 1 ciclo com internet desligada
- 1 ciclo com popup bloqueado

## Criterio Final de Go/No-Go
- Todos os itens BLOQUEANTES aprovados
- Nenhum erro fatal em console durante fluxo completo
- Fallbacks testados e funcionando

