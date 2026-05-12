"use client";

import {
  Bell,
  Download,
  LayoutGrid,
  Menu,
  MoonStar,
  Pause,
  Play,
  Plus,
  Search,
  Smartphone,
  Sparkles,
  Sun,
  Timer,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { navItems } from "@/lib/demo-data";
import { downloadBlob, toJson } from "@/lib/export";
import { cn, currentYearMonth } from "@/lib/utils";
import { useAppStore } from "@/stores/app-store";
import { useDataStore } from "@/stores/data-store";
import { Button } from "@/components/ui/button";
import { QuickAddTaskModal } from "@/components/quick-add-task-modal";
import { ToastDock } from "@/components/toast-dock";

const VALID_MODULES = new Set(navItems.map((item) => item.label));

const MOBILE_PRIMARY = ["Today", "Habits", "Tasks", "Workout"] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const activeModule = useAppStore((state) => state.activeModule);
  const setActiveModule = useAppStore((state) => state.setActiveModule);
  const installPrompt = useAppStore((state) => state.installPrompt);
  const setInstallPrompt = useAppStore((state) => state.setInstallPrompt);
  const openTaskQuickAdd = useAppStore((state) => state.openTaskQuickAdd);
  const searchQuery = useAppStore((state) => state.searchQuery);
  const setSearchQuery = useAppStore((state) => state.setSearchQuery);
  const focus = useAppStore((state) => state.focus);
  const pauseFocus = useAppStore((state) => state.pauseFocus);
  const resumeFocus = useAppStore((state) => state.resumeFocus);
  const cancelFocus = useAppStore((state) => state.cancelFocus);
  const pushToast = useAppStore((state) => state.pushToast);

  const data = useDataStore();
  const theme = useDataStore((state) => state.settings.theme);
  const habitReminderTime = useDataStore(
    (state) => state.settings.habitReminderTime,
  );
  const notificationsEnabled = useDataStore(
    (state) => state.settings.notificationsEnabled,
  );
  const habits = useDataStore((state) => state.habits);
  const habitLogs = useDataStore((state) => state.habitLogs);
  const updateSettings = useDataStore((state) => state.updateSettings);
  const generateRecurringForMonth = useDataStore(
    (state) => state.generateRecurringForMonth,
  );

  const searchRef = useRef<HTMLInputElement | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.dataset.theme = theme;
    document.documentElement.classList.toggle("theme-light", theme === "light");
  }, [theme]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const moduleParam = params.get("module");
    if (moduleParam && VALID_MODULES.has(moduleParam)) {
      setActiveModule(moduleParam);
    }
  }, [setActiveModule]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (activeModule === "Today") {
      url.searchParams.delete("module");
    } else {
      url.searchParams.set("module", activeModule);
    }
    window.history.replaceState(null, "", url.toString());
  }, [activeModule]);

  useEffect(() => {
    const generated = generateRecurringForMonth(currentYearMonth());
    if (generated > 0) {
      pushToast({
        message: `Wygenerowano ${generated} powtarzajacy(ch) sie wydatkow w tym miesiacu`,
        tone: "info",
      });
    }
  }, [generateRecurringForMonth, pushToast]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!notificationsEnabled) return;
    if (!("Notification" in window)) return;
    if (Notification.permission !== "granted") return;
    const id = window.setInterval(() => {
      const current = new Date();
      const stamp = `${String(current.getHours()).padStart(2, "0")}:${String(
        current.getMinutes(),
      ).padStart(2, "0")}`;
      const todayIso = current.toISOString().slice(0, 10);
      const storageKey = `habit-reminder:${todayIso}`;
      if (typeof sessionStorage !== "undefined") {
        if (sessionStorage.getItem(storageKey)) return;
      }
      const due = habits.filter(
        (habit) => habit.reminderTime && habit.reminderTime === stamp,
      );
      if (!due.length && habitReminderTime !== stamp) return;
      const undone = habits.filter(
        (habit) =>
          !habitLogs.some(
            (log) => log.habitId === habit.id && log.date === todayIso,
          ),
      );
      if (!undone.length) return;
      try {
        new Notification("Habity czekaja", {
          body: undone
            .slice(0, 3)
            .map((habit) => habit.title)
            .join(", "),
          icon: "/icon.svg",
        });
        if (typeof sessionStorage !== "undefined") {
          sessionStorage.setItem(storageKey, "1");
        }
      } catch {
        // ignore notification errors
      }
    }, 30_000);
    return () => window.clearInterval(id);
  }, [notificationsEnabled, habitReminderTime, habits, habitLogs]);

  useEffect(() => {
    function onBeforeInstall(event: Event) {
      event.preventDefault();
      setInstallPrompt(
        event as unknown as ReturnType<typeof useAppStore.getState>["installPrompt"],
      );
    }
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    return () =>
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
  }, [setInstallPrompt]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const inEditable =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);
      if (inEditable) return;
      if (event.key === "/") {
        event.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
      } else if (event.key.toLowerCase() === "n") {
        event.preventDefault();
        openTaskQuickAdd();
      } else if (event.key === "?") {
        event.preventDefault();
        pushToast({
          message: "Skroty: / szukanie, n nowy task",
          tone: "info",
        });
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openTaskQuickAdd, pushToast]);

  const filteredNavItems = useMemo(() => {
    if (!searchQuery.trim()) return navItems;
    const lower = searchQuery.toLowerCase();
    return navItems.filter((item) => item.label.toLowerCase().includes(lower));
  }, [searchQuery]);

  function handleExport() {
    const snapshot = {
      habits: data.habits,
      habitLogs: data.habitLogs,
      taskProjects: data.taskProjects,
      tasks: data.tasks,
      taskTemplates: data.taskTemplates,
      exercises: data.exercises,
      sessions: data.sessions,
      expenseCategories: data.expenseCategories,
      expenses: data.expenses,
      goals: data.goals,
      notes: data.notes,
      bodyMetrics: data.bodyMetrics,
      calendarEvents: data.calendarEvents,
      focusSessions: data.focusSessions,
      settings: data.settings,
      exportedAt: new Date().toISOString(),
    };
    downloadBlob(
      `ultimate-dashboard-${new Date().toISOString().slice(0, 10)}.json`,
      toJson(snapshot),
      "application/json",
    );
  }

  async function handleInstall() {
    if (!installPrompt) return;
    await installPrompt.prompt();
    setInstallPrompt(null);
  }

  function toggleTheme() {
    updateSettings({ theme: theme === "dark" ? "light" : "dark" });
  }

  const focusRemaining = focus
    ? focus.paused
      ? Math.round((focus.pausedRemaining ?? 0) / 1000)
      : Math.max(0, Math.round((focus.endsAt - now) / 1000))
    : 0;

  return (
    <div
      className={cn(
        "min-h-screen bg-[#060713] text-slate-100",
        theme === "light" && "bg-slate-50 text-slate-900",
      )}
    >
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_25%_0%,rgba(124,58,237,0.24),transparent_32%),radial-gradient(circle_at_78%_20%,rgba(56,189,248,0.15),transparent_28%)]" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-[1580px]">
        <aside className="sticky top-0 hidden h-screen w-72 shrink-0 border-r border-white/[0.08] bg-black/25 p-5 backdrop-blur-xl lg:block">
          <div className="mb-7 flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-2xl bg-white text-slate-950">
              <Sparkles className="size-5" />
            </div>
            <div>
              <p className="text-sm font-semibold leading-none">Ultimate</p>
              <p className="text-xs text-slate-500">Life Dashboard</p>
            </div>
          </div>

          <nav className="space-y-1">
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              const active = item.label === activeModule;
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => setActiveModule(item.label)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition",
                    active
                      ? "bg-white/[0.09] text-white shadow-lg shadow-black/20"
                      : "text-slate-400 hover:bg-white/[0.06] hover:text-white",
                  )}
                >
                  <Icon className="size-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="mt-8 rounded-3xl border border-violet-300/20 bg-violet-300/10 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-violet-200">
              PWA ready
            </p>
            <p className="mt-3 text-sm font-semibold">Install on mobile</p>
            <p className="mt-1 text-xs leading-5 text-slate-400">
              Dodaj do ekranu glownego, uzywaj jak aplikacji natywnej.
            </p>
            <Button
              variant="primary"
              className="mt-4 w-full"
              onClick={handleInstall}
              disabled={!installPrompt}
            >
              <Smartphone className="mr-2 size-4" />
              {installPrompt ? "Zainstaluj" : "Dostepne na mobile"}
            </Button>
          </div>
        </aside>

        <main className="flex min-w-0 flex-1 flex-col pb-[calc(6.5rem+env(safe-area-inset-bottom))] lg:pb-0">
          <header
            className="sticky top-0 z-30 border-b border-white/[0.08] bg-[#060713]/85 backdrop-blur-xl"
            style={{ paddingTop: "env(safe-area-inset-top)" }}
          >
            <div className="flex items-center gap-2 px-4 py-3 sm:gap-3 sm:px-6 lg:px-8">
              <button
                type="button"
                onClick={() => setMobileNavOpen(true)}
                className="grid size-10 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/[0.06] lg:hidden"
                aria-label="Otworz nawigacje"
              >
                <Menu className="size-5" />
              </button>

              <div className="min-w-0 flex-1">
                <p className="hidden text-[10px] uppercase tracking-[0.35em] text-violet-200/70 sm:block">
                  Personal OS
                </p>
                <h1 className="truncate text-base font-semibold sm:text-2xl">
                  {activeModule}
                </h1>
              </div>

              <label className="hidden min-w-64 items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-3 py-2 text-sm text-slate-300 md:flex">
                <Search className="size-4 text-slate-500" />
                <input
                  ref={searchRef}
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Szukaj modulu lub taska (/)"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-slate-500"
                />
              </label>

              <button
                type="button"
                onClick={() => setMobileSearchOpen(true)}
                className="grid size-10 place-items-center rounded-2xl border border-white/10 bg-white/[0.06] md:hidden"
                aria-label="Szukaj"
              >
                <Search className="size-4" />
              </button>

              <button
                type="button"
                onClick={toggleTheme}
                className="hidden size-10 place-items-center rounded-2xl border border-white/10 bg-white/[0.06] md:grid"
                aria-label="Zmien motyw"
              >
                {theme === "dark" ? (
                  <Sun className="size-4" />
                ) : (
                  <MoonStar className="size-4" />
                )}
              </button>

              <Button
                variant="primary"
                className="hidden md:inline-flex"
                onClick={openTaskQuickAdd}
              >
                <Plus className="mr-2 size-4" />
                Quick add
              </Button>

              <Button
                variant="ghost"
                className="hidden lg:inline-flex"
                onClick={handleExport}
              >
                <Download className="mr-2 size-4" />
                Export
              </Button>
            </div>

            {focus ? (
              <button
                type="button"
                onClick={() => setActiveModule("Today")}
                className="mx-4 mb-3 flex items-center justify-between gap-3 rounded-2xl border border-violet-300/30 bg-violet-500/10 px-3 py-2 text-sm sm:mx-6 lg:mx-8"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <Timer className="size-4 shrink-0 text-violet-200" />
                  <span className="font-semibold tabular-nums">
                    {formatRemaining(focusRemaining)}
                  </span>
                  <span className="min-w-0 truncate text-slate-300">
                    {focus.taskTitle ?? "Skupienie"}
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-1">
                  {focus.paused ? (
                    <span
                      role="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        resumeFocus();
                      }}
                      className="grid size-8 place-items-center rounded-full bg-white/[0.1] hover:bg-white/[0.2]"
                      aria-label="Wznow"
                    >
                      <Play className="size-3.5" />
                    </span>
                  ) : (
                    <span
                      role="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        pauseFocus();
                      }}
                      className="grid size-8 place-items-center rounded-full bg-white/[0.1] hover:bg-white/[0.2]"
                      aria-label="Pauza"
                    >
                      <Pause className="size-3.5" />
                    </span>
                  )}
                  <span
                    role="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      cancelFocus();
                    }}
                    className="grid size-8 place-items-center rounded-full bg-white/[0.1] hover:bg-rose-500/40"
                    aria-label="Zakoncz"
                  >
                    <X className="size-3.5" />
                  </span>
                </span>
              </button>
            ) : null}
          </header>

          {children}
        </main>
      </div>

      <button
        type="button"
        onClick={openTaskQuickAdd}
        className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-4 z-40 grid size-14 place-items-center rounded-full bg-violet-300 text-slate-950 shadow-[0_18px_45px_-12px_rgba(167,139,250,0.6)] transition active:scale-95 lg:hidden"
        aria-label="Quick add task"
      >
        <Plus className="size-6" />
      </button>

      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-white/[0.08] bg-[#070816]/95 backdrop-blur-xl lg:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="mx-auto grid max-w-md grid-cols-5 gap-1 px-3 py-2">
          {MOBILE_PRIMARY.map((label) => {
            const item = navItems.find((entry) => entry.label === label);
            if (!item) return null;
            const Icon = item.icon;
            const active = item.label === activeModule;
            return (
              <button
                key={item.label}
                type="button"
                onClick={() => setActiveModule(item.label)}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-2xl py-2 text-[11px]",
                  active ? "bg-white/[0.09] text-white" : "text-slate-500",
                )}
              >
                <Icon className="size-5" />
                {item.label.split(" ")[0]}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setMobileNavOpen(true)}
            className={cn(
              "flex flex-col items-center gap-1 rounded-2xl py-2 text-[11px]",
              !MOBILE_PRIMARY.includes(
                activeModule as (typeof MOBILE_PRIMARY)[number],
              )
                ? "bg-white/[0.09] text-white"
                : "text-slate-500",
            )}
          >
            <LayoutGrid className="size-5" />
            Wiecej
          </button>
        </div>
      </nav>

      {mobileSearchOpen ? (
        <div className="fixed inset-0 z-50 bg-slate-950/85 px-4 pt-[calc(env(safe-area-inset-top)+1rem)] backdrop-blur-md md:hidden">
          <div className="flex items-center gap-2">
            <div className="flex flex-1 items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-3 py-3">
              <Search className="size-4 text-slate-400" />
              <input
                autoFocus
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Szukaj modulu lub taska"
                className="w-full bg-transparent text-base outline-none placeholder:text-slate-500"
              />
            </div>
            <button
              type="button"
              onClick={() => setMobileSearchOpen(false)}
              className="grid size-11 place-items-center rounded-2xl border border-white/10 bg-white/[0.06]"
              aria-label="Zamknij"
            >
              <X className="size-4" />
            </button>
          </div>
          <p className="mt-4 text-xs uppercase tracking-wider text-slate-500">
            Moduly
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => {
                    setActiveModule(item.label);
                    setMobileSearchOpen(false);
                  }}
                  className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-3 text-sm text-left"
                >
                  <Icon className="size-4 text-slate-400" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {mobileNavOpen ? (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md lg:hidden">
          <button
            type="button"
            onClick={() => setMobileNavOpen(false)}
            className="absolute inset-0"
            aria-label="Zamknij menu"
          />
          <div
            className="relative ml-auto h-full w-full max-w-xs overflow-y-auto bg-[#0c0f23] p-5"
            style={{
              paddingTop: "calc(env(safe-area-inset-top) + 1.25rem)",
              paddingBottom: "calc(env(safe-area-inset-bottom) + 1.25rem)",
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="grid size-9 place-items-center rounded-2xl bg-white text-slate-950">
                  <Sparkles className="size-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold">Ultimate</p>
                  <p className="text-[11px] text-slate-500">Life Dashboard</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileNavOpen(false)}
                className="grid size-9 place-items-center rounded-2xl border border-white/10 bg-white/[0.06]"
                aria-label="Zamknij"
              >
                <X className="size-4" />
              </button>
            </div>

            <nav className="mt-6 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = item.label === activeModule;
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => {
                      setActiveModule(item.label);
                      setMobileNavOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm transition",
                      active
                        ? "bg-white/[0.09] text-white"
                        : "text-slate-400 hover:bg-white/[0.06] hover:text-white",
                    )}
                  >
                    <Icon className="size-4" />
                    {item.label}
                  </button>
                );
              })}
            </nav>

            <div className="mt-6 grid grid-cols-2 gap-2">
              <Button onClick={toggleTheme}>
                {theme === "dark" ? (
                  <Sun className="mr-2 size-4" />
                ) : (
                  <MoonStar className="mr-2 size-4" />
                )}
                {theme === "dark" ? "Jasny" : "Ciemny"}
              </Button>
              <Button onClick={handleExport}>
                <Download className="mr-2 size-4" />
                Export
              </Button>
              <Button
                onClick={() => {
                  setActiveModule("Settings");
                  setMobileNavOpen(false);
                }}
              >
                <Bell className="mr-2 size-4" />
                Powiadomienia
              </Button>
              <Button
                variant="primary"
                onClick={handleInstall}
                disabled={!installPrompt}
              >
                <Smartphone className="mr-2 size-4" />
                {installPrompt ? "Zainstaluj" : "PWA"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <QuickAddTaskModal />
      <ToastDock />
    </div>
  );
}

function formatRemaining(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
