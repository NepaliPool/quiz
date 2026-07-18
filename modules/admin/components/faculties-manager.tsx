"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { createFaculty } from "@/actions/admin/faculties/create";
import { deleteFaculty } from "@/actions/admin/faculties/delete";
import { updateFaculty } from "@/actions/admin/faculties/update";
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
import { slugify } from "@/lib/slugify";
import type { FacultyListResult } from "@/dal/admin/get-faculties";
import { adminKeys } from "@/modules/admin/hooks/queries/keys";
import { useFacultiesQuery } from "@/modules/admin/hooks/queries/use-faculties";
import { useAdminListParams } from "@/modules/admin/hooks/use-admin-list-params";
import {
  createFacultySchema,
  type CreateFacultyInput,
} from "@/modules/admin/schemas/faculty";

type FacultyForm = {
  name: string;
  slug: string;
};

const emptyForm: FacultyForm = {
  name: "",
  slug: "",
};

export function FacultiesManager() {
  const queryClient = useQueryClient();
  const list = useAdminListParams();
  const filters = {
    q: list.committedQuery,
    page: list.page,
  };
  const { data, isPending, isFetching, isError, error } =
    useFacultiesQuery(filters);

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FacultyForm>(emptyForm);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof CreateFacultyInput, string>>
  >({});
  const [isMutating, startTransition] = useTransition();
  const [pendingDelete, setPendingDelete] = useState<
    FacultyListResult["items"][number] | null
  >(null);

  const showPagination = data ? data.total > data.pageSize : false;
  const hasActiveFilters = Boolean(
    list.query.trim() || list.searchParams.get("page"),
  );
  const resultsPending = list.isPending || isFetching;

  async function invalidateFacultyLists() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: adminKeys.facultiesRoot() }),
      queryClient.invalidateQueries({ queryKey: adminKeys.subjectsRoot() }),
      queryClient.invalidateQueries({ queryKey: adminKeys.quizSetsRoot() }),
    ]);
  }

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setFieldErrors({});
    setOpen(true);
  }

  function openEdit(faculty: FacultyListResult["items"][number]) {
    setEditingId(faculty.id);
    setForm({
      name: faculty.name,
      slug: faculty.slug,
    });
    setFieldErrors({});
    setOpen(true);
  }

  function handleSave() {
    const parsed = createFacultySchema.safeParse(form);

    if (!parsed.success) {
      setFieldErrors(getZodFieldErrors<CreateFacultyInput>(parsed.error));
      return;
    }

    setFieldErrors({});

    startTransition(async () => {
      const result = editingId
        ? await updateFaculty({ id: editingId, ...parsed.data })
        : await createFaculty(parsed.data);

      if (!result.success) {
        if (result.errors) {
          setFieldErrors(
            result.errors as Partial<Record<keyof CreateFacultyInput, string>>,
          );
        }
        toast.error(result.message);
        return;
      }

      toast.success(result.message ?? "Saved.");
      setOpen(false);
      await invalidateFacultyLists();
    });
  }

  function confirmDelete() {
    if (!pendingDelete) return;
    const faculty = pendingDelete;
    setPendingDelete(null);

    startTransition(async () => {
      const result = await deleteFaculty({ id: faculty.id });

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message ?? "Deleted.");
      await invalidateFacultyLists();
    });
  }

  return (
    <>
      <div className="space-y-4">
        <AdminListToolbar
          query={list.query}
          onQueryChange={list.setQuery}
          onClearFilters={() => list.clearFilters()}
          showClear={hasActiveFilters}
          isPending={resultsPending}
          placeholder="Search by name or slug"
          actions={
            <Button onClick={openCreate}>
              <Plus className="size-4" />
              Add faculty
            </Button>
          }
        />

        {isPending && !data ? (
          <AdminTableSkeleton columns={3} />
        ) : isError ? (
          <AdminEmptyState
            title="Couldn’t load faculties"
            description={error instanceof Error ? error.message : "Try again."}
          />
        ) : data ? (
          <AdminListResults isPending={resultsPending}>
            {data.items.length === 0 ? (
              <AdminEmptyState
                title="No faculties found"
                description="Try a different search term or create a new faculty."
              />
            ) : (
              <div className="overflow-hidden border bg-card">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Slug</TableHead>
                      <TableHead className="w-28 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.items.map((faculty) => (
                      <TableRow key={faculty.id}>
                        <TableCell className="font-medium">
                          {faculty.name}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {faculty.slug}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              disabled={isMutating}
                              aria-label={`Edit ${faculty.name}`}
                              onClick={() => openEdit(faculty)}
                            >
                              <Pencil className="size-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              disabled={isMutating}
                              className="hover:bg-destructive/10 hover:text-destructive"
                              aria-label={`Delete ${faculty.name}`}
                              onClick={() => setPendingDelete(faculty)}
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
        title="Delete faculty?"
        description={
          pendingDelete
            ? `This will permanently delete “${pendingDelete.name}”. This cannot be undone.`
            : "This cannot be undone."
        }
        confirmLabel="Delete faculty"
        requireTypedConfirm
        isPending={isMutating}
        onConfirm={confirmDelete}
      />

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>
              {editingId ? "Edit faculty" : "Add faculty"}
            </SheetTitle>
            <SheetDescription>
              Faculties appear on the public landing page and own quiz sets.
            </SheetDescription>
          </SheetHeader>

          <div className="flex flex-1 flex-col gap-4 px-4">
            <div className="space-y-2">
              <Label htmlFor="faculty-name">Name</Label>
              <Input
                id="faculty-name"
                value={form.name}
                onChange={(event) => {
                  const name = event.target.value;
                  setForm((current) => ({
                    ...current,
                    name,
                    slug: editingId ? current.slug : slugify(name),
                  }));
                }}
                placeholder="Faculty of Science and Technology"
              />
              {fieldErrors.name ? (
                <p className="text-sm text-destructive">{fieldErrors.name}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="faculty-slug">Slug</Label>
              <Input
                id="faculty-slug"
                value={form.slug}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    slug: slugify(event.target.value),
                  }))
                }
                placeholder="science-and-technology"
              />
              {fieldErrors.slug ? (
                <p className="text-sm text-destructive">{fieldErrors.slug}</p>
              ) : null}
            </div>
          </div>

          <SheetFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isMutating}>
              {editingId ? "Save changes" : "Create faculty"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}
