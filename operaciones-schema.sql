-- 3.OA Operaciones · esquema inicial para Supabase/PostgreSQL
-- Ejecutar en un proyecto privado y habilitar usuarios manualmente desde Auth.
-- No introducir contraseñas en este archivo ni publicar claves de servidor.
create extension if not exists pgcrypto;
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role text not null check (role in ('director','collaborator')),
  created_at timestamptz not null default now()
);
create table if not exists public.activity_catalog (
  id uuid primary key default gen_random_uuid(),
  family text not null,
  name text not null,
  baseline_minutes integer check (baseline_minutes>=0),
  provisional boolean not null default true,
  created_at timestamptz not null default now(),
  unique(family,name)
);
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  project_name text not null,
  assignee_id uuid not null references public.profiles(id),
  catalog_id uuid references public.activity_catalog(id),
  estimate_minutes integer check (estimate_minutes>=0),
  status text not null default 'ready' check (status in ('ready','running','paused','submitted','changes','rejected','approved')),
  last_feedback text,
  work_started boolean not null default false,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.work_sessions (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  user_id uuid not null references public.profiles(id),
  kind text not null check(kind in ('initial','rework')),
  start_at timestamptz not null default now(),
  end_at timestamptz,
  pause_reason text,
  pause_note text,
  created_at timestamptz not null default now(),
  check(end_at is null or end_at>=start_at),
  check(end_at is null or (pause_reason is null or length(trim(pause_note))>0))
);
create unique index if not exists only_one_open_session_per_worker on public.work_sessions(user_id) where end_at is null;
create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  submitted_by uuid not null references public.profiles(id),
  evidence_url text not null check(evidence_url ~ '^https://'),
  note text not null check(length(trim(note))>0),
  created_at timestamptz not null default now()
);
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null unique references public.submissions(id),
  task_id uuid not null references public.tasks(id),
  reviewer_id uuid not null references public.profiles(id),
  decision text not null check(decision in ('approved','changes','rejected')),
  feedback text not null default '',
  created_at timestamptz not null default now(),
  check(decision='approved' or length(trim(feedback))>0)
);
create or replace function public.is_director() returns boolean language sql security definer stable set search_path=public as $$
  select exists(select 1 from public.profiles where id=(select auth.uid()) and role='director');
