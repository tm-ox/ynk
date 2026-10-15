import { defineConfig } from 'astro/config';
import icon from "astro-icon";
import tailwindcss from "@tailwindcss/vite";
import { unified } from "@astrojs/markdown-remark";
import rehypeExternalLinks from "./rehype-external-links.mjs";

// https://astro.build/config
export default defineConfig({
  integrations: [icon()],
  markdown: {
    processor: unified({
      rehypePlugins: [rehypeExternalLinks]
    })
  },
  vite: {
    plugins: [tailwindcss()]
  }
});