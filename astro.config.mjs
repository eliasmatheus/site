// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

export default defineConfig({
  site: 'https://eliasmatheus.com.br',
  output: 'static',
  integrations: [react()],
  // The old work page now lives on the landing. Vercel answers with a 308 (vercel.json);
  // this static redirect covers local previews.
  redirects: { '/work': '/' },
});
