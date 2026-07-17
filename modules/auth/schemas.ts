import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

export const signUpSchema = z
  .object({
    name: z.string().trim().min(2, "Name must be at least 2 characters."),
    email: z.email("Enter a valid email address."),
    password: z.string().min(8, "Password must be at least 8 characters."),
    confirmPassword: z.string().min(1, "Confirm your password."),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });

export type LoginValues = z.infer<typeof loginSchema>;
export type SignUpValues = z.infer<typeof signUpSchema>;

export function getZodFieldErrors<T extends Record<string, unknown>>(
  error: z.ZodError,
) {
  const errors: Partial<Record<keyof T, string>> = {};

  for (const issue of error.issues) {
    const field = issue.path[0] as keyof T | undefined;

    if (field && !errors[field]) {
      errors[field] = issue.message;
    }
  }

  return errors;
}
