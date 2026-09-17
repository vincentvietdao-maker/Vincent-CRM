import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ContactInfo } from "@/components/leads/contact-info";
import { kenhLabels } from "@/lib/validations/admin";
import { danhGiaLabels } from "@/lib/validations/leads";

export default async function LeadDetailPage({
  params,
}: PageProps<"/leads/[id]">) {
  const { id } = await params;
  const supabase = await createClient();

  const { data } = await supabase.rpc("get_lead_detail", { p_lead_id: id });
  const lead = data?.[0];

  if (!lead) {
    notFound();
  }

  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-xl font-semibold">{lead.contact_full_name}</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Thông tin liên hệ</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <ContactInfo
            leadId={lead.id}
            initialPhone={lead.contact_phone}
            initialEmail={lead.contact_email}
            masked={lead.contact_masked ?? false}
          />
          <p>Công ty: {lead.company_name ?? "—"}</p>
          {lead.company_tax_code && <p>MST: {lead.company_tax_code}</p>}
          {lead.company_province && (
            <p>Tỉnh/thành: {lead.company_province}</p>
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
          <p>Người phụ trách: {lead.owner_full_name ?? "Chưa gán"}</p>
          {lead.product_interest && (
            <p>Sản phẩm quan tâm: {lead.product_interest}</p>
          )}
          {lead.note && <p>Ghi chú: {lead.note}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
