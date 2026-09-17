import { createClient } from "@/lib/supabase/server";
import { CreateTeamDialog } from "@/components/admin/create-team-dialog";
import { TeamMembersManager } from "@/components/admin/team-members-manager";
import { kenhLabels } from "@/lib/validations/admin";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function AdminTeamsPage() {
  const supabase = await createClient();

  const [{ data: teams }, { data: allProfiles }, { data: members }] =
    await Promise.all([
      supabase.from("teams").select("id, name, kenh").order("created_at"),
      supabase
        .from("profiles")
        .select("id, full_name")
        .order("full_name"),
      supabase
        .from("team_members")
        .select("team_id, profile_id, is_leader, profiles(full_name)"),
    ]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Nhóm</h1>
        <CreateTeamDialog />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {teams?.map((team) => (
          <Card key={team.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-base">
                <span>{team.name}</span>
                <span className="text-sm font-normal text-muted-foreground">
                  {kenhLabels[team.kenh as keyof typeof kenhLabels]}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TeamMembersManager
                teamId={team.id}
                members={
                  members
                    ?.filter((m) => m.team_id === team.id)
                    .map((m) => ({
                      profileId: m.profile_id,
                      fullName: m.profiles?.full_name ?? "",
                      isLeader: m.is_leader,
                    })) ?? []
                }
                allProfiles={allProfiles ?? []}
              />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
