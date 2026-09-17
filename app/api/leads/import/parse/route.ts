import { Readable } from "node:stream";

import ExcelJS from "exceljs";
import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

function cellToString(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toLocaleDateString("vi-VN");
  if (typeof value === "object") {
    if ("text" in value) return String((value as { text: unknown }).text);
    if ("result" in value)
      return String((value as { result: unknown }).result);
    return "";
  }
  return String(value).trim();
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Bạn cần đăng nhập." },
      { status: 401 },
    );
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Thiếu file." }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "File quá lớn (tối đa 5MB)." },
      { status: 400 },
    );
  }

  const isCsv = file.name.toLowerCase().endsWith(".csv");
  const buffer = Buffer.from(await file.arrayBuffer());
  const workbook = new ExcelJS.Workbook();

  try {
    if (isCsv) {
      await workbook.csv.read(Readable.from(buffer));
    } else {
      // exceljs tu khai bao "interface Buffer extends ArrayBuffer {}" trong index.d.ts,
      // xung dot voi kieu Buffer generic cua @types/node moi -> ep kieu qua any.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await workbook.xlsx.load(buffer as any);
    }
  } catch {
    return NextResponse.json(
      { error: "Không đọc được file. Hãy dùng định dạng .xlsx hoặc .csv." },
      { status: 400 },
    );
  }

  const worksheet = workbook.worksheets[0];

  if (!worksheet) {
    return NextResponse.json(
      { error: "File không có dữ liệu." },
      { status: 400 },
    );
  }

  const rows: string[][] = [];
  worksheet.eachRow((row) => {
    const values = (row.values as unknown[])
      .slice(1)
      .map((value) => cellToString(value));
    rows.push(values);
  });

  if (rows.length < 2) {
    return NextResponse.json(
      { error: "File cần có dòng tiêu đề và ít nhất 1 dòng dữ liệu." },
      { status: 400 },
    );
  }

  const [headers, ...dataRows] = rows;

  return NextResponse.json({ headers, rows: dataRows });
}
