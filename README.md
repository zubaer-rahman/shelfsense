# ShelfSense

> **Smart inventory, expiry tracking, and demand-based reorder suggestions for retail shops.**

ShelfSense is a production-grade inventory management and forecasting backend built with **NestJS**, **Prisma ORM**, and **PostgreSQL**. It guarantees double-entry ledger balance integrity, enforces strict role-based access control, detects low stock and upcoming expirations, and predicts restocking needs using statistical and machine learning demand forecasting strategies.

---

## 1. Quickstart & Setup

### Prerequisites
- **Node.js**: v22.x or v24.x LTS
- **PostgreSQL**: v15+ (or cloud instances such as Neon/Supabase/RDS)
- **npm**: v10+

### Installation & Initialization

1. **Clone the repository and install dependencies:**
   ```bash
   git clone <repo-url>
   cd shelfsense
   npm install
   ```

2. **Configure environment variables:**
   ```bash
   cp api/.env.example api/.env
   ```
   Edit `api/.env` and supply your PostgreSQL connection string.

3. **Generate Prisma client and run migrations:**
   ```bash
   npm --workspace=api run prisma:generate
   npm --workspace=api run prisma:migrate
   ```

4. **Seed database with demo users, catalog, and 90 days of synthetic sales:**
   ```bash
   npm --workspace=api run seed
   ```

5. **Start the API development server:**
   ```bash
   npm --workspace=api run dev
   ```
   - API Base URL: `http://localhost:4000/api/v1`
   - **Interactive Swagger UI**: `http://localhost:4000/api/docs`
   - OpenAPI JSON Schema: `http://localhost:4000/api/docs-json`

6. **Run the AI/ML forecast evaluation:**
   ```bash
   npm --workspace=api run evaluate:forecast
   ```

7. **Execute unit tests:**
   ```bash
   npm --workspace=api run test
   ```

---

## 2. Environment Variables

| Variable | Default / Example | Purpose |
| :--- | :--- | :--- |
| `DATABASE_URL` | `postgresql://user:pass@localhost:5432/shelfsense?sslmode=prefer` | PostgreSQL connection string |
| `JWT_SECRET` | `your-secure-jwt-secret-key` | Secret key used for signing JWT auth tokens |
| `JWT_EXPIRES_IN` | `7d` | Lifetime of issued JWT tokens |
| `PORT` | `4000` | Port on which the API listens |
| `CORS_ORIGIN` | `http://localhost:3000` | Whitelisted origin for frontend web application |
| `LEAD_TIME_DAYS` | `7` | Default supplier lead time in days used in reorder formula |
| `SAFETY_BUFFER` | `5` | Extra buffer units added to suggested reorder quantity |
| `FORECAST_WINDOW_DAYS` | `14` | Default historical window size (in days) for rolling averages |
| `NEAR_EXPIRY_DAYS` | `7` | Horizon threshold (in days) for identifying products near expiry |

---

## 3. Demo Credentials

The database seeder provisions two default accounts (`password123`):

| Role | Email | Password | Capabilities |
| :--- | :--- | :--- | :--- |
| **OWNER** | `owner@shelfsense.local` | `password123` | Full administrative control: manage catalog, users, suppliers, purchase orders, adjustments, stock-in, and forecasting reorder creation. |
| **STAFF** | `staff@shelfsense.local` | `password123` | Point-of-Sale operations: record `SALE` stock movements, view catalog, read alerts, and check forecasting suggestions. |

---

## 4. Architecture & Design

### System Architecture Diagram

```mermaid
graph TD
    Client["Client / Web Frontend"] -->|HTTP / JSON| Gateway["NestJS Controller Layer (/api/v1)"]
    Gateway --> Guards["JwtAuthGuard & RolesGuard"]
    Guards --> Services["Business Services Layer"]

    subgraph "Domain Core"
        Services --> StockService["StockService (Guarded Transactions)"]
        Services --> PO["PurchaseOrdersService (State Machine)"]
        Services --> ReorderFacade["ReorderFacade"]
        Services --> ForecastService["ForecastService"]
        ForecastService --> Strategies["Forecast Strategies (Strategy Pattern)"]
    end

    StockService -->|Emits post-commit| Events["stock.changed Event"]
    Events --> AlertsListener["AlertsListener (Observer Pattern)"]
    AlertsListener --> AlertsService["AlertsService"]

    StockService --> DB[("PostgreSQL Database (Prisma Singleton)")]
    PO --> DB
    AlertsService --> DB
```

