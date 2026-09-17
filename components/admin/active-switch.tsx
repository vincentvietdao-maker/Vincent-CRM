"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import { Switch } from "@/components/ui/switch";

export function ActiveSwitch({
  id,
  isActive,
}: {
  id: string;
  isActive: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleChange(checked: boolean) {
    setPending(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({ is_active: checked })
      .eq("id", id);
    setPending(false);

    if (!error) {
      router.refresh();
    }
  }

  return (
    <Switch checked={isActive} onCheckedChange={handleChange} disabled={pending} />
  );
}
