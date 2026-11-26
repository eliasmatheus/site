# Plano em fases

Cada fase termina com deploy funcionando. Uma cena só conta como pronta quando passa no aceite do seu arquivo em `docs/cenas/` no desktop e no mobile.

## Fase 0 · Fundação

- [x] Projeto Astro + React + TypeScript estrito, ESLint, Prettier, Vitest, Playwright (Chromium e WebKit, viewport desktop 1440 x 900 e mobile 390 x 844).
- [x] Scripts `dev`, `build`, `check`, `test`, `test:e2e`.
- [x] CI no GitHub Actions rodando check, testes e build em cada PR.
- [x] Deploy de preview por PR (Cloudflare Pages ou Vercel). Vercel, projeto `eliasmatheus-site` no time `eliasmatheus-projects`, ligado ao repositório (Astro, `npm run build`, `dist/`, Node 22).
- [x] Extrair o copy de `reference/prototype/World.dc.html` para `src/content/` (um arquivo por cena, inglês).
- [x] `src/models/exposure.ts` e `src/models/footing.ts` com testes (ver `docs/modelos.md`).

## Fase 1 · Esqueleto

- [x] Engine de scroll (`src/engine/`) com testes da timeline (`locate`, progresso, cena ativa).
- [x] Palco, header (nome, progresso, QUESTS n/3, "Work →"), registro de cenas, lazy load por proximidade.
- [x] Duas cenas simples para provar o voo: Desert e To be continued.
- [x] Modo mobile da engine e modo reduced motion.
- [x] Página `/work` simples e completa (projetos, experiência, contato). Dá para publicar o domínio já aqui. Feita, com e-mail, LinkedIn e GitHub. O PDF do currículo fica para depois.
- [x] Lighthouse mobile ≥ 90. (Home: 98 performance, 100 acessibilidade, LCP 2,1 s, CLS 0,002.)

## Fase 2 · Abertura

- [x] Prologue completo, com quest.
- [x] The Call.

## Fase 3 · Engenharia

- [x] Structures com a sapata guiada e o layout mobile novo.

## Fase 4 · Nova abertura (decidida em 25/11/2026, ver `docs/visao.md#estrutura`)

Protótipos em `reference/prototype/` (`landing-orbit.html`, `black-hole.html`).

- [x] Landing TL;DR "Orbit" em `/`, com a nebulosa parada no céu, a luz do cursor e a vista deslizando entre as seções (estilo skill tree do Skyrim, paleta de Duna), o conteúdo da `/work` e a porta para a jornada no fim. `/work` passa a redirecionar para ela. A jornada atual foi para `/journey` até o Horizon existir.
- [ ] Horizon: wormhole na chegada, buraco negro em WebGL (shader próprio, sem three.js) no enquadramento Off-axis, lens flare no cursor e queda em primeira pessoa. Fallback sem WebGL. (Planeta no cursor em espera.)
- [x] Protótipo do The fall (`reference/prototype/the-fall.html`).
- [ ] Cena The fall no site. A câmera não pode atravessar vigas (no protótipo atravessa).
- [x] Confirmar a linha do tempo do computador (versões, anos, specs e memórias) em `docs/cenas/my-computer.md`.
- [x] Protótipo do My computer (`reference/prototype/my-computer.html`).
- [x] Fatia vertical do My computer como pseudo-simulador (2000 → XP): `reference/prototype/os-slice-2000-xp.html`.
- [x] Demais versões no mesmo formato: `reference/prototype/os-95-98.html` (primeiro PC → 98) e `reference/prototype/os-xp-8.html` (XP → 8).
- [ ] Protótipos das outras versões (95, 98, Vista, 7, 8) no mesmo formato.
- [ ] Cena My computer no site (substitui a The Call).
- [ ] Prologue (fotografia) sai da abertura e fica guardado até ganhar lugar na linha do tempo.
- [ ] Sapata: nova interação (protótipo C). O arrasto no 3D é impreciso: perto do ângulo errado aumentar e diminuir quase não se diferenciam, e chegar ao sweet spot leva umas três tentativas. Referência de fluxo: grail-app.com (o scroll continua, a interação é opcional).

## Fase 5 · A virada

- [ ] The Click (com placeholders de vídeo até os clipes existirem).
- [ ] 2020 no Windows (e versão celular no mobile).
- [ ] Tux.

## Depois

- **Detours:** desvios opcionais em que o Elias explica fatos aleatórios, de forma interativa (ele é muito curioso e adora explicar). Primeiro candidato: por que a discagem soava daquele jeito, o que era cada frequência e como funcionava a internet discada (o som já é gerado por partes no protótipo, então dá para mostrar cada uma ao vivo).

- Currículo em PDF gerado pelo próprio site (um gerador, ou um PDF regenerado a cada atualização do currículo), linkado na página `/work`.
- Próximos capítulos (primeiro emprego, Interfaces, Method, Worlds, Time, Epilogue), jogo do CS50, pranchas se desenhando, assistente RAG sobre o próprio site.

## Como pedir ao Claude Code

Exemplos de pedido, um por vez:

- "Leia o CLAUDE.md e os docs, e faça a Fase 0."
- "Implemente a cena 02-structures seguindo docs/cenas/02-structures.md. Comece pelo mobile."
- "Compare a cena Prologue com o protótipo de referência e liste o que falta."
