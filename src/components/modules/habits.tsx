"use client";

import {
  Calendar,
  Check,
  CheckCircle2,
  Flame,
  MessageSquare,
  Pencil,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Section } from "@/components/section";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { habitSchema, type HabitInput } from "@/lib/schemas";
import {
  WEEKDAY_NAMES,
  cn,
  formatShortDate,
  isHabitDueToday,
  lastNDates,
  relativeDayLabel,
  shiftDate,
  toIsoDate,
  weekdayShort,
} from "@/lib/utils";
import { useAppStore } from "@/stores/app-store";
import {
  useDataStore,
  type Habit,
  type HabitLog,
} from "@/stores/data-store";

function startOfWeek(iso: string) {
  const date = new Date(iso);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return date.toISOString().slice(0, 10);
}

function inSameWeek(a: string, b: string) {
  return startOfWeek(a) === startOfWeek(b);
}

function habitStats(habit: Habit, logs: HabitLog[]) {
  const today = toIsoDate();
  const habitLogs = logs.filter((log) => log.habitId === habit.id);
  const dates = new Set(habitLogs.map((log) => log.date));

  let streak = 0;
  if (habit.cadence === "daily") {
    for (let i = 0; ; i += 1) {
      const date = lastNDates(i + 1)[0];
      if (!isHabitDueToday(habit.cadence, habit.weekdays, date)) continue;
      if (dates.has(date)) streak += 1;
      else if (i === 0 && date === today) continue;
      else break;
    }
    if (!dates.has(today) && streak > 0) {
      streak = 0;
      for (let i = 1; ; i += 1) {
        const date = lastNDates(i + 1)[0];
        if (!isHabitDueToday(habit.cadence, habit.weekdays, date)) continue;
        if (dates.has(date)) streak += 1;
        else break;
      }
    }
  } else {
    let weekCursor = startOfWeek(today);
    for (;;) {
      const hasInWeek = Array.from(dates).some((logged) =>
        inSameWeek(logged, weekCursor),
      );
      if (hasInWeek) {
        streak += 1;
        weekCursor = shiftDate(weekCursor, -7);
      } else {
        break;
      }
    }
  }

  const window30 = lastNDates(habit.cadence === "weekly" ? 84 : 30);
  const dueWindow = window30.filter((date) =>
    isHabitDueToday(habit.cadence, habit.weekdays, date),
  );
  const completedInWindow = dueWindow.filter((date) => dates.has(date)).length;
  const completionRate = Math.min(
    100,
    dueWindow.length
      ? (completedInWindow / dueWindow.length) * 100
      : 0,
  );

  const noteMap = new Map<string, string>();
  for (const log of habitLogs) {
    if (log.note) noteMap.set(log.date, log.note);
  }

  return {
    streak,
    completionRate,
    dates,
    notes: noteMap,
    completedInWindow,
    dueCount: dueWindow.length,
  };
}

const colors = ["#a78bfa", "#22c55e", "#f97316", "#38bdf8", "#f43f5e", "#facc15"];

