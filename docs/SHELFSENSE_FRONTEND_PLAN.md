# ShelfSense Web: Frontend Implementation Plan

> Smart inventory, expiry tracking, and demand-based reorder suggestions for small shops.

Companion to `SHELFSENSE_BACKEND_PLAN.md` (what the API does) and `SHELFSENSE_AGENTIC_SETUP.md` (how agents work). This file defines the Next.js frontend, phase by phase. It contains specifications only, no code.

Repo layout (monorepo): `api/` is the NestJS backend, `web/` is this frontend, `docs/` holds plans, handoff notes, and design references.

---

## 0. Agent operating rules (read first)

1. Work **one phase at a time**. At the end of each phase, run the build and tests, write `docs/handoff/web-<phase>.md`, list files changed, and stop for the developer's review.
2. Make **one commit per item in each phase's commit list**, with the exact messages given.
3. Only edit files under `web/`. Backend changes are allowed only where section 6 lists an API gap, as separate commits in `api/` made by the owning backend agent.
4. Do not add libraries or features that are not listed here. No i18n, no payments, no image upload, no PWA.
5. The frontend contains **no business rules**. The API is the authority. The UI may pre-validate for convenience, but it must always handle server errors correctly.
6. Every data view must implement loading, empty, error, and success states (section 2.4). No page ships without them.
7. Use the design tokens and shared components. Do not hardcode colors, spacing, or one-off styles.
8. Keep components small and readable, with one responsibility each. The developer must be able to explain and modify every file live.
9. If the API response differs from the assumptions in section 6, adapt **only the API layer** (types and mappers) and record the difference in the handoff note.
10. End each phase by naming the principle or pattern the new code demonstrates (for example, separation of data layer from presentation).

---

## 1. Stack

| Concern | Choice | Reason |
|---|---|---|
| Framework | Next.js (App Router) with TypeScript, strict mode | Required by the plan, route groups and middleware suit auth |
| Styling | Tailwind CSS with CSS variable design tokens | Fast, consistent, easy dark mode |
| Components | shadcn/ui (Radix primitives, source copied into the repo) | Accessible, modern, and the code is yours to read and edit |
| Icons | lucide-react | Consistent, light |
| Data fetching | TanStack Query | Built-in loading and error states, caching, invalidation after mutations |
| Forms | react-hook-form with zod | Schemas mirror backend DTO rules, clear field errors |
| Charts | Recharts | Simple, declarative, enough for two charts |
| Toasts | sonner | Success and error feedback |
| Theme | next-themes | Light and dark mode |
| Font | Inter (via `next/font`) | Clean, tabular numbers for data |
| Tests | Vitest and Testing Library | Small, fast unit tests |

---

## 2. Design direction

### 2.1 Personality
Calm, trustworthy, data-forward. A tool a shop owner opens many times a day: quick to scan, clear about what needs attention, never cluttered. Whitespace, soft borders, restrained color, with color reserved for meaning (status and alerts).

### 2.2 Design tokens

| Token | Light | Dark |
|---|---|---|
| Background | `#F8FAFC` | `#0B1220` |
| Surface (cards) | `#FFFFFF` | `#111827` |
| Border | `#E2E8F0` | `#1F2937` |
| Text | `#0F172A` | `#E5E7EB` |
| Muted text | `#64748B` | `#9CA3AF` |
| Primary | `#0D9488` | `#2DD4BF` |
| Primary strong (hover) | `#0F766E` | `#14B8A6` |
| Success | `#16A34A` | `#4ADE80` |
| Warning (low stock, near expiry) | `#D97706` | `#FBBF24` |
| Danger (expired, errors) | `#DC2626` | `#F87171` |
| Info | `#2563EB` | `#60A5FA` |

- Radius: 12px for cards and dialogs, 8px for inputs and buttons.
- Shadows: very soft, used sparingly. Prefer borders.
- Typography: Inter, with tabular numerals for quantities, prices, and tables. Page title 24px semibold, section title 16px semibold, body 14px.
- Spacing: 4px grid. Cards use 16 to 24px padding.
- Motion: short (150 to 200ms) transitions on hover, dialogs, and tab changes. Respect reduced-motion settings. No decorative animation.

### 2.3 Status color language (use consistently everywhere)

| Meaning | Color | Where |
|---|---|---|
| In stock, healthy | Success | Stock badge |
| Low stock (at or below reorder level) | Warning | Stock badge, alert cards |
| Out of stock | Danger | Stock badge |
| Near expiry | Warning | Expiry badge |
| Expired | Danger | Expiry badge |
| PO Draft | Neutral gray | Status badge |
| PO Ordered | Info | Status badge |
| PO Received | Success | Status badge |
| PO Cancelled | Danger (muted) | Status badge |
| Stock in or gain | Success text with plus sign | Movement quantity |
| Sale or loss | Danger text with minus sign | Movement quantity |

