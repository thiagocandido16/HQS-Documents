-- Executar no projeto HQS Documents. Preserva documentos, versões e fotos.
begin;
alter table public.hqs_documents add column if not exists deleted_at timestamptz;
alter table public.hqs_documents add column if not exists deleted_by text;
alter table public.hqs_documents add column if not exists delete_reason text;
create table if not exists public.hqs_document_actions (
 id bigint generated always as identity primary key,
 document_id uuid not null references public.hqs_documents(id),
 action text not null check(action in ('delete','restore')),
 author text not null, reason text not null,
 created_at timestamptz not null default now()
);
alter table public.hqs_document_actions enable row level security;
revoke all on public.hqs_document_actions from public,anon,authenticated;
grant select,insert on public.hqs_document_actions to service_role;
grant usage,select on sequence public.hqs_document_actions_id_seq to service_role;
create or replace function public.hqs_save_document(
  p_id uuid, p_expected integer, p_document_type text,
  p_str text, p_product text, p_defect text,
  p_author text, p_note text, p_state_key text
) returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_version integer := p_expected + 1;
  v_now timestamptz := clock_timestamp();
begin
  if p_expected is null or p_expected < 0 or p_expected >= 2147483647
     or p_document_type not in ('STR','IT')
     or p_state_key not like ('documents/' || p_id::text || '/' || v_version::text || '-%.json') then
    raise exception 'Invalid document metadata' using errcode='22023';
  end if;
  if p_expected = 0 then
    insert into public.hqs_documents (id,document_type,str,product,defect,author,revision,state_key,created_at,updated_at)
    values (p_id,p_document_type,p_str,p_product,p_defect,p_author,v_version,p_state_key,v_now,v_now);
  else
    update public.hqs_documents
    set str=p_str,product=p_product,defect=p_defect,author=p_author,
        revision=v_version,state_key=p_state_key,updated_at=v_now
    where id=p_id and revision=p_expected and document_type=p_document_type and deleted_at is null;
    if not found then
      raise exception 'Revision conflict' using errcode='40001';
    end if;
  end if;
  insert into public.hqs_revisions (document_id,version,state_key,author,note,created_at)
  values (p_id,v_version,p_state_key,p_author,p_note,v_now);
  return jsonb_build_object('id',p_id,'revision',v_version,'updated_at',v_now);
end;
$$;
revoke all on function public.hqs_save_document(uuid,integer,text,text,text,text,text,text,text) from public,anon,authenticated;
grant execute on function public.hqs_save_document(uuid,integer,text,text,text,text,text,text,text) to service_role;

create or replace function public.hqs_document_action(p_id uuid,p_expected integer,p_updated timestamptz,p_action text,p_author text,p_reason text) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare d public.hqs_documents; v_now timestamptz:=clock_timestamp();
begin
 if p_action is null or p_action not in ('delete','restore') or p_author is null or length(trim(p_author))>200 or trim(p_author) !~ '[[:alpha:]][[:space:]]+[[:alpha:]]' or p_reason is null or length(trim(p_reason)) not between 1 and 2000 then
  raise exception 'Invalid action' using errcode='22023';
 end if;
 select * into d from public.hqs_documents where id=p_id for update;
 if not found then raise exception 'Missing document' using errcode='P0002'; end if;
 if p_expected is null or p_updated is null or d.revision<>p_expected or d.updated_at<>p_updated or (p_action='delete' and d.deleted_at is not null) or (p_action='restore' and d.deleted_at is null) then
  raise exception 'Document changed' using errcode='40001';
 end if;
 update public.hqs_documents set deleted_at=case when p_action='delete' then v_now else null end,
 deleted_by=case when p_action='delete' then trim(p_author) else null end,
 delete_reason=case when p_action='delete' then trim(p_reason) else null end,
 updated_at=v_now where id=p_id;
 insert into public.hqs_document_actions(document_id,action,author,reason,created_at) values(p_id,p_action,trim(p_author),trim(p_reason),v_now);
 return jsonb_build_object('id',p_id,'action',p_action,'updated_at',v_now);
end; $$;
revoke all on function public.hqs_document_action(uuid,integer,timestamptz,text,text,text) from public,anon,authenticated;
grant execute on function public.hqs_document_action(uuid,integer,timestamptz,text,text,text) to service_role;
commit;
