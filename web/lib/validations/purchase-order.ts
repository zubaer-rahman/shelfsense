import { z } from "zod";

export const createPurchaseOrderItemSchema = z.object({
  productId: z.string().min(1, "Please select a product"),
  quantity: z.coerce
    .number()
    .int("Quantity must be a whole number")
    .min(1, "Quantity must be at least 1"),
  unitCost: z.coerce
    .number()
    .min(0, "Unit cost cannot be negative"),
});

export const createPurchaseOrderSchema = z.object({
  supplierId: z.string().min(1, "Please select a supplying partner"),
  items: z
    .array(createPurchaseOrderItemSchema)
    .min(1, "At least one product line item is required"),
});

export type CreatePurchaseOrderFormData = z.infer<typeof createPurchaseOrderSchema>;
export type CreatePurchaseOrderItemFormData = z.infer<typeof createPurchaseOrderItemSchema>;
