begin;
create table if not exists public.hqs_requests(id uuid primary key,version integer not null default 1,data jsonb not null,updated_at timestamptz not null default now());
create table if not exists public.hqs_part_catalog(id text primary key,reference text not null,data jsonb not null);
create index if not exists hqs_part_reference on public.hqs_part_catalog(reference);
create table if not exists public.hqs_request_counters(kind text primary key,sequence integer not null default 0,official boolean not null default false);
insert into public.hqs_request_counters(kind,sequence,official) values ('BASE',70,false),('DEMO-BASE',0,false) on conflict do nothing;
alter table public.hqs_requests enable row level security;
alter table public.hqs_part_catalog enable row level security;
alter table public.hqs_request_counters enable row level security;
revoke all on public.hqs_requests,public.hqs_part_catalog,public.hqs_request_counters from public,anon,authenticated;
grant select,insert,update on public.hqs_requests,public.hqs_part_catalog,public.hqs_request_counters to service_role;
create or replace function public.hqs_request_save(p_id uuid,p_expected integer,p_data jsonb) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare v_row public.hqs_requests;v_kind text;v_next integer;v_official boolean;v_number text;v_now timestamptz:=clock_timestamp();v_year text:=to_char(v_now at time zone 'America/Sao_Paulo','YYYY');v_source public.hqs_requests;
begin
 perform pg_advisory_xact_lock(hashtext('hqs-request-save'));
 select * into v_row from public.hqs_requests where id=p_id for update;
 if p_expected=0 then
  if found then return jsonb_build_object('record',v_row.data||jsonb_build_object('serverVersion',v_row.version));end if;
  v_kind:=p_data->>'type';if v_kind not in ('STR','IT') then raise exception 'Invalid type' using errcode='22023';end if;
  if p_data->>'sourceRequestId' is not null then
   select * into v_source from public.hqs_requests where id=(p_data->>'sourceRequestId')::uuid;
   if not found or v_source.data->>'type'<>'IT' or v_source.data->>'deletedAt' is not null or v_kind<>'STR' then raise exception 'Invalid source' using errcode='22023';end if;
   if exists(select 1 from public.hqs_requests where data->>'sourceRequestId'=p_data->>'sourceRequestId') then raise exception 'IT already linked' using errcode='23505';end if;
  end if;
  if v_source.id is not null then
   v_next:=(v_source.data->>'sequence')::integer;v_year:=v_source.data->>'year';v_official:=coalesce((v_source.data->>'official')::boolean,false);
  else
   select official into v_official from public.hqs_request_counters where kind='BASE' for update;
   update public.hqs_request_counters set sequence=sequence+1 where kind=case when v_official then 'BASE' else 'DEMO-BASE' end returning sequence into v_next;
  end if;
  v_number:=case when v_official then '' else 'DEMO-' end||v_kind||'-'||v_year||'-'||lpad(v_next::text,greatest(3,length(v_next::text)),'0');
  if exists(select 1 from public.hqs_documents where upper(str)=upper(v_number)) then raise exception 'Number already exists' using errcode='23505';end if;
  p_data:=p_data||jsonb_build_object('id',p_id,'number',v_number,'sequence',v_next,'year',v_year::integer,'revision',0,'createdAt',v_now,'updatedAt',v_now,'official',v_official);
  insert into public.hqs_requests(id,data,updated_at) values(p_id,p_data,v_now) returning * into v_row;
 else
  if v_row.id is null or v_row.version<>p_expected then raise exception 'Version conflict' using errcode='40001';end if;
  if p_data->>'id'<>p_id::text or p_data->>'type'<>v_row.data->>'type' or p_data->>'sequence'<>v_row.data->>'sequence' or p_data->>'year'<>v_row.data->>'year' then raise exception 'Immutable identity' using errcode='22023';end if;
  update public.hqs_requests set data=p_data||jsonb_build_object('updatedAt',v_now),version=version+1,updated_at=v_now where id=p_id returning * into v_row;
 end if;
 return jsonb_build_object('record',v_row.data||jsonb_build_object('serverVersion',v_row.version));
end;$$;
revoke all on function public.hqs_request_save(uuid,integer,jsonb) from public,anon,authenticated;
grant execute on function public.hqs_request_save(uuid,integer,jsonb) to service_role;
commit;

