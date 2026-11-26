// Scene 01 · The Call. Pure narrative, no quest: scroll plays the montage and the choice.
// Brands only as style (old consoles, image editor, memory scanner, download queue, a strategy
// game's custom maps, the dialog boxes of each era's games). No names.
export const call = {
  kicker: '01 · THE CALL · LATE 90S TO 2011',
  // Beat 1: the first computer boots. Facts: Pentium, 8 GB disk. The 64 MB of RAM is an
  // estimate for a 1997 to 1999 Pentium; the memory test counts up to it in KB.
  boot: {
    screen: ['CPU: PENTIUM', 'MEMORY TEST: 65536K OK', 'HDD 8 GB ........ OK', 'LOADING...'],
    // The memory line while the test counts up (screen[1] is the final state).
    memoryLine: (kb: number, done: boolean): string => `MEMORY TEST: ${kb}K${done ? ' OK' : ''}`,
    text: 'Dad brought home our first computer. I was hooked on the screen.',
    look: 'handheld',
    when: 'Late 90s',
  },
  // Beat 2: the montage, one vignette per scroll step, each with a "skill unlocked" toast.
  // In the order it happened (docs/cenas/my-computer.md). `look` dresses the dialog box in the
  // style of the games of that time; `when` is the era tab on the box.
  toastLabel: 'SKILL UNLOCKED',
  skillsLabel: 'Skills',
  montage: [
    // Kept implicit on purpose: a file copied into the game folder.
    {
      id: 'gameFolder',
      skill: 'FILE SYSTEMS',
      text: 'One file in the right folder, and the game opened.',
      look: 'handheld',
      when: 'Late 90s',
    },
    {
      id: 'dialup',
      skill: 'DIAL-UP',
      text: 'One hour of dial-up a week. Flash games saved to play offline.',
      look: 'flash',
      when: 'Early 2000s',
    },
    {
      id: 'emulators',
      skill: 'EMULATORS',
      text: 'Old consoles, through emulators.',
      look: 'console',
      when: 'Early 2000s',
    },
    {
      id: 'fixing',
      skill: 'TECH SUPPORT',
      text: 'Formatting, fixing, reinstalling. Mine, then everyone’s.',
      look: 'life',
      when: 'Mid 2000s',
    },
    {
      id: 'downloads',
      skill: 'DOWNLOADS',
      text: 'Downloads queued overnight.',
      look: 'life',
      when: 'Mid 2000s',
    },
    {
      id: 'imageEditor',
      skill: 'IMAGE EDITING',
      text: 'Every tutorial I could find.',
      look: 'glass',
      when: 'Late 2000s',
    },
    {
      id: 'memory',
      skill: 'MEMORY EDITING',
      text: 'Cheat codes? I edited the memory.',
      look: 'glass',
      when: 'Late 2000s',
    },
    {
      id: 'customMaps',
      skill: 'STRATEGY',
      text: 'Custom maps, five against five. Then a beta key landed in my inbox.',
      look: 'realm',
      when: 'Around 2010',
    },
  ],
  // In-world strings shown inside the vignettes.
  vignettes: {
    replaceFile: 'Replace file?',
    replaceYes: 'Yes',
    memoryBefore: '1000',
    memoryAfter: '999999',
    formatting: 'Formatting C:',
    modem: 'CONNECTING · 56K',
    savingGame: 'SAVING GAME.SWF',
    gameFolder: 'GAME',
    memoryLabel: 'MONEY',
    layersTitle: 'LAYERS',
    layers: ['Background', 'Glow', 'Shadow', 'Lens flare', 'Chrome text'],
    downloadsTitle: 'DOWNLOADS · 02:47 AM',
    downloads: ['song.mp3', 'game.zip', 'video.avi', 'driver.exe'],
    lobbyTitle: 'CUSTOM GAMES',
    lobby: [
      { name: '5V5 · ALL PICK', slots: '10/10' },
      { name: 'TOWER DEFENSE', slots: '6/8' },
      { name: 'HERO SIEGE', slots: '7/8' },
      { name: 'SURVIVAL', slots: '3/6' },
    ],
    betaKey: 'NEW MAIL · BETA KEY',
    firstMatch: 'FIRST MATCH · THAT NIGHT',
  },
  // Beat 3: the choice. Skills fly into COMPUTER SCIENCE, the cursor hesitates, then picks CIVIL.
  options: [
    { name: 'CIVIL ENGINEERING', type: 'STURDY TYPE', glyph: '▲' },
    { name: 'COMPUTER SCIENCE', type: 'LOGIC TYPE', glyph: '{ }' },
    { name: 'ARCHITECTURE', type: 'CREATIVE TYPE', glyph: '◆' },
  ],
  picked: 'CIVIL ENGINEERING',
  choiceLabel: 'Choose a course',
  choiceLook: 'arena',
  when: '2011',
  choice: [
    'School was over. Everything pointed to computers.',
    'I wanted math. I wanted engineering. Code and design never crossed my mind.',
  ],
  // Beat 4: the skills go grey and are saved. Paid off in scene 04 (click.saveFile).
  saved: 'Saved for later.',
  // Transition line into Structures.
  outro: 'Even in engineering school, I stayed far from code.',
} as const;
