# ShelfSense API: Backend Implementation Plan

> Smart inventory, expiry tracking, and demand-based reorder suggestions for small shops.

This file is the single source of truth for the backend build. It contains specifications only, no code. The Prisma schema (`prisma/schema.prisma`) is already authored by the developer and is **final**: do not modify it.

---

## 0. Agent operating rules (read first)

1. Work **one phase at a time**. At the end of each phase, stop, list the files created or changed, and wait for the developer's confirmation before starting the next phase.
2. Make **one commit per bullet in the "Commits" list** of each phase, using the exact Conventional Commit messages given. Do not squash phases together.
3. Keep every file small and readable. Add a one-line comment above each class explaining its responsibility. The developer must be able to explain and modify every file live in a technical review.
4. Do not add libraries, features, tables, or endpoints that are not listed here. No payments, uploads, barcode, multi-branch, batch/FIFO.
5. Business rules live in **services**, never in controllers. Controllers only parse input, call one service/facade method, and return the result.
6. Never hardcode secrets or tunables. Read them from config (see section 7).
7. After each phase, run the app and the relevant tests, and report results honestly. If something fails, say so.
8. If a requirement is ambiguous, ask instead of guessing.
9. Follow the SOLID constraints in section 2.1. At the end of each phase, state in one or two lines which principle or pattern the new code demonstrates, so the developer can explain it in the review.

---

## 1. Stack

| Concern    | Choice                                                                                                       |
| ---------- | ------------------------------------------------------------------------------------------------------------ |
| Framework  | NestJS (TypeScript, strict mode)                                                                             |
| Database   | PostgreSQL                                                                                                   |
| ORM        | Prisma (`prisma-client-js`)                                                                                  |
| Auth       | `@nestjs/jwt`, `@nestjs/passport`, `passport-jwt`, `bcrypt`                                                  |
| Validation | `class-validator`, `class-transformer`, global `ValidationPipe` (whitelist, forbidNonWhitelisted, transform) |
| Events     | `@nestjs/event-emitter`                                                                                      |
| Config     | `@nestjs/config`                                                                                             |
| Testing    | Jest (unit tests with mocked Prisma)                                                                         |
| Optional   | Swagger, Helmet, `@nestjs/throttler` (only if time remains)                                                  |

Frontend (separate repo or folder) is Next.js and only consumes this API.

---

## 2. Required design patterns (exactly these five)

| Pattern                  | Where it is used                                                                                                                                                                                                                                            | Why it is justified                                                                                                |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| **Singleton**            | `PrismaService` inside a `@Global()` `PrismaModule`. Nest providers are singletons, so the whole app shares one client and one connection pool.                                                                                                             | Opening a connection per request would exhaust the database. One shared pool is cheaper and predictable.           |
| **Dependency Injection** | Every controller and service receives its dependencies through constructors. Strategies and handlers are registered as providers. Services depend on `PrismaService`, `ConfigService`, and `EventEmitter2`, never on concrete instances created with `new`. | Makes unit tests easy (mock the dependency), keeps modules decoupled.                                              |
| **Strategy**             | (a) `ForecastStrategy` interface with `NaiveBaselineStrategy`, `MovingAverageStrategy`, `LinearRegressionStrategy`. (b) A movement-type map that applies the sign rule per `MovementType` (SALE, STOCK_IN, ADJUSTMENT).                                     | Forecast algorithms are interchangeable and compared by the evaluation script. Sign rules replace a long `switch`. |
| **Observer**             | `StockService` emits `stock.changed` **after** the DB transaction commits. `AlertsListener` subscribes and runs the low-stock check.                                                                                                                        | Stock code must not know about alerts. New listeners can be added without touching the stock service.              |
| **Facade**               | `ReorderFacade.createPOFromSuggestion(productId)` coordinates `ForecastService`, `ProductsService`, and `PurchaseOrdersService` behind one method.                                                                                                          | The controller calls a single simplified entry point instead of orchestrating three services.                      |

Explicitly **not used**: Abstract Factory (no families of related objects exist, so it would be forced and hard to defend).

### 2.1 SOLID principles (design constraints for every phase)

