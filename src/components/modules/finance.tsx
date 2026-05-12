"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ChevronLeft,
  ChevronRight,
  Pencil,
  RefreshCcw,
  Trash2,
  WalletCards,
} from "lucide-react";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Progress } from "@/components/ui/progress";
import { Section } from "@/components/section";
import { Select } from "@/components/ui/select";
import {
  categorySchema,
  expenseSchema,
  type CategoryInput,
  type ExpenseInput,
} from "@/lib/schemas";
import {
  currentYearMonth,
  formatCurrency,
  formatMonthLabel,
  shiftYearMonth,
  toIsoDate,
} from "@/lib/utils";
import { useAppStore } from "@/stores/app-store";
import {
  useDataStore,
  type Expense,
  type ExpenseCategory,
} from "@/stores/data-store";

export function FinanceModule() {
  const categories = useDataStore((state) => state.expenseCategories);
  const expenses = useDataStore((state) => state.expenses);
  const currency = useDataStore((state) => state.settings.currency);
  const addCategory = useDataStore((state) => state.addExpenseCategory);
  const updateCategory = useDataStore((state) => state.updateExpenseCategory);
  const removeCategory = useDataStore((state) => state.removeExpenseCategory);
  const addExpense = useDataStore((state) => state.addExpense);
  const updateExpense = useDataStore((state) => state.updateExpense);
  const removeExpense = useDataStore((state) => state.removeExpense);
  const generateRecurringForMonth = useDataStore(
    (state) => state.generateRecurringForMonth,
  );
  const pushToast = useAppStore((state) => state.pushToast);

  const [expenseModal, setExpenseModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [categoryModal, setCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ExpenseCategory | null>(
    null,
  );
  const [month, setMonth] = useState(() => currentYearMonth());

  const monthExpenses = useMemo(
    () => expenses.filter((expense) => expense.date.startsWith(month)),
    [expenses, month],
  );

  const spentByCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const expense of monthExpenses) {
      map.set(
        expense.categoryId,
        (map.get(expense.categoryId) ?? 0) + expense.amount,
      );
    }
    return map;
  }, [monthExpenses]);

  const monthlySpend = monthExpenses.reduce(
    (sum, expense) => sum + expense.amount,
    0,
  );
  const monthlyBudget = categories.reduce(
    (sum, category) => sum + category.budget,
    0,
  );
  const remaining = monthlyBudget - monthlySpend;

  const pieData = categories
    .map((category) => ({
      name: category.name,
      value: spentByCategory.get(category.id) ?? 0,
      color: category.color,
    }))
    .filter((entry) => entry.value > 0);

  function handleGenerateRecurring() {
    const count = generateRecurringForMonth(month);
    if (count > 0) {
      pushToast({
        message: `Dodano ${count} powtarzajacych sie wpisow na ${formatMonthLabel(
          month,
        )}`,
        tone: "success",
      });
    } else {
      pushToast({
        message: "Brak nowych wpisow do dodania w tym miesiacu",
        tone: "info",
      });
    }
  }

  function handleRemoveExpense(id: string) {
    const removed = expenses.find((expense) => expense.id === id);
    removeExpense(id);
    if (removed) {
      pushToast({
        message: `Usunieto wydatek ${formatCurrency(
          removed.amount,
          currency,
        )}`,
        tone: "info",
        actionLabel: "Cofnij",
        onAction: () =>
          addExpense({
            amount: removed.amount,
            categoryId: removed.categoryId,
            date: removed.date,
            note: removed.note,
            recurring: removed.recurring,
          }),
      });
    }
  }

  const {
    register: registerExpense,
    handleSubmit: handleExpenseSubmit,
    reset: resetExpense,
    formState: { errors: expenseErrors },
  } = useForm<ExpenseInput>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      amount: 0,
      categoryId: categories[0]?.id ?? "",
      date: toIsoDate(),
      note: "",
      recurring: false,
    },
  });

  function openCreateExpense() {
    setEditingExpense(null);
    const todayIso = toIsoDate();
    resetExpense({
      amount: 0,
      categoryId: categories[0]?.id ?? "",
      date: todayIso.startsWith(month) ? todayIso : `${month}-15`,
      note: "",
      recurring: false,
    });
    setExpenseModal(true);
  }

  function openEditExpense(expense: Expense) {
    setEditingExpense(expense);
    resetExpense({
      amount: expense.amount,
      categoryId: expense.categoryId,
      date: expense.date,
      note: expense.note ?? "",
      recurring: expense.recurring,
    });
    setExpenseModal(true);
  }

  function onExpenseSubmit(values: ExpenseInput) {
    const payload = {
      amount: values.amount,
      categoryId: values.categoryId,
      date: values.date,
      note: values.note,
      recurring: values.recurring,
    };
    if (editingExpense) updateExpense(editingExpense.id, payload);
    else addExpense(payload);
    setExpenseModal(false);
  }

  return (
    <>
      <Section
        id="finance"
        title="Finance"
        subtitle="Wydatki, budzety i kategorie"
        action="Nowy wydatek"
        onAction={openCreateExpense}
        headerExtra={
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 rounded-2xl border border-white/10 bg-white/[0.04] px-2 py-1 text-sm">
              <button
                type="button"
                onClick={() => setMonth(shiftYearMonth(month, -1))}
                className="grid size-7 place-items-center rounded-xl hover:bg-white/[0.1]"
                aria-label="Poprzedni miesiac"
              >
                <ChevronLeft className="size-3.5" />
              </button>
              <span className="px-2 capitalize">{formatMonthLabel(month)}</span>
              <button
                type="button"
                onClick={() => setMonth(shiftYearMonth(month, 1))}
                className="grid size-7 place-items-center rounded-xl hover:bg-white/[0.1]"
                aria-label="Nastepny miesiac"
              >
                <ChevronRight className="size-3.5" />
              </button>
            </div>
            <Button onClick={handleGenerateRecurring}>
              <RefreshCcw className="mr-2 size-4" />
              Generuj recurring
            </Button>
            <Button onClick={() => setCategoryModal(true)}>
              <WalletCards className="mr-2 size-4" />
              Kategorie
            </Button>
          </div>
        }
      >
        <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
          <div className="rounded-3xl border border-white/[0.08] bg-white/[0.04] p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">
                  Wydatki · {formatMonthLabel(month)}
                </p>
                <p className="mt-2 text-3xl font-semibold">
                  {formatCurrency(monthlySpend, currency)}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  z {formatCurrency(monthlyBudget, currency)} budzetu
                </p>
                <p
                  className={
                    remaining >= 0
                      ? "mt-1 text-xs text-emerald-300"
                      : "mt-1 text-xs text-rose-300"
                  }
                >
                  {remaining >= 0
                    ? `Zostalo ${formatCurrency(remaining, currency)}`
                    : `Przekroczone o ${formatCurrency(-remaining, currency)}`}
                </p>
              </div>
              <Badge tone={monthlySpend > monthlyBudget ? "rose" : "green"}>
                {monthlyBudget
                  ? `${Math.round((monthlySpend / monthlyBudget) * 100)}%`
                  : "—"}
              </Badge>
            </div>
            <div className="mt-4 h-40">
              {pieData.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={42}
                      outerRadius={70}
                      paddingAngle={3}
                    >
                      {pieData.map((entry) => (
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
                <div className="grid h-full place-items-center text-xs text-slate-500">
                  Dodaj pierwszy wydatek, zeby zobaczyc wykres.
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            {categories.map((category) => {
              const spent = spentByCategory.get(category.id) ?? 0;
              const ratio = category.budget
                ? (spent / category.budget) * 100
                : 0;
              return (
                <div
                  key={category.id}
                  className="rounded-3xl border border-white/[0.08] bg-white/[0.04] p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span
                        className="inline-block size-3 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      <p className="text-sm font-semibold">{category.name}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-300">
                        {formatCurrency(spent, currency)} /{" "}
                        {formatCurrency(category.budget, currency)}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCategory(category);
                          setCategoryModal(true);
                        }}
                        className="grid size-8 place-items-center rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.1]"
                        aria-label="Edytuj"
                      >
                        <Pencil className="size-3.5" />
                      </button>
                    </div>
                  </div>
                  <Progress value={Math.min(100, ratio)} className="mt-3" />
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-6 rounded-3xl border border-white/[0.08] bg-white/[0.04] p-4">
          <p className="text-sm font-semibold">
            Wydatki · {formatMonthLabel(month)}
          </p>
          {monthExpenses.length === 0 ? (
            <p className="mt-3 text-sm text-slate-400">
              Brak wydatkow w tym miesiacu.
            </p>
          ) : (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead className="text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Data</th>
                    <th className="px-3 py-2">Kategoria</th>
                    <th className="px-3 py-2">Kwota</th>
                    <th className="px-3 py-2">Notatka</th>
                    <th className="px-3 py-2 text-right">Akcje</th>
                  </tr>
                </thead>
                <tbody>
                  {[...monthExpenses]
                    .sort((a, b) => b.date.localeCompare(a.date))
                    .map((expense) => {
                      const category = categories.find(
                        (cat) => cat.id === expense.categoryId,
                      );
                      return (
                        <tr
                          key={expense.id}
                          className="border-t border-white/[0.06] hover:bg-white/[0.04]"
                        >
                          <td className="px-3 py-2">{expense.date}</td>
                          <td className="px-3 py-2">
                            <span className="inline-flex items-center gap-2">
                              {category ? (
                                <span
                                  className="inline-block size-2 rounded-full"
                                  style={{ backgroundColor: category.color }}
                                />
                              ) : null}
                              {category?.name ?? "—"}
                            </span>
                          </td>
                          <td className="px-3 py-2 font-semibold">
                            {formatCurrency(expense.amount, currency)}
                            {expense.recurring ? (
                              <Badge tone="violet" className="ml-2">
                                rec
                              </Badge>
                            ) : null}
                          </td>
                          <td className="px-3 py-2 text-slate-400">
                            {expense.note ?? "—"}
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => openEditExpense(expense)}
                                className="grid size-8 place-items-center rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.1]"
                                aria-label="Edytuj"
                              >
                                <Pencil className="size-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveExpense(expense.id)}
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
          )}
        </div>
      </Section>

      <Modal
        open={expenseModal}
        onClose={() => setExpenseModal(false)}
        title={editingExpense ? "Edytuj wydatek" : "Nowy wydatek"}
      >
        <form
          onSubmit={handleExpenseSubmit(onExpenseSubmit)}
          className="space-y-4"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label={`Kwota (${currency})`}
              error={expenseErrors.amount?.message}
            >
              <Input
                type="number"
                min={0}
                step={0.01}
                {...registerExpense("amount", { valueAsNumber: true })}
              />
            </Field>
            <Field label="Data" error={expenseErrors.date?.message}>
              <Input type="date" {...registerExpense("date")} />
            </Field>
            <Field
              label="Kategoria"
              error={expenseErrors.categoryId?.message}
            >
              <Select {...registerExpense("categoryId")}>
                {categories.length === 0 ? (
                  <option value="">Dodaj kategorie w panelu</option>
                ) : null}
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Powtarzalny">
              <Select
                {...registerExpense("recurring", {
                  setValueAs: (value) => value === true || value === "true",
                })}
              >
                <option value="false">Nie</option>
                <option value="true">Tak</option>
              </Select>
            </Field>
          </div>
          <Field label="Notatka">
            <Input {...registerExpense("note")} placeholder="np. zakupy" />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" onClick={() => setExpenseModal(false)}>
              Anuluj
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={categories.length === 0}
            >
              Zapisz
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={categoryModal}
        onClose={() => {
          setCategoryModal(false);
          setEditingCategory(null);
        }}
        title="Kategorie wydatkow"
        description="Ustal budzet miesieczny i kolor dla kazdej kategorii."
      >
        <CategoryEditor
          categories={categories}
          editing={editingCategory}
          onAdd={addCategory}
          onUpdate={(id, patch) => {
            updateCategory(id, patch);
            setEditingCategory(null);
          }}
          onRemove={(id) => {
            removeCategory(id);
            setEditingCategory(null);
          }}
          onCancelEdit={() => setEditingCategory(null)}
        />
        <div className="mt-4 flex justify-end">
          <Button
            variant="primary"
            onClick={() => {
              setCategoryModal(false);
              setEditingCategory(null);
            }}
          >
            Gotowe
          </Button>
        </div>
      </Modal>
    </>
  );
}

function CategoryEditor({
  categories,
  editing,
  onAdd,
  onUpdate,
  onRemove,
  onCancelEdit,
}: {
  categories: ExpenseCategory[];
  editing: ExpenseCategory | null;
  onAdd: (input: CategoryInput) => void;
  onUpdate: (id: string, patch: CategoryInput) => void;
  onRemove: (id: string) => void;
  onCancelEdit: () => void;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CategoryInput>({
    resolver: zodResolver(categorySchema),
    defaultValues: editing
      ? {
          name: editing.name,
          color: editing.color,
          budget: editing.budget,
        }
      : { name: "", color: "#a78bfa", budget: 500 },
  });

  function onSubmit(values: CategoryInput) {
    if (editing) onUpdate(editing.id, values);
    else onAdd(values);
    reset({ name: "", color: values.color, budget: values.budget });
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {categories.map((category) => (
          <div
            key={category.id}
            className="flex items-center justify-between rounded-2xl border border-white/[0.08] bg-white/[0.04] px-3 py-2"
          >
            <div className="flex items-center gap-3">
              <span
                className="inline-block size-3 rounded-full"
                style={{ backgroundColor: category.color }}
              />
              <div>
                <p className="text-sm font-medium">{category.name}</p>
                <p className="text-xs text-slate-500">
                  Budzet {category.budget.toLocaleString("pl-PL")} zl
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() =>
                  reset({
                    name: category.name,
                    color: category.color,
                    budget: category.budget,
                  })
                }
                className="grid size-8 place-items-center rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.1]"
                aria-label="Edytuj"
              >
                <Pencil className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onRemove(category.id)}
                className="grid size-8 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-rose-200 hover:bg-rose-500/20"
                aria-label="Usun"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="grid gap-3 sm:grid-cols-[1fr_120px_120px_auto]"
      >
        <Input {...register("name")} placeholder="Nazwa kategorii" />
        <Input
          type="number"
          min={0}
          step={50}
          {...register("budget", { valueAsNumber: true })}
          placeholder="Budzet"
        />
        <Input
          type="color"
          {...register("color")}
          className="h-11 w-full cursor-pointer p-1"
        />
        <div className="flex gap-2">
          {editing ? (
            <Button type="button" onClick={onCancelEdit}>
              Anuluj
            </Button>
          ) : null}
          <Button type="submit" variant="primary">
            {editing ? "Zapisz" : "Dodaj"}
          </Button>
        </div>
        {errors.name?.message ? (
          <span className="text-xs text-rose-300 sm:col-span-4">
            {errors.name.message}
          </span>
        ) : null}
      </form>
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
