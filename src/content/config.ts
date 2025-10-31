import { defineCollection, z } from "astro:content";

// Define a basic schema for content you don't need strict validation on
const basicSchema = z.object({
  title: z.string().optional(),
});

export const collections = {
  events: defineCollection({
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
              })
              .optional(),
          )
          .optional(),
      }),
  }),

  // Added to clear deprecation warning
  about: defineCollection({
    type: "content",
    schema: basicSchema,
  }),
};
