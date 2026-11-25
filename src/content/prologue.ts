// Scene 00 · Prologue: the viewfinder and the camera (s-pro + "camera / exposure" block).
type Dial = 'ISO' | 'SHUTTER' | 'APERTURE' | 'FILM';

export const prologue = {
  // Beat 1: looking through the EVF.
  viewfinder: {
    hud: 'EVF · AF-S · X-T3',
    // e.g. 'ISO 400 · 1/250 · F5.6 · CLASSIC CHROME'
    exif: (iso: number, shutter: number, aperture: number, film: string): string =>
      `ISO ${iso} · 1/${shutter} · F${aperture} · ${film}`,
    // Pick by input: `pointer` for mouse, `touch` for `pointer: coarse` (drag sideways, swipe up).
    hint: {
      pointer: '00 · MOVE THE MOUSE TO LOOK AROUND · SCROLL TO MOVE FORWARD',
      touch: '00 · DRAG TO LOOK AROUND · SWIPE UP TO MOVE FORWARD',
    },
    title: 'Meet Elias.',
    intro:
      'Engineer turned software engineer, photographer, reader of history. This is the story, told the way I lived it.',
    // The "In a hurry? See the work" link lives in site.hurry.
  },
  // Beat 2: the camera seen from above.
  camera: {
    body: 'X-T3',
    apertureGroup: 'Aperture ring',
    dialLabels: {
      iso: 'ISO',
      shutter: 'SHUTTER',
      film: 'FILM',
    },
    // Label under a dial, e.g. 'ISO · 400'.
    dialValue: (label: Dial, value: string): string => `${label} · ${value}`,
    dialAria: (label: Dial, value: string): string => `${label} ${value}. Turn up`,
    increase: (label: Dial): string => `Increase ${label.toLowerCase()}`,
    decrease: (label: Dial): string => `Decrease ${label.toLowerCase()}`,
    // Film simulations: short dial tick and full name.
    films: [
      { short: 'STD', name: 'PROVIA' },
      { short: 'V', name: 'VELVIA' },
      { short: 'S', name: 'ASTIA' },
      { short: 'CC', name: 'CLASSIC CHROME' },
      { short: 'NC', name: 'CLASSIC NEG' },
      { short: 'ET', name: 'ETERNA' },
      { short: 'A', name: 'ACROS' },
    ],
    // Names longer than 11 chars shorten 'CLASSIC ' to 'CL. ' under the dial.
    filmShortPrefix: 'CL. ',
  },
  // Beat 3: the sun goes down, the scene loses 3 EV.
  exposure: {
    title: 'Before we go, you may want to adjust the exposure.',
    text: 'Lighting conditions are changing. The sun is going down. Turn the dials on the camera.',
    kicker: {
      good: 'GOLDEN HOUR',
      goodLit: 'GOLDEN HOUR · NICELY EXPOSED',
      over: 'EXPOSURE · TOO MUCH LIGHT',
      under: 'GOLDEN HOUR · THE LIGHT IS DROPPING',
    },
    // evLabel is e.g. '+1.3 EV', '-0.7 EV' or '±0.0 EV'.
    evLabel: (ev: number): string => `${ev > 0 ? '+' : ev < 0 ? '' : '±'}${ev.toFixed(1)} EV`,
    status: {
      perfect: (evLabel: string): string => `PERFECT · ${evLabel}`,
      over: (evLabel: string): string => `OVEREXPOSED · ${evLabel}`,
      under: (evLabel: string): string => `UNDEREXPOSED · ${evLabel}`,
    },
    auto: 'AUTO',
    autoHint: 'Or choose AUTO mode, like real pros.',
    // Beat 4: |EV| <= 0.5 after the sun went down.
    done: "GOOD LIGHT. LET'S GO ↓",
  },
} as const;
