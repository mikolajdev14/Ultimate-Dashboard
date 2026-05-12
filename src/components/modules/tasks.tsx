"use client";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LayoutTemplate, Pencil, Pin, PinOff, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Section } from "@/components/section";
import { Select } from "@/components/ui/select";
import {
  taskSchema,
  taskTemplateSchema,
  type TaskInput,
  type TaskTemplateInput,
} from "@/lib/schemas";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/stores/app-store";
import {
  useDataStore,
  type Task,
  type TaskStatus,
  type TaskTemplate,
} from "@/stores/data-store";

const priorityTone = {
  low: "neutral",
  medium: "amber",
  high: "rose",
} as const;

const columns: { id: TaskStatus; title: string }[] = [
  { id: "todo", title: "To do" },
  { id: "doing", title: "Doing" },
  { id: "done", title: "Done" },
];

export function TasksModule() {
  const tasks = useDataStore((state) => state.tasks);
  const projects = useDataStore((state) => state.taskProjects);
  const templates = useDataStore((state) => state.taskTemplates);
  const addTask = useDataStore((state) => state.addTask);
  const updateTask = useDataStore((state) => state.updateTask);
  const removeTask = useDataStore((state) => state.removeTask);
  const addProject = useDataStore((state) => state.addTaskProject);
  const removeProject = useDataStore((state) => state.removeTaskProject);
  const addTaskTemplate = useDataStore((state) => state.addTaskTemplate);
  const removeTaskTemplate = useDataStore((state) => state.removeTaskTemplate);
  const applyTaskTemplate = useDataStore((state) => state.applyTaskTemplate);

  const openTaskQuickAdd = useAppStore((state) => state.openTaskQuickAdd);
  const searchQuery = useAppStore((state) => state.searchQuery);
  const pushToast = useAppStore((state) => state.pushToast);

  const [taskModal, setTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [projectModal, setProjectModal] = useState(false);
  const [templatesModal, setTemplatesModal] = useState(false);
  const [confirmRemoveTask, setConfirmRemoveTask] = useState<string | null>(
    null,
  );
  const [filterProject, setFilterProject] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [localQuery, setLocalQuery] = useState("");

  const effectiveQuery = localQuery || searchQuery;

  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor));

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TaskInput>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: "",
      projectId: projects[0]?.id ?? null,
      priority: "medium",
      status: "todo",
      dueDate: null,
    },
  });

  function openEdit(task: Task) {
    setEditingTask(task);
    reset({
      title: task.title,
      projectId: task.projectId,
      priority: task.priority,
      status: task.status,
      dueDate: task.dueDate,
    });
    setTaskModal(true);
  }

  function onSubmit(values: TaskInput) {
    const sanitized: TaskInput = {
      ...values,
      projectId: values.projectId ? values.projectId : null,
      dueDate: values.dueDate ? values.dueDate : null,
    };
    if (editingTask) updateTask(editingTask.id, sanitized);
    else addTask(sanitized);
    setTaskModal(false);
  }

  function handleDragEnd(event: DragEndEvent) {
    const taskId = String(event.active.id);
    const next = event.over?.id as TaskStatus | undefined;
    if (!next) return;
    updateTask(taskId, { status: next });
  }

  function handleRemoveTask(id: string) {
    const removed = tasks.find((task) => task.id === id);
    removeTask(id);
    setConfirmRemoveTask(null);
    if (removed) {
      pushToast({
        message: `Usunieto: ${removed.title}`,
        tone: "info",
        actionLabel: "Cofnij",
        onAction: () => {
          addTask({
            title: removed.title,
            projectId: removed.projectId,
            priority: removed.priority,
            status: removed.status,
            dueDate: removed.dueDate,
            pinnedForToday: removed.pinnedForToday,
          });
        },
      });
    }
  }

  const visibleTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (filterProject !== "all" && task.projectId !== filterProject) {
        if (!(filterProject === "none" && !task.projectId)) return false;
      }
      if (filterPriority !== "all" && task.priority !== filterPriority) {
        return false;
      }
      if (effectiveQuery.trim()) {
        const lower = effectiveQuery.toLowerCase();
        if (!task.title.toLowerCase().includes(lower)) return false;
      }
      return true;
    });
  }, [tasks, filterProject, filterPriority, effectiveQuery]);

  const tasksByStatus = useMemo(() => {
    return columns.reduce<Record<TaskStatus, Task[]>>(
      (acc, column) => {
        acc[column.id] = visibleTasks.filter(
          (task) => task.status === column.id,
        );
        return acc;
      },
      { todo: [], doing: [], done: [] },
    );
  }, [visibleTasks]);

  return (
    <>
      <Section
        id="tasks"
        title="Tasks & Projects"
        subtitle="Kanban z filtrami, drag & drop, szablonami i pinem na dzis"
        action="Nowy task"
        onAction={openTaskQuickAdd}
        headerExtra={
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setTemplatesModal(true)}>
              <LayoutTemplate className="mr-2 size-4" /> Szablony
            </Button>
            <Button onClick={() => setProjectModal(true)}>
              <Plus className="mr-2 size-4" /> Projekty
            </Button>
          </div>
        }
      >
        <div className="mb-4 grid gap-2 sm:grid-cols-[1fr_180px_180px]">
          <Input
            value={effectiveQuery}
            onChange={(event) => setLocalQuery(event.target.value)}
            placeholder="Szukaj po tytule..."
          />
          <Select
            value={filterProject}
            onChange={(event) => setFilterProject(event.target.value)}
          >
            <option value="all">Wszystkie projekty</option>
            <option value="none">Bez projektu</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </Select>
          <Select
            value={filterPriority}
            onChange={(event) => setFilterPriority(event.target.value)}
          >
            <option value="all">Wszystkie priorytety</option>
            <option value="high">Wysoki</option>
            <option value="medium">Sredni</option>
            <option value="low">Niski</option>
          </Select>
        </div>

        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <div className="grid gap-3 md:grid-cols-3">
            {columns.map((column) => (
              <KanbanColumn
                key={column.id}
                id={column.id}
                title={column.title}
                tasks={tasksByStatus[column.id]}
                projects={projects}
                onEdit={openEdit}
                onRemove={setConfirmRemoveTask}
                onTogglePin={(task) =>
                  updateTask(task.id, {
                    pinnedForToday: !task.pinnedForToday,
                  })
                }
              />
            ))}
          </div>
        </DndContext>
      </Section>

      <Modal
        open={taskModal}
        onClose={() => setTaskModal(false)}
        title={editingTask ? "Edytuj task" : "Nowy task"}
      >
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <Field label="Tytul" error={errors.title?.message}>
            <Input {...register("title")} placeholder="np. Przejrzec roadmap" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Projekt">
              <Select {...register("projectId")}>
                <option value="">Bez projektu</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Priorytet">
              <Select {...register("priority")}>
                <option value="low">Niski</option>
                <option value="medium">Sredni</option>
                <option value="high">Wysoki</option>
              </Select>
            </Field>
            <Field label="Status">
              <Select {...register("status")}>
                <option value="todo">To do</option>
                <option value="doing">Doing</option>
                <option value="done">Done</option>
              </Select>
            </Field>
            <Field label="Deadline">
              <Input type="date" {...register("dueDate")} />
            </Field>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" onClick={() => setTaskModal(false)}>
              Anuluj
            </Button>
            <Button type="submit" variant="primary">
              Zapisz
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={projectModal}
        onClose={() => setProjectModal(false)}
        title="Projekty"
        description="Grupuj taski w projekty z wlasnym kolorem."
      >
        <ProjectsEditor
          projects={projects}
          onAdd={(name, color) => addProject({ name, color })}
          onRemove={removeProject}
        />
        <div className="mt-4 flex justify-end">
          <Button variant="primary" onClick={() => setProjectModal(false)}>
            Gotowe
          </Button>
        </div>
      </Modal>

      <Modal
        open={templatesModal}
        onClose={() => setTemplatesModal(false)}
        title="Szablony taskow"
        description="Cotygodniowe lub powtarzajace sie taski - dodawaj jednym kliknieciem."
      >
        <TemplateEditor
          templates={templates}
          projects={projects}
          onAdd={addTaskTemplate}
          onRemove={removeTaskTemplate}
          onUse={(template) => {
            applyTaskTemplate(template.id);
            pushToast({
              message: `Dodano: ${template.title}`,
              tone: "success",
            });
          }}
        />
        <div className="mt-4 flex justify-end">
          <Button variant="primary" onClick={() => setTemplatesModal(false)}>
            Gotowe
          </Button>
        </div>
      </Modal>

      <Modal
        open={Boolean(confirmRemoveTask)}
        onClose={() => setConfirmRemoveTask(null)}
        title="Usunac task?"
        description="Mozesz cofnac z toastu po usunieciu."
        size="sm"
      >
        <div className="flex justify-end gap-2">
          <Button onClick={() => setConfirmRemoveTask(null)}>Anuluj</Button>
          <Button
            variant="danger"
            onClick={() => {
              if (confirmRemoveTask) handleRemoveTask(confirmRemoveTask);
            }}
          >
            Usun
          </Button>
        </div>
      </Modal>
    </>
  );
}

