import { ArrowLeft, FileQuestion } from "lucide-react";

import { StatusPage } from "@/modules/public/components/status-page";

export default function QuizSetNotFound() {
  return (
    <StatusPage
      eyebrow="Quiz set"
      title="Quiz set not found"
      description="This quiz set does not exist under this faculty, or it is no longer published."
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
