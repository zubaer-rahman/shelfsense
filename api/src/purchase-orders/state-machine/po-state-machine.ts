import { BadRequestException } from "@nestjs/common";
import { POStatus } from "@prisma/client";

// Declarative transition data structure defining allowed Purchase Order state transitions (State Machine Pattern).
export const PO_ALLOWED_TRANSITIONS: Record<POStatus, readonly POStatus[]> = {
  [POStatus.DRAFT]: [POStatus.ORDERED, POStatus.CANCELLED],
  [POStatus.ORDERED]: [POStatus.RECEIVED, POStatus.CANCELLED],
  [POStatus.RECEIVED]: [],
  [POStatus.CANCELLED]: [],
} as const;

// Enforces valid state machine lifecycles and transitions for Purchase Orders.
export class POStateMachine {
  // Checks if transition between two status states is permitted by domain rules.
  static canTransition(currentStatus: POStatus, targetStatus: POStatus): boolean {
    const allowed = PO_ALLOWED_TRANSITIONS[currentStatus];
    return allowed ? allowed.includes(targetStatus) : false;
  }

  // Validates transition legality, throwing an informative BadRequestException if illegal.
  static assertValidTransition(
    currentStatus: POStatus,
    targetStatus: POStatus,
  ): void {
    if (!this.canTransition(currentStatus, targetStatus)) {
      const allowed = PO_ALLOWED_TRANSITIONS[currentStatus] || [];
      const allowedStr =
        allowed.length > 0 ? allowed.join(", ") : "none (terminal state)";
      throw new BadRequestException(
        `Invalid status transition: Cannot transition purchase order from ${currentStatus} to ${targetStatus}. Allowed target states from ${currentStatus}: [${allowedStr}].`,
      );
    }
  }

  // Returns allowable subsequent status targets from the provided current status.
  static getAllowedNextStates(currentStatus: POStatus): readonly POStatus[] {
    return PO_ALLOWED_TRANSITIONS[currentStatus] || [];
  }
}
