import { z } from "zod";

import { slugify } from "@/lib/slugify";

export const createFacultySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters.")
    .max(120, "Name must be at most 120 characters."),
  slug: z
    .string()
    .trim()
    .min(2, "Slug must be at least 2 characters.")
    .max(120, "Slug must be at most 120 characters.")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug may only contain lowercase letters, numbers, and hyphens.",
    )
    .transform((value) => slugify(value)),
});

export const updateFacultySchema = createFacultySchema.extend({
  id: z.string().min(1, "Faculty id is required."),
});

export const deleteFacultySchema = z.object({
  id: z.string().min(1, "Faculty id is required."),
});

export type CreateFacultyInput = z.infer<typeof createFacultySchema>;
export type UpdateFacultyInput = z.infer<typeof updateFacultySchema>;
export type DeleteFacultyInput = z.infer<typeof deleteFacultySchema>;
