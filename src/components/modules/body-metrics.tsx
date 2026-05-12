"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Pencil, Trash2, TrendingDown, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Section } from "@/components/section";
import { bodyMetricSchema, type BodyMetricInput } from "@/lib/schemas";
import { formatShortDate, toIsoDate } from "@/lib/utils";
import { useDataStore, type BodyMetric } from "@/stores/data-store";

export function BodyMetricsModule() {
  const metrics = useDataStore((state) => state.bodyMetrics);
  const settings = useDataStore((state) => state.settings);
  const addMetric = useDataStore((state) => state.addBodyMetric);
  const updateMetric = useDataStore((state) => state.updateBodyMetric);
  const removeMetric = useDataStore((state) => state.removeBodyMetric);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<BodyMetric | null>(null);

  const sorted = useMemo(
    () => [...metrics].sort((a, b) => a.date.localeCompare(b.date)),
    [metrics],
  );
  const latest = sorted[sorted.length - 1];
  const previous = sorted[sorted.length - 2];
  const delta = latest && previous ? latest.weight - previous.weight : 0;

  const chartData = sorted.map((metric) => ({
    label: formatShortDate(metric.date),
    weight: metric.weight,
    waist: metric.waist,
  }));

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BodyMetricInput>({
    resolver: zodResolver(bodyMetricSchema),
    defaultValues: {
      date: toIsoDate(),
      weight: latest?.weight ?? 80,
      waist: latest?.waist,
      bodyFat: latest?.bodyFat,
    },
  });

  function openCreate() {
    setEditing(null);
    reset({
      date: toIsoDate(),
      weight: latest?.weight ?? 80,
      waist: latest?.waist,
      bodyFat: latest?.bodyFat,
    });
    setOpen(true);
  }

  function openEdit(metric: BodyMetric) {
    setEditing(metric);
    reset({
      date: metric.date,
      weight: metric.weight,
      waist: metric.waist,
      bodyFat: metric.bodyFat,
    });
    setOpen(true);
  }

  function onSubmit(values: BodyMetricInput) {
    if (editing) updateMetric(editing.id, values);
    else addMetric(values);
    setOpen(false);
  }

  return (
    <>
      <Section
        id="body"
        title="Body Metrics"
        subtitle="Waga, talia, body fat i trend"
        action="Nowy pomiar"
        onAction={openCreate}
      >
        <div className="grid gap-5 lg:grid-cols-[260px_1fr]">
          <div className="rounded-3xl border border-white/[0.08] bg-white/[0.04] p-4">
            <p className="text-xs text-slate-500">Ostatnia waga</p>
            <p className="mt-2 text-4xl font-semibold">
              {latest ? `${latest.weight.toFixed(1)} ${settings.weightUnit}` : "—"}
            </p>
            {latest && previous ? (
              <p
                className={`mt-1 flex items-center gap-1 text-sm ${
                  delta < 0 ? "text-emerald-300" : "text-rose-300"
                }`}
              >
                {delta < 0 ? (
                  <TrendingDown className="size-4" />
                ) : (
                  <TrendingUp className="size-4" />
                )}
                {delta > 0 ? "+" : ""}
                {delta.toFixed(1)} {settings.weightUnit}
              </p>
            ) : null}
            <Badge tone="violet" className="mt-3">
              {sorted.length} pomiarow
            </Badge>
          </div>

          <div className="rounded-3xl border border-white/[0.08] bg-white/[0.04] p-4">
            <div className="h-56">
              {chartData.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
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
                    <Line
                      type="monotone"
                      dataKey="weight"
                      stroke="#a78bfa"
                      strokeWidth={3}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="waist"
                      stroke="#38bdf8"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="grid h-full place-items-center text-xs text-slate-500">
                  Brak danych. Dodaj pierwszy pomiar.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 overflow-x-auto rounded-3xl border border-white/[0.08] bg-white/[0.04] p-4">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead className="text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-3 py-2">Data</th>
                <th className="px-3 py-2">Waga</th>
                <th className="px-3 py-2">Talia</th>
                <th className="px-3 py-2">Body fat</th>
                <th className="px-3 py-2 text-right">Akcje</th>
              </tr>
            </thead>
            <tbody>
              {[...sorted].reverse().map((metric) => (
                <tr
                  key={metric.id}
                  className="border-t border-white/[0.06] hover:bg-white/[0.04]"
                >
                  <td className="px-3 py-2">{metric.date}</td>
                  <td className="px-3 py-2 font-semibold">
                    {metric.weight.toFixed(1)} {settings.weightUnit}
                  </td>
                  <td className="px-3 py-2">{metric.waist ?? "—"}</td>
                  <td className="px-3 py-2">
                    {metric.bodyFat ? `${metric.bodyFat}%` : "—"}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(metric)}
                        className="grid size-8 place-items-center rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.1]"
                        aria-label="Edytuj"
                      >
                        <Pencil className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeMetric(metric.id)}
                        className="grid size-8 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-rose-200 hover:bg-rose-500/20"
                        aria-label="Usun"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Edytuj pomiar" : "Nowy pomiar"}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Data" error={errors.date?.message}>
              <Input type="date" {...register("date")} />
            </Field>
            <Field
              label={`Waga (${settings.weightUnit})`}
              error={errors.weight?.message}
            >
              <Input
                type="number"
                step={0.1}
                min={20}
                {...register("weight", { valueAsNumber: true })}
              />
            </Field>
            <Field label="Talia (cm)">
              <Input
                type="number"
                step={0.1}
                {...register("waist", {
                  setValueAs: (value) =>
                    value === "" || value === null ? undefined : Number(value),
                })}
              />
            </Field>
            <Field label="Body fat (%)">
              <Input
                type="number"
                step={0.1}
                {...register("bodyFat", {
                  setValueAs: (value) =>
                    value === "" || value === null ? undefined : Number(value),
                })}
              />
            </Field>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" onClick={() => setOpen(false)}>
              Anuluj
            </Button>
            <Button type="submit" variant="primary">
              Zapisz
            </Button>
          </div>
        </form>
      </Modal>
    </>
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
