import { z } from "zod";

export const productSchema = z.object({
  name: z.string().min(1, "Product name is required").max(150, "Name too long"),
  sku: z.string().min(1, "SKU is required").max(50, "SKU too long"),
  category: z.string().min(1, "Category is required"),
  unitPrice: z.coerce.number().min(0, "Unit price must be non-negative"),
  quantity: z.coerce.number().int().min(0, "Quantity must be 0 or greater"),
  reorderLevel: z.coerce.number().int().min(0, "Reorder level must be 0 or greater"),
  expiryDate: z.string().optional().nullable(),
  supplierId: z.string().uuid("Please select a valid supplier"),
});

export type ProductFormInput = z.input<typeof productSchema>;
export type ProductFormData = z.output<typeof productSchema>;
