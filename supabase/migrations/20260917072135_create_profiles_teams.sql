-- Buoc 1a: profiles, teams, team_members + RLS
-- Theo CRM_SPEC.md muc 2 (vai tro & phan quyen) va muc 3 (kenh: du_an/thuong_mai/chua_ro)

create type public.user_role as enum (
  'admin',
  'quan_ly',
  'truong_nhom',
  'sale',
  'marketing'
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text not null,
  phone text,
  role public.user_role not null default 'sale',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'Ho so nguoi dung, gan voi auth.users theo id';

create table public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kenh text not null check (kenh in ('du_an', 'thuong_mai', 'chua_ro')),
  created_at timestamptz not null default now()
);

comment on table public.teams is 'Nhom ban hang, gan voi 1 kenh (du_an/thuong_mai/chua_ro)';

create table public.team_members (
  team_id uuid not null references public.teams (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  is_leader boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (team_id, profile_id)
);

comment on table public.team_members is 'Mot nguoi co the thuoc nhieu nhom';

-- Tu dong cap nhat updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row
  execute function public.set_updated_at();

-- Tu dong tao profile khi co tai khoan auth.users moi
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    coalesce((new.raw_user_meta_data ->> 'role')::public.user_role, 'sale')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- Ham helper kiem tra vai tro, dung security definer de tranh RLS de quy tren profiles
create or replace function public.current_user_role()
returns public.user_role
language sql
security definer
stable
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin_or_manager()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select public.current_user_role() in ('admin', 'quan_ly');
$$;

-- Ngan nguoi dung tu doi vai tro/trang thai cua chinh minh (chi admin/quan_ly duoc doi)
create or replace function public.prevent_self_privilege_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (new.role is distinct from old.role or new.is_active is distinct from old.is_active)
     and not public.is_admin_or_manager() then
    raise exception 'Khong co quyen thay doi vai tro hoac trang thai tai khoan';
  end if;
  return new;
end;
$$;

create trigger profiles_prevent_privilege_escalation
  before update on public.profiles
  for each row
  execute function public.prevent_self_privilege_escalation();

-- RLS
alter table public.profiles enable row level security;
alter table public.teams enable row level security;
alter table public.team_members enable row level security;

-- profiles: ai dang nhap cung xem duoc danh sach dong nghiep (can cho giao viec/phan cong)
create policy profiles_select_authenticated
  on public.profiles for select
  to authenticated
  using (true);

-- profiles: tu sua ho so cua minh, hoac admin/quan_ly sua bat ky ai
create policy profiles_update_own_or_admin
  on public.profiles for update
  to authenticated
  using (id = auth.uid() or public.is_admin_or_manager())
  with check (id = auth.uid() or public.is_admin_or_manager());

-- teams: ai dang nhap cung xem duoc danh sach nhom
create policy teams_select_authenticated
  on public.teams for select
  to authenticated
  using (true);

-- teams: chi admin/quan_ly duoc tao/sua/xoa nhom
create policy teams_write_admin
  on public.teams for all
  to authenticated
  using (public.is_admin_or_manager())
  with check (public.is_admin_or_manager());

-- team_members: ai dang nhap cung xem duoc thanh vien nhom
create policy team_members_select_authenticated
  on public.team_members for select
  to authenticated
  using (true);

-- team_members: chi admin/quan_ly duoc them/xoa thanh vien
create policy team_members_write_admin
  on public.team_members for all
  to authenticated
  using (public.is_admin_or_manager())
  with check (public.is_admin_or_manager());
