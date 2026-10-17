# Phase W1 Handoff: Design System and Shell

## Delivered
1. **Design Tokens & CSS Variables**:
   - `web/src/app/globals.css` with semantic tokens for light and dark modes:
     - Background: `#F8FAFC` / `#0B1220`
     - Card / Surface: `#FFFFFF` / `#111827`
     - Border: `#E2E8F0` / `#1F2937`
     - Primary: `#0D9488` / `#2DD4BF`
     - Semantic Statuses: Success, Warning, Danger, Info
   - Tabular numerals (`.tabular-nums`) for currency and quantities.
   - Smooth light/dark theme toggling via `ThemeToggle`.
2. **App Shell Layout**:
   - `Sidebar` (`web/src/components/layout/sidebar.tsx`): Persistent desktop sidebar (256px), mobile slide-out drawer, role-gated navigation, user footer.
   - `Header` (`web/src/components/layout/header.tsx`): Live dispensary indicator, ⌘K search trigger, notification bell, theme toggle, user badge.
   - `QuickSearchDialog` (`web/src/components/layout/quick-search-dialog.tsx`): Global ⌘K / Ctrl+K listener with product catalog filter.
   - `AppShell` (`web/src/components/layout/app-shell.tsx`): Responsive shell unifying layout and dialogs.
3. **Shared Presentational Components**:
   - `StatCard` (`web/src/components/shared/stat-card.tsx`): KPI display with skeleton loading support.
   - `StatusBadge` (`web/src/components/shared/status-badge.tsx`): Section 2.3 status color language with icons and text.
   - `DataTable` (`web/src/components/shared/data-table.tsx`): Explicit 4-state table (skeleton rows, empty state, error with retry, rendered data with pagination).
   - `PageHeader` (`web/src/components/shared/page-header.tsx`): Title, description, action buttons.
   - `EmptyState` (`web/src/components/shared/empty-state.tsx`): Clean empty message with optional CTA.
   - `ErrorState` (`web/src/components/shared/error-state.tsx`): User-friendly error message with retry trigger.
   - `ConfirmDialog` (`web/src/components/shared/confirm-dialog.tsx`): Radix-based confirmation modal with destructive variant.
4. **Role Helper**:
   - `web/src/lib/permissions.ts`: UI helper `can(user, action)` for Owner vs Staff display gating.

## Verification
- Run `npm run dev` in `web/` and open `http://localhost:3000`.
- Verify light and dark mode toggling works smoothly.
- Press `⌘K` or `Ctrl+K` to open the quick search palette.
- Responsive test: resize window to mobile width (<640px) to verify hamburger drawer.

## Pattern Demonstrated
- **Separation of Presentation from Business Logic**: UI components are purely presentational and consume design tokens; permissions and API actions are cleanly decoupled.
