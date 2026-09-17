import { NextResponse } from "next/server";

import { requireAdminProfile } from "@/lib/supabase/require-admin";
import { createServiceClient } from "@/lib/supabase/service";
import { createUserSchema } from "@/lib/validations/admin";

export async function POST(request: Request) {
  const { user, profile } = await requireAdminProfile();

  if (!user || profile?.role !== "admin") {
    return NextResponse.json(
      { error: "Bạn không có quyền thực hiện thao tác này." },
      { status: 403 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = createUserSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dữ liệu không hợp lệ." },
      { status: 400 },
    );
  }

  const { email, password, full_name, role } = parsed.data;

  const service = createServiceClient();
  const { error } = await service.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name, role },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