Never rely on color alone. Every badge also has text, and quantities have a sign.

### 2.4 The four states (required on every data view)

| State | Requirement |
|---|---|
| **Loading** | Skeletons that match the final layout. No full-page spinners. |
| **Empty** | Friendly message, a short hint, and the primary action if the role allows it. |
| **Error** | Clear message, the reason in plain language when known, and a Retry button. |
| **Success** | Toast after a mutation, plus the updated data visible immediately. |

Mutation rules: disable the submit button and show a spinner while pending (prevents double submit), show field-level errors from validation, and show specific messages for known conflicts: duplicate SKU, insufficient stock, invalid status transition, wrong supplier on a PO. A 401 redirects to login with a message. A 403 shows a clear "not allowed" notice.

### 2.5 Responsive behavior
- Desktop: fixed sidebar (about 256px), top bar with page title, theme toggle, and user menu.
- Tablet: sidebar collapses to icons.
- Mobile: sidebar becomes a slide-over sheet opened from a menu button. Data tables switch to stacked cards, or scroll horizontally inside their own container. The page body never scrolls sideways. Dialogs become full-width sheets. Touch targets are at least 44px.

### 2.6 Accessibility
Labeled inputs, visible focus rings, keyboard-operable dialogs and menus (Radix provides this), sufficient contrast in both themes, `aria-live` for toasts and async results, and semantic table markup.

---

## 3. Architecture decisions

### 3.1 Authentication and session
- The browser never stores the JWT in JavaScript-readable storage.
- A Next.js route handler receives the login form, calls the backend login, and sets the token in an **httpOnly cookie** (SameSite lax, Secure in production, lifetime matching the token).
- A Next.js **proxy route handler** (catch-all) forwards API calls to the backend and attaches the bearer token from the cookie. The client always calls the proxy, never the backend directly. This avoids exposing the token to scripts and avoids CORS.
- **Middleware** redirects unauthenticated visitors to `/login` by checking for the cookie, and redirects logged-in users away from `/login`. This is a UX convenience. The backend is the real authority on access.
- The current user (id, name, role) comes from `GET /auth/me` through the proxy, cached by TanStack Query.
- Logout clears the cookie and the query cache.

### 3.2 Role handling in the UI
- A single role helper answers questions such as "can this user write products?" so rules live in one place.
- Owner-only actions are hidden or disabled for Staff, with a tooltip explaining why when disabled. The backend still enforces every rule.
- The sidebar hides Owner-only sections (Purchase Orders, Users) from Staff.

### 3.3 Data layer
- One typed API client wraps `fetch` calls to the proxy, parses the backend error shape, and throws a typed error.
- One folder of query and mutation hooks per domain (products, suppliers, stock, alerts, purchase orders, forecast). Components never call `fetch` directly.
- Query keys are defined in one place per domain.
- **Invalidation after mutations:**
  - Stock movement: invalidate products, movements, alerts, dashboard data.
  - PO create or transition: invalidate purchase orders. On receive, also invalidate products, movements, alerts.
  - Product or supplier change: invalidate the matching list and any dependent pickers.
- List state (page, search, filters) lives in the **URL query string**, so refresh, back, and sharing links all work.
- Search input is debounced (about 300 ms).

### 3.4 Forms and validation
- zod schemas mirror the backend DTO rules: positive integer quantities, required fields, SKU format, direction required for ADJUSTMENT and not allowed for other types.
- Schemas are convenience only. Server errors are always displayed.

### 3.5 Formatting
- Currency, dates, and numbers go through shared formatting helpers using the browser locale. Currency code comes from an environment variable.
- Decimal values from the API may arrive as strings. Convert them in the API layer, not in components.
- Dates are shown in local time. Expiry dates are date-only.

### 3.6 Separation of concerns
Pages assemble features. Feature components own layout and user interaction. Hooks own data. Shared UI components are presentational and know nothing about the API.

---

## 4. Route map and access

| Route | Access | Notes |
|---|---|---|
| `/login` | Public | Redirects to dashboard if already signed in |
| `/` | Authenticated | Redirects to `/dashboard` |
| `/dashboard` | Any role | KPIs, alerts, recent movements, sales trend |
| `/products` | Any role (write: Owner) | List, search, filters, create, edit, deactivate |
| `/suppliers` | Any role (write: Owner) | List, create, edit, deactivate |
| `/stock` | Any role (Staff: Sale only) | Record movement and history |
| `/purchase-orders` | Owner | List, create |
| `/purchase-orders/[id]` | Owner | Detail with status actions |
| `/forecast` | Any role (create PO: Owner) | Forecast and suggestion |
| `/users` | Owner, optional | Only if time remains |

