// @ts-check
import { defineConfig } from 'astro/config';
import replace from 'vite-plugin-filter-replace';

import svelte from '@astrojs/svelte';

import tailwind from '@astrojs/tailwind';

// https://astro.build/config
export default defineConfig({
  integrations: [svelte(), tailwind()],
  vite: {
    plugins: [
      replace([{
        // filter: /contracts\/(.*)\/src\/(.*).ts$/,
        filter: /\.(js|ts)$/,
        replace: {
          from: /(@stellar\/stellar-sdk)(?=['"])/g,
          to: '$1/minimal'
        },
      }], {
        enforce: 'pre',
        // apply: 'serve' // or 'build'
      })
    ]
  }
});