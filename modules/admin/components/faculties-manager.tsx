"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
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
  AdminListToolbar,
  AdminPagination,
} from "@/modules/admin/components/admin-list-states";
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

export function FacultiesManager({ data }: { data: FacultyListResult }) {
  const router = useRouter();
  const list = useAdminListParams();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FacultyForm>(emptyForm);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof CreateFacultyInput, string>>
  >({});
  const [isPending, startTransition] = useTransition();

  const showPagination = data.total > data.pageSize;
  const hasActiveFilters = Boolean(
    list.query.trim() || list.searchParams.get("page"),
  );

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
      router.refresh();
    });
  }

  function handleDelete(faculty: FacultyListResult["items"][number]) {
    startTransition(async () => {
      const result = await deleteFaculty({ id: faculty.id });

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message ?? "Deleted.");
      router.refresh();
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
          placeholder="Search by name or slug"
          actions={
            <Button onClick={openCreate}>
              <Plus className="size-4" />
              Add faculty
            </Button>
          }
        />

        {data.items.length === 0 ? (
          <AdminEmptyState
            title="No faculties found"
            description="Try a different search term or create a new faculty."
          />
        ) : (
          <div className="overflow-hidden rounded-xl border bg-card">
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
                          disabled={isPending}
                          onClick={() => openEdit(faculty)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          disabled={isPending}
                          className="hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => handleDelete(faculty)}
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
      </div>

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
            <Button onClick={handleSave} disabled={isPending}>
              {editingId ? "Save changes" : "Create faculty"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}
