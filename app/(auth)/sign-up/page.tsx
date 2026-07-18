import type { Metadata } from "next";

import { SignUpForm } from "@/modules/auth/components/sign-up-form";

export const metadata: Metadata = {
  title: "Create account",
  description: "Create a QuizDesk account to access the platform.",
};

export default function SignUpPage() {
  return <SignUpForm />;
}
