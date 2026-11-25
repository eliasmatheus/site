// Scene 04 · The Click: the first Python (s-click + "py" block: copy, bigTxt, C1W, C1, C2A, C2B).
// The code is shown in Portuguese on purpose: it is what Elias really typed.
export const click = {
  kicker: '04 · THE CLICK · 2020',
  // Callback to scene 01: shown when the first print works, right before the burst.
  // The skills saved in The Call come back in color.
  saveFile: { found: 'SAVE FILE FOUND · 2011', prompt: 'Continue?' },
  // Panel copy per beat. `gloss` is the small translation/aside line ('' = none).
  beats: {
    empty: {
      title: 'The click.',
      text: 'In the middle of the desert I started a free Python course, just to see. Exercise zero: make the computer say hello. Simple, right?',
      gloss: 'PyCharm Community. Dark theme, obviously.',
    },
    type1: {
      title: 'Trying to remember the syntax.',
      text: 'I had seen this somewhere. I was pretty sure it looked like this.',
      gloss: '',
    },
    err: {
      title: 'Run. Error.',
      text: 'Red text on line 1. The computer was not impressed. Back to the code, read the error, try again.',
      gloss: 'Python 3 wants parentheses. I learned that the hard way.',
    },
    fix: {
      title: 'Parentheses. Of course.',
      text: 'Fix it, press play again.',
      gloss: '',
    },
    ok1: {
      title: 'Wait. What?',
      text: 'Two words on a black screen, and the desert was gone. I told a machine what to do, and it did it.',
      gloss: 'Olá, Mundo! is Hello, World! in Portuguese.',
    },
    ex1: {
      title: 'I can make it do that?',
      text: 'If it can say hello, it can ask. If it can ask, it can listen. Next exercise: make it greet you by name. But how do you ask the user something? What is the syntax for input?',
      gloss: '',
    },
    type2: {
      title: 'Reading the docs, typing slowly.',
      text: 'Every line felt like finding a new lever on the machine.',
      gloss: '',
    },
    ask: {
      title: 'It was asking me a question.',
      text: 'The computer was asking ME something. Mind blown. Go on, answer it in the console.',
      gloss: 'Qual o seu nome? = What is your name?',
    },
    answered: {
      title: 'Could I make it do something no one has ever done?',
      text: 'A few lines I wrote just held a conversation with you. That question showed up right here, and it never left.',
      gloss: 'Bem vindo = Welcome. · PIVOT 01 · ENGINEERING → CODE',
    },
  },
  // Giant background text per beat (beats not listed show none).
  big: {
    ok1: 'WAIT. WHAT?',
    ex1: 'I CAN MAKE IT DO THAT?',
    type2: 'WHAT ELSE CAN I MAKE IT DO?',
    ask: 'IT IS ASKING ME?',
    answered: 'SOMETHING NO ONE HAS EVER DONE?',
  },
  // Code the editor types. `\\n` is a literal backslash-n inside the Python string.
  code: {
    wrong: "print 'Olá, Mundo!'",
    fixed: "print('Olá, Mundo!')",
    askName: "nome = input('Qual o seu nome?\\n')",
    greet: "print('Bem vindo, %s!' % nome)",
  },
  console: {
    error: [
      '  File "ex000.py", line 1',
      "    print 'Olá, Mundo!'",
      '          ^',
      "SyntaxError: Missing parentheses in call to 'print'. Did you mean print(...)?",
      ' ',
      'Process finished with exit code 1',
    ],
    ok: ['Olá, Mundo!', ' ', 'Process finished with exit code 0'],
    prompt: 'Qual o seu nome?',
    welcome: (name: string): string => `Bem vindo, ${name}!`,
    exit0: 'Process finished with exit code 0',
    run: (name: string): string => `Run: ${name}`,
    inputLabel: 'Answer the program: type your name and press Enter',
    inputPlaceholder: 'type your name, press Enter',
  },
  ide: {
    sharing: "● You are viewing Elias's screen",
    time: '2020 · LATE NIGHT',
    project: 'pythonProject',
    projectTree: '▾ pythonProject',
    titleBar: (file: string): string => `pythonProject · ${file}`,
    files: { ex0: 'ex000.py', ex1: 'ex001.py' },
    runNames: { ex0: 'ex000', ex1: 'ex001' },
  },
  // Webcam window with Elias's face. Clip labels are placeholders until the videos exist.
  face: {
    name: 'Elias',
    clips: {
      curious: '[CLIP 1 · CURIOUS]',
      focused: '[CLIP 2 · FOCUSED]',
      confused: '[CLIP 3 · SCRATCHING HEAD]',
      smile: '[CLIP 4 · FIRST SMILE]',
      waiting: '[CLIP 5 · LEANING IN]',
      eureka: '[CLIP 6 · EUREKA]',
    },
  },
} as const;
