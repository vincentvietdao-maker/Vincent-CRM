import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { loginSchema } from "@/lib/validations/auth";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dữ liệu không hợp lệ." },
      { status: 400 },
    );
  }

  const email = parsed.data.email.toLowerCase().trim();
  const { password } = parsed.data;

  const supabase = await createClient();

  const { data: isLocked } = await supabase.rpc("check_login_lockout", {
    p_email: email,
  });

  if (isLocked) {
    return NextResponse.json(
      {
        error:
          "Tài khoản tạm khoá do đăng nhập sai quá 5 lần. Vui lòng thử lại sau 15 phút.",
      },
      { status: 423 },
    );
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  const userAgent = request.headers.get("user-agent") ?? "unknown";

  const { data: signInData, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  await supabase.from("login_logs").insert({
    email,
    profile_id: signInData?.user?.id ?? null,
    success: !error,
    ip,
    user_agent: userAgent,
  });

  if (error) {
    return NextResponse.json(
      { error: "Email hoặc mật khẩu không đúng." },
      { status: 401 },
    );
  }

  return NextResponse.json({ success: true });
}
