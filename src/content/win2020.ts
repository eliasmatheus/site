// Scene 05 · 2020 on Windows: the A + B challenge (s-win + wcopy, V1, CSS, NAMES blocks).
// Multi-line code is stored as arrays of lines (join with '\n').
// Portuguese strings are in-world on purpose (Elias's real files, chat and calculator).
export const win2020 = {
  taskbar: {
    apps: ['Browser', 'Chat', 'Editor'],
    clockNight: '23:41', // feed and chat
    clockLate: '01:12', // editor steps
  },
  // Side panel copy per step: kicker, title, text, gloss ('' = none).
  steps: {
    feed: {
      kicker: 'FIRST CONTACT · MAY 2020',
      title: 'Scrolling at night.',
      text: 'An ad: a front-end program run like a real job. Sixteen months, evenings, and you only pay once you are hired.',
      gloss: '',
    },
    chat: {
      kicker: 'THE DECISION · MAY 25, 2020',
      title: 'I did not go alone.',
      text: 'Evenings, every day, seven to eleven. Deadlines. Pressure. I was not sure I could keep up, so I asked a friend to join.',
      gloss: 'Bilingual: my messages, then the English.',
    },
    mail: {
      kicker: 'THE ADMISSION TEST',
      title: 'Build a calculator.',
      text: 'A + B. With HTML, CSS and JavaScript. Three things I had never touched.',
      gloss: '',
    },
    htmlType: {
      kicker: 'STEP 1 · HTML',
      title: 'First, HTML.',
      text: 'A file called primeiro.html. Just text, no tags yet.',
      gloss: 'Olá! Esta é a minha primeira página. = Hello! This is my first page.',
    },
    htmlOpen: {
      kicker: 'STEP 1 · HTML',
      title: 'Open with Chrome.',
      text: 'My sentence, in a browser, in Times New Roman. It did nothing. It meant everything.',
      gloss: '',
    },
    htmlTags: {
      kicker: 'STEP 1 · HTML',
      title: 'Then the tags.',
      // One line per sub-step, followed by `textSuffix`.
      texts: ['<h1> made it a title.', '<p> made it a paragraph.', '<strong> made it bold.'],
      textSuffix: ' Save, refresh, and the page changed.',
      gloss: '',
    },
    htmlYours: {
      kicker: 'STEP 1 · HTML',
      title: 'Your turn.',
      text: 'This editor is real. Type any tag and watch the browser change.',
      gloss: 'Try <em>, <u>, <h2>.',
    },
    css: {
      kicker: 'STEP 2 · CSS',
      title: 'Then CSS.',
      // One line per sub-step, matching `code.css`.
      texts: [
        'color made the title blue.',
        'font-family killed Times New Roman.',
        'The paragraph got softer.',
        'Centered, with a background. It looked like a real page.',
      ],
      gloss: '',
    },
    jsQ0: {
      kicker: 'STEP 3 · JAVASCRIPT',
      title: 'Now the actual test.',
      text: 'Feeling braver, I built the page. This is my real first version. Then I clicked Calcular, and nothing happened.',
      gloss: 'The two photos are from that night.',
    },
    jsQ1: {
      kicker: 'STEP 3 · JAVASCRIPT',
      title: 'How does JavaScript read an input?',
      text: 'The number lives in the HTML. The code lives somewhere else. They meet through an id: document.getElementById.',
      gloss: '',
    },
    jsQ2: {
      kicker: 'STEP 3 · JAVASCRIPT',
      title: 'How do I even write a function?',
      text: 'Wrap the code, give it a name, and let the button call it: onclick="Calculadora()".',
      gloss: '',
    },
    jsQ3: {
      kicker: 'STEP 3 · JAVASCRIPT',
      title: 'And the cruelest question of all:',
      text: 'What do I name this variable?',
      gloss: '',
    },
    jsQ4: {
      kicker: 'STEP 3 · JAVASCRIPT',
      title: 'Add them up.',
      text: 'Number(), because an input gives you text, not numbers. Then put the total back on the page.',
      gloss: '',
    },
    jsDone: {
      kicker: 'SUBMITTED · JULY 2020',
      title: 'It worked. Then I kept going.',
      // One line per design extra added.
      texts: [
        'Plain and working.',
        'Then a card...',
        '...a shadow...',
        '...an icon...',
        '...and a reset button. Nobody asked for any of it.',
      ],
      gloss: 'Submitted in July 2020.',
    },
  },
  // Generic social feed ad. Never the real school name.
  feed: {
    window: 'social feed · 23:41',
    account: 'frontend.bootcamp',
    avatar: 'F',
    sponsored: 'Sponsored',
    headline: 'Start your career in front-end.',
    bullets: [
      '· 16 months, intensive, run like a real job',
      '· Pay only once you are hired',
      '· Selection process with coding challenges',
    ],
    actions: '♡  ◯  ➤',
    caption: 'Applications open. Evenings, 7 to 11 p.m.',
  },
  // Chat with the friend. Never the friend's name.
  chat: {
    header: '[a friend] · May 25, 2020',
    messages: [
      {
        from: 'elias',
        pt: 'Tô pensando real em entrar',
        en: 'I am seriously thinking about joining',
      },
      {
        from: 'elias',
        pt: 'Isso que me deixa um pouco pensativo, se eu vou dar conta',
        en: 'That is what makes me wonder if I can handle it',
      },
      {
        from: 'elias',
        pt: 'Mas mano, se tu topar eu faço contigo',
        en: 'But bro, if you are in, I will do it with you',
      },
      { from: 'friend', pt: 'Fechou', en: 'Deal' },
      { from: 'elias', pt: 'Fechou!', en: 'Deal!' },
    ],
  },
  mail: {
    window: 'Inbox · Selection process',
    subject: 'Desafio: Calculadora',
    bodyPt: 'Crie uma calculadora que some dois valores (A + B), usando HTML, CSS e JavaScript.',
    bodyEn: 'Build a calculator that adds two values (A + B), using HTML, CSS and JavaScript.',
    techs: ['HTML ✗', 'CSS ✗', 'JavaScript ✗'],
  },
  editor: {
    title: (file: string): string => `C:\\Users\\Usuário\\Desktop\\curso\\${file} - Sublime Text`,
    folders: 'FOLDERS',
    // Real files from the course folder.
    files: [
      'estrutura-html5.html',
      'link-img.html',
      'listas.html',
      'pagina1.html',
      'primeiro.html',
      'seo-titulos.html',
      'desafio-calculadora.html',
    ],
    htmlFile: 'primeiro.html',
    jsFile: 'desafio-calculadora.html',
    yoursLabel: 'Edit the HTML yourself',
  },
  browser: {
    address: (file: string): string => `ⓘ Arquivo  |  C:/Users/Usuário/Desktop/curso/${file}`,
    tabs: {
      html: 'primeiro.html',
      calcV1: 'Calculadora Simples',
      calcFinal: 'Desafio - Calculadora',
    },
    status: {
      html: 'file saved · refreshed',
      tryV1: 'Try it: press Calcular.',
      tryFinal: 'Try it: type two numbers and press Somar.',
      v1Clicked: 'Nothing happens. The function is empty: // body...',
    },
  },
  code: {
    // Typed letter by letter into primeiro.html.
    text: 'Olá! Esta é a minha primeira página.',
    // Then the tags, one per sub-step.
    tags: [
      ['<h1>Olá!</h1> Esta é a minha primeira página.'],
      ['<h1>Olá!</h1>', '<p>Esta é a minha primeira página.</p>'],
      ['<h1>Olá!</h1>', '<p>Esta é a minha <strong>primeira</strong> página.</p>'],
    ],
    // Extra line appended to tags[2] when the visitor gets the editor.
    yoursHint: '<p>Try <em>em</em>, <u>u</u> or <h2>h2</h2></p>',
    // The <style> block growing, one per CSS sub-step (prepended to tags[2]).
    css: [
      ['<style>', '  h1 { color: #1a73e8; }', '</style>'],
      [
        '<style>',
        '  h1 { color: #1a73e8; }',
        '  body { font-family: Arial, sans-serif; }',
        '</style>',
      ],
      [
        '<style>',
        '  h1 { color: #1a73e8; }',
        '  body { font-family: Arial, sans-serif; }',
        '  p { color: #555555; }',
        '</style>',
      ],
      [
        '<style>',
        '  h1 { color: #1a73e8; text-align: center; }',
        '  body { font-family: Arial, sans-serif; background: #f4f7fb; }',
        '  p { color: #555555; text-align: center; }',
        '</style>',
      ],
    ],
    // The real first version of the calculator (V1), empty function and all.
    v1: [
      '<!doctype html>',
      '',
      '<html>',
      '  <head>',
      '    <title>Calculadora Simples</title>',
      '    <meta charset="utf-8" />',
      '    <script type="text/javascript">',
      '      function Calculadora() {',
      '        // body...',
      '      }',
      '    </script>',
      '  </head>',
      '',
      '  <body>',
      '    <h1>Calculadora Simples</h1>',
      '    <h2>A + B = C</h2>',
      '    <p>A = <input type="text" name="A"></p>',
      '    <p>B = <input type="text" name="B"></p>',
      '    <p>C = </p>',
      '    <p><input type="submit" name="Calcular" value="Calcular"></p>',
      '  <body>',
      '</html>',
    ],
    // JS built up question by question. Inside the function (from q2 on) lines get 2 spaces.
    js: {
      fnOpen: 'function Calculadora() {',
      readN1: (name: string): string => `var ${name}=document.getElementById("n1").value`,
      readN2: 'var n2=document.getElementById("n2").value',
      total: 'total = Number(n1) + Number(n2)',
      output: 'document.getElementById("resultado").value = total;',
      fnClose: '}',
    },
    // Variable names tried, struck out until the last one gets the check mark.
    names: ['x', 'a', 'numero', 'primeiroValor', 'valorDoPrimeiroInput', 'n1'],
    nameHidden: '?',
    nameCheck: ' ✓',
  },
  calculator: {
    v1: {
      title: 'Calculadora Simples',
      subtitle: 'A + B = C',
      a: 'A = ',
      b: 'B = ',
      c: 'C = ',
      button: 'Calcular',
    },
    final: {
      iconAlt: 'Calculator icon',
      title: 'Calculadora Básica',
      // <strong> around `introStrong`.
      introBefore: 'Use a calculadora abaixo para ',
      introStrong: 'somar',
      introAfter: ' dois valores.',
      first: 'Primeiro valor: ',
      second: 'Segundo valor: ',
      result: 'Resultado: ',
      add: 'Somar',
      reset: 'Zerar',
    },
  },
  photos: {
    desk: {
      alt: 'Photo of my desk in 2020 with the code editor and the browser side by side',
      caption: 'the real desk, 2020',
    },
    calcV1: {
      alt: 'Photo of the first version of the calculator open in Chrome, 2020',
      caption: 'the real first version',
    },
  },
} as const;
