-- Sua RLS: cau hinh he thong (doi vai tro, tao/sua nhom) chi danh cho Admin,
-- khong danh cho Quan ly (theo CRM_SPEC.md muc 2.1: Admin = "cau hinh he thong",
-- Quan ly = "du lieu kinh doanh").

create or replace function public.prevent_self_privilege_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (new.role is distinct from old.role or new.is_active is distinct from old.is_active)
     and not public.is_admin() then
    raise exception 'Khong co quyen thay doi vai tro hoac trang thai tai khoan';
  end if;
  return new;
end;
$$;

drop policy if exists profiles_update_own_or_admin on public.profiles;
create policy profiles_update_own_or_admin
  on public.profiles for update
  to authenticated
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

drop policy if exists teams_write_admin on public.teams;
create policy teams_write_admin
  on public.teams for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists team_members_write_admin on public.team_members;
create policy team_members_write_admin
  on public.team_members for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
