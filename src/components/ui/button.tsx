import { type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
};

const variants = {
  primary:
    "bg-violet-300 text-slate-950 shadow-[0_0_28px_rgba(167,139,250,0.35)] hover:bg-violet-200",
  secondary:
    "border border-white/10 bg-white/[0.07] text-white hover:bg-white/[0.12]",
  ghost: "text-slate-300 hover:bg-white/[0.08] hover:text-white",
  danger:
    "bg-rose-500/15 text-rose-200 ring-1 ring-rose-500/30 hover:bg-rose-500/25",
};

export function Button({
  className,
  variant = "secondary",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex h-11 items-center justify-center whitespace-nowrap rounded-2xl px-4 text-sm font-semibold transition disabled:pointer-events-none disabled:opacity-50 sm:h-10",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
