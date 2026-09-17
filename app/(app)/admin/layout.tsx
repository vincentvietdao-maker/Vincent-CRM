import Link from "next/link";
import { redirect } from "next/navigation";

import { requireAdminProfile } from "@/lib/supabase/require-admin";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, profile } = await requireAdminProfile();

  if (!user || profile?.role !== "admin") {
    redirect("/");
  }

  return (
    <div className="space-y-4">
      <nav className="flex gap-4 border-b pb-2 text-sm">
        <Link href="/admin/users" className="hover:underline">
          Người dùng
        </Link>
        <Link href="/admin/teams" className="hover:underline">
          Nhóm
        </Link>
      </nav>
      {children}
    </div>
  );
}
