import { defineConfig } from 'astro/config';
import tailwind from "@astrojs/tailwind";
import rehypeExternalLinks from "./rehype-external-links.mjs";

// import alpinejs from "@astrojs/alpinejs";

// https://astro.build/config
export default defineConfig({
  markdown: {
    rehypePlugins: [rehypeExternalLinks]
  },
  integrations: [tailwind({
    applyBaseStyles: false
  })]
});