import type { z } from "zod";

export type ActionSuccess<T = undefined> = {
  success: true;
  message?: string;
  data: T;
};

export type ActionFailure = {
  success: false;
  message: string;
  errors?: Record<string, string>;
};

export type ActionResult<T = undefined> = ActionSuccess<T> | ActionFailure;

export function actionSuccess<T = undefined>(
  data?: T,
  message?: string,
): ActionSuccess<T> {
  return {
    success: true,
    message,
    data: data as T,
  };
}

export function actionFailure(
  message: string,
  errors?: Record<string, string>,
): ActionFailure {
  return {
    success: false,
    message,
    errors,
  };
}

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

export function zodErrorMap(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};

  for (const issue of error.issues) {
    const field = String(issue.path[0] ?? "form");

    if (!errors[field]) {
      errors[field] = issue.message;
    }
  }

  return errors;
}

export function isUniqueViolation(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const candidates = [error, "cause" in error ? error.cause : null];

  for (const candidate of candidates) {
    if (
      candidate &&
      typeof candidate === "object" &&
      "code" in candidate &&
      candidate.code === "23505"
    ) {
      return true;
    }
  }

  return false;
}

export function isForeignKeyViolation(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const candidates = [error, "cause" in error ? error.cause : null];

  for (const candidate of candidates) {
    if (
      candidate &&
      typeof candidate === "object" &&
      "code" in candidate &&
      (candidate.code === "23503" || candidate.code === "23514")
    ) {
      return true;
    }
  }

  return false;
}
