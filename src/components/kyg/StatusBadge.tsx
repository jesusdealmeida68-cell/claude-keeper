import { cn } from "@/lib/utils";
import { CheckCircle2, Clock, XCircle } from "lucide-react";

export type SubmissionStatus = "pending" | "approved" | "rejected";

export const statusMeta: Record<
  SubmissionStatus,
  { label: string; icon: typeof Clock; className: string }
> = {
  pending: {
    label: "Em análise",
    icon: Clock,
    className: "bg-warning-soft text-warning",
  },
  approved: {
    label: "Aprovado",
    icon: CheckCircle2,
    className: "bg-success-soft text-success",
  },
  rejected: {
    label: "Não aprovado",
    icon: XCircle,
    className: "bg-destructive-soft text-destructive",
  },
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const meta = statusMeta[(status as SubmissionStatus) in statusMeta ? (status as SubmissionStatus) : "pending"];
  const Icon = meta.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
        meta.className,
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {meta.label}
    </span>
  );
}
