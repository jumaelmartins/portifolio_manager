import { z } from "zod";

const YOUTUBE_URL =
  /^https?:\/\/(?:(?:www\.|m\.)?youtube\.com\/(?:watch\?v=|shorts\/|embed\/)[A-Za-z0-9_-]{11}|youtu\.be\/[A-Za-z0-9_-]{11})(?:[?&#].*)?$/;

export const projectSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(120),
  description: z
    .string()
    .trim()
    .min(1, "Description is required")
    .max(5000),
  categoryId: z.number().int().positive("Choose a category"),
  technologyIds: z
    .array(z.number().int().positive())
    .max(30)
    .refine((ids) => new Set(ids).size === ids.length, {
      message: "Choose each technology only once",
    }),
  repositoryUrl: z.union([z.url(), z.literal("")]).optional(),
  liveUrl: z.union([z.url(), z.literal("")]).optional(),
  videoUrl: z
    .union([
      z.string().regex(YOUTUBE_URL, "Enter a valid YouTube URL"),
      z.literal(""),
    ])
    .optional(),
  coverImageId: z.number().int().positive().nullable(),
});
