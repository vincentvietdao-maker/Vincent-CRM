-- Buoc 2a: companies, contacts, leads, lead_submissions + chuan hoa (CRM_SPEC.md muc 3, 4.1)

-- ===== Ham chuan hoa (immutable, dung cho generated column) =====

create or replace function public.normalize_email(p_email text)
returns text
language sql
immutable
as $$
  select nullif(lower(trim(p_email)), '');
$$;

create or replace function public.normalize_tax_code(p_tax_code text)
returns text
language sql
immutable
as $$
  select case
    when regexp_replace(coalesce(p_tax_code, ''), '[^0-9-]', '', 'g') ~ '^[0-9]{10}(-[0-9]{3})?$'
    then regexp_replace(p_tax_code, '[^0-9-]', '', 'g')
    else null
  end;
$$;

comment on function public.normalize_tax_code is
  'Chi giu so va dau gach; hop le khi 10 so hoac 10 so + gach + 3 so (chi nhanh). Khong hop le -> null';

-- Chuan hoa SDT VN: bo khoang trang/cham/gach, +84/84 -> 0, doi dau so 11 so cu (2018) sang 10 so moi.
-- Tra ve dang 0xxxxxxxxx neu hop le, nguoc lai null (danh dau "can kiem tra", khong dung de so trung).
create or replace function public.normalize_phone_vn(p_phone text)
returns text
language plpgsql
immutable
as $$
declare
  digits text;
  old_prefix text;
  new_prefix text;
begin
  if p_phone is null then
    return null;
  end if;

  digits := regexp_replace(p_phone, '[^0-9]', '', 'g');

  -- +84 / 84 -> 0
  if left(digits, 2) = '84' and length(digits) in (11, 12) then
    digits := '0' || substring(digits from 3);
  end if;

  if left(digits, 1) <> '0' then
    return null;
  end if;

  -- Dau so 11 so cu -> 10 so moi (bang chuyen doi 2018)
  if length(digits) = 11 then
    old_prefix := left(digits, 4);
    new_prefix := case old_prefix
      when '0162' then '032'
      when '0163' then '033'
      when '0164' then '034'
      when '0165' then '035'
      when '0166' then '036'
      when '0167' then '037'
      when '0168' then '038'
      when '0169' then '039'
      when '0120' then '070'
      when '0121' then '079'
      when '0122' then '077'
      when '0126' then '076'
      when '0128' then '078'
      when '0123' then '083'
      when '0124' then '084'
      when '0125' then '085'
      when '0127' then '081'
      when '0129' then '082'
      when '0186' then '056'
      when '0188' then '058'
      when '0199' then '059'
      else null
    end;

    if new_prefix is null then
      return null;
    end if;

    digits := new_prefix || substring(digits from 5);
  end if;

  if length(digits) <> 10 then
    return null;
  end if;

  if substring(digits from 2 for 1) not in ('2', '3', '5', '7', '8', '9') then
    return null;
  end if;

  return digits;
end;
$$;

comment on function public.normalize_phone_vn is
  'Chuan hoa SDT VN theo CRM_SPEC.md muc 4.1. Tra ve null neu khong hop le (van luu SDT goc, gan co can kiem tra)';

-- ===== Bang =====

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  tax_code text,
  tax_code_normalized text generated always as (public.normalize_tax_code(tax_code)) stored,
  province text,
  address text,
  owner_id uuid references public.profiles (id) on delete set null,
  created_by uuid not null references public.profiles (id) default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

comment on table public.companies is 'Khach hang - cong ty (Account)';

create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies (id) on delete set null,
  full_name text not null,
  phone text,
  phone_normalized text generated always as (public.normalize_phone_vn(phone)) stored,
  email text,
  email_normalized text generated always as (public.normalize_email(email)) stored,
  owner_id uuid references public.profiles (id) on delete set null,
  created_by uuid not null references public.profiles (id) default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

comment on table public.contacts is 'Khach hang - nguoi lien he (Contact)';

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references public.contacts (id) on delete restrict,
  company_id uuid references public.companies (id) on delete set null,
  source text not null,
  kenh text not null check (kenh in ('du_an', 'thuong_mai', 'chua_ro')),
  danh_gia text not null default 'warm' check (danh_gia in ('hot', 'warm', 'cool')),
  status text not null default 'moi' check (status in ('moi')),
  product_interest text,
  note text,
  owner_id uuid references public.profiles (id) on delete set null,
  created_by uuid not null references public.profiles (id) default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

comment on table public.leads is 'Lead: yeu cau/nguoi quan tam moi, chua xac nhan la co hoi ban hang';

create table public.lead_submissions (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads (id) on delete cascade,
  source text not null,
  raw_data jsonb not null,
  created_by uuid not null references public.profiles (id) default auth.uid(),
  created_at timestamptz not null default now()
);

comment on table public.lead_submissions is 'Luot gui nguyen ban, khong bao gio sua (append-only)';

create index companies_owner_id_idx on public.companies (owner_id);
create index contacts_owner_id_idx on public.contacts (owner_id);
create index contacts_company_id_idx on public.contacts (company_id);
create index leads_owner_id_idx on public.leads (owner_id);
create index leads_contact_id_idx on public.leads (contact_id);
create index lead_submissions_lead_id_idx on public.lead_submissions (lead_id);

