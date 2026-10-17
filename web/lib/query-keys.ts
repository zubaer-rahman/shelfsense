export const queryKeys = {
  auth: {
    me: ["auth", "me"] as const,
  },
  products: {
    all: ["products"] as const,
    list: (params?: any) => ["products", "list", params] as const,
    detail: (id: string) => ["products", "detail", id] as const,
    categories: ["products", "categories"] as const,
  },
  suppliers: {
    all: ["suppliers"] as const,
    list: (params?: any) => ["suppliers", "list", params] as const,
    detail: (id: string) => ["suppliers", "detail", id] as const,
  },
  stock: {
    all: ["stock"] as const,
    summary: ["stock", "summary"] as const,
    movements: (params?: any) => ["stock", "movements", params] as const,
    dailySales: ["stock", "dailySales"] as const,
  },
  purchaseOrders: {
    all: ["purchase-orders"] as const,
    list: (params?: any) => ["purchase-orders", "list", params] as const,
    detail: (id: string) => ["purchase-orders", "detail", id] as const,
  },
  alerts: {
    all: ["alerts"] as const,
    lowStock: (params?: any) => ["alerts", "low-stock", params] as const,
    nearExpiry: (params?: any) => ["alerts", "near-expiry", params] as const,
    expired: (params?: any) => ["alerts", "expired", params] as const,
  },
  forecast: {
    all: ["forecast"] as const,
    suggestions: ["forecast", "suggestions"] as const,
  },
};
