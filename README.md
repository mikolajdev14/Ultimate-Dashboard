# Ultimate Life Dashboard

Nowoczesna aplikacja webowa/PWA do zarzadzania produktywnoscia, habitami,
taskami, treningiem, finansami, celami i notatkami. UI jest inspirowany
zalaczona referencja: ciemny, modularny dashboard z desktopowym sidebarem i
mobilna dolna nawigacja.

## Stack

- Next.js App Router, React, TypeScript, Tailwind CSS
- Supabase Auth/PostgreSQL/Realtime/Storage ready
- Zustand, TanStack Query, React Hook Form, Zod
- dnd-kit, Recharts, Lucide
- next-pwa, manifest, offline fallback

## Getting Started

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Supabase

1. Copy `.env.example` to `.env.local` and add Supabase URL + anon key.
2. Run `supabase/schema.sql` in your Supabase SQL editor.
3. Enable email/social providers in Supabase Auth.
4. Replace demo data in `src/lib/demo-data.ts` with TanStack Query calls backed by Supabase.

## MVP Modules

- Dashboard metrics and charts
- Habits with streaks, heatmap and completion rate
- Tasks/projects Kanban prepared for drag & drop
- Workout planner with 1RM chart
- Body metrics trend
- Finance budgets and category chart
- Goals, notes, analytics and settings-ready navigation
- PWA install support and offline caching

## Scripts

```bash
npm run dev
npm run lint
npm run build
```

## Next Steps

- Wire Supabase auth screens and authenticated app routes.
- Add server actions for real inserts/updates.
- Add push notification subscription flow.
- Add CSV/JSON/PDF export UI.
- Add tests for schemas, server actions and critical components.
