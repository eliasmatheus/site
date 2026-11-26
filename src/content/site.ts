// Global UI copy: header, page title and the shortcut links shared by every scene.
export const site = {
  title: 'Meet Elias: the journey',
  header: {
    name: 'Elias Matheus',
    work: 'Work →',
    quests: (done: number, total: number): string => `QUESTS ${done}/${total}`,
  },
  hurry: 'In a hurry? See the work',
} as const;
