import { z } from "zod";

export const generateAccessCodesSchema = z.object({
  quizSetId: z.string().min(1, "Select a quiz set."),
  quantity: z.coerce
    .number()
    .int("Quantity must be a whole number.")
    .min(1, "Generate at least 1 code.")
    .max(500, "You can generate at most 500 codes at once."),
  /** Date-only string YYYY-MM-DD; expires at end of that UTC day. */
  expiresAt: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use a valid date.")
    .optional()
    .or(z.literal("")),
});

export const deleteAccessCodeSchema = z.object({
  id: z.string().min(1, "Access code id is required."),
});

export type GenerateAccessCodesInput = z.infer<typeof generateAccessCodesSchema>;
export type DeleteAccessCodeInput = z.infer<typeof deleteAccessCodeSchema>;