| Principle                    | How it must be applied in this project                                                                                                                                                                                                                                                                                                                                                                                                    |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **S: Single Responsibility** | Controllers only parse input, call one service or facade method, and return the result. Services own business rules. `PrismaService` only manages the database connection. `AlertsListener` only reacts to stock events. Guards only check access. Do not mix these roles in one class.                                                                                                                                                   |
| **O: Open/Closed**           | New forecast algorithms are added as new `ForecastStrategy` classes without editing `ForecastService`. New reactions to stock changes are added as new `stock.changed` listeners without editing `StockService`. Movement sign rules live in a type-to-handler map, so a new movement type means a new entry, not a longer `switch`.                                                                                                      |
| **L: Liskov Substitution**   | Every `ForecastStrategy` implementation accepts the same input (a daily demand series plus parameters) and returns the same output shape, so any strategy can replace another. The evaluation script and the forecast endpoint must work with any registered strategy without type checks. Likewise, every movement handler follows one contract.                                                                                         |
| **I: Interface Segregation** | Keep contracts small and focused: the strategy interface exposes one forecasting method and a name, the movement handler contract exposes only what the stock service needs, and each operation has its own DTO (create, update, transition) instead of one shared large DTO.                                                                                                                                                             |
| **D: Dependency Inversion**  | High-level logic depends on injected dependencies and never constructs them with `new`. Where there are multiple interchangeable implementations (forecast strategies, movement handlers), consumers depend on the **interface through an injection token**, not on a concrete class. Ordinary services (for example `ProductsService`) are injected as classes, which is standard Nest DI and should not be described as full inversion. |

Rules that follow from SOLID:

- A class that needs more than about five injected dependencies is a sign it has too many responsibilities, so split it. The facade is the intended exception because its job is orchestration.
- Do not add an interface for a class that has only one implementation and no testing benefit.
- Do not describe the project as "fully SOLID" in documentation. Name the specific examples above instead.

---

## 3. Domain rules (must be enforced in services)

### 3.1 Roles

| Capability                                            | OWNER | STAFF |
| ----------------------------------------------------- | ----- | ----- |
| Read products, suppliers, alerts, forecast, movements | Yes   | Yes   |
| Create SALE movement                                  | Yes   | Yes   |
| STOCK_IN and ADJUSTMENT movements                     | Yes   | No    |
| Create/update/delete products and suppliers           | Yes   | No    |
| Create and transition purchase orders                 | Yes   | No    |
| Manage users                                          | Yes   | No    |

### 3.2 Signed quantity rule

- The API accepts a **positive integer** quantity.
- The service applies the sign by type: SALE is stored negative, STOCK_IN positive. ADJUSTMENT requires a `direction` field (`INCREASE` or `DECREASE`) that sets the sign.
- `direction` is **required** for ADJUSTMENT and **rejected** for the other types.
- The database stores the signed value. Anything reading SALE quantities for forecasting must use the **absolute value**.

### 3.3 Stock update (critical feature)

- Run inside one Prisma interactive transaction.
- For decreases: a guarded conditional update that only succeeds when current quantity is at least the requested amount. If zero rows are updated, throw an "insufficient stock" error (HTTP 409 or 422, consistent across the app).
- For increases: a plain increment.
- Insert the `StockMovement` row in the same transaction with `userId`, signed quantity, type, and note.
- Reject movements for inactive products.
- Emit `stock.changed` **only after** the transaction has committed, never inside it. Payload: product id, new quantity, movement type.
- `StockService` must expose a way to apply a movement using an **existing transaction client**, so Purchase Order receiving can reuse the same logic atomically.

### 3.4 Purchase order status flow

- Allowed transitions: DRAFT to ORDERED, ORDERED to RECEIVED, DRAFT to CANCELLED, ORDERED to CANCELLED. Everything else returns a clear error.
- Define the allowed transitions as a single data map, not scattered `if` statements.
- Creating a PO: every item's product must belong to the PO's supplier, products and supplier must be active, quantities must be positive, and a product may appear only once per PO.
- Setting ORDERED stamps `orderedAt`. Receiving stamps `receivedAt`, and in **one transaction** creates a STOCK_IN movement for each item via the stock service.
- Cancelling changes status only. It never deletes the order.

