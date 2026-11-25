// Scene 06 · Tux: Ubuntu and the NLW, August 2020 (s-ubu).
// Comments in the code are Elias's real Portuguese comments. Data in the result is generic.
export const tux = {
  grub: {
    header: 'GNU GRUB  version 2.04',
    entries: ['*Ubuntu', 'Advanced options for Ubuntu', 'Windows Boot Manager (on /dev/sda1)'],
    countdown: (seconds: number): string =>
      `The highlighted entry will be executed automatically in ${seconds}s.`,
  },
  topBar: {
    activities: 'Activities',
    clock: 'ago 10  22:04',
    power: '⏻',
  },
  kicker: '06 · TUX · AUGUST 2020',
  beats: {
    code: {
      title: 'So excited I installed Ubuntu.',
      text: 'Dual boot, GRUB menu, a terminal that felt like a cockpit. First time on Linux, mid-bootcamp, because I could not get enough.',
    },
    ok: {
      title: 'It worked on Linux too.',
      text: 'Next Level Week, August 2020: my first Node.js back end, my first SQL JOIN. Same loop as always: run, read the error, fix, run again.',
    },
  },
  editor: {
    title: 'test.js - nlw - Visual Studio Code',
    firstLineNumber: 37,
    // Line 8 (index) is the buggy one; swap `selectBug` for `selectFixed`.
    lines: [
      '// Consultar os dados inseridos',
      '',
      '// todos os proffys',
      'const selectedProffys = await db.all("SELECT * FROM proffys")',
      '',
      '// Consultar as classes de um determinado professor',
      '// e trazer junto os dados do professor',
      'const selectClassesAndProffys = await db.all(`',
      '    SELECT classes.*, proffys.*',
      '    FROM proffys',
      '    JOIN classes ON (classes.proffy_id = proffys.id)',
      '    WHERE classes.proffy_id = 1;',
      '`)',
      'console.log(selectClassesAndProffys)',
    ],
    bugLine: 8,
    selectBug: '    SELECT classes.* proffys.*',
    selectFixed: '    SELECT classes.*, proffys.*',
  },
  terminal: {
    label: 'TERMINAL',
    run: '❯ node src/database/test.js',
    error:
      '(node:59195) UnhandledPromiseRejectionWarning: Error: SQLITE_ERROR: near ".": syntax error',
    fixNote: '❯ (a missing comma. of course.)',
    result: [
      '[',
      "  { id: 1, subject: 'Química', cost: '20', proffy_id: 1, name: 'Ana', bio: 'Loves explaining chemistry...' }",
      ']',
    ],
    prompt: 'elias in nlw on master ❯ _',
  },
} as const;
