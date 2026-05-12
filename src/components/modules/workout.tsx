"use client";

import { Copy, Dumbbell, Pencil, Plus, Sparkles, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Section } from "@/components/section";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  exerciseSchema,
  sessionSchema,
  setSchema,
  type ExerciseInput,
  type SessionInput,
  type SetInput,
} from "@/lib/schemas";
import { formatShortDate, toIsoDate } from "@/lib/utils";
import { useAppStore } from "@/stores/app-store";
import {
  epleyOneRepMax,
  useDataStore,
  type Exercise,
  type WorkoutSession,
  type WorkoutSet,
} from "@/stores/data-store";

export function WorkoutModule() {
  const sessions = useDataStore((state) => state.sessions);
  const exercises = useDataStore((state) => state.exercises);
  const settings = useDataStore((state) => state.settings);
  const addSession = useDataStore((state) => state.addSession);
  const updateSession = useDataStore((state) => state.updateSession);
  const removeSession = useDataStore((state) => state.removeSession);
  const addSet = useDataStore((state) => state.addSet);
  const updateSet = useDataStore((state) => state.updateSet);
  const removeSet = useDataStore((state) => state.removeSet);
  const addExercise = useDataStore((state) => state.addExercise);
  const removeExercise = useDataStore((state) => state.removeExercise);
  const duplicateLastSession = useDataStore(
    (state) => state.duplicateLastSession,
  );
  const pushToast = useAppStore((state) => state.pushToast);

  const [sessionModal, setSessionModal] = useState(false);
  const [editingSession, setEditingSession] = useState<WorkoutSession | null>(
    null,
  );
  const [setModalOpen, setSetModalOpen] = useState(false);
  const [setContext, setSetContext] = useState<{
    sessionId: string;
    set?: WorkoutSet;
  } | null>(null);
  const [exerciseModal, setExerciseModal] = useState(false);
  const [confirmRemoveSession, setConfirmRemoveSession] = useState<string | null>(
    null,
  );

  const exerciseMap = useMemo(
    () => new Map(exercises.map((exercise) => [exercise.id, exercise])),
    [exercises],
  );

  const prByExercise = useMemo(() => {
    const map = new Map<string, number>();
    for (const session of sessions) {
      for (const set of session.sets) {
        const oneRm = epleyOneRepMax(set.weight, set.reps);
        const current = map.get(set.exerciseId) ?? 0;
        if (oneRm > current) map.set(set.exerciseId, oneRm);
      }
    }
    return map;
  }, [sessions]);

  const totalVolume = useMemo(() => {
    return sessions
      .flatMap((session) => session.sets)
      .reduce((sum, set) => sum + set.reps * set.weight, 0);
  }, [sessions]);

  const volumeBySession = useMemo(() => {
    return [...sessions]
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-10)
      .map((session) => ({
        label: formatShortDate(session.date),
        volume: Math.round(
          session.sets.reduce((sum, set) => sum + set.reps * set.weight, 0),
        ),
      }));
  }, [sessions]);

  const prBars = useMemo(() => {
    return Array.from(prByExercise.entries())
      .map(([exerciseId, value]) => ({
        name: exerciseMap.get(exerciseId)?.name ?? "?",
        oneRm: value,
      }))
      .sort((a, b) => b.oneRm - a.oneRm)
      .slice(0, 6);
  }, [prByExercise, exerciseMap]);

  const {
    register: registerSession,
    handleSubmit: handleSessionSubmit,
    reset: resetSession,
    formState: { errors: sessionErrors },
  } = useForm<SessionInput>({
    resolver: zodResolver(sessionSchema),
    defaultValues: { name: "", date: toIsoDate(), notes: "" },
  });

  const {
    register: registerSet,
    handleSubmit: handleSetSubmit,
    reset: resetSet,
    formState: { errors: setErrors },
  } = useForm<SetInput>({
    resolver: zodResolver(setSchema),
    defaultValues: {
      exerciseId: exercises[0]?.id ?? "",
      reps: 5,
      weight: 0,
      rpe: undefined,
    },
  });

  function openCreateSession() {
    setEditingSession(null);
    resetSession({ name: "", date: toIsoDate(), notes: "" });
    setSessionModal(true);
  }

  function openEditSession(session: WorkoutSession) {
    setEditingSession(session);
    resetSession({
      name: session.name,
      date: session.date,
      notes: session.notes ?? "",
    });
    setSessionModal(true);
  }

  function onSessionSubmit(values: SessionInput) {
    if (editingSession) {
      updateSession(editingSession.id, values);
    } else {
      addSession({ ...values, sets: [] });
    }
    setSessionModal(false);
  }

  function openAddSet(sessionId: string) {
    setSetContext({ sessionId });
    resetSet({
      exerciseId: exercises[0]?.id ?? "",
      reps: 5,
      weight: 0,
      rpe: undefined,
    });
    setSetModalOpen(true);
  }

  function openEditSet(sessionId: string, set: WorkoutSet) {
    setSetContext({ sessionId, set });
    resetSet({
      exerciseId: set.exerciseId,
      reps: set.reps,
      weight: set.weight,
      rpe: set.rpe,
    });
    setSetModalOpen(true);
  }

  function onSetSubmit(values: SetInput) {
    if (!setContext) return;
    const payload: Omit<WorkoutSet, "id"> = {
      exerciseId: values.exerciseId,
      reps: values.reps,
      weight: values.weight,
      ...(values.rpe ? { rpe: values.rpe } : {}),
    };
    const previousPr = prByExercise.get(values.exerciseId) ?? 0;
    const newOneRm = epleyOneRepMax(values.weight, values.reps);
    if (setContext.set) {
      updateSet(setContext.sessionId, setContext.set.id, payload);
    } else {
      addSet(setContext.sessionId, payload);
    }
    if (newOneRm > previousPr && previousPr > 0) {
      const exercise = exerciseMap.get(values.exerciseId);
      pushToast({
        message: `Nowy PR ${newOneRm}${settings.weightUnit} w ${
          exercise?.name ?? "cwiczeniu"
        }!`,
        tone: "success",
      });
    }
    setSetModalOpen(false);
  }

  function handleCloneLast() {
    const id = duplicateLastSession(toIsoDate());
    if (!id) {
      pushToast({
        message: "Brak poprzedniej sesji do skopiowania",
        tone: "info",
      });
      return;
    }
    pushToast({
      message: "Sklonowano ostatnia sesje na dzis",
      tone: "success",
      actionLabel: "Cofnij",
      onAction: () => removeSession(id),
    });
  }

  return (
    <>
      <Section
        id="workout"
        title="Workout Planner"
        subtitle="Sesje treningowe, serie, ciezary, 1RM (Epley) i PR tracker"
        action="Nowa sesja"
        onAction={openCreateSession}
        headerExtra={
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={handleCloneLast}
              disabled={sessions.length === 0}
            >
              <Copy className="mr-2 size-4" />
              Powtorz ostatnia
            </Button>
            <Button onClick={() => setExerciseModal(true)}>
              <Dumbbell className="mr-2 size-4" />
              Cwiczenia
            </Button>
          </div>
        }
      >
        <div className="grid gap-3 sm:gap-4 lg:grid-cols-3">
          <StatTile label="Sesje" value={`${sessions.length}`} />
          <StatTile
            label="Objetosc"
            value={`${Math.round(totalVolume).toLocaleString("pl-PL")} ${settings.weightUnit}`}
          />
          <StatTile
            label="Rekord 1RM"
            value={
              prBars[0]
                ? `${prBars[0].oneRm} ${settings.weightUnit}`
                : "—"
            }
            sublabel={prBars[0]?.name}
          />
        </div>

        {sessions.length === 0 ? (
          <div className="mt-5 rounded-3xl border border-dashed border-white/10 bg-white/[0.02] p-6 text-center text-sm text-slate-400">
            Brak sesji treningowych. Kliknij &ldquo;Nowa sesja&rdquo;, aby zaplanowac trening.
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            {sessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                exerciseMap={exerciseMap}
                prByExercise={prByExercise}
                weightUnit={settings.weightUnit}
                onAddSet={() => openAddSet(session.id)}
                onEdit={() => openEditSession(session)}
                onRemove={() => setConfirmRemoveSession(session.id)}
                onEditSet={(set) => openEditSet(session.id, set)}
                onRemoveSet={(setId) => removeSet(session.id, setId)}
              />
            ))}
          </div>
        )}

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="rounded-3xl border border-white/[0.08] bg-white/[0.04] p-4">
            <p className="text-sm font-semibold">PR (1RM) per cwiczenie</p>
            <div className="mt-3 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={prBars}>
                  <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" tickLine={false} />
                  <YAxis stroke="#64748b" tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: "#0f172a",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 16,
                    }}
                  />
                  <Bar dataKey="oneRm" radius={[12, 12, 0, 0]} fill="#a78bfa" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="rounded-3xl border border-white/[0.08] bg-white/[0.04] p-4">
            <p className="text-sm font-semibold">Objetosc per sesja</p>
            <div className="mt-3 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={volumeBySession}>
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
                  <Line
                    type="monotone"
                    dataKey="volume"
                    stroke="#a78bfa"
                    strokeWidth={3}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </Section>

      <Modal
        open={sessionModal}
        onClose={() => setSessionModal(false)}
        title={editingSession ? "Edytuj sesje" : "Nowa sesja"}
        description="Zaplanuj sesje treningowa i dodaj serie pojedynczo."
      >
        <form className="space-y-4" onSubmit={handleSessionSubmit(onSessionSubmit)}>
          <Field label="Nazwa" error={sessionErrors.name?.message}>
            <Input
              {...registerSession("name")}
              placeholder="np. Push day, FBW A"
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Data" error={sessionErrors.date?.message}>
              <Input type="date" {...registerSession("date")} />
            </Field>
          </div>
          <Field label="Notatki">
            <Textarea
              rows={3}
              {...registerSession("notes")}
              placeholder="Energia, samopoczucie, plany progresji..."
            />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" onClick={() => setSessionModal(false)}>
              Anuluj
            </Button>
            <Button type="submit" variant="primary">
              Zapisz
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={setModalOpen}
        onClose={() => setSetModalOpen(false)}
        title={setContext?.set ? "Edytuj serie" : "Nowa seria"}
        description="Wpisz cwiczenie, powtorzenia i ciezar."
      >
        <form className="space-y-4" onSubmit={handleSetSubmit(onSetSubmit)}>
          <Field label="Cwiczenie" error={setErrors.exerciseId?.message}>
            <Select {...registerSet("exerciseId")}>
              {exercises.length === 0 ? (
                <option value="">Dodaj cwiczenie w bibliotece</option>
              ) : null}
              {exercises.map((exercise) => (
                <option key={exercise.id} value={exercise.id}>
                  {exercise.name} ({exercise.muscleGroup})
                </option>
              ))}
            </Select>
          </Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Powtorzenia" error={setErrors.reps?.message}>
              <Input
                type="number"
                min={1}
                step={1}
                {...registerSet("reps", { valueAsNumber: true })}
              />
            </Field>
            <Field
              label={`Ciezar (${settings.weightUnit})`}
              error={setErrors.weight?.message}
            >
              <Input
                type="number"
                min={0}
                step={0.5}
                {...registerSet("weight", { valueAsNumber: true })}
              />
            </Field>
            <Field label="RPE (1-10)" error={setErrors.rpe?.message}>
              <Input
                type="number"
                min={1}
                max={10}
                step={0.5}
                {...registerSet("rpe", {
                  setValueAs: (value) =>
                    value === "" || value === null ? undefined : Number(value),
                })}
              />
            </Field>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" onClick={() => setSetModalOpen(false)}>
              Anuluj
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={exercises.length === 0}
            >
              Zapisz serie
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={exerciseModal}
        onClose={() => setExerciseModal(false)}
        title="Biblioteka cwiczen"
        description="Zarzadzaj lista cwiczen wykorzystywanych w sesjach."
      >
        <ExercisesEditor
          exercises={exercises}
          onAdd={(input) => addExercise(input)}
          onRemove={removeExercise}
        />
        <div className="mt-4 flex justify-end">
          <Button variant="primary" onClick={() => setExerciseModal(false)}>
            Gotowe
          </Button>
        </div>
      </Modal>

      <Modal
        open={Boolean(confirmRemoveSession)}
        onClose={() => setConfirmRemoveSession(null)}
        title="Usunac sesje?"
        description="Wszystkie serie tej sesji zostana usuniete."
        size="sm"
      >
        <div className="flex justify-end gap-2">
          <Button onClick={() => setConfirmRemoveSession(null)}>Anuluj</Button>
          <Button
            variant="danger"
            onClick={() => {
              if (confirmRemoveSession) removeSession(confirmRemoveSession);
              setConfirmRemoveSession(null);
            }}
          >
            Usun
          </Button>
        </div>
      </Modal>
    </>
  );
}

