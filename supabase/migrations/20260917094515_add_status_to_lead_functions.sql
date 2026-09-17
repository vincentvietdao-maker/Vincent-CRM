-- Them status vao list_leads/get_lead_detail de hien thi "Cho xac nhan trung" (muc 4.2)

drop function if exists public.list_leads();
drop function if exists public.get_lead_detail(uuid);

create function public.list_leads()
returns table (
  id uuid,
  kenh text,
  danh_gia text,
  source text,
  status text,
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
    l.id, l.kenh, l.danh_gia, l.source, l.status, l.created_at, l.owner_id,
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

create function public.get_lead_detail(p_lead_id uuid)
returns table (
  id uuid,
  kenh text,
  danh_gia text,
  source text,
  status text,
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
    l.id, l.kenh, l.danh_gia, l.source, l.status, l.note, l.product_interest, l.created_at, l.owner_id,
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
