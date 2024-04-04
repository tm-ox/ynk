import { defineConfig } from 'astro/config';
import tailwind from "@astrojs/tailwind";
import partytown from '@astrojs/partytown'

import alpinejs from "@astrojs/alpinejs";

// https://astro.build/config
export default defineConfig({
  integrations: [tailwind({
    applyBaseStyles: false
  }), partytown({
    config: {
      forward: ["dataLayer.push"],
    },
  }),]
});