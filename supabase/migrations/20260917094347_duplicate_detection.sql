-- Buoc 4a: chong trung khi tao lead (CRM_SPEC.md muc 4.1, 4.2)
-- 3 muc: trung chac chan (SDT/email/MST) -> gan vao ho so cu, giao thang sale cu (muc 17.1);
-- co kha nang trung (ten cong ty giong >=80% cung tinh, hoac cung ten + cung ten mien email) -> cho xac nhan;
-- khong trung -> tao moi nhu cu.

create extension if not exists pg_trgm;
create extension if not exists unaccent;

create or replace function public.normalize_company_name(p_name text)
returns text
language sql
stable
as $$
  select trim(
    regexp_replace(
      regexp_replace(
        lower(public.unaccent(coalesce(p_name, ''))),
        '\m(cong ty|cty|tnhh|co phan|cp|mtv)\M', '', 'gi'
      ),
      '\s+', ' ', 'g'
    )
  );
$$;

comment on function public.normalize_company_name is
  'Bo dau, chu thuong, bo tien to Cong ty/TNHH/Co phan... chi dung de so gan dung (muc 4.1)';

create index companies_name_trgm_idx on public.companies using gin (name gin_trgm_ops);

-- Mo rong leads: them trang thai "cho_xac_nhan_trung" va tham chieu ban ghi nghi trung
do $$
declare
  v_conname text;
begin
  select conname into v_conname
  from pg_constraint
  where conrelid = 'public.leads'::regclass
    and contype = 'c'
    and pg_get_constraintdef(oid) like '%status%';

  if v_conname is not null then
    execute format('alter table public.leads drop constraint %I', v_conname);
  end if;
end;
$$;

alter table public.leads add constraint leads_status_check
  check (status in ('moi', 'cho_xac_nhan_trung'));

alter table public.leads add column possible_duplicate_contact_id uuid references public.contacts (id);
alter table public.leads add column possible_duplicate_company_id uuid references public.companies (id);
alter table public.leads add column possible_duplicate_reason text;

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
  v_phone_norm text := public.normalize_phone_vn(p_phone);
  v_email_norm text := public.normalize_email(p_email);
  v_tax_norm text := public.normalize_tax_code(p_tax_code);
  v_company_norm text := public.normalize_company_name(p_company_name);
  v_email_domain text;
  v_free_domains text[] := array['gmail.com','yahoo.com','outlook.com','hotmail.com','icloud.com','ymail.com','live.com'];

  v_existing_contact_id uuid;
  v_existing_company_id uuid;
  v_matched_owner_id uuid;
  v_status text := 'moi';
  v_dup_contact_id uuid;
  v_dup_company_id uuid;
  v_dup_reason text;
  v_note text := nullif(trim(p_note), '');

  v_company_id uuid;
  v_contact_id uuid;
  v_lead_id uuid;
  v_owner_id uuid;
begin
  -- 1) Trung chac chan: trung SDT hoac email da chuan hoa
  if v_phone_norm is not null then
    select id, owner_id into v_existing_contact_id, v_matched_owner_id
    from public.contacts
    where phone_normalized = v_phone_norm and deleted_at is null
    limit 1;
  end if;

  if v_existing_contact_id is null and v_email_norm is not null then
    select id, owner_id into v_existing_contact_id, v_matched_owner_id
    from public.contacts
    where email_normalized = v_email_norm and deleted_at is null
    limit 1;
  end if;

  -- 2) Trung chac chan: trung MST cap cong ty
  if v_existing_contact_id is null and v_tax_norm is not null then
    select id, owner_id into v_existing_company_id, v_matched_owner_id
    from public.companies
    where tax_code_normalized = v_tax_norm and deleted_at is null
    limit 1;
  end if;

  if v_existing_contact_id is not null then
    v_contact_id := v_existing_contact_id;
    select company_id into v_company_id from public.contacts where id = v_contact_id;
    v_owner_id := v_matched_owner_id;
    v_note := coalesce('[Khach quay lai] ' || v_note, '[Khach quay lai]');
  elsif v_existing_company_id is not null then
    v_company_id := v_existing_company_id;
    v_owner_id := v_matched_owner_id;
    insert into public.contacts (company_id, full_name, phone, email, owner_id, created_by)
    values (
      v_company_id, trim(p_full_name), nullif(trim(p_phone), ''), nullif(trim(p_email), ''),
      v_owner_id, auth.uid()
    )
    returning id into v_contact_id;
    v_note := coalesce('[Khach quay lai - cung cong ty] ' || v_note, '[Khach quay lai - cung cong ty]');
  else
    -- 3) Co kha nang trung (fuzzy)
    if p_company_name is not null and trim(p_company_name) <> ''
       and p_province is not null and trim(p_province) <> '' then
      select id into v_dup_company_id
      from public.companies
      where deleted_at is null
        and province = p_province
        and similarity(public.normalize_company_name(name), v_company_norm) >= 0.8
      order by similarity(public.normalize_company_name(name), v_company_norm) desc
      limit 1;

      if v_dup_company_id is not null then
        v_status := 'cho_xac_nhan_trung';
        v_dup_reason := 'ten_cong_ty_giong';
      end if;
    end if;

    if v_dup_company_id is null and v_email_norm is not null and position('@' in v_email_norm) > 1 then
      v_email_domain := split_part(v_email_norm, '@', 2);
      if not (v_email_domain = any(v_free_domains)) then
        select id into v_dup_contact_id
        from public.contacts
        where deleted_at is null
          and lower(trim(full_name)) = lower(trim(p_full_name))
          and email_normalized like '%@' || v_email_domain
        limit 1;

        if v_dup_contact_id is not null then
          v_status := 'cho_xac_nhan_trung';
          v_dup_reason := 'cung_ten_cung_ten_mien';
        end if;
      end if;
    end if;

    if p_company_name is not null and trim(p_company_name) <> '' then
      select id into v_company_id
      from public.companies
      where lower(trim(name)) = lower(trim(p_company_name)) and deleted_at is null
      limit 1;

      if v_company_id is null then
        insert into public.companies (name, tax_code, province, owner_id, created_by)
        values (
          trim(p_company_name), nullif(trim(p_tax_code), ''), nullif(trim(p_province), ''),
          auth.uid(), auth.uid()
        )
        returning id into v_company_id;
      end if;
    end if;

    insert into public.contacts (company_id, full_name, phone, email, owner_id, created_by)
    values (
      v_company_id, trim(p_full_name), nullif(trim(p_phone), ''), nullif(trim(p_email), ''),
      auth.uid(), auth.uid()
    )
    returning id into v_contact_id;

    v_owner_id := case when v_status = 'moi' then auth.uid() else null end;
  end if;

  insert into public.leads (
    contact_id, company_id, source, kenh, danh_gia, product_interest, note, owner_id, created_by,
    status, possible_duplicate_contact_id, possible_duplicate_company_id, possible_duplicate_reason
  )
  values (
    v_contact_id, v_company_id, p_source, p_kenh, p_danh_gia,
    nullif(trim(p_product_interest), ''), v_note, v_owner_id, auth.uid(),
    v_status, v_dup_contact_id, v_dup_company_id, v_dup_reason
  )
  returning id into v_lead_id;

  insert into public.lead_submissions (lead_id, source, raw_data, created_by)
  values (v_lead_id, p_source, p_raw_data, auth.uid());

  return v_lead_id;
end;
$$;

comment on function public.create_lead_manual is
  'Tao lead: kiem tra trung chac chan (SDT/email/MST) va co kha nang trung (ten cong ty/ten+ten mien) truoc khi tao moi';
