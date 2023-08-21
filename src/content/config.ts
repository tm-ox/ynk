import { defineCollection, z } from "astro:content";

export const collections = {

  events: defineCollection({
    schema: ({ image }) =>
      z.object({
        title: z.string(),
        date: z.string(),
        flyer: z.object({
          src: image().refine((img) => img.width >= 300, {
            message: "Cover image must be at least 300 pixels wide!",
          }),
          alt: z.string().optional(),
        }).optional(),
        images: z.array(
          z.object({
            src: image().refine((img) => img.width >= 300, {
              message: "Image must be at least 300 pixels wide!",
            }).optional(),
            alt: z.string().optional(),
            data: z.string().optional(),
          }).optional(),
        ).optional(),
      }),
  }),
};
