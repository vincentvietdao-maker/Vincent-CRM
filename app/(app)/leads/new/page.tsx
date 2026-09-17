import { CreateLeadForm } from "@/components/leads/create-lead-form";

export default function NewLeadPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Thêm lead</h1>
      <CreateLeadForm />
    </div>
  );
}
