/**
 * Recursively converts Prisma Decimal instances to standard JavaScript numbers
 * and normalizes nested dates for JSON serialization.
 */
export function serializeDecimals(value: unknown): unknown {
  if (value === null || value === undefined) {
    return value;
  }

  // Prisma Decimal duck-typing check (Decimal.js / Prisma Decimal)
  if (
    typeof value === "object" &&
    value !== null &&
    "toNumber" in value &&
    typeof (value as { toNumber: unknown }).toNumber === "function"
  ) {
    return (value as { toNumber: () => number }).toNumber();
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return value.map((item) => serializeDecimals(item));
  }

  if (typeof value === "object") {
    const transformed: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      transformed[key] = serializeDecimals(val);
    }
    return transformed;
  }

  return value;
}
