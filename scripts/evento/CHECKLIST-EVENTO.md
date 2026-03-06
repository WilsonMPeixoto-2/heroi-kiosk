# CHECKLIST - Jogo Heroi Kiosk (Homologacao)

## T-48h (obrigatorio)
- [ ] `preflight-evento.ps1` executado e APROVADO (exit 0)
- [ ] `npm run build` OK
- [ ] `npm run preview:host` (ou `preview`) sobe em `http://localhost:4173`
- [ ] GET `/` e GET `/spectator.html` respondem
- [ ] START destrava audio (som toca apos START)
- [ ] Controle por teclado funciona (setas + confirmar + voltar)
- [ ] Se 2 telas: Windows em "Estender", spectator abre no monitor 2

## T-24h (recomendado)
- [ ] Testar com a bancada arcade conectada e rodar remapeamento
- [ ] Confirmar volume e saida de audio
- [ ] Confirmar energia: sem suspensao/hibernacao/desligar tela

## Dia do evento
- [ ] Rodar `run-evento.ps1` (1 clique)
- [ ] Abrir spectator (se aplicavel)
- [ ] Validar 1 rodada completa (2-3 min)

## Plano B (fallback imediato)
- [ ] Rodar em 1 tela sem spectator
- [ ] Naracao em captions-only
- [ ] VFX reduzido sem travar gameplay

## Plano C (contingencia)
- [ ] Segundo notebook pronto com build local
- [ ] Porta alternativa disponivel (ex.: 4174)
- [ ] Script STOP-EVENTO validado

