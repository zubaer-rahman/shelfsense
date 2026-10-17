# ShelfSense API Documentation (OpenAPI 3.0)

> Base URL: `http://localhost:4000/api/v1`  
> Interactive Swagger UI: `http://localhost:4000/api/docs`  
> OpenAPI Spec JSON: [docs/openapi.json](./openapi.json)

---

## 1. Authentication & Security

All routes (except `/auth/login` and `/health`) require authentication via either:
1. **Bearer JWT Token**: Sent in the `Authorization` header: `Authorization: Bearer <token>`
2. **HTTP-only Cookie**: Automatically sent as `accessToken` cookie.

### Roles & Access Control
- `OWNER`: Full administrative rights (product/supplier write, stock adjustment/stock-in, purchase orders, reorders, user administration).
- `STAFF`: POS operations (`SALE` movements), read catalog, view alerts, view forecast suggestions.

---

## 2. API Endpoints Reference

### 2.1 Authentication (`/auth`)

#### `POST /auth/login`
- **Access**: Public
- **Description**: Authenticate with email and password. Returns JWT and sets `accessToken` HTTP-only cookie.
- **Request Body**:
  ```json
  {
    "email": "owner@shelfsense.local",
    "password": "password123"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "message": "Logged in successfully",
    "accessToken": "eyJhbGciOi...",
    "user": {
      "id": "uuid",
      "email": "owner@shelfsense.local",
      "name": "Owner User",
      "role": "OWNER"
    }
  }
  ```

#### `POST /auth/logout`
- **Access**: Public
- **Description**: Clears the session cookie.
- **Response `200 OK`**: `{ "message": "Logged out successfully" }`

#### `GET /auth/me`
- **Access**: Any authenticated user (`STAFF`, `OWNER`)
- **Description**: Returns profile and role of currently logged in user.
- **Response `200 OK`**: Returns user profile object.

---

### 2.2 Users Management (`/users`)

#### `POST /users`
- **Access**: `OWNER` only
- **Description**: Register a new user account (Staff or Owner).
- **Request Body**:
  ```json
  {
    "name": "Jane Staff",
    "email": "jane@shelfsense.local",
    "password": "password123",
    "role": "STAFF"
  }
  ```
- **Response `201 Created`**: User profile (passwordHash omitted).

#### `GET /users`
- **Access**: `OWNER` only
- **Description**: List all registered users.

#### `PATCH /users/:id/deactivate`
- **Access**: `OWNER` only
- **Description**: Soft deactivates a user (sets `isActive: false`, blocking login).

---

### 2.3 Suppliers (`/suppliers`)

#### `GET /suppliers`
- **Access**: Any authenticated user
- **Query Params**: `page` (default: 1), `limit` (default: 20), `search` (optional)
- **Response `200 OK`**: Paginated list of active suppliers.

#### `POST /suppliers`
- **Access**: `OWNER` only
- **Request Body**:
  ```json
  {
    "name": "Apex Foods & Beverages",
    "email": "sales@apexfoods.com",
    "phone": "+1-555-0101"
  }
  ```

#### `GET /suppliers/:id`
- **Access**: Any authenticated user

#### `PATCH /suppliers/:id`
- **Access**: `OWNER` only
- **Request Body**: Partial fields (`name`, `email`, `phone`).

#### `DELETE /suppliers/:id`
- **Access**: `OWNER` only
- **Description**: Soft-deactivates supplier.

---

### 2.4 Products Catalog (`/products`)

#### `GET /products`
- **Access**: Any authenticated user
- **Query Params**: `page`, `limit`, `search` (matches SKU or Name), `category` (exact match)
- **Response `200 OK`**: Paginated list of products.

#### `POST /products`
- **Access**: `OWNER` only
- **Request Body**:
  ```json
  {
    "name": "Organic Almond Milk 1L",
    "sku": "APX-ALM-01",
    "category": "Beverages",
    "unitPrice": 3.99,
    "quantity": 45,
    "reorderLevel": 20,
    "expiryDate": "2026-12-31",
    "supplierId": "supplier-uuid"
  }
  ```

#### `GET /products/:id`
- **Access**: Any authenticated user

#### `PATCH /products/:id`
- **Access**: `OWNER` only

#### `DELETE /products/:id`
- **Access**: `OWNER` only (soft delete)

---

### 2.5 Stock Movements (`/stock`)

#### `POST /stock/movements`
- **Access**: 
  - `SALE`: Any role (`STAFF`, `OWNER`)
  - `STOCK_IN`, `ADJUSTMENT`: `OWNER` only