---

## 5. Screen specifications

### 5.1 Login
- Centered card, product name and tagline, email and password fields with a show/hide toggle, a primary Sign in button.
- States: submitting spinner, error message for wrong credentials, specific message for a deactivated account.
- A small "Demo accounts" panel with one-click fill for the Owner and Staff demo credentials, shown only when the demo-login environment flag is on, so reviewers can sign in quickly.

### 5.2 Dashboard
- **KPI cards (5):** active products, low-stock items, near-expiry items, expired items, open purchase orders (Draft plus Ordered, Owner only).
- **Alert panels:** low stock, near expiry (with a days selector), expired. Each lists the top 5 items with product name, quantity versus reorder level or expiry date, and a "View all" link that opens the products page with the matching filter.
- **Sales trend chart:** daily units sold for the last 30 days.
- **Recent movements:** the last 8 movements with type, signed quantity, user, and time.
- **Quick actions:** Record sale (everyone), New purchase order (Owner), Open forecast.
- Each block loads and fails independently with its own skeleton and retry.

### 5.3 Products
- Table columns: name, SKU, category, supplier, unit price, stock (with a badge), reorder level, expiry (with a badge), actions.
- Search by name or SKU, category filter, status filter (active, inactive), pagination, all synced to the URL.
- Owner: Add product and Edit in a side sheet form (supplier picker lists active suppliers only), Deactivate with a confirm dialog.
- Everyone: a row action "Record movement" that opens the movement dialog with the product preselected.
- Errors: duplicate SKU shows a field-level message.

### 5.4 Suppliers
- Simple table (name, phone, email, product count, status), a create and edit dialog, deactivate with confirm. Write actions for Owner only.

### 5.5 Stock movements
- **Record movement panel:**
  - Searchable product picker that shows current stock.
  - Type selector as a segmented control: Sale, Stock in, Adjustment. Staff see Sale only.
  - Adjustment shows a required direction toggle (Increase, Decrease).
  - Quantity (positive integer) and an optional note.
  - A live preview of the resulting stock level. For a sale larger than stock, show an inline warning and block submit. The server remains authoritative and its "insufficient stock" error is displayed clearly if it happens anyway.
- **History table:** date and time, product, type, signed quantity (colored with sign), user, note. Filters for product, type, and date range. Pagination in the URL.

### 5.6 Purchase orders (Owner)
- **List:** status filter tabs (All, Draft, Ordered, Received, Cancelled), supplier, item count, total cost, created date, status badge.
- **Create:** choose a supplier first. Product rows are then limited to that supplier's active products. Each row has quantity and unit cost, duplicates are prevented, and a running total is shown. Saves as Draft.
- **Detail:** header with supplier and timestamps, a status stepper (Draft, Ordered, Received) with Cancelled shown as a separate end state, an items table with totals, and action buttons that appear only for allowed transitions: Mark as ordered, Receive, Cancel. Each action opens a confirm dialog. The Receive dialog states that stock will increase for each item. Invalid-transition errors from the server are displayed.

### 5.7 Forecast
- **Controls:** product picker, strategy selector (Naive, Moving average, Linear regression), and a window selector (7, 14, 30 days) that is enabled only for strategies that use a window.
- **Result cards:** expected daily demand, current stock, lead time, safety buffer, suggested reorder quantity.
- **Explainable breakdown:** a short line that shows the formula with the real numbers, so the owner sees why the suggestion is what it is.
- **Chart:** recent daily sales with the expected daily demand drawn as a reference line.
- **Action:** "Create draft purchase order from suggestion" (Owner). Disabled with a clear reason when the suggestion is zero or the user is Staff. On success, show a toast and a link to the new purchase order.
- **Model info panel (collapsed by default):** inputs, output, method, and honest limitations: synthetic demo data, no seasonality, weak for new products, fixed lead time.
- States: not enough history for the selected product shows a friendly message and no suggestion.

### 5.8 Users (optional, Owner)
Table of users with role and status, create user dialog, deactivate with confirm. Build only after everything else is done.

---

## 6. API contract assumptions and gaps

The frontend assumes the following. The Frontend Platform Agent verifies each item against the real backend in the first phase and records differences in `docs/handoff/api-contract.md`.

**Assumed response shapes**
- Paginated lists return a data array and a meta object with page, limit, and total.
- Errors return status code, message (string or array of validation messages), error type, timestamp, and path.
- Alert endpoints return arrays of products, with a total count.
- Decimal values may be strings.

