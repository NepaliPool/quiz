import type { AccessCodeStatus } from "@/dal/admin/get-access-codes";
import { cn } from "@/lib/utils";

export const ACCESS_CODE_STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "available", label: "Available" },
  { value: "issued", label: "Issued" },
  { value: "used", label: "Used" },
  { value: "expired", label: "Expired" },
] as const;

const STATUS_STYLES: Record<
  AccessCodeStatus,
  {
    label: string;
    dot: string;
  }
> = {
  available: {
    label: "Available",
    dot: "bg-emerald-500",
  },
  issued: {
    label: "Issued",
    dot: "bg-sky-500",
  },
  used: {
    label: "Used",
    dot: "bg-slate-500",
  },
  expired: {
    label: "Expired",
    dot: "bg-amber-500",
  },
};

export function AccessCodeStatusDot({
  status,
  className,
}: {
  status: AccessCodeStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "size-2 shrink-0 rounded-full",
        STATUS_STYLES[status].dot,
        className,
      )}
      aria-hidden
    />
  );
}

export function AccessCodeStatusLabel({
  status,
  className,
}: {
  status: AccessCodeStatus;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2 text-sm", className)}>
      <AccessCodeStatusDot status={status} />
      {STATUS_STYLES[status].label}
    </span>
  );
}
