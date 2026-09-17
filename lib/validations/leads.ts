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

export const IMPORT_FIELDS = [
  { key: "full_name", label: "Họ tên", required: true },
  { key: "phone", label: "Số điện thoại", required: false },
  { key: "email", label: "Email", required: false },
  { key: "company_name", label: "Tên công ty", required: false },
  { key: "tax_code", label: "Mã số thuế", required: false },
  { key: "province", label: "Tỉnh/thành", required: false },
  { key: "product_interest", label: "Sản phẩm quan tâm", required: false },
  { key: "note", label: "Ghi chú", required: false },
] as const;

export type ImportFieldKey = (typeof IMPORT_FIELDS)[number]["key"];

export const importRowSchema = z
  .object({
    full_name: z.string().min(1, "Thiếu họ tên"),
    phone: z.string().optional(),
    email: z.union([z.email("Email không hợp lệ"), z.literal("")]).optional(),
    company_name: z.string().optional(),
    tax_code: z.string().optional(),
    province: z.string().optional(),
    product_interest: z.string().optional(),
    note: z.string().optional(),
  })
  .refine(
    (data) => (data.phone && data.phone.trim()) || (data.email && data.email.trim()),
    { message: "Thiếu số điện thoại hoặc email", path: ["phone"] },
  );
