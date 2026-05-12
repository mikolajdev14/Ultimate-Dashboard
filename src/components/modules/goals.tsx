"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Flame, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Progress } from "@/components/ui/progress";
import { Section } from "@/components/section";
import { Select } from "@/components/ui/select";
import { goalSchema, type GoalInput } from "@/lib/schemas";
import { useDataStore, type Goal } from "@/stores/data-store";

export function GoalsModule() {
  const goals = useDataStore((state) => state.goals);
  const addGoal = useDataStore((state) => state.addGoal);
  const updateGoal = useDataStore((state) => state.updateGoal);
  const removeGoal = useDataStore((state) => state.removeGoal);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Goal | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<GoalInput>({
    resolver: zodResolver(goalSchema),
    defaultValues: { title: "", horizon: "quarter", progress: 0, target: "" },
  });

  const progressValue = watch("progress") ?? 0;

  function openCreate() {
    setEditing(null);
    reset({ title: "", horizon: "quarter", progress: 0, target: "" });
    setOpen(true);
  }

  function openEdit(goal: Goal) {
    setEditing(goal);
    reset({
      title: goal.title,
      horizon: goal.horizon,
      progress: goal.progress,
      target: goal.target ?? "",
    });
    setOpen(true);
  }

  function onSubmit(values: GoalInput) {
    if (editing) updateGoal(editing.id, values);
    else addGoal(values);
    setOpen(false);
  }

  return (
    <>
      <Section
        id="goals"
        title="Goals"
        subtitle="Cele kwartalne i roczne powiazane z habitami"
        action="Nowy cel"
        onAction={openCreate}
      >
        {goals.length === 0 ? (
          <p className="rounded-3xl border border-dashed border-white/10 bg-white/[0.02] p-6 text-center text-sm text-slate-400">
            Brak celow. Dodaj pierwszy cel, ktory chcesz zrealizowac.
          </p>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {goals.map((goal) => (
              <div
                key={goal.id}
                className="rounded-3xl border border-white/[0.08] bg-white/[0.04] p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="grid size-10 place-items-center rounded-2xl bg-violet-300/15 text-violet-200">
                      <Flame className="size-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        {goal.title}
                      </p>
                      <p className="text-xs text-slate-500">
                        {goal.horizon === "quarter" ? "Kwartal" : "Rok"} ·{" "}
                        {goal.target ?? "—"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge tone="violet">{Math.round(goal.progress)}%</Badge>
                    <button
                      type="button"
                      onClick={() => openEdit(goal)}
                      className="grid size-8 place-items-center rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.1]"
                      aria-label="Edytuj"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeGoal(goal.id)}
                      className="grid size-8 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-rose-200 hover:bg-rose-500/20"
                      aria-label="Usun"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
                <Progress value={goal.progress} className="mt-4" />
                <div className="mt-4 flex flex-wrap gap-2">
                  {[10, 25, 50, 75, 100].map((step) => (
                    <button
                      key={step}
                      type="button"
                      onClick={() => updateGoal(goal.id, { progress: step })}
                      className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-1 text-xs hover:bg-white/[0.1]"
                    >
                      {step}%
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Edytuj cel" : "Nowy cel"}
      >
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <Field label="Tytul" error={errors.title?.message}>
            <Input {...register("title")} placeholder="np. Maraton 2026" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Horyzont">
              <Select {...register("horizon")}>
                <option value="quarter">Kwartal</option>
                <option value="year">Rok</option>
              </Select>
            </Field>
            <Field label="Termin">
              <Input
                type="date"
                {...register("target")}
              />
            </Field>
          </div>
          <Field label={`Postep (${Math.round(progressValue ?? 0)}%)`}>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={progressValue ?? 0}
              onChange={(event) =>
                setValue("progress", Number(event.target.value), {
                  shouldDirty: true,
                })
              }
              className="w-full accent-violet-300"
            />
          </Field>
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
