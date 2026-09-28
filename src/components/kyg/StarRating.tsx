import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

function ratingColor(value: number) {
  if (value <= 0) return "text-muted-foreground";
  if (value < 2) return "text-destructive";
  if (value < 3.5) return "text-warning";
  if (value < 4.5) return "text-gold";
  return "text-success";
}

/** Mostra 5 estrelas com preenchimento parcial (ex.: 1.4) e o número ao lado, colorido. */
export function StarRating({
  value,
  size = "sm",
  showValue = true,
  className,
}: {
  value: number;
  size?: "xs" | "sm" | "md";
  showValue?: boolean;
  className?: string;
}) {
  const starSize = size === "md" ? "h-5 w-5" : size === "sm" ? "h-4 w-4" : "h-3.5 w-3.5";
  const color = ratingColor(value);

  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      <span className="relative inline-flex">
        <span className="flex gap-0.5 text-border">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className={cn(starSize, "fill-current")} />
          ))}
        </span>
        <span
          className={cn("absolute inset-0 flex gap-0.5 overflow-hidden", color)}
          style={{ width: `${Math.max(0, Math.min(value, 5)) * 20}%` }}
        >
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className={cn(starSize, "shrink-0 fill-current")} />
          ))}
        </span>
      </span>
      {showValue ? (
        <span className={cn("text-xs font-bold", color)}>{value.toFixed(1)}</span>
      ) : null}
    </span>
  );
}
