import { describe, it, expect } from "vitest";
import {
  formatCurrency,
  formatNumber,
  formatSignedQuantity,
  formatDate,
  formatDateTime,
} from "@/lib/format";

describe("Formatting Helpers", () => {
  describe("formatCurrency", () => {
    it("formats standard positive numbers to currency string", () => {
      expect(formatCurrency(1234.5)).toBe("$1,234.50");
      expect(formatCurrency(99.99)).toBe("$99.99");
      expect(formatCurrency(0)).toBe("$0.00");
    });

    it("parses numeric strings correctly", () => {
      expect(formatCurrency("49.95")).toBe("$49.95");
      expect(formatCurrency("1000")).toBe("$1,000.00");
    });

    it("handles null, undefined, or NaN gracefully", () => {
      expect(formatCurrency(null)).toBe("$0.00");
      expect(formatCurrency(undefined)).toBe("$0.00");
      expect(formatCurrency("not-a-number")).toBe("$0.00");
    });

    it("supports custom currency codes", () => {
      const gbp = formatCurrency(100, "GBP");
      expect(gbp).toContain("100.00");
    });
  });

  describe("formatNumber", () => {
    it("formats integers with thousand separators", () => {
      expect(formatNumber(12500)).toBe("12,500");
      expect(formatNumber(1000000)).toBe("1,000,000");
      expect(formatNumber(42)).toBe("42");
    });

    it("handles null and undefined with fallback to 0", () => {
      expect(formatNumber(null)).toBe("0");
      expect(formatNumber(undefined)).toBe("0");
    });
  });

  describe("formatSignedQuantity", () => {
    it("prefixes positive quantities with + sign", () => {
      expect(formatSignedQuantity(25)).toBe("+25");
      expect(formatSignedQuantity(1)).toBe("+1");
    });

    it("formats negative quantities with - sign without extra +", () => {
      expect(formatSignedQuantity(-10)).toBe("-10");
      expect(formatSignedQuantity(-500)).toBe("-500");
    });

    it("formats zero without sign", () => {
      expect(formatSignedQuantity(0)).toBe("0");
    });
  });

  describe("formatDate and formatDateTime", () => {
    it("returns em-dash for null or undefined dates", () => {
      expect(formatDate(null)).toBe("—");
      expect(formatDate(undefined)).toBe("—");
      expect(formatDateTime(null)).toBe("—");
      expect(formatDateTime(undefined)).toBe("—");
    });

    it("formats valid date strings without throwing", () => {
      const formatted = formatDate("2026-10-17T00:00:00.000Z");
      expect(formatted).not.toBe("—");
      expect(typeof formatted).toBe("string");
    });

    it("formats invalid date strings to fallback em-dash", () => {
      expect(formatDate("invalid-date-string")).toBe("—");
      expect(formatDateTime("invalid-date-string")).toBe("—");
    });
  });
});