**Known gaps in the backend plan (small backend additions)**

| Gap | Needed for | Proposed addition | Owner |
|---|---|---|---|
| Forecast response has no daily history | Forecast chart | Include the recent daily sales series (date and quantity, last 30 days) in the forecast response | Forecast Agent |
| No aggregated daily sales endpoint | Dashboard trend chart | A read endpoint returning daily sales totals for the last N days (absolute values, zero-filled) | Stock Agent |
| Dashboard counts | KPI cards | Derive counts from the list totals, no new endpoint | Frontend |

These are made as separate backend commits with tests, before the screens that need them.

---

## 7. Folder layout

```
web/
  src/
    app/
      (auth)/login/
      (app)/                      layout with sidebar and top bar
        dashboard/
        products/
        suppliers/
        stock/
        purchase-orders/ and [id]/
        forecast/
      api/
        auth/login, auth/logout   route handlers
        proxy/[...path]           backend proxy
      layout.tsx, error.tsx, not-found.tsx
    middleware.ts
    components/
      ui/                         shadcn primitives
      shared/                     StatCard, StatusBadge, DataTable, PageHeader,
                                  EmptyState, ErrorState, ConfirmDialog, Skeletons
      layout/                     Sidebar, Topbar, MobileNav, ThemeToggle, UserMenu
    features/
      products/ suppliers/ stock/ alerts/ purchase-orders/ forecast/ dashboard/
        (components, hooks, schemas, types for each)
    lib/
      api/                        client, error parsing, types
      auth/                       session helpers, role helper
      format/                     currency, date, number
      query/                      QueryClient setup, shared key helpers
  tests/
```

---

## 8. Frontend agents, skills, and ownership

Extends `SHELFSENSE_AGENTIC_SETUP.md`. Keep the team small.

| Agent | Owns | Skills |
|---|---|---|
| **Frontend Platform Agent** | W0 to W2: scaffold, design system, shell, auth, API layer | `design-system-tokens`, `nextjs-app-router-conventions`, `api-proxy-session`, `conventional-commit` |
| **Frontend Features Agent** | W3 to W8: screens and polish | `query-data-layer`, `form-validation`, `ui-states-checklist`, `responsive-a11y-checklist`, `conventional-commit` |
| **Reviewer Agent** (existing) | After every phase | `frontend-review`, `explain-for-review` |

New skills to create (short, specific `SKILL.md` files):
- `design-system-tokens`: use only tokens and shared components, the status color language in 2.3, spacing and radius rules.
- `nextjs-app-router-conventions`: route groups, server versus client components (client only where interaction needs it), layouts, loading and error files.
- `api-proxy-session`: the cookie and proxy design in 3.1, never expose the token to client code, never log it.
- `query-data-layer`: hook per domain, central query keys, invalidation rules in 3.3, URL-synced list state.
- `form-validation`: zod schemas mirror the backend DTOs, server errors mapped to fields, double-submit prevention.
- `ui-states-checklist`: the four states in 2.4 for every view and mutation.
- `responsive-a11y-checklist`: the rules in 2.5 and 2.6.
- `frontend-review`: checks that no component calls `fetch` directly, no hardcoded colors, every data view has four states, roles handled via the helper, and no business rules in the UI.

File ownership: only the owning agent edits its paths. Shared components in `components/shared/` belong to the Platform Agent and are frozen after W1 except for additions announced in a handoff note.

**Parallelism:** after W2 is merged, at most two Features Agent sessions run at the same time, on separate feature folders (for example Products with Suppliers, and Stock). The dashboard and forecast wait until the data they read exists.

---

## 9. Phases and commits

### W0: Foundation
- Create the Next.js app in `web/` with TypeScript strict mode, Tailwind, and ESLint. Add `.env.example` and a `.gitignore`.
- Initialize shadcn/ui, install the listed libraries, and load Inter.
- **Commits:**
  - `chore(web): initialize Next.js app with TypeScript and Tailwind`
  - `chore(web): add shadcn/ui, fonts and base dependencies`

### W1: Design system and shell
- Implement the tokens from section 2.2 as CSS variables for light and dark. Theme toggle.
- App shell: sidebar, top bar, mobile sheet navigation, user menu.
- Shared components: StatCard, StatusBadge, DataTable (with skeleton, empty, and error variants), PageHeader, EmptyState, ErrorState, ConfirmDialog.
- **Commits:**
  - `feat(web): add design tokens, dark mode and app shell layout`
  - `feat(web): add shared components for stats, badges, tables and states`

