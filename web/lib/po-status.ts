import { POStatus } from "@/types/domain";

export type POAction = "SUBMIT_ORDER" | "RECEIVE" | "CANCEL" | "PRINT";

/**
 * Returns the list of permitted actions for a given Purchase Order lifecycle status.
 * DRAFT -> can SUBMIT_ORDER, CANCEL, PRINT
 * ORDERED -> can RECEIVE, CANCEL, PRINT
 * RECEIVED -> can PRINT (terminal state)
 * CANCELLED -> can PRINT (terminal state)
 */
export function getAllowedPOActions(status: POStatus): POAction[] {
  switch (status) {
    case "DRAFT":
      return ["SUBMIT_ORDER", "CANCEL", "PRINT"];
    case "ORDERED":
      return ["RECEIVE", "CANCEL", "PRINT"];
    case "RECEIVED":
    case "CANCELLED":
      return ["PRINT"];
    default:
      return ["PRINT"];
  }
}

export function canExecutePOAction(status: POStatus, action: POAction): boolean {
  return getAllowedPOActions(status).includes(action);
}
