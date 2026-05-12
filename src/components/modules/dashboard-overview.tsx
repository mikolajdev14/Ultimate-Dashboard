"use client";

import {
  ArrowUpRight,
  CalendarClock,
  Check,
  CheckCircle2,
  CircleDollarSign,
  Dumbbell,
  Plus,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { useMemo } from "react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Section } from "@/components/section";
import { Progress } from "@/components/ui/progress";
import {
  epleyOneRepMax,
  useDataStore,
} from "@/stores/data-store";
import { useAppStore } from "@/stores/app-store";
import {
  cn,
  formatCurrency,
  formatShortDate,
  lastNDates,
  toIsoDate,
  weekdayShort,
} from "@/lib/utils";

type Tone = "violet" | "green" | "amber" | "rose";

const toneMap: Record<Tone, string> = {
  violet: "from-violet-400/35 to-violet-500/5 text-violet-100",
  green: "from-emerald-400/30 to-emerald-500/5 text-emerald-100",
  amber: "from-amber-400/30 to-amber-500/5 text-amber-100",
  rose: "from-rose-400/30 to-rose-500/5 text-rose-100",
};

export function DashboardOverview() {
  const habits = useDataStore((state) => state.habits);
  const habitLogs = useDataStore((state) => state.habitLogs);
  const tasks = useDataStore((state) => state.tasks);
  const sessions = useDataStore((state) => state.sessions);
  const expenses = useDataStore((state) => state.expenses);
  const expenseCategories = useDataStore((state) => state.expenseCategories);
  const bodyMetrics = useDataStore((state) => state.bodyMetrics);
  const settings = useDataStore((state) => state.settings);
  const toggleHabitLog = useDataStore((state) => state.toggleHabitLog);
  const updateTask = useDataStore((state) => state.updateTask);
  const setActiveModule = useAppStore((state) => state.setActiveModule);

  const today = toIsoDate();
  const last7 = useMemo(() => lastNDates(7), []);

  const completionTrend = useMemo(() => {
    return last7.map((date) => ({
      day: formatShortDate(date),
      value: habits.length
        ? Math.round(
            (habitLogs.filter((log) => log.date === date).length /
              habits.length) *
              100,
          )
        : 0,
    }));
  }, [habits.length, habitLogs, last7]);

  const todayCompletion = completionTrend[completionTrend.length - 1]?.value ?? 0;

  const longestStreak = useMemo(() => {
    let max = 0;
    for (const habit of habits) {
      let streak = 0;
      for (let i = 0; ; i += 1) {
        const date = lastNDates(i + 1)[0];
        const hasLog = habitLogs.some(
          (log) => log.habitId === habit.id && log.date === date,
        );
        if (hasLog) streak += 1;
        else break;
      }
      if (streak > max) max = streak;
    }
    return max;
  }, [habits, habitLogs]);

  const volumeTrend = useMemo(() => {
    return [...sessions]
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-7)
      .map((session) => ({
        day: formatShortDate(session.date),
        value: session.sets.reduce((sum, set) => sum + set.reps * set.weight, 0),
      }));
  }, [sessions]);

  const totalVolume = volumeTrend.reduce((sum, item) => sum + item.value, 0);

  const monthlySpend = expenses.reduce(
    (sum, expense) => sum + expense.amount,
    0,
  );
  const monthlyBudget = expenseCategories.reduce(
    (sum, category) => sum + category.budget,
    0,
  );

  const sortedBody = [...bodyMetrics].sort((a, b) =>
    a.date.localeCompare(b.date),
  );
  const latestWeight = sortedBody[sortedBody.length - 1];
  const previousWeight = sortedBody[sortedBody.length - 2];

  const todayHabits = habits.map((habit) => ({
    ...habit,
    done: habitLogs.some(
      (log) => log.habitId === habit.id && log.date === today,
    ),
  }));

  const todayTasks = tasks.filter((task) => task.status !== "done");

  const heroMetrics: {
    label: string;
    value: string;
    change: string;
    tone: Tone;
    target: string;
    data: { day: string; value: number }[];
  }[] = [
    {
      label: "Completion rate",
      value: `${todayCompletion}%`,
      change:
        completionTrend.length > 1
          ? `${completionTrend[completionTrend.length - 1].value - completionTrend[0].value > 0 ? "+" : ""}${completionTrend[completionTrend.length - 1].value - completionTrend[0].value}% vs tydzien`
          : "Pierwsze dane",
      tone: "violet",
      target: "Habits",
      data: completionTrend.map((entry) => ({
        day: entry.day,
        value: entry.value,
      })),
    },
    {
      label: "Habit streak",
      value: `${longestStreak} dni`,
      change: `${habits.length} habity total`,
      tone: "green",
      target: "Habits",
      data: completionTrend.map((entry, index) => ({
        day: entry.day,
        value: Math.max(0, longestStreak - (completionTrend.length - 1 - index)),
      })),
    },
    {
      label: "Training volume",
      value: `${Math.round(totalVolume).toLocaleString("pl-PL")} ${settings.weightUnit}`,
      change: `${sessions.length} sesji`,
      tone: "amber",
      target: "Workout",
      data: volumeTrend.length
        ? volumeTrend
        : completionTrend.map((entry) => ({ day: entry.day, value: 0 })),
    },
    {
      label: "Monthly spend",
      value: formatCurrency(monthlySpend, settings.currency),
      change: monthlyBudget
        ? `${Math.round((monthlySpend / monthlyBudget) * 100)}% budzetu`
        : "Brak budzetu",
      tone: monthlySpend > monthlyBudget ? "rose" : "violet",
      target: "Finance",
      data: completionTrend.map((entry, index) => ({
        day: entry.day,
        value: Math.round(
          (monthlySpend / Math.max(1, completionTrend.length)) * (index + 1),
        ),
      })),
    },
  ];

  return (
    <div className="space-y-6">
      <section className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <HeroSummary
            doneHabits={todayHabits.filter((h) => h.done).length}
            totalHabits={habits.length}
            todayTasks={todayTasks.length}
            monthlySpend={monthlySpend}
            currency={settings.currency}
            userName={settings.name}
            onOpenHabits={() => setActiveModule("Habits")}
            onOpenTasks={() => setActiveModule("Tasks")}
            onOpenFinance={() => setActiveModule("Finance")}
          />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {heroMetrics.map((metric) => (
              <MetricCard
                key={metric.label}
                metric={metric}
                onClick={() => setActiveModule(metric.target)}
              />
            ))}
          </div>
        </div>

        <Card className="relative overflow-hidden bg-gradient-to-br from-violet-300/25 via-fuchsia-400/10 to-slate-950">
          <div className="absolute -right-16 -top-16 size-48 rounded-full bg-violet-300/30 blur-3xl" />
          <Badge tone="violet">Life portfolio</Badge>
          <h2 className="mt-8 text-2xl font-semibold text-white">Twoje centrum</h2>
          <p className="mt-2 max-w-xs text-sm leading-6 text-slate-300">
            Habity, taski, trening, finanse i cele w jednym widoku. Wszystkie
            dane zapisuja sie lokalnie i dzialaja offline jako PWA.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-3">
            <Button
              variant="primary"
              onClick={() => setActiveModule("Workout")}
            >
              <Dumbbell className="mr-2 size-4" />
              Trening
            </Button>
            <Button onClick={() => setActiveModule("Tasks")}>
              <Plus className="mr-2 size-4" />
              Quick task
            </Button>
            <Button onClick={() => setActiveModule("Habits")}>
              <Sparkles className="mr-2 size-4" />
              Habity
            </Button>
            <Button onClick={() => setActiveModule("Goals")}>
              <ArrowUpRight className="mr-2 size-4" />
              Cele
            </Button>
          </div>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Section
          title="Dzisiejsze habity"
          subtitle="Klik = zalogowany dzis"
          headerExtra={
            <Button onClick={() => setActiveModule("Habits")}>
              <Sparkles className="mr-2 size-4" />
              Otworz habity
            </Button>
          }
        >
          {todayHabits.length === 0 ? (
            <p className="rounded-3xl border border-dashed border-white/10 bg-white/[0.02] p-6 text-center text-sm text-slate-400">
              Brak habitow.{" "}
              <button
                type="button"
                onClick={() => setActiveModule("Habits")}
                className="font-semibold text-violet-200 underline-offset-2 hover:underline"
              >
                Dodaj pierwszy
              </button>
              .
            </p>
          ) : (
            <div className="space-y-3">
              {todayHabits.map((habit) => {
                const habitDates = new Set(
                  habitLogs
                    .filter((log) => log.habitId === habit.id)
                    .map((log) => log.date),
                );
                return (
                  <div
                    key={habit.id}
                    className={cn(
                      "rounded-2xl border p-3 transition",
                      habit.done
                        ? "border-emerald-400/30 bg-emerald-500/10"
                        : "border-white/[0.08] bg-white/[0.04]",
                    )}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => toggleHabitLog(habit.id, today)}
                        className="flex flex-1 items-center gap-3 text-left"
                      >
                        <span
                          className={cn(
                            "grid size-9 place-items-center rounded-full transition",
                            habit.done
                              ? "text-slate-950"
                              : "border border-white/15 bg-white/[0.04] text-slate-500",
                          )}
                          style={
                            habit.done
                              ? { backgroundColor: habit.color }
                              : undefined
                          }
                        >
                          <Check className="size-4" />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">
                            {habit.title}
                          </p>
                          <p className="text-xs text-slate-500">
                            {habit.cadence === "daily"
                              ? "Codziennie"
                              : "Co tydzien"}
                          </p>
                        </div>
                      </button>
                      <Badge tone={habit.done ? "green" : "neutral"}>
                        {habit.done ? "Zrobione" : "Klik"}
                      </Badge>
                    </div>
                    <div className="mt-3 grid grid-cols-7 gap-1">
                      {last7.map((date) => {
                        const done = habitDates.has(date);
                        return (
                          <button
                            key={`${habit.id}-mini-${date}`}
                            type="button"
                            onClick={() => toggleHabitLog(habit.id, date)}
                            title={date}
                            className={cn(
                              "flex flex-col items-center gap-1 rounded-lg px-1 py-1.5 text-[10px] uppercase tracking-wider transition",
                              done
                                ? "text-slate-950"
                                : "bg-white/[0.04] text-slate-500 hover:bg-white/[0.1]",
                            )}
                            style={
                              done ? { backgroundColor: habit.color } : undefined
                            }
                          >
                            <span>{weekdayShort(date)}</span>
                            <span className="text-sm font-semibold">
                              {new Date(date).getDate()}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Section>

        <Section
          title="Aktywne taski"
          subtitle="Szybko przesun status"
          headerExtra={
            <Button onClick={() => setActiveModule("Tasks")}>
              <ArrowUpRight className="mr-2 size-4" />
              Otworz Kanban
            </Button>
          }
        >
          {todayTasks.length === 0 ? (
            <p className="rounded-3xl border border-dashed border-white/10 bg-white/[0.02] p-6 text-center text-sm text-slate-400">
              Wszystkie taski wykonane.{" "}
              <button
                type="button"
                onClick={() => setActiveModule("Tasks")}
                className="font-semibold text-violet-200 underline-offset-2 hover:underline"
              >
                Dodaj nowy
              </button>
              .
            </p>
          ) : (
            <div className="space-y-2">
              {todayTasks.slice(0, 6).map((task) => (
                <button
                  key={task.id}
                  type="button"
                  onClick={() => setActiveModule("Tasks")}
                  className="flex w-full items-center justify-between gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.04] p-3 text-left transition hover:bg-white/[0.08]"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{task.title}</p>
                    <p className="text-xs text-slate-500">
                      {task.priority} · {task.status}
                    </p>
                  </div>
                  <Button
                    variant="primary"
                    className="h-8 px-3 text-xs"
                    onClick={(event) => {
                      event.stopPropagation();
                      updateTask(task.id, {
                        status: task.status === "doing" ? "done" : "doing",
                      });
                    }}
                  >
                    {task.status === "doing" ? "Done" : "Doing"}
                  </Button>
                </button>
              ))}
            </div>
          )}
        </Section>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <Card
          className="cursor-pointer xl:col-span-1"
          onClick={() => setActiveModule("Workout")}
        >
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>Trening tygodnia</CardTitle>
              <p className="mt-1 text-sm text-slate-500">
                Ostatnie {sessions.length} sesji
              </p>
            </div>
            <ArrowUpRight className="size-4 text-slate-500" />
          </div>
          <div className="mt-5 space-y-3">
            {sessions.length === 0 ? (
              <p className="text-sm text-slate-400">
                Brak sesji.{" "}
                <span className="font-semibold text-violet-200">
                  Otworz trening
                </span>
                , aby dodac.
              </p>
            ) : (
              sessions.slice(0, 3).map((session) => {
                const sets = session.sets;
                const top = sets.reduce(
                  (best, set) =>
                    !best ||
                    epleyOneRepMax(set.weight, set.reps) >
                      epleyOneRepMax(best.weight, best.reps)
                      ? set
                      : best,
                  sets[0],
                );
                return (
                  <div
                    key={session.id}
                    className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-3"
                  >
                    <p className="text-sm font-semibold">{session.name}</p>
                    <p className="text-xs text-slate-500">
                      {formatShortDate(session.date)} · {sets.length} serii
                    </p>
                    {top ? (
                      <p className="mt-2 text-xs text-violet-200">
                        Top set: {top.reps}×{top.weight}
                        {settings.weightUnit}
                      </p>
                    ) : null}
                  </div>
                );
              })
            )}
          </div>
          <Button
            className="mt-5 w-full"
            onClick={(event) => {
              event.stopPropagation();
              setActiveModule("Workout");
            }}
          >
            <Dumbbell className="mr-2 size-4" />
            Otworz trening
          </Button>
        </Card>

        <Card
          className="cursor-pointer xl:col-span-1"
          onClick={() => setActiveModule("Finance")}
        >
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>Finanse</CardTitle>
              <p className="mt-1 text-sm text-slate-500">Budzet w okresie</p>
            </div>
            <ArrowUpRight className="size-4 text-slate-500" />
          </div>
          <p className="mt-4 text-3xl font-semibold">
            {formatCurrency(monthlySpend, settings.currency)}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            z {formatCurrency(monthlyBudget, settings.currency)} budzetu
          </p>
          <Progress
            className="mt-4"
            value={monthlyBudget ? (monthlySpend / monthlyBudget) * 100 : 0}
          />
          <Button
            className="mt-4 w-full"
            onClick={(event) => {
              event.stopPropagation();
              setActiveModule("Finance");
            }}
          >
            <CircleDollarSign className="mr-2 size-4" />
            Otworz finanse
          </Button>
        </Card>

        <Card
          className="cursor-pointer xl:col-span-1"
          onClick={() => setActiveModule("Body Metrics")}
        >
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>Waga</CardTitle>
              <p className="mt-1 text-sm text-slate-500">Ostatni pomiar</p>
            </div>
            <ArrowUpRight className="size-4 text-slate-500" />
          </div>
          {latestWeight ? (
            <>
              <p className="mt-4 text-4xl font-semibold">
                {latestWeight.weight.toFixed(1)} {settings.weightUnit}
              </p>
              {previousWeight ? (
                <p className="mt-1 text-sm text-slate-500">
                  Zmiana:{" "}
                  {(latestWeight.weight - previousWeight.weight).toFixed(1)}
                  {settings.weightUnit}
                </p>
              ) : null}
            </>
          ) : (
            <p className="mt-4 text-sm text-slate-400">Brak pomiarow</p>
          )}
          <Button
            className="mt-4 w-full"
            onClick={(event) => {
              event.stopPropagation();
              setActiveModule("Body Metrics");
            }}
          >
            <TrendingUp className="mr-2 size-4" />
            Body metrics
          </Button>
        </Card>
      </section>
    </div>
  );
}

function HeroSummary({
  doneHabits,
  totalHabits,
  todayTasks,
  monthlySpend,
  currency,
  userName,
  onOpenHabits,
  onOpenTasks,
  onOpenFinance,
}: {
  doneHabits: number;
  totalHabits: number;
  todayTasks: number;
  monthlySpend: number;
  currency: string;
  userName: string;
  onOpenHabits: () => void;
  onOpenTasks: () => void;
  onOpenFinance: () => void;
}) {
  const dateString = new Date().toLocaleDateString("pl-PL", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <Card className="overflow-hidden bg-gradient-to-br from-slate-950 via-slate-950 to-violet-950/40">
      <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
        <div>
          <Badge tone="violet">{dateString}</Badge>
          <h2 className="mt-5 max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
            Czesc, {userName}.
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-400">
            Wszystkie modu&#322;y s&#261; w pe&#322;ni edytowalne. Dane
            zapisuj&#261; si&#281; lokalnie i dzia&#322;aj&#261; offline.
          </p>
        </div>
        <div className="grid min-w-72 grid-cols-3 gap-3">
          <MiniStat
            icon={CheckCircle2}
            label="Habity"
            value={`${doneHabits}/${totalHabits || 0}`}
            onClick={onOpenHabits}
          />
          <MiniStat
            icon={CalendarClock}
            label="Taski"
            value={`${todayTasks}`}
            onClick={onOpenTasks}
          />
          <MiniStat
            icon={CircleDollarSign}
            label="Spend"
            value={formatCurrency(monthlySpend, currency)}
            onClick={onOpenFinance}
          />
        </div>
      </div>
    </Card>
  );
}

function MiniStat({
  icon: Icon,
  label,
  value,
  onClick,
}: {
  icon: typeof CheckCircle2;
  label: string;
  value: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-3xl border border-white/[0.08] bg-white/[0.05] p-4 text-left transition hover:bg-white/[0.09]"
    >
      <Icon className="mb-5 size-5 text-violet-200" />
      <p className="text-lg font-semibold">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </button>
  );
}

function MetricCard({
  metric,
  onClick,
}: {
  metric: {
    label: string;
    value: string;
    change: string;
    tone: Tone;
    data: { day: string; value: number }[];
  };
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative overflow-hidden rounded-[2rem] border border-white/[0.08] bg-gradient-to-br p-5 text-left shadow-2xl shadow-black/20 backdrop-blur transition hover:scale-[1.01]",
        toneMap[metric.tone],
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-slate-300/80">{metric.label}</p>
          <p className="mt-3 text-3xl font-semibold text-white">{metric.value}</p>
        </div>
        <ArrowUpRight className="size-4 text-slate-300/70" />
      </div>
      <div className="mt-5 h-20">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={metric.data}>
            <Area
              type="monotone"
              dataKey="value"
              stroke="currentColor"
              fill="currentColor"
              fillOpacity={0.12}
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-2 flex items-center gap-1 text-xs text-slate-300/80">
        <TrendingUp className="size-3" />
        {metric.change}
      </p>
    </button>
  );
}
