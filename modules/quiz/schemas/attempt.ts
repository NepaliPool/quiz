import { z } from "zod";

export const startAttemptSchema = z.object({
  quizSetId: z.string().min(1, "Quiz set is required."),
  code: z
    .string()
    .trim()
    .min(4, "Access code looks too short.")
    .transform((value) => value.toUpperCase()),
});

export type StartAttemptInput = z.infer<typeof startAttemptSchema>;

export const submitAttemptSchema = z.object({
  attemptId: z.string().min(1, "Attempt is required."),
  answers: z
    .record(z.string().min(1), z.string().min(1))
    .refine((value) => Object.keys(value).length > 0, {
      message: "Submit at least one answer.",
    }),
});

export type SubmitAttemptInput = z.infer<typeof submitAttemptSchema>;

export const resolveAccessCodeSchema = z.object({
  code: z
    .string()
    .trim()
    .min(4, "Access code looks too short.")
    .transform((value) => value.toUpperCase()),
});

export type ResolveAccessCodeInput = z.infer<typeof resolveAccessCodeSchema>;

export const unlockAnswerSheetSchema = z.object({
  facultySlug: z.string().min(1),
  quizSetSlug: z.string().min(1),
  attemptId: z.string().min(1).optional(),
  code: z
    .string()
    .trim()
    .min(4, "Access code looks too short.")
    .transform((value) => value.toUpperCase()),
});

export type UnlockAnswerSheetInput = z.infer<typeof unlockAnswerSheetSchema>;
