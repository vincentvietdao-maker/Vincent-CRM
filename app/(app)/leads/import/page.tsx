import { ImportLeadsWizard } from "@/components/leads/import-leads-wizard";

export default function ImportLeadsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Import Excel/CSV</h1>
      <ImportLeadsWizard />
    </div>
  );
}