### 3.5 Alerts

- Low stock: product quantity is at or below `reorderLevel`, active products only.
- Near expiry: `expiryDate` within the next N days (N from query param, defaulting to config) and not yet expired.
- Expired: `expiryDate` earlier than today.

### 3.6 Forecast formula

```
suggestedReorderQty = max(0, ceil(avgDailyDemand * LEAD_TIME_DAYS + SAFETY_BUFFER - currentStock))
```

- Daily demand series is built from SALE movements grouped by day, using absolute values, with **days that have no sales filled in as zero**.
- Default window and tunables come from config.

### 3.7 Validation and errors

- All write endpoints use DTOs. Unknown fields are rejected.
- Emails are lowercased on register and login.
- Passwords hashed with bcrypt. `passwordHash` is never returned.
- Inactive users cannot log in.
- A global exception filter returns one consistent error shape: status code, message, error type, timestamp, path.
- Prisma `Decimal` values are serialized consistently (as numbers or fixed strings, pick one and document it).

---

## 4. Module layout

```
src/
  main.ts
  app.module.ts
  config/            configuration + env validation
  prisma/            PrismaModule (global), PrismaService (singleton)
  common/
    decorators/      @Roles(), @CurrentUser()
    guards/          JwtAuthGuard, RolesGuard
    filters/         global exception filter
    dto/             PaginationDto
    interceptors/    decimal serialization (if used)
  auth/              controller, service, jwt strategy, DTOs
  users/             controller, service, DTOs
  suppliers/         controller, service, DTOs
  products/          controller, service, DTOs
  stock/             controller, service, movement handlers (strategy map), DTOs, events
  alerts/            controller, service, listener (observer)
  purchase-orders/   controller, service, transition map, DTOs
  forecast/
    strategies/      forecast-strategy.interface, naive, moving-average, linear-regression
    forecast.service, forecast.controller
    reorder.facade
    scripts/         evaluate.ts (holdout + MAE)
prisma/
  schema.prisma      (final, do not edit)
  migrations/
  seed.ts
test/
```

---

## 5. API surface

All routes are prefixed with `/api`. Everything except login requires a valid JWT.

| Method           | Route                                    | Role                     | Purpose                                                      |
| ---------------- | ---------------------------------------- | ------------------------ | ------------------------------------------------------------ |
| POST             | `/auth/login`                            | Public                   | Returns JWT                                                  |
| GET              | `/auth/me`                               | Any                      | Current user                                                 |
| POST             | `/users`                                 | OWNER                    | Create staff or owner                                        |
| GET              | `/users`                                 | OWNER                    | List users                                                   |
| PATCH            | `/users/:id/deactivate`                  | OWNER                    | Soft deactivate                                              |
| GET/POST         | `/suppliers`                             | Read: any, Write: OWNER  | List, create                                                 |
| GET/PATCH/DELETE | `/suppliers/:id`                         | Read: any, Write: OWNER  | Detail, update, soft delete                                  |
| GET/POST         | `/products`                              | Read: any, Write: OWNER  | List (search, category, pagination), create                  |
| GET/PATCH/DELETE | `/products/:id`                          | Read: any, Write: OWNER  | Detail, update, soft delete                                  |
| POST             | `/stock/movements`                       | SALE: any, others: OWNER | Record a movement                                            |
| GET              | `/stock/movements`                       | Any                      | History with filters (product, type, date range, pagination) |
| GET              | `/alerts/low-stock`                      | Any                      | Low-stock list                                               |
| GET              | `/alerts/near-expiry?days=`              | Any                      | Near-expiry list                                             |
| GET              | `/alerts/expired`                        | Any                      | Expired list                                                 |
| GET/POST         | `/purchase-orders`                       | OWNER                    | List (status filter), create draft                           |
| GET              | `/purchase-orders/:id`                   | OWNER                    | Detail with items                                            |
| PATCH            | `/purchase-orders/:id/order`             | OWNER                    | DRAFT to ORDERED                                             |
| PATCH            | `/purchase-orders/:id/receive`           | OWNER                    | ORDERED to RECEIVED                                          |
| PATCH            | `/purchase-orders/:id/cancel`            | OWNER                    | Cancel                                                       |
| GET              | `/forecast/:productId?strategy=&window=` | Any                      | Expected daily demand and suggested reorder quantity         |
| POST             | `/forecast/:productId/create-po`         | OWNER                    | Create a draft PO from the suggestion (via `ReorderFacade`)  |

