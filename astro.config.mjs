import { defineConfig } from 'astro/config';
import tailwindcss from "@tailwindcss/vite";
import rehypeExternalLinks from "./rehype-external-links.mjs";

// https://astro.build/config
export default defineConfig({
  markdown: {
    rehypePlugins: [rehypeExternalLinks]
  },
  vite: {
    plugins: [tailwindcss()]
  }
});