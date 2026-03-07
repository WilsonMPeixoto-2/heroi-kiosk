# RESET CONCEITUAL HEROI KIOSK
Data: 2026-03-07
Status: ativo e obrigatorio

## Premissa oficial
O HTML inicial usado no começo do projeto e um artefato explicativo preliminar.
Ele nao e referencia de:
- layout final
- UI final
- gameplay final
- ritmo final
- direcao de arte final

Regra: o produto deve ser uma criacao inedita com linguagem de jogo de verdade.

## Escopo da auditoria
Arquivos revisados:
- src/ui-preact/ScreenHost.tsx
- src/ui-preact/GameRoot.tsx
- src/main.ts
- src/core/types.ts
- src/content/locale/pt-BR.ts
- src/style.css
- docs/RELEASE-GATES.md
- README.md

## Achados de "contaminacao de rascunho"
1. Fluxo em 6 telas lineares com muitos botoes de confirmar/voltar.
Classificacao: refatorar.
Risco: parecer wizard gamificado em vez de cena jogavel.

2. Toolkit ainda funciona como checklist de 3 itens obrigatorios.
Classificacao: refatorar.
Risco: sensacao de formulario.

3. Repair tem base jogavel (tempo, combo, erro/acerto), mas ainda e mecanica simples de afinidade fixa.
Classificacao: refatorar.
Risco: repeticao rapida e pouca tensao.

4. Linguagem de alguns nomes e textos ("cooperacao", "empatia", "criatividade") pode soar institucional quando exibida sem tratamento diegetico.
Classificacao: refatorar.
Risco: leitura escolarizada.

5. Topbar e resumo final podem ser lidos como dashboard quando sem dramatizacao visual suficiente.
Classificacao: refatorar.
Risco: cara de app.

6. Arquitetura tecnica, stack e robustez operacional do projeto estao solidas.
Classificacao: preservar.
Risco: nenhum, e vantagem competitiva.

## Preservar / Refatorar / Remover
### Preservar
- Infraestrutura tecnica (Vite, TS, PWA, Playwright, pipeline de scripts).
- Estrutura de fallback e hardening kiosk.
- Base audiovisual (VFX, audio, overlays, spectator).
- Nucleo de missao curta com pressao temporal.

### Refatorar
- Linguagem das telas para foco em acao e resposta do mundo.
- Toolkit para escolhas com tradeoff real.
- Repair para loop mais profundo e sensorial.
- Result para payoff dramatizado e vontade de replay.
- Naming diegetico de ferramentas/slots na camada de apresentacao.

### Remover
- Qualquer tela ou bloco que funcione como leitura + clique + avancar.
- Texto explicativo longo no centro da experiencia.
- Qualquer elemento visual com cara de wireframe escolar.

## Verificacao de arquivo HTML inicial
Nao foi encontrado no repositrio um arquivo legado de produto alem de:
- index.html (entrypoint real)
- spectator.html (entrada da tela publica)

Acao aplicada:
- criada pasta de arquivo em `archive/legacy-drafts/` com regra explicita de uso nao autoritativo.

## Nova ancora de produto
Referencia principal a partir deste reset:
- docs/DIRETRIZ-MESTRA-PRODUTO.md

## Critero de aceite do reset
O projeto segue adiante apenas se:
- continuar com cara de jogo de verdade
- manter visual vivo e resposta sensorial
- rejeitar formalmente qualquer retorno ao padrao "apostila gamificada"
