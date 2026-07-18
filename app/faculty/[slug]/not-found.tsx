import { ArrowLeft, FileQuestion } from "lucide-react";

import { StatusPage } from "@/modules/public/components/status-page";

export default function FacultyNotFound() {
  return (
    <StatusPage
      eyebrow="Faculty"
      title="Faculty not found"
      description="This faculty does not exist, or the link may be outdated."
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
