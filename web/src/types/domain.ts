export type Role = "OWNER" | "STAFF";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt?: string;
  updatedAt?: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactName?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    products?: number;
    purchaseOrders?: number;
  };
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  unitPrice: number;
  quantity: number;
  reorderLevel: number;
  expiryDate?: string | null;
  isActive: boolean;
  supplierId: string;
  supplier?: Supplier;
  createdAt?: string;
  updatedAt?: string;
}

export type MovementType = "SALE" | "STOCK_IN" | "ADJUSTMENT";

export interface StockMovement {
  id: string;
  productId: string;
  product?: Product;
  quantity: number;
  type: MovementType;
  reason?: string | null;
  reference?: string | null;
  userId?: string | null;
  user?: User | null;
  createdAt: string;
}

export type POStatus = "DRAFT" | "ORDERED" | "RECEIVED" | "CANCELLED";

export interface PurchaseOrderItem {
  id: string;
  purchaseOrderId: string;
  productId: string;
  product?: Product;
  quantity: number;
  unitCost: number;
}

export interface PurchaseOrder {
  id: string;
  orderNumber: string;
  supplierId: string;
  supplier?: Supplier;
  status: POStatus;
  orderDate: string;
  expectedDate?: string | null;
  receivedDate?: string | null;
  notes?: string | null;
  totalCost?: number;
  items: PurchaseOrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface DashboardMetrics {
  totalProducts: number;
  totalStockValue: number;
  lowStockCount: number;
  nearExpiryCount: number;
  criticalAlertsCount: number;
  pendingOrdersCount: number;
}

export interface DailySalesData {
  date: string;
  salesCount: number;
  revenue: number;
}

export interface ForecastItem {
  productId: string;
  productName: string;
  sku: string;
  currentStock: number;
  reorderLevel: number;
  averageDailyDemand: number;
  predictedDemandNext30Days: number;
  suggestedReorderQuantity: number;
  stockoutRisk: "HIGH" | "MEDIUM" | "LOW";
  modelUsed: "MOVING_AVERAGE" | "LINEAR_REGRESSION" | "EXPONENTIAL_SMOOTHING";
  mae: number;
}

export interface StockAlert {
  id: string;
  type: "LOW_STOCK" | "OUT_OF_STOCK" | "NEAR_EXPIRY" | "EXPIRED";
  severity: "CRITICAL" | "WARNING" | "INFO";
  title: string;
  message: string;
  productId: string;
  productName: string;
  sku: string;
  createdAt: string;
}
