import { z } from "zod";

export const supplierSchema = z.object({
  name: z.string().min(1, "Company name is required").max(100, "Name too long"),
  phone: z.string().max(30, "Phone number too long").optional().or(z.literal("")),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
});

export type SupplierFormData = z.infer<typeof supplierSchema>;