$$;
revoke all on function public.is_director() from public;
grant execute on function public.is_director() to authenticated;
alter table public.profiles enable row level security;
alter table public.activity_catalog enable row level security;
alter table public.tasks enable row level security;
alter table public.work_sessions enable row level security;
alter table public.submissions enable row level security;
alter table public.reviews enable row level security;
create policy "profiles team read" on public.profiles for select to authenticated using (true);
create policy "catalog team read" on public.activity_catalog for select to authenticated using (true);
create policy "catalog director write" on public.activity_catalog for all to authenticated using (public.is_director()) with check(public.is_director());
create policy "tasks visible" on public.tasks for select to authenticated using (public.is_director() or assignee_id=(select auth.uid()));
create policy "tasks director insert" on public.tasks for insert to authenticated with check(public.is_director());
create policy "tasks director update" on public.tasks for update to authenticated using (public.is_director()) with check(public.is_director());
create policy "tasks owner update" on public.tasks for update to authenticated using (assignee_id=(select auth.uid())) with check(assignee_id=(select auth.uid()));
create policy "sessions visible" on public.work_sessions for select to authenticated using (public.is_director() or user_id=(select auth.uid()));
create policy "sessions owner insert" on public.work_sessions for insert to authenticated with check(user_id=(select auth.uid()) and exists(select 1 from public.tasks t where t.id=task_id and t.assignee_id=(select auth.uid())));
create policy "sessions owner update" on public.work_sessions for update to authenticated using (user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create policy "submissions visible" on public.submissions for select to authenticated using (public.is_director() or submitted_by=(select auth.uid()));
create policy "submissions owner insert" on public.submissions for insert to authenticated with check(submitted_by=(select auth.uid()) and exists(select 1 from public.tasks t where t.id=task_id and t.assignee_id=(select auth.uid())));
create policy "reviews visible" on public.reviews for select to authenticated using (public.is_director() or exists(select 1 from public.tasks t where t.id=task_id and t.assignee_id=(select auth.uid())));
create policy "reviews director insert" on public.reviews for insert to authenticated with check(public.is_director() and reviewer_id=(select auth.uid()));
-- Impedir que el colaborador cambie campos administrativos o se autoapruebe.
create or replace function public.protect_task_state() returns trigger language plpgsql security definer set search_path=public as $$
begin
  if public.is_director() then return new; end if;
  if new.title is distinct from old.title or new.project_name is distinct from old.project_name
  or new.assignee_id is distinct from old.assignee_id or new.catalog_id is distinct from old.catalog_id
  or new.estimate_minutes is distinct from old.estimate_minutes or new.approved_at is distinct from old.approved_at
  or new.last_feedback is distinct from old.last_feedback then
    raise exception 'Solo dirección puede modificar la configuración y revisión de la actividad';
  end if;
  if old.status='approved' or new.status not in ('running','paused','submitted') then raise exception 'Transición no autorizada'; end if;
  if new.status='submitted' and not exists(select 1 from public.submissions s where s.task_id=new.id and s.submitted_by=auth.uid() and s.created_at>=old.updated_at) then
    raise exception 'Antes de enviar adjunta una nueva evidencia';
  end if;
  new.updated_at=now();
  return new;
end;$$;
drop trigger if exists protect_task_state_trigger on public.tasks;
create trigger protect_task_state_trigger before update on public.tasks for each row execute function public.protect_task_state();
-- Los registros de tiempo son inmutables salvo el cierre por su propio autor.
create or replace function public.guard_session_update() returns trigger language plpgsql set search_path=public as $$
begin
  if old.end_at is not null or new.id is distinct from old.id or new.task_id is distinct from old.task_id
    or new.user_id is distinct from old.user_id or new.kind is distinct from old.kind
    or new.start_at is distinct from old.start_at then raise exception 'Registro de tiempo inmutable'; end if;
  if new.end_at is null then raise exception 'Debe cerrarse la sesión'; end if;
  if new.end_at<old.start_at then raise exception 'Intervalo inválido'; end if;
  return new;
end;$$;
drop trigger if exists guard_session_update_trigger on public.work_sessions;
create trigger guard_session_update_trigger before update on public.work_sessions for each row execute function public.guard_session_update();
-- Impedir que alguien presente entregables de actividades cerradas o ajenas.
create or replace function public.guard_submission() returns trigger language plpgsql set search_path=public as $$
begin
  if not exists(select 1 from public.tasks t where t.id=new.task_id and t.assignee_id=auth.uid() and t.status in ('ready','running','paused','changes','rejected')) then raise exception 'Entrega no permitida'; end if;
  return new;
end;$$;
drop trigger if exists guard_submission_trigger on public.submissions;
create trigger guard_submission_trigger before insert on public.submissions for each row execute function public.guard_submission();
-- Un director solo puede revisar la última entrega pendiente, una vez.
create or replace function public.guard_review() returns trigger language plpgsql set search_path=public as $$
declare s public.submissions%rowtype;
begin
  select * into s from public.submissions where id=new.submission_id;
  if s.id is null or s.task_id<>new.task_id then raise exception 'Entrega inválida'; end if;
  if (select status from public.tasks where id=new.task_id)<>'submitted' then raise exception 'Actividad no pendiente de revisión'; end if;
  if (select id from public.submissions where task_id=new.task_id order by created_at desc,id desc limit 1)<>new.submission_id then raise exception 'Debe revisarse la última entrega'; end if;
  return new;
end;$$;
drop trigger if exists guard_review_trigger on public.reviews;
create trigger guard_review_trigger before insert on public.reviews for each row execute function public.guard_review();
-- Catálogo inicial: referencias provisionales, sin inventar tiempos.
insert into public.activity_catalog(family,name) values
('Dibujo CAD','Plantas arquitectónicas'),
('Dibujo CAD','Secciones y fachadas'),
('Dibujo CAD','Detalles constructivos'),
('Dibujo CAD','Digitalización de levantamientos'),
('Coordinación técnica','Integración estructural en arquitectura'),
('Gestión documental','Recaudo de documentación de licencia'),
('Modelado BIM','Modelado arquitectónico'),
('Visualización','Renders y posproducción')
on conflict(family,name) do nothing;
-- PASO MANUAL: crear cuentas en Supabase Auth y registrar sus UUID en profiles.
-- Ejemplo sin IDs reales:
-- insert into public.profiles(id,full_name,role) values ('UUID_AUTH_DIRECCION','Dirección 3.OA','director');
-- insert into public.profiles(id,full_name,role) values ('UUID_AUTH_FELIPE','Felipe','collaborator');