function ProjectsEditor({
  projects,
  onAdd,
  onRemove,
}: {
  projects: { id: string; name: string; color: string }[];
  onAdd: (name: string, color: string) => void;
  onRemove: (id: string) => void;
}) {
  const [name, setName] = useState("");
  const [color, setColor] = useState("#a78bfa");
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {projects.map((project) => (
          <div
            key={project.id}
            className="flex items-center justify-between rounded-2xl border border-white/[0.08] bg-white/[0.04] px-3 py-2"
          >
            <div className="flex items-center gap-3">
              <span
                className="inline-block size-3 rounded-full"
                style={{ backgroundColor: project.color }}
              />
              <span className="text-sm font-medium">{project.name}</span>
            </div>
            <button
              type="button"
              onClick={() => onRemove(project.id)}
              className="grid size-8 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-300 hover:bg-rose-500/20 hover:text-rose-200"
              aria-label="Usun projekt"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
        <Input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Nazwa projektu"
        />
        <Input
          type="color"
          value={color}
          onChange={(event) => setColor(event.target.value)}
          className="h-11 w-16 cursor-pointer p-1"
        />
        <Button
          variant="primary"
          type="button"
          onClick={() => {
            if (!name.trim()) return;
            onAdd(name.trim(), color);
            setName("");
          }}
        >
          Dodaj
        </Button>
      </div>
    </div>
  );
}

function TemplateEditor({
  templates,
  projects,
  onAdd,
  onRemove,
  onUse,
}: {
  templates: TaskTemplate[];
  projects: { id: string; name: string; color: string }[];
  onAdd: (input: Omit<TaskTemplate, "id">) => void;
  onRemove: (id: string) => void;
  onUse: (template: TaskTemplate) => void;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TaskTemplateInput>({
    resolver: zodResolver(taskTemplateSchema),
    defaultValues: {
      title: "",
      projectId: projects[0]?.id ?? null,
      priority: "medium",
    },
  });

  function onSubmit(values: TaskTemplateInput) {
    onAdd({
      title: values.title,
      projectId: values.projectId || null,
      priority: values.priority,
    });
    reset({
      title: "",
      projectId: values.projectId ?? null,
      priority: values.priority,
    });
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {templates.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-3 text-center text-xs text-slate-400">
            Brak szablonow.
          </p>
        ) : (
          templates.map((template) => {
            const project = projects.find(
              (p) => p.id === template.projectId,
            );
            return (
              <div
                key={template.id}
                className="flex items-center justify-between gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.04] px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {template.title}
                  </p>
                  <p className="text-xs text-slate-500">
                    {project?.name ?? "Bez projektu"} · {template.priority}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => onUse(template)}>Uzyj</Button>
                  <button
                    type="button"
                    onClick={() => onRemove(template.id)}
                    className="grid size-9 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-rose-200 hover:bg-rose-500/20"
                    aria-label="Usun szablon"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="grid gap-3 sm:grid-cols-[1fr_160px_140px_auto]"
      >
        <div>
          <Input {...register("title")} placeholder="Nazwa szablonu" />
          {errors.title?.message ? (
            <p className="mt-1 text-xs text-rose-300">{errors.title.message}</p>
          ) : null}
        </div>
        <Select {...register("projectId")}>
          <option value="">Bez projektu</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </Select>
        <Select {...register("priority")}>
          <option value="high">Wysoki</option>
          <option value="medium">Sredni</option>
          <option value="low">Niski</option>
        </Select>
        <Button type="submit" variant="primary">
          Dodaj
        </Button>
      </form>
    </div>
  );
}

function KanbanColumn({
  id,
  title,
  tasks,
  projects,
  onEdit,
  onRemove,
  onTogglePin,
}: {
  id: TaskStatus;
  title: string;
  tasks: Task[];
  projects: { id: string; name: string; color: string }[];
  onEdit: (task: Task) => void;
  onRemove: (id: string) => void;
  onTogglePin: (task: Task) => void;
}) {
  const { isOver, setNodeRef } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "rounded-3xl bg-white/[0.035] p-3 transition",
        isOver && "bg-violet-300/10 ring-1 ring-violet-300/30",
      )}
    >
      <div className="mb-3 flex items-center justify-between px-1">
        <p className="text-sm font-semibold">{title}</p>
        <Badge>{tasks.length}</Badge>
      </div>
      <div className="min-h-36 space-y-3">
        {tasks.map((task) => (
          <KanbanCard
            key={task.id}
            task={task}
            project={projects.find((project) => project.id === task.projectId)}
            onEdit={onEdit}
            onRemove={onRemove}
            onTogglePin={onTogglePin}
          />
        ))}
      </div>
    </div>
  );
}

function KanbanCard({
  task,
  project,
  onEdit,
  onRemove,
  onTogglePin,
}: {
  task: Task;
  project?: { id: string; name: string; color: string };
  onEdit: (task: Task) => void;
  onRemove: (id: string) => void;
  onTogglePin: (task: Task) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: task.id });

  return (
    <article
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform) }}
      className={cn(
        "group rounded-2xl border border-white/[0.08] bg-[#0d1020] p-4 transition",
        isDragging && "z-20 opacity-80 shadow-2xl shadow-violet-950/50",
        task.pinnedForToday && "ring-1 ring-violet-300/40",
      )}
    >
      <div
        {...listeners}
        {...attributes}
        className="cursor-grab active:cursor-grabbing"
      >
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-semibold leading-5">{task.title}</p>
          <div className="flex items-center gap-2">
            {task.pinnedForToday ? (
              <Badge tone="violet">Pinned</Badge>
            ) : null}
            <Badge tone={priorityTone[task.priority]}>{task.priority}</Badge>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            {project ? (
              <span
                className="inline-block size-2 rounded-full"
                style={{ backgroundColor: project.color }}
              />
            ) : null}
            {project?.name ?? "Bez projektu"}
          </span>
          <span>{task.dueDate ?? "Bez terminu"}</span>
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <Button
          variant="ghost"
          className="h-9 flex-1 text-xs"
          onClick={() => onEdit(task)}
        >
          <Pencil className="mr-2 size-3.5" />
          Edytuj
        </Button>
        <Button
          variant="ghost"
          className="h-9 px-3 text-xs"
          onClick={() => onTogglePin(task)}
        >
          {task.pinnedForToday ? (
            <PinOff className="size-3.5" />
          ) : (
            <Pin className="size-3.5" />
          )}
        </Button>
        <Button
          variant="ghost"
          className="h-9 px-3 text-xs text-rose-200 hover:bg-rose-500/15"
          onClick={() => onRemove(task.id)}
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>
    </article>
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