export function HabitsModule() {
  const habits = useDataStore((state) => state.habits);
  const habitLogs = useDataStore((state) => state.habitLogs);
  const addHabit = useDataStore((state) => state.addHabit);
  const updateHabit = useDataStore((state) => state.updateHabit);
  const removeHabit = useDataStore((state) => state.removeHabit);
  const toggleHabitLog = useDataStore((state) => state.toggleHabitLog);
  const setHabitLogNote = useDataStore((state) => state.setHabitLogNote);
  const pushToast = useAppStore((state) => state.pushToast);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);
  const [noteContext, setNoteContext] = useState<
    | {
        habitId: string;
        habitTitle: string;
        date: string;
        current: string;
      }
    | null
  >(null);
  const [noteDraft, setNoteDraft] = useState("");

  const today = toIsoDate();
  const last7 = useMemo(() => lastNDates(7), []);
  const last30 = useMemo(() => lastNDates(30), []);

  const habitsWithStats = useMemo(() => {
    return habits.map((habit) => ({
      ...habit,
      ...habitStats(habit, habitLogs),
    }));
  }, [habits, habitLogs]);

  const editingHabit = habits.find((habit) => habit.id === editingId);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<HabitInput>({
    resolver: zodResolver(habitSchema),
    defaultValues: {
      title: "",
      cadence: "daily",
      color: colors[0],
      weekdays: [],
      reminderTime: "",
    },
  });

  const selectedColor = watch("color");
  const selectedCadence = watch("cadence");
  const selectedWeekdays = watch("weekdays") ?? [];

  function openCreate() {
    reset({
      title: "",
      cadence: "daily",
      color: colors[0],
      weekdays: [],
      reminderTime: "",
    });
    setEditingId(null);
    setModalOpen(true);
  }

  function openEdit(habit: Habit) {
    reset({
      title: habit.title,
      cadence: habit.cadence,
      color: habit.color,
      weekdays: habit.weekdays ?? [],
      reminderTime: habit.reminderTime ?? "",
    });
    setEditingId(habit.id);
    setModalOpen(true);
  }

  function onSubmit(values: HabitInput) {
    const payload: Omit<Habit, "id" | "createdAt"> = {
      title: values.title,
      cadence: values.cadence,
      color: values.color,
      weekdays: values.weekdays?.length ? values.weekdays : undefined,
      reminderTime: values.reminderTime || undefined,
    };
    if (editingId) {
      updateHabit(editingId, payload);
    } else {
      addHabit(payload);
    }
    setModalOpen(false);
    reset({
      title: "",
      cadence: "daily",
      color: colors[0],
      weekdays: [],
      reminderTime: "",
    });
    setEditingId(null);
  }

  function toggleWeekday(day: number) {
    const set = new Set(selectedWeekdays);
    if (set.has(day)) set.delete(day);
    else set.add(day);
    setValue("weekdays", Array.from(set).sort(), {
      shouldDirty: true,
    });
  }

  function handleRemoveHabit(id: string) {
    const habit = habits.find((h) => h.id === id);
    const habitLogsSnapshot = habitLogs.filter((log) => log.habitId === id);
    removeHabit(id);
    setConfirmRemove(null);
    if (habit) {
      pushToast({
        message: `Usunieto habit: ${habit.title}`,
        tone: "info",
        actionLabel: "Cofnij",
        onAction: () => {
          addHabit({
            title: habit.title,
            cadence: habit.cadence,
            color: habit.color,
            weekdays: habit.weekdays,
            reminderTime: habit.reminderTime,
          });
          for (const log of habitLogsSnapshot) {
            setHabitLogNote(habit.id, log.date, log.note ?? "");
          }
        },
      });
    }
  }

  function openNote(habit: Habit, date: string, current?: string) {
    setNoteContext({
      habitId: habit.id,
      habitTitle: habit.title,
      date,
      current: current ?? "",
    });
    setNoteDraft(current ?? "");
  }

  function saveNote() {
    if (!noteContext) return;
    setHabitLogNote(noteContext.habitId, noteContext.date, noteDraft);
    setNoteContext(null);
    setNoteDraft("");
  }

  const dueToday = habitsWithStats.filter((habit) =>
    isHabitDueToday(habit.cadence, habit.weekdays, today),
  );
  const todayDone = dueToday.filter((habit) => habit.dates.has(today)).length;

  return (
    <>
      <Section
        id="habits"
        title="Habits Tracker"
        subtitle="Codzienne, tygodniowe i niestandardowe reguly. Streak, historia i notatki."
        action="Dodaj habit"
        onAction={openCreate}
        headerExtra={
          <Badge
            tone={
              todayDone === dueToday.length && dueToday.length
                ? "green"
                : "violet"
            }
          >
            Dzis: {todayDone}/{dueToday.length}
          </Badge>
        }
      >
        {habits.length === 0 ? (
          <EmptyState message="Brak habitow. Dodaj pierwszy zwyczaj, ktory chcesz utrwalic." />
        ) : (
          <div className="space-y-4">
            {habitsWithStats.map((habit) => {
              const doneToday = habit.dates.has(today);
              const todayDue = isHabitDueToday(
                habit.cadence,
                habit.weekdays,
                today,
              );
              const todayNote = habit.notes.get(today) ?? "";
              return (
                <div
                  key={habit.id}
                  className="overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.04]"
                >
                  <div className="grid gap-4 p-4 lg:grid-cols-[1fr_280px] lg:gap-6">
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <span
                            className="grid size-12 shrink-0 place-items-center rounded-2xl"
                            style={{ backgroundColor: `${habit.color}25` }}
                          >
                            <Flame
                              className="size-6"
                              style={{ color: habit.color }}
                            />
                          </span>
                          <div>
                            <p className="text-base font-semibold">{habit.title}</p>
                            <p className="text-xs text-slate-500">
                              {habit.cadence === "daily"
                                ? habit.weekdays?.length
                                  ? `Dni: ${habit.weekdays
                                      .map((d) => WEEKDAY_NAMES[d])
                                      .join(", ")}`
                                  : "Codziennie"
                                : "Co tydzien"}
                              {habit.reminderTime
                                ? ` · ${habit.reminderTime}`
                                : ""}{" "}
                              · streak {habit.streak}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openEdit(habit)}
                            className="grid size-9 place-items-center rounded-2xl border border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.1]"
                            aria-label="Edytuj"
                          >
                            <Pencil className="size-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmRemove(habit.id)}
                            className="grid size-9 place-items-center rounded-2xl border border-white/10 bg-white/[0.04] text-slate-300 hover:bg-rose-500/20 hover:text-rose-200"
                            aria-label="Usun"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
                        <button
                          type="button"
                          onClick={() => toggleHabitLog(habit.id, today)}
                          className={cn(
                            "flex flex-1 items-center justify-between gap-3 rounded-2xl border px-4 py-3 transition",
                            doneToday
                              ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-100"
                              : todayDue
                                ? "border-white/10 bg-white/[0.04] text-slate-200 hover:bg-white/[0.08]"
                                : "border-dashed border-white/10 bg-white/[0.02] text-slate-400 hover:bg-white/[0.05]",
                          )}
                        >
                          <span className="flex items-center gap-3">
                            <span
                              className={cn(
                                "grid size-9 place-items-center rounded-full transition",
                                doneToday
                                  ? "bg-emerald-400 text-slate-950"
                                  : "border border-white/15 bg-white/[0.04] text-slate-500",
                              )}
                            >
                              <Check className="size-4" />
                            </span>
                            <span className="text-left">
                              <span className="block text-sm font-semibold">
                                {doneToday
                                  ? "Zrobione dzis"
                                  : todayDue
                                    ? "Oznacz jako zrobione"
                                    : "Dzisiaj nie w planie"}
                              </span>
                              <span className="block text-xs text-slate-400">
                                {doneToday
                                  ? "Klik, aby cofnac"
                                  : formatShortDate(today)}
                              </span>
                            </span>
                          </span>
                          <Badge tone={doneToday ? "green" : "neutral"}>
                            {Math.round(habit.completionRate)}%
                          </Badge>
                        </button>
                        <Button
                          variant="ghost"
                          onClick={() => openNote(habit, today, todayNote)}
                        >
                          <MessageSquare className="mr-2 size-4" />
                          {todayNote ? "Edytuj notatke" : "Dodaj notatke"}
                        </Button>
                      </div>

                      {todayNote ? (
                        <p className="rounded-2xl bg-white/[0.04] px-3 py-2 text-xs text-slate-300">
                          &ldquo;{todayNote}&rdquo;
                        </p>
                      ) : null}

                      <div>
                        <p className="mb-2 text-xs uppercase tracking-wider text-slate-500">
                          Ostatnie 7 dni
                        </p>
                        <div className="grid grid-cols-7 gap-2">
                          {last7.map((date) => {
                            const done = habit.dates.has(date);
                            const isToday = date === today;
                            const due = isHabitDueToday(
                              habit.cadence,
                              habit.weekdays,
                              date,
                            );
                            const note = habit.notes.get(date);
                            return (
                              <button
                                key={`${habit.id}-w-${date}`}
                                type="button"
                                onClick={() => toggleHabitLog(habit.id, date)}
                                onContextMenu={(event) => {
                                  event.preventDefault();
                                  openNote(habit, date, note ?? "");
                                }}
                                title={`${date}${note ? ` · ${note}` : ""}`}
                                className={cn(
                                  "group flex flex-col items-center gap-1 rounded-2xl border px-1 py-2 text-xs transition",
                                  done
                                    ? "border-transparent text-slate-950 shadow-lg shadow-black/30"
                                    : due
                                      ? "border-white/10 bg-white/[0.04] text-slate-400 hover:bg-white/[0.1]"
                                      : "border-dashed border-white/10 bg-white/[0.02] text-slate-600",
                                  isToday &&
                                    !done &&
                                    "border-violet-300/60 text-violet-100",
                                )}
                                style={
                                  done ? { backgroundColor: habit.color } : undefined
                                }
                              >
                                <span className="text-[10px] uppercase tracking-wider opacity-80">
                                  {weekdayShort(date)}
                                </span>
                                <span className="text-sm font-semibold">
                                  {new Date(date).getDate()}
                                </span>
                                {note ? (
                                  <MessageSquare className="size-3" />
                                ) : (
                                  <Check
                                    className={cn(
                                      "size-3 transition",
                                      done ? "opacity-100" : "opacity-0",
                                    )}
                                  />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 rounded-3xl bg-white/[0.04] p-4 lg:bg-transparent lg:p-0">
                      <div className="grid grid-cols-3 gap-3 lg:grid-cols-1">
                        <Stat label="Streak" value={`${habit.streak}`} />
                        <Stat
                          label={
                            habit.cadence === "weekly" ? "Tygodnie 12" : "Dni 30"
                          }
                          value={`${habit.completedInWindow}/${habit.dueCount}`}
                        />
                        <Stat
                          label="Procent"
                          value={`${Math.round(habit.completionRate)}%`}
                        />
                      </div>
                      <div>
                        <p className="mb-2 text-xs uppercase tracking-wider text-slate-500">
                          Mapa 30 dni
                        </p>
                        <div className="grid grid-cols-10 gap-1">
                          {last30.map((date) => {
                            const done = habit.dates.has(date);
                            const isToday = date === today;
                            const due = isHabitDueToday(
                              habit.cadence,
                              habit.weekdays,
                              date,
                            );
                            return (
                              <button
                                key={`${habit.id}-m-${date}`}
                                type="button"
                                onClick={() => toggleHabitLog(habit.id, date)}
                                title={date}
                                aria-label={`Toggle ${date}`}
                                className={cn(
                                  "aspect-square rounded-md transition",
                                  done
                                    ? "ring-1 ring-white/10"
                                    : due
                                      ? "bg-white/[0.06] hover:bg-white/[0.12]"
                                      : "bg-white/[0.02]",
                                  isToday && !done && "ring-1 ring-violet-300/60",
                                )}
                                style={
                                  done
                                    ? { backgroundColor: habit.color }
                                    : undefined
                                }
                              />
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Section>

      <Section
        title="Historia ostatnich 14 dni"
        subtitle="Wszystkie habity razem (prawy klik = notatka)"
        headerExtra={
          <Badge tone="violet">
            <Calendar className="mr-1 size-3" />
            {relativeDayLabel(today)}
          </Badge>
        }
      >
        {habits.length === 0 ? (
          <EmptyState message="Dodaj habity, zeby zobaczyc historie." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-3 py-2">Habit</th>
                  {lastNDates(14).map((date) => (
                    <th
                      key={`head-${date}`}
                      className="px-1 py-2 text-center text-[10px]"
                    >
                      <div>{weekdayShort(date)}</div>
                      <div className="text-slate-300">
                        {new Date(date).getDate()}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {habitsWithStats.map((habit) => (
                  <tr
                    key={`row-${habit.id}`}
                    className="border-t border-white/[0.06]"
                  >
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-block size-2 rounded-full"
                          style={{ backgroundColor: habit.color }}
                        />
                        <span className="truncate">{habit.title}</span>
                      </div>
                    </td>
                    {lastNDates(14).map((date) => {
                      const done = habit.dates.has(date);
                      const note = habit.notes.get(date);
                      return (
                        <td
                          key={`cell-${habit.id}-${date}`}
                          className="px-1 py-2 text-center"
                        >
                          <button
                            type="button"
                            onClick={() => toggleHabitLog(habit.id, date)}
                            onContextMenu={(event) => {
                              event.preventDefault();
                              openNote(habit, date, note ?? "");
                            }}
                            className={cn(
                              "mx-auto grid size-6 place-items-center rounded-md transition",
                              done
                                ? "text-slate-950"
                                : "bg-white/[0.06] text-slate-700 hover:bg-white/[0.12]",
                            )}
                            style={
                              done ? { backgroundColor: habit.color } : undefined
                            }
                            title={`${habit.title} · ${date}${
                              note ? ` · ${note}` : ""
                            }`}
                            aria-label={`Toggle ${habit.title} ${date}`}
                          >
                            {done ? <Check className="size-3" /> : null}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-3 text-xs text-slate-500">
              Tip: prawy klik na kratce dodaje krotka notatke do tego wpisu.
            </p>
          </div>
        )}
      </Section>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingHabit ? "Edytuj habit" : "Nowy habit"}
        description="Zwyczaj z elastyczna kadencja, kolorem i przypomnieniem."
      >
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <Field label="Nazwa" error={errors.title?.message}>
            <Input {...register("title")} placeholder="np. Trening 17:30" />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Czestotliwosc">
              <Select {...register("cadence")}>
                <option value="daily">Codziennie / wybrane dni</option>
                <option value="weekly">Raz w tygodniu</option>
              </Select>
            </Field>
            <Field label="Godzina przypomnienia">
              <Input type="time" {...register("reminderTime")} />
            </Field>
          </div>
          {selectedCadence === "daily" ? (
            <Field label="Dni tygodnia (puste = wszystkie dni)">
              <div className="flex flex-wrap gap-2">
                {WEEKDAY_NAMES.map((label, index) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => toggleWeekday(index)}
                    className={cn(
                      "rounded-2xl border px-3 py-1.5 text-sm transition",
                      selectedWeekdays.includes(index)
                        ? "border-violet-300/60 bg-violet-500/20 text-violet-100"
                        : "border-white/10 bg-white/[0.04] text-slate-400 hover:bg-white/[0.08]",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </Field>
          ) : null}
          <Field label="Kolor">
            <div className="flex flex-wrap gap-2">
              {colors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setValue("color", color, { shouldDirty: true })}
                  className={cn(
                    "size-9 rounded-2xl border-2 transition",
                    selectedColor === color
                      ? "border-white"
                      : "border-transparent",
                  )}
                  style={{ backgroundColor: color }}
                  aria-label={`Kolor ${color}`}
                />
              ))}
            </div>
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" onClick={() => setModalOpen(false)}>
              Anuluj
            </Button>
            <Button type="submit" variant="primary">
              Zapisz
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(noteContext)}
        onClose={() => setNoteContext(null)}
        title={
          noteContext
            ? `Notatka · ${noteContext.habitTitle} (${noteContext.date})`
            : "Notatka"
        }
        description="Jedna linia: jak poszlo lub dlaczego nie."
      >
        <Textarea
          rows={3}
          value={noteDraft}
          onChange={(event) => setNoteDraft(event.target.value)}
          placeholder="np. 25 min ranny spacer, energia 8/10"
          autoFocus
        />
        <div className="mt-4 flex justify-end gap-2">
          <Button type="button" onClick={() => setNoteContext(null)}>
            Anuluj
          </Button>
          <Button type="button" variant="primary" onClick={saveNote}>
            Zapisz notatke
          </Button>
        </div>
      </Modal>

      <Modal
        open={Boolean(confirmRemove)}
        onClose={() => setConfirmRemove(null)}
        title="Usunac habit?"
        description="Mozesz cofnac usuniecie z toastu w lewym dolnym rogu."
        size="sm"
      >
        <div className="flex justify-end gap-2">
          <Button onClick={() => setConfirmRemove(null)}>Anuluj</Button>
          <Button
            variant="danger"
            onClick={() => {
              if (confirmRemove) handleRemoveHabit(confirmRemove);
            }}
          >
            Usun
          </Button>
        </div>
      </Modal>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-3">
      <p className="text-[11px] uppercase tracking-wider text-slate-500">
        {label}
      </p>
      <p className="mt-1 flex items-center gap-1 text-lg font-semibold">
        <CheckCircle2 className="size-3.5 text-emerald-300" />
        {value}
      </p>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.02] p-6 text-center text-sm text-slate-400">
      {message}
    </div>
  );
}

function Field({
  label,
  children,
  error,
}: {
  label: string;
  children: React.ReactNode;
  error?: string;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-slate-300">{label}</span>
      {children}
      {error ? <span className="text-xs text-rose-300">{error}</span> : null}
    </label>
  );
}
