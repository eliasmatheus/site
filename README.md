# eliasmatheus.com.br

Personal site of Elias Matheus. A scroll journey from civil engineering to frontend, full stack and AI engineering, told through small interactive scenes: a camera you expose by hand, a footing you size against real soil data, the first lines of HTML written in 2020.

Work in progress. The prototype lives in `reference/`; the build plan is in `docs/plano.md`.

## Stack

Astro (static), React islands, strict TypeScript, three.js loaded on demand. Vitest for pure logic, Playwright (Chromium and WebKit, 1440 x 900 and 390 x 844) for flows.

## Scripts

| Command            | What it does                                     |
| ------------------ | ------------------------------------------------ |
| `npm run dev`      | Dev server at http://localhost:4321              |
| `npm run build`    | Static build into `dist/`                        |
| `npm run check`    | `astro check` (types), ESLint and Prettier check |
| `npm test`         | Unit tests (Vitest)                              |
| `npm run test:e2e` | Builds, serves and runs Playwright               |
| `npm run format`   | Formats everything with Prettier                 |

Node 22.12 or newer (see `.nvmrc`). First e2e run: `npx playwright install chromium webkit`.
