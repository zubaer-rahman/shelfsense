import { z } from "zod";

export const createStockMovementSchema = z
  .object({
    productId: z.string().min(1, "Please select a product"),
    type: z.enum(["SALE", "STOCK_IN", "ADJUSTMENT"], {
      message: "Please select a valid movement type",
    }),
    quantity: z.coerce
      .number()
      .int("Quantity must be a whole number")
      .min(1, "Quantity must be at least 1"),
    direction: z.enum(["INCREASE", "DECREASE"]).optional(),
    note: z.string().max(255, "Note must be 255 characters or fewer").optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type === "ADJUSTMENT" && !data.direction) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["direction"],
        message: "Adjustment direction (Increase or Decrease) is required",
      });
    }
  });

export type CreateStockMovementFormData = z.infer<typeof createStockMovementSchema>;
