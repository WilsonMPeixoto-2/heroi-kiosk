# AUDITORIA GAMEPLAY REAL
Data: 2026-03-07
Status: ativa

Objetivo: identificar onde o jogo ainda parece leitura passiva e onde ja entrega interacao real.

## Diagnostico por etapa
### ATTRACT
Estado atual:
- boa presenca visual e CTA claro
- convite ainda depende de botao e texto

Classificacao:
- preservar: atmosfera e chamada de missao
- refatorar: incluir teaser jogavel de 3 a 5 segundos no proprio attract

### INTRO
Estado atual:
- contexto curto, porem ainda linear

Classificacao:
- refatorar: reduzir texto e transformar contexto em microacao

### AVATAR
Estado atual:
- customizacao funcional e visualmente aceitavel
- fluxo ainda parecido com configuracao de perfil

Classificacao:
- refatorar: converter em escolha dramatica rapida com impacto visivel imediato

### TOOLKIT
Estado atual:
- escolha de 3 ferramentas com feedback
- estrutura de checklist obrigatorio

Classificacao:
- refatorar: introduzir tradeoff real (peso, risco, sinergia)

### REPAIR
Estado atual:
- melhor parte do jogo hoje
- ja possui tempo, erro/acerto, combo e resposta audiovisual
- profundidade ainda limitada por afinidade fixa

Classificacao:
- preservar: nucleo responsivo atual
- refatorar: ritmo, tensao, janelas de timing e estados dinamicos

### RESULT
Estado atual:
- resumo claro e reinicio rapido
- recompensa dramatica ainda moderada

Classificacao:
- refatorar: climax visual/sonoro e gancho forte de replay

## Achados gerais
### Preservar
- tempo de missao curto e adequado para kiosk
- feedback sonoro basico bem distribuido
- base de VFX e lottie pronta para evolucao

### Refatorar
- excesso de confirmacoes entre etapas
- texto em pontos onde acao visual seria melhor
- naming e tom de algumas labels com leitura institucional

### Remover
- qualquer elemento que funcione como "proxima tela" sem acao significativa

## Meta de qualidade de gameplay
O jogador deve sentir:
1. que agiu com habilidade
2. que o mundo reagiu imediatamente
3. que vale a pena jogar de novo para melhorar desempenho
