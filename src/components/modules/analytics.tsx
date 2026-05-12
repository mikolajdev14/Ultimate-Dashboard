"use client";

import { useMemo } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Section } from "@/components/section";
import { formatCurrency, formatShortDate, lastNDates } from "@/lib/utils";
import { useDataStore } from "@/stores/data-store";

export function AnalyticsModule() {
  const habits = useDataStore((state) => state.habits);
  const habitLogs = useDataStore((state) => state.habitLogs);
  const sessions = useDataStore((state) => state.sessions);
  const expenses = useDataStore((state) => state.expenses);
  const categories = useDataStore((state) => state.expenseCategories);
  const bodyMetrics = useDataStore((state) => state.bodyMetrics);
  const currency = useDataStore((state) => state.settings.currency);

  const completionTrend = useMemo(() => {
    const dates = lastNDates(14);
    return dates.map((date) => {
      const matched = habitLogs.filter((log) => log.date === date).length;
      const total = habits.length;
      const percent = total ? Math.round((matched / total) * 100) : 0;
      return { label: formatShortDate(date), value: percent };
    });
  }, [habitLogs, habits.length]);

  const volumeTrend = useMemo(() => {
    return [...sessions]
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((session) => ({
        label: formatShortDate(session.date),
        value: Math.round(
          session.sets.reduce((sum, set) => sum + set.reps * set.weight, 0),
        ),
      }));
  }, [sessions]);

  const expensesByCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const expense of expenses) {
      map.set(
        expense.categoryId,
        (map.get(expense.categoryId) ?? 0) + expense.amount,
      );
    }
    return categories
      .map((category) => ({
        name: category.name,
        value: map.get(category.id) ?? 0,
        color: category.color,
      }))
      .filter((entry) => entry.value > 0);
  }, [expenses, categories]);

  const weightTrend = useMemo(
    () =>
      [...bodyMetrics]
        .sort((a, b) => a.date.localeCompare(b.date))
        .map((metric) => ({
          label: formatShortDate(metric.date),
          value: metric.weight,
        })),
    [bodyMetrics],
  );

  return (
    <Section
      id="analytics"
      title="Analytics"
      subtitle="Wszystkie metryki w jednym miejscu"
    >
      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard title="Trend completion rate (14 dni)">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={completionTrend}>
              <defs>
                <linearGradient id="completion" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.55} />
                  <stop offset="100%" stopColor="#a78bfa" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis dataKey="label" stroke="#64748b" tickLine={false} />
              <YAxis stroke="#64748b" tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  background: "#0f172a",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 16,
                }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#a78bfa"
                strokeWidth={3}
                fill="url(#completion)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Objetosc treningowa">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={volumeTrend}>
              <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis dataKey="label" stroke="#64748b" tickLine={false} />
              <YAxis stroke="#64748b" tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  background: "#0f172a",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 16,
                }}
              />
              <Bar dataKey="value" radius={[10, 10, 0, 0]} fill="#38bdf8" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Wydatki wedlug kategorii">
          {expensesByCategory.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expensesByCategory}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={48}
                  outerRadius={84}
                  paddingAngle={4}
                >
                  {expensesByCategory.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) =>
                    formatCurrency(Number(value ?? 0), currency)
                  }
                  contentStyle={{
                    background: "#0f172a",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 16,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <Empty message="Brak danych do wykresu" />
          )}
        </ChartCard>

        <ChartCard title="Waga w czasie">
          {weightTrend.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weightTrend}>
                <defs>
                  <linearGradient id="weight" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="label" stroke="#64748b" tickLine={false} />
                <YAxis
                  stroke="#64748b"
                  tickLine={false}
                  axisLine={false}
                  domain={["dataMin - 1", "dataMax + 1"]}
                />
                <Tooltip
                  contentStyle={{
                    background: "#0f172a",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 16,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#22c55e"
                  strokeWidth={3}
                  fill="url(#weight)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <Empty message="Brak pomiarow wagi" />
          )}
        </ChartCard>
      </div>
    </Section>
  );
}

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-white/[0.08] bg-white/[0.04] p-4">
      <p className="text-sm font-semibold">{title}</p>
      <div className="mt-3 h-64">{children}</div>
    </div>
  );
}

function Empty({ message }: { message: string }) {
  return (
    <div className="grid h-full place-items-center text-xs text-slate-500">
      {message}
    </div>
  );
}
