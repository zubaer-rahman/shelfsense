import { describe, it, expect } from "vitest";
import { getAllowedPOActions, canExecutePOAction, POAction } from "@/lib/po-status";
import { POStatus } from "@/types/domain";

describe("Purchase Order Status-to-Actions Mapping", () => {
  describe("Draft Status (DRAFT)", () => {
    const status: POStatus = "DRAFT";

    it("allows submitting order to supplier", () => {
      expect(canExecutePOAction(status, "SUBMIT_ORDER")).toBe(true);
    });

    it("allows cancelling order draft", () => {
      expect(canExecutePOAction(status, "CANCEL")).toBe(true);
    });

    it("allows printing order manifest", () => {
      expect(canExecutePOAction(status, "PRINT")).toBe(true);
    });

    it("disallows receiving a draft order", () => {
      expect(canExecutePOAction(status, "RECEIVE")).toBe(false);
    });

    it("returns exact allowed actions list", () => {
      expect(getAllowedPOActions(status)).toEqual(["SUBMIT_ORDER", "CANCEL", "PRINT"]);
    });
  });

  describe("Ordered Status (ORDERED)", () => {
    const status: POStatus = "ORDERED";

    it("allows receiving delivery and restock", () => {
      expect(canExecutePOAction(status, "RECEIVE")).toBe(true);
    });

    it("allows cancelling an in-transit order", () => {
      expect(canExecutePOAction(status, "CANCEL")).toBe(true);
    });

    it("allows printing order manifest", () => {
      expect(canExecutePOAction(status, "PRINT")).toBe(true);
    });

    it("disallows resubmitting an already ordered PO", () => {
      expect(canExecutePOAction(status, "SUBMIT_ORDER")).toBe(false);
    });

    it("returns exact allowed actions list", () => {
      expect(getAllowedPOActions(status)).toEqual(["RECEIVE", "CANCEL", "PRINT"]);
    });
  });

  describe("Received Terminal Status (RECEIVED)", () => {
    const status: POStatus = "RECEIVED";

    it("allows printing historical invoice", () => {
      expect(canExecutePOAction(status, "PRINT")).toBe(true);
    });

    it("disallows re-submitting, re-receiving, or cancelling received PO", () => {
      expect(canExecutePOAction(status, "SUBMIT_ORDER")).toBe(false);
      expect(canExecutePOAction(status, "RECEIVE")).toBe(false);
      expect(canExecutePOAction(status, "CANCEL")).toBe(false);
    });

    it("returns only PRINT action", () => {
      expect(getAllowedPOActions(status)).toEqual(["PRINT"]);
    });
  });

  describe("Cancelled Terminal Status (CANCELLED)", () => {
    const status: POStatus = "CANCELLED";

    it("allows printing historical record", () => {
      expect(canExecutePOAction(status, "PRINT")).toBe(true);
    });

    it("disallows workflow transitions on cancelled order", () => {
      expect(canExecutePOAction(status, "SUBMIT_ORDER")).toBe(false);
      expect(canExecutePOAction(status, "RECEIVE")).toBe(false);
      expect(canExecutePOAction(status, "CANCEL")).toBe(false);
    });

    it("returns only PRINT action", () => {
      expect(getAllowedPOActions(status)).toEqual(["PRINT"]);
    });
  });
});
