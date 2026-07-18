import type { Metadata } from "next";

import { SignUpForm } from "@/modules/auth/components/sign-up-form";

export const metadata: Metadata = {
  title: "Create account",
  description: "Create a QuizDesk admin account to manage assessments and access codes.",
};

export default function SignUpPage() {
  return <SignUpForm />;
}
