---
name: oralytic-frontend-architect
description: >-
  Specialized frontend engineering and Figma-to-React UI/UX implementation skill for the
  ORALYTIC (SONRI-HETI) AI Oral & Stunting Screening platform. Activate this skill whenever
  creating, modifying, refactoring, or styling React components, screens, modals, clinical
  validation flows, or dashboard layouts in `src/`.
---

# ORALYTIC Frontend Architect & Clinical UI System

This skill defines the exact architectural patterns, design tokens, interactive clinical workflows, and quality verification gates for the **ORALYTIC (SONRI-HETI)** frontend (`src/`).

---

## 1. Tech Stack & Core Conventions

- **Framework**: React 19 + TypeScript (`~6.0`) + Vite 8.
- **Styling**: Tailwind CSS v4 (`@import "tailwindcss";` in `src/index.css`) with Plus Jakarta Sans typography.
- **Animations**: `framer-motion` v13 (`motion`, `AnimatePresence`, `layoutId`).
  - Standard ease-out curve: `EASE_OUT = [0.16, 1, 0.3, 1]` (imported from `components/dashboard/ui.tsx`).
  - Standard spring physics: `{ type: 'spring', stiffness: 400, damping: 28 }`.
- **Icons**: `lucide-react` (consistent stroke widths, clean clinical iconography).
- **Language & Copywriting**: Indonesian (`id-ID`) for all user-facing UI labels, clinical terminology, date/time formatting (`Intl.DateTimeFormat('id-ID', ...)`), and feedback messages.

---

## 2. Design System & Color Palette (Figma Spec)

Always use the established ORALYTIC clinical color palette rather than generic Tailwind defaults:

| Token / Role | Hex / Class | Usage |
| :--- | :--- | :--- |
| **Warm Canvas Background** | `bg-[#F7F4F0]` / `bg-[#ECE6E0]/60` | Main dashboard & modal step backgrounds |
| **Card Surface** | `bg-white` with `border-slate-200/60` | Cards, panels, tables, and form containers |
| **Primary Clinical Navy** | `#2F4156` (`bg-[#2F4156]`, `text-[#2F4156]`) | Sidebar background, primary buttons, active rings, progress rings |
| **Secondary Slate Teal** | `#4A7285` / `#3C6E71` | Secondary action buttons, validated badges, user avatars |
| **Heading Ink** | `#0F172A` (`text-[#0F172A]`) | Primary titles, patient names, large numeric counters |
| **Body & Muted Slate** | `#475569` / `#64748B` | Subtitles, metadata, clinical descriptions, timestamps |
| **Alert / Pending Validation Banner** | `bg-[#FDF6E2]` / `border-[#D4C391]` / `text-[#6E5D2B]` | "Menunggu validasi Anda" warning banners |
| **Clinical Severity: Tinggi (High)** | Dot/Bar `#D9383A` or `#B5524A` / Badge `#4A2020` | High-risk clinical findings, pending findings count badge |
| **Clinical Severity: Sedang (Medium)** | Dot `#E08E36` / `#C08A2E` | Moderate clinical findings (e.g., plaque accumulation, enamel erosion) |
| **Action Chip: Setujui (Approve)** | `bg-[#BDE3C3]` / `text-[#1E5631]` / hover `bg-[#A8D8B0]` | Doctor approval button on AI clinical findings |
| **Action Chip: Koreksi (Correct)** | `bg-[#E8D5B7]` / `text-[#5C4322]` / hover `bg-[#DEC49E]` | Doctor correction/override button on AI clinical findings |

### Border Radius & Elevation
- **Sidebar**: `md:rounded-r-[36px] shadow-2xl`
- **Primary Cards & Modals**: `rounded-[22px]` to `rounded-[28px]`, subtle clinical shadow `shadow-[0_4px_20px_rgba(15,23,42,0.04)]`
- **Action Buttons & Inputs**: `rounded-xl` (`h-11`), pills `rounded-full`

---

## 3. Core Architecture & File Map

- `src/App.tsx`: Top-level screen router (`splash` -> `loading` -> `steps` -> `login` -> `dashboard`) with `sessionStorage` splash persistence and URL hash synchronization.
- `src/types.ts`: Central TypeScript definitions (`ScreeningRecord`, `PatientData`, `StuntingScreeningData`, `OralIssue`, `OralAnalysisResult`, `HealthReportData`, `AuthSession`).
- `src/services/apiService.ts`: Hybrid API client (`/api/v1` or `VITE_API_BASE_URL`) with automatic offline/standalone `localStorage` fallback so frontend workflows never block when the Laravel backend is offline.
- `src/services/stuntingCalculator.ts`: WHO Z-score anthropometric calculators (`TB/U`, `BB/U`, `BB/TB`).
- `src/components/ScreeningDashboard.tsx`: Main layout with collapsible sidebar (`Beranda`, `Riwayat`, `Profile`), watermark emblem, statistics cards, and record lists.
- `src/components/dashboard/`:
  - `NewScreeningModal.tsx`: 3-step screening wizard (Step 1: Data Pasien, Step 2: 5-Angle Intraoral Camera Capture, Step 3: AI Progress & Checklist).
  - `PatientDetailModal.tsx`: Clinical report view & doctor validation workflow.
  - `ui.tsx`: Shared visual helpers (`EASE_OUT`, `StatusTag`, `CountUp`, `initials`, `formatDate`, `toneOf`).

---

## 4. Implementation & Verification Checklist

Whenever you complete a frontend change:
1. **Type Safety**: Ensure all new props and state models are strictly typed in `src/types.ts` (avoid `any`).
2. **Build & Typecheck**: Run `npm run build` (or `npx tsc -b`) to verify zero TypeScript or Vite bundling errors.
3. **Responsive & Scroll Behavior**: Keep the left sidebar fixed (`h-screen`) and make only the `<main>` content area or modal body scrollable (`overflow-y-auto`).
