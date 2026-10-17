# Phase W2 Handoff: Auth and API Layer

## Delivered
1. **Directory Structure Alignment**:
   - Flattened `web/` layout to root (no `src/` directory): `web/app/`, `web/components/`, `web/hooks/`, `web/lib/`, `web/types/`, `web/middleware.ts`.
   - `web/tsconfig.json` path mapping `@/*` maps directly to `./*`.
2. **API Proxy & Cookie Session**:
   - `web/app/api/auth/login/route.ts`: Authenticates against `${API_BASE_URL}/api/v1/auth/login` and sets an `httpOnly`, `SameSite=lax` session cookie (`accessToken`).
   - `web/app/api/auth/logout/route.ts`: Clears the session cookie.
   - `web/app/api/proxy/[...path]/route.ts`: Catch-all proxy forwarding requests to the NestJS backend on port 4000, injecting `Authorization: Bearer <cookie_token>`.
3. **Route Protection Middleware**:
   - `web/middleware.ts`: Redirects unauthenticated visitors to `/login?from=<path>`, and redirects logged-in visitors away from `/login` to `/`.
4. **Typed API Client & Query Layer**:
   - `web/lib/api-client.ts`: Typed client unwrapping the NestJS `{ statusCode, message, data }` response envelope and raising structured `ApiClientError`.
   - `web/lib/query-keys.ts`: Central query key factory for cache invalidation.
   - `web/hooks/api/use-current-user.ts`: Query hook fetching `/auth/me` and handling sign-out cache invalidation.
   - `web/lib/permissions.ts`: UI role helper `can(user, action)` for Owner vs Staff display decisions.
5. **Login Screen**:
   - `web/app/(auth)/login/page.tsx`: React Hook Form + Zod validation, password show/hide toggle, error banner, and fast demo access buttons for Owner and Staff.

## Verification
- Run `npm run lint` and `npx next build` in `web/`: All static and dynamic routes compile with zero TypeScript or bundling errors.
- Run `npm run dev` in `api/` (port 4000) and `web/` (port 3000).
- Visit `http://localhost:3000/login` -> click "Owner Account" -> redirects to `/` with authenticated user profile.
- Click Sign Out in the sidebar -> session cookie cleared, redirected back to `/login`.

## Pattern Demonstrated
- **Backend-for-Frontend (BFF) Token Isolation**: The browser JS runtime never accesses the raw JWT; session security is enforced through httpOnly cookies and Next.js route proxying.
