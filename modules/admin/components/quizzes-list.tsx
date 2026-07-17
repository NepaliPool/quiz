"use client";

import { ArrowRight, Clock3, Plus } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AdminEmptyState,
  AdminListToolbar,
  AdminPagination,
} from "@/modules/admin/components/admin-list-states";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { FacultyOption } from "@/dal/admin/get-faculties";
import type { SubjectOption } from "@/dal/admin/get-quiz-set";
import type { QuizSetListResult } from "@/dal/admin/get-quiz-sets";
import { useAdminListParams } from "@/modules/admin/hooks/use-admin-list-params";

export function QuizzesList({
  data,
  faculties,
  subjects,
}: {
  data: QuizSetListResult;
  faculties: FacultyOption[];
  subjects: SubjectOption[];
}) {
  const list = useAdminListParams();
  const facultyFilter = list.getParam("faculty");
  const subjectFilter = list.getParam("subject");

  const subjectOptions =
    facultyFilter === "all"
      ? subjects
      : subjects.filter((subject) => subject.facultyId === facultyFilter);

  const showPagination = data.total > data.pageSize;
  const hasActiveFilters = Boolean(
    list.query.trim() ||
      facultyFilter !== "all" ||
      subjectFilter !== "all" ||
      list.searchParams.get("page"),
  );

  function updateFaculty(value: string) {
    const stillValid =
      subjectFilter === "all" ||
      subjects.some(
        (subject) =>
          subject.id === subjectFilter &&
          (value === "all" || subject.facultyId === value),
      );

    list.setParams({
      faculty: value,
      subject: stillValid ? subjectFilter : "all",
    });
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">Total sets</p>
          <p className="mt-2 text-2xl font-semibold">{data.total}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">Published</p>
          <p className="mt-2 text-2xl font-semibold">{data.published}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">Drafts</p>
          <p className="mt-2 text-2xl font-semibold">{data.draft}</p>
        </div>
      </div>

      <AdminListToolbar
        query={list.query}
        onQueryChange={list.setQuery}
        onClearFilters={() => list.clearFilters(["faculty", "subject"])}
        showClear={hasActiveFilters}
        placeholder="Search by title or slug"
        filters={
          <>
            <Select value={facultyFilter} onValueChange={updateFaculty}>
              <SelectTrigger className="w-full sm:w-56">
                <SelectValue placeholder="Faculty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All faculties</SelectItem>
                {faculties.map((faculty) => (
                  <SelectItem key={faculty.id} value={faculty.id}>
                    {faculty.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={subjectFilter}
              onValueChange={(value) => list.setParam("subject", value)}
            >
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All subjects</SelectItem>
                {subjectOptions.map((subject) => (
                  <SelectItem key={subject.id} value={subject.id}>
                    {subject.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        }
        actions={
          <Button asChild>
            <Link href="/admin/quizzes/new">
              <Plus className="size-4" />
              New quiz set
            </Link>
          </Button>
        }
      />

      {data.items.length === 0 ? (
        <AdminEmptyState
          title="No quiz sets found"
          description="Try a different search or filter, or create a new quiz set."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card">
          <ul className="divide-y">
            {data.items.map((set) => (
              <li key={set.id}>
                <Link
                  href={`/admin/quizzes/${set.id}`}
                  className="group flex flex-col gap-4 px-4 py-5 transition-colors hover:bg-muted/40 sm:flex-row sm:items-start sm:justify-between"
                >
                  <div className="min-w-0 flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold tracking-tight">
                        {set.title}
                      </h3>
                      <Badge variant="outline">{set.facultyName}</Badge>
                      <Badge
                        variant={set.isPublished ? "secondary" : "outline"}
                      >
                        {set.isPublished ? "Published" : "Draft"}
                      </Badge>
                    </div>
                    {set.description ? (
                      <p className="line-clamp-2 text-sm text-muted-foreground">
                        {set.description}
                      </p>
                    ) : null}
                    <div className="flex flex-wrap gap-2">
                      {set.sectionLabels.map((section) => (
                        <span
                          key={`${set.id}-${section.id}`}
                          className="rounded-md border bg-muted/40 px-2 py-1 text-xs"
                        >
                          {section.name} · {section.fullMarks}
                        </span>
                      ))}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <span>
                        {set.questionCount} questions · {set.totalMarks} marks
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Clock3 className="size-3.5" />
                        {set.durationMinutes} min
                      </span>
                      <span className="font-mono text-xs">{set.slug}</span>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors group-hover:text-foreground">
                    Edit
                    <ArrowRight className="size-4" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          {showPagination ? (
            <AdminPagination
              page={data.page}
              pageCount={data.pageCount}
              totalItems={data.total}
              pageSize={data.pageSize}
              onPageChange={list.setPage}
            />
          ) : null}
        </div>
      )}
    </div>
  );
}
