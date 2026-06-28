create table if not exists public.reports (
  id text primary key,
  created_at bigint not null,
  updated_at bigint not null,
  report_date date not null,
  owner text not null,
  client text not null,
  type text not null check (type in ('신규', '매출증대')),
  product text not null check (product in ('3제+클로르', '3제', '클로르')),
  amount numeric not null default 0,
  prescription_done boolean not null default false
);

alter table public.reports
  add column if not exists prescription_done boolean not null default false;

create index if not exists reports_report_date_idx on public.reports (report_date);
create index if not exists reports_owner_idx on public.reports (owner);
