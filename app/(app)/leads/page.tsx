import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { kenhLabels } from "@/lib/validations/admin";
import { danhGiaLabels } from "@/lib/validations/leads";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function LeadsPage() {
  const supabase = await createClient();

  const { data: leads } = await supabase
    .from("leads")
    .select(
      "id, kenh, danh_gia, source, created_at, contacts(full_name, phone, email), companies(name)",
    )
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Lead</h1>
        <Button render={<Link href="/leads/new">Thêm lead</Link>} />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Họ tên</TableHead>
            <TableHead>Liên hệ</TableHead>
            <TableHead>Công ty</TableHead>
            <TableHead>Kênh</TableHead>
            <TableHead>Đánh giá</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads?.map((lead) => (
            <TableRow key={lead.id}>
              <TableCell>
                <Link href={`/leads/${lead.id}`} className="hover:underline">
                  {lead.contacts?.full_name}
                </Link>
              </TableCell>
              <TableCell>
                {lead.contacts?.phone || lead.contacts?.email || "—"}
              </TableCell>
              <TableCell>{lead.companies?.name ?? "—"}</TableCell>
              <TableCell>{kenhLabels[lead.kenh as keyof typeof kenhLabels]}</TableCell>
              <TableCell>
                <Badge variant="secondary">
                  {danhGiaLabels[lead.danh_gia as keyof typeof danhGiaLabels]}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
          {leads?.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                Chưa có lead nào
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
