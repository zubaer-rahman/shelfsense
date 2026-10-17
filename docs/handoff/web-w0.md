# Phase W0 Handoff: Foundation

## Delivered
1. **Next.js 15+ & TypeScript Setup**:
   - `web/tsconfig.json` strict mode with `@/*` mapped to `./src/*`.
   - `.env.example` and `.env.local` configured with `API_BASE_URL=http://localhost:4000`, `NEXT_PUBLIC_APP_NAME=ShelfSense`, and `NEXT_PUBLIC_CURRENCY=USD`.
   - `web/.gitignore` configured to exclude build artifacts, env files, and logs.
2. **Tailwind CSS v4 & Fonts**:
   - `@tailwindcss/postcss` and `tailwindcss` v4 integrated via `postcss.config.mjs`.
   - Inter font configured in `web/src/app/layout.tsx` via `next/font/google` with tabular numbers enabled.
3. **Core Dependencies**:
   - TanStack Query (`@tanstack/react-query`) with `QueryProvider`.
   - Theme switching via `next-themes` with `ThemeProvider`.
   - Form handling with `react-hook-form` and `zod`.
   - Notifications via `sonner` (`<Toaster />`).
   - Radix primitives installed: Dialog, Dropdown, Select, Slot, Tabs, Tooltip.
   - Utilities: `clsx`, `tailwind-merge` in `web/src/lib/utils.ts`.

## Verification
- Run `npm run lint` or `npx next build` in `web/` to confirm zero TypeScript and bundling errors.

## Pattern Demonstrated
- **Zero-Config Foundation**: Centralized path aliases (`@/*`), strict typing, and provider isolation wrapping the application layout.
