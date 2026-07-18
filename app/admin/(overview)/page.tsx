import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  GraduationCap,
  KeyRound,
  Library,
  Plus,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getAdminOverview } from "@/dal/admin/get-overview";
import { getCurrentAdmin } from "@/lib/auth/get-current-admin";
import { AdminPageHeader } from "@/modules/admin/components/admin-page-header";

const quickActions = [
  {
    title: "Create quiz set",
    description: "Bundle subjects and questions for a faculty.",
    href: "/admin/quizzes/new",
    icon: Plus,
  },
  {
    title: "Issue access codes",
    description: "Generate one-time codes for participants.",
    href: "/admin/codes",
    icon: KeyRound,
  },
  {
    title: "Manage faculties",
    description: "Update public faculty pages and slugs.",
    href: "/admin/faculties",
    icon: GraduationCap,
  },
];

export default async function AdminOverviewPage() {
  const [admin, overview] = await Promise.all([
    getCurrentAdmin(),
    getAdminOverview(),
  ]);

  const firstName = admin.success ? admin.user.name.split(" ")[0] : "Admin";
  const { stats, accessCodeHealth, recentQuizSets } = overview;

  const statCards = [
    {
      title: "Users",
      value: stats.users,
      href: "/admin/users",
      icon: Users,
      hint: "Admins and accounts",
    },
    {
      title: "Faculties",
      value: stats.faculties,
      href: "/admin/faculties",
      icon: GraduationCap,
      hint: "Public landing groups",
    },
    {
      title: "Subjects",
      value: stats.subjects,
      href: "/admin/subjects",
      icon: Library,
      hint: "Across all faculties",
    },
    {
      title: "Quiz sets",
      value: stats.quizSets,
      href: "/admin/quizzes",
      icon: BookOpen,
      hint: "Published and draft sets",
    },
    {
      title: "Access codes",
      value: stats.accessCodes,
      href: "/admin/codes",
      icon: KeyRound,
      hint: `${accessCodeHealth.available} available · ${accessCodeHealth.used} used`,
    },
  ];

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title={`Welcome back, ${firstName}`}
        description="Here's what's running across faculties, quiz sets, and access codes."
        actions={
          <Button asChild className="rounded-none">
            <Link href="/admin/quizzes/new">
              <Plus className="size-4" />
              New quiz set
            </Link>
          </Button>
        }
      />

      <section className="grid border sm:grid-cols-2 xl:grid-cols-5">
        {statCards.map((stat, index) => (
          <Link
            key={stat.title}
            href={stat.href}
            className={[
              "group bg-card p-4 transition-colors hover:bg-accent/50",
              index < 4 ? "border-b xl:border-b-0" : "",
              index % 2 === 0 ? "sm:border-r" : "",
              index < 4 ? "xl:border-r" : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 space-y-3">
                <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
                  {stat.title}
                </p>
                <p className="font-display text-3xl tracking-tight">
                  {stat.value}
                </p>
                <p className="text-xs text-muted-foreground">{stat.hint}</p>
              </div>
              <span className="flex size-9 shrink-0 items-center justify-center border bg-background text-muted-foreground transition-colors group-hover:text-foreground">
                <stat.icon className="size-4" />
              </span>
            </div>
          </Link>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:gap-0 lg:divide-x lg:border">
        <div className="space-y-4 lg:p-6">
          <div className="flex items-end justify-between gap-3 border-b pb-4">
            <div>
              <h2 className="font-display text-2xl tracking-tight">
                Recent quiz sets
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Jump back into the latest assessments.
              </p>
            </div>
            <Button asChild variant="outline" size="sm" className="rounded-none">
              <Link href="/admin/quizzes">View all</Link>
            </Button>
          </div>

          <div className="overflow-hidden border bg-card lg:border-0">
            {recentQuizSets.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-muted-foreground">
                No quiz sets yet. Create your first set to get started.
              </div>
            ) : (
              <ul className="divide-y">
                {recentQuizSets.map((set) => (
                  <li key={set.id}>
                    <Link
                      href={`/admin/quizzes/${set.id}`}
                      className="flex items-start justify-between gap-4 px-4 py-4 transition-colors hover:bg-accent/40"
                    >
                      <div className="min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate font-medium">{set.title}</p>
                          <Badge variant="outline" className="rounded-none">
                            {set.facultyName}
                          </Badge>
                          <Badge
                            variant={set.isPublished ? "secondary" : "outline"}
                            className="rounded-none"
                          >
                            {set.isPublished ? "Published" : "Draft"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {set.questionCount} questions · {set.totalMarks} marks
                          · {set.durationMinutes} min · {set.sectionCount}{" "}
                          subjects
                        </p>
                      </div>
                      <ArrowRight className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="space-y-4 lg:p-6">
          <div className="border-b pb-4">
            <h2 className="font-display text-2xl tracking-tight">
              Quick actions
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Common admin tasks in one place.
            </p>
          </div>

          <div className="divide-y border">
            {quickActions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="flex items-start gap-3 bg-card p-4 transition-colors hover:bg-accent/40"
              >
                <span className="flex size-9 shrink-0 items-center justify-center border bg-background">
                  <action.icon className="size-4" />
                </span>
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="font-medium">{action.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {action.description}
                  </p>
                </div>
                <ArrowRight className="mt-1 size-4 shrink-0 text-muted-foreground" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border bg-card px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
              Access code health
            </p>
            <p className="text-sm text-muted-foreground">
              {accessCodeHealth.available} codes still available for
              participants. {accessCodeHealth.used} already used
              {accessCodeHealth.expired > 0
                ? ` · ${accessCodeHealth.expired} expired`
                : ""}
              .
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-6">
            <div>
              <p className="font-display text-2xl tracking-tight">
                {accessCodeHealth.available}
              </p>
              <p className="text-xs text-muted-foreground">Available</p>
            </div>
            <div>
              <p className="font-display text-2xl tracking-tight">
                {accessCodeHealth.used}
              </p>
              <p className="text-xs text-muted-foreground">Used</p>
            </div>
            <Button asChild variant="outline" className="rounded-none">
              <Link href="/admin/codes">Manage codes</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
