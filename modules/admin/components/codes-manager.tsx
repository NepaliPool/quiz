"use client";

import { Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { deleteAccessCode } from "@/actions/admin/codes/delete";
import { generateAccessCodes } from "@/actions/admin/codes/generate";
import {
  ACCESS_CODE_STATUS_OPTIONS,
  AccessCodeStatusLabel,
} from "@/modules/admin/components/access-code-status";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AdminEmptyState,
  AdminListToolbar,
  AdminPagination,
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
import type { AccessCodeListResult } from "@/dal/admin/get-access-codes";
import type { QuizSetOption } from "@/dal/admin/get-quiz-sets";
import { getZodFieldErrors } from "@/lib/action-result";
import { useAdminListParams } from "@/modules/admin/hooks/use-admin-list-params";
import {
  generateAccessCodesSchema,
  type GenerateAccessCodesInput,
} from "@/modules/admin/schemas/access-code";

type CodeForm = {
  quizSetId: string;
  quantity: string;
  expiresAt: string;
};

export function CodesManager({
  data,
  quizOptions,
  publishedQuizOptions,
}: {
  data: AccessCodeListResult;
  quizOptions: QuizSetOption[];
  publishedQuizOptions: QuizSetOption[];
}) {
  const router = useRouter();
  const list = useAdminListParams();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [pendingDelete, setPendingDelete] = useState<
    AccessCodeListResult["items"][number] | null
  >(null);
  const statusFilter = list.getParam("status");
  const quizFilter = list.getParam("quiz");
  const [form, setForm] = useState<CodeForm>({
    quizSetId: publishedQuizOptions[0]?.id ?? "",
    quantity: "10",
    expiresAt: "",
  });
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof GenerateAccessCodesInput, string>>
  >({});

  const showPagination = data.total > data.pageSize;
  const hasActiveFilters = Boolean(
    list.query.trim() ||
      statusFilter !== "all" ||
      quizFilter !== "all" ||
      list.searchParams.get("page"),
  );

  function openCreate() {
    setForm({
      quizSetId: publishedQuizOptions[0]?.id ?? "",
      quantity: "10",
      expiresAt: "",
    });
    setFieldErrors({});
    setOpen(true);
  }

  function handleSave() {
    const parsed = generateAccessCodesSchema.safeParse({
      quizSetId: form.quizSetId,
      quantity: form.quantity,
      expiresAt: form.expiresAt,
    });

    if (!parsed.success) {
      setFieldErrors(
        getZodFieldErrors<GenerateAccessCodesInput>(parsed.error),
      );
      return;
    }

    setFieldErrors({});

    startTransition(async () => {
      const result = await generateAccessCodes(parsed.data);

      if (!result.success) {
        if (result.errors) {
          setFieldErrors(
            result.errors as Partial<
              Record<keyof GenerateAccessCodesInput, string>
            >,
          );
        }
        toast.error(result.message);
        return;
      }

      toast.success(result.message ?? "Codes generated.");
      setOpen(false);
      router.refresh();
    });
  }

  function confirmDelete() {
    if (!pendingDelete) return;
    const code = pendingDelete;
    setPendingDelete(null);

    startTransition(async () => {
      const result = await deleteAccessCode({ id: code.id });

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
          onClearFilters={() => list.clearFilters(["status", "quiz"])}
          showClear={hasActiveFilters}
          placeholder="Search by code"
          filters={
            <>
              <Select
                value={statusFilter}
                onValueChange={(value) => list.setParam("status", value)}
              >
                <SelectTrigger className="w-full sm:w-44">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {ACCESS_CODE_STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.value === "all" ? (
                        option.label
                      ) : (
                        <AccessCodeStatusLabel
                          status={option.value as "available" | "used" | "expired"}
                        />
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={quizFilter}
                onValueChange={(value) => list.setParam("quiz", value)}
              >
                <SelectTrigger className="w-full sm:w-56">
                  <SelectValue placeholder="Quiz set" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All quiz sets</SelectItem>
                  {quizOptions.map((set) => (
                    <SelectItem key={set.id} value={set.id}>
                      {set.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          }
          actions={
            <Button
              onClick={openCreate}
              disabled={publishedQuizOptions.length === 0}
            >
              <Plus className="size-4" />
              Generate codes
            </Button>
          }
        />

        {data.items.length === 0 ? (
          <AdminEmptyState
            title="No codes found"
            description={
              publishedQuizOptions.length === 0
                ? "Publish a quiz set before generating access codes."
                : "Try a different search or filter, or generate new codes."
            }
          />
        ) : (
          <div className="overflow-hidden rounded-xl border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Quiz set</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-20 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((code) => (
                  <TableRow key={code.id}>
                    <TableCell className="font-mono font-medium">
                      {code.code}
                    </TableCell>
                    <TableCell>{code.quizSetTitle}</TableCell>
                    <TableCell>
                      <AccessCodeStatusLabel status={code.status} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {code.expiresAt ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {code.createdAt}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="icon"
                        variant="ghost"
                        disabled={isPending || code.hasAttempt}
                        className="hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => setPendingDelete(code)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
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

      <ConfirmDeleteDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        title="Delete access code?"
        description={
          pendingDelete
            ? `This will permanently delete code ${pendingDelete.code}. This cannot be undone.`
            : "This cannot be undone."
        }
        confirmLabel="Delete code"
        requireTypedConfirm
        isPending={isPending}
        onConfirm={confirmDelete}
      />

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Generate access codes</SheetTitle>
            <SheetDescription>
              Choose a published quiz set and how many codes to create. Codes
              are generated on the server.
            </SheetDescription>
          </SheetHeader>

          <div className="flex flex-1 flex-col gap-4 px-4">
            <div className="space-y-2">
              <Label>Quiz set</Label>
              <Select
                value={form.quizSetId}
                onValueChange={(value) =>
                  setForm((current) => ({ ...current, quizSetId: value }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select quiz set" />
                </SelectTrigger>
                <SelectContent>
                  {publishedQuizOptions.map((set) => (
                    <SelectItem key={set.id} value={set.id}>
                      {set.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldErrors.quizSetId ? (
                <p className="text-sm text-destructive">
                  {fieldErrors.quizSetId}
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="code-quantity">How many codes?</Label>
              <Input
                id="code-quantity"
                type="number"
                min={1}
                max={500}
                value={form.quantity}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    quantity: event.target.value,
                  }))
                }
                placeholder="10"
              />
              {fieldErrors.quantity ? (
                <p className="text-sm text-destructive">
                  {fieldErrors.quantity}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Between 1 and 500. Each code unlocks one attempt.
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="expires-at">Expires at (optional)</Label>
              <Input
                id="expires-at"
                type="date"
                value={form.expiresAt}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    expiresAt: event.target.value,
                  }))
                }
              />
              {fieldErrors.expiresAt ? (
                <p className="text-sm text-destructive">
                  {fieldErrors.expiresAt}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Expires at the end of that day (UTC).
                </p>
              )}
            </div>
          </div>

          <SheetFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isPending}>
              Generate {form.quantity || "…"} codes
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}
