import { z } from "zod";

import { kenhValues } from "@/lib/validations/admin";

export const danhGiaValues = ["hot", "warm", "cool"] as const;

export const danhGiaLabels: Record<(typeof danhGiaValues)[number], string> = {
  hot: "Hot",
  warm: "Warm",
  cool: "Cool",
};

export const createLeadSchema = z
  .object({
    full_name: z.string().min(1, "Vui lòng nhập họ tên"),
    phone: z.string().optional(),
    email: z.union([z.email("Email không hợp lệ"), z.literal("")]).optional(),
    company_name: z.string().optional(),
    tax_code: z.string().optional(),
    province: z.string().optional(),
    kenh: z.enum(kenhValues),
    danh_gia: z.enum(danhGiaValues),
    product_interest: z.string().optional(),
    note: z.string().optional(),
  })
  .refine((data) => (data.phone && data.phone.trim()) || (data.email && data.email.trim()), {
    message: "Cần nhập ít nhất số điện thoại hoặc email",
    path: ["phone"],
  });

export type CreateLeadInput = z.infer<typeof createLeadSchema>;
