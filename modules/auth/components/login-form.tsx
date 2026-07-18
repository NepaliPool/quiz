"use client";

import { useForm } from "@tanstack/react-form";
import { Lock, Mail } from "lucide-react";
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
  loginSchema,
  type LoginValues,
} from "@/modules/auth/schemas";
import { postAuthPath, roleFromUnknown } from "@/modules/auth/post-auth-path";

import { AuthShell } from "./auth-shell";

const defaultValues: LoginValues = {
  email: "",
  password: "",
};

export function LoginForm() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [errors, setErrors] = useState<
    Partial<Record<keyof LoginValues, string>>
  >({});

  const form = useForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      const parsed = loginSchema.safeParse(value);

      if (!parsed.success) {
        setErrors(getZodFieldErrors<LoginValues>(parsed.error));
        return;
      }

      setErrors({});
      setIsPending(true);

      try {
        const result = await authClient.signIn.email({
          email: parsed.data.email,
          password: parsed.data.password,
        });

        if (result.error) {
          throw new Error(result.error.message ?? "Unable to sign in.");
        }

        const session = await authClient.getSession();
        const role =
          roleFromUnknown(session.data?.user) ??
          roleFromUnknown(result.data?.user);

        toast.success("Signed in successfully.");
        router.push(postAuthPath(role));
        router.refresh();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Unable to sign in.",
        );
      } finally {
        setIsPending(false);
      }
    },
  });

  return (
    <AuthShell
      title="Welcome back"
      description="Login with your admin account to manage quiz sets, questions, and access codes."
      footer={
        <>
          New here?{" "}
          <Link
            href="/sign-up"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Create an account
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
                    autoComplete="current-password"
                    placeholder="Enter your password"
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
        </FieldGroup>

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "Signing in..." : "Login"}
        </Button>
      </form>
    </AuthShell>
  );
}
