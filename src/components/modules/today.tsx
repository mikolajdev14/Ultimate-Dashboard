"use client";

import {
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronRight,
  Dumbbell,
  Flame,
  Pause,
  Pin,
  PinOff,
  Play,
  Plus,
  Square,
  Timer,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Section } from "@/components/section";
import { Progress } from "@/components/ui/progress";
import {
  cn,
  formatShortDate,
  isHabitDueToday,
  lastNDates,
  toIsoDate,
  weekdayShort,
} from "@/lib/utils";
import { useAppStore } from "@/stores/app-store";
import { useDataStore } from "@/stores/data-store";

const FOCUS_PRESETS = [15, 25, 50];

export function TodayModule() {
  const today = toIsoDate();
  const last7 = useMemo(() => lastNDates(7), []);

  const tasks = useDataStore((state) => state.tasks);
  const habits = useDataStore((state) => state.habits);
  const habitLogs = useDataStore((state) => state.habitLogs);
  const sessions = useDataStore((state) => state.sessions);
  const calendarEvents = useDataStore((state) => state.calendarEvents);
  const focusSessions = useDataStore((state) => state.focusSessions);
  const defaultMinutes = useDataStore(
    (state) => state.settings.defaultFocusMinutes,
  );
  const toggleHabitLog = useDataStore((state) => state.toggleHabitLog);
  const updateTask = useDataStore((state) => state.updateTask);
  const addFocusSession = useDataStore((state) => state.addFocusSession);

  const setActiveModule = useAppStore((state) => state.setActiveModule);
  const openTaskQuickAdd = useAppStore((state) => state.openTaskQuickAdd);
  const focus = useAppStore((state) => state.focus);
  const startFocus = useAppStore((state) => state.startFocus);
  const pauseFocus = useAppStore((state) => state.pauseFocus);
  const resumeFocus = useAppStore((state) => state.resumeFocus);
  const cancelFocus = useAppStore((state) => state.cancelFocus);
  const finishFocus = useAppStore((state) => state.finishFocus);
  const pushToast = useAppStore((state) => state.pushToast);

  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!focus || focus.paused) return;
    if (focus.endsAt > now) return;
    const ended = finishFocus();
    if (ended) {
      addFocusSession({
        startedAt: new Date(
          ended.endsAt - ended.durationMinutes * 60 * 1000,
        ).toISOString(),
        durationMinutes: ended.durationMinutes,
        taskId: ended.taskId,
        taskTitle: ended.taskTitle,
      });
      pushToast({
        message: `Focus zakonczony: ${ended.durationMinutes} min ${
          ended.taskTitle ? `· ${ended.taskTitle}` : ""
        }`.trim(),
        tone: "success",
      });
      if (
        typeof window !== "undefined" &&
        "Notification" in window &&
        Notification.permission === "granted"
      ) {
        try {
          new Notification("Focus zakonczony", {
            body: ended.taskTitle
              ? `${ended.durationMinutes} min · ${ended.taskTitle}`
              : `${ended.durationMinutes} min skupienia`,
            icon: "/icon.svg",
          });
        } catch {
          // ignore notification errors
        }
      }
    }
  }, [focus, now, finishFocus, addFocusSession, pushToast]);

  const pinned = tasks
    .filter((task) => task.pinnedForToday && task.status !== "done")
    .slice(0, 3);
  const fallback = tasks
    .filter((task) => task.status !== "done")
    .sort((a, b) => {
      const order = { high: 0, medium: 1, low: 2 } as const;
      return order[a.priority] - order[b.priority];
    });
  const priorities = pinned.length ? pinned : fallback.slice(0, 3);

  const dueToday = habits.filter((habit) =>
    isHabitDueToday(habit.cadence, habit.weekdays, today),
  );
  const habitsDone = dueToday.filter((habit) =>
    habitLogs.some(
      (log) => log.habitId === habit.id && log.date === today,
    ),
  );
  const completion = dueToday.length
    ? Math.round((habitsDone.length / dueToday.length) * 100)
    : 0;

  const lastSession = [...sessions].sort((a, b) =>
    b.date.localeCompare(a.date),
  )[0];

  const focusToday = focusSessions
    .filter((session) => session.startedAt.startsWith(today))
    .reduce((sum, session) => sum + session.durationMinutes, 0);

  const remainingSeconds = focus
    ? focus.paused
      ? Math.round((focus.pausedRemaining ?? 0) / 1000)
      : Math.max(0, Math.round((focus.endsAt - now) / 1000))
    : 0;
  const focusProgress = focus
    ? Math.min(
        100,
        Math.max(
          0,
          ((focus.durationMinutes * 60 - remainingSeconds) /
            Math.max(1, focus.durationMinutes * 60)) *
            100,
        ),
      )
    : 0;

  function handleStartFocus(minutes: number, taskId?: string, title?: string) {
    startFocus({
      taskId,
      taskTitle: title,
      durationMinutes: minutes,
    });
  }

  function handleStopFocus() {
    const ended = finishFocus();
    if (!ended) return;
    const elapsed = Math.max(
      0,
      ended.durationMinutes -
        Math.round(
          (ended.paused
            ? ended.pausedRemaining ?? 0
            : Math.max(0, ended.endsAt - Date.now())) /
            60 /
            1000,
        ),
    );
    if (elapsed >= 1) {
      addFocusSession({
        startedAt: new Date().toISOString(),
        durationMinutes: elapsed,
        taskId: ended.taskId,
        taskTitle: ended.taskTitle,
      });
    }
    pushToast({
      message: `Focus przerwany${elapsed ? ` po ${elapsed} min` : ""}`,
      tone: "info",
    });
  }

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden bg-gradient-to-br from-violet-500/25 via-slate-950 to-slate-950">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Badge tone="violet">
              {new Date().toLocaleDateString("pl-PL", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </Badge>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
              Dzisiaj liczy si&#281; tylko to.
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">
              Trzy rzeczy o najwy&#380;szym priorytecie, kilka habit&oacute;w i
              jeden trening. Bez przeci&#261;&#380;ania listy.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Stat label="Habity" value={`${habitsDone.length}/${dueToday.length}`} />
            <Stat label="Focus" value={`${focusToday} min`} />
            <Stat label="Priorytety" value={`${priorities.length}/3`} />
          </div>
        </div>
      </Card>

      <Section
        title="Top 3 na dzis"
        subtitle={
          pinned.length
            ? "Pinniete priorytety"
            : "Auto-pick: najwyzszy priorytet sposrod aktywnych taskow"
        }
        action="Dodaj task"
        onAction={openTaskQuickAdd}
        headerExtra={
          <Button onClick={() => setActiveModule("Tasks")}>
            <ChevronRight className="mr-2 size-4" />
            Wszystkie taski
          </Button>
        }
      >
        {priorities.length === 0 ? (
          <p className="rounded-3xl border border-dashed border-white/10 bg-white/[0.02] p-6 text-center text-sm text-slate-400">
            Brak taskow.{" "}
            <button
              type="button"
              onClick={openTaskQuickAdd}
              className="font-semibold text-violet-200 underline-offset-2 hover:underline"
            >
              Dodaj pierwszy
            </button>
            .
          </p>
        ) : (
          <div className="space-y-2">
            {priorities.map((task, index) => (
              <div
                key={task.id}
                className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.04] p-3"
              >
                <span className="grid size-9 place-items-center rounded-2xl bg-violet-500/20 text-sm font-semibold text-violet-100">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{task.title}</p>
                  <p className="text-xs text-slate-500">
                    {task.priority} · {task.status}
                    {task.dueDate ? ` · ${formatShortDate(task.dueDate)}` : ""}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="primary"
                    className="h-9 text-xs"
                    onClick={() =>
                      handleStartFocus(defaultMinutes, task.id, task.title)
                    }
                    disabled={Boolean(focus)}
                  >
                    <Timer className="mr-2 size-3.5" />
                    Focus {defaultMinutes}m
                  </Button>
                  <Button
                    className="h-9 text-xs"
                    onClick={() =>
                      updateTask(task.id, {
                        status:
                          task.status === "doing" ? "done" : "doing",
                      })
                    }
                  >
                    {task.status === "doing" ? "Done" : "Doing"}
                  </Button>
                  <button
                    type="button"
                    onClick={() =>
                      updateTask(task.id, {
                        pinnedForToday: !task.pinnedForToday,
                      })
                    }
                    className="grid size-9 place-items-center rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.1]"
                    aria-label="Przypnij/Odepnij"
                  >
                    {task.pinnedForToday ? (
                      <PinOff className="size-3.5" />
                    ) : (
                      <Pin className="size-3.5" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Section
          title="Focus timer"
          subtitle="Krotkie bloki skupienia powiazane z taskiem"
        >
          {focus ? (
            <div className="rounded-3xl border border-violet-300/30 bg-violet-500/10 p-5">
              <p className="text-xs uppercase tracking-wider text-violet-200/80">
                {focus.paused ? "Wstrzymane" : "W trakcie"}
              </p>
              <p className="mt-2 text-3xl font-semibold text-white tabular-nums">
                {formatDuration(remainingSeconds)}
              </p>
              <p className="mt-1 text-sm text-slate-300">
                {focus.taskTitle ?? "Skupienie ogolne"}
              </p>
              <Progress className="mt-4" value={focusProgress} />
              <div className="mt-4 flex flex-wrap gap-2">
                {focus.paused ? (
                  <Button variant="primary" onClick={resumeFocus}>
                    <Play className="mr-2 size-4" />
                    Wznow
                  </Button>
                ) : (
                  <Button onClick={pauseFocus}>
                    <Pause className="mr-2 size-4" />
                    Pauza
                  </Button>
                )}
                <Button variant="danger" onClick={handleStopFocus}>
                  <Square className="mr-2 size-4" />
                  Zakoncz
                </Button>
                <Button onClick={cancelFocus}>Porzucz</Button>
              </div>
            </div>
          ) : (
            <div className="rounded-3xl border border-white/[0.08] bg-white/[0.04] p-5">
              <p className="text-sm text-slate-300">
                Wybierz dlugosc i ruszaj. Po skonczeniu dodam wpis do historii.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {FOCUS_PRESETS.map((minutes) => (
                  <Button
                    key={minutes}
                    variant={minutes === defaultMinutes ? "primary" : "ghost"}
                    onClick={() =>
                      handleStartFocus(
                        minutes,
                        priorities[0]?.id,
                        priorities[0]?.title,
                      )
                    }
                  >
                    <Timer className="mr-2 size-4" />
                    {minutes} min
                  </Button>
                ))}
              </div>
              <p className="mt-4 text-xs text-slate-500">
                Najwyzszy priorytet zostanie przypisany automatycznie:{" "}
                <span className="text-slate-200">
                  {priorities[0]?.title ?? "brak"}
                </span>
              </p>
            </div>
          )}

          <div className="mt-4 rounded-3xl border border-white/[0.08] bg-white/[0.03] p-4">
            <p className="text-sm font-semibold">Historia focusow (ostatnie 6)</p>
            {focusSessions.length === 0 ? (
              <p className="mt-3 text-xs text-slate-400">
                Po pierwszym focusie pojawi sie historia.
              </p>
            ) : (
              <ul className="mt-3 space-y-2 text-sm">
                {focusSessions.slice(0, 6).map((session) => (
                  <li
                    key={session.id}
                    className="flex items-center justify-between rounded-2xl bg-white/[0.04] px-3 py-2"
                  >
                    <span className="truncate">
                      {session.taskTitle ?? "Skupienie"}
                    </span>
                    <span className="text-xs text-slate-400">
                      {session.durationMinutes} min ·{" "}
                      {formatShortDate(session.startedAt.slice(0, 10))}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Section>

        <Section
          title="Habity na dzis"
          subtitle={`${habitsDone.length}/${dueToday.length} ukonczone · ${completion}%`}
          headerExtra={
            <Button onClick={() => setActiveModule("Habits")}>
              <Plus className="mr-2 size-4" />
              Habity
            </Button>
          }
        >
          {dueToday.length === 0 ? (
            <p className="rounded-3xl border border-dashed border-white/10 bg-white/[0.02] p-6 text-center text-sm text-slate-400">
              Brak habitow zaplanowanych na dzis.
            </p>
          ) : (
            <div className="space-y-2">
              {dueToday.map((habit) => {
                const done = habitLogs.some(
                  (log) => log.habitId === habit.id && log.date === today,
                );
                return (
                  <button
                    key={habit.id}
                    type="button"
                    onClick={() => toggleHabitLog(habit.id, today)}
                    className={cn(
                      "flex w-full items-center justify-between gap-3 rounded-2xl border px-3 py-2 text-left transition",
                      done
                        ? "border-emerald-400/30 bg-emerald-500/10"
                        : "border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.08]",
                    )}
                  >
                    <span className="flex items-center gap-3">
                      <span
                        className={cn(
                          "grid size-9 place-items-center rounded-full",
                          done
                            ? "text-slate-950"
                            : "border border-white/15 bg-white/[0.04] text-slate-500",
                        )}
                        style={done ? { backgroundColor: habit.color } : undefined}
                      >
                        <Check className="size-4" />
                      </span>
                      <span>
                        <span className="block text-sm font-semibold">
                          {habit.title}
                        </span>
                        <span className="block text-[11px] text-slate-500">
                          {habit.reminderTime
                            ? `Przypomnienie ${habit.reminderTime}`
                            : habit.cadence === "daily"
                              ? "Codziennie"
                              : "Wybrane dni"}
                        </span>
                      </span>
                    </span>
                    <Badge tone={done ? "green" : "neutral"}>
                      {done ? "Zrobione" : "Klik"}
                    </Badge>
                  </button>
                );
              })}
            </div>
          )}

          <div className="mt-4 grid grid-cols-7 gap-2">
            {last7.map((date) => {
              const due = habits.filter((habit) =>
                isHabitDueToday(habit.cadence, habit.weekdays, date),
              );
              const ratio = due.length
                ? Math.round(
                    (habitLogs.filter(
                      (log) => log.date === date && due.some((h) => h.id === log.habitId),
                    ).length /
                      due.length) *
                      100,
                  )
                : 0;
              return (
                <div
                  key={date}
                  className="flex flex-col items-center gap-1 rounded-xl bg-white/[0.04] px-2 py-2 text-[10px] uppercase tracking-wider text-slate-400"
                >
                  <span>{weekdayShort(date)}</span>
                  <span className="text-sm font-semibold text-slate-200">
                    {ratio}%
                  </span>
                </div>
              );
            })}
          </div>
        </Section>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>Trening dnia</CardTitle>
              <p className="mt-1 text-sm text-slate-500">
                Ostatnia sesja zapisana w treningu
              </p>
            </div>
            <Dumbbell className="size-4 text-slate-500" />
          </div>
          {lastSession ? (
            <div className="mt-4 rounded-2xl border border-white/[0.08] bg-white/[0.04] p-3">
              <p className="text-sm font-semibold">{lastSession.name}</p>
              <p className="text-xs text-slate-500">
                {formatShortDate(lastSession.date)} · {lastSession.sets.length}{" "}
                serii
              </p>
              {lastSession.notes ? (
                <p className="mt-2 text-xs text-slate-400">{lastSession.notes}</p>
              ) : null}
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-400">
              Brak sesji. Otworz trening, aby zaplanowac pierwsza.
            </p>
          )}
          <Button
            className="mt-4 w-full"
            onClick={() => setActiveModule("Workout")}
          >
            <Dumbbell className="mr-2 size-4" />
            Otworz trening
          </Button>
        </Card>

        <Card>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>Plan dnia</CardTitle>
              <p className="mt-1 text-sm text-slate-500">
                Sloty czasowe z kalendarza
              </p>
            </div>
            <CalendarClock className="size-4 text-slate-500" />
          </div>
          {calendarEvents.length === 0 ? (
            <p className="mt-4 text-sm text-slate-400">Brak slotow.</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {calendarEvents.slice(0, 4).map((event) => (
                <li
                  key={event.id}
                  className="flex items-center gap-3 rounded-2xl bg-white/[0.04] px-3 py-2 text-sm"
                >
                  <span className="rounded-xl bg-white/[0.06] px-2 py-1 text-xs font-semibold">
                    {event.time}
                  </span>
                  <span className="min-w-0 truncate flex-1">{event.title}</span>
                  <span className="text-xs text-slate-500">{event.tag}</span>
                </li>
              ))}
            </ul>
          )}
          <Button
            className="mt-4 w-full"
            onClick={() => setActiveModule("Calendar")}
          >
            <CalendarClock className="mr-2 size-4" />
            Otworz kalendarz
          </Button>
        </Card>
      </div>

      {habits.length > 0 ? (
        <Section title="Mini insight" subtitle="Najdluzszy streak w habitach">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {habits.slice(0, 6).map((habit) => {
              const dates = new Set(
                habitLogs
                  .filter((log) => log.habitId === habit.id)
                  .map((log) => log.date),
              );
              let streak = 0;
              for (let i = 0; ; i += 1) {
                const date = lastNDates(i + 1)[0];
                if (dates.has(date)) streak += 1;
                else if (i === 0) continue;
                else break;
              }
              return (
                <div
                  key={habit.id}
                  className="flex items-center justify-between rounded-2xl border border-white/[0.08] bg-white/[0.04] px-3 py-2"
                >
                  <span className="flex items-center gap-2 text-sm">
                    <span
                      className="inline-block size-2.5 rounded-full"
                      style={{ backgroundColor: habit.color }}
                    />
                    {habit.title}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                    <Flame className="size-3.5 text-amber-300" />
                    {streak} d
                  </span>
                </div>
              );
            })}
          </div>
        </Section>
      ) : null}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-3 text-right">
      <p className="text-[10px] uppercase tracking-wider text-slate-500">
        {label}
      </p>
      <p className="mt-1 flex items-center justify-end gap-1 text-lg font-semibold">
        <CheckCircle2 className="size-3.5 text-emerald-300" />
        {value}
      </p>
    </div>
  );
}

function formatDuration(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
