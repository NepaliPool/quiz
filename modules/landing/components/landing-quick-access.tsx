"use client";

import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { resolveAccessCode } from "@/actions/quiz/resolve-access-code";
import { Button } from "@/components/ui/button";
import { Field, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { resolveAccessCodeSchema } from "@/modules/quiz/schemas/attempt";

export function LandingQuickAccess() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string>();
  const [isResolving, setIsResolving] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const parsed = resolveAccessCodeSchema.safeParse({ code });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Enter a valid access code.");
      return;
    }

    setError(undefined);
    setIsResolving(true);

    try {
      const response = await resolveAccessCode(parsed.data);

      if (!response.success) {
        setError(response.errors?.code ?? response.message);
        toast.error(response.message);
        return;
      }

      router.push(response.data.href);
    } finally {
      setIsResolving(false);
    }
  }

  return (
    <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
      <Field>
        <Input
          aria-label="Quiz access code"
          value={code}
          onChange={(event) => {
            setError(undefined);
            setCode(event.target.value.toUpperCase());
          }}
          placeholder="Example: FST-2026-88"
          className="h-11 rounded-none tracking-wide shadow-none"
          aria-invalid={Boolean(error)}
          autoComplete="off"
        />
        <FieldError>{error}</FieldError>
      </Field>
      <Button
        type="submit"
        className="h-11 w-full rounded-none sm:w-auto sm:self-start"
        disabled={isResolving}
      >
        {isResolving ? "Starting quiz..." : "Continue"}
        <ArrowRight className="size-4" />
      </Button>
    </form>
  );
}
