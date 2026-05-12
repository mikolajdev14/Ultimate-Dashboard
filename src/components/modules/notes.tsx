"use client";

import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Section } from "@/components/section";
import { Textarea } from "@/components/ui/textarea";
import { noteSchema, type NoteInput } from "@/lib/schemas";
import { useDataStore, type Note } from "@/stores/data-store";

export function NotesModule() {
  const notes = useDataStore((state) => state.notes);
  const addNote = useDataStore((state) => state.addNote);
  const updateNote = useDataStore((state) => state.updateNote);
  const removeNote = useDataStore((state) => state.removeNote);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Note | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<NoteInput>({
    resolver: zodResolver(noteSchema),
    defaultValues: { title: "", content: "" },
  });

  function openCreate() {
    setEditing(null);
    reset({ title: "", content: "" });
    setOpen(true);
  }

  function openEdit(note: Note) {
    setEditing(note);
    reset({ title: note.title, content: note.content });
    setOpen(true);
  }

  function onSubmit(values: NoteInput) {
    if (editing) updateNote(editing.id, values);
    else addNote(values);
    setOpen(false);
  }

  return (
    <>
      <Section
        id="notes"
        title="Notes"
        subtitle="Szybkie logi, przemyslenia, plany"
        action="Nowa notatka"
        onAction={openCreate}
      >
        {notes.length === 0 ? (
          <p className="rounded-3xl border border-dashed border-white/10 bg-white/[0.02] p-6 text-center text-sm text-slate-400">
            Brak notatek. Zapisz pierwsza mysl.
          </p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {notes.map((note) => (
              <div
                key={note.id}
                className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold">{note.title}</p>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => openEdit(note)}
                      className="grid size-8 place-items-center rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.1]"
                      aria-label="Edytuj"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeNote(note.id)}
                      className="grid size-8 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-rose-200 hover:bg-rose-500/20"
                      aria-label="Usun"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-300">
                  {note.content}
                </p>
                <p className="mt-3 text-xs text-slate-500">
                  Aktualizacja: {new Date(note.updatedAt).toLocaleString("pl-PL")}
                </p>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Edytuj notatke" : "Nowa notatka"}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Field label="Tytul" error={errors.title?.message}>
            <Input {...register("title")} placeholder="np. Idea na blog" />
          </Field>
          <Field label="Tresc">
            <Textarea rows={8} {...register("content")} />
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
