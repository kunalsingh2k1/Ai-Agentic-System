-- =====================================================================
--  AGENT OFFICE — full working database (PostgreSQL 15+ / Supabase)
--  One file, idempotent-ish: run on an empty database or schema.
--  Holds: workspace setup, departments, agents, connectors, vault index,
--  routing, project management, tasks + events, approvals, questions,
--  write audit, routines (scheduler), KPIs, office state, notifications.
-- =====================================================================

create extension if not exists pgcrypto;          -- gen_random_uuid()
create schema if not exists office;
set search_path = office, public;

-- ---------------------------------------------------------------------
-- 1. ENUMS
-- ---------------------------------------------------------------------
create type user_role       as enum ('owner','admin','operator','viewer');
create type office_mode     as enum ('running','paused','stopped');
create type connector_kind  as enum ('mcp_stdio','mcp_http','builtin');
create type note_kind       as enum ('sop','rule','ref','org','other');
create type task_status     as enum ('queued','working','question','needs_approval',
                                     'writing','done','failed','rejected','stopped');
create type task_source     as enum ('manual','routine','chat','api','orchestrator');
create type task_priority   as enum ('low','normal','high','urgent');
create type event_kind      as enum ('status','routed','tool','vault_read','text','question',
                                     'answer','proposal','write_call','tool_error','checked',
                                     'released','waiting','routine','error','note');
create type proposal_status as enum ('pending','approved','rejected','superseded');
create type question_status as enum ('open','answered','cancelled');
create type repeat_kind     as enum ('once','daily','weekdays','weekly','monthly');
create type project_status  as enum ('planned','active','on_hold','done','cancelled');
create type item_status     as enum ('todo','doing','blocked','review','done');
create type notify_status   as enum ('pending','sent','failed','skipped');

-- ---------------------------------------------------------------------
-- 2. HELPERS
-- ---------------------------------------------------------------------
create or replace function touch_updated_at() returns trigger
language plpgsql as $$
begin new.updated_at := now(); return new; end $$;

-- ---------------------------------------------------------------------
-- 3. WORKSPACE, PEOPLE, BUSINESS ENTITIES
-- ---------------------------------------------------------------------
create table workspace (
  id            smallint primary key default 1 check (id = 1),   -- singleton
  name          text not null,
  short_name    text not null,
  timezone      text not null default 'UTC',
  currency      text not null default 'USD',
  locale        text not null default 'en-US',
  settings      jsonb not null default '{}'::jsonb,
  updated_at    timestamptz not null default now()
);

