import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { POStatus, MovementType } from "@/types/domain";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Send,
  Ban,
  TrendingDown,
  TrendingUp,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type StockStatus = "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";
export type ExpiryStatus = "GOOD" | "NEAR_EXPIRY" | "EXPIRED";

interface StatusBadgeProps {
  status?: StockStatus | ExpiryStatus | POStatus | MovementType | string;
  label?: string;
  className?: string;
}

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  if (!status) return null;

  switch (status) {
    // Stock Statuses
    case "IN_STOCK":
      return (
        <Badge variant="success" className={cn("gap-1 font-medium", className)}>
          <CheckCircle2 className="w-3 h-3 shrink-0" />
          {label || "In Stock"}
        </Badge>
      );
    case "LOW_STOCK":
      return (
        <Badge variant="warning" className={cn("gap-1 font-medium", className)}>
          <AlertTriangle className="w-3 h-3 shrink-0" />
          {label || "Low Stock"}
        </Badge>
      );
    case "OUT_OF_STOCK":
      return (
        <Badge variant="destructive" className={cn("gap-1 font-medium", className)}>
          <XCircle className="w-3 h-3 shrink-0" />
          {label || "Out of Stock"}
        </Badge>
      );

    // Expiry Statuses
    case "NEAR_EXPIRY":
      return (
        <Badge variant="warning" className={cn("gap-1 font-medium", className)}>
          <Clock className="w-3 h-3 shrink-0" />
          {label || "Near Expiry"}
        </Badge>
      );
    case "EXPIRED":
      return (
        <Badge variant="destructive" className={cn("gap-1 font-medium", className)}>
          <Ban className="w-3 h-3 shrink-0" />
          {label || "Expired"}
        </Badge>
      );
    case "GOOD":
      return (
        <Badge variant="success" className={cn("gap-1 font-medium", className)}>
          <CheckCircle2 className="w-3 h-3 shrink-0" />
          {label || "Valid"}
        </Badge>
      );

    // Purchase Order Statuses
    case "DRAFT":
      return (
        <Badge variant="secondary" className={cn("gap-1 font-medium", className)}>
          <Clock className="w-3 h-3 shrink-0" />
          {label || "Draft"}
        </Badge>
      );
    case "ORDERED":
      return (
        <Badge variant="info" className={cn("gap-1 font-medium", className)}>
          <Send className="w-3 h-3 shrink-0" />
          {label || "Ordered"}
        </Badge>
      );
    case "RECEIVED":
      return (
        <Badge variant="success" className={cn("gap-1 font-medium", className)}>
          <CheckCircle2 className="w-3 h-3 shrink-0" />
          {label || "Received"}
        </Badge>
      );
    case "CANCELLED":
      return (
        <Badge variant="destructive" className={cn("gap-1 font-medium opacity-80", className)}>
          <Ban className="w-3 h-3 shrink-0" />
          {label || "Cancelled"}
        </Badge>
      );

    // Movement Types
    case "STOCK_IN":
      return (
        <Badge variant="success" className={cn("gap-1 font-medium", className)}>
          <TrendingUp className="w-3 h-3 shrink-0" />
          {label || "Stock In"}
        </Badge>
      );
    case "SALE":
      return (
        <Badge variant="destructive" className={cn("gap-1 font-medium", className)}>
          <TrendingDown className="w-3 h-3 shrink-0" />
          {label || "Sale"}
        </Badge>
      );
    case "ADJUSTMENT":
      return (
        <Badge variant="info" className={cn("gap-1 font-medium", className)}>
          <RefreshCw className="w-3 h-3 shrink-0" />
          {label || "Adjustment"}
        </Badge>
      );

    default:
      return (
        <Badge variant="secondary" className={cn("font-medium", className)}>
          {label || status}
        </Badge>
      );
  }
}
