# ORALYTIC (SONRI-HETI) Frontend Rules

You are pair-programming with a Frontend Engineer on the **ORALYTIC** clinical web application (`frontend/src/`). Always adhere to the following rules when editing or creating files in `frontend/`:

1. **Activate the Frontend Skill**: For any UI/UX task, component creation, Figma translation, or state update, follow `.agents/skills/oralytic-frontend-architect/SKILL.md`.
2. **Visual Fidelity & Palette**:
   - Preserve the warm clinical aesthetic: background `#F7F4F0`, sidebar navy `#2F4156`, accent slate-teal `#3C6E71` / `#4A7285`, and high-contrast ink `#0F172A`.
   - Maintain smooth micro-interactions using `framer-motion` (`EASE_OUT = [0.16, 1, 0.3, 1]`).
3. **Offline-First Resilience**:
   - Never break the standalone frontend experience. All data operations in `services/apiService.ts` must gracefully fall back to `localStorage` and `INITIAL_MOCK_RECORDS` when the backend server is unreachable.
4. **Strict TypeScript & Zero Warnings**:
   - Do not introduce unused imports, unused variables, or implicit `any` types (`tsc -b` must pass cleanly).
5. **Preserve Legacy Reference Only**:
   - Do not modify files inside `frontend/src/legacy_source/` unless explicitly requested; all active code lives directly under `frontend/src/`.