---

## 6. Phases and commits

### Phase 0: Foundation

- Scaffold NestJS, `.gitignore`, `.env.example`, README stub.
- Config module with env validation. Global `ValidationPipe`. `/api` prefix.
- **Commit:** `chore: initialize NestJS project with config and validation pipe`

### Phase 1: Database layer (Singleton)

- Place the final `schema.prisma`. Create the first migration with the create-only option, then add four CHECK constraints by hand in the SQL: `Product.quantity >= 0`, `Product.reorderLevel >= 0`, `PurchaseOrderItem.quantity > 0`, `StockMovement.quantity <> 0`. Apply the migration.
- `PrismaService` extends the Prisma client, connects on module init, and handles shutdown. `PrismaModule` is global and exports it.
- **Commits:**
  - `feat(db): add Prisma schema with enums, relations and indexes`
  - `feat(db): add CHECK constraints for non-negative stock and positive quantities`
  - `feat(db): add global PrismaModule with singleton PrismaService`

### Phase 2: Auth and roles

- Users module (create with bcrypt, lowercase email, never expose hash). Auth module (login, JWT strategy). `JwtAuthGuard`, `RolesGuard`, `@Roles()`, `@CurrentUser()`.
- **Commits:**
  - `feat(auth): add user creation with bcrypt hashing`
  - `feat(auth): add JWT login and strategy`
  - `feat(auth): add roles guard and Roles decorator`

### Phase 3: Cross-cutting infrastructure

- Global exception filter, `PaginationDto`, decimal serialization.
- **Commit:** `feat(common): add exception filter, pagination DTO and decimal serialization`

### Phase 4: Suppliers and products

- CRUD with soft delete. Product search by name or SKU, category filter, pagination. Validate supplier exists and is active. Duplicate SKU returns a clean conflict error.
- **Commits:**
  - `feat(suppliers): add supplier CRUD with soft delete`
  - `feat(products): add product CRUD with search and pagination`
  - `feat(products): validate supplier and SKU uniqueness`

### Phase 5: Stock movements (critical feature, Strategy + Observer)

- Movement DTOs with type-specific validation. Movement-type handler map applying the sign rule. Transactional guarded update. Post-commit `stock.changed` event. History endpoint.
- **Unit tests (write in this phase):** sale reduces stock, sale above stock is rejected, STOCK_IN increases stock, ADJUSTMENT requires direction, inactive product rejected.
- **Commits:**
  - `feat(stock): add movement DTOs with type-specific validation`
  - `feat(stock): implement transactional stock update with guarded decrement`
  - `feat(stock): emit stock.changed event after commit`
  - `feat(stock): add movement history endpoint`
  - `test(stock): cover sale, insufficient stock, stock-in and adjustment cases`

### Phase 6: Alerts (Observer consumer)

- `AlertsListener` handles `stock.changed` for the low-stock check. Three alert endpoints.
- **Commits:**
  - `feat(alerts): add low-stock listener using observer pattern`
  - `feat(alerts): add low-stock, near-expiry and expired endpoints`

### Phase 7: Purchase orders

- Create draft with supplier validation. Transition map. Receive creates STOCK_IN movements atomically through the stock service.
- **Unit tests:** valid transitions pass, invalid transitions rejected, mismatched supplier rejected.
- **Commits:**
  - `feat(po): add purchase order creation with supplier validation`
  - `feat(po): add status transition rules`
  - `feat(po): receive order creates stock-in movements atomically`
  - `test(po): cover valid and invalid status transitions`

### Phase 8: Forecast (AI/ML, Strategy + Facade)