-- ===== updated_at tu dong =====

create trigger set_companies_updated_at
  before update on public.companies
  for each row execute function public.set_updated_at();

create trigger set_contacts_updated_at
  before update on public.contacts
  for each row execute function public.set_updated_at();

create trigger set_leads_updated_at
  before update on public.leads
  for each row execute function public.set_updated_at();

-- ===== Helper: Truong nhom xem duoc du lieu cua nguoi trong nhom minh lam truong nhom =====

create or replace function public.shares_team_with(target_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.team_members tm1
    join public.team_members tm2 on tm1.team_id = tm2.team_id
    where tm1.profile_id = auth.uid()
      and tm2.profile_id = target_id
      and tm1.is_leader = true
  );
$$;

-- ===== RLS =====

alter table public.companies enable row level security;
alter table public.contacts enable row level security;
alter table public.leads enable row level security;
alter table public.lead_submissions enable row level security;

-- Xem (CRM_SPEC.md muc 2.2): Sale=cua minh, Truong nhom=cua nhom, Marketing=khong xem khach/cong ty,
-- Quan ly/Admin=tat ca
create policy companies_select
  on public.companies for select
  to authenticated
  using (
    owner_id = auth.uid()
    or public.shares_team_with(owner_id)
    or public.current_user_role() in ('quan_ly', 'admin')
  );

create policy contacts_select
  on public.contacts for select
  to authenticated
  using (
    owner_id = auth.uid()
    or public.shares_team_with(owner_id)
    or public.current_user_role() in ('quan_ly', 'admin')
  );

-- Lead: Marketing xem duoc tat ca (T), khac voi khach hang/cong ty
create policy leads_select
  on public.leads for select
  to authenticated
  using (
    owner_id = auth.uid()
    or public.shares_team_with(owner_id)
    or public.current_user_role() in ('marketing', 'quan_ly', 'admin')
  );

create policy lead_submissions_select
  on public.lead_submissions for select
  to authenticated
  using (
    exists (
      select 1 from public.leads l
      where l.id = lead_submissions.lead_id
        and (
          l.owner_id = auth.uid()
          or public.shares_team_with(l.owner_id)
          or public.current_user_role() in ('marketing', 'quan_ly', 'admin')
        )
    )
  );

-- Tao: tat ca vai tro dang nhap deu tao duoc (CRM_SPEC.md muc 2.2 hang "Tao")
create policy companies_insert on public.companies for insert to authenticated with check (true);
create policy contacts_insert on public.contacts for insert to authenticated with check (true);
create policy leads_insert on public.leads for insert to authenticated with check (true);
create policy lead_submissions_insert on public.lead_submissions for insert to authenticated with check (true);

-- Sua: Sale=cua minh, Truong nhom=cua nhom, Quan ly/Admin=tat ca (khach hang/cong ty: Marketing khong sua)
create policy companies_update
  on public.companies for update
  to authenticated
  using (
    owner_id = auth.uid()
    or public.shares_team_with(owner_id)
    or public.current_user_role() in ('quan_ly', 'admin')
  );

create policy contacts_update
  on public.contacts for update
  to authenticated
  using (
    owner_id = auth.uid()
    or public.shares_team_with(owner_id)
    or public.current_user_role() in ('quan_ly', 'admin')
  );

-- Lead: Marketing sua duoc lead chua giao (owner_id null)
create policy leads_update
  on public.leads for update
  to authenticated
  using (
    owner_id = auth.uid()
    or public.shares_team_with(owner_id)
    or public.current_user_role() in ('quan_ly', 'admin')
    or (public.current_user_role() = 'marketing' and owner_id is null)
  );

-- Xoa vinh vien: chi Admin (CRM_SPEC.md muc 2.2)
create policy companies_delete on public.companies for delete to authenticated using (public.is_admin());
create policy contacts_delete on public.contacts for delete to authenticated using (public.is_admin());
create policy leads_delete on public.leads for delete to authenticated using (public.is_admin());

-- Xoa mem / khoi phuc (deleted_at): khach hang/cong ty chi Quan ly/Admin;
-- lead: them Marketing duoc xoa mem lead chua giao (CRM_SPEC.md muc 2.2)
create or replace function public.check_business_record_soft_delete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.deleted_at is distinct from old.deleted_at and not public.is_admin_or_manager() then
    raise exception 'Khong co quyen xoa hoac khoi phuc ban ghi nay';
  end if;
  return new;
end;
$$;

create trigger companies_check_soft_delete
  before update on public.companies
  for each row execute function public.check_business_record_soft_delete();

create trigger contacts_check_soft_delete
  before update on public.contacts
  for each row execute function public.check_business_record_soft_delete();

create or replace function public.check_lead_soft_delete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.deleted_at is distinct from old.deleted_at then
    if public.is_admin_or_manager() then
      return new;
    end if;
    if public.current_user_role() = 'marketing'
       and old.owner_id is null
       and new.deleted_at is not null then
      return new;
    end if;
    raise exception 'Khong co quyen xoa hoac khoi phuc lead nay';
  end if;
  return new;
end;
$$;

create trigger leads_check_soft_delete
  before update on public.leads
  for each row execute function public.check_lead_soft_delete();
