"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { createSubject } from "@/actions/admin/subjects/create";
import { deleteSubject } from "@/actions/admin/subjects/delete";
import { updateSubject } from "@/actions/admin/subjects/update";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AdminEmptyState,
  AdminListResults,
  AdminListToolbar,
  AdminPagination,
  AdminTableSkeleton,
} from "@/modules/admin/components/admin-list-states";
import { ConfirmDeleteDialog } from "@/modules/admin/components/confirm-delete-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getZodFieldErrors } from "@/lib/action-result";
import type { FacultyOption } from "@/dal/admin/get-faculties";
import type { SubjectListResult } from "@/dal/admin/get-subjects";
import { adminKeys } from "@/modules/admin/hooks/queries/keys";
import { useSubjectsQuery } from "@/modules/admin/hooks/queries/use-subjects";
import { useAdminListParams } from "@/modules/admin/hooks/use-admin-list-params";
import { resolveFacultyId } from "@/modules/admin/lib/resolve-list-filter";
import {
  createSubjectSchema,
  type CreateSubjectInput,
} from "@/modules/admin/schemas/subject";

type SubjectForm = {
  name: string;
  facultyId: string;
};

export function SubjectsManager({
  faculties,
}: {
  faculties: FacultyOption[];
}) {
  const queryClient = useQueryClient();
  const list = useAdminListParams();
  const facultyParam = list.getParam("faculty");
  const facultyId = resolveFacultyId(facultyParam, faculties);
  const filters = {
    q: list.committedQuery,
    facultyId,
    page: list.page,
  };
  const { data, isPending, isFetching, isError, error } =
    useSubjectsQuery(filters);

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<SubjectForm>({
    name: "",
    facultyId: faculties[0]?.id ?? "",
  });
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof CreateSubjectInput, string>>
  >({});
  const [isMutating, startTransition] = useTransition();
  const [pendingDelete, setPendingDelete] = useState<
    SubjectListResult["items"][number] | null
  >(null);

  const showPagination = data ? data.total > data.pageSize : false;
  const hasActiveFilters = Boolean(
    list.query.trim() ||
      facultyParam !== "all" ||
      list.searchParams.get("page"),
  );
  const resultsPending = list.isPending || isFetching;
  const facultySelectValue =
    facultyId === "all"
      ? "all"
      : (faculties.find((faculty) => faculty.id === facultyId)?.slug ?? "all");

  async function invalidateSubjectLists() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: adminKeys.subjectsRoot() }),
      queryClient.invalidateQueries({ queryKey: adminKeys.quizSetsRoot() }),
    ]);
  }

  function openCreate() {
    setEditingId(null);
    setForm({
      name: "",
      facultyId: faculties[0]?.id ?? "",
    });
    setFieldErrors({});
    setOpen(true);
  }

  function openEdit(subject: SubjectListResult["items"][number]) {
    setEditingId(subject.id);
    setForm({
      name: subject.name,
      facultyId: subject.facultyId,
    });
    setFieldErrors({});
    setOpen(true);
  }

  function handleSave() {
    const parsed = createSubjectSchema.safeParse(form);

    if (!parsed.success) {
      setFieldErrors(getZodFieldErrors<CreateSubjectInput>(parsed.error));
      return;
    }

    setFieldErrors({});

    startTransition(async () => {
      const result = editingId
        ? await updateSubject({ id: editingId, ...parsed.data })
        : await createSubject(parsed.data);

      if (!result.success) {
        if (result.errors) {
          setFieldErrors(
            result.errors as Partial<Record<keyof CreateSubjectInput, string>>,
          );
        }
        toast.error(result.message);
        return;
      }

      toast.success(result.message ?? "Saved.");
      setOpen(false);
      await invalidateSubjectLists();
    });
  }

  function confirmDelete() {
    if (!pendingDelete) return;
    const subject = pendingDelete;
    setPendingDelete(null);

    startTransition(async () => {
      const result = await deleteSubject({ id: subject.id });

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message ?? "Deleted.");
      await invalidateSubjectLists();
    });
  }

  return (
    <>
      <div className="space-y-4">
        <AdminListToolbar
          query={list.query}
          onQueryChange={list.setQuery}
          onClearFilters={() => list.clearFilters(["faculty"])}
          showClear={hasActiveFilters}
          isPending={resultsPending}
          placeholder="Search by subject name"
          filters={
            <Select
              value={facultySelectValue}
              onValueChange={(value) => list.setParam("faculty", value)}
            >
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
          }
          actions={
            <Button onClick={openCreate} disabled={faculties.length === 0}>
              <Plus className="size-4" />
              Add subject
            </Button>
          }
        />

        {isPending && !data ? (
          <AdminTableSkeleton columns={3} />
        ) : isError ? (
          <AdminEmptyState
            title="Couldn’t load subjects"
            description={error instanceof Error ? error.message : "Try again."}
          />
        ) : data ? (
          <AdminListResults isPending={resultsPending}>
            {data.items.length === 0 ? (
              <AdminEmptyState
                title="No subjects found"
                description={
                  faculties.length === 0
                    ? "Create a faculty before adding subjects."
                    : "Try a different search or faculty filter, or create a new subject."
                }
              />
            ) : (
              <div className="overflow-hidden border bg-card">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subject</TableHead>
                      <TableHead>Faculty</TableHead>
                      <TableHead className="w-28 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.items.map((subject) => (
                      <TableRow key={subject.id}>
                        <TableCell className="font-medium">
                          {subject.name}
                        </TableCell>
                        <TableCell>{subject.facultyName}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              disabled={isMutating}
                              aria-label={`Edit ${subject.name}`}
                              onClick={() => openEdit(subject)}
                            >
                              <Pencil className="size-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              disabled={isMutating}
                              className="hover:bg-destructive/10 hover:text-destructive"
                              aria-label={`Delete ${subject.name}`}
                              onClick={() => setPendingDelete(subject)}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
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
          </AdminListResults>
        ) : null}
      </div>

      <ConfirmDeleteDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        title="Delete subject?"
        description={
          pendingDelete
            ? `This will permanently delete “${pendingDelete.name}”. This cannot be undone.`
            : "This cannot be undone."
        }
        confirmLabel="Delete subject"
        requireTypedConfirm
        isPending={isMutating}
        onConfirm={confirmDelete}
      />

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>
              {editingId ? "Edit subject" : "Add subject"}
            </SheetTitle>
            <SheetDescription>
              Subjects belong to a faculty and appear inside quiz set sections.
            </SheetDescription>
          </SheetHeader>

          <div className="flex flex-1 flex-col gap-4 px-4">
            <div className="space-y-2">
              <Label htmlFor="subject-name">Name</Label>
              <Input
                id="subject-name"
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                placeholder="English"
              />
              {fieldErrors.name ? (
                <p className="text-sm text-destructive">{fieldErrors.name}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label>Faculty</Label>
              <Select
                value={form.facultyId}
                onValueChange={(value) =>
                  setForm((current) => ({ ...current, facultyId: value }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select faculty" />
                </SelectTrigger>
                <SelectContent>
                  {faculties.map((faculty) => (
                    <SelectItem key={faculty.id} value={faculty.id}>
                      {faculty.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldErrors.facultyId ? (
                <p className="text-sm text-destructive">
                  {fieldErrors.facultyId}
                </p>
              ) : null}
            </div>
          </div>

          <SheetFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isMutating}>
              {editingId ? "Save changes" : "Create subject"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}
