// Scene 01 · The Call (s-call + `call` array).
// TODO: confirm with Elias the three real course options in 2011.
export const call = {
  kicker: '01 · THE CALL · 2011',
  groupLabel: 'Choose a path',
  options: [
    { name: 'CIVIL ENGINEERING', type: 'STURDY TYPE', glyph: '▲' },
    { name: 'COMPUTER SCIENCE', type: 'LOGIC TYPE', glyph: '{ }' },
    { name: 'ARCHITECTURE', type: 'CREATIVE TYPE', glyph: '◆' },
  ],
  // Dialog box. '\n' splits the two typed lines.
  dialog: {
    intro:
      'PROFESSOR: So, school is over! Time to pick the path you will walk for years.\nThree of them are on the table. Choose wisely. Or quickly.',
    pickedCivil:
      'You chose CIVIL ENGINEERING!\nThat is exactly what Elias picked. A sturdy start. It would teach him more than he expected.',
    pickedOther: (name: string): string =>
      `You chose ${name}! Bold.\nElias picked CIVIL ENGINEERING. The road to code would take a detour through the desert.`,
  },
} as const;
