// The landing (/): the short version for people in a hurry, and the door to the journey.
// Experience, projects and contact links come from work.ts.

export const landing = {
  title: 'Elias Matheus · Software engineer',
  description:
    'Elias Matheus, software engineer in Brazil. Civil engineer turned software engineer: payments, internet banking and agritech, now across the stack.',
  eyebrow: 'Software engineer · Brazil',
  nav: [
    { id: 'about', label: 'About' },
    { id: 'experience', label: 'Experience' },
    { id: 'projects', label: 'Projects' },
  ],
  about: {
    title: 'About',
    // Draft from the prototype, trimmed to facts already on the site. Elias reviews it before launch.
    paragraphs: [
      'Before software, I designed structures. Footings, beams, columns, a few churches, all sized against real soil data from boreholes.',
      'In 2020 I wrote my first lines of code and could not stop. Since then I have built payment platforms, internet banking and agritech products. Mostly on the frontend, now across the stack.',
      'The method did not change. Care with the details, safety first, and a plan the next person can understand.',
    ],
  },
  door: {
    title: 'That was the short version',
    text: 'The long one starts on a launch pad in Brazil.',
    cta: 'Begin the journey →',
    // The journey opens on the first frame, on Earth (src/scenes/start), then flies to Saturn.
    // Scrolling on past the door gets there too, no click needed.
    href: '/journey',
  },
} as const;
