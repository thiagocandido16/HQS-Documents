-- Execute uma vez no SQL Editor do projeto Supabase.
-- Sem exclusões de tabelas ou dados. Reexecutar preserva documentos existentes.
begin;

create table if not exists public.hqs_documents (
  id uuid primary key,
  document_type text not null check (document_type in ('STR','IT')),
  str text not null default '',
  product text not null default '',
  defect text not null default '',
  author text not null,
  revision integer not null check (revision > 0),
  state_key text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists hqs_documents_updated on public.hqs_documents (updated_at desc, id);
create table if not exists public.hqs_revisions (
  document_id uuid not null references public.hqs_documents(id),
  version integer not null check (version > 0),
  state_key text not null unique,
  author text not null,
  note text not null,
  created_at timestamptz not null default now(),
  primary key (document_id,version)
);

alter table public.hqs_documents enable row level security;
alter table public.hqs_revisions enable row level security;
revoke all on public.hqs_documents, public.hqs_revisions from anon, authenticated;
grant select,insert,update on public.hqs_documents to service_role;
grant select,insert on public.hqs_revisions to service_role;

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('hqs-documents','hqs-documents',false,25165824,array['application/json'])
on conflict (id) do update set public=false;

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
    where id=p_id and revision=p_expected and document_type=p_document_type;
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
commit;