### W2: Auth and API layer
- Verify the API contract and write `docs/handoff/api-contract.md`.
- Login and logout route handlers with the httpOnly cookie, the proxy route handler, middleware, the typed API client with error parsing, the QueryClient provider, the current-user hook, and the role helper. Build the login page.
- **Commits:**
  - `feat(web): add API proxy and cookie-based session handlers`
  - `feat(web): add login page, logout and route protection middleware`
  - `feat(web): add typed API client, query provider and role helper`

### W3: Products and suppliers
- Products list with URL-synced search, filters, and pagination. Create and edit sheet with validation. Deactivate with confirm. Suppliers screen.
- **Commits:**
  - `feat(web): add products list with search, filters and pagination`
  - `feat(web): add product create and edit form with validation`
  - `feat(web): add suppliers management`

### W4: Stock movements
- Movement form with type-specific fields and the live stock preview, history table with filters. Invalidation rules applied.
- **Commits:**
  - `feat(web): add stock movement form with type-specific fields`
  - `feat(web): add movement history with filters`

### W5: Dashboard
- Requires the Stock Agent's daily sales endpoint (section 6).
- KPI cards, alert panels, recent movements, sales trend chart.
- **Commits:**
  - `feat(web): add dashboard KPIs and alert panels`
  - `feat(web): add sales trend chart and recent movements`

### W6: Purchase orders
- List with status tabs, create flow limited to the chosen supplier's products, detail page with the stepper and allowed actions.
- **Commits:**
  - `feat(web): add purchase order list and create flow`
  - `feat(web): add purchase order detail with status stepper and actions`

### W7: Forecast
- Requires the Forecast Agent's history addition (section 6).
- Controls, result cards, formula breakdown, chart, model info panel, and the create-PO action with a link to the new order.
- **Commits:**
  - `feat(web): add forecast page with strategy selector and suggestion breakdown`
  - `feat(web): add forecast history chart`
  - `feat(web): add create purchase order from suggestion action`

### W8: Polish
- Global error boundary, not-found page, empty-state review, responsive pass on every screen at phone, tablet, and desktop widths, keyboard and contrast pass, dark mode pass.
- **Commits:**
  - `feat(web): add error boundaries and not-found page`
  - `chore(web): responsive and accessibility pass`

### W9: Tests
- Unit tests for: the role helper, the movement form schema (direction rules, positive quantity), the PO status-to-actions mapping, and the formatting helpers.
- **Commit:** `test(web): cover role helper, form schemas and status mapping`

### W10: Docs
- Frontend section of the README: setup, environment variables, demo credentials, architecture decisions (cookie and proxy session, data layer, URL state), screenshots, and known limitations.
- **Commit:** `docs(web): add frontend README section and screenshots`

---

## 10. Environment variables (`web/.env.example`)

| Variable | Purpose |
|---|---|
| `API_BASE_URL` | Backend base URL, used only on the server side by the proxy |
| `NEXT_PUBLIC_APP_NAME` | Display name, default ShelfSense |
| `NEXT_PUBLIC_CURRENCY` | Currency code for formatting |
| `NEXT_PUBLIC_SHOW_DEMO_LOGIN` | Shows the demo account quick-fill on the login page |

---

## 11. Testing and manual checks

- Automated: the unit tests in W9.
- Manual run-through before submission, as both Owner and Staff:
  1. Sign in, and confirm Staff cannot see Owner-only items.
  2. Record a sale, and confirm stock, history, alerts, and dashboard update.
  3. Try a sale above stock, and confirm the error message is clear.
  4. Create a PO, mark it ordered, receive it, and confirm stock increased.
  5. Try an invalid transition, and confirm the error is shown.
  6. Run a forecast, create a draft PO from it, and open the new order.
  7. Break the backend (stop it), and confirm error states with Retry appear.
  8. Check phone width, dark mode, and keyboard navigation.

---

## 12. Known limitations (state in the README)

- The route-protection middleware checks only that a session cookie exists. The backend is the authority.
- Demo data is synthetic, so forecasts show the method works and not real-world accuracy.
- No offline mode, no real-time updates (data refreshes on navigation and after mutations).
- Single currency, single language, single branch.

---

## 13. Definition of done

- All phases committed with the exact messages.
- Every screen in section 5 works for the correct roles and has the four states.
- No component calls `fetch` directly, no hardcoded colors, and no business rules live in the UI.
- Mutations invalidate the right queries, so every screen shows fresh data.
- The manual run-through in section 11 passes as Owner and as Staff.
- The app starts from a clean clone using only the README steps.
- The developer can explain every file, the cookie and proxy session design, and the data layer without help.