- **Signed Quantity Rule**:
  - `SALE`: stores negative quantity (`-quantity`). Guarded conditional check prevents negative stock (`409 Conflict` on underflow).
  - `STOCK_IN`: increments stock (`+quantity`).
  - `ADJUSTMENT`: requires `direction: "INCREASE"` (`+quantity`) or `direction: "DECREASE"` (`-quantity`).
- **Request Body (Sale)**:
  ```json
  {
    "productId": "product-uuid",
    "type": "SALE",
    "quantity": 3,
    "note": "Register #1 counter checkout"
  }
  ```
- **Request Body (Adjustment)**:
  ```json
  {
    "productId": "product-uuid",
    "type": "ADJUSTMENT",
    "quantity": 2,
    "direction": "DECREASE",
    "note": "Damaged carton on floor"
  }
  ```
- **Response `201 Created`**:
  ```json
  {
    "message": "Stock movement recorded successfully",
    "movement": { ... },
    "currentStock": 42
  }
  ```

#### `GET /stock/movements`
- **Access**: Any authenticated user
- **Query Params**: `productId`, `type` (`SALE`, `STOCK_IN`, `ADJUSTMENT`), `startDate`, `endDate`, `page`, `limit`.

---

### 2.6 Alerts (`/alerts`)

#### `GET /alerts/low-stock`
- **Access**: Any authenticated user
- **Description**: Returns all active products where `quantity <= reorderLevel`.

#### `GET /alerts/near-expiry`
- **Access**: Any authenticated user
- **Query Params**: `days` (optional horizon, defaults to config: 7 days)
- **Description**: Products where `expiryDate` is between today and `today + N days`.

#### `GET /alerts/expired`
- **Access**: Any authenticated user
- **Description**: Products where `expiryDate < today`.

---

### 2.7 Purchase Orders (`/purchase-orders`)

#### `POST /purchase-orders`
- **Access**: `OWNER` only
- **Description**: Creates a `DRAFT` purchase order. Validates that all items belong to the specified supplier.
- **Request Body**:
  ```json
  {
    "supplierId": "supplier-uuid",
    "items": [
      {
        "productId": "product-uuid",
        "quantity": 25,
        "unitCost": 2.50
      }
    ]
  }
  ```

#### `GET /purchase-orders`
- **Access**: `OWNER` only
- **Query Params**: `status` (`DRAFT`, `ORDERED`, `RECEIVED`, `CANCELLED`), `page`, `limit`.

#### `GET /purchase-orders/:id`
- **Access**: `OWNER` only
- **Description**: Details of order including line items and supplier.

#### `PATCH /purchase-orders/:id/order`
- **Access**: `OWNER` only
- **Transition**: `DRAFT` ➔ `ORDERED`. Stamps `orderedAt`.

#### `PATCH /purchase-orders/:id/receive`
- **Access**: `OWNER` only
- **Transition**: `ORDERED` ➔ `RECEIVED`. Stamps `receivedAt`, and atomically creates a `STOCK_IN` movement for each item.

#### `PATCH /purchase-orders/:id/cancel`
- **Access**: `OWNER` only
- **Transition**: `DRAFT` or `ORDERED` ➔ `CANCELLED`.

---

### 2.8 Demand Forecasting (`/forecast`)

#### `GET /forecast/:productId`
- **Access**: Any authenticated user
- **Query Params**:
  - `strategy`: `"naive"` | `"moving_average"` (default) | `"linear_regression"`
  - `window`: lookback days (default: 14)
- **Formula**:
  $$\text{suggestedReorderQty} = \max(0, \lceil \hat{d} \times \text{LEAD\_TIME\_DAYS} + \text{SAFETY\_BUFFER} - \text{currentStock} \rceil)$$
- **Response `200 OK`**:
  ```json
  {
    "message": "Demand forecast and reorder suggestion calculated successfully",
    "productId": "product-uuid",
    "productName": "Organic Almond Milk 1L",
    "sku": "APX-ALM-01",
    "strategy": "moving_average",
    "window": 14,
    "expectedDailyDemand": 14.21,
    "currentStock": 45,
    "leadTimeDays": 7,
    "safetyBuffer": 5,
    "suggestedReorderQuantity": 60
  }
  ```

#### `POST /forecast/:productId/create-po`
- **Access**: `OWNER` only
- **Description**: Runs reorder forecast and automatically creates a `DRAFT` Purchase Order for the product's supplier (via `ReorderFacade`).
- **Response `201 Created`**:
  ```json
  {
    "message": "Purchase order draft created from reorder suggestion successfully",
    "purchaseOrder": { ... },
    "forecast": { ... }
  }
  ```

---

### 2.9 Health Check (`/health`)

#### `GET /health`
- **Access**: Public
- **Response `200 OK`**: `{ "status": "ok", "timestamp": "2026-10-17T14:40:00.000Z" }`
