"use client";

import dynamic from "next/dynamic";
import { AppShell } from "@/components/app-shell";

const Dashboard = dynamic(
  () => import("@/components/dashboard").then((mod) => mod.Dashboard),
  { ssr: false },
);

export function HomeClient() {
  return (
    <AppShell>
      <Dashboard />
    </AppShell>
  );
}
