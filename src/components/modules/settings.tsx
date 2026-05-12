"use client";

import { useRef, useState } from "react";
import { BellRing, Download, MoonStar, Sun, Timer, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Section } from "@/components/section";
import { Select } from "@/components/ui/select";
import { downloadBlob, toCsv, toJson } from "@/lib/export";
import { useAppStore } from "@/stores/app-store";
import { useDataStore } from "@/stores/data-store";

export function SettingsModule() {
  const settings = useDataStore((state) => state.settings);
  const updateSettings = useDataStore((state) => state.updateSettings);
  const resetAll = useDataStore((state) => state.resetAll);
  const importState = useDataStore((state) => state.importState);
  const habits = useDataStore((state) => state.habits);
  const tasks = useDataStore((state) => state.tasks);
  const sessions = useDataStore((state) => state.sessions);
  const expenses = useDataStore((state) => state.expenses);
  const pushToast = useAppStore((state) => state.pushToast);

  const fileRef = useRef<HTMLInputElement>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  function handleImport(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        importState(parsed);
        pushToast({ message: "Zaimportowano dane", tone: "success" });
      } catch {
        pushToast({
          message: "Plik nie jest prawidlowym JSON",
          tone: "danger",
        });
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  }

  function handleExportJson() {
    const snapshot = useDataStore.getState();
    downloadBlob(
      `ultimate-dashboard-${new Date().toISOString().slice(0, 10)}.json`,
      toJson(snapshot),
      "application/json",
    );
    pushToast({ message: "Eksport JSON gotowy", tone: "success" });
  }

  function handleExportCsv() {
    const flatTasks = tasks.map((task) => ({
      title: task.title,
      projectId: task.projectId ?? "",
      priority: task.priority,
      status: task.status,
      dueDate: task.dueDate ?? "",
    }));
    downloadBlob(
      `tasks-${new Date().toISOString().slice(0, 10)}.csv`,
      toCsv(flatTasks),
      "text/csv;charset=utf-8",
    );
    pushToast({ message: "Eksport CSV gotowy", tone: "success" });
  }

  async function requestNotifications(enable: boolean) {
    if (typeof window === "undefined") return;
    if (!("Notification" in window)) {
      pushToast({
        message: "Ta przegladarka nie wspiera powiadomien",
        tone: "danger",
      });
      updateSettings({ notificationsEnabled: false });
      return;
    }
    if (!enable) {
      updateSettings({ notificationsEnabled: false });
      return;
    }
    let permission = Notification.permission;
    if (permission === "default") {
      permission = await Notification.requestPermission();
    }
    if (permission === "granted") {
      updateSettings({ notificationsEnabled: true });
      pushToast({
        message: "Powiadomienia wlaczone",
        tone: "success",
      });
      try {
        new Notification("Ultimate Dashboard", {
          body: "Powiadomienia gotowe. Bedziemy przypominac o habitach.",
          icon: "/icon.svg",
        });
      } catch {
        // ignore
      }
    } else {
      updateSettings({ notificationsEnabled: false });
      pushToast({
        message: "Powiadomienia zablokowane w przegladarce",
        tone: "danger",
      });
    }
  }

  return (
    <>
      <Section
        id="settings"
        title="Settings"
        subtitle="Profil, motyw, przypomnienia, eksport i import danych"
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-3xl border border-white/[0.08] bg-white/[0.04] p-5">
            <p className="text-sm font-semibold">Profil &amp; jednostki</p>
            <div className="mt-4 space-y-3">
              <label className="block space-y-1.5">
                <span className="text-sm text-slate-300">Imie</span>
                <Input
                  value={settings.name}
                  onChange={(event) =>
                    updateSettings({ name: event.target.value })
                  }
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-sm text-slate-300">Waluta</span>
                <Select
                  value={settings.currency}
                  onChange={(event) =>
                    updateSettings({ currency: event.target.value })
                  }
                >
                  <option value="PLN">PLN</option>
                  <option value="EUR">EUR</option>
                  <option value="USD">USD</option>
                  <option value="GBP">GBP</option>
                </Select>
              </label>
              <label className="block space-y-1.5">
                <span className="text-sm text-slate-300">Jednostka wagi</span>
                <Select
                  value={settings.weightUnit}
                  onChange={(event) =>
                    updateSettings({
                      weightUnit: event.target.value as "kg" | "lb",
                    })
                  }
                >
                  <option value="kg">kg</option>
                  <option value="lb">lb</option>
                </Select>
              </label>
            </div>
          </div>

          <div className="rounded-3xl border border-white/[0.08] bg-white/[0.04] p-5">
            <p className="text-sm font-semibold">Motyw &amp; przypomnienia</p>
            <div className="mt-4 space-y-3">
              <label className="block space-y-1.5">
                <span className="text-sm text-slate-300">Motyw</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => updateSettings({ theme: "dark" })}
                    className={`flex items-center gap-2 rounded-2xl border px-3 py-2 text-sm transition ${
                      settings.theme === "dark"
                        ? "border-violet-300/60 bg-violet-500/15"
                        : "border-white/10 bg-white/[0.04] hover:bg-white/[0.1]"
                    }`}
                  >
                    <MoonStar className="size-4" />
                    Ciemny
                  </button>
                  <button
                    type="button"
                    onClick={() => updateSettings({ theme: "light" })}
                    className={`flex items-center gap-2 rounded-2xl border px-3 py-2 text-sm transition ${
                      settings.theme === "light"
                        ? "border-amber-300/60 bg-amber-300/15"
                        : "border-white/10 bg-white/[0.04] hover:bg-white/[0.1]"
                    }`}
                  >
                    <Sun className="size-4" />
                    Jasny
                  </button>
                </div>
              </label>
              <label className="block space-y-1.5">
                <span className="text-sm text-slate-300">
                  Domyslna dlugosc focusu (min)
                </span>
                <div className="flex items-center gap-3">
                  <Input
                    type="number"
                    min={5}
                    max={120}
                    value={settings.defaultFocusMinutes}
                    onChange={(event) =>
                      updateSettings({
                        defaultFocusMinutes: Math.max(
                          5,
                          Math.min(120, Number(event.target.value) || 25),
                        ),
                      })
                    }
                  />
                  <Timer className="size-4 text-slate-400" />
                </div>
              </label>
              <label className="block space-y-1.5">
                <span className="text-sm text-slate-300">
                  Godzina przypomnienia o habitach
                </span>
                <Input
                  type="time"
                  value={settings.habitReminderTime}
                  onChange={(event) =>
                    updateSettings({ habitReminderTime: event.target.value })
                  }
                />
              </label>
              <label className="flex items-center justify-between gap-3 rounded-2xl bg-white/[0.04] px-3 py-2">
                <span className="flex items-center gap-2 text-sm">
                  <BellRing className="size-4 text-violet-200" />
                  Powiadomienia push
                </span>
                <input
                  type="checkbox"
                  checked={settings.notificationsEnabled}
                  onChange={(event) =>
                    requestNotifications(event.target.checked)
                  }
                  className="size-5 accent-violet-300"
                />
              </label>
              <p className="text-xs text-slate-500">
                Powiadomienia dzialaja w tle przegladarki (rowniez gdy aplikacja
                jest schowana). Mozesz tez wlaczyc je tylko dla habitow w
                ustawieniach systemu.
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-white/[0.08] bg-white/[0.04] p-5 lg:col-span-2">
            <p className="text-sm font-semibold">Dane i backup</p>
            <p className="mt-1 text-xs text-slate-500">
              Wszystko zapisuje sie lokalnie w przegladarce (localStorage),
              dzieki czemu PWA dziala offline. Mozesz dane wyeksportowac, aby
              przeniesc na inne urzadzenie.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Button onClick={handleExportJson}>
                <Download className="mr-2 size-4" />
                Eksport JSON
              </Button>
              <Button onClick={handleExportCsv}>
                <Download className="mr-2 size-4" />
                Eksport CSV (tasks)
              </Button>
              <Button onClick={() => fileRef.current?.click()}>
                <Upload className="mr-2 size-4" />
                Import JSON
              </Button>
              <Button variant="danger" onClick={() => setConfirmReset(true)}>
                <Trash2 className="mr-2 size-4" />
                Reset
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept="application/json"
                className="hidden"
                onChange={handleImport}
              />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-slate-400 sm:grid-cols-4">
              <Stat label="Habity" value={habits.length} />
              <Stat label="Taski" value={tasks.length} />
              <Stat label="Sesje" value={sessions.length} />
              <Stat label="Wydatki" value={expenses.length} />
            </div>
          </div>
        </div>
      </Section>

      <Section
        title="Skroty klawiszowe"
        subtitle="Drobne ulatwienia na desktopie"
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Shortcut combo="/" label="Skup szukajke w naglowku" />
          <Shortcut combo="n" label="Otworz quick add task" />
          <Shortcut combo="?" label="Pokaz krotka pomoc" />
        </div>
      </Section>

      <Modal
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        title="Wyczyscic wszystkie dane?"
        description="Operacja przywroci ustawienia poczatkowe oraz dane przykladowe."
        size="sm"
      >
        <div className="flex justify-end gap-2">
          <Button onClick={() => setConfirmReset(false)}>Anuluj</Button>
          <Button
            variant="danger"
            onClick={() => {
              resetAll();
              setConfirmReset(false);
              pushToast({
                message: "Dane zostaly zresetowane",
                tone: "info",
              });
            }}
          >
            Resetuj
          </Button>
        </div>
      </Modal>
    </>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-white/[0.04] p-3">
      <p className="text-[11px] uppercase tracking-wider text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}

function Shortcut({ combo, label }: { combo: string; label: string }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm">
      <span>{label}</span>
      <kbd className="rounded-md border border-white/10 bg-black/30 px-2 py-0.5 text-xs font-semibold">
        {combo}
      </kbd>
    </div>
  );
}
