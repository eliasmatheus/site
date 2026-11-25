// Scene 02 · Structures: the footing (s-eng, renderVals and the `ftStep` block).
export const structures = {
  kicker: '02 · STRUCTURES · 2012 TO 2020',
  canvasLabel: 'Interactive 3D model of a church frame, its footings and the soil layers',
  // Panel copy per state. `original` = before the plans change (320 kN).
  states: {
    original: {
      kicker: 'LIVE MODEL · DRAWN IN YOUR BROWSER',
      title: 'One of the churches, in 3D.',
      text: 'Two floors, six columns, six footings sized for the original plan, sitting on the soil the boreholes found. Everything checks out. Keep scrolling.',
      verdict: 'All footings within the soil limit.',
      tag: 'OK',
    },
    fail: {
      kicker: 'QUEST · OPTIONAL · +25 XP',
      title: 'Then the plans changed.',
      text: 'A heavier roof and a full second floor: the central column now brings 480 kN. The footing pushes the soil past its limit. Drag the yellow corners to resize it, pull the arrow to change its depth. Find the cheapest footing that still holds.',
      verdict: 'Failing. The soil will settle and the slab will crack.',
      tag: 'FAILING',
    },
    over: {
      kicker: 'QUEST · OPTIONAL · +25 XP',
      title: 'It holds. Now make it cheaper.',
      text: 'Safe, but not the best deal. Wider costs concrete. Deeper costs digging, and below 2 m the trench needs shoring. The sweet spot is somewhere in between.',
      verdict: 'Safe, but not the best deal yet.',
      tag: 'COSTLY',
    },
    ok: {
      kicker: 'QUEST · OPTIONAL · +25 XP',
      kickerDone: 'QUEST COMPLETE · +25 XP',
      title: 'The sweet spot.',
      text: 'Deep enough to reach the stiff layer, small enough to save concrete. That trade-off was my job, column after column.',
      verdict: 'Safe and close to the cheapest possible.',
      tag: 'SWEET SPOT',
    },
  },
  hud: {
    footing: 'FOOTING',
    soilPressure: 'SOIL PRESSURE',
    cost: 'COST',
    vsCheapest: 'VS CHEAPEST SAFE',
    // e.g. '1.60 × 1.60 m · 1.50 m deep'
    dims: (width: number, depth: number): string =>
      `${width.toFixed(2)} × ${width.toFixed(2)} m · ${depth.toFixed(2)} m deep`,
    // e.g. '188 / 180 kPa'
    pressure: (q: number, allowable: number): string =>
      `${Math.round(q)} / ${Math.round(allowable)} kPa`,
    money: (value: number): string => `$${Math.round(value).toLocaleString('en-US')}`,
    rel: {
      idle: '·',
      unsafe: 'unsafe',
      best: 'BEST ✓',
      above: (pct: number): string => `+${Math.round(pct)}%`,
    },
  },
  // Guided quest, one step at a time.
  steps: {
    widen: 'Step 1 · Drag a yellow corner outward until the footing stops being red.',
    deepen:
      'Step 2 · Safe, but pricey. Pull the yellow arrow down toward the stiff layer, around 2.5 m. Stronger soil lets the footing shrink.',
    shrink:
      'Step 3 · Now drag a corner inward. Stop right before it turns red. The green outline is the target.',
    done: 'Sweet spot. +25 XP',
  },
  showMe: 'SHOW ME THE SWEET SPOT',
  // Controls: sliders are the main way to resize, on every device (and the keyboard path).
  controls: {
    width: 'WIDTH',
    depth: 'DEPTH',
    widthValue: (m: number): string => `${m.toFixed(2)} m`,
    depthValue: (m: number): string => `${m.toFixed(2)} m deep`,
    soilToggle: 'SOIL',
  },
  // The 2D cross-section (and the fallback when WebGL is not available).
  section: {
    label: 'Cross-section of the central footing, its pit and the soil layers',
    load: (kn: number): string => `${kn} kN`,
    widthHandle: 'Footing width. Drag sideways',
    depthHandle: 'Footing depth. Drag up or down',
  },
  soil: {
    title: 'SOIL · REAL BOREHOLE',
    depth: (d: number): string => `${d.toFixed(1)} m`,
    blows: (n: number): string => `N ${Math.round(n)}`,
    strength: (kpa: number): string => `${Math.round(kpa)} kPa`,
  },
} as const;
