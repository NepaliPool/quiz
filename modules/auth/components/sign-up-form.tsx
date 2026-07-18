"use client";

import { useForm } from "@tanstack/react-form";
import { Lock, Mail, UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth/auth-client";
import {
  getZodFieldErrors,
  signUpSchema,
  type SignUpValues,
} from "@/modules/auth/schemas";
import { postAuthPath, roleFromUnknown } from "@/modules/auth/post-auth-path";

import { AuthShell } from "./auth-shell";

const defaultValues: SignUpValues = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
};

export function SignUpForm() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [errors, setErrors] = useState<
    Partial<Record<keyof SignUpValues, string>>
  >({});

  const form = useForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      const parsed = signUpSchema.safeParse(value);

      if (!parsed.success) {
        setErrors(getZodFieldErrors<SignUpValues>(parsed.error));
        return;
      }

      setErrors({});
      setIsPending(true);

      try {
        const result = await authClient.signUp.email({
          name: parsed.data.name,
          email: parsed.data.email,
          password: parsed.data.password,
        });

        if (result.error) {
          throw new Error(result.error.message ?? "Unable to create account.");
        }

        let role = roleFromUnknown(result.data?.user);
        try {
          const session = await authClient.getSession();
          role = roleFromUnknown(session.data?.user) ?? role;
        } catch {
          // Session enrichment is best-effort; sign-up already succeeded.
        }

        toast.success("Account created successfully.");
        router.push(postAuthPath(role));
        router.refresh();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Unable to create account.",
        );
      } finally {
        setIsPending(false);
      }
    },
  });

  return (
    <AuthShell
      title="Create account"
      description="Create an account for managing faculties, subjects, quiz sets, and access codes."
      footer={
        <>
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Login
          </Link>
        </>
      }
    >
      <form
        className="space-y-5"
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          void form.handleSubmit();
        }}
      >
        <FieldGroup className="gap-4">
          <form.Field name="name">
            {(field) => (
              <Field>
                <FieldLabel htmlFor={field.name}>Name</FieldLabel>
                <div className="relative">
                  <UserRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id={field.name}
                    name={field.name}
                    autoComplete="name"
                    placeholder="Your name"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => {
                      setErrors((current) => ({ ...current, name: undefined }));
                      field.handleChange(event.target.value);
                    }}
                    aria-invalid={Boolean(errors.name)}
                    className="pl-9"
                  />
                </div>
                <FieldError>{errors.name}</FieldError>
              </Field>
            )}
          </form.Field>

          <form.Field name="email">
            {(field) => (
              <Field>
                <FieldLabel htmlFor={field.name}>Email</FieldLabel>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id={field.name}
                    name={field.name}
                    type="email"
                    autoComplete="email"
                    placeholder="admin@example.com"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => {
                      setErrors((current) => ({ ...current, email: undefined }));
                      field.handleChange(event.target.value);
                    }}
                    aria-invalid={Boolean(errors.email)}
                    className="pl-9"
                  />
                </div>
                <FieldError>{errors.email}</FieldError>
              </Field>
            )}
          </form.Field>

          <form.Field name="password">
            {(field) => (
              <Field>
                <FieldLabel htmlFor={field.name}>Password</FieldLabel>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id={field.name}
                    name={field.name}
                    type="password"
                    autoComplete="new-password"
                    placeholder="At least 8 characters"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => {
                      setErrors((current) => ({
                        ...current,
                        password: undefined,
                      }));
                      field.handleChange(event.target.value);
                    }}
                    aria-invalid={Boolean(errors.password)}
                    className="pl-9"
                  />
                </div>
                <FieldError>{errors.password}</FieldError>
              </Field>
            )}
          </form.Field>

          <form.Field name="confirmPassword">
            {(field) => (
              <Field>
                <FieldLabel htmlFor={field.name}>Confirm password</FieldLabel>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id={field.name}
                    name={field.name}
                    type="password"
                    autoComplete="new-password"
                    placeholder="Re-enter your password"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => {
                      setErrors((current) => ({
                        ...current,
                        confirmPassword: undefined,
                      }));
                      field.handleChange(event.target.value);
                    }}
                    aria-invalid={Boolean(errors.confirmPassword)}
                    className="pl-9"
                  />
                </div>
                <FieldError>{errors.confirmPassword}</FieldError>
              </Field>
            )}
          </form.Field>
        </FieldGroup>

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "Creating account..." : "Create account"}
        </Button>
      </form>
    </AuthShell>
  );
}