### The Five Required Design Patterns

1. **Singleton (`PrismaService`)**
   - **Where**: `PrismaService` extends `PrismaClient` with `@prisma/adapter-pg` pool and is registered in a `@Global()` `PrismaModule`.
   - **Why Justified**: Opening a new PostgreSQL connection per HTTP request exhausts database connection pools. A single shared instance ensures optimal connection pooling, lifecycle management, and consistent transaction handling.

2. **Dependency Injection (NestJS IoC)**
   - **Where**: Every controller and service receives its dependencies strictly through constructors. Strategy implementations and services depend on abstractions (`ConfigService`, `EventEmitter2`, `PrismaService`), never on concrete `new` instantiations.
   - **Why Justified**: Enables testability (mocking Prisma without spinning up live databases) and preserves loose coupling across domain modules.

3. **Strategy (`ForecastStrategy` & Movement Sign Mapping)**
   - **Where**: 
     - `ForecastStrategy` interface implemented by `NaiveBaselineStrategy`, `MovingAverageStrategy`, and `LinearRegressionStrategy`.
     - Movement sign calculation map (`MOVEMENT_STRATEGIES`) assigning sign rules to `SALE`, `STOCK_IN`, and `ADJUSTMENT`.
   - **Why Justified**: Makes forecasting models interchangeable and testable without altering `ForecastService`. Replaces brittle `switch/case` statements with open-for-extension strategy lookups.

4. **Observer (`stock.changed` Event)**
   - **Where**: `StockService` emits `stock.changed` **only after** database transactions commit. `AlertsListener` listens to the event and triggers low-stock inspection.
   - **Why Justified**: The stock service remains agnostic of alerting, notifications, or external listeners. New reactions to inventory shifts can be attached without altering stock movement code.

5. **Facade (`ReorderFacade`)**
   - **Where**: `ReorderFacade.createPOFromSuggestion(productId, userId)` encapsulates coordination across `ForecastService`, `ProductsService`, and `PurchaseOrdersService`.
   - **Why Justified**: Prevents the controller layer from orchestrating complex multi-service workflows, exposing a unified, high-level entry point for automated procurement.

---

## 5. SOLID Principles Applied

- **S (Single Responsibility)**:
  - Controllers only parse requests, validate DTOs, and delegate to a single service or facade method.
  - Services contain business rules.
  - `AlertsListener` handles alert triggers without embedding stock update logic.
  - `PrismaService` manages connection lifecycle only.
- **O (Open/Closed)**:
  - Adding a new forecasting algorithm (e.g. Exponential Smoothing) requires creating a class implementing `ForecastStrategy` and registering it in `FORECAST_STRATEGIES`, without modifying `ForecastService`.
  - Adding reactions to inventory changes requires creating a new event listener without editing `StockService`.
- **L (Liskov Substitution)**:
  - All `ForecastStrategy` implementations adhere to `calculateExpectedDailyDemand(history: number[], window?: number): number`. Any strategy can be substituted into the forecasting pipeline or evaluation harness without type checks.
- **I (Interface Segregation)**:
  - Contracts are lean and purpose-built: `ForecastStrategy` only requires `name` and `calculateExpectedDailyDemand`.
  - Separate DTOs exist for each operation (`CreateProductDto`, `UpdateProductDto`, `CreateStockMovementDto`, `CreatePurchaseOrderDto`) instead of a single bloated DTO.
- **D (Dependency Inversion)**:
  - `ForecastService` depends on the `FORECAST_STRATEGIES` injection token rather than directly importing or instantiating concrete algorithm classes with `new`.

---

## 6. AI/ML Demand Forecasting Engine