create table app_user (
  id            uuid primary key default gen_random_uuid(),
  username      text not null unique,
  display_name  text not null,
  email         text unique,
  role          user_role not null default 'operator',
  password_hash text,                              -- null when SSO / Supabase auth is used
  slack_user_id text,
  active        boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Companies / orgs / branches / stores the agents act on (e.g. 4 Zoho orgs)
create table entity (
  id            uuid primary key default gen_random_uuid(),
  key           text not null unique,              -- 'galaxy', 'store-north'
  name          text not null,
  aliases       text[] not null default '{}',      -- words that identify it in a request
  external_ref  jsonb not null default '{}'::jsonb,-- {"zoho_org_id":"922791164"}
  slack_channel text,
  is_default    boolean not null default false,
  active        boolean not null default true,
  created_at    timestamptz not null default now()
);
create unique index entity_one_default on entity ((true)) where is_default;

-- Which entity may trade with which (directed). Agents read this, never infer it.
create table entity_relation (
  from_entity   uuid not null references entity(id) on delete cascade,
  to_entity     uuid not null references entity(id) on delete cascade,
  relation      text not null default 'sells_to',
  primary key (from_entity, to_entity, relation),
  check (from_entity <> to_entity)
);

-- ---------------------------------------------------------------------
-- 4. DEPARTMENTS, CONNECTORS, AGENTS
-- ---------------------------------------------------------------------
create table department (
  id            uuid primary key default gen_random_uuid(),
  key           text not null unique,              -- 'sales'
  name          text not null,                     -- 'Sales'
  color_token   text not null,                     -- '--dept-sales' (UI token name)
  sort_order    int  not null default 0,
  is_orchestrator boolean not null default false
);

create table connector (
  id            uuid primary key default gen_random_uuid(),
  key           text not null unique,              -- 'zoho', 'gmail', 'slack'
  name          text not null,
  kind          connector_kind not null,
  tool_prefix   text not null,                     -- 'mcp__zoho__'
  config        jsonb not null default '{}'::jsonb,-- command/args/url; NEVER secrets
  secret_env    text[] not null default '{}',      -- names of env vars that hold secrets
  ok            boolean,
  detail        text,
  checked_at    timestamptz
);

create table agent (
  id            uuid primary key default gen_random_uuid(),
  key           text not null unique,              -- 'po-builder'
  department_id uuid not null references department(id),
  name          text not null,
  purpose       text not null default '',
  can_write     boolean not null default false,    -- true => must pass approval gate
  makes_report  boolean not null default false,    -- true => refreshes dept KPIs when done
  is_orchestrator boolean not null default false,
  model         text not null default 'sonnet',
  effort        text not null default 'medium',
  max_parallel  int  not null default 1 check (max_parallel between 1 and 5),
  max_turns     int  not null default 40,
  timeout_sec   int  not null default 900,
  system_prompt text not null default '',          -- agent persona/instructions (no secrets)
  enabled       boolean not null default true,
  sort_order    int  not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create unique index agent_one_orchestrator on agent ((true)) where is_orchestrator;

-- Tool allow-list per agent per connector. Write tools are separated so the runner
-- can withhold them during the DRAFT phase and grant them only after approval.
create table agent_connector (
  agent_id      uuid not null references agent(id) on delete cascade,
  connector_id  uuid not null references connector(id) on delete cascade,
  read_tools    text[] not null default '{}',      -- 'list_items', 'get_invoice'
  write_tools   text[] not null default '{}',      -- 'create_bill', 'update_item'
  primary key (agent_id, connector_id)
);

-- Keyword router used by the Orchestrator before (or instead of) an LLM routing call
create table routing_rule (
  id            uuid primary key default gen_random_uuid(),
  agent_id      uuid not null references agent(id) on delete cascade,
  phrases       text[] not null default '{}',      -- weight 2 each
  words         text[] not null default '{}',      -- weight 1 each
  priority      int not null default 0             -- tie-breaker, higher wins
);

-- ---------------------------------------------------------------------
-- 5. KNOWLEDGE VAULT (read-only index of the Obsidian / markdown vault)
-- ---------------------------------------------------------------------
create table vault_note (
  id            uuid primary key default gen_random_uuid(),
  path          text not null unique,              -- 'SOP/SOP - Create Purchase Order.md'
  title         text not null,
  kind          note_kind not null default 'other',
  sha256        text,
  bytes         int,
  updated_at    timestamptz not null default now()
);
create table agent_note (
  agent_id      uuid not null references agent(id) on delete cascade,
  note_id       uuid not null references vault_note(id) on delete cascade,
  sort_order    int not null default 0,
  primary key (agent_id, note_id)
);

-- ---------------------------------------------------------------------
-- 6. PROJECT MANAGEMENT (projects -> milestones -> work items; tasks can link)
-- ---------------------------------------------------------------------
create table project (
  id            uuid primary key default gen_random_uuid(),
  key           text not null unique,              -- 'OPS' -> work items OPS-1, OPS-2
  name          text not null,
  description   text not null default '',
  status        project_status not null default 'planned',
  owner_id      uuid references app_user(id),
  start_date    date,
  due_date      date,
  next_seq      int not null default 1,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  check (due_date is null or start_date is null or due_date >= start_date)
);

create table milestone (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid not null references project(id) on delete cascade,
  name          text not null,
  due_date      date,
  status        project_status not null default 'planned',
  sort_order    int not null default 0
);

create table work_item (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid not null references project(id) on delete cascade,
  milestone_id  uuid references milestone(id) on delete set null,
  ref           text not null unique,              -- filled by trigger: 'OPS-12'
  title         text not null,
  body          text not null default '',
  status        item_status not null default 'todo',
  priority      task_priority not null default 'normal',
  assignee_id   uuid references app_user(id),
  agent_id      uuid references agent(id),         -- when an agent owns the item
  depends_on    uuid[] not null default '{}',
  estimate_hours numeric(6,2),
  due_date      date,
  done_at       timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create or replace function work_item_ref() returns trigger language plpgsql as $$
declare k text; n int;
begin
  if new.ref is null or new.ref = '' then
    update project set next_seq = next_seq + 1 where id = new.project_id
      returning key, next_seq - 1 into k, n;
    new.ref := k || '-' || n;
  end if;
  if new.status = 'done' and new.done_at is null then new.done_at := now(); end if;
  if new.status <> 'done' then new.done_at := null; end if;
  return new;
end $$;
create trigger trg_work_item_ref before insert or update on work_item
  for each row execute function work_item_ref();

-- ---------------------------------------------------------------------
-- 7. ROUTINES (scheduled work)
-- ---------------------------------------------------------------------
create table routine (
  id            uuid primary key default gen_random_uuid(),
  agent_id      uuid not null references agent(id) on delete cascade,
  entity_id     uuid references entity(id),
  title         text not null,
  prompt        text not null,
  run_time      time not null default '09:00',
  repeat        repeat_kind not null default 'weekdays',
  weekday       smallint check (weekday between 0 and 6),   -- 0 = Sunday
  month_day     smallint check (month_day between 1 and 31),
  start_date    date,
  timezone      text not null default 'UTC',
  needs_ok      boolean not null default false,   -- creates task held until Start
  model         text,                              -- null => agent default
  paused        boolean not null default false,
  next_run_at   timestamptz,
  last_run_at   timestamptz,
  last_task_id  uuid,
  created_by    uuid references app_user(id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  check (repeat <> 'weekly'  or weekday   is not null),
  check (repeat <> 'monthly' or month_day is not null)
);

-- Next run strictly after p_from, evaluated in the routine's own timezone.
-- Monthly days that do not exist (31st in April) fall on the month's last day.
create or replace function routine_next_run(
  p_time time, p_repeat repeat_kind, p_weekday smallint, p_month_day smallint,
  p_start date, p_tz text, p_from timestamptz default now())
returns timestamptz language plpgsql stable as $$
declare
  local_now timestamp := p_from at time zone p_tz;
  d date := greatest(local_now::date, coalesce(p_start, local_now::date));
  cand timestamp;
  i int;
  last_day date;
begin
  for i in 0..400 loop
    cand := (d + i) + p_time;
    continue when cand <= local_now;
    if p_repeat in ('once','daily') then return cand at time zone p_tz; end if;
    if p_repeat = 'weekdays' and extract(isodow from cand) between 1 and 5 then
      return cand at time zone p_tz; end if;
    if p_repeat = 'weekly' and extract(dow from cand) = p_weekday then
      return cand at time zone p_tz; end if;
    if p_repeat = 'monthly' then
      last_day := (date_trunc('month', cand) + interval '1 month - 1 day')::date;
      if extract(day from cand) = least(p_month_day, extract(day from last_day)) then
        return cand at time zone p_tz; end if;
    end if;
  end loop;
  return null;
end $$;

create or replace function routine_set_next() returns trigger language plpgsql as $$
begin
  if new.paused then new.next_run_at := null;
  elsif tg_op = 'INSERT' or new.next_run_at is null
     or (new.run_time, new.repeat, new.weekday, new.month_day, new.start_date, new.timezone)
        is distinct from
        (old.run_time, old.repeat, old.weekday, old.month_day, old.start_date, old.timezone)
     or old.paused then
    new.next_run_at := routine_next_run(new.run_time, new.repeat, new.weekday,
                                        new.month_day, new.start_date, new.timezone);
  end if;
  return new;
end $$;
create trigger trg_routine_next before insert or update on routine
  for each row execute function routine_set_next();

-- ---------------------------------------------------------------------
-- 8. TASKS, EVENTS, PROPOSALS, QUESTIONS, WRITES, FILES
-- ---------------------------------------------------------------------
create table task (
  id            uuid primary key default gen_random_uuid(),
  seq           bigint generated always as identity unique,  -- human ref: T-1042
  agent_id      uuid not null references agent(id),
  department_id uuid not null references department(id),
  entity_id     uuid references entity(id),
  project_id    uuid references project(id) on delete set null,
  work_item_id  uuid references work_item(id) on delete set null,
  parent_task_id uuid references task(id) on delete set null,
  routine_id    uuid references routine(id) on delete set null,
  thread_id     text,                               -- chat thread / email thread
  title         text not null,
  input_text    text not null check (length(trim(input_text)) > 0),
  source        task_source not null default 'manual',
  priority      task_priority not null default 'normal',
  status        task_status not null default 'queued',
  held          boolean not null default false,     -- waits for Start
  late          boolean not null default false,     -- routine fired but no free slot
  model         text,
  attempt       int not null default 1,
  session_id    text,                               -- Claude Code session id (resume)
  result_text   text,                               -- draft / report (markdown)
  write_text    text,                               -- confirmation after write
  error         text,
  approved_by   uuid references app_user(id),
  approved_at   timestamptz,
  reject_note   text,
  checked_by    uuid references app_user(id),
  checked_at    timestamptz,                        -- human verified in source system
  created_by    uuid references app_user(id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  started_at    timestamptz,
  finished_at   timestamptz
);
create index task_status_idx   on task (status, created_at);
create index task_agent_idx    on task (agent_id, status);
create index task_dept_idx     on task (department_id, created_at desc);
create index task_project_idx  on task (project_id);
alter table routine add constraint routine_last_task_fk
  foreign key (last_task_id) references task(id) on delete set null;

create table task_event (
  id            bigint generated always as identity primary key,
  task_id       uuid not null references task(id) on delete cascade,
  ts            timestamptz not null default now(),
  kind          event_kind not null,
  data          jsonb not null default '{}'::jsonb
);
create index task_event_task_idx on task_event (task_id, id);
create index task_event_ts_idx   on task_event (ts desc);

create table proposal (
  id            uuid primary key default gen_random_uuid(),
  task_id       uuid not null references task(id) on delete cascade,
  version       int not null default 1,
  action        text not null,                      -- 'Create purchase order'
  target        text not null,                      -- 'Zoho Books · CALI GOODS'
  fields        jsonb not null default '[]'::jsonb, -- [["Vendor","Costco"],["Lines","14"]]
  changes       jsonb not null default '[]'::jsonb, -- ["Create PO", "Use catalog descriptions"]
  payload       jsonb not null default '{}'::jsonb, -- exact tool calls to run after approval
  expected_writes int not null default 1 check (expected_writes >= 0),
  status        proposal_status not null default 'pending',
  decided_by    uuid references app_user(id),
  decided_at    timestamptz,
  note          text,
  created_at    timestamptz not null default now(),
  unique (task_id, version)
);
create unique index proposal_one_pending on proposal (task_id) where status = 'pending';

create table question (
  id            uuid primary key default gen_random_uuid(),
  task_id       uuid not null references task(id) on delete cascade,
  prompt        text not null,
  choices       jsonb not null default '[]'::jsonb,
  multi         boolean not null default false,
  status        question_status not null default 'open',
  answer_choices jsonb,
  answer_text   text,
  answered_by   uuid references app_user(id),
  answered_at   timestamptz,
  created_at    timestamptz not null default now()
);
create unique index question_one_open on question (task_id) where status = 'open';

-- Every write the runner performs against an outside system, for audit and safe retry
create table write_call (
  id            bigint generated always as identity primary key,
  task_id       uuid not null references task(id) on delete cascade,
  proposal_id   uuid references proposal(id),
  tool_name     text not null,                      -- 'mcp__zoho__create_bill'
  idempotency_key text not null,
  request       jsonb not null default '{}'::jsonb,
  response      jsonb,
  ok            boolean,
  external_id   text,                               -- id returned by the system
  ts            timestamptz not null default now(),
  unique (idempotency_key)
);

create table attachment (
  id            uuid primary key default gen_random_uuid(),
  task_id       uuid references task(id) on delete cascade,
  name          text not null,
  stored_path   text not null,
  mime          text,
  bytes         bigint,
  converted_path text,                              -- xlsx/docx -> text extract
  uploaded_by   uuid references app_user(id),
  created_at    timestamptz not null default now()
);

create table task_file (                            -- outputs the agent produced
  id            uuid primary key default gen_random_uuid(),
  task_id       uuid not null references task(id) on delete cascade,
  name          text not null,
  stored_path   text not null,
  mime          text,
  bytes         bigint,
  created_at    timestamptz not null default now()
);

create table agent_run (                            -- one Claude Code process per attempt/phase
  id            bigint generated always as identity primary key,
  task_id       uuid not null references task(id) on delete cascade,
  phase         text not null check (phase in ('route','draft','write','answer')),
  session_id    text,
  model         text,
  pid           int,
  started_at    timestamptz not null default now(),
  ended_at      timestamptz,
  exit_code     int,
  num_turns     int,
  input_tokens  bigint,
  output_tokens bigint,
  error         text
);

-- ---------------------------------------------------------------------
-- 9. STATUS MACHINE (enforced in the database, not just the app)
-- ---------------------------------------------------------------------
create table task_transition (
  from_status   task_status not null,
  to_status     task_status not null,
  primary key (from_status, to_status)
);
insert into task_transition values
  ('queued','working'), ('queued','stopped'), ('queued','failed'),
  ('working','queued'), ('working','question'), ('working','needs_approval'),
  ('working','done'), ('working','failed'), ('working','stopped'),
  ('question','working'), ('question','stopped'), ('question','failed'),
  ('needs_approval','writing'), ('needs_approval','rejected'), ('needs_approval','working'),
  ('writing','done'), ('writing','failed'), ('writing','stopped'),
  ('failed','queued'), ('stopped','queued'), ('rejected','queued');

create or replace function task_guard() returns trigger language plpgsql as $$
begin
  if tg_op = 'UPDATE' and new.status is distinct from old.status then
    if not exists (select 1 from task_transition
                   where from_status = old.status and to_status = new.status) then
      raise exception 'Illegal task transition % -> %', old.status, new.status
        using errcode = 'check_violation';
    end if;
    -- writing needs a recorded human approval of an approved proposal
    if new.status = 'writing' then
      if new.approved_by is null then
        raise exception 'Task cannot start writing without approved_by';
      end if;
      if not exists (select 1 from proposal p where p.task_id = new.id and p.status = 'approved') then
        raise exception 'Task cannot start writing without an approved proposal';
      end if;
      new.approved_at := coalesce(new.approved_at, now());
    end if;
    if new.status = 'working' and new.started_at is null then new.started_at := now(); end if;
    if new.status in ('done','failed','rejected','stopped') then new.finished_at := now(); end if;
    if new.status = 'queued' and old.status in ('failed','stopped','rejected') then
      new.attempt := old.attempt + 1;
      new.error := null; new.reject_note := null; new.result_text := null;
      new.write_text := null; new.checked_at := null; new.finished_at := null;
      new.approved_by := null; new.approved_at := null;
    end if;
  end if;
  if tg_op = 'INSERT' then
    if new.held and new.status <> 'queued' then
      raise exception 'Only queued tasks can be held';
    end if;
  end if;
  new.updated_at := now();
  return new;
end $$;
create trigger trg_task_guard before insert or update on task
  for each row execute function task_guard();

-- Log every status change + push a NOTIFY for the live stream (SSE)
create or replace function task_after() returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    insert into task_event(task_id, kind, data)
      values (new.id, 'status', jsonb_build_object('from', null, 'to', new.status));
    if new.held then
      insert into task_event(task_id, kind, data)
        values (new.id, 'waiting', jsonb_build_object('text','Waiting for your OK · press Start'));
    end if;
  elsif new.status is distinct from old.status then
    insert into task_event(task_id, kind, data)
      values (new.id, 'status', jsonb_build_object('from', old.status, 'to', new.status));
    -- a retry supersedes any still-pending proposal
    if new.status = 'queued' then
      update proposal set status = 'superseded' where task_id = new.id and status = 'pending';
    end if;
  end if;
  perform pg_notify('office', json_build_object('type','task','id',new.id,'status',new.status)::text);
  return null;
end $$;
create trigger trg_task_after after insert or update on task
  for each row execute function task_after();

create or replace function task_event_notify() returns trigger language plpgsql as $$
begin
  perform pg_notify('office', json_build_object('type','event','id',new.id,
                    'task_id',new.task_id,'kind',new.kind)::text);
  return null;
end $$;
create trigger trg_task_event_notify after insert on task_event
  for each row execute function task_event_notify();

create trigger trg_touch_user    before update on app_user  for each row execute function touch_updated_at();
create trigger trg_touch_agent   before update on agent     for each row execute function touch_updated_at();
create trigger trg_touch_project before update on project   for each row execute function touch_updated_at();
create trigger trg_touch_item    before update on work_item for each row execute function touch_updated_at();
create trigger trg_touch_routine before update on routine   for each row execute function touch_updated_at();

-- ---------------------------------------------------------------------
-- 10. OFFICE STATE, KPIs, SETTINGS, NOTIFICATIONS, AUDIT
-- ---------------------------------------------------------------------
create table office_state (
  id            smallint primary key default 1 check (id = 1),
  mode          office_mode not null default 'paused',
  changed_by    uuid references app_user(id),
  changed_at    timestamptz not null default now()
);
insert into office_state default values;

create table kpi (
  id            uuid primary key default gen_random_uuid(),
  department_id uuid not null references department(id) on delete cascade,
  key           text not null,
  label         text not null,
  value_text    text not null default '—',
  value_num     numeric,
  sort_order    int not null default 0,
  as_of         timestamptz,
  source_task_id uuid references task(id) on delete set null,
  unique (department_id, key)
);

create table setting (
  key           text primary key,                   -- 'default_model', 'max_parallel_global'
  value         jsonb not null,
  updated_at    timestamptz not null default now()
);

create table notification (
  id            bigint generated always as identity primary key,
  channel       text not null,                      -- 'slack', 'email'
  target        text not null,                      -- channel id / user / address
  task_id       uuid references task(id) on delete set null,
  payload       jsonb not null,
  status        notify_status not null default 'pending',
  error         text,
  created_at    timestamptz not null default now(),
  sent_at       timestamptz
);

create table audit_log (
  id            bigint generated always as identity primary key,
  ts            timestamptz not null default now(),
  actor_id      uuid references app_user(id),
  actor_label   text not null,                      -- 'kunal', 'scheduler', 'runner'
  action        text not null,                      -- 'task.approve', 'office.pause'
  object_type   text not null,
  object_id     text,
  detail        jsonb not null default '{}'::jsonb
);
create index audit_ts_idx on audit_log (ts desc);

-- ---------------------------------------------------------------------
-- 11. WORK FUNCTIONS (used by the server; each is one transaction)
-- ---------------------------------------------------------------------

-- Keyword routing: returns best agent for a request text, or null.
create or replace function route_text(p_text text)
returns table(agent_id uuid, score int, matched text[]) language sql stable as $$
  with t as (select ' ' || regexp_replace(lower(p_text), '[^a-z0-9]+', ' ', 'g') || ' ' as s),
  scored as (
    select r.agent_id, r.priority,
      array(select x from unnest(r.phrases || r.words) x
            where (select s from t) like '% ' || regexp_replace(lower(x), '[^a-z0-9]+', ' ', 'g') || ' %') as m,
      (select count(*) from unnest(r.phrases) x
        where (select s from t) like '% ' || regexp_replace(lower(x), '[^a-z0-9]+', ' ', 'g') || ' %')::int * 2
      + (select count(*) from unnest(r.words) x
        where (select s from t) like '% ' || regexp_replace(lower(x), '[^a-z0-9]+', ' ', 'g') || ' %')::int as sc
    from routing_rule r join agent a on a.id = r.agent_id and a.enabled
  )
  select agent_id, sc, m from scored where sc > 0
  order by sc desc, priority desc limit 1
$$;

-- Atomically claim the oldest runnable task for an agent with a free slot.
-- Safe with several workers (SKIP LOCKED). Returns null when nothing is runnable.
create or replace function claim_next_task() returns task language plpgsql as $$
declare t task;
begin
  if (select mode from office_state where id = 1) <> 'running' then return null; end if;
  select q.* into t from task q
   join agent a on a.id = q.agent_id
  where q.status = 'queued' and not q.held and a.enabled
    and (select count(*) from task w where w.agent_id = q.agent_id
          and w.status in ('working','writing')) < a.max_parallel
  order by case q.priority when 'urgent' then 0 when 'high' then 1
                           when 'normal' then 2 else 3 end, q.created_at
  limit 1
  for update of q skip locked;
  if t.id is null then return null; end if;
  update task set status = 'working', late = false where id = t.id returning * into t;
  return t;
end $$;

-- Human approves the pending proposal -> task goes to 'writing'
create or replace function approve_task(p_task uuid, p_user uuid) returns task
language plpgsql as $$
declare t task;
begin
  select * into t from task where id = p_task for update;
  if t.status <> 'needs_approval' then
    raise exception 'This task is not waiting for approval' using errcode = 'P0409';
  end if;
  update proposal set status = 'approved', decided_by = p_user, decided_at = now()
   where task_id = p_task and status = 'pending';
  if not found then raise exception 'No pending proposal for this task' using errcode = 'P0409'; end if;
  update task set approved_by = p_user, status = 'writing' where id = p_task returning * into t;
  insert into audit_log(actor_id, actor_label, action, object_type, object_id)
    select p_user, username, 'task.approve', 'task', p_task::text from app_user where id = p_user;
  return t;
end $$;

create or replace function reject_task(p_task uuid, p_user uuid, p_note text) returns task
language plpgsql as $$
declare t task;
begin
  select * into t from task where id = p_task for update;
  if t.status <> 'needs_approval' then
    raise exception 'This task is not waiting for approval' using errcode = 'P0409';
  end if;
  update proposal set status = 'rejected', decided_by = p_user, decided_at = now(), note = p_note
   where task_id = p_task and status = 'pending';
  update task set status = 'rejected', reject_note = nullif(trim(p_note), '')
   where id = p_task returning * into t;
  insert into audit_log(actor_id, actor_label, action, object_type, object_id, detail)
    select p_user, username, 'task.reject', 'task', p_task::text, jsonb_build_object('note', p_note)
    from app_user where id = p_user;
  return t;
end $$;

-- Scheduler tick: turn due routines into tasks. Call every 30–60 s.
create or replace function fire_due_routines(p_now timestamptz default now()) returns int
language plpgsql as $$
declare r routine; n int := 0; new_id uuid; busy boolean;
begin
  for r in select * from routine where not paused and next_run_at <= p_now
           for update skip locked loop
    select exists (select 1 from task where agent_id = r.agent_id
                   and status in ('working','writing')) into busy;
    insert into task (agent_id, department_id, entity_id, routine_id, title, input_text,
                      source, held, late, model)
    select r.agent_id, a.department_id, r.entity_id, r.id, r.title, r.prompt,
           'routine', r.needs_ok, busy, r.model
      from agent a where a.id = r.agent_id
    returning id into new_id;
    insert into task_event(task_id, kind, data) values (new_id, 'routine', jsonb_build_object('late', busy));
    update routine set last_run_at = p_now, last_task_id = new_id,
           paused = (repeat = 'once'),
           next_run_at = case when repeat = 'once' then null
                         else routine_next_run(run_time, repeat, weekday, month_day, start_date, timezone, p_now) end
     where id = r.id;
    n := n + 1;
  end loop;
  return n;
end $$;

-- ---------------------------------------------------------------------
-- 12. READ VIEWS FOR THE UI
-- ---------------------------------------------------------------------
create or replace view v_agent_status as
select a.id, a.key, a.name, d.key as dept_key, d.name as dept_name, a.can_write, a.enabled,
  coalesce((select t.status::text from task t where t.agent_id = a.id
             and t.status in ('working','writing','question','needs_approval')
            order by t.updated_at desc limit 1), 'idle') as live_status,
  (select count(*) from task t where t.agent_id = a.id and t.status = 'queued')        as queued,
  (select count(*) from task t where t.agent_id = a.id and t.status in ('needs_approval','question')
     or (t.agent_id = a.id and t.held and t.status = 'queued'))                        as needs_you
from agent a join department d on d.id = a.department_id;

create or replace view v_department_board as
select d.id, d.key, d.name, d.color_token, d.sort_order,
  count(t.*) filter (where t.status = 'queued')                          as queued,
  count(t.*) filter (where t.status in ('working','writing'))            as working,
  count(t.*) filter (where t.status in ('needs_approval','question')
                        or (t.status = 'queued' and t.held))             as needs_you,
  count(t.*) filter (where t.status = 'done' and t.finished_at > now() - interval '24 hours') as done_24h,
  count(t.*) filter (where t.status = 'failed')                          as failed
from department d left join task t on t.department_id = d.id
group by d.id;

create or replace view v_needs_you as
select t.id, t.seq, t.title, t.status, t.held, a.name as agent, d.name as dept, t.updated_at,
  case when t.status = 'needs_approval' then 'approve'
       when t.status = 'question' then 'answer'
       else 'start' end as action
from task t join agent a on a.id = t.agent_id join department d on d.id = t.department_id
where t.status in ('needs_approval','question') or (t.status = 'queued' and t.held)
order by t.updated_at;

create or replace view v_activity as
select e.id, e.ts, e.kind, e.data, t.id as task_id, t.seq, t.title, a.name as agent, d.key as dept_key
from task_event e join task t on t.id = e.task_id
join agent a on a.id = t.agent_id join department d on d.id = t.department_id
order by e.id desc;

create or replace view v_project_progress as
select p.id, p.key, p.name, p.status, p.due_date,
  count(w.*)                                        as items,
  count(w.*) filter (where w.status = 'done')       as items_done,
  count(w.*) filter (where w.status = 'blocked')    as items_blocked,
  round(100.0 * count(w.*) filter (where w.status = 'done') / nullif(count(w.*),0), 1) as pct_done,
  (select count(*) from task t where t.project_id = p.id)  as agent_tasks
from project p left join work_item w on w.project_id = p.id
group by p.id;

-- ---------------------------------------------------------------------
-- 13. ROW LEVEL SECURITY (Supabase). Server uses service_role and bypasses RLS.
--     Signed-in browser users may only READ; all writes go through the server API.
-- ---------------------------------------------------------------------
do $$
declare tbl text;
begin
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    for tbl in select tablename from pg_tables where schemaname = 'office' loop
      execute format('alter table office.%I enable row level security', tbl);
      execute format('create policy read_all on office.%I for select to authenticated using (true)', tbl);
    end loop;
    execute 'revoke all on all tables in schema office from anon';
  end if;
end $$;
