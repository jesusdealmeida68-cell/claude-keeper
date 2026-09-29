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
      ? "h-16 rounded-2xl px-4 py-3"
      : size === "sm"
        ? "h-9 rounded-xl px-2.5 py-1.5"
        : "h-12 rounded-2xl px-3 py-2";
  return (
    <div className={cn("flex w-fit items-center justify-center bg-card shadow-card", box, className)}>
      <img src="/brand/pioneer-logo.png" alt="Pioneer" className="h-full w-auto object-contain" />
    </div>
  );
}
