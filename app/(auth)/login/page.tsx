import type { Metadata } from "next";

import { LoginForm } from "@/modules/auth/components/login-form";

export const metadata: Metadata = {
  title: "Login",
  description: "Sign in to QuizDesk to manage faculties, quiz sets, and access codes.",
};

export default function LoginPage() {
  return <LoginForm />;
}
