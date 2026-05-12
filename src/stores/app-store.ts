"use client";

import { create } from "zustand";

type DeferredInstallPrompt = {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export type ToastTone = "info" | "success" | "danger";

export type Toast = {
  id: string;
  message: string;
  tone: ToastTone;
  actionLabel?: string;
  onAction?: () => void;
};

export type FocusState = {
  taskId?: string;
  taskTitle?: string;
  durationMinutes: number;
  endsAt: number;
  paused: boolean;
  pausedRemaining?: number;
};

type AppState = {
  activeModule: string;
  installPrompt: DeferredInstallPrompt | null;
  taskQuickAddOpen: boolean;
  searchQuery: string;
  toasts: Toast[];
  focus: FocusState | null;
  setActiveModule: (module: string) => void;
  setInstallPrompt: (prompt: DeferredInstallPrompt | null) => void;
  openTaskQuickAdd: () => void;
  closeTaskQuickAdd: () => void;
  setSearchQuery: (value: string) => void;
  pushToast: (toast: Omit<Toast, "id">) => string;
  removeToast: (id: string) => void;
  startFocus: (input: Omit<FocusState, "endsAt" | "paused" | "pausedRemaining"> & { endsAt?: number }) => void;
  pauseFocus: () => void;
  resumeFocus: () => void;
  cancelFocus: () => void;
  finishFocus: () => FocusState | null;
};

function uid() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export const useAppStore = create<AppState>((set, get) => ({
  activeModule: "Today",
  installPrompt: null,
  taskQuickAddOpen: false,
  searchQuery: "",
  toasts: [],
  focus: null,
  setActiveModule: (module) => set({ activeModule: module }),
  setInstallPrompt: (prompt) => set({ installPrompt: prompt }),
  openTaskQuickAdd: () => set({ taskQuickAddOpen: true }),
  closeTaskQuickAdd: () => set({ taskQuickAddOpen: false }),
  setSearchQuery: (value) => set({ searchQuery: value }),
  pushToast: (toast) => {
    const id = uid();
    set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }));
    setTimeout(() => {
      get().removeToast(id);
    }, 6000);
    return id;
  },
  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })),
  startFocus: ({ taskId, taskTitle, durationMinutes, endsAt }) =>
    set({
      focus: {
        taskId,
        taskTitle,
        durationMinutes,
        endsAt: endsAt ?? Date.now() + durationMinutes * 60 * 1000,
        paused: false,
      },
    }),
  pauseFocus: () =>
    set((state) =>
      state.focus
        ? {
            focus: {
              ...state.focus,
              paused: true,
              pausedRemaining: Math.max(0, state.focus.endsAt - Date.now()),
            },
          }
        : state,
    ),
  resumeFocus: () =>
    set((state) =>
      state.focus && state.focus.paused
        ? {
            focus: {
              ...state.focus,
              paused: false,
              endsAt: Date.now() + (state.focus.pausedRemaining ?? 0),
              pausedRemaining: undefined,
            },
          }
        : state,
    ),
  cancelFocus: () => set({ focus: null }),
  finishFocus: () => {
    const focus = get().focus;
    set({ focus: null });
    return focus;
  },
}));
