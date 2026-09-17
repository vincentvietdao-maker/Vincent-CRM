import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { kenhLabels } from "@/lib/validations/admin";
import { danhGiaLabels } from "@/lib/validations/leads";

export default async function LeadDetailPage({
  params,
}: PageProps<"/leads/[id]">) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: lead } = await supabase
    .from("leads")
    .select(
      "id, kenh, danh_gia, source, note, product_interest, created_at, contacts(full_name, phone, email), companies(name, tax_code, province), profiles!leads_owner_id_fkey(full_name)",
    )
    .eq("id", id)
    .maybeSingle();

  if (!lead) {
    notFound();
  }

  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-xl font-semibold">{lead.contacts?.full_name}</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Thông tin liên hệ</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <p>SĐT: {lead.contacts?.phone ?? "—"}</p>
          <p>Email: {lead.contacts?.email ?? "—"}</p>
          <p>Công ty: {lead.companies?.name ?? "—"}</p>
          {lead.companies?.tax_code && <p>MST: {lead.companies.tax_code}</p>}
          {lead.companies?.province && (
            <p>Tỉnh/thành: {lead.companies.province}</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Thông tin lead</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex gap-2">
            <Badge variant="secondary">
              {kenhLabels[lead.kenh as keyof typeof kenhLabels]}
            </Badge>
            <Badge variant="secondary">
              {danhGiaLabels[lead.danh_gia as keyof typeof danhGiaLabels]}
            </Badge>
          </div>
          <p>Nguồn: {lead.source}</p>
          <p>Người phụ trách: {lead.profiles?.full_name ?? "Chưa gán"}</p>
          {lead.product_interest && (
            <p>Sản phẩm quan tâm: {lead.product_interest}</p>
          )}
          {lead.note && <p>Ghi chú: {lead.note}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
