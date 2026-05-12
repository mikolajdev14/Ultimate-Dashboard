"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Cadence = "daily" | "weekly";

export type Habit = {
  id: string;
  title: string;
  cadence: Cadence;
  color: string;
  createdAt: string;
  weekdays?: number[];
  reminderTime?: string;
};

export type HabitLog = {
  habitId: string;
  date: string;
  note?: string;
};

export type Priority = "low" | "medium" | "high";
export type TaskStatus = "todo" | "doing" | "done";

export type TaskProject = {
  id: string;
  name: string;
  color: string;
};

export type Task = {
  id: string;
  title: string;
  projectId: string | null;
  priority: Priority;
  status: TaskStatus;
  dueDate: string | null;
  createdAt: string;
  pinnedForToday?: boolean;
};

export type TaskTemplate = {
  id: string;
  title: string;
  projectId: string | null;
  priority: Priority;
};

export type Exercise = {
  id: string;
  name: string;
  muscleGroup: string;
};

export type WorkoutSet = {
  id: string;
  exerciseId: string;
  reps: number;
  weight: number;
  rpe?: number;
};

export type WorkoutSession = {
  id: string;
  date: string;
  name: string;
  notes?: string;
  sets: WorkoutSet[];
};

export type ExpenseCategory = {
  id: string;
  name: string;
  color: string;
  budget: number;
};

export type Expense = {
  id: string;
  amount: number;
  categoryId: string;
  date: string;
  note?: string;
  recurring: boolean;
};

export type Goal = {
  id: string;
  title: string;
  horizon: "quarter" | "year";
  progress: number;
  target?: string;
};

export type Note = {
  id: string;
  title: string;
  content: string;
  updatedAt: string;
};

export type BodyMetric = {
  id: string;
  date: string;
  weight: number;
  waist?: number;
  bodyFat?: number;
};

export type CalendarEvent = {
  id: string;
  time: string;
  title: string;
  tag: string;
};

export type FocusSession = {
  id: string;
  startedAt: string;
  durationMinutes: number;
  taskId?: string;
  taskTitle?: string;
};

export type Settings = {
  name: string;
  currency: string;
  weightUnit: "kg" | "lb";
  notificationsEnabled: boolean;
  theme: "dark" | "light";
  habitReminderTime: string;
  defaultFocusMinutes: number;
};

