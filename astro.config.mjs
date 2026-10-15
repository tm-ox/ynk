import { defineConfig, fontProviders } from 'astro/config';
import icon from "astro-icon";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { unified } from "@astrojs/markdown-remark";
import rehypeExternalLinks from "./rehype-external-links.mjs";

// https://astro.build/config
export default defineConfig({
  site: "https://www.yesnoklub.net",
  fonts: [
    {
      provider: fontProviders.google(),
      name: "BioRhyme Expanded",
      cssVariable: "--font-biorhyme-expanded",
      weights: [300, 400, 700, 800],
      styles: ["normal"],
      subsets: ["latin", "latin-ext"],
      fallbacks: ["serif"]
    },
    {
      provider: fontProviders.google(),
      name: "BioRhyme",
      cssVariable: "--font-biorhyme",
      weights: [300, 400, 700, 800],
      styles: ["normal"],
      subsets: ["latin", "latin-ext"],
      fallbacks: ["serif"]
    },
    {
      provider: fontProviders.google(),
      name: "Pathway Extreme",
      cssVariable: "--font-pathway-extreme",
      weights: [300, 400, 600, 700],
      styles: ["normal"],
      subsets: ["latin", "latin-ext"],
      fallbacks: ["sans-serif"]
    }
  ],
  integrations: [icon(), sitemap()],
  markdown: {
    processor: unified({
      rehypePlugins: [rehypeExternalLinks]
    })
  },
  vite: {
    plugins: [tailwindcss()]
  }
});