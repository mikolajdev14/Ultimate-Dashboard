"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg";
};

const sizes = {
  sm: "max-w-md",
  md: "max-w-xl",
  lg: "max-w-3xl",
};

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  size = "md",
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex justify-center overflow-y-auto bg-slate-950/70 px-0 backdrop-blur-sm sm:items-center sm:px-4 sm:py-6">
      <button
        type="button"
        onClick={onClose}
        aria-label="Zamknij"
        className="fixed inset-0 cursor-default"
      />
      <div
        className={cn(
          "relative mt-auto w-full overflow-hidden rounded-t-3xl border border-white/[0.08] bg-[#0c0f23] p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-2xl shadow-black/40 sm:mt-0 sm:rounded-3xl sm:p-6 sm:pb-6",
          sizes[size],
        )}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-white sm:text-lg">
              {title}
            </h3>
            {description ? (
              <p className="mt-1 text-xs leading-5 text-slate-400 sm:text-sm">
                {description}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-9 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/[0.06] text-slate-300 hover:bg-white/[0.12]"
            aria-label="Zamknij"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="mt-5">{children}</div>
      </div>
    </div>
  );
}
