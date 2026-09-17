-- Buoc 2b: ham tao lead thu cong (nhap tay), gop cong ty/lien he/lead/luot gui trong 1 giao dich.
-- Chay voi quyen nguoi goi (khong security definer) de RLS ap dung binh thuong.

create or replace function public.create_lead_manual(
  p_full_name text,
  p_phone text,
  p_email text,
  p_company_name text,
  p_tax_code text,
  p_province text,
  p_source text,
  p_kenh text,
  p_danh_gia text,
  p_product_interest text,
  p_note text,
  p_raw_data jsonb
)
returns uuid
language plpgsql
as $$
declare
  v_company_id uuid;
  v_contact_id uuid;
  v_lead_id uuid;
begin
  if p_company_name is not null and trim(p_company_name) <> '' then
    select id into v_company_id
    from public.companies
    where lower(trim(name)) = lower(trim(p_company_name))
      and deleted_at is null
    limit 1;

    if v_company_id is null then
      insert into public.companies (name, tax_code, province, owner_id, created_by)
      values (trim(p_company_name), nullif(trim(p_tax_code), ''), nullif(trim(p_province), ''), auth.uid(), auth.uid())
      returning id into v_company_id;
    end if;
  end if;

  insert into public.contacts (company_id, full_name, phone, email, owner_id, created_by)
  values (
    v_company_id,
    trim(p_full_name),
    nullif(trim(p_phone), ''),
    nullif(trim(p_email), ''),
    auth.uid(),
    auth.uid()
  )
  returning id into v_contact_id;

  insert into public.leads (
    contact_id, company_id, source, kenh, danh_gia, product_interest, note, owner_id, created_by
  )
  values (
    v_contact_id,
    v_company_id,
    p_source,
    p_kenh,
    p_danh_gia,
    nullif(trim(p_product_interest), ''),
    nullif(trim(p_note), ''),
    auth.uid(),
    auth.uid()
  )
  returning id into v_lead_id;

  insert into public.lead_submissions (lead_id, source, raw_data, created_by)
  values (v_lead_id, p_source, p_raw_data, auth.uid());

  return v_lead_id;
end;
$$;

comment on function public.create_lead_manual is
  'Tao lead nhap tay: tim/tao cong ty theo ten, tao contact, tao lead, ghi lai luot gui nguyen ban';