function ExercisesEditor({
  exercises,
  onAdd,
  onRemove,
}: {
  exercises: Exercise[];
  onAdd: (input: ExerciseInput) => void;
  onRemove: (id: string) => void;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ExerciseInput>({
    resolver: zodResolver(exerciseSchema),
    defaultValues: { name: "", muscleGroup: "Klatka" },
  });

  function onSubmit(values: ExerciseInput) {
    onAdd(values);
    reset({ name: "", muscleGroup: values.muscleGroup });
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {exercises.length === 0 ? (
          <p className="text-sm text-slate-400">
            Brak cwiczen. Dodaj pierwsze ponizej.
          </p>
        ) : (
          exercises.map((exercise) => (
            <div
              key={exercise.id}
              className="flex items-center justify-between rounded-2xl border border-white/[0.08] bg-white/[0.04] px-3 py-2"
            >
              <div>
                <p className="text-sm font-medium">{exercise.name}</p>
                <p className="text-xs text-slate-500">{exercise.muscleGroup}</p>
              </div>
              <button
                type="button"
                onClick={() => onRemove(exercise.id)}
                className="grid size-8 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-300 hover:bg-rose-500/20 hover:text-rose-200"
                aria-label="Usun cwiczenie"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          ))
        )}
      </div>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]"
      >
        <Input {...register("name")} placeholder="Nazwa cwiczenia" />
        <Select {...register("muscleGroup")}>
          {[
            "Klatka",
            "Plecy",
            "Nogi",
            "Barki",
            "Biceps",
            "Triceps",
            "Brzuch",
            "Cardio",
          ].map((group) => (
            <option key={group} value={group}>
              {group}
            </option>
          ))}
        </Select>
        <Button type="submit" variant="primary">
          Dodaj
        </Button>
        {errors.name?.message ? (
          <span className="text-xs text-rose-300 sm:col-span-3">
            {errors.name.message}
          </span>
        ) : null}
      </form>
    </div>
  );
}