- Daily sales aggregation (absolute values, zero-filled gaps).
- `ForecastStrategy` interface. `NaiveBaselineStrategy` (same as yesterday). `MovingAverageStrategy` (configurable window). `LinearRegressionStrategy` (learns slope and intercept from the daily series).
- Forecast endpoint returns: product, strategy used, window, expected daily demand, current stock, lead time, safety buffer, suggested reorder quantity.
- `ReorderFacade.createPOFromSuggestion(productId)`: get forecast, validate quantity is above zero, build a DRAFT PO for the product's supplier.
- Evaluation script: for each seeded product, hold out the last 14 days, predict them using only earlier data, compute MAE per strategy, compare windows 7, 14, 30, and print a summary table (average MAE per strategy and percentage improvement over naive).
- **Unit tests:** each strategy on a small fixed series with a hand-computed expected value.
- **Commits:**
  - `feat(forecast): add daily sales aggregation query`
  - `feat(forecast): add strategy interface with naive and moving average`
  - `feat(forecast): add linear regression strategy`
  - `feat(forecast): add reorder suggestion endpoint`
  - `feat(forecast): add reorder facade to create PO from suggestion`
  - `feat(forecast): add holdout evaluation script with MAE comparison`
  - `test(forecast): cover strategies with fixed series`

### Phase 9: Seed data

- Demo users (one OWNER, one STAFF), 3 to 4 suppliers, 20 to 30 products, and 90 days of synthetic **past-dated** sales with explicit `createdAt` values. Final product quantities must equal the sum of the seeded movements (ledger matches cached balance). Include a few low-stock, near-expiry, and expired products. Demand should vary by product and include some noise so the MAE comparison is meaningful.
- **Commit:** `feat(seed): add demo users, products and 90 days of synthetic sales`

### Phase 10: Hardening and docs

- Reconciliation test: sum of movements equals product quantity. Audit every write endpoint for guards. Helmet and rate limiting if time allows. Optional Swagger.
- README: setup steps, env variables, demo credentials, architecture diagram or description, the five patterns and why each is used, a short SOLID section citing the specific examples from section 2.1, the AI/ML section (Inputs, Outputs, Method, Evaluation, Limitations), API summary, known limitations.
- **Commits:**
  - `test(stock): add ledger and balance reconciliation test`
  - `chore(security): review guards and add helmet`
  - `docs: add README with setup, architecture and AI/ML section`

---

## 7. Environment variables (`.env.example`)

| Variable                         | Purpose                                           |
| -------------------------------- | ------------------------------------------------- |
| `DATABASE_URL`                   | PostgreSQL connection string                      |
| `JWT_SECRET`                     | JWT signing secret                                |
| `JWT_EXPIRES_IN`                 | Token lifetime                                    |
| `PORT`                           | API port                                          |
| `CORS_ORIGIN`                    | Allowed frontend origin                           |
| `LEAD_TIME_DAYS`                 | Supplier lead time used in the reorder formula    |
| `SAFETY_BUFFER`                  | Extra units added to the reorder suggestion       |
| `FORECAST_WINDOW_DAYS`           | Default moving average window                     |
| `NEAR_EXPIRY_DAYS`               | Default near-expiry horizon                       |
| `GEMINI_API_KEY`, `GEMINI_MODEL` | Optional, only if the explanation add-on is built |

---

## 8. Known limitations (to state in README)

- Demand data is synthetic, so results show the method works, not how it performs in a real shop.
- No seasonality, holidays, or promotions are modeled.
- Weak for new products with little history.
- Fixed lead time and safety buffer for every product.
- Each product has a single supplier.
- One expiry date per product (no batch tracking).

---

## 9. Definition of done (whole backend)

- All phases committed with the specified messages.
- Every write endpoint is protected by auth and the correct role.
- Negative stock is impossible, both by service logic and by the database CHECK constraint.
- Unit tests pass: stock, purchase order transitions, forecast strategies, reconciliation.
- The evaluation script runs and prints MAE for each strategy.
- Controllers contain no business logic, strategies are injected through tokens, and no service constructs its own dependencies (section 2.1).
- The app starts from a clean clone using only the README steps.
- The developer can explain every file, every pattern, and every business rule without help.
