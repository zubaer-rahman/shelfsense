import { Role, User } from "@/types/domain";

export type Action =
  | "view_products"
  | "create_product"
  | "edit_product"
  | "deactivate_product"
  | "view_movements"
  | "create_movement"
  | "view_purchase_orders"
  | "create_purchase_order"
  | "transition_purchase_order"
  | "view_forecast"
  | "manage_suppliers"
  | "manage_users"
  | "manage_settings";

/**
 * Single source of truth for UI permission checks.
 * Note: The NestJS API always enforces backend authorization independently.
 */
export function can(user: User | null | undefined, action: Action): boolean {
  if (!user) return false;

  const role: Role = user.role;

  switch (action) {
    case "view_products":
    case "view_movements":
    case "create_movement":
    case "view_forecast":
      // Both OWNER and STAFF can view inventory & register movements
      return true;

    case "create_product":
    case "edit_product":
    case "deactivate_product":
    case "view_purchase_orders":
    case "create_purchase_order":
    case "transition_purchase_order":
    case "manage_suppliers":
    case "manage_users":
    case "manage_settings":
      // OWNER only
      return role === "OWNER";

    default:
      return false;
  }
}

/**
 * Returns a human-friendly explanation for why an action is restricted.
 */
export function getRestrictionReason(action: Action): string {
  switch (action) {
    case "create_purchase_order":
    case "transition_purchase_order":
    case "view_purchase_orders":
      return "Purchase order management is restricted to Owners.";
    case "create_product":
    case "edit_product":
    case "deactivate_product":
      return "Catalog modifications require Owner permissions.";
    case "manage_suppliers":
    case "manage_users":
    case "manage_settings":
      return "Administrative actions require Owner permissions.";
    default:
      return "You do not have permission to perform this action.";
  }
}
