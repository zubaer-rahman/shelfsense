# ShelfSense AI Agent Guidelines & Invariants

This repository is a monorepo containing:
- `api/`: NestJS 11 + Prisma ORM backend service (REST API on port 4000).
- `web/`: Next.js 15 (App Router) + Tailwind CSS v4 frontend web app (on port 3000).
- `reference/shelfsense`: Visual reference implementation / design source.
- `docs/`: Technical specifications, architecture plans, and agent briefs.
- `.agents/`: Shared agent skills and custom instructions.

---

## 1. General Repository Rules

- **Monorepo Directory Isolation**: When working on backend tasks, only modify files under `api/`. When working on frontend tasks, only modify files under `web/`. Never modify application code in `reference/shelfsense`.
- **One Commit Per Listed Item**: Structure commits cleanly per feature or phase task using conventional commit prefixes (e.g., `feat(web): ...`, `fix(api): ...`, `chore: ...`).
- **Path References**: Always use accurate paths (`api/src/...`, `api/prisma/...`, `web/src/...`, `docs/...`).

---

## 2. Frontend Always-On Rules (`web/`)

Whenever generating, modifying, or reviewing code under `web/`:

1. **Only Edit Under `web/`**: Never bleed frontend modifications into `api/` or root config files unless explicitly instructed.
2. **No Business Rules in the UI**:
   - The UI displays state, collects validated input, and reflects backend responses.
   - All authorization checks, stock calculations, idempotency validations, and transition permissions are enforced by the backend. The UI only uses role helpers (`can(user, 'action')`) for ergonomic display decisions.
3. **Four States on Every Data View**:
   - Every view, table, and card querying data must handle:
     1. **Loading**: Structural skeletons (never plain screen spinners).
     2. **Empty**: Contextual explanation and a clear call to action (CTA).
     3. **Error**: Clear error message with an actionable retry button.
     4. **Success**: Rendered data with pagination or scrolling.
4. **No Hardcoded Colors**:
   - All colors must map to the CSS variable design tokens defined in the design system (e.g. `bg-background`, `text-foreground`, `border-border`, `text-muted-foreground`, status tokens).
   - Zero hardcoded hex codes (`#10b981`), raw rgb, or ad-hoc Tailwind colors (`bg-emerald-500`).
5. **No Direct `fetch()` or Axios in Components**:
   - All communication with the backend happens through `lib/api-client.ts` wrapped in custom TanStack Query hooks.
6. **Token Isolation & Session**:
   - The frontend JavaScript runtime **never** accesses, stores, or handles the raw JWT access token or refresh token.
   - All requests route through the Next.js API Proxy (`/api/proxy/[...path]`), which attaches the `httpOnly` session cookie securely.
7. **Form Validation**:
   - All forms use `react-hook-form` with `zodResolver`.
   - Zod schemas must strictly mirror backend NestJS DTOs.
