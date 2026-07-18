import type { Metadata } from "next";
import { ArrowLeft, FileQuestion } from "lucide-react";

import { StatusPage } from "@/modules/public/components/status-page";

export const metadata: Metadata = {
  title: "Page not found",
  robots: {
    index: false,
    follow: false,
  },
};

export default function NotFound() {
  return (
    <StatusPage
      eyebrow="404"
      title="Page not found"
      description="The page or quiz you are looking for does not exist, or the link may be outdated."
      icon={<FileQuestion className="size-6" />}
      secondary={{
        href: "/",
        label: "Back home",
        icon: <ArrowLeft className="size-4" />,
      }}
      primary={{
        href: "/#faculties",
        label: "Browse faculties",
      }}
    />
  );
}
