// Horizon: the journey opens at a black hole. A homage in style to the film about the
// wormhole and the farm: no names, ships, score or images from it.
export const horizon = {
  label: 'A black hole with a bright disk of gas, its light bent around the dark center.',
  hint: 'Scroll',
  beats: [
    {
      kicker: 'From the short version · keep scrolling',
      title: 'The long version starts far from here.',
    },
    {
      kicker: 'Elias Matheus · Software engineer',
      title: 'Meet Elias.',
      text: 'Engineer turned software engineer. I like to see how things work, from a footing in the soil to a black hole.',
    },
    { kicker: 'Keep scrolling', title: 'Every story has a point of no return.' },
    { kicker: 'Event horizon', title: 'Past this line, there is only forward.' },
  ],
  hud: {
    distance: 'Distance',
    dilation: 'Time dilation',
    hull: 'Hull integrity',
    alerts: ['Tidal stress rising', 'Hull integrity critical', 'Navigation offline', 'Signal lost'],
  },
  noWebgl: 'This browser cannot draw the black hole. The story goes on below.',
} as const;
