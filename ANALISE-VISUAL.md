# HEROI KIOSK — Analise Visual Premium e Roadmap Tecnico
**Data:** 2026-03-05
**Repositorio:** WilsonMPeixoto-2/heroi-kiosk
**Escopo:** avaliacao de qualidade visual, tecnica e potencial premium para demonstracao publica oficial

## 1. Diagnostico Executivo
A base tecnica do projeto e forte (Vite 7, TypeScript, PixiJS 8, GSAP, PWA, input multiplo, hardening de kiosk), mas a camada visual ainda esta abaixo do potencial do stack.

Veredito:
- Infraestrutura: alta maturidade.
- Experiencia percebida pelo jogador: precisa de salto de acabamento.
- Potencial atual explorado: parcial.

## 2. Pontos Criticos de UX e Qualidade Percebida
### 2.1 Renderizacao por substituicao completa de DOM
Uso atual baseado em `innerHTML` para telas inteiras gera risco de flicker, perda de foco e reinicio de animacoes.

Recomendacao:
- Migrar para patch incremental de DOM (morphdom/nanomorph) ou camada reativa leve.
- Priorizar telas de Avatar e Toolkit primeiro.

### 2.2 Avatar com linguagem visual de prototipo
O avatar atual cumpre funcao, mas tem baixo impacto emocional para um produto premium.

Recomendacao:
- Evoluir para SVG mais detalhado (partes separadas e expressao).
- Adicionar animacoes idle (piscar, breathing, micro movimento).
- Usar Lottie para celebracao e estados especiais, ou remover dependencia se nao for usada.

### 2.3 Transicoes repetitivas
A mesma transicao em todas as etapas reduz senso de progressao narrativa.

Recomendacao:
- Criar transicoes tematicas por etapa com GSAP Timeline.
- Avaliar View Transitions API para navegacao visual consistente.

### 2.4 Acessibilidade incompleta
Ja existem bases boas, mas faltam sinais para feedback critico e reducao de movimento.

Recomendacao:
- `aria-live` para feedback de acerto/erro.
- `role="alert"` em notificacoes importantes.
- suporte a `prefers-reduced-motion`.

### 2.5 Pipeline de audio
Howler e estavel para kiosk, mas o pipeline de assets pode ser otimizado.

Recomendacao:
- Migrar WAV para `WebM/Opus` com fallback `MP3`.
- Manter sprites e lazy-loading para reduzir custo de carregamento.

## 3. Claims Tecnicos Revisados (Defensiveis)
### 3.1 WebGPU
WebGPU pode trazer ganhos expressivos em cenarios de particulas, efeitos e pipelines modernos, variando conforme hardware, navegador, driver e implementacao.

Diretriz de engenharia:
- Adotar com fallback automatico para WebGL/WebGL2.
- Medir em hardware alvo real da instalacao antes de afirmar numeros de ganho.

### 3.2 Howler
Howler e maduro e amplamente usado em jogos web.

Diretriz de evolucao:
- foco em formato, carga e compatibilidade (e nao em troca obrigatoria de engine).

## 4. Ranking de Alto ROI (Premium com custo realista)
1. Avatar premium (SVG detalhado + idle animation).
2. Particulas com textura + blend aditivo + container otimizado.
3. Tipografia e direcao de arte futurista consistente.
4. Transicoes tematicas por etapa (nao genericas).
5. Audio comprimido e desenho sonoro de feedback por evento.
6. Acessibilidade de feedback e reducao de movimento.

## 5. Plano de Entrega Premium (faixa realista)
### Sprint A (impacto imediato)
- Upgrade visual do avatar.
- Revisao de transicoes.
- Pipeline de audio otimizado.
- Correcao de acessibilidade de feedback.

### Sprint B (diferencial de palco)
- VFX com particulas tematicas.
- Refino de narrativa visual por etapa.
- Polimento de resultado final para foto/video institucional.

### Sprint C (vanguarda opcional)
- Renderer com preferencia WebGPU + fallback.
- Avatar state-based mais avancado.

## 6. Referencias (fontes primarias / alta confiabilidade)
### PixiJS v8
- Renderers (WebGL/WebGL2/WebGPU): https://pixijs.com/8.x/guides/components/renderers
- autoDetectRenderer: https://pixijs.download/dev/docs/rendering.autoDetectRenderer.html
- WebGPURenderer: https://pixijs.download/dev/docs/rendering.WebGPURenderer.html
- ParticleContainer (API): https://pixijs.download/dev/docs/scene.ParticleContainer.html
- Guia Particle Container (v8): https://pixijs.com/8.x/guides/components/scene-objects/particle-container
- Blog oficial (v8): https://pixijs.com/blog/particlecontainer-v8

### Web Platform (MDN / Chrome Dev)
- View Transition API (MDN): https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API
- Document.startViewTransition (MDN): https://developer.mozilla.org/en-US/docs/Web/API/Document/startViewTransition
- View Transitions (Chrome Dev): https://developer.chrome.com/docs/web-platform/view-transitions
- prefers-reduced-motion (MDN): https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion
- ARIA live regions (MDN): https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Guides/Live_regions
- role="alert" (MDN): https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/alert_role
- Navigator.vibrate (MDN): https://developer.mozilla.org/en-US/docs/Web/API/Navigator/vibrate
- GamepadHapticActuator (MDN): https://developer.mozilla.org/en-US/docs/Web/API/GamepadHapticActuator

### Audio
- Howler.js (repo oficial): https://github.com/goldfire/howler.js/
- Howler.js (site oficial): https://howlerjs.com/

## 7. Fechamento
Com o stack atual, e possivel atingir um nivel premium de apresentacao sem estrutura de empresa bilionaria, desde que o foco saia de apenas funcionalidade e entre em direcao de arte, microinteracao e consistencia audiovisual.

Este documento fixa uma linha tecnica defendivel e pronta para auditoria, com linguagem adequada para patrocinio institucional e demonstracao publica.
