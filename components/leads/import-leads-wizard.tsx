"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import { kenhLabels, kenhValues } from "@/lib/validations/admin";
import {
  IMPORT_FIELDS,
  danhGiaLabels,
  danhGiaValues,
  importRowSchema,
  type ImportFieldKey,
} from "@/lib/validations/leads";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const NONE = "__none__";

type Step = "upload" | "map" | "preview" | "result";

type MappedRow = {
  rowIndex: number;
  data: Record<ImportFieldKey, string>;
  errors: string[];
};

type ImportResult = {
  rowIndex: number;
  success: boolean;
  fullName: string;
  error?: string;
};

export function ImportLeadsWizard() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("upload");
  const [loading, setLoading] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<Record<ImportFieldKey, string>>(
    {} as Record<ImportFieldKey, string>,
  );
  const [kenh, setKenh] = useState<(typeof kenhValues)[number]>("chua_ro");
  const [danhGia, setDanhGia] =
    useState<(typeof danhGiaValues)[number]>("warm");

  const [mappedRows, setMappedRows] = useState<MappedRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState<ImportResult[]>([]);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileError(null);
    setLoading(true);

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/leads/import/parse", {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setFileError(data.error ?? "Không đọc được file.");
      return;
    }

    setHeaders(data.headers);
    setRawRows(data.rows);

    const guessedMapping = {} as Record<ImportFieldKey, string>;
    for (const field of IMPORT_FIELDS) {
      const idx = (data.headers as string[]).findIndex((h) =>
        h.toLowerCase().includes(field.label.toLowerCase().slice(0, 3)),
      );
      guessedMapping[field.key] = idx >= 0 ? String(idx) : NONE;
    }
    setMapping(guessedMapping);
    setStep("map");
  }

  function goToPreview() {
    const requiredMissing = IMPORT_FIELDS.filter(
      (f) => f.required && mapping[f.key] === NONE,
    );
    if (requiredMissing.length > 0) {
      setFileError(
        `Cần ánh xạ cột: ${requiredMissing.map((f) => f.label).join(", ")}`,
      );
      return;
    }
    setFileError(null);

    const built: MappedRow[] = rawRows.map((row, i) => {
      const data = {} as Record<ImportFieldKey, string>;
      for (const field of IMPORT_FIELDS) {
        const colIdx = mapping[field.key];
        data[field.key] =
          colIdx !== undefined && colIdx !== NONE ? (row[Number(colIdx)] ?? "").trim() : "";
      }

      const parsed = importRowSchema.safeParse(data);
      const errors = parsed.success
        ? []
        : parsed.error.issues.map((issue) => issue.message);

      return { rowIndex: i, data, errors };
    });

    setMappedRows(built);
    setStep("preview");
  }

  async function runImport() {
    setImporting(true);
    const supabase = createClient();
    const validRows = mappedRows.filter((r) => r.errors.length === 0);
    const out: ImportResult[] = [];

    for (const row of validRows) {
      const { error } = await supabase.rpc("create_lead_manual", {
        p_full_name: row.data.full_name,
        p_phone: row.data.phone,
        p_email: row.data.email,
        p_company_name: row.data.company_name,
        p_tax_code: row.data.tax_code,
        p_province: row.data.province,
        p_source: "import_excel",
        p_kenh: kenh,
        p_danh_gia: danhGia,
        p_product_interest: row.data.product_interest,
        p_note: row.data.note,
        p_raw_data: row.data,
      });

      out.push({
        rowIndex: row.rowIndex,
        success: !error,
        fullName: row.data.full_name,
        error: error?.message,
      });
    }

    for (const row of mappedRows.filter((r) => r.errors.length > 0)) {
      out.push({
        rowIndex: row.rowIndex,
        success: false,
        fullName: row.data.full_name || "(trống)",
        error: row.errors.join("; "),
      });
    }

    out.sort((a, b) => a.rowIndex - b.rowIndex);
    setResults(out);
    setImporting(false);
    setStep("result");
  }

  const validCount = mappedRows.filter((r) => r.errors.length === 0).length;
  const invalidCount = mappedRows.length - validCount;

  return (
    <div className="space-y-4">
      {step === "upload" && (
        <Card className="max-w-lg">
          <CardHeader>
            <CardTitle>Bước 1: Chọn file</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              type="file"
              accept=".xlsx,.csv"
              onChange={handleFileChange}
              disabled={loading}
            />
            {loading && (
              <p className="text-sm text-muted-foreground">Đang đọc file...</p>
            )}
            {fileError && (
              <p className="text-sm text-destructive">{fileError}</p>
            )}
          </CardContent>
        </Card>
      )}

      {step === "map" && (
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Bước 2: Ánh xạ cột ({rawRows.length} dòng dữ liệu)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {IMPORT_FIELDS.map((field) => (
              <div key={field.key} className="grid grid-cols-2 items-center gap-4">
                <Label>
                  {field.label}
                  {field.required && <span className="text-destructive"> *</span>}
                </Label>
                <Select
                  value={mapping[field.key] ?? NONE}
                  onValueChange={(value) =>
                    setMapping((prev) => ({ ...prev, [field.key]: value ?? NONE }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>Không dùng</SelectItem>
                    {headers.map((h, idx) => (
                      <SelectItem key={idx} value={String(idx)}>
                        {h || `Cột ${idx + 1}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}

            <div className="grid grid-cols-2 gap-4 border-t pt-4">
              <div className="space-y-2">
                <Label>Kênh (áp dụng cho cả file)</Label>
                <Select
                  value={kenh}
                  onValueChange={(v) => v && setKenh(v as typeof kenh)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {kenhValues.map((value) => (
                      <SelectItem key={value} value={value}>
                        {kenhLabels[value]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Đánh giá (áp dụng cho cả file)</Label>
                <Select
                  value={danhGia}
                  onValueChange={(v) => v && setDanhGia(v as typeof danhGia)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {danhGiaValues.map((value) => (
                      <SelectItem key={value} value={value}>
                        {danhGiaLabels[value]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {fileError && (
              <p className="text-sm text-destructive">{fileError}</p>
            )}

            <Button onClick={goToPreview}>Xem trước</Button>
          </CardContent>
        </Card>
      )}

      {step === "preview" && (
        <Card>
          <CardHeader>
            <CardTitle>
              Bước 3: Xem trước — {validCount} dòng hợp lệ, {invalidCount} dòng lỗi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="max-h-[28rem] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Dòng</TableHead>
                    <TableHead>Họ tên</TableHead>
                    <TableHead>SĐT</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Công ty</TableHead>
                    <TableHead>Lỗi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mappedRows.map((row) => (
                    <TableRow key={row.rowIndex}>
                      <TableCell>{row.rowIndex + 2}</TableCell>
                      <TableCell>{row.data.full_name}</TableCell>
                      <TableCell>{row.data.phone}</TableCell>
                      <TableCell>{row.data.email}</TableCell>
                      <TableCell>{row.data.company_name}</TableCell>
                      <TableCell>
                        {row.errors.length > 0 && (
                          <Badge variant="destructive">
                            {row.errors.join("; ")}
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep("map")}>
                Quay lại
              </Button>
              <Button onClick={runImport} disabled={importing || validCount === 0}>
                {importing
                  ? "Đang nhập..."
                  : `Nhập ${validCount} lead hợp lệ`}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === "result" && (
        <Card>
          <CardHeader>
            <CardTitle>
              Hoàn tất: {results.filter((r) => r.success).length} thành công,{" "}
              {results.filter((r) => !r.success).length} lỗi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="max-h-[28rem] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Dòng</TableHead>
                    <TableHead>Họ tên</TableHead>
                    <TableHead>Kết quả</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((r) => (
                    <TableRow key={r.rowIndex}>
                      <TableCell>{r.rowIndex + 2}</TableCell>
                      <TableCell>{r.fullName}</TableCell>
                      <TableCell>
                        {r.success ? (
                          <Badge variant="secondary">Thành công</Badge>
                        ) : (
                          <Badge variant="destructive">{r.error}</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <Button onClick={() => router.push("/leads")}>
              Về danh sách lead
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
