-- create_lead_manual tra ve them thong tin trung de FE hien popup bao cho nguoi nhap (muc 4.2)

drop function if exists public.create_lead_manual(
  text, text, text, text, text, text, text, text, text, text, text, jsonb
);

create function public.create_lead_manual(
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
returns table (
  lead_id uuid,
  dedup_kind text,
  dedup_reason text,
  matched_label text
)
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
  v_existing_contact_name text;
  v_existing_company_id uuid;
  v_existing_company_name text;
  v_matched_owner_id uuid;
  v_matched_owner_name text;
  v_status text := 'moi';
  v_dedup_kind text := 'khong_trung';
  v_dup_contact_id uuid;
  v_dup_company_id uuid;
  v_dup_company_name text;
  v_dup_reason text;
  v_matched_label text;
  v_note text := nullif(trim(p_note), '');

  v_company_id uuid;
  v_contact_id uuid;
  v_lead_id uuid;
  v_owner_id uuid;
begin
  -- 1) Trung chac chan: trung SDT hoac email da chuan hoa
  if v_phone_norm is not null then
    select id, owner_id, full_name into v_existing_contact_id, v_matched_owner_id, v_existing_contact_name
    from public.contacts
    where phone_normalized = v_phone_norm and deleted_at is null
    limit 1;
  end if;

  if v_existing_contact_id is null and v_email_norm is not null then
    select id, owner_id, full_name into v_existing_contact_id, v_matched_owner_id, v_existing_contact_name
    from public.contacts
    where email_normalized = v_email_norm and deleted_at is null
    limit 1;
  end if;

  -- 2) Trung chac chan: trung MST cap cong ty
  if v_existing_contact_id is null and v_tax_norm is not null then
    select id, owner_id, name into v_existing_company_id, v_matched_owner_id, v_existing_company_name
    from public.companies
    where tax_code_normalized = v_tax_norm and deleted_at is null
    limit 1;
  end if;

  if v_existing_contact_id is not null then
    v_contact_id := v_existing_contact_id;
    select company_id into v_company_id from public.contacts where id = v_contact_id;
    v_owner_id := v_matched_owner_id;
    v_note := coalesce('[Khach quay lai] ' || v_note, '[Khach quay lai]');
    v_dedup_kind := 'trung_chac_chan';
    v_matched_label := 'Trung voi khach hang da co: ' || v_existing_contact_name;
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
    v_dedup_kind := 'trung_chac_chan';
    v_matched_label := 'Trung MST voi cong ty da co: ' || v_existing_company_name;
  else
    -- 3) Co kha nang trung (fuzzy)
    if p_company_name is not null and trim(p_company_name) <> ''
       and p_province is not null and trim(p_province) <> '' then
      select id, name into v_dup_company_id, v_dup_company_name
      from public.companies
      where deleted_at is null
        and province = p_province
        and similarity(public.normalize_company_name(name), v_company_norm) >= 0.8
      order by similarity(public.normalize_company_name(name), v_company_norm) desc
      limit 1;

      if v_dup_company_id is not null then
        v_status := 'cho_xac_nhan_trung';
        v_dup_reason := 'ten_cong_ty_giong';
        v_dedup_kind := 'co_kha_nang_trung';
        v_matched_label := 'Ten cong ty giong voi: ' || v_dup_company_name;
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
          v_dedup_kind := 'co_kha_nang_trung';
          v_matched_label := 'Trung ten va ten mien email voi khach hang da co';
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

  return query select v_lead_id, v_dedup_kind, v_dup_reason, v_matched_label;
end;
$$;

comment on function public.create_lead_manual is
  'Tao lead + kiem tra trung; tra ve dedup_kind (trung_chac_chan/co_kha_nang_trung/khong_trung) de FE bao cho nguoi nhap';
