// The work record shown on the landing (/): fast and scannable, no journey. Positioning, three projects, experience,
// contact. Experience and projects come from the v1 prototype (Journey.dc.html).

export interface Project {
  tag: string;
  title: string;
  description: string;
  /** null while the project is being built: the page shows a status instead of numbers. */
  metrics: string | null;
  status: string;
}

export interface Job {
  year: string;
  org: string;
  note: string;
}

export interface ContactLink {
  label: string;
  /** null until Elias provides it; the page hides links without an href. */
  href: string | null;
}

export const work = {
  title: 'Work',
  back: '← The journey',
  positioning: {
    kicker: 'ELIAS MATHEUS · SOFTWARE ENGINEER',
    headline: 'From load-bearing structures to load-bearing software.',
    text: 'Civil engineer turned software engineer. I am looking for ambitious teams, new problems and work that reaches a lot of people.',
  },
  projects: {
    title: 'Selected projects',
    items: [
      {
        tag: '01 · CASE STUDY · RAG',
        title: 'Ask Elias',
        description:
          'A RAG assistant over my writing and résumé, with cited sources and public evals. It is also this site.',
        metrics: null,
        status: 'In progress',
      },
      {
        tag: '02 · CASE STUDY · AGENTS',
        title: 'Reconciliation agent',
        description:
          'Matches payments against statements, flags mismatches and asks a human before acting.',
        metrics: null,
        status: 'In progress',
      },
      {
        tag: '03 · OPEN SOURCE · MCP',
        title: 'Open Finance MCP',
        description:
          'An open-source MCP server for Brazilian public financial data, published on npm.',
        metrics: null,
        status: 'In progress',
      },
    ] satisfies Project[],
  },
  experience: {
    title: 'Experience',
    items: [
      {
        year: '2026',
        org: 'Dental Intelligence',
        note: 'Software Engineer II on the payments team. Angular, NgRx Signal Store, Laravel.',
      },
      {
        year: '2024',
        org: 'FullStack Labs',
        note: 'Allocated at Dental Intelligence. Shipped a contract-driven payment platform integration on schedule.',
      },
      {
        year: '2024',
        org: 'Ewally',
        note: 'Internet banking from inception with Next.js 14 and TanStack Query.',
      },
      {
        year: '2022',
        org: 'Rainforest',
        note: 'Revived a legacy Angular codebase, led the UI overhaul and i18n in three languages.',
      },
      {
        year: '2021',
        org: 'Agility Networks',
        note: 'Led the UI and performance overhaul of the flagship platform. Promoted in under a year.',
      },
      {
        year: '2020',
        org: 'Cocreare',
        note: 'Sole frontend developer on a new agritech platform built from scratch.',
      },
    ] satisfies Job[],
  },
  contact: {
    title: 'Contact',
    text: 'Building something new? I would like to hear about it.',
    links: {
      email: { label: 'Email', href: 'mailto:eliasmatheus@hotmail.com' },
      linkedin: { label: 'LinkedIn', href: 'https://www.linkedin.com/in/eliasmatheus/' },
      github: { label: 'GitHub', href: 'https://github.com/eliasmatheus' },
      // Hidden for now: the résumé PDF will be generated from the site later (docs/plano.md).
      resume: { label: 'Résumé (PDF)', href: null },
    } satisfies Record<string, ContactLink>,
  },
} as const;