### Inputs
- **Historical Sales Series**: Contiguous daily sales quantities derived from `StockMovement` records where `type = SALE` (stored negative, evaluated in absolute terms). Days without sales are zero-filled.
- **Forecast Window ($W$)**: Rolling lookback horizon (default: 14 days; evaluated across 7, 14, and 30 days).

### Outputs & Reorder Formula
The system predicts the expected daily sales volume $\hat{d}$ and calculates the reorder quantity using:
$$\text{suggestedReorderQty} = \max\left(0, \left\lceil \hat{d} \times \text{LEAD\_TIME\_DAYS} + \text{SAFETY\_BUFFER} - \text{currentStock} \right\rceil\right)$$

### Methods
1. **Naive Baseline (`NaiveBaselineStrategy`)**:
   - Assumes demand tomorrow will equal yesterday's demand:
     $$\hat{d} = y_{t-1}$$
2. **Simple Moving Average (`MovingAverageStrategy`)**:
   - Computes the unweighted arithmetic mean over the previous $W$ days:
     $$\hat{d} = \frac{1}{W} \sum_{i=1}^{W} y_{t-i}$$
3. **Linear Regression (`LinearRegressionStrategy`)**:
   - Fits an ordinary least-squares trendline $y = mx + b$ over window $W$, evaluating at $x = W + 1$:
     $$m = \frac{N \sum xy - \sum x \sum y}{N \sum x^2 - (\sum x)^2}, \quad b = \frac{\sum y - m \sum x}{N}$$
   - Non-negativity constraint enforced: $\hat{d} = \max(0, m(W+1) + b)$.

### Evaluation Protocol & Metrics
Evaluated with a **14-day holdout split** across 24 catalog products with 90 days of synthetic demand. Predictions are compared against actual sales using Mean Absolute Error (MAE):
$$\text{MAE} = \frac{1}{H} \sum_{t=1}^{H} |y_t - \hat{y}_t|$$

#### Empirical Evaluation Results (`npm run evaluate:forecast`)

| Strategy | Window ($W$) | Mean Absolute Error (MAE) | vs. Naive Baseline |
| :--- | :---: | :---: | :---: |
| **Naive Baseline** | 14 days | 2.0536 | 0.00% (Baseline) |
| **Moving Average** | 14 days | **1.7783** | **+13.41%** |
| **Linear Regression** | 30 days | **1.7864** | **+13.01%** |
| **Moving Average** | 30 days | 1.8835 | +8.28% |
| **Moving Average** | 7 days | 1.8903 | +7.95% |
| **Linear Regression** | 14 days | 1.9182 | +6.59% |
| **Linear Regression** | 7 days | 2.2793 | -10.99% |

*Takeaway: Moving average over a 14-day window and Linear Regression over a 30-day window achieve the lowest MAE by effectively filtering stochastic daily noise and capturing medium-term trends.*

---

## 7. API Surface Summary

All endpoints are prefixed with `/api/v1` and protected by `JwtAuthGuard` and `RolesGuard` (except `/auth/login` and `/health`).

