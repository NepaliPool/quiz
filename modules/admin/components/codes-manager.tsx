"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Check, Copy, Plus, Trash2 } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import { deleteAccessCode } from "@/actions/admin/codes/delete";
import { generateAccessCodes } from "@/actions/admin/codes/generate";
import {
  markAccessCodeIssued,
  releaseAccessCode,
} from "@/actions/admin/codes/issue";
import {
  ACCESS_CODE_STATUS_OPTIONS,
  AccessCodeStatusLabel,
} from "@/modules/admin/components/access-code-status";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import type {
  AccessCodeListResult,
  AccessCodeStatus,
} from "@/dal/admin/get-access-codes";
import type { QuizSetOption } from "@/dal/admin/get-quiz-sets";
import { getZodFieldErrors } from "@/lib/action-result";
import { adminKeys } from "@/modules/admin/hooks/queries/keys";
import { useAccessCodesQuery } from "@/modules/admin/hooks/queries/use-access-codes";
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
  quizOptions,
  publishedQuizOptions,
}: {
  quizOptions: QuizSetOption[];
  publishedQuizOptions: QuizSetOption[];
}) {
  const queryClient = useQueryClient();
  const list = useAdminListParams();
  const [open, setOpen] = useState(false);
  const [isMutating, startTransition] = useTransition();
  const [pendingDelete, setPendingDelete] = useState<
    AccessCodeListResult["items"][number] | null
  >(null);
  const statusFilter = list.getParam("status");
  const quizFilter = list.getParam("quiz");
  const filters = {
    q: list.committedQuery,
    status: statusFilter,
    quizSetId: quizFilter,
    page: list.page,
  };
  const { data, isPending, isFetching, isError, error } =
    useAccessCodesQuery(filters);
  const [form, setForm] = useState<CodeForm>({
    quizSetId: publishedQuizOptions[0]?.id ?? "",
    quantity: "10",
    expiresAt: "",
  });
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof GenerateAccessCodesInput, string>>
  >({});
  const [issuedOverrides, setIssuedOverrides] = useState<
    Record<string, boolean>
  >({});
  const [togglingIds, setTogglingIds] = useState<Record<string, true>>({});
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  useEffect(() => {
    if (!copiedCodeId) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setCopiedCodeId(null);
    }, 1500);

    return () => window.clearTimeout(timeout);
  }, [copiedCodeId]);

  useEffect(() => {
    if (!data) {
      return;
    }

    setIssuedOverrides((current) => {
      if (Object.keys(current).length === 0) {
        return current;
      }

      const next = { ...current };
      let changed = false;

      for (const code of data.items) {
        if (code.id in next && next[code.id] === code.isIssued) {
          delete next[code.id];
          changed = true;
        }
      }

      return changed ? next : current;
    });
  }, [data]);

  const showPagination = data ? data.total > data.pageSize : false;
  const hasActiveFilters = Boolean(
    list.query.trim() ||
      statusFilter !== "all" ||
      quizFilter !== "all" ||
      list.searchParams.get("page"),
  );
  const resultsPending = list.isPending || isFetching;

  async function invalidateCodes() {
    await queryClient.invalidateQueries({
      queryKey: adminKeys.accessCodesRoot(),
    });
  }

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
      await invalidateCodes();
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
      await invalidateCodes();
    });
  }

  function handleCopyCode(code: AccessCodeListResult["items"][number]) {
    void (async () => {
      try {
        await navigator.clipboard.writeText(code.code);
        setCopiedCodeId(code.id);
      } catch {
        toast.error("Could not copy code. Please try again.");
      }
    })();
  }

  function handleIssuedToggle(
    code: AccessCodeListResult["items"][number],
    nextIssued: boolean,
  ) {
    const previousIssued = issuedOverrides[code.id] ?? code.isIssued;

    if (previousIssued === nextIssued || togglingIds[code.id]) {
      return;
    }

    setIssuedOverrides((current) => ({
      ...current,
      [code.id]: nextIssued,
    }));
    setTogglingIds((current) => ({ ...current, [code.id]: true }));

    void (async () => {
      try {
        const result = nextIssued
          ? await markAccessCodeIssued({ id: code.id })
          : await releaseAccessCode({ id: code.id });

        if (!result.success) {
          setIssuedOverrides((current) => {
            const next = { ...current };
            if (previousIssued === code.isIssued) {
              delete next[code.id];
            } else {
              next[code.id] = previousIssued;
            }
            return next;
          });
          toast.error(result.message);
          return;
        }

        toast.success(
          result.message ??
            (nextIssued ? "Marked as issued." : "Released back to available."),
        );
        await invalidateCodes();
      } catch {
        setIssuedOverrides((current) => {
          const next = { ...current };
          if (previousIssued === code.isIssued) {
            delete next[code.id];
          } else {
            next[code.id] = previousIssued;
          }
          return next;
        });
        toast.error("Could not update this code. Please try again.");
      } finally {
        setTogglingIds((current) => {
          const next = { ...current };
          delete next[code.id];
          return next;
        });
      }
    })();
  }

  function resolveIssued(code: AccessCodeListResult["items"][number]) {
    return issuedOverrides[code.id] ?? code.isIssued;
  }

  function resolveStatus(
    code: AccessCodeListResult["items"][number],
  ): AccessCodeStatus {
    if (code.status === "used" || code.status === "expired") {
      return code.status;
    }

    return resolveIssued(code) ? "issued" : "available";
  }

  return (
    <>
      <div className="space-y-4">
        <AdminListToolbar
          query={list.query}
          onQueryChange={list.setQuery}
          onClearFilters={() => list.clearFilters(["status", "quiz"])}
          showClear={hasActiveFilters}
          isPending={resultsPending}
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
                          status={option.value as AccessCodeStatus}
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

        {isPending && !data ? (
          <AdminTableSkeleton columns={7} />
        ) : isError ? (
          <AdminEmptyState
            title="Couldn’t load codes"
            description={error instanceof Error ? error.message : "Try again."}
          />
        ) : data ? (
          <AdminListResults isPending={resultsPending}>
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
              <div className="overflow-hidden border bg-card">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Quiz set</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Issued</TableHead>
                      <TableHead>Expires</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="w-20 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.items.map((code) => {
                      const isIssued = resolveIssued(code);
                      const status = resolveStatus(code);
                      const canToggleIssued =
                        status === "available" || status === "issued";

                      return (
                        <TableRow key={code.id}>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <span className="font-mono font-medium">
                                {code.code}
                              </span>
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="size-8 shrink-0 text-muted-foreground hover:text-foreground"
                                aria-label={
                                  copiedCodeId === code.id
                                    ? `${code.code} copied`
                                    : `Copy ${code.code}`
                                }
                                title={
                                  copiedCodeId === code.id
                                    ? "Copied"
                                    : "Copy code"
                                }
                                onClick={() => handleCopyCode(code)}
                              >
                                {copiedCodeId === code.id ? (
                                  <Check className="size-3.5 text-foreground" />
                                ) : (
                                  <Copy className="size-3.5" />
                                )}
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>{code.quizSetTitle}</TableCell>
                          <TableCell>
                            <AccessCodeStatusLabel status={status} />
                          </TableCell>
                          <TableCell>
                            <Switch
                              checked={isIssued}
                              disabled={
                                !canToggleIssued || Boolean(togglingIds[code.id])
                              }
                              aria-label={
                                isIssued
                                  ? `Release ${code.code}`
                                  : `Mark ${code.code} as issued`
                              }
                              onCheckedChange={(checked) =>
                                handleIssuedToggle(code, checked)
                              }
                            />
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
                              disabled={isMutating || code.hasAttempt}
                              className="hover:bg-destructive/10 hover:text-destructive"
                              aria-label={`Delete ${code.code}`}
                              onClick={() => setPendingDelete(code)}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
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
        title="Delete access code?"
        description={
          pendingDelete
            ? `This will permanently delete code ${pendingDelete.code}. This cannot be undone.`
            : "This cannot be undone."
        }
        confirmLabel="Delete code"
        requireTypedConfirm
        isPending={isMutating}
        onConfirm={confirmDelete}
      />

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Generate access codes</SheetTitle>
            <SheetDescription>
              Choose a published quiz set and how many codes to create. Codes
              start as available — toggle Issued when you hand them out.
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
            <Button onClick={handleSave} disabled={isMutating}>
              Generate {form.quantity || "…"} codes
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}
