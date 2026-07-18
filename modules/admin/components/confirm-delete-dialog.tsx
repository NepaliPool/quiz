"use client";

import { useEffect, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const CONFIRM_WORD = "confirm";

export function ConfirmDeleteDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Delete",
  requireTypedConfirm = false,
  isPending = false,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: ReactNode;
  confirmLabel?: string;
  /** When true, user must type "confirm" to enable delete. */
  requireTypedConfirm?: boolean;
  isPending?: boolean;
  onConfirm: () => void;
}) {
  const [typed, setTyped] = useState("");
  const canConfirm = requireTypedConfirm
    ? typed.trim() === CONFIRM_WORD
    : true;

  useEffect(() => {
    if (!open) {
      setTyped("");
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {requireTypedConfirm ? (
          <div className="space-y-2">
            <Label htmlFor="confirm-delete-input">
              Type <span className="font-mono">{CONFIRM_WORD}</span> to delete
            </Label>
            <Input
              id="confirm-delete-input"
              value={typed}
              onChange={(event) => setTyped(event.target.value)}
              placeholder={CONFIRM_WORD}
              autoComplete="off"
              autoFocus
            />
          </div>
        ) : null}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => {
              if (!canConfirm || isPending) return;
              onConfirm();
            }}
            disabled={isPending || !canConfirm}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
