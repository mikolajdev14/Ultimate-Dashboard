import {
  Activity,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Dumbbell,
  Goal,
  Home,
  ListTodo,
  NotebookText,
  Settings,
  Sparkles,
  WalletCards,
} from "lucide-react";

export type NavItem = {
  label: string;
  icon: typeof Home;
};

export const navItems: NavItem[] = [
  { label: "Today", icon: Sparkles },
  { label: "Dashboard", icon: Home },
  { label: "Habits", icon: CheckCircle2 },
  { label: "Tasks", icon: ListTodo },
  { label: "Calendar", icon: CalendarDays },
  { label: "Workout", icon: Dumbbell },
  { label: "Body Metrics", icon: Activity },
  { label: "Finance", icon: WalletCards },
  { label: "Goals", icon: Goal },
  { label: "Notes", icon: NotebookText },
  { label: "Analytics", icon: BarChart3 },
  { label: "Settings", icon: Settings },
];