| Method | Endpoint | Allowed Role | Purpose |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/login` | Public | Authenticates credentials, returns JWT and sets HTTP-only cookie |
| `POST` | `/auth/logout` | Public | Clears session cookie |
| `GET` | `/auth/me` | STAFF, OWNER | Returns profile of authenticated user |
| `POST` | `/users` | OWNER | Registers a new STAFF or OWNER user account |
| `GET` | `/users` | OWNER | Lists registered users |
| `PATCH` | `/users/:id/deactivate` | OWNER | Deactivates user account (prevents future logins) |
| `GET` | `/suppliers` | STAFF, OWNER | Lists active suppliers with pagination and search |
| `POST` | `/suppliers` | OWNER | Registers a new supplier |
| `GET` | `/suppliers/:id` | STAFF, OWNER | Retrieves supplier details |
| `PATCH` | `/suppliers/:id` | OWNER | Updates supplier information |
| `DELETE` | `/suppliers/:id` | OWNER | Soft-deletes a supplier |
| `GET` | `/products` | STAFF, OWNER | Catalog search, category filter, and pagination |
| `POST` | `/products` | OWNER | Creates product with SKU and active supplier validation |
| `GET` | `/products/:id` | STAFF, OWNER | Retrieves product detail |
| `PATCH` | `/products/:id` | OWNER | Updates product details |
| `DELETE` | `/products/:id` | OWNER | Soft-deletes a product |
| `POST` | `/stock/movements` | SALE: Any, others: OWNER | Atomic stock movement (`SALE`, `STOCK_IN`, `ADJUSTMENT`) |
| `GET` | `/stock/movements` | STAFF, OWNER | Historical ledger movements query with filters |
| `GET` | `/alerts/low-stock` | STAFF, OWNER | Lists products where `quantity <= reorderLevel` |
| `GET` | `/alerts/near-expiry` | STAFF, OWNER | Lists products expiring within specified horizon |
| `GET` | `/alerts/expired` | STAFF, OWNER | Lists expired inventory |
| `GET` | `/purchase-orders` | OWNER | Lists purchase orders by status |
| `POST` | `/purchase-orders` | OWNER | Creates draft PO with supplier validation |
| `GET` | `/purchase-orders/:id` | OWNER | Retrieves purchase order with items |
| `PATCH` | `/purchase-orders/:id/order` | OWNER | Transitions PO from `DRAFT` to `ORDERED` |
| `PATCH` | `/purchase-orders/:id/receive` | OWNER | Transitions PO to `RECEIVED` and increments stock |
| `PATCH` | `/purchase-orders/:id/cancel` | OWNER | Cancels PO (`DRAFT` or `ORDERED`) |
| `GET` | `/forecast/:productId` | STAFF, OWNER | Returns expected daily demand and reorder suggestion |
| `POST` | `/forecast/:productId/create-po` | OWNER | Creates a draft PO from reorder suggestion via `ReorderFacade` |
| `GET` | `/health` | Public | Healthcheck probe endpoint |

---

## 8. Known Limitations

1. **Synthetic Historical Data**: Demand data is synthetically modeled to demonstrate algorithm efficacy and comparative MAE evaluation.
2. **Unmodeled Exogenous Factors**: No promotional campaigns, flash sales, weather anomalies, or bank holidays are incorporated.
3. **New Product Cold-Start**: Algorithms require at least 7 to 14 days of history to produce reliable demand estimates.
4. **Global Tunables**: Lead time (`LEAD_TIME_DAYS`) and safety buffer (`SAFETY_BUFFER`) are configured globally rather than per supplier or SKU.
5. **Single Supplier Association**: Each product is mapped to a single primary supplier.
6. **Single Expiry Field**: Products track a single upcoming expiration date rather than multi-batch lot tracking.

---

## 9. Frontend Web Application (Next.js 16)

The frontend is a responsive, accessible single-page application built with **Next.js 16 App Router**, **Tailwind CSS v4**, **TanStack Query v5**, **React Hook Form**, **Zod**, and **Radix UI primitives**. It strictly implements the visual reference design system, featuring a dark slate (`#020617` / `#0F172A`) and rich teal (`#0D9488` / `#2DD4BF`) theme palette.

### Quickstart & Setup

1. **Install dependencies:**
   ```bash
   cd web
   npm install
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env.local
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```
   Web App URL: `http://localhost:3000`

4. **Run TypeScript checks and production build:**
   ```bash
   npm run lint
   npm run build
   ```

5. **Run frontend unit tests:**
   ```bash
   npm test
   ```

### Frontend Environment Variables (`web/.env.example`)

| Variable | Purpose | Default |
| :--- | :--- | :--- |
| `API_BASE_URL` | Backend URL used by the server-side API proxy | `http://localhost:4000` |
| `NEXT_PUBLIC_APP_NAME` | Application title displayed across headers and metadata | `ShelfSense` |
| `NEXT_PUBLIC_CURRENCY` | Currency code used by browser locale currency formatters | `USD` |
| `NEXT_PUBLIC_SHOW_DEMO_LOGIN` | Toggles the fast-access one-click credentials on the login screen | `true` |

### Demo Credentials & Role Simulation

