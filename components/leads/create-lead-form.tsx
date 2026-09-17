"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { createClient } from "@/lib/supabase/client";
import { kenhLabels, kenhValues } from "@/lib/validations/admin";
import {
  createLeadSchema,
  danhGiaLabels,
  danhGiaValues,
  type CreateLeadInput,
} from "@/lib/validations/leads";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function CreateLeadForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CreateLeadInput>({
    resolver: zodResolver(createLeadSchema),
    defaultValues: { kenh: "chua_ro", danh_gia: "warm" },
  });

  async function onSubmit(values: CreateLeadInput) {
    setServerError(null);
    const supabase = createClient();

    const { data, error } = await supabase.rpc("create_lead_manual", {
      p_full_name: values.full_name,
      p_phone: values.phone ?? "",
      p_email: values.email ?? "",
      p_company_name: values.company_name ?? "",
      p_tax_code: values.tax_code ?? "",
      p_province: values.province ?? "",
      p_source: "nhap_tay",
      p_kenh: values.kenh,
      p_danh_gia: values.danh_gia,
      p_product_interest: values.product_interest ?? "",
      p_note: values.note ?? "",
      p_raw_data: values,
    });

    if (error) {
      setServerError(error.message);
      return;
    }

    router.push(`/leads/${data}`);
  }

  return (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle>Thêm lead thủ công</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">Họ tên</Label>
            <Input id="full_name" {...register("full_name")} />
            {errors.full_name && (
              <p className="text-sm text-destructive">
                {errors.full_name.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Số điện thoại</Label>
              <Input id="phone" {...register("phone")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register("email")} />
            </div>
          </div>
          {errors.phone && (
            <p className="text-sm text-destructive">{errors.phone.message}</p>
          )}

          <div className="space-y-2">
            <Label htmlFor="company_name">Tên công ty (nếu có)</Label>
            <Input id="company_name" {...register("company_name")} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tax_code">Mã số thuế</Label>
              <Input id="tax_code" {...register("tax_code")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="province">Tỉnh/thành</Label>
              <Input id="province" {...register("province")} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Kênh</Label>
              <Controller
                name="kenh"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {kenhValues.map((value) => (
                        <SelectItem key={value} value={value}>
                          {kenhLabels[value]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label>Đánh giá</Label>
              <Controller
                name="danh_gia"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {danhGiaValues.map((value) => (
                        <SelectItem key={value} value={value}>
                          {danhGiaLabels[value]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="product_interest">Sản phẩm quan tâm</Label>
            <Input id="product_interest" {...register("product_interest")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">Nhu cầu / ghi chú</Label>
            <Input id="note" {...register("note")} />
          </div>

          {serverError && (
            <p className="text-sm text-destructive">{serverError}</p>
          )}

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Đang lưu..." : "Tạo lead"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
