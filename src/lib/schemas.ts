import { z } from "zod";

export const habitSchema = z.object({
  title: z.string().min(1, "Nazwa habitu jest wymagana"),
  cadence: z.enum(["daily", "weekly"]),
  color: z.string().min(1),
  weekdays: z.array(z.number().min(0).max(6)).optional(),
  reminderTime: z.string().optional(),
});

export const taskTemplateSchema = z.object({
  title: z.string().min(1, "Tytul szablonu jest wymagany"),
  projectId: z.string().nullable(),
  priority: z.enum(["low", "medium", "high"]),
});

export const taskSchema = z.object({
  title: z.string().min(1, "Tytul taska jest wymagany"),
  projectId: z.string().nullable(),
  priority: z.enum(["low", "medium", "high"]),
  status: z.enum(["todo", "doing", "done"]),
  dueDate: z.string().nullable(),
});

export const projectSchema = z.object({
  name: z.string().min(1),
  color: z.string().min(1),
});

export const exerciseSchema = z.object({
  name: z.string().min(1, "Nazwa cwiczenia jest wymagana"),
  muscleGroup: z.string().min(1),
});

export const sessionSchema = z.object({
  name: z.string().min(1, "Nazwa sesji jest wymagana"),
  date: z.string().min(1),
  notes: z.string().optional(),
});

export const setSchema = z.object({
  exerciseId: z.string().min(1, "Wybierz cwiczenie"),
  reps: z.number({ message: "Wpisz liczbe powtorzen" }).int().positive(),
  weight: z.number({ message: "Wpisz ciezar" }).nonnegative(),
  rpe: z.number().min(1).max(10).optional(),
});

export const categorySchema = z.object({
  name: z.string().min(1),
  color: z.string().min(1),
  budget: z.number({ message: "Wpisz budzet" }).nonnegative(),
});

export const expenseSchema = z.object({
  amount: z.number({ message: "Wpisz kwote" }).positive(),
  categoryId: z.string().min(1),
  date: z.string().min(1),
  note: z.string().optional(),
  recurring: z.boolean(),
});

export const goalSchema = z.object({
  title: z.string().min(1),
  horizon: z.enum(["quarter", "year"]),
  progress: z.number().min(0).max(100),
  target: z.string().optional(),
});

export const noteSchema = z.object({
  title: z.string().min(1),
  content: z.string(),
});

export const bodyMetricSchema = z.object({
  date: z.string().min(1),
  weight: z.number({ message: "Wpisz wage" }).positive(),
  waist: z.number().positive().optional(),
  bodyFat: z.number().min(0).max(80).optional(),
});

export const calendarEventSchema = z.object({
  time: z.string().min(1),
  title: z.string().min(1),
  tag: z.string().min(1),
});

export type HabitInput = z.infer<typeof habitSchema>;
export type TaskInput = z.infer<typeof taskSchema>;
export type TaskTemplateInput = z.infer<typeof taskTemplateSchema>;
export type ProjectInput = z.infer<typeof projectSchema>;
export type ExerciseInput = z.infer<typeof exerciseSchema>;
export type SessionInput = z.infer<typeof sessionSchema>;
export type SetInput = z.infer<typeof setSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
export type ExpenseInput = z.infer<typeof expenseSchema>;
export type GoalInput = z.infer<typeof goalSchema>;
export type NoteInput = z.infer<typeof noteSchema>;
export type BodyMetricInput = z.infer<typeof bodyMetricSchema>;
export type CalendarEventInput = z.infer<typeof calendarEventSchema>;