Fast access buttons on `/login` allow instant authentication:
- **Owner**: `owner@shelfsense.local` / `password123` (Full catalog, supplier management, purchase orders, restocking, and forecast PO draft creation).
- **Staff**: `staff@shelfsense.local` / `password123` (Sale stock movement logging, catalog viewing, alert monitoring).
- **Floating Dev Toolbar**: Located in the bottom-left corner of authenticated views, enabling instant toggling between Owner and Staff perspectives without re-authenticating.

### Key Architecture Decisions

1. **Token Isolation & Session Security**:
   - Client-side JavaScript **never** touches or stores the raw JWT access token in `localStorage` or memory.
   - All authentication routes through `web/app/api/auth/login`, which sets a secure `httpOnly`, `SameSite=Lax` cookie.
   - The server-side proxy (`web/app/api/proxy/[...path]`) reads the cookie on each outbound request, attaching `Authorization: Bearer <token>` to the NestJS backend on port 4000.

2. **Data Layer & Query Cache Invalidation**:
   - All data fetching uses TanStack Query (`@tanstack/react-query`) wrapped around a typed `apiClient`.
   - Centralized query keys in `web/lib/query-keys.ts`.
   - Mutations strictly trigger deterministic cache invalidations:
     - Recording a stock movement invalidates `stock`, `products`, `alerts`, and `dashboard`.
     - Transitioning or receiving a PO invalidates `purchase-orders`, `products`, `stock`, and `alerts`.
     - Creating/updating products invalidates `products` and `alerts`.

3. **The Four Explicit States Rule**:
   - Every table, card, and data-fetching component implements four distinct states:
     1. **Loading**: Structural skeletons mimicking the final layout (never generic screen spinners).
     2. **Empty**: Contextual explanation and a clear call-to-action button.
     3. **Error**: User-friendly error message with an actionable "Retry" button.
     4. **Success**: Rendered data with pagination and search filtering.

4. **URL-Driven State**:
   - Search queries, category filters, stock status tabs, pagination pages, and selected purchase order IDs synchronize directly with browser URL parameters (`useSearchParams`).
   - Users can share or bookmark filtered catalog views and order records.

5. **Design Tokens & Dark Mode Fidelity**:
   - Styled using Tailwind CSS v4 with an `@theme` block in `web/app/globals.css`.
   - Zero hardcoded hex codes. All colors map to CSS variable design tokens (`bg-background`, `bg-card`, `border-border`, `text-foreground`, `text-primary`, status colors).
   - Full dark and light theme support powered by `next-themes` and a header theme toggle.

6. **Zero Business Rules in the UI**:
   - The backend remains the sole authority for stock balances, idempotency, and workflow transitions.
   - The UI uses pure presentational role helpers (`can(user, 'action')`) solely for ergonomic display decisions.

### Route Map

- `/login` — Centered login portal with fast-fill demo credentials.
- `/` (Dashboard) — Operational KPIs, 30-day sales trend chart, recent movements ledger, and 3-column alert triage panels.
- `/products` — Full inventory catalog with search, category filters, stock pills, and create/edit slide-over sheets.
- `/suppliers` — Supplier directory with product counts, contact details, and supplier modal.
- `/stock/movements` — Stock movement recording (Sale, Stock In, Adjustment) with live balance preview and audit history table with CSV export.
- `/purchase-orders` — Owner restock pipeline with status tabs, supplier-filtered creation modal, and 3-step status stepper (`DRAFT` → `ORDERED` → `RECEIVED`).
- `/forecast` — Restock intelligence engine with strategy switcher, rolling window controls, transparent mathematical formula breakdown, and one-click draft PO creation.

### Frontend Known Limitations

1. **Proxy Session Validation**: The Next.js edge proxy checks for session cookie presence; all authorization and token validity checks are authoritative on the NestJS backend.
2. **Polling vs. WebSockets**: Data refreshes automatically on navigation and after mutations. Real-time push updates via WebSockets are not enabled.
3. **Single Currency**: Currency formatting utilizes `NEXT_PUBLIC_CURRENCY` (USD default) across all screens.
