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

  const { data: leads } = await supabase.rpc("list_leads");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Lead</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            render={<Link href="/leads/import">Import Excel</Link>}
            nativeButton={false}
          />
          <Button
            render={<Link href="/leads/new">Thêm lead</Link>}
            nativeButton={false}
          />
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Họ tên</TableHead>
            <TableHead>Liên hệ</TableHead>
            <TableHead>Công ty</TableHead>
            <TableHead>Kênh</TableHead>
            <TableHead>Đánh giá</TableHead>
            <TableHead>Trạng thái</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads?.map((lead) => (
            <TableRow key={lead.id}>
              <TableCell>
                <Link href={`/leads/${lead.id}`} className="hover:underline">
                  {lead.contact_full_name}
                </Link>
              </TableCell>
              <TableCell>
                {lead.contact_phone || lead.contact_email || "—"}
              </TableCell>
              <TableCell>{lead.company_name ?? "—"}</TableCell>
              <TableCell>{kenhLabels[lead.kenh as keyof typeof kenhLabels]}</TableCell>
              <TableCell>
                <Badge variant="secondary">
                  {danhGiaLabels[lead.danh_gia as keyof typeof danhGiaLabels]}
                </Badge>
              </TableCell>
              <TableCell>
                {lead.status === "cho_xac_nhan_trung" ? (
                  <Badge variant="destructive">Chờ xác nhận trùng</Badge>
                ) : (
                  "Mới"
                )}
              </TableCell>
            </TableRow>
          ))}
          {leads?.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground">
                Chưa có lead nào
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