function SessionCard({
  session,
  exerciseMap,
  prByExercise,
  weightUnit,
  onAddSet,
  onEdit,
  onRemove,
  onEditSet,
  onRemoveSet,
}: {
  session: WorkoutSession;
  exerciseMap: Map<string, Exercise>;
  prByExercise: Map<string, number>;
  weightUnit: "kg" | "lb";
  onAddSet: () => void;
  onEdit: () => void;
  onRemove: () => void;
  onEditSet: (set: WorkoutSet) => void;
  onRemoveSet: (setId: string) => void;
}) {
  const volume = session.sets.reduce(
    (sum, set) => sum + set.reps * set.weight,
    0,
  );
  const topSet = session.sets.reduce<WorkoutSet | null>((best, set) => {
    const oneRm = epleyOneRepMax(set.weight, set.reps);
    if (!best) return set;
    return oneRm > epleyOneRepMax(best.weight, best.reps) ? set : best;
  }, null);

  return (
    <div className="rounded-3xl border border-white/[0.08] bg-white/[0.04] p-3 sm:p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-base font-semibold">{session.name}</p>
          <p className="mt-1 text-xs text-slate-500">
            {formatShortDate(session.date)} · {session.sets.length} serii ·{" "}
            {Math.round(volume).toLocaleString("pl-PL")} {weightUnit}
          </p>
          {session.notes ? (
            <p className="mt-2 max-w-2xl text-sm text-slate-400">
              {session.notes}
            </p>
          ) : null}
          {topSet ? (
            <Badge tone="violet" className="mt-2">
              Top: {topSet.reps}×{topSet.weight}
              {weightUnit} · 1RM {epleyOneRepMax(topSet.weight, topSet.reps)}
              {weightUnit}
            </Badge>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="primary" onClick={onAddSet} className="flex-1 sm:flex-none">
            <Plus className="mr-2 size-4" />
            Seria
          </Button>
          <Button onClick={onEdit}>
            <Pencil className="size-4 sm:mr-2" />
            <span className="hidden sm:inline">Edytuj</span>
          </Button>
          <Button variant="danger" onClick={onRemove}>
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>

      {session.sets.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-3 text-center text-xs text-slate-400">
          Brak serii. Dodaj pierwsza seria w tej sesji.
        </p>
      ) : (
        <>
          <div className="mt-4 hidden overflow-x-auto sm:block">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-3 py-2">Cwiczenie</th>
                  <th className="px-3 py-2">Powt.</th>
                  <th className="px-3 py-2">Ciezar</th>
                  <th className="px-3 py-2">1RM</th>
                  <th className="px-3 py-2">RPE</th>
                  <th className="px-3 py-2 text-right">Akcje</th>
                </tr>
              </thead>
              <tbody>
                {session.sets.map((set) => {
                  const exercise = exerciseMap.get(set.exerciseId);
                  const setOneRm = epleyOneRepMax(set.weight, set.reps);
                  const isPr =
                    setOneRm > 0 &&
                    setOneRm >= (prByExercise.get(set.exerciseId) ?? 0);
                  return (
                    <tr
                      key={set.id}
                      className="border-t border-white/[0.06] hover:bg-white/[0.04]"
                    >
                      <td className="px-3 py-2 font-medium">
                        <span className="inline-flex items-center gap-2">
                          {exercise?.name ?? "—"}
                          {isPr ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/20 px-2 py-0.5 text-[10px] font-semibold text-amber-200">
                              <Sparkles className="size-3" /> PR
                            </span>
                          ) : null}
                        </span>
                      </td>
                      <td className="px-3 py-2">{set.reps}</td>
                      <td className="px-3 py-2">
                        {set.weight}
                        {weightUnit}
                      </td>
                      <td className="px-3 py-2 text-violet-200">
                        {setOneRm}
                        {weightUnit}
                      </td>
                      <td className="px-3 py-2">{set.rpe ?? "—"}</td>
                      <td className="px-3 py-2">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => onEditSet(set)}
                            className="grid size-8 place-items-center rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.1]"
                            aria-label="Edytuj"
                          >
                            <Pencil className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onRemoveSet(set.id)}
                            className="grid size-8 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-rose-200 hover:bg-rose-500/20"
                            aria-label="Usun"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <ul className="mt-4 space-y-2 sm:hidden">
            {session.sets.map((set) => {
              const exercise = exerciseMap.get(set.exerciseId);
              const setOneRm = epleyOneRepMax(set.weight, set.reps);
              const isPr =
                setOneRm > 0 &&
                setOneRm >= (prByExercise.get(set.exerciseId) ?? 0);
              return (
                <li
                  key={set.id}
                  className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 text-sm font-semibold">
                        <span className="truncate">
                          {exercise?.name ?? "—"}
                        </span>
                        {isPr ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/20 px-2 py-0.5 text-[10px] font-semibold text-amber-200">
                            <Sparkles className="size-3" /> PR
                          </span>
                        ) : null}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        {set.reps} × {set.weight}
                        {weightUnit} · 1RM{" "}
                        <span className="text-violet-200">
                          {setOneRm}
                          {weightUnit}
                        </span>
                        {set.rpe ? ` · RPE ${set.rpe}` : ""}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <button
                        type="button"
                        onClick={() => onEditSet(set)}
                        className="grid size-9 place-items-center rounded-xl border border-white/10 bg-white/[0.04]"
                        aria-label="Edytuj"
                      >
                        <Pencil className="size-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onRemoveSet(set.id)}
                        className="grid size-9 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-rose-200"
                        aria-label="Usun"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}

function StatTile({
  label,
  value,
  sublabel,
}: {
  label: string;
  value: string;
  sublabel?: string;
}) {
  return (
    <div className="rounded-3xl border border-white/[0.08] bg-white/[0.04] p-3 sm:p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1.5 truncate text-xl font-semibold sm:mt-2 sm:text-2xl">
        {value}
      </p>
      {sublabel ? (
        <p className="mt-0.5 truncate text-[11px] text-slate-500">{sublabel}</p>
      ) : null}
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
