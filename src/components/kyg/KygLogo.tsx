import { cn } from "@/lib/utils";

export function KygLogo({ size = "md", className }: { size?: "sm" | "md" | "lg"; className?: string }) {
  const box =
    size === "lg" ? "h-16 w-16 text-2xl rounded-2xl" : size === "sm" ? "h-9 w-9 text-sm rounded-xl" : "h-12 w-12 text-lg rounded-2xl";
  return (
    <div
      className={cn(
        "flex items-center justify-center bg-primary font-bold tracking-tight text-gold shadow-card",
        box,
        className,
      )}
    >
      KYG
    </div>
  );
}
