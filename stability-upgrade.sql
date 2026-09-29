-- ORIGINAL DATABASE. Apply before deploying the matching original ZIP. Additive migration; existing reports are not rewritten.
begin;

alter table public.reports add column if not exists client_code text;
alter table public.reports drop constraint if exists reports_product_check;

create table if not exists public.exhibition_event_days (
  id text primary key, event_id text not null references public.exhibition_events(id) on delete cascade,
  event_date date not null, needed_count integer not null check (needed_count between 1 and 7),
  created_at bigint not null, updated_at bigint not null
);
alter table public.exhibition_attendees add column if not exists event_day_id text;
alter table public.exhibition_event_days enable row level security;
drop index if exists public.exhibition_attendees_event_owner_uidx;
create unique index if not exists exhibition_days_date_safe on public.exhibition_event_days(event_id, event_date);

create table if not exists public.mutation_receipts (
  operation_id text primary key, request jsonb not null, result jsonb not null, created_at bigint not null
);
alter table public.mutation_receipts enable row level security;

create table if not exists public.sales_plan_integration_outbox (
  event_id text primary key, report_id text not null, action text not null,
  payload jsonb not null, status text not null default 'pending',
  attempt_count integer not null default 0, last_error_code text, last_error text,
  last_attempt_at bigint, delivered_at bigint, created_at bigint not null, updated_at bigint not null
);
alter table public.sales_plan_integration_outbox drop constraint if exists sales_plan_integration_outbox_status_check;
alter table public.sales_plan_integration_outbox add constraint sales_plan_integration_outbox_status_check check (status in ('pending','processing','delivered','blocked'));
alter table public.sales_plan_integration_outbox add column if not exists next_attempt_at bigint not null default 0;
alter table public.sales_plan_integration_outbox add column if not exists lease_token text;
alter table public.sales_plan_integration_outbox add column if not exists lease_until bigint;
alter table public.sales_plan_integration_outbox enable row level security;
create index if not exists sales_plan_integration_outbox_retry_safe on public.sales_plan_integration_outbox(status, next_attempt_at, created_at);

create or replace function public.report_app_json(r public.reports) returns jsonb
language sql immutable set search_path = public as $$
  select jsonb_build_object('id',r.id,'createdAt',r.created_at,'updatedAt',r.updated_at,
    'date',r.report_date,'owner',r.owner,'client',r.client,'clientCode',coalesce(r.client_code,''),
    'branchName',coalesce(r.branch_name,''),'type',r.type,'product',r.product,'amount',r.amount,
    'collectionYear',r.collection_year,'collectionMonth',r.collection_month,
    'prescriptionDone',r.prescription_done,'successCase',coalesce(r.success_case,''));
$$;

create or replace function public.report_version_safe() returns trigger
language plpgsql set search_path = public as $$
declare stamp bigint := floor(extract(epoch from clock_timestamp()) * 1000);
begin
  if TG_OP = 'UPDATE' then
    new.updated_at := greatest(stamp, old.updated_at + 1);
    new.created_at := old.created_at;
  else
    new.created_at := stamp;
    new.updated_at := stamp;
  end if;
  return new;
end;
$$;
drop trigger if exists report_version_safe on public.reports;
create trigger report_version_safe before insert or update on public.reports for each row execute function public.report_version_safe();

create or replace function public.report_outbox_safe() returns trigger
language plpgsql security definer set search_path = public as $$
declare r public.reports; stamp bigint; payload jsonb; action_name text;
begin
  if TG_OP = 'DELETE' then
    r := old;
    stamp := greatest(floor(extract(epoch from clock_timestamp()) * 1000)::bigint, old.updated_at + 1);
    action_name := 'delete';
    payload := jsonb_build_object('dataType','daily_report','action',action_name,'reportId',r.id,'deleted',true,'updatedAt',stamp);
  else
    r := new; stamp := new.updated_at; action_name := 'create_or_update';
    payload := jsonb_build_object('dataType','daily_report','action',action_name,'reportId',r.id,
      'updatedAt',stamp,'owner',r.owner,'date',r.report_date,'clientName',r.client,
      'clientCode',coalesce(r.client_code,''),'branchName',coalesce(r.branch_name,''),
      'type',r.type,'product',r.product,'amount',r.amount);
    if r.collection_year is not null and r.collection_month is not null then
      payload := payload || jsonb_build_object('collectionMonth',r.collection_year || '-' || lpad(r.collection_month::text,2,'0'));
    end if;
  end if;
  insert into public.sales_plan_integration_outbox(event_id,report_id,action,payload,status,created_at,updated_at)
    values(r.id || ':' || stamp, r.id, action_name, payload, 'pending', stamp, stamp);
  if TG_OP <> 'INSERT' then
    insert into public.report_logs(action,created_at,actor,report_id,client,before_data,after_data)
      values(lower(TG_OP),stamp,coalesce(nullif(current_setting('app.report_actor',true),''),r.owner),r.id,r.client,
        public.report_app_json(old),case when TG_OP = 'UPDATE' then public.report_app_json(new) else null end);
  end if;
  return coalesce(new,old);
