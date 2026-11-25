# Modelos (lógica pura)

Implementar em `src/models/` com testes. Valores tirados do protótipo.

## Exposição (Prologue)

```ts
const ISO = [160, 200, 400, 800, 1600, 3200, 6400, 12800];
const SHUTTER = [4000, 2000, 1000, 500, 250, 125, 60, 30, 15, 8]; // 1/x s
const APERTURE = [1.4, 2, 2.8, 4, 5.6, 8, 11, 16];
const FILMS = [
  { s: 'STD', name: 'PROVIA', filter: 'saturate(1.05)' },
  { s: 'V', name: 'VELVIA', filter: 'saturate(1.6) contrast(1.12)' },
  { s: 'S', name: 'ASTIA', filter: 'saturate(.95) contrast(.92) brightness(1.03)' },
  { s: 'CC', name: 'CLASSIC CHROME', filter: 'saturate(.7) contrast(1.1) sepia(.12)' },
  { s: 'NC', name: 'CLASSIC NEG', filter: 'saturate(.8) contrast(1.15) sepia(.1) hue-rotate(-8deg)' },
  { s: 'ET', name: 'ETERNA', filter: 'saturate(.72) contrast(.85) brightness(1.04)' },
  { s: 'A', name: 'ACROS', filter: 'grayscale(1) contrast(1.2)' },
];

// sceneEv = 0 com luz boa; -3 depois que o sol baixa (fase 2 do prólogo)
ev = log2(iso / 400) + log2(250 / shutter) - 2 * log2(aperture / 5.6) + sceneEv;
brightness = clamp(2 ** (ev * 0.25), 0.35, 2.2);
contrast = ev > 0 ? 1 - min(ev, 5) * 0.06 : 1 + min(-ev, 5) * 0.05;
wash = ev > 0 ? min(0.6, ev * 0.17) /* cor #f6f1e7 */ : min(0.75, -ev * 0.22) /* cor #160a02 */;
noise = [0, .02, .04, .07, .1, .14, .2, .28][isoIndex];
good = abs(ev) <= 0.5; // quest concluída quando good e o sol já baixou
```

AUTO: ISO 1600, 1/125, f/5.6 (dá ev = 0 com sceneEv = -3). Estado inicial: ISO 400, 1/250, f/5.6, CLASSIC CHROME, que fica correto na luz boa e 3 EV escuro quando o sol baixa.

Correlação, não causalidade: ISO aumenta o grão, abertura desfoca o fundo, shutter só afeta a exposição. Isso é intencional (mais fácil de ilustrar).

## Sapata (Structures)

Sondagem SPT real (SP1), pontos (profundidade m, N golpes): `[[0,4],[1,6],[2,9],[3,21],[4,23]]`, interpolação linear, N = 23 abaixo de 4 m.

```ts
sigmaAdm(d) = min(400, 20 * N(d));            // kPa
q = P / (B * B);                              // kPa, sapata quadrada B x B
concrete = 0.5 * B * B * 246;                 // $ (altura 0,5 m)
excavation = (B + 0.6) ** 2 * D * 25;         // $
shoring = D > 2 ? (B + 0.6) ** 2 * (D - 2) * 60 : 0;
cost = concrete + excavation + shoring;

status = q > sigmaAdm(D) ? 'fail'
       : P >= 480 && cost > optimum * 1.06 ? 'over'   // seguro mas caro
       : 'ok';
```

- Fase 1 da cena: P = 320 kN, sapata de projeto original, tudo passa.
- Fase 2: P = 480 kN (cobertura mais pesada e segundo pavimento). Estado inicial B = 1,6 m, D = 1,5 m, falha.
- Ótimo (busca em grade B 0,8 a 3,2 e D 0,6 a 3,5 com passo 0,02): B ≈ 1,16 m, D ≈ 2,74 m, custo ≈ $514. "Sweet spot" = até 6% acima do ótimo.
- Faixas de controle: B 0,8 a 3,2 m; D 0,6 a 3,5 m.

Teste obrigatório: o ótimo calculado bate com esses números, e os três estados aparecem nos pontos certos.
