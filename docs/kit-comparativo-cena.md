# Kit Comparativo - Mesma Cena, 3 Direcoes de Arte

## 1) Cena-base (invariavel nas 3 versoes)

- Genero e estrutura: `acao-aventura 2D roguelite`, side-scroller.
- Resolucao alvo: `1920x1080` (safe area de HUD: 5% nas bordas).
- Grid: `tile 64x64`.
- Janela de camera: `30 x 17 tiles`.
- Camera: lateral, fixa no eixo Y, follow suave no X.
- Composicao fixa do frame:
  - Heroi: `x=38%`, `y=68%` (chao), olhando para direita.
  - Inimigo elite: `x=63%`, `y=68%`.
  - Porta da arena/objetivo: `x=88%`, `y=54%`.
  - Plano de fundo principal (landmark): centro em `x=72%`, `y=40%`.
- HUD fixa:
  - Vida (barra horizontal): canto superior esquerdo.
  - Energia/stamina (barra menor): abaixo da vida.
  - Moeda/recurso da run: canto superior direito.
  - Skill ativa (icone + cooldown): canto inferior direito.
- Acao da cena (mesmo contexto em todas):
  - Heroi entra em area de transicao.
  - Elite guarda a passagem.
  - Objetivo visual ao fundo indica "proxima zona".

## 2) Versao A - Fantasia Sombria

### Direcao
- Ambiente: ruina de catedral alagada, arcos quebrados, nevoa baixa.
- Materiais: pedra gasta, ferro oxidado, vitrais rachados, agua escura.

### Paleta (tokens)
- `bg_deep #0B0F1A`
- `bg_mid #1A2331`
- `stone #384457`
- `fog #5E6B78`
- `accent_blood #6B1E1E`
- `accent_fire #D98C2B`
- `ui_base #2A2F38`
- `ui_highlight #C7A46A`

### Heroi e inimigo (mesma silhueta, skin diferente)
- Heroi: capa curta rasgada, lamina runica, brilho ambar na arma.
- Elite: sentinela profanado com alabarda, olho vermelho opaco.

### VFX e luz
- Luz principal fria superior + recortes quentes de tocha.
- Particulas: cinza, brasa, gotas finas.
- Hit FX: flash vermelho escuro + fagulha laranja curta.

### UI (mesmo layout)
- Moldura de metal antigo, icones runicos gravados.
- Tipografia sugerida: `Cinzel` para titulos, `Noto Sans` para numeros.

## 3) Versao B - Sci-Fi Neon

### Direcao
- Ambiente: corredor industrial de megacidade, cabos, paineis e vapor.
- Materiais: metal escovado, vidro tecnico, tubos de energia.

### Paleta (tokens)
- `bg_deep #05070D`
- `bg_mid #111827`
- `metal #2A3441`
- `smoke #4C5A6A`
- `accent_cyan #00E5FF`
- `accent_magenta #FF2E88`
- `accent_alert #FFE066`
- `ui_base #0E1420`

### Heroi e inimigo
- Heroi: armadura leve modular, espada-plasma curta, visor ciano.
- Elite: drone bipedal pesado com escudo eletrico frontal.

### VFX e luz
- Luz principal fria lateral + emissores neon localizados.
- Particulas: faiscas, vapor, chuva acida fina.
- Hit FX: glitch curto ciano/magenta + choque eletrico.

### UI
- HUD holografica limpa, bordas finas e marcadores tecnicos.
- Tipografia sugerida: `Rajdhani` para labels, `JetBrains Mono` para numeros.

## 4) Versao C - Cartoon Brutal

### Direcao
- Ambiente: feira de sucata pos-colapso, placas, lonas e estruturas tortas.
- Materiais: tinta descascada, borracha, madeira remendada, ferrugem colorida.

### Paleta (tokens)
- `bg_deep #1D3557`
- `bg_mid #457B9D`
- `ground #2A9D8F`
- `foam #A8DADC`
- `accent_red #E63946`
- `accent_yellow #F1FA8C`
- `accent_orange #FF9F1C`
- `ui_base #243447`

