"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Member = {
  profileId: string;
  fullName: string;
  isLeader: boolean;
};

type Profile = {
  id: string;
  full_name: string;
};

export function TeamMembersManager({
  teamId,
  members,
  allProfiles,
}: {
  teamId: string;
  members: Member[];
  allProfiles: Profile[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<string>("");
  const [pending, setPending] = useState(false);

  const memberIds = new Set(members.map((m) => m.profileId));
  const candidates = allProfiles.filter((p) => !memberIds.has(p.id));

  async function addMember() {
    if (!selected) return;
    setPending(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("team_members")
      .insert({ team_id: teamId, profile_id: selected });
    setPending(false);

    if (!error) {
      setSelected("");
      router.refresh();
    }
  }

  async function removeMember(profileId: string) {
    setPending(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("team_members")
      .delete()
      .eq("team_id", teamId)
      .eq("profile_id", profileId);
    setPending(false);

    if (!error) {
      router.refresh();
    }
  }

  async function toggleLeader(profileId: string, isLeader: boolean) {
    setPending(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("team_members")
      .update({ is_leader: !isLeader })
      .eq("team_id", teamId)
      .eq("profile_id", profileId);
    setPending(false);

    if (!error) {
      router.refresh();
    }
  }

  return (
    <div className="space-y-3">
      <ul className="space-y-2">
        {members.map((m) => (
          <li
            key={m.profileId}
            className="flex items-center justify-between text-sm"
          >
            <span className="flex items-center gap-2">
              {m.fullName}
              {m.isLeader && <Badge variant="secondary">Trưởng nhóm</Badge>}
            </span>
            <span className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pending}
                onClick={() => toggleLeader(m.profileId, m.isLeader)}
              >
                {m.isLeader ? "Bỏ trưởng nhóm" : "Đặt trưởng nhóm"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={pending}
                onClick={() => removeMember(m.profileId)}
              >
                Xoá
              </Button>
            </span>
          </li>
        ))}
        {members.length === 0 && (
          <li className="text-sm text-muted-foreground">Chưa có thành viên</li>
        )}
      </ul>

      <div className="flex gap-2">
        <Select
          value={selected}
          onValueChange={(value) => setSelected(value ?? "")}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Chọn người để thêm" />
          </SelectTrigger>
          <SelectContent>
            {candidates.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.full_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button disabled={!selected || pending} onClick={addMember}>
          Thêm
        </Button>
      </div>
    </div>
  );
}
