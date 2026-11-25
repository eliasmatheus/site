# 00 · Prologue: o visor e a câmera

Copy e lógica: `reference/prototype/World.dc.html`, cena `s-pro` e bloco "camera / exposure" da classe. Modelo em `docs/modelos.md#exposição`.

## Intenção

Primeira impressão: o visitante está olhando pelo visor da X-T3 dele, num deserto ao entardecer. Já mostra a fotografia, o cuidado com detalhe e o tom do site. Exposição perfeita na chegada.

## Beats

1. **Visor (EVF)**: panorama 360 de dunas (`public/assets/prologue/dunes-360.webp`) que gira com o mouse (desktop) ou com arrasto e giroscópio opcional (mobile, pedir permissão só com toque). Infos do EVF por cima (ISO, shutter, abertura, filme, EV). Título "Meet Elias." e link "In a hurry? See the work".
2. **Tirar o olho do visor** (scroll): a câmera aparece vista de cima, com os dials físicos (ISO, shutter, simulação de filme, anel de abertura) e a tela basculada embaixo mostrando a imagem.
3. **O sol baixa**: a cena perde 3 EV. Texto: "Before we go, you may want to adjust the exposure. Lighting conditions are changing." e "Or choose AUTO mode, like real pros."
4. Exposição correta (|EV| ≤ 0,5): "GOOD LIGHT. LET'S GO ↓", quest +1.

## Regras

- Só a imagem (visor e tela) recebe exposição, filme e grão. Corpo da câmera, dials e fotômetro nunca são afetados (o site nunca fica num estado irreparável).
- Quem não mexer segue rolando normalmente; nada bloqueia.
- Dials: arrastar/girar, clicar nas setas ‹ ›, teclado (setas), roda do mouse com foco.

## Mobile

- Visor em tela cheia; arrasto horizontal gira o panorama sem brigar com o scroll vertical (detectar direção do gesto).
- Câmera vista de cima ocupando a largura; dials como fileira de controles grandes com ‹ › e arrasto horizontal; tela basculada acima dos dials.
- AUTO como botão grande na base.

## Aceite

- [x] LCP do panorama < 2,5 s no mobile (placeholder borrado inline enquanto carrega). Lighthouse mobile em 25/11/2026: LCP 2,3 s, performance 97, acessibilidade 100.
- [x] Exposição calcula igual ao modelo (testes) e o AUTO resolve a quest.
- [x] Câmera e fotômetro com contraste perfeito em qualquer EV.
- [x] Reduced motion: sem rotação automática do panorama.

## Como ficou (Fase 2)

- `src/scenes/prologue/`: `Prologue.astro` (markup estático no estado de chegada), `camera.ts` (dials, fases e fotômetro, puro e testado) e `controller.ts` (olhar em volta, dials, exposição).
- Ao tirar o olho do visor, a imagem não encolhe: ela é recortada (`clip-path`) até a tela da câmera, medida a partir de `.slot`. Funciona igual no desktop e no mobile.
- Dials: setas ‹ ›, teclado (setas) com foco, roda do mouse só com foco, arrasto horizontal (`touch-action: pan-y`, então o arrasto vertical continua rolando a página) e clique no dial (+1).
- Ficou para depois: giroscópio no mobile (opcional no beat 1).