end;
$$;
drop trigger if exists report_outbox_safe on public.reports;
create trigger report_outbox_safe after insert or update or delete on public.reports for each row execute function public.report_outbox_safe();

create or replace function public.mutate_report_safe(p_action text, p_report jsonb, p_expected_updated_at bigint, p_operation_id text, p_actor text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare prior public.reports; updated public.reports; receipt public.mutation_receipts;
  request_value jsonb := jsonb_build_object('kind','report','action',p_action,'report',p_report,'expected',p_expected_updated_at,'actor',p_actor);
  result_value jsonb; report_id text := p_report->>'id';
begin
  if coalesce(report_id,'') = '' or coalesce(p_operation_id,'') = '' or p_action not in ('create','update','delete') then raise exception 'invalid_request'; end if;
  perform pg_advisory_xact_lock(hashtextextended('operation:' || p_operation_id,0));
  select * into receipt from public.mutation_receipts where operation_id = p_operation_id;
  if found then
    if receipt.request <> request_value then raise exception 'operation_conflict'; end if;
    return receipt.result;
  end if;
  perform pg_advisory_xact_lock(hashtextextended('report:' || report_id,0));
  select * into prior from public.reports where id = report_id for update;
  if p_action = 'create' and found then raise exception 'report_conflict'; end if;
  if p_action <> 'create' then
    if prior.id is null then raise exception 'report_not_found'; end if;
    if p_expected_updated_at is null or p_expected_updated_at <> prior.updated_at then raise exception 'report_conflict'; end if;
  end if;
  perform set_config('app.report_actor',coalesce(p_actor,''),true);
  if p_action = 'delete' then
    delete from public.reports where id = report_id;
    result_value := jsonb_build_object('ok',true);
  else
    select * into updated from jsonb_populate_record(prior,p_report);
    if p_action = 'create' then
      updated.prescription_done := coalesce(updated.prescription_done,false);
      updated.success_case := coalesce(updated.success_case,'');
    end if;
    if coalesce(trim(updated.owner),'') = '' or coalesce(trim(updated.client),'') = '' or updated.report_date is null
      or coalesce(trim(updated.product),'') = '' or updated.type is null or updated.type not in ('신규','매출증대')
      or updated.amount is null or updated.amount < 0 or updated.amount <> trunc(updated.amount)
      or updated.amount > 9007199254740991 then raise exception 'invalid_request'; end if;
    if p_action = 'create' then
      insert into public.reports select updated.* returning * into updated;
    else
      update public.reports set report_date=updated.report_date,owner=updated.owner,client=updated.client,
        client_code=updated.client_code,branch_name=updated.branch_name,type=updated.type,product=updated.product,
        amount=updated.amount,collection_year=updated.collection_year,collection_month=updated.collection_month,
        prescription_done=updated.prescription_done,success_case=updated.success_case
        where id=report_id returning * into updated;
    end if;
    result_value := jsonb_build_object('row',to_jsonb(updated));
  end if;
  insert into public.mutation_receipts values(p_operation_id,request_value,result_value,floor(extract(epoch from clock_timestamp())*1000));
  return result_value;
end;
$$;

create or replace function public.mutate_exhibition_safe(p_event jsonb, p_delete boolean, p_expected_updated_at bigint, p_operation_id text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare prior public.exhibition_events; saved public.exhibition_events; receipt public.mutation_receipts;
  request_value jsonb := jsonb_build_object('kind','exhibition','event',p_event,'delete',p_delete,'expected',p_expected_updated_at);
  result_value jsonb; event_key text := p_event->>'id'; day jsonb; person text; day_key text;
  stamp bigint := floor(extract(epoch from clock_timestamp())*1000); first_date date;
begin
  if coalesce(event_key,'') = '' or coalesce(p_operation_id,'') = '' then raise exception 'invalid_request'; end if;
  perform pg_advisory_xact_lock(hashtextextended('operation:' || p_operation_id,0));
  select * into receipt from public.mutation_receipts where operation_id=p_operation_id;
  if found then
    if receipt.request <> request_value then raise exception 'operation_conflict'; end if;
    return receipt.result;
  end if;
  perform pg_advisory_xact_lock(hashtextextended('exhibition:' || event_key,0));
  select * into prior from public.exhibition_events where id=event_key for update;
  if prior.id is not null then
    if p_expected_updated_at is null or prior.updated_at <> p_expected_updated_at then raise exception 'event_conflict'; end if;
    stamp := greatest(stamp,prior.updated_at+1);
  elsif p_expected_updated_at is not null or p_delete then raise exception 'event_not_found';
  end if;
  if p_delete then
    delete from public.exhibition_attendees where event_id=event_key;
    delete from public.exhibition_event_days where event_id=event_key;
    delete from public.exhibition_events where id=event_key;
    result_value := jsonb_build_object('ok',true);
  else
    if coalesce(trim(p_event->>'title'),'') = '' or coalesce(jsonb_array_length(p_event->'days'),0) = 0 then raise exception 'invalid_request'; end if;
    select min((value->>'date')::date) into first_date from jsonb_array_elements(p_event->'days');
    insert into public.exhibition_events(id,event_date,title,needed_count,memo,created_at,updated_at)
      values(event_key,first_date,trim(p_event->>'title'),(p_event->'days'->0->>'neededCount')::int,'',coalesce(prior.created_at,stamp),stamp)
      on conflict(id) do update set event_date=excluded.event_date,title=excluded.title,needed_count=excluded.needed_count,memo='',updated_at=excluded.updated_at
      returning * into saved;
    delete from public.exhibition_attendees where event_id=event_key;
    delete from public.exhibition_event_days where event_id=event_key;
    for day in select value from jsonb_array_elements(p_event->'days') loop
      day_key := event_key || '-' || replace(day->>'date','-','');
      insert into public.exhibition_event_days values(day_key,event_key,(day->>'date')::date,(day->>'neededCount')::int,stamp,stamp);
      for person in select distinct value from jsonb_array_elements_text(day->'attendees') loop
        if person not in ('성진욱','김무영','이승엽','김태홍','제성규','송진영','이현욱') then raise exception 'invalid_request'; end if;
        insert into public.exhibition_attendees(id,event_id,event_day_id,owner,created_at) values(day_key || '-' || person,event_key,day_key,person,stamp);
      end loop;
    end loop;
    result_value := jsonb_build_object('row',to_jsonb(saved),'days',p_event->'days');
  end if;
  insert into public.mutation_receipts values(p_operation_id,request_value,result_value,stamp);
  return result_value;
end;
$$;

create or replace function public.claim_sales_plan_events(p_token text, p_limit integer default 10)
returns setof public.sales_plan_integration_outbox language sql security definer set search_path = public as $$
  with picked as (
    select event_id from public.sales_plan_integration_outbox
    where (status='pending' and next_attempt_at <= extract(epoch from clock_timestamp())*1000)
       or (status='processing' and lease_until < extract(epoch from clock_timestamp())*1000)
    order by created_at,event_id for update skip locked limit least(greatest(p_limit,1),25)
  ) update public.sales_plan_integration_outbox o set status='processing',lease_token=p_token,
    lease_until=floor(extract(epoch from clock_timestamp())*1000)+300000,
    attempt_count=o.attempt_count+1,last_attempt_at=floor(extract(epoch from clock_timestamp())*1000)
    from picked where picked.event_id=o.event_id returning o.*;
$$;

create or replace function public.finish_sales_plan_event(p_id text,p_token text,p_status text,p_error text,p_next bigint)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if p_status not in ('pending','delivered','blocked') then raise exception 'invalid_request'; end if;
  update public.sales_plan_integration_outbox set status=p_status,last_error=left(p_error,500),next_attempt_at=p_next,
    updated_at=floor(extract(epoch from clock_timestamp())*1000),lease_token=null,lease_until=null,
    delivered_at=case when p_status='delivered' then floor(extract(epoch from clock_timestamp())*1000) else null end
    where event_id=p_id and status='processing' and lease_token=p_token;
  return found;
end;
$$;

create or replace function public.report_backup_snapshot() returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare name text; contents jsonb; result jsonb := '{}'::jsonb;
begin
  foreach name in array array['reports','report_logs','daily_completions','team_calendar_days',
    'exhibition_events','exhibition_event_days','exhibition_attendees','client_directory','owner_branch_map',
    'existing_clients','sales_plan_integration_outbox','mutation_receipts'] loop
    if to_regclass('public.' || name) is not null then
      execute format('select coalesce(jsonb_agg(to_jsonb(t)),''[]''::jsonb) from public.%I t',name) into contents;
      result := result || jsonb_build_object(name,contents);
    end if;
  end loop;
  return result;
end;
$$;

create or replace function public.clinic_match_key(value text) returns text
language sql immutable as $$ select regexp_replace(regexp_replace(lower(coalesce(value,'')),'[[:space:]()（）\[\]{}]','','g'),'의원|병원','','g'); $$;
create or replace function public.branch_match_key(value text) returns text
language sql immutable as $$ select regexp_replace(regexp_replace(lower(coalesce(value,'')),'[[:space:]]','','g'),'사업장|지점|센터','','g'); $$;
create index if not exists directory_exact_clinic_safe on public.client_directory(public.clinic_match_key(client_name),public.branch_match_key(branch_name));

create or replace function public.preview_report_client_matches() returns jsonb
language sql stable security definer set search_path = public as $$
  with matches as (
    select r.id,r.owner,r.client,r.client_code,r.branch_name,r.updated_at,
      count(distinct d.client_code) as candidates,min(d.client_name) as next_client,
      min(d.client_code) as next_code,min(d.branch_name) as next_branch
    from public.reports r left join public.client_directory d
      on public.clinic_match_key(r.client) = public.clinic_match_key(d.client_name)
      and public.branch_match_key(r.branch_name) <> ''
      and public.branch_match_key(r.branch_name) = public.branch_match_key(d.branch_name)
      and coalesce(d.client_code,'') <> '' and d.branch_name like '%지점' and d.client_name not like '%기공소%'
    group by r.id
  ) select coalesce(jsonb_agg(jsonb_build_object('id',id,'owner',owner,'client',client,'clientCode',coalesce(client_code,''),
    'branchName',coalesce(branch_name,''),'expectedUpdatedAt',updated_at,'candidateCount',candidates,
    'next',case when candidates=1 then jsonb_build_object('client',next_client,'code',next_code,'branch',next_branch) else null end,
    'reason',case when public.branch_match_key(branch_name)='' then '지점 확인 필요'
      when candidates=0 then '같은 지점·이름의 CIMS 코드 없음' when candidates>1 then '코드 후보 중복' else '이름·지점 일치' end)
    order by owner,client),'[]'::jsonb)
    from matches where (candidates=1 and (client is distinct from next_client or coalesce(client_code,'')<>next_code or branch_name is distinct from next_branch))
      or candidates<>1;
$$;

create or replace function public.replace_client_labels(p_branches jsonb,p_existing jsonb) returns boolean
language plpgsql security definer set search_path = public as $$
begin
  if jsonb_array_length(p_branches)=0 or jsonb_array_length(p_existing)=0 then raise exception 'invalid_request'; end if;
  perform pg_advisory_xact_lock(hashtextextended('client-label-import',0));
  delete from public.owner_branch_map;
  insert into public.owner_branch_map select * from jsonb_populate_recordset(null::public.owner_branch_map,p_branches);
  delete from public.existing_clients;
  insert into public.existing_clients select * from jsonb_populate_recordset(null::public.existing_clients,p_existing);
  return true;
end;
$$;

-- Only the server service role may invoke mutation/queue/backup RPCs.
do $$ declare f record; begin
  for f in select oid::regprocedure as signature from pg_proc where pronamespace='public'::regnamespace
    and proname in ('report_app_json','report_version_safe','report_outbox_safe','mutate_report_safe',
      'mutate_exhibition_safe','claim_sales_plan_events','finish_sales_plan_event','report_backup_snapshot',
      'clinic_match_key','branch_match_key','preview_report_client_matches','replace_client_labels') loop
    execute format('revoke all on function %s from public, anon, authenticated', f.signature);
    execute format('grant execute on function %s to service_role',f.signature);
  end loop;
end $$;
grant all on public.mutation_receipts, public.sales_plan_integration_outbox, public.exhibition_event_days to service_role;
select pg_notify('pgrst','reload schema');
commit;
