import { redirect } from "next/navigation";

import { requireAdminProfile } from "@/lib/supabase/require-admin";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const ACTION_LABELS: Record<string, string> = {
  doi_vai_tro: "Đổi vai trò",
  doi_trang_thai_tai_khoan: "Đổi trạng thái tài khoản",
  xoa_mem: "Xoá (thùng rác)",
  khoi_phuc: "Khôi phục",
  xem_sdt_day_du: "Xem SĐT/email đầy đủ",
};

export default async function AuditLogsPage() {
  const { supabase, profile } = await requireAdminProfile();

  if (!profile || !["admin", "quan_ly"].includes(profile.role)) {
    redirect("/");
  }

  const { data: logs } = await supabase
    .from("audit_logs")
    .select("id, action, target_table, target_id, metadata, created_at, profiles(full_name)")
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Nhật ký thao tác</h1>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Thời điểm</TableHead>
            <TableHead>Người thực hiện</TableHead>
            <TableHead>Hành động</TableHead>
            <TableHead>Đối tượng</TableHead>
            <TableHead>Chi tiết</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs?.map((log) => (
            <TableRow key={log.id}>
              <TableCell>
                {new Date(log.created_at).toLocaleString("vi-VN")}
              </TableCell>
              <TableCell>{log.profiles?.full_name ?? "—"}</TableCell>
              <TableCell>{ACTION_LABELS[log.action] ?? log.action}</TableCell>
              <TableCell>
                {log.target_table} / {log.target_id.slice(0, 8)}
              </TableCell>
              <TableCell className="max-w-xs truncate text-muted-foreground">
                {log.metadata ? JSON.stringify(log.metadata) : ""}
              </TableCell>
            </TableRow>
          ))}
          {logs?.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                Chưa có nhật ký nào
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
