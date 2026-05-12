"use client";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Download, GripVertical, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Section } from "@/components/section";
import { calendarEventSchema, type CalendarEventInput } from "@/lib/schemas";
import { downloadBlob } from "@/lib/export";
import { toIsoDate } from "@/lib/utils";
import { useAppStore } from "@/stores/app-store";
import { useDataStore, type CalendarEvent } from "@/stores/data-store";

export function CalendarModule() {
  const events = useDataStore((state) => state.calendarEvents);
  const addEvent = useDataStore((state) => state.addCalendarEvent);
  const updateEvent = useDataStore((state) => state.updateCalendarEvent);
  const removeEvent = useDataStore((state) => state.removeCalendarEvent);
  const reorderCalendarEvents = useDataStore(
    (state) => state.reorderCalendarEvents,
  );
  const pushToast = useAppStore((state) => state.pushToast);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CalendarEvent | null>(null);

  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor));

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CalendarEventInput>({
    resolver: zodResolver(calendarEventSchema),
    defaultValues: { time: "08:00", title: "", tag: "Praca" },
  });

  function openCreate() {
    setEditing(null);
    reset({ time: "08:00", title: "", tag: "Praca" });
    setOpen(true);
  }

  function openEdit(event: CalendarEvent) {
    setEditing(event);
    reset({ time: event.time, title: event.title, tag: event.tag });
    setOpen(true);
  }

  function onSubmit(values: CalendarEventInput) {
    if (editing) updateEvent(editing.id, values);
    else addEvent(values);
    setOpen(false);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const ids = events.map((e) => e.id);
    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(ids, oldIndex, newIndex);
    reorderCalendarEvents(next);
  }

  function handleRemove(id: string) {
    const removed = events.find((event) => event.id === id);
    removeEvent(id);
    if (removed) {
      pushToast({
        message: `Usunieto: ${removed.title}`,
        tone: "info",
        actionLabel: "Cofnij",
        onAction: () =>
          addEvent({
            time: removed.time,
            title: removed.title,
            tag: removed.tag,
          }),
      });
    }
  }

  function handleExportIcs() {
    const today = toIsoDate().replace(/-/g, "");
    const stamp = new Date()
      .toISOString()
      .replace(/[-:]/g, "")
      .split(".")[0]
      .concat("Z");

    const lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Ultimate Dashboard//EN",
      "CALSCALE:GREGORIAN",
    ];
    for (const event of events) {
      const [hours, minutes] = event.time.split(":");
      const startLocal = `${today}T${hours}${minutes}00`;
      const endHour = String(
        (Number(hours) + 1) % 24,
      ).padStart(2, "0");
      const endLocal = `${today}T${endHour}${minutes}00`;
      lines.push(
        "BEGIN:VEVENT",
        `UID:${event.id}@ultimate-dashboard`,
        `DTSTAMP:${stamp}`,
        `DTSTART:${startLocal}`,
        `DTEND:${endLocal}`,
        `SUMMARY:${escapeIcs(event.title)}`,
        `CATEGORIES:${escapeIcs(event.tag)}`,
        "END:VEVENT",
      );
    }
    lines.push("END:VCALENDAR");
    downloadBlob(
      `plan-${toIsoDate()}.ics`,
      lines.join("\r\n"),
      "text/calendar;charset=utf-8",
    );
    pushToast({
      message: `Wyeksportowano ${events.length} wydarzen do ICS`,
      tone: "success",
    });
  }

  return (
    <>
      <Section
        id="calendar"
        title="Calendar"
        subtitle="Plan dnia · przeciagaj sloty, eksportuj do ICS"
        action="Nowe wydarzenie"
        onAction={openCreate}
        headerExtra={
          <Button onClick={handleExportIcs} disabled={events.length === 0}>
            <Download className="mr-2 size-4" />
            Eksport ICS
          </Button>
        }
      >
        {events.length === 0 ? (
          <p className="rounded-3xl border border-dashed border-white/10 bg-white/[0.02] p-6 text-center text-sm text-slate-400">
            Brak slotow. Dodaj pierwszy punkt planu dnia.
          </p>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={events.map((event) => event.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                {events.map((event) => (
                  <SortableEventRow
                    key={event.id}
                    event={event}
                    onEdit={openEdit}
                    onRemove={handleRemove}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </Section>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Edytuj wydarzenie" : "Nowe wydarzenie"}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Godzina" error={errors.time?.message}>
              <Input type="time" {...register("time")} />
            </Field>
            <Field label="Tag" error={errors.tag?.message}>
              <Input {...register("tag")} placeholder="Praca / Zdrowie..." />
            </Field>
          </div>
          <Field label="Tytul" error={errors.title?.message}>
            <Input {...register("title")} placeholder="np. Deep work" />
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

function SortableEventRow({
  event,
  onEdit,
  onRemove,
}: {
  event: CalendarEvent;
  onEdit: (event: CalendarEvent) => void;
  onRemove: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: event.id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={`flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.04] p-3 ${
        isDragging ? "opacity-70 shadow-2xl shadow-violet-950/40" : ""
      }`}
    >
      <button
        type="button"
        {...listeners}
        {...attributes}
        className="grid size-8 cursor-grab place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-400 hover:bg-white/[0.1] active:cursor-grabbing"
        aria-label="Przeciagnij"
      >
        <GripVertical className="size-4" />
      </button>
      <div className="rounded-xl bg-white/[0.08] px-3 py-2 text-sm font-semibold">
        {event.time}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{event.title}</p>
        <p className="text-xs text-slate-500">{event.tag}</p>
      </div>
      <div className="flex gap-1">
        <button
          type="button"
          onClick={() => onEdit(event)}
          className="grid size-8 place-items-center rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.1]"
          aria-label="Edytuj"
        >
          <Pencil className="size-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onRemove(event.id)}
          className="grid size-8 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-rose-200 hover:bg-rose-500/20"
          aria-label="Usun"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>
    </div>
  );
}

function escapeIcs(value: string) {
  return value.replace(/[\\,;]/g, (match) => `\\${match}`).replace(/\n/g, "\\n");
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
