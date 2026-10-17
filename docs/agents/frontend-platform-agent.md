# Frontend Platform Agent Brief

## Ownership & Scope
The **Frontend Platform Agent** owns **Phases W0 through W2** of the ShelfSense frontend implementation as defined in `docs/SHELFSENSE_FRONTEND_PLAN.md`.

## Responsibilities
- **Phase W0: Project Foundation**
  - Next.js 15 (App Router), TypeScript, Tailwind CSS v4, Lucide icons, shadcn/Radix foundations.
  - Design system tokens, CSS variables (light/dark mode), typography, spacing rhythm, border radii in `web/src/app/globals.css`.
- **Phase W1: App Shell & Shared Components**
  - Extract and polish shared UI components from `reference/shelfsense` into `web/src/components/ui/` (Button, Input, Badge, Table, Modal/Dialog, Sheet, Dropdown, Skeleton, EmptyState).
  - Authenticated layout with sidebar navigation, mobile drawer, topbar with user dropdown and location switcher.
  - Public authentication layout.
- **Phase W2: Auth & Data Layer Foundation**
  - Next.js Route Handler API proxy (`/api/proxy/[...path]`) forwarding to backend on port 4000.
  - HttpOnly cookie session management (extracting Bearer token, zero token exposure to client JS).
  - Typed API client (`web/src/lib/api-client.ts`).
  - TanStack Query provider, query client config, query key factory (`web/src/lib/query-keys.ts`).
  - Auth context / hooks (`useAuth`, login, logout, refresh).

## Boundaries & Constraints
- **Does NOT** build feature screens (Inventory, Stock Movements, Purchase Orders, etc.).
- Maintains strict design token standards (no hardcoded colors).
- Validates that the proxy correctly strips CORS and sets secure session cookies.

## Handoff Criterion
A developer or agent can run `npm run dev` in `web/`, log in at `/login`, see the authenticated dashboard shell with working navigation and dark mode toggle, and execute an authenticated query using `useQuery` without CORS or cookie issues.
