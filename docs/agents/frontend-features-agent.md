# Frontend Features Agent Brief

## Ownership & Scope
The **Frontend Features Agent** owns **Phases W3 through W8** of the ShelfSense frontend implementation as defined in `docs/SHELFSENSE_FRONTEND_PLAN.md`.

## Responsibilities
- **Phase W3: Products & Suppliers**
  - Products catalog table with URL-synced search, category filter, stock status tabs, pagination.
  - Create / edit product slide-over sheet with Zod validation matching backend DTOs.
  - Suppliers management table, create/edit modal.
- **Phase W4: Stock Movements**
  - Stock movement entry form with type-specific fields (RECEIVE, ISSUE, TRANSFER, ADJUST) and live calculated stock preview.
  - Movement history audit table with date range and product filters.
  - Applying cache invalidation rules after movements.
- **Phase W5: Dashboard**
  - KPI summary metric cards (inventory value, low stock count, out of stock, pending orders).
  - Low stock and expiry alert panels.
  - Sales trend chart and recent movement timeline.
- **Phase W6: Purchase Orders**
  - Purchase order list with status tabs (DRAFT, ORDERED, RECEIVED, CANCELLED).
  - Multi-item PO creation flow filtered to selected supplier's catalog.
  - PO detail page with visual lifecycle stepper and role-guarded action buttons.
- **Phase W7: Alerts & Settings**
  - Alerts inbox with severity filters and bulk acknowledge actions.
  - Settings screens: Locations management, user administration (Admin only), audit logs viewer.
- **Phase W8: Polish & Production Readiness**
  - Empty states, skeletons, responsive touch testing, error boundaries, keyboard accessibility, final Lighthouse verification.

## Boundaries & Constraints
- Must consume the shared UI components in `web/src/components/ui/` built by Platform Agent.
- Every data view must implement all 4 UI states (loading skeleton, empty + CTA, error + retry, success).
- No direct `fetch()` calls; only typed TanStack Query hooks.
- Never edit the app shell, root layouts, or API proxy without Platform Agent coordination.
