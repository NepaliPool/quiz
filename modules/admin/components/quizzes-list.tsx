"use client";

import { useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Clock3, FileQuestion, Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { setQuizSetPublished } from "@/actions/admin/quizzes/update";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  AdminEmptyState,
  AdminListResults,
  AdminListToolbar,
  AdminPagination,
  AdminTableSkeleton,
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
import type {
  QuizSetListItem,
  QuizSetListResult,
} from "@/dal/admin/get-quiz-sets";
import { adminKeys } from "@/modules/admin/hooks/queries/keys";
import { useQuizSetsQuery } from "@/modules/admin/hooks/queries/use-quiz-sets";
import { useAdminListParams } from "@/modules/admin/hooks/use-admin-list-params";
import {
  resolveFacultyId,
  resolveSubjectId,
  subjectParamValue,
} from "@/modules/admin/lib/resolve-list-filter";

export function QuizzesList({
  faculties,
  subjects,
}: {
  faculties: FacultyOption[];
  subjects: SubjectOption[];
}) {
  const queryClient = useQueryClient();
  const list = useAdminListParams();
  const facultyParam = list.getParam("faculty");
  const subjectParam = list.getParam("subject");
  const facultyId = resolveFacultyId(facultyParam, faculties);
  const subjectId = resolveSubjectId(subjectParam, subjects, facultyId);

  const filters = {
    q: list.committedQuery,
    facultyId,
    subjectId,
    page: list.page,
  };
  const { data, isPending, isFetching, isError, error } =
    useQuizSetsQuery(filters);

  const [publishedOverrides, setPublishedOverrides] = useState<
    Record<string, boolean>
  >({});
  const [togglingIds, setTogglingIds] = useState<Record<string, true>>({});

  const subjectOptions =
    facultyId === "all"
      ? subjects
      : subjects.filter((subject) => subject.facultyId === facultyId);

  const showPagination = data ? data.total > data.pageSize : false;
  const hasActiveFilters = Boolean(
    list.query.trim() ||
      facultyParam !== "all" ||
      subjectParam !== "all" ||
      list.searchParams.get("page"),
  );
  const resultsPending = list.isPending || isFetching;
  const facultySelectValue =
    facultyId === "all"
      ? "all"
      : (faculties.find((faculty) => faculty.id === facultyId)?.slug ?? "all");

  function updateFaculty(nextFacultyParam: string) {
    const nextFacultyId = resolveFacultyId(nextFacultyParam, faculties);
    const resolvedSubjectId = resolveSubjectId(
      subjectParam,
      subjects,
      nextFacultyId,
    );
    const stillValid =
      subjectParam === "all" ||
      nextFacultyId === "all" ||
      subjects.some(
        (subject) =>
          subject.id === resolvedSubjectId &&
          subject.facultyId === nextFacultyId,
      );

    list.setParams({
      faculty: nextFacultyParam,
      subject: stillValid ? subjectParam : "all",
    });
  }

  function updateSubject(nextSubjectId: string) {
    if (nextSubjectId === "all") {
      list.setParam("subject", "all");
      return;
    }

    const subject = subjects.find((item) => item.id === nextSubjectId);
    if (!subject) {
      return;
    }

    const faculty = faculties.find((item) => item.id === subject.facultyId);
    list.setParams({
      ...(facultyParam === "all" && faculty
        ? { faculty: faculty.slug }
        : {}),
      subject: subjectParamValue(subject.name),
    });
  }

  function resolvePublished(set: QuizSetListItem) {
    return publishedOverrides[set.id] ?? set.isPublished;
  }

  function patchListCache(
    quizSetId: string,
    nextPublished: boolean,
    previousPublished: boolean,
  ) {
    queryClient.setQueryData<QuizSetListResult>(
      adminKeys.quizSets(filters),
      (current) => {
        if (!current) return current;

        const delta =
          nextPublished === previousPublished
            ? 0
            : nextPublished
              ? 1
              : -1;

        return {
          ...current,
          published: Math.max(0, current.published + delta),
          draft: Math.max(0, current.draft - delta),
          items: current.items.map((item) =>
            item.id === quizSetId
              ? { ...item, isPublished: nextPublished }
              : item,
          ),
        };
      },
    );
  }

  function handlePublishToggle(set: QuizSetListItem, nextPublished: boolean) {
    const previousPublished = resolvePublished(set);

    if (previousPublished === nextPublished || togglingIds[set.id]) {
      return;
    }

    setPublishedOverrides((current) => ({
      ...current,
      [set.id]: nextPublished,
    }));
    setTogglingIds((current) => ({ ...current, [set.id]: true }));
    patchListCache(set.id, nextPublished, previousPublished);

    void (async () => {
      try {
        const result = await setQuizSetPublished({
          id: set.id,
          isPublished: nextPublished,
        });

        if (!result.success) {
          setPublishedOverrides((current) => {
            const next = { ...current };
            if (previousPublished === set.isPublished) {
              delete next[set.id];
            } else {
              next[set.id] = previousPublished;
            }
            return next;
          });
          patchListCache(set.id, previousPublished, nextPublished);
          toast.error(result.message);
          return;
        }

        toast.success(
          result.message ??
            (nextPublished ? "Quiz set published." : "Quiz set unpublished."),
        );

        setPublishedOverrides((current) => {
          const next = { ...current };
          delete next[set.id];
          return next;
        });

        await Promise.all([
          queryClient.invalidateQueries({ queryKey: adminKeys.quizSetsRoot() }),
          queryClient.invalidateQueries({
            queryKey: adminKeys.accessCodesRoot(),
          }),
        ]);
      } catch {
        setPublishedOverrides((current) => {
          const next = { ...current };
          if (previousPublished === set.isPublished) {
            delete next[set.id];
          } else {
            next[set.id] = previousPublished;
          }
          return next;
        });
        patchListCache(set.id, previousPublished, nextPublished);
        toast.error("Could not update publish state. Please try again.");
      } finally {
        setTogglingIds((current) => {
          const next = { ...current };
          delete next[set.id];
          return next;
        });
      }
    })();
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-px border bg-border sm:grid-cols-3">
        <div className="bg-card p-4">
          <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
            Total sets
          </p>
          <p className="mt-2 font-display text-2xl tracking-tight">
            {data?.total ?? "—"}
          </p>
        </div>
        <div className="bg-card p-4">
          <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
            Published
          </p>
          <p className="mt-2 font-display text-2xl tracking-tight">
            {data?.published ?? "—"}
          </p>
        </div>
        <div className="bg-card p-4">
          <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
            Drafts
          </p>
          <p className="mt-2 font-display text-2xl tracking-tight">
            {data?.draft ?? "—"}
          </p>
        </div>
      </div>

      <AdminListToolbar
        query={list.query}
        onQueryChange={list.setQuery}
        onClearFilters={() => list.clearFilters(["faculty", "subject"])}
        showClear={hasActiveFilters}
        isPending={resultsPending}
        placeholder="Search by title or slug"
        filters={
          <>
            <Select value={facultySelectValue} onValueChange={updateFaculty}>
              <SelectTrigger className="w-full sm:w-56">
                <SelectValue placeholder="Faculty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All faculties</SelectItem>
                {faculties.map((faculty) => (
                  <SelectItem key={faculty.id} value={faculty.slug}>
                    {faculty.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={subjectId} onValueChange={updateSubject}>
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

      {isPending && !data ? (
        <AdminTableSkeleton columns={3} rows={5} />
      ) : isError ? (
        <AdminEmptyState
          title="Couldn’t load quiz sets"
          description={error instanceof Error ? error.message : "Try again."}
        />
      ) : data ? (
        <AdminListResults isPending={resultsPending}>
          {data.items.length === 0 ? (
            <AdminEmptyState
              title="No quiz sets found"
              description="Try a different search or filter, or create a new quiz set."
            />
          ) : (
            <div className="space-y-3">
              <ul className="grid gap-3">
                {data.items.map((set) => {
                  const isPublished = resolvePublished(set);
                  const publishControlId = `publish-${set.id}`;

                  return (
                    <li key={set.id} className="border bg-card">
                      <div className="flex flex-col gap-5 p-5 sm:p-6">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0 space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant="outline">{set.facultyName}</Badge>
                              <Badge
                                variant={isPublished ? "secondary" : "outline"}
                              >
                                {isPublished ? "Published" : "Draft"}
                              </Badge>
                            </div>
                            <h3 className="font-display text-2xl tracking-tight">
                              <Link
                                href={`/admin/quizzes/${set.id}`}
                                className="transition-colors hover:text-primary"
                              >
                                {set.title}
                              </Link>
                            </h3>
                            <p className="font-mono text-xs text-muted-foreground">
                              /{set.slug}
                            </p>
                          </div>

                          <div className="flex shrink-0 items-center justify-between gap-4 border bg-muted/30 px-3 py-2.5 sm:min-w-44 sm:flex-col sm:items-stretch sm:justify-center">
                            <div className="flex items-center justify-between gap-3">
                              <Label
                                htmlFor={publishControlId}
                                className="text-sm font-medium"
                              >
                                Published
                              </Label>
                              <Switch
                                id={publishControlId}
                                checked={isPublished}
                                disabled={
                                  resultsPending || Boolean(togglingIds[set.id])
                                }
                                aria-label={
                                  isPublished
                                    ? `Unpublish ${set.title}`
                                    : `Publish ${set.title}`
                                }
                                onCheckedChange={(checked) =>
                                  handlePublishToggle(set, checked)
                                }
                              />
                            </div>
                          </div>
                        </div>

                        {set.description ? (
                          <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                            {set.description}
                          </p>
                        ) : null}

                        {set.sectionLabels.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {set.sectionLabels.map((section) => (
                              <span
                                key={`${set.id}-${section.id}`}
                                className="border px-2.5 py-1.5 text-xs"
                              >
                                <span className="font-medium">
                                  {section.name}
                                </span>
                                <span className="text-muted-foreground">
                                  {" "}
                                  · {section.fullMarks} marks
                                </span>
                              </span>
                            ))}
                          </div>
                        ) : null}

                        <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                            <span className="inline-flex items-center gap-1.5">
                              <FileQuestion className="size-3.5" />
                              {set.questionCount} questions · {set.totalMarks}{" "}
                              marks
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                              <Clock3 className="size-3.5" />
                              {set.durationMinutes} min
                            </span>
                          </div>

                          <Button asChild variant="outline" size="sm">
                            <Link href={`/admin/quizzes/${set.id}`}>
                              Edit set
                              <ArrowRight className="size-4" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>

              {showPagination ? (
                <div className="border bg-card">
                  <AdminPagination
                    page={data.page}
                    pageCount={data.pageCount}
                    totalItems={data.total}
                    pageSize={data.pageSize}
                    onPageChange={list.setPage}
                  />
                </div>
              ) : null}
            </div>
          )}
        </AdminListResults>
      ) : null}
    </div>
  );
}
