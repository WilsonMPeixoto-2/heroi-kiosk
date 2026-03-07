# REDESENHO REPAIR
Data: 2026-03-07
Status: proposta de produto para implementacao

## Objetivo
Transformar o Repair no coracao jogavel real do projeto, com 10 a 20 segundos de tensao ativa por rodada.

## Loop proposto (15 segundos medio)
1. Ler padrao de pulso do slot instavel.
2. Armar ferramenta com afinidade parcial.
3. Executar acao em janela de timing curta.
4. Receber resposta imediata (VFX + audio + vibracao).
5. Encadear proximo slot para combo.
6. Estabilizar 3 de 4 slots para fechar missao.

## Verbos do jogador
- observar
- armar
- sincronizar
- sustentar
- encadear
- recuperar erro

## Estados dos slots
1. Instavel
2. Sincronizando
3. Sobrecarga
4. Estavel

Transicao principal:
- Instavel -> Sincronizando com acao correta no tempo certo
- Sincronizando -> Estavel com acerto consecutivo
- Erro ou atraso -> Sobrecarga temporaria
- Sobrecarga -> Instavel apos breve cooldown

## Tipos de erro
1. Ferramenta com baixa afinidade no estado atual.
2. Acao fora da janela de timing.
3. Acao interrompida cedo.
4. Sobrecarga por spam.

## Tipos de recompensa
1. Acerto simples: +progresso visual no slot.
2. Acerto em timing perfeito: bonus de combo e efeito especial.
3. Cadeia de 3 acertos: boost audiovisual e restauracao acelerada.
4. Estabilizacao de slot: mini-climax (som + particulas + lottie curta).

## Integracao com VFX e audio
1. Cada slot recebe assinatura cromatica e padrao de particula proprio.
2. Audio usa tres camadas: base ambiente, hit de slot, recompensa de combo.
3. Erro recebe feedback curto e seco, sem punicao frustrante.
4. Progresso global altera atmosfera de cena em tempo real.

## Criterios de aceitacao de gameplay
1. Jogador entende o que fazer em menos de 5 segundos.
2. Acao correta sempre gera resposta sensorial clara.
3. Erro e recuperavel em menos de 2 segundos.
4. A rodada gera desejo de replay por desempenho.
