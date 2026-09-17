-- Buoc 3b: che thong tin lien he (CRM_SPEC.md muc 2.3) cho nguoi ngoai pham vi (vd. Marketing xem
-- lead da giao cho sale) + ham "xem day du" co ghi audit log.

create or replace function public.mask_phone(p_phone text)
returns text
language sql
immutable
as $$
  select case
    when p_phone is null or length(p_phone) < 7 then p_phone
    else left(p_phone, 4) || ' *** ' || right(p_phone, 3)
  end;
$$;

create or replace function public.mask_email(p_email text)
returns text
language sql
immutable
as $$
  select case
    when p_email is null or position('@' in p_email) < 2 then p_email
    else left(p_email, 2) || '***@' || split_part(p_email, '@', 2)
  end;
$$;

-- Dieu kien "xem duoc day du" du lieu lien he cua 1 lead: chu, cung nhom (truong nhom), Quan ly/Admin.
-- Ngoai cac truong hop nay (vd. Marketing xem lead da giao cho sale khac) -> che mot phan.
create or replace function public.can_see_full_contact(p_owner_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select p_owner_id = auth.uid()
    or public.shares_team_with(p_owner_id)
    or public.current_user_role() in ('quan_ly', 'admin');
$$;

-- Danh sach lead (thay cho truy van .from('leads') truc tiep) de ap dung che thong tin dung quyen.
create or replace function public.list_leads()
returns table (
  id uuid,
  kenh text,
  danh_gia text,
  source text,
  created_at timestamptz,
  owner_id uuid,
  company_name text,
  contact_full_name text,
  contact_phone text,
  contact_email text,
  contact_masked boolean
)
language sql
security definer
stable
set search_path = public
as $$
  select
    l.id, l.kenh, l.danh_gia, l.source, l.created_at, l.owner_id,
    co.name,
    c.full_name,
    case when public.can_see_full_contact(l.owner_id) then c.phone else public.mask_phone(c.phone) end,
    case when public.can_see_full_contact(l.owner_id) then c.email else public.mask_email(c.email) end,
    not public.can_see_full_contact(l.owner_id)
  from public.leads l
  join public.contacts c on c.id = l.contact_id
  left join public.companies co on co.id = l.company_id
  where l.deleted_at is null
    and (
      l.owner_id = auth.uid()
      or public.shares_team_with(l.owner_id)
      or public.current_user_role() in ('marketing', 'quan_ly', 'admin')
    )
  order by l.created_at desc;
$$;

-- Chi tiet 1 lead, ap dung che thong tin tuong tu list_leads.
create or replace function public.get_lead_detail(p_lead_id uuid)
returns table (
  id uuid,
  kenh text,
  danh_gia text,
  source text,
  note text,
  product_interest text,
  created_at timestamptz,
  owner_id uuid,
  owner_full_name text,
  company_name text,
  company_tax_code text,
  company_province text,
  contact_full_name text,
  contact_phone text,
  contact_email text,
  contact_masked boolean
)
language sql
security definer
stable
set search_path = public
as $$
  select
    l.id, l.kenh, l.danh_gia, l.source, l.note, l.product_interest, l.created_at, l.owner_id,
    p.full_name,
    co.name, co.tax_code, co.province,
    c.full_name,
    case when public.can_see_full_contact(l.owner_id) then c.phone else public.mask_phone(c.phone) end,
    case when public.can_see_full_contact(l.owner_id) then c.email else public.mask_email(c.email) end,
    not public.can_see_full_contact(l.owner_id)
  from public.leads l
  join public.contacts c on c.id = l.contact_id
  left join public.companies co on co.id = l.company_id
  left join public.profiles p on p.id = l.owner_id
  where l.id = p_lead_id
    and l.deleted_at is null
    and (
      l.owner_id = auth.uid()
      or public.shares_team_with(l.owner_id)
      or public.current_user_role() in ('marketing', 'quan_ly', 'admin')
    );
$$;

-- Bam "Xem day du": tra ve SDT/email that, ghi audit log. Chi cho nguoi da duoc phep xem lead nay.
create or replace function public.reveal_contact_full(p_lead_id uuid)
returns table (phone text, email text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_contact_id uuid;
  v_owner_id uuid;
begin
  select l.contact_id, l.owner_id into v_contact_id, v_owner_id
  from public.leads l
  where l.id = p_lead_id and l.deleted_at is null;

  if v_contact_id is null then
    raise exception 'Khong tim thay lead';
  end if;

  if not (
    v_owner_id = auth.uid()
    or public.shares_team_with(v_owner_id)
    or public.current_user_role() in ('marketing', 'quan_ly', 'admin')
  ) then
    raise exception 'Khong co quyen xem lead nay';
  end if;

  perform public.write_audit_log(
    'xem_sdt_day_du', 'contacts', v_contact_id, jsonb_build_object('lead_id', p_lead_id)
  );

  return query
  select c.phone, c.email from public.contacts c where c.id = v_contact_id;
end;
$$;
