import { cn } from "@/lib/utils";

export function KygLogo({
  size = "md",
  className,
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const box =
    size === "lg"
      ? "h-16 w-16 rounded-2xl p-3"
      : size === "sm"
        ? "h-9 w-9 rounded-xl p-1.5"
        : "h-12 w-12 rounded-2xl p-2.5";
  return (
    <div className={cn("flex items-center justify-center bg-card shadow-card", box, className)}>
      <img src="/brand/pioneer-mark.png" alt="Pioneer" className="h-full w-full object-contain" />
    </div>
  );
}
