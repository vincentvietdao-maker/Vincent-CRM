import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "@/components/logout-button";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b px-4 py-3">
        <span className="font-semibold">Sale CRM</span>
        <div className="flex items-center gap-3 text-sm">
          {profile?.role === "admin" && (
            <Link href="/admin/users" className="hover:underline">
              Quản trị
            </Link>
          )}
          <span>
            {profile?.full_name ?? user.email} · {profile?.role ?? ""}
          </span>
          <LogoutButton />
        </div>
      </header>
      <main className="flex-1 p-4">{children}</main>
    </div>
  );
}
