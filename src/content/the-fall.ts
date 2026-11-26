// The fall: inside the black hole, the past is a place. A homage in style to the film's
// lattice of time (original beams only: no astronaut, bookshelf, room or anything from it).
export const theFall = {
  label:
    'Inside a vast lattice of long, streaked beams. Through gaps between them, glowing windows show moments from the past.',
  title: 'Here, the past is a place you can visit.',
  kicker: 'Scroll to fall through it',
  glimpse: 'Through a gap',
  // Seen through gaps on the way down, newest first.
  moments: [
    { label: '2020 · print(‘Olá, Mundo!’)' },
    { label: '2019 to 2020 · The desert' },
    { label: '2012 to 2020 · Structures' },
    { label: '2011 · The choice' },
  ],
  first: 'Late 90s · The first computer',
  // Through the last gap the page becomes an old computer with a save file on it.
  retro: {
    loading: 'LOADING...',
    save: 'SAVE FILE · LATE 90S',
    menu: ['CONTINUE', 'NEW GAME'],
    hint: 'Keep scrolling to continue',
  },
  noWebgl: 'This browser cannot draw the lattice. The story goes on below.',
} as const;
