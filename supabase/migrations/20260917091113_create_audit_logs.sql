-- Buoc 3a: bang audit_logs (khong ai sua/xoa duoc) + ghi log cho doi vai tro, xoa mem/khoi phuc
-- (CRM_SPEC.md muc 2.6, muc 12)

create table public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid not null references public.profiles (id),
  action text not null,
  target_table text not null,
  target_id uuid not null,
  metadata jsonb,
  created_at timestamptz not null default now()
);

comment on table public.audit_logs is
  'Nhat ky thao tac nhay cam. Chi ghi qua ham SECURITY DEFINER, khong co policy update/delete cho ai';

create index audit_logs_target_idx on public.audit_logs (target_table, target_id);
create index audit_logs_created_at_idx on public.audit_logs (created_at desc);

alter table public.audit_logs enable row level security;

-- Xem: chi Quan ly (chi xem) va Admin (CRM_SPEC.md muc 2.6). Khong co policy insert/update/delete
-- cho client -> chi ham SECURITY DEFINER (chay voi quyen chu bang) moi ghi duoc.
create policy audit_logs_select
  on public.audit_logs for select
  to authenticated
  using (public.is_admin_or_manager());

-- ===== Ham ghi log dung chung =====

create or replace function public.write_audit_log(
  p_action text,
  p_target_table text,
  p_target_id uuid,
  p_metadata jsonb
)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.audit_logs (actor_id, action, target_table, target_id, metadata)
  values (auth.uid(), p_action, p_target_table, p_target_id, p_metadata);
$$;

-- ===== Ghi log khi doi vai tro / trang thai tai khoan =====

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

  if new.role is distinct from old.role then
    perform public.write_audit_log(
      'doi_vai_tro', 'profiles', new.id,
      jsonb_build_object('vai_tro_cu', old.role, 'vai_tro_moi', new.role)
    );
  end if;

  if new.is_active is distinct from old.is_active then
    perform public.write_audit_log(
      'doi_trang_thai_tai_khoan', 'profiles', new.id,
      jsonb_build_object('active_cu', old.is_active, 'active_moi', new.is_active)
    );
  end if;

  return new;
end;
$$;

-- ===== Ghi log khi xoa mem / khoi phuc khach hang, cong ty =====

create or replace function public.check_business_record_soft_delete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.deleted_at is distinct from old.deleted_at then
    if not public.is_admin_or_manager() then
      raise exception 'Khong co quyen xoa hoac khoi phuc ban ghi nay';
    end if;

    perform public.write_audit_log(
      case when new.deleted_at is not null then 'xoa_mem' else 'khoi_phuc' end,
      TG_TABLE_NAME, new.id, null
    );
  end if;
  return new;
end;
$$;

-- ===== Ghi log khi xoa mem / khoi phuc lead =====

create or replace function public.check_lead_soft_delete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.deleted_at is distinct from old.deleted_at then
    if public.is_admin_or_manager() then
      perform public.write_audit_log(
        case when new.deleted_at is not null then 'xoa_mem' else 'khoi_phuc' end,
        'leads', new.id, null
      );
      return new;
    end if;

    if public.current_user_role() = 'marketing'
       and old.owner_id is null
       and new.deleted_at is not null then
      perform public.write_audit_log('xoa_mem', 'leads', new.id, null);
      return new;
    end if;

    raise exception 'Khong co quyen xoa hoac khoi phuc lead nay';
  end if;
  return new;
end;
$$;