type DataState = {
  habits: Habit[];
  habitLogs: HabitLog[];

  taskProjects: TaskProject[];
  tasks: Task[];
  taskTemplates: TaskTemplate[];

  exercises: Exercise[];
  sessions: WorkoutSession[];

  expenseCategories: ExpenseCategory[];
  expenses: Expense[];

  goals: Goal[];
  notes: Note[];
  bodyMetrics: BodyMetric[];
  calendarEvents: CalendarEvent[];
  focusSessions: FocusSession[];
  settings: Settings;

  addHabit: (input: Omit<Habit, "id" | "createdAt">) => void;
  updateHabit: (id: string, patch: Partial<Omit<Habit, "id">>) => void;
  removeHabit: (id: string) => void;
  toggleHabitLog: (habitId: string, date: string, note?: string) => void;
  setHabitLogNote: (habitId: string, date: string, note: string) => void;

  addTaskProject: (input: Omit<TaskProject, "id">) => string;
  removeTaskProject: (id: string) => void;
  addTask: (input: Omit<Task, "id" | "createdAt">) => string;
  updateTask: (id: string, patch: Partial<Omit<Task, "id">>) => void;
  removeTask: (id: string) => void;
  addTaskTemplate: (input: Omit<TaskTemplate, "id">) => void;
  removeTaskTemplate: (id: string) => void;
  applyTaskTemplate: (id: string, dueDate?: string | null) => void;

  addExercise: (input: Omit<Exercise, "id">) => string;
  updateExercise: (id: string, patch: Partial<Omit<Exercise, "id">>) => void;
  removeExercise: (id: string) => void;
  addSession: (input: Omit<WorkoutSession, "id">) => string;
  updateSession: (
    id: string,
    patch: Partial<Omit<WorkoutSession, "id" | "sets">>,
  ) => void;
  removeSession: (id: string) => void;
  duplicateLastSession: (date: string) => string | null;
  addSet: (sessionId: string, input: Omit<WorkoutSet, "id">) => void;
  updateSet: (
    sessionId: string,
    setId: string,
    patch: Partial<Omit<WorkoutSet, "id">>,
  ) => void;
  removeSet: (sessionId: string, setId: string) => void;

  addExpenseCategory: (input: Omit<ExpenseCategory, "id">) => string;
  updateExpenseCategory: (
    id: string,
    patch: Partial<Omit<ExpenseCategory, "id">>,
  ) => void;
  removeExpenseCategory: (id: string) => void;
  addExpense: (input: Omit<Expense, "id">) => void;
  updateExpense: (id: string, patch: Partial<Omit<Expense, "id">>) => void;
  removeExpense: (id: string) => void;
  generateRecurringForMonth: (yearMonth: string) => number;

  addGoal: (input: Omit<Goal, "id">) => void;
  updateGoal: (id: string, patch: Partial<Omit<Goal, "id">>) => void;
  removeGoal: (id: string) => void;

  addNote: (input: Omit<Note, "id" | "updatedAt">) => void;
  updateNote: (id: string, patch: Partial<Omit<Note, "id" | "updatedAt">>) => void;
  removeNote: (id: string) => void;

  addBodyMetric: (input: Omit<BodyMetric, "id">) => void;
  updateBodyMetric: (id: string, patch: Partial<Omit<BodyMetric, "id">>) => void;
  removeBodyMetric: (id: string) => void;

  addCalendarEvent: (input: Omit<CalendarEvent, "id">) => void;
  updateCalendarEvent: (
    id: string,
    patch: Partial<Omit<CalendarEvent, "id">>,
  ) => void;
  removeCalendarEvent: (id: string) => void;
  reorderCalendarEvents: (orderedIds: string[]) => void;

  addFocusSession: (input: Omit<FocusSession, "id">) => void;

  updateSettings: (patch: Partial<Settings>) => void;
  resetAll: () => void;
  importState: (snapshot: Partial<PersistedState>) => void;
};

type PersistedState = Pick<
  DataState,
  | "habits"
  | "habitLogs"
  | "taskProjects"
  | "tasks"
  | "taskTemplates"
  | "exercises"
  | "sessions"
  | "expenseCategories"
  | "expenses"
  | "goals"
  | "notes"
  | "bodyMetrics"
  | "calendarEvents"
  | "focusSessions"
  | "settings"
>;

function uid() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

const today = () => new Date().toISOString().slice(0, 10);

const seedHabits: Habit[] = [
  {
    id: "habit-sleep",
    title: "Sen 7.5h",
    cadence: "daily",
    color: "#a78bfa",
    createdAt: today(),
    reminderTime: "22:30",
  },
  {
    id: "habit-read",
    title: "Czytanie 20 min",
    cadence: "daily",
    color: "#22c55e",
    createdAt: today(),
  },
  {
    id: "habit-plan",
    title: "Plan tygodnia",
    cadence: "weekly",
    color: "#f97316",
    createdAt: today(),
    weekdays: [0],
  },
];

function seedHabitLogs(): HabitLog[] {
  const logs: HabitLog[] = [];
  const now = new Date();
  for (let i = 0; i < 12; i += 1) {
    const date = new Date(now);
    date.setDate(now.getDate() - i);
    const iso = date.toISOString().slice(0, 10);
    if (i % 4 !== 1) logs.push({ habitId: "habit-sleep", date: iso });
    if (i % 5 !== 2) logs.push({ habitId: "habit-read", date: iso });
    if (i === 0 || i === 7) logs.push({ habitId: "habit-plan", date: iso });
  }
  return logs;
}

const seedProjects: TaskProject[] = [
  { id: "project-work", name: "Praca", color: "#a78bfa" },
  { id: "project-health", name: "Zdrowie", color: "#22c55e" },
  { id: "project-finance", name: "Finanse", color: "#38bdf8" },
];

