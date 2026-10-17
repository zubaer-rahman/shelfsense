import { describe, it, expect } from "vitest";
import { createStockMovementSchema } from "@/lib/validations/stock-movement";

describe("Stock Movement Form Schema Validation", () => {
  describe("Valid Movement Payloads", () => {
    it("validates a SALE movement with positive quantity", () => {
      const payload = {
        productId: "prod-101",
        type: "SALE",
        quantity: 5,
        note: "Customer walk-in sale",
      };

      const result = createStockMovementSchema.safeParse(payload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.quantity).toBe(5);
        expect(result.data.type).toBe("SALE");
      }
    });

    it("validates a STOCK_IN movement without direction", () => {
      const payload = {
        productId: "prod-102",
        type: "STOCK_IN",
        quantity: 50,
      };

      const result = createStockMovementSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it("validates an ADJUSTMENT with INCREASE direction", () => {
      const payload = {
        productId: "prod-103",
        type: "ADJUSTMENT",
        quantity: 10,
        direction: "INCREASE",
        note: "Shelf recount surplus",
      };

      const result = createStockMovementSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it("validates an ADJUSTMENT with DECREASE direction", () => {
      const payload = {
        productId: "prod-104",
        type: "ADJUSTMENT",
        quantity: 3,
        direction: "DECREASE",
        note: "Damaged box write-off",
      };

      const result = createStockMovementSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it("coerces string quantity to a number", () => {
      const payload = {
        productId: "prod-105",
        type: "SALE",
        quantity: "12",
      };

      const result = createStockMovementSchema.safeParse(payload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.quantity).toBe(12);
      }
    });
  });

  describe("Direction Domain Rules", () => {
    it("fails when ADJUSTMENT is missing direction", () => {
      const payload = {
        productId: "prod-106",
        type: "ADJUSTMENT",
        quantity: 4,
      };

      const result = createStockMovementSchema.safeParse(payload);
      expect(result.success).toBe(false);
      if (!result.success) {
        const directionError = result.error.issues.find((i) => i.path.includes("direction"));
        expect(directionError).toBeDefined();
        expect(directionError?.message).toContain("Adjustment direction");
      }
    });
  });

  describe("Quantity and Field Constraints", () => {
    it("fails on zero quantity", () => {
      const payload = {
        productId: "prod-107",
        type: "SALE",
        quantity: 0,
      };

      const result = createStockMovementSchema.safeParse(payload);
      expect(result.success).toBe(false);
      if (!result.success) {
        const qtyError = result.error.issues.find((i) => i.path.includes("quantity"));
        expect(qtyError?.message).toContain("at least 1");
      }
    });

    it("fails on negative quantity", () => {
      const payload = {
        productId: "prod-108",
        type: "SALE",
        quantity: -5,
      };

      const result = createStockMovementSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it("fails on non-integer float quantity", () => {
      const payload = {
        productId: "prod-109",
        type: "SALE",
        quantity: 3.5,
      };

      const result = createStockMovementSchema.safeParse(payload);
      expect(result.success).toBe(false);
      if (!result.success) {
        const qtyError = result.error.issues.find((i) => i.path.includes("quantity"));
        expect(qtyError?.message).toContain("whole number");
      }
    });

    it("fails on empty productId", () => {
      const payload = {
        productId: "",
        type: "SALE",
        quantity: 1,
      };

      const result = createStockMovementSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it("fails on note exceeding 255 characters", () => {
      const payload = {
        productId: "prod-110",
        type: "SALE",
        quantity: 1,
        note: "a".repeat(256),
      };

      const result = createStockMovementSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });
  });
});
