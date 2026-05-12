import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number, currency = "PLN") {
  return new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatPercent(value: number) {
  return `${Math.round(value)}%`;
}

export function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function toIsoDate(date: Date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export function shiftDate(iso: string, days: number) {
  const date = new Date(iso);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export function daysBetween(a: string, b: string) {
  const start = new Date(a);
  const end = new Date(b);
  const diff = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
  return Math.round(diff);
}

export function lastNDates(n: number, anchor: Date = new Date()) {
  return Array.from({ length: n }, (_, i) => {
    const date = new Date(anchor);
    date.setDate(anchor.getDate() - (n - 1 - i));
    return date.toISOString().slice(0, 10);
  });
}

export function formatShortDate(iso: string) {
  return new Date(iso).toLocaleDateString("pl-PL", {
    day: "2-digit",
    month: "short",
  });
}

const WEEKDAY_LABELS = ["Nd", "Pn", "Wt", "Sr", "Cz", "Pt", "Sb"];

export function weekdayShort(iso: string) {
  const day = new Date(iso).getDay();
  return WEEKDAY_LABELS[day];
}

export function relativeDayLabel(iso: string) {
  const today = toIsoDate();
  if (iso === today) return "Dzis";
  const yesterday = shiftDate(today, -1);
  if (iso === yesterday) return "Wczoraj";
  return weekdayShort(iso);
}

export const WEEKDAY_NAMES = ["Nd", "Pn", "Wt", "Sr", "Cz", "Pt", "Sb"];

export function isHabitDueToday(
  cadence: "daily" | "weekly",
  weekdays: number[] | undefined,
  iso: string,
) {
  const day = new Date(iso).getDay();
  if (!weekdays || weekdays.length === 0) {
    return cadence === "daily" ? true : false;
  }
  return weekdays.includes(day);
}

export function formatMonthLabel(yearMonth: string) {
  const [year, month] = yearMonth.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString("pl-PL", {
    month: "long",
    year: "numeric",
  });
}

export function currentYearMonth(reference: Date = new Date()) {
  return `${reference.getFullYear()}-${String(reference.getMonth() + 1).padStart(
    2,
    "0",
  )}`;
}

export function shiftYearMonth(yearMonth: string, delta: number) {
  const [year, month] = yearMonth.split("-").map(Number);
  const date = new Date(year, month - 1 + delta, 1);
  return currentYearMonth(date);
}

export function clampNumber(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
