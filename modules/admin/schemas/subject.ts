import { z } from "zod";

export const createSubjectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters.")
    .max(120, "Name must be at most 120 characters."),
  facultyId: z.string().min(1, "Select a faculty."),
});

export const updateSubjectSchema = createSubjectSchema.extend({
  id: z.string().min(1, "Subject id is required."),
});

export const deleteSubjectSchema = z.object({
  id: z.string().min(1, "Subject id is required."),
});

export type CreateSubjectInput = z.infer<typeof createSubjectSchema>;
export type UpdateSubjectInput = z.infer<typeof updateSubjectSchema>;
export type DeleteSubjectInput = z.infer<typeof deleteSubjectSchema>;
