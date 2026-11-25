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

- [ ] Engine de scroll (`src/engine/`) com testes da timeline (`locate`, progresso, cena ativa).
- [ ] Palco, header (nome, progresso, QUESTS n/3, "Work →"), registro de cenas, lazy load por proximidade.
- [ ] Duas cenas simples para provar o voo: Desert e To be continued.
- [ ] Modo mobile da engine e modo reduced motion.
- [ ] Página `/work` simples e completa (projetos, experiência, contato). Dá para publicar o domínio já aqui.
- [ ] Lighthouse mobile ≥ 90.

## Fase 2 · Abertura

- [ ] Prologue completo, com quest.
- [ ] The Call.

## Fase 3 · Engenharia

- [ ] Structures com a sapata guiada e o layout mobile novo.

## Fase 4 · A virada

- [ ] The Click (com placeholders de vídeo até os clipes existirem).
- [ ] 2020 no Windows (e versão celular no mobile).
- [ ] Tux.

## Depois

Próximos capítulos (primeiro emprego, Interfaces, Method, Worlds, Time, Epilogue), jogo do CS50, pranchas se desenhando, assistente RAG sobre o próprio site.

## Como pedir ao Claude Code

Exemplos de pedido, um por vez:

- "Leia o CLAUDE.md e os docs, e faça a Fase 0."
- "Implemente a cena 02-structures seguindo docs/cenas/02-structures.md. Comece pelo mobile."
- "Compare a cena Prologue com o protótipo de referência e liste o que falta."
