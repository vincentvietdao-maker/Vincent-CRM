-- Buoc 1c: nhat ky dang nhap + khoa tam sau 5 lan sai (CRM_SPEC.md muc 12)

create table public.login_logs (
  id bigint generated always as identity primary key,
  email text not null,
  profile_id uuid references public.profiles (id) on delete set null,
  success boolean not null,
  ip text,
  user_agent text,
  created_at timestamptz not null default now()
);

comment on table public.login_logs is 'Nhat ky dang nhap: thoi diem, IP, thiet bi, thanh cong/that bai';

create index login_logs_email_created_at_idx
  on public.login_logs (email, created_at desc);

alter table public.login_logs enable row level security;

-- Cho phep ghi log ngay ca khi chua dang nhap (anon) hoac da dang nhap
create policy login_logs_insert_any
  on public.login_logs for insert
  to anon, authenticated
  with check (true);

-- Chi xem duoc nhat ky cua chinh minh; rieng Admin xem duoc tat ca (CRM_SPEC.md muc 2.6)
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select public.current_user_role() = 'admin';
$$;

create policy login_logs_select_own_or_admin
  on public.login_logs for select
  to authenticated
  using (profile_id = auth.uid() or public.is_admin());

-- Kiem tra tai khoan co dang bi khoa tam khong: >= 5 lan sai lien tiep trong 15 phut gan nhat
create or replace function public.check_login_lockout(p_email text)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  with last_success as (
    select max(created_at) as t
    from public.login_logs
    where email = lower(trim(p_email)) and success = true
  ),
  recent_failures as (
    select count(*) as n
    from public.login_logs, last_success
    where login_logs.email = lower(trim(p_email))
      and login_logs.success = false
      and login_logs.created_at > coalesce(last_success.t, 'epoch'::timestamptz)
      and login_logs.created_at > now() - interval '15 minutes'
  )
  select n >= 5 from recent_failures;
$$;
