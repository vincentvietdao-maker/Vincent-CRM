import { createClient } from "@/lib/supabase/server";
import { AddUserDialog } from "@/components/admin/add-user-dialog";
import { RoleSelect } from "@/components/admin/role-select";
import { ActiveSwitch } from "@/components/admin/active-switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function AdminUsersPage() {
  const supabase = await createClient();

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, is_active")
    .order("created_at", { ascending: true });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Người dùng</h1>
        <AddUserDialog />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Họ tên</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Vai trò</TableHead>
            <TableHead>Trạng thái</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {profiles?.map((p) => (
            <TableRow key={p.id}>
              <TableCell>{p.full_name}</TableCell>
              <TableCell>{p.email}</TableCell>
              <TableCell>
                <RoleSelect id={p.id} role={p.role} />
              </TableCell>
              <TableCell>
                <ActiveSwitch id={p.id} isActive={p.is_active} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
