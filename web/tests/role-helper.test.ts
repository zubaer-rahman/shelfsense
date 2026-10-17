import { describe, it, expect } from "vitest";
import { can, getRestrictionReason, Action } from "@/lib/permissions";
import { User } from "@/types/domain";

describe("Role Helper and Permissions (can)", () => {
  const ownerUser: User = {
    id: "usr-owner-1",
    name: "Elena Rostova",
    email: "elena@cornercare.com",
    role: "OWNER",
  };

  const staffUser: User = {
    id: "usr-staff-1",
    name: "Marcus Vance",
    email: "marcus@cornercare.com",
    role: "STAFF",
  };

  describe("Shared Permissions (Both OWNER and STAFF)", () => {
    const sharedActions: Action[] = [
      "view_products",
      "view_movements",
      "create_movement",
      "view_forecast",
    ];

    sharedActions.forEach((action) => {
      it(`allows OWNER to ${action}`, () => {
        expect(can(ownerUser, action)).toBe(true);
      });

      it(`allows STAFF to ${action}`, () => {
        expect(can(staffUser, action)).toBe(true);
      });
    });
  });

  describe("Owner-Restricted Permissions", () => {
    const ownerOnlyActions: Action[] = [
      "create_product",
      "edit_product",
      "deactivate_product",
      "view_purchase_orders",
      "create_purchase_order",
      "transition_purchase_order",
      "manage_suppliers",
      "manage_users",
      "manage_settings",
    ];

    ownerOnlyActions.forEach((action) => {
      it(`allows OWNER to ${action}`, () => {
        expect(can(ownerUser, action)).toBe(true);
      });

      it(`denies STAFF from ${action}`, () => {
        expect(can(staffUser, action)).toBe(false);
      });
    });
  });

  describe("Unauthenticated / Null User", () => {
    it("denies all actions when user is null or undefined", () => {
      expect(can(null, "view_products")).toBe(false);
      expect(can(undefined, "view_products")).toBe(false);
      expect(can(null, "create_purchase_order")).toBe(false);
      expect(can(undefined, "create_movement")).toBe(false);
    });
  });

  describe("Restriction Explanations (getRestrictionReason)", () => {
    it("provides specific explanations for PO actions", () => {
      expect(getRestrictionReason("create_purchase_order")).toContain("Owners");
      expect(getRestrictionReason("transition_purchase_order")).toContain("Owners");
      expect(getRestrictionReason("view_purchase_orders")).toContain("Owners");
    });

    it("provides specific explanations for product modifications", () => {
      expect(getRestrictionReason("create_product")).toContain("Owner");
      expect(getRestrictionReason("edit_product")).toContain("Owner");
    });

    it("provides specific explanations for supplier and user management", () => {
      expect(getRestrictionReason("manage_suppliers")).toContain("Owner");
      expect(getRestrictionReason("manage_users")).toContain("Owner");
    });
  });
});
