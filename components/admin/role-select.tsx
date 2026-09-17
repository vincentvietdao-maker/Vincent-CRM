"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/database.types";
import { roleLabels, userRoleValues } from "@/lib/validations/admin";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type UserRole = Database["public"]["Enums"]["user_role"];

export function RoleSelect({ id, role }: { id: string; role: UserRole }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleChange(value: string | null) {
    if (!value) return;
    setPending(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({ role: value as UserRole })
      .eq("id", id);
    setPending(false);

    if (!error) {
      router.refresh();
    }
  }

  return (
    <Select value={role} onValueChange={handleChange} disabled={pending}>
      <SelectTrigger className="w-40">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {userRoleValues.map((value) => (
          <SelectItem key={value} value={value}>
            {roleLabels[value]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
