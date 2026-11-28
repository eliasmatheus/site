// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

export default defineConfig({
  site: 'https://eliasmatheus.com.br',
  output: 'static',
  integrations: [react()],
  // The old work page now lives on the landing. Vercel answers with a 308 (vercel.json);
  // this static redirect covers local previews.
  // The first frame was its own page (/start) before it opened the journey.
  redirects: { '/work': '/', '/start': '/journey' },
  // Content Security Policy as a <meta> on every page: Astro hashes the scripts it emits, so
  // only those run. Everything else comes from the site itself; three.js decodes textures and
  // models through blob: URLs. frame-ancestors cannot live in a <meta>: it is a header
  // (vercel.json), with the other security headers.
  // No Markdown here; Shiki's inline styles would also clash with the CSP.
  markdown: { syntaxHighlight: false },
  security: {
    csp: {
      directives: [
        "default-src 'self'",
        "img-src 'self' data: blob:",
        "connect-src 'self' data: blob:",
        "worker-src 'self' blob:",
        "font-src 'self' data:",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ],
      // Inline style attributes (custom properties on the stage) stay allowed.
      styleDirective: { resources: ["'self'", "'unsafe-inline'"] },
    },
  },
});
