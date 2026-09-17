# CLAUDE.md – Sale CRM

## Dự án
CRM nội bộ cho Marketing & Sales (bán bơm, PCCC; B2B dự án + thương mại/đại lý), 10–30 người dùng.
Đặc tả đầy đủ: **`docs/CRM_SPEC.md`** – luôn đọc mục liên quan trước khi làm. Không tự thêm tính năng ngoài SPEC.

Người phát triển là 1 người, kiến thức lập trình cơ bản:
- Giải thích ngắn gọn bằng **tiếng Việt**: đã làm gì, vì sao, cách kiểm tra.
- Làm **từng bước nhỏ**; hỏi lại khi SPEC chưa rõ, không tự đoán quy tắc nghiệp vụ.
- Trước khi chạy lệnh xoá dữ liệu, sửa CSDL hoặc cài gói mới: nói rõ lệnh sẽ làm gì.

## Công nghệ
- Next.js (App Router) + TypeScript (strict) + Tailwind CSS + shadcn/ui
- Supabase: PostgreSQL, Auth, Storage, Cron (pg_cron); thư viện `@supabase/ssr`
- Kiểm tra dữ liệu: zod · Form: react-hook-form · Test: Vitest (+ pgTAP/SQL test cho hàm CSDL)
- Hosting: Vercel (giai đoạn đầu), sau này chuyển hosting cPanel

## Quy tắc bắt buộc
1. **Không phụ thuộc Vercel:** `output: 'standalone'`; không dùng Vercel Cron/Blob/KV/Postgres/Edge Config/Edge runtime. Hẹn giờ → Supabase Cron. File → Supabase Storage.
2. **Phân quyền ở CSDL:** mọi bảng bật Row Level Security. Không dùng `service_role` key ở phía trình duyệt; chỉ dùng trong server (webhook, cron) và ghi chú rõ lý do.
3. **Logic quan trọng nằm trong hàm PostgreSQL chạy trong giao dịch:** chia lead, nhận/từ chối/hết hạn lead, chống trùng, hợp nhất, duyệt chiết khấu. Dùng khoá dòng và cập nhật có điều kiện (SPEC mục 5.5).
4. **Thay đổi CSDL chỉ qua migration** trong `supabase/migrations/` (Supabase CLI). Không sửa tay trên giao diện Supabase.
5. **Tiền:** kiểu `numeric`, VNĐ số nguyên, làm tròn theo SPEC mục 7.4. Không dùng float.
6. **Thời gian:** lưu `timestamptz` (UTC); hiển thị giờ Việt Nam (Asia/Ho_Chi_Minh).
7. **Khoá bí mật** chỉ trong `.env.local` (đã có trong `.gitignore`) và biến môi trường Vercel. Không in khoá ra log hay đưa vào code.
8. **Xoá mềm** (`deleted_at`) cho dữ liệu kinh doanh; ghi **audit log** cho thao tác nhạy cảm (SPEC mục 12).
9. Viết **test trước** cho: chia lead (5.2–5.8), chống trùng (4.1–4.2), tính tiền báo giá (7.2–7.4).

## Quy ước đặt tên
- Code, tên bảng, cột, biến: **tiếng Anh**, `snake_case` cho CSDL, `camelCase` cho TypeScript.
- Giao diện, thông báo lỗi: **tiếng Việt**.
- Bảng chính (dự kiến): `profiles, teams, team_members, companies, contacts, leads, lead_submissions, lead_offers, pipelines, pipeline_stages, deals, activities, tasks, tags, products, quotes, quote_items, orders, payments, notifications, webhook_events, audit_logs, settings`.

## Cấu trúc thư mục
```
app/                 # trang và API routes
  (auth)/            # đăng nhập
  (app)/             # màn hình sau đăng nhập
  api/webhooks/      # Facebook, Zalo, form
components/          # UI dùng chung (shadcn trong components/ui)
lib/                 # supabase client, tiện ích, zod schema
supabase/migrations/ # file SQL migration
supabase/tests/      # test SQL
docs/                # CRM_SPEC.md và ghi chú
```

## Lệnh thường dùng
```
npm run dev                  # chạy thử tại http://localhost:3000
npm run build                # kiểm tra build trước khi đẩy lên
npm run lint
npm test
npx supabase migration new <ten>   # tạo migration mới
npx supabase db push               # áp migration lên Supabase (dự án đang link)
npx supabase gen types typescript --linked > lib/database.types.ts
```

## Quy trình mỗi bước
1. Đọc mục SPEC liên quan → nêu kế hoạch ngắn → chờ đồng ý.
2. Làm → chạy `npm run lint`, `npm test`, `npm run build`.
3. Hướng dẫn người dùng kiểm tra trên trình duyệt.
4. Cập nhật mục "Tiến độ" bên dưới → đề xuất nội dung commit.

## Tiến độ (SPEC mục 15)
- [x] Bước 0 – Khởi tạo dự án, GitHub, Supabase, Vercel
- [x] Bước 1 – Đăng nhập, người dùng, vai trò, nhóm, kênh (còn thiếu: quản lý phiên/đăng xuất từ xa, để sau)
- [x] Bước 2 – Khách hàng, lead, chuẩn hoá, nhập tay, import Excel (chưa có chống trùng — để Bước 4)
- [ ] Bước 3 – RLS, che thông tin, audit log
- [ ] Bước 4 – Chống trùng, hợp nhất/tách
- [ ] Bước 5 – Lịch làm việc, chia lead
- [ ] Bước 6 – Pipeline, cơ hội, hoạt động
- [ ] Bước 7 – Việc, nhắc, tìm kiếm, bộ lọc → **MVP**

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
