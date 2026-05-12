"use client";

import { useAppStore } from "@/stores/app-store";
import { AnalyticsModule } from "@/components/modules/analytics";
import { BodyMetricsModule } from "@/components/modules/body-metrics";
import { CalendarModule } from "@/components/modules/calendar";
import { DashboardOverview } from "@/components/modules/dashboard-overview";
import { FinanceModule } from "@/components/modules/finance";
import { GoalsModule } from "@/components/modules/goals";
import { HabitsModule } from "@/components/modules/habits";
import { NotesModule } from "@/components/modules/notes";
import { SettingsModule } from "@/components/modules/settings";
import { TasksModule } from "@/components/modules/tasks";
import { TodayModule } from "@/components/modules/today";
import { WorkoutModule } from "@/components/modules/workout";

export function Dashboard() {
  const activeModule = useAppStore((state) => state.activeModule);

  return (
    <div className="space-y-4 px-3 py-4 sm:space-y-6 sm:px-6 sm:py-6 lg:p-8">
      {renderModule(activeModule)}
    </div>
  );
}

function renderModule(name: string) {
  switch (name) {
    case "Today":
      return <TodayModule />;
    case "Habits":
      return <HabitsModule />;
    case "Tasks":
      return <TasksModule />;
    case "Calendar":
      return <CalendarModule />;
    case "Workout":
      return <WorkoutModule />;
    case "Body Metrics":
      return <BodyMetricsModule />;
    case "Finance":
      return <FinanceModule />;
    case "Goals":
      return <GoalsModule />;
    case "Notes":
      return <NotesModule />;
    case "Analytics":
      return <AnalyticsModule />;
    case "Settings":
      return <SettingsModule />;
    case "Dashboard":
      return <DashboardOverview />;
    default:
      return <TodayModule />;
  }
}
