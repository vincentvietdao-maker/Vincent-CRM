import { z } from "zod";

export const userRoleValues = [
  "admin",
  "quan_ly",
  "truong_nhom",
  "sale",
  "marketing",
] as const;

export const roleLabels: Record<(typeof userRoleValues)[number], string> = {
  admin: "Admin",
  quan_ly: "Quản lý",
  truong_nhom: "Trưởng nhóm",
  sale: "Sale",
  marketing: "Marketing",
};

export const createUserSchema = z.object({
  email: z.email("Email không hợp lệ"),
  password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự"),
  full_name: z.string().min(1, "Vui lòng nhập họ tên"),
  role: z.enum(userRoleValues),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

export const kenhValues = ["du_an", "thuong_mai", "chua_ro"] as const;

export const kenhLabels: Record<(typeof kenhValues)[number], string> = {
  du_an: "Dự án",
  thuong_mai: "Thương mại",
  chua_ro: "Chưa rõ",
};

export const createTeamSchema = z.object({
  name: z.string().min(1, "Vui lòng nhập tên nhóm"),
  kenh: z.enum(kenhValues),
});

export type CreateTeamInput = z.infer<typeof createTeamSchema>;
