# Arquitetura

## Stack

- **Astro** (saída estática) com **ilhas React** e **TypeScript** estrito.
- **three.js** via npm, importado dinamicamente só pela cena que usa (hoje só a sapata).
- CSS puro com custom properties; nada de framework de CSS pesado. CSS Modules ou `<style>` do Astro.
- Testes: Vitest para lógica pura (modelos, timeline), Playwright para fluxos e screenshots em desktop e mobile.
- Deploy estático (Cloudflare Pages ou Vercel). Domínio eliasmatheus.com.br. O texto que hoje está no domínio vai para uma subpágina.

Rotas: `/` (jornada), `/work` (projetos, sem jornada), `/work/<projeto>` depois.

## Engine de scroll

O protótipo (`World.dc.html`, função `frame()` e `locate()`) já resolve o modelo. Reescrever como módulo TypeScript independente de framework:

- Scroll nativo do documento, sem scroll-jacking e sem biblioteca de smooth scroll. Altura do documento = soma das durações + 100vh.
- Palco `position: sticky` em tela cheia, com `perspective`. Cada cena é uma camada absoluta posicionada no espaço (x, y, z).
- Linha do tempo: cada cena tem `dwell` (px de scroll em que a câmera fica parada nela) e entre cenas há `travel` (voo). No protótipo: TRAVEL = 1000 px, distância em z entre cenas = 3000.
- Um único loop `requestAnimationFrame` lê `scrollY`, calcula T, e escreve só CSS custom properties e transforms: `--p` (progresso 0 a 1 dentro da cena), `--r` (aproximação), transform, opacidade, visibility.
- A cena ativa fica com `transform: none` e `pointer-events: auto` (no protótipo, transforms 3D no pai quebravam os cliques; não repita). Cenas distantes ficam `visibility: hidden`.
- Cenas se inscrevem na engine com `{ id, dwell, position, onEnter, onLeave, onProgress }`. O React de cada cena só re-renderiza em mudanças de passo (beat), nunca a cada frame.
- `onEnter` antecipado (uma cena antes) é o gatilho do lazy load de assets e código pesado.
- Hash/âncora por cena (`/#structures`) e header com progresso.

## Mobile

Não é a versão desktop encolhida. A narrativa é a mesma; a encenação muda. Breakpoint principal: largura < 768 px ou `pointer: coarse`.

- **Voo**: em vez de viagem 3D longa, transições curtas de profundidade (scale + blur + fade) entre cenas empilhadas. Menos camadas no DOM ao mesmo tempo.
- **Layout**: texto da cena no topo, área interativa no meio, controles numa bottom sheet. Nada de painel por cima de painel (ver `reference/screens/2026-11-24-mobile-footing.png`: o perfil do solo cobre o HUD e o texto disputa com o 3D).
- **Toque**: alvos de no mínimo 44 px. Gestos de arrastar não podem brigar com o scroll: área interativa com `touch-action: none` só enquanto o usuário segura um controle; fora disso o scroll passa.
- **Alternativas de controle**: onde no desktop se arrasta no 3D, no mobile pode haver sliders na bottom sheet que fazem o mesmo.
- **Texto**: corpo mínimo de 16 px; títulos com `clamp()`.
- **Vídeo e WebGL**: pixel ratio limitado a 2, sombras desligadas, pausar render fora da cena.
- Testar sempre em iPhone Safari real (ou ao menos WebKit no Playwright) e um Android médio.

## Performance

- LCP < 2,5 s, INP < 200 ms, CLS < 0,1 no mobile. Lighthouse mobile ≥ 90 em performance.
- JS inicial da home < 100 KB gzip. three.js e cenas pesadas por import dinâmico.
- Imagens AVIF com fallback WebP, `srcset`, dimensões fixas. Fontes com `font-display: swap` e subset.
- Canvas e animações param quando a cena não está visível.

## Acessibilidade

- `prefers-reduced-motion`: sem voo, sem partículas, cenas viram seções com fade simples; quests continuam usáveis.
- Controles acessíveis por teclado (dials com setas, handles com sliders equivalentes).
- Texto alternativo nas fotos; o canvas tem descrição textual equivalente.
- Contraste AA no texto, inclusive sobre o panorama.

## Estado

- Estado de quests (XP) e preferências da câmera em `localStorage` com try/catch.
- Nada de backend nas primeiras fases.

## Organização sugerida

```
src/
  engine/        timeline, loop, registro de cenas (TS puro, testado)
  scenes/
    prologue/    componente, estilos, lógica de exposição
    call/
    structures/  three.js isolado aqui
    desert/
    click/
    win2020/
    tux/
  models/        footing.ts, exposure.ts (puros, com testes)
  content/       textos em inglês por cena (fonte única do copy)
  components/    header, bottom sheet, botões, polaroid
  pages/         index.astro, work.astro
public/assets/   imagens
```
