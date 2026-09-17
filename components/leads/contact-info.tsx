"use client";

import { useState } from "react";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function ContactInfo({
  leadId,
  initialPhone,
  initialEmail,
  masked,
}: {
  leadId: string;
  initialPhone: string | null;
  initialEmail: string | null;
  masked: boolean;
}) {
  const [phone, setPhone] = useState(initialPhone);
  const [email, setEmail] = useState(initialEmail);
  const [revealed, setRevealed] = useState(!masked);
  const [loading, setLoading] = useState(false);

  async function reveal() {
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase.rpc("reveal_contact_full", {
      p_lead_id: leadId,
    });
    setLoading(false);

    if (!error && data && data[0]) {
      setPhone(data[0].phone);
      setEmail(data[0].email);
      setRevealed(true);
    }
  }

  return (
    <div className="space-y-1">
      <p>SĐT: {phone ?? "—"}</p>
      <p>Email: {email ?? "—"}</p>
      {!revealed && (
        <Button variant="outline" size="sm" onClick={reveal} disabled={loading}>
          {loading ? "Đang tải..." : "Xem đầy đủ"}
        </Button>
      )}
    </div>
  );
}
