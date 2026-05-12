"use client";

import { CheckCircle2, Info, TriangleAlert, X } from "lucide-react";
import { useAppStore } from "@/stores/app-store";
import { cn } from "@/lib/utils";

const toneIcon = {
  info: Info,
  success: CheckCircle2,
  danger: TriangleAlert,
};

const toneClasses = {
  info: "border-white/10 bg-white/[0.06] text-slate-100",
  success: "border-emerald-400/30 bg-emerald-500/10 text-emerald-100",
  danger: "border-rose-400/30 bg-rose-500/10 text-rose-100",
};

export function ToastDock() {
  const toasts = useAppStore((state) => state.toasts);
  const removeToast = useAppStore((state) => state.removeToast);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex justify-center px-4 lg:bottom-6">
      <div className="flex w-full max-w-md flex-col gap-2">
        {toasts.map((toast) => {
          const Icon = toneIcon[toast.tone];
          return (
            <div
              key={toast.id}
              className={cn(
                "pointer-events-auto flex items-center gap-3 rounded-2xl border px-3 py-2 text-sm shadow-2xl shadow-black/20 backdrop-blur",
                toneClasses[toast.tone],
              )}
            >
              <Icon className="size-4 shrink-0" />
              <p className="min-w-0 flex-1 truncate">{toast.message}</p>
              {toast.actionLabel && toast.onAction ? (
                <button
                  type="button"
                  onClick={() => {
                    toast.onAction?.();
                    removeToast(toast.id);
                  }}
                  className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold hover:bg-white/20"
                >
                  {toast.actionLabel}
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="grid size-7 place-items-center rounded-full bg-white/[0.06] hover:bg-white/[0.12]"
                aria-label="Zamknij"
              >
                <X className="size-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