const seedTasks: Task[] = [
  {
    id: "task-1",
    title: "Zamknac roadmap Q2",
    projectId: "project-work",
    priority: "high",
    status: "doing",
    dueDate: today(),
    createdAt: today(),
    pinnedForToday: true,
  },
  {
    id: "task-2",
    title: "Przygotowac meal prep",
    projectId: "project-health",
    priority: "medium",
    status: "todo",
    dueDate: today(),
    createdAt: today(),
  },
  {
    id: "task-3",
    title: "Przejrzec budzet subskrypcji",
    projectId: "project-finance",
    priority: "medium",
    status: "todo",
    dueDate: today(),
    createdAt: today(),
  },
];

const seedTemplates: TaskTemplate[] = [
  {
    id: "tpl-weekly-review",
    title: "Weekly review",
    projectId: "project-work",
    priority: "medium",
  },
  {
    id: "tpl-budget-review",
    title: "Review budzetu",
    projectId: "project-finance",
    priority: "medium",
  },
];

const seedExercises: Exercise[] = [
  { id: "ex-bench", name: "Bench press", muscleGroup: "Klatka" },
  { id: "ex-squat", name: "Back squat", muscleGroup: "Nogi" },
  { id: "ex-pullup", name: "Weighted pull-up", muscleGroup: "Plecy" },
];

const seedSessions: WorkoutSession[] = [
  {
    id: "session-1",
    date: today(),
    name: "Upper body strength",
    notes: "Pierwsza sesja w nowym cyklu.",
    sets: [
      { id: uid(), exerciseId: "ex-bench", reps: 5, weight: 90, rpe: 7 },
      { id: uid(), exerciseId: "ex-bench", reps: 5, weight: 92.5, rpe: 8 },
      { id: uid(), exerciseId: "ex-pullup", reps: 8, weight: 20 },
    ],
  },
];

const seedCategories: ExpenseCategory[] = [
  { id: "cat-housing", name: "Mieszkanie", color: "#8b5cf6", budget: 2500 },
  { id: "cat-food", name: "Jedzenie", color: "#22c55e", budget: 1200 },
  { id: "cat-transport", name: "Transport", color: "#f97316", budget: 500 },
  { id: "cat-growth", name: "Rozwoj", color: "#38bdf8", budget: 800 },
];

const seedExpenses: Expense[] = [
  {
    id: uid(),
    amount: 2400,
    categoryId: "cat-housing",
    date: today(),
    recurring: true,
  },
  {
    id: uid(),
    amount: 480,
    categoryId: "cat-food",
    date: today(),
    recurring: false,
  },
  {
    id: uid(),
    amount: 220,
    categoryId: "cat-transport",
    date: today(),
    recurring: false,
  },
  {
    id: uid(),
    amount: 340,
    categoryId: "cat-growth",
    date: today(),
    recurring: false,
  },
];

const seedGoals: Goal[] = [
  {
    id: "goal-system",
    title: "Zbudowac system produktywnosci",
    horizon: "quarter",
    progress: 65,
  },
  {
    id: "goal-squat",
    title: "Przysiad 170 kg",
    horizon: "year",
    progress: 58,
  },
  {
    id: "goal-savings",
    title: "Poduszka finansowa 6 mies.",
    horizon: "year",
    progress: 42,
  },
];

const seedNotes: Note[] = [
  {
    id: uid(),
    title: "Plan dnia",
    content: "Najwiekszy boost daje plan dnia przed 9:00.",
    updatedAt: today(),
  },
  {
    id: uid(),
    title: "Workout",
    content: "Pilnowac progresji w pull-upach co tydzien +1 powt.",
    updatedAt: today(),
  },
];

const seedBody: BodyMetric[] = [
  { id: uid(), date: "2026-05-01", weight: 82.4, waist: 88 },
  { id: uid(), date: "2026-05-04", weight: 82.1, waist: 87.5 },
  { id: uid(), date: "2026-05-07", weight: 81.8, waist: 87 },
  { id: uid(), date: "2026-05-10", weight: 81.4, waist: 86.5 },
  { id: uid(), date: "2026-05-12", weight: 81.2, waist: 86 },
];

const seedCalendar: CalendarEvent[] = [
  { id: uid(), time: "08:00", title: "Mobility + plan dnia", tag: "Zdrowie" },
  { id: uid(), time: "10:30", title: "Deep work: roadmap", tag: "Praca" },
  { id: uid(), time: "17:30", title: "Upper strength", tag: "Trening" },
  { id: uid(), time: "20:00", title: "Review budzetu", tag: "Finanse" },
];

