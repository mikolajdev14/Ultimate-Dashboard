import { type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <section
      className={cn(
        "rounded-[1.5rem] border border-white/[0.08] bg-slate-950/60 p-4 shadow-xl shadow-black/20 backdrop-blur sm:rounded-[2rem] sm:p-5",
        className,
      )}
      {...props}
    />
  );
}

export function CardTitle({
  className,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cn(
        "text-[15px] font-semibold tracking-tight text-white sm:text-base",
        className,
      )}
      {...props}
    />
  );
}