### Heroi e inimigo
- Heroi: jaqueta oversized, espada improvisada, animacao exagerada.
- Elite: brutamontes com armadura de sucata e martelo gigante.

### VFX e luz
- Luz quente de fim de tarde + letreiros piscando.
- Particulas: poeira grossa, papel voando, gotas estilizadas.
- Hit FX: impacto com shape grafico (estrela/estouro) e frame-stop curto.

### UI
- Painel arcade com blocos grandes e icones de alto contraste.
- Tipografia sugerida: `Bangers` para titulos, `Nunito Sans` para suporte.

## 5) Prompt unico por versao (mesma composicao)

Use o mesmo prompt-base e troque apenas o bloco de estilo:

```text
2D side-scroller game frame, 1920x1080, hero at 38% x on ground, elite enemy at 63% x on ground, objective gate at 88% x, fixed HUD (health top-left, stamina below, currency top-right, skill icon bottom-right), same camera height, same gameplay readability, high clarity silhouettes, production-ready concept art.
```

Complemento A (Fantasia Sombria):

```text
dark fantasy ruined flooded cathedral, cold shadows, warm torch accents, detailed pixel-art look, fog layers, weathered stone and iron, restrained blood-red accents.
```

Complemento B (Sci-Fi Neon):

```text
cyberpunk industrial corridor, cyan-magenta neon accents, metallic surfaces, steam vents, acid drizzle, clean pixel-art look, holographic UI skin.
```

Complemento C (Cartoon Brutal):

```text
stylized post-collapse scrapyard market, bold outlines, vibrant cartoon palette, exaggerated impact readability, arcade-style UI skin, punchy shapes.
```

## 6) Checklist de comparacao (decisao rapida)

Avaliar cada versao de `1 a 5`:

- Leitura de gameplay em 1 segundo (heroi, inimigo, perigo, objetivo).
- Identidade visual unica (nao parecer generico).
- Custo de producao (tempo de tileset, animacao, VFX).
- Coerencia com tom desejado (tenso vs veloz vs caotico).
- Escalabilidade para 3 biomas + chefe final.

## 7) Recomendacao de pipeline

- Implementar `1 codigo + 3 pacotes de skin`.
- Pastas:
  - `art/theme-dark-fantasy/`
  - `art/theme-scifi-neon/`
  - `art/theme-cartoon-brutal/`
- Arquivos por tema:
  - `tileset_main.png`
  - `hero_skin.png`
  - `enemy_elite_skin.png`
  - `vfx_pack.png`
  - `hud_skin.png`
  - `palette.json`

## 8) Quadro de decisao (notas sugeridas)

Escala: `1=fraco`, `3=medio`, `5=excelente`

### Criterios e pesos
- Leitura de gameplay (peso `30%`)
- Identidade visual unica (peso `20%`)
- Custo de producao inicial (peso `25%`)
- Escalabilidade para 3 biomas + chefe (peso `15%`)
- Coerencia com tom do projeto (peso `10%`)

### Tabela de notas (sugestao)

| Versao | Leitura (30) | Identidade (20) | Custo inicial (25) | Escalabilidade (15) | Coerencia (10) | Nota final /5 |
|---|---:|---:|---:|---:|---:|---:|
| A - Fantasia Sombria | 4.5 | 4.8 | 3.0 | 4.4 | 4.9 | **4.20** |
| B - Sci-Fi Neon | 4.7 | 4.3 | 3.4 | 4.6 | 4.2 | **4.23** |
| C - Cartoon Brutal | 4.4 | 4.1 | 4.6 | 4.2 | 3.8 | **4.27** |

Observacao: a nota final ponderada acima favorece `velocidade de producao` (peso alto em custo inicial). Por isso a Versao C sobe.

### Recomendacao final (duas leituras possiveis)

- Melhor para `comecar rapido e validar gameplay`: **C - Cartoon Brutal**.
- Melhor para `posicionamento de marca e atmosfera premium`: **A - Fantasia Sombria**.

Se o objetivo agora e chegar em uma demo jogavel em menos tempo, inicie por `C` e mantenha a estrutura para depois trocar para `A` sem refatorar codigo.