const seedSettings: Settings = {
  name: "Mikolaj",
  currency: "PLN",
  weightUnit: "kg",
  notificationsEnabled: false,
  theme: "dark",
  habitReminderTime: "20:00",
  defaultFocusMinutes: 25,
};

const initialState: PersistedState = {
  habits: seedHabits,
  habitLogs: seedHabitLogs(),
  taskProjects: seedProjects,
  tasks: seedTasks,
  taskTemplates: seedTemplates,
  exercises: seedExercises,
  sessions: seedSessions,
  expenseCategories: seedCategories,
  expenses: seedExpenses,
  goals: seedGoals,
  notes: seedNotes,
  bodyMetrics: seedBody,
  calendarEvents: seedCalendar,
  focusSessions: [],
  settings: seedSettings,
};

function endOfMonth(yearMonth: string) {
  const [year, month] = yearMonth.split("-").map(Number);
  const date = new Date(year, month, 0);
  return `${yearMonth}-${String(date.getDate()).padStart(2, "0")}`;
}

export const useDataStore = create<DataState>()(
  persist(
    (set, get) => ({
      ...initialState,

      addHabit: (input) =>
        set((state) => ({
          habits: [
            ...state.habits,
            { ...input, id: uid(), createdAt: today() },
          ],
        })),
      updateHabit: (id, patch) =>
        set((state) => ({
          habits: state.habits.map((habit) =>
            habit.id === id ? { ...habit, ...patch } : habit,
          ),
        })),
      removeHabit: (id) =>
        set((state) => ({
          habits: state.habits.filter((habit) => habit.id !== id),
          habitLogs: state.habitLogs.filter((log) => log.habitId !== id),
        })),
      toggleHabitLog: (habitId, date, note) =>
        set((state) => {
          const exists = state.habitLogs.some(
            (log) => log.habitId === habitId && log.date === date,
          );
          return {
            habitLogs: exists
              ? state.habitLogs.filter(
                  (log) => !(log.habitId === habitId && log.date === date),
                )
              : [
                  ...state.habitLogs,
                  { habitId, date, ...(note ? { note } : {}) },
                ],
          };
        }),
      setHabitLogNote: (habitId, date, note) =>
        set((state) => {
          const exists = state.habitLogs.some(
            (log) => log.habitId === habitId && log.date === date,
          );
          if (!exists) {
            return {
              habitLogs: [...state.habitLogs, { habitId, date, note }],
            };
          }
          return {
            habitLogs: state.habitLogs.map((log) =>
              log.habitId === habitId && log.date === date
                ? { ...log, note }
                : log,
            ),
          };
        }),

      addTaskProject: (input) => {
        const id = uid();
        set((state) => ({
          taskProjects: [...state.taskProjects, { ...input, id }],
        }));
        return id;
      },
      removeTaskProject: (id) =>
        set((state) => ({
          taskProjects: state.taskProjects.filter((project) => project.id !== id),
          tasks: state.tasks.map((task) =>
            task.projectId === id ? { ...task, projectId: null } : task,
          ),
        })),
      addTask: (input) => {
        const id = uid();
        set((state) => ({
          tasks: [...state.tasks, { ...input, id, createdAt: today() }],
        }));
        return id;
      },
      updateTask: (id, patch) =>
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id ? { ...task, ...patch } : task,
          ),
        })),
      removeTask: (id) =>
        set((state) => ({
          tasks: state.tasks.filter((task) => task.id !== id),
        })),
      addTaskTemplate: (input) =>
        set((state) => ({
          taskTemplates: [...state.taskTemplates, { ...input, id: uid() }],
        })),
      removeTaskTemplate: (id) =>
        set((state) => ({
          taskTemplates: state.taskTemplates.filter(
            (template) => template.id !== id,
          ),
        })),
      applyTaskTemplate: (id, dueDate) => {
        const state = get();
        const template = state.taskTemplates.find((t) => t.id === id);
        if (!template) return;
        state.addTask({
          title: template.title,
          projectId: template.projectId,
          priority: template.priority,
          status: "todo",
          dueDate: dueDate ?? today(),
        });
      },

      addExercise: (input) => {
        const id = uid();
        set((state) => ({
          exercises: [...state.exercises, { ...input, id }],
        }));
        return id;
      },
      updateExercise: (id, patch) =>
        set((state) => ({
          exercises: state.exercises.map((exercise) =>
            exercise.id === id ? { ...exercise, ...patch } : exercise,
          ),
        })),
      removeExercise: (id) =>
        set((state) => ({
          exercises: state.exercises.filter((exercise) => exercise.id !== id),
          sessions: state.sessions.map((session) => ({
            ...session,
            sets: session.sets.filter((set) => set.exerciseId !== id),
          })),
        })),
      addSession: (input) => {
        const id = uid();
        set((state) => ({
          sessions: [{ ...input, id }, ...state.sessions],
        }));
        return id;
      },
      updateSession: (id, patch) =>
        set((state) => ({
          sessions: state.sessions.map((session) =>
            session.id === id ? { ...session, ...patch } : session,
          ),
        })),
      removeSession: (id) =>
        set((state) => ({
          sessions: state.sessions.filter((session) => session.id !== id),
        })),
      duplicateLastSession: (date) => {
        const state = get();
        const sorted = [...state.sessions].sort((a, b) =>
          b.date.localeCompare(a.date),
        );
        const last = sorted[0];
        if (!last) return null;
        const newId = uid();
        set((current) => ({
          sessions: [
            {
              id: newId,
              date,
              name: last.name,
              notes: last.notes,
              sets: last.sets.map((set) => ({ ...set, id: uid() })),
            },
            ...current.sessions,
          ],
        }));
        return newId;
      },
      addSet: (sessionId, input) =>
        set((state) => ({
          sessions: state.sessions.map((session) =>
            session.id === sessionId
              ? {
                  ...session,
                  sets: [...session.sets, { ...input, id: uid() }],
                }
              : session,
          ),
        })),
      updateSet: (sessionId, setId, patch) =>
        set((state) => ({
          sessions: state.sessions.map((session) =>
            session.id === sessionId
              ? {
                  ...session,
                  sets: session.sets.map((set) =>
                    set.id === setId ? { ...set, ...patch } : set,
                  ),
                }
              : session,
          ),
        })),
      removeSet: (sessionId, setId) =>
        set((state) => ({
          sessions: state.sessions.map((session) =>
            session.id === sessionId
              ? {
                  ...session,
                  sets: session.sets.filter((set) => set.id !== setId),
                }
              : session,
          ),
        })),

      addExpenseCategory: (input) => {
        const id = uid();
        set((state) => ({
          expenseCategories: [...state.expenseCategories, { ...input, id }],
        }));
        return id;
      },
      updateExpenseCategory: (id, patch) =>
        set((state) => ({
          expenseCategories: state.expenseCategories.map((category) =>
            category.id === id ? { ...category, ...patch } : category,
          ),
        })),
      removeExpenseCategory: (id) =>
        set((state) => ({
          expenseCategories: state.expenseCategories.filter(
            (category) => category.id !== id,
          ),
          expenses: state.expenses.filter((expense) => expense.categoryId !== id),
        })),
      addExpense: (input) =>
        set((state) => ({
          expenses: [...state.expenses, { ...input, id: uid() }],
        })),
      updateExpense: (id, patch) =>
        set((state) => ({
          expenses: state.expenses.map((expense) =>
            expense.id === id ? { ...expense, ...patch } : expense,
          ),
        })),
      removeExpense: (id) =>
        set((state) => ({
          expenses: state.expenses.filter((expense) => expense.id !== id),
        })),
      generateRecurringForMonth: (yearMonth) => {
        const state = get();
        const recurringTemplates = state.expenses.filter((e) => e.recurring);
        const grouped = new Map<string, Expense>();
        for (const expense of recurringTemplates) {
          const key = `${expense.categoryId}:${Math.round(expense.amount * 100)}`;
          const existing = grouped.get(key);
          if (!existing || existing.date < expense.date) grouped.set(key, expense);
        }
        const existingForMonth = new Set(
          state.expenses
            .filter((expense) => expense.date.startsWith(yearMonth))
            .map(
              (expense) =>
                `${expense.categoryId}:${Math.round(expense.amount * 100)}`,
            ),
        );
        const created: Expense[] = [];
        const targetDay = endOfMonth(yearMonth);
        const todayIso = today();
        const finalDate = targetDay > todayIso ? todayIso : targetDay;
        for (const [key, template] of grouped.entries()) {
          if (existingForMonth.has(key)) continue;
          created.push({
            ...template,
            id: uid(),
            date: finalDate,
            recurring: true,
          });
        }
        if (created.length) {
          set((current) => ({
            expenses: [...current.expenses, ...created],
          }));
        }
        return created.length;
      },

      addGoal: (input) =>
        set((state) => ({ goals: [...state.goals, { ...input, id: uid() }] })),
      updateGoal: (id, patch) =>
        set((state) => ({
          goals: state.goals.map((goal) =>
            goal.id === id ? { ...goal, ...patch } : goal,
          ),
        })),
      removeGoal: (id) =>
        set((state) => ({ goals: state.goals.filter((goal) => goal.id !== id) })),

      addNote: (input) =>
        set((state) => ({
          notes: [
            { ...input, id: uid(), updatedAt: new Date().toISOString() },
            ...state.notes,
          ],
        })),
      updateNote: (id, patch) =>
        set((state) => ({
          notes: state.notes.map((note) =>
            note.id === id
              ? { ...note, ...patch, updatedAt: new Date().toISOString() }
              : note,
          ),
        })),
      removeNote: (id) =>
        set((state) => ({ notes: state.notes.filter((note) => note.id !== id) })),

      addBodyMetric: (input) =>
        set((state) => ({
          bodyMetrics: [...state.bodyMetrics, { ...input, id: uid() }].sort(
            (a, b) => a.date.localeCompare(b.date),
          ),
        })),
      updateBodyMetric: (id, patch) =>
        set((state) => ({
          bodyMetrics: state.bodyMetrics
            .map((metric) =>
              metric.id === id ? { ...metric, ...patch } : metric,
            )
            .sort((a, b) => a.date.localeCompare(b.date)),
        })),
      removeBodyMetric: (id) =>
        set((state) => ({
          bodyMetrics: state.bodyMetrics.filter((metric) => metric.id !== id),
        })),

      addCalendarEvent: (input) =>
        set((state) => ({
          calendarEvents: [...state.calendarEvents, { ...input, id: uid() }].sort(
            (a, b) => a.time.localeCompare(b.time),
          ),
        })),
      updateCalendarEvent: (id, patch) =>
        set((state) => ({
          calendarEvents: state.calendarEvents
            .map((event) => (event.id === id ? { ...event, ...patch } : event))
            .sort((a, b) => a.time.localeCompare(b.time)),
        })),
      removeCalendarEvent: (id) =>
        set((state) => ({
          calendarEvents: state.calendarEvents.filter((event) => event.id !== id),
        })),
      reorderCalendarEvents: (orderedIds) =>
        set((state) => {
          const map = new Map(state.calendarEvents.map((e) => [e.id, e]));
          const reordered = orderedIds
            .map((id) => map.get(id))
            .filter((value): value is CalendarEvent => Boolean(value));
          return {
            calendarEvents: reordered.length
              ? reordered
              : state.calendarEvents,
          };
        }),

      addFocusSession: (input) =>
        set((state) => ({
          focusSessions: [{ ...input, id: uid() }, ...state.focusSessions].slice(
            0,
            120,
          ),
        })),

      updateSettings: (patch) =>
        set((state) => ({ settings: { ...state.settings, ...patch } })),
      resetAll: () => set(() => ({ ...initialState })),
      importState: (snapshot) =>
        set((state) => ({
          ...state,
          ...snapshot,
        })),
    }),
    {
      name: "ultimate-dashboard:v2",
      version: 2,
    },
  ),
);

export function epleyOneRepMax(weight: number, reps: number) {
  if (reps <= 0) return 0;
  if (reps === 1) return weight;
  return Math.round(weight * (1 + reps / 30) * 10) / 10;
}

export function getOneRepMaxForExercise(
  sessions: WorkoutSession[],
  exerciseId: string,
) {
  let max = 0;
  for (const session of sessions) {
    for (const set of session.sets) {
      if (set.exerciseId !== exerciseId) continue;
      const oneRm = epleyOneRepMax(set.weight, set.reps);
      if (oneRm > max) max = oneRm;
    }
  }
  return max;
}
