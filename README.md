# Yes No Klub

Website for Yes No Klub (YNK), a live music and arts night in Yogyakarta, Indonesia. It holds the events archive (flyers, line-ups, venues, photo galleries), an about page and an image gallery. Live at https://www.yesnoklub.net.

## Stack

- Astro 7 (static output, content collections)
- Tailwind CSS 4 (via `@tailwindcss/vite`)
- astro-icon (Iconify sets: ant-design, bx, ion, tabler)
- Fonts via the Astro Fonts API (BioRhyme, BioRhyme Expanded, Pathway Extreme), downloaded at build and self-hosted
- sharp for image optimisation

## Commands

| Command           | Action                                  |
| :---------------- | :-------------------------------------- |
| `npm install`     | Install dependencies                    |
| `npm run dev`     | Start the dev server (localhost:4321)   |
| `npm run build`   | Build the site to `./dist/`             |
| `npm run preview` | Preview the production build locally    |

Node 22 is required (see `.nvmrc`; `nvm use`).

On Arch or any machine with a system libvips, sharp fails to install against it. Install with:

```
SHARP_IGNORE_GLOBAL_LIBVIPS=1 npm install
```

## Adding an event

1. Put the flyer in `src/content/flyers/`.
2. Create `src/content/events/ynk-NN.md`, modelled on `ynk-50.md`.
3. Fill in the frontmatter. The schema is in `src/content.config.ts`: `id`, `title`, `date`, `time`, `with`, `info`, an optional `flyer` (`src`, `alt`) and `venue` (`name`, `url`).
4. Include the venue `url` for every new event. The schema leaves it optional, but the event pages expect it.
5. Optionally add an `images[]` gallery. Put the photos in `src/content/images/` and list each with `src`, `alt` and a unique `id`.

## Deployment

Hosted on Netlify. Pushes to `main` trigger an automatic build and deploy.
