"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { taskSchema, type TaskInput } from "@/lib/schemas";
import { toIsoDate } from "@/lib/utils";
import { useAppStore } from "@/stores/app-store";
import { useDataStore } from "@/stores/data-store";

export function QuickAddTaskModal() {
  const open = useAppStore((state) => state.taskQuickAddOpen);
  const close = useAppStore((state) => state.closeTaskQuickAdd);
  const pushToast = useAppStore((state) => state.pushToast);

  const projects = useDataStore((state) => state.taskProjects);
  const templates = useDataStore((state) => state.taskTemplates);
  const tasks = useDataStore((state) => state.tasks);
  const addTask = useDataStore((state) => state.addTask);
  const applyTaskTemplate = useDataStore((state) => state.applyTaskTemplate);
  const removeTask = useDataStore((state) => state.removeTask);

  const lastProjectId =
    tasks[tasks.length - 1]?.projectId ?? projects[0]?.id ?? null;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TaskInput>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: "",
      projectId: lastProjectId,
      priority: "medium",
      status: "todo",
      dueDate: toIsoDate(),
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        title: "",
        projectId: lastProjectId,
        priority: "medium",
        status: "todo",
        dueDate: toIsoDate(),
      });
    }
  }, [open, lastProjectId, reset]);

  function onSubmit(values: TaskInput) {
    const id = addTask({
      ...values,
      projectId: values.projectId || null,
      dueDate: values.dueDate || null,
    });
    pushToast({
      message: `Task dodany: ${values.title}`,
      tone: "success",
      actionLabel: "Cofnij",
      onAction: () => removeTask(id),
    });
    close();
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title="Quick add"
      description="Dodaj task na dzis bez przelaczania widoku."
    >
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-slate-300">Tytul</span>
          <Input
            autoFocus
            placeholder="np. Zrobic plan tygodnia"
            {...register("title")}
          />
          {errors.title?.message ? (
            <span className="text-xs text-rose-300">
              {errors.title.message}
            </span>
          ) : null}
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-slate-300">Projekt</span>
            <Select {...register("projectId")}>
              <option value="">Bez projektu</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </Select>
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-slate-300">Priorytet</span>
            <Select {...register("priority")}>
              <option value="high">Wysoki</option>
              <option value="medium">Sredni</option>
              <option value="low">Niski</option>
            </Select>
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-slate-300">Deadline</span>
            <Input type="date" {...register("dueDate")} />
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-slate-300">Status</span>
            <Select {...register("status")}>
              <option value="todo">To do</option>
              <option value="doing">Doing</option>
              <option value="done">Done</option>
            </Select>
          </label>
        </div>

        {templates.length ? (
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-3">
            <p className="text-xs uppercase tracking-wider text-slate-500">
              Szablony
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {templates.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => {
                    applyTaskTemplate(template.id);
                    pushToast({
                      message: `Dodano z szablonu: ${template.title}`,
                      tone: "success",
                    });
                    close();
                  }}
                  className="rounded-full bg-white/[0.06] px-3 py-1 text-xs text-slate-200 hover:bg-white/[0.12]"
                >
                  {template.title}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" onClick={close}>
            Anuluj
          </Button>
          <Button type="submit" variant="primary">
            Dodaj task
          </Button>
        </div>
      </form>
    </Modal>
  );
}
