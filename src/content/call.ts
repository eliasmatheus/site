// Scene 01 · The Call. Pure narrative, no quest: scroll plays the montage and the choice.
// Brands only as style (old consoles, image editor, memory scanner, download queue). No names.
export const call = {
  kicker: '01 · THE CALL · LATE 90S TO 2011',
  // Beat 1: the first computer boots. Only the disk size is a known fact; no RAM figure.
  boot: {
    screen: ['HDD 8 GB ........ OK', 'LOADING...'],
    text: 'Dad brought home our first computer. I was hooked on the screen.',
  },
  // Beat 2: the montage, one vignette per scroll step, each with a "skill unlocked" toast.
  toastLabel: 'SKILL UNLOCKED',
  montage: [
    { id: 'emulators', skill: 'EMULATORS', text: 'Old consoles, through emulators.' },
    {
      id: 'dialup',
      skill: 'DIAL-UP',
      text: 'Dial-up at night. Flash games saved to play offline.',
    },
    // Kept implicit on purpose: a file copied into the game folder.
    {
      id: 'gameFolder',
      skill: 'FILE SYSTEMS',
      text: 'One file in the right folder, and the game opened.',
    },
    { id: 'memory', skill: 'MEMORY EDITING', text: 'Cheat codes? I edited the memory.' },
    { id: 'imageEditor', skill: 'IMAGE EDITING', text: 'Every tutorial I could find.' },
    {
      id: 'fixing',
      skill: 'TECH SUPPORT',
      text: 'Formatting, fixing, reinstalling. Mine, then everyone’s.',
    },
    { id: 'downloads', skill: 'DOWNLOADS', text: 'Downloads queued overnight.' },
  ],
  // In-world strings shown inside the vignettes.
  vignettes: {
    replaceFile: 'Replace file?',
    replaceYes: 'Yes',
    memoryBefore: '1000',
    memoryAfter: '999999',
    formatting: 'Formatting C:',
  },
  // Beat 3: the choice. Skills fly into COMPUTER SCIENCE, the cursor hesitates, then picks CIVIL.
  options: [
    { name: 'CIVIL ENGINEERING', type: 'STURDY TYPE', glyph: '▲' },
    { name: 'COMPUTER SCIENCE', type: 'LOGIC TYPE', glyph: '{ }' },
    { name: 'ARCHITECTURE', type: 'CREATIVE TYPE', glyph: '◆' },
  ],
  picked: 'CIVIL ENGINEERING',
  choice: [
    'School was over. Everything pointed to computers.',
    'I wanted math. I wanted engineering. Code and design never crossed my mind.',
  ],
  // Beat 4: the skills go grey and are saved. Paid off in scene 04 (click.saveFile).
  saved: 'Saved for later.',
  // Transition line into Structures.
  outro: 'Even in engineering school, I stayed far from code.',
} as const;
