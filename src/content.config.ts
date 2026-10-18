import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

// Define a basic schema for content you don't need strict validation on
const basicSchema = z.object({
  title: z.string().optional(),
});

export const collections = {
  events: defineCollection({
    loader: glob({ pattern: "**/*.md", base: "./src/content/events" }),
    // Type the schema function's argument to resolve TS 7031
    schema: ({ image }) =>
      z.object({
        id: z.string(),
        title: z.string(),
        date: z.string(),
        time: z.string(),
        venue: z
          .object({
            name: z.string().optional(),
            url: z.string().optional(),
          })
          .optional(),
        with: z.string(),
        info: z.string(),
        // Who photographed the event's documentation, where known.
        photographer: z.string().optional(),
        // The event's artists, in the order they played, each linked once;
        // a picture names its artist by `name` (images[].artist). Recorded
        // for crediting later; nothing shows them yet.
        artists: z
          .array(z.object({ name: z.string(), url: z.string().optional() }))
          .optional(),
        flyer: z
          .object({
            src: image(),
            alt: z.string().optional(),
          })
          .optional(),
        images: z
          .array(
            z
              .object({
                // Note: The context object must be used here too
                src: image().optional(),
                alt: z.string().optional(),
                id: z.string().optional(),
                data: z.string().optional(),
                // The act in the picture (an artists[].name); none for the
                // crowd and atmosphere.
                artist: z.string().optional(),
              })
              .optional(),
          )
          .optional(),
      }),
  }),

  // Added to clear deprecation warning
  about: defineCollection({
    loader: glob({ pattern: "**/*.md", base: "./src/content/about" }),
    schema: basicSchema,
  }),
};
