-- Lifecycle smoke test. Run after schema.sql + seed_example.sql on a throwaway database.
-- Every NOTICE "OK blocked" is an expected refusal; any ERROR means the build is broken.
\set ON_ERROR_STOP 1
set search_path = office, public;
select title, repeat, timezone, next_run_at at time zone timezone as next_local from routine order by title;

-- routing
select a.key, r.score, r.matched from route_text('Please enter the vendor invoice #88213 as a bill') r join agent a on a.id=r.agent_id;
select a.key, r.score from route_text('make a PO for Costco from the attached receipt') r join agent a on a.id=r.agent_id;
select count(*) as no_match from route_text('hello there');

-- office paused => nothing claimed
insert into task (agent_id, department_id, title, input_text, created_by)
select a.id, a.department_id, 'PO for Costco', 'make a PO for Costco', (select id from app_user where username='owner') from agent a where key='po-builder';
select (claim_next_task()).id is null as paused_blocks_claim;
update office_state set mode='running';
select (claim_next_task()).status as claimed_status;

-- illegal: working -> writing directly
do $$ begin
  update task set status='writing' where title='PO for Costco';
  raise exception 'SHOULD NOT REACH';
exception when others then raise notice 'OK blocked: %', sqlerrm; end $$;

-- draft -> proposal -> needs_approval -> approve -> writing -> done
insert into proposal (task_id, action, target, fields, expected_writes)
select id, 'Create purchase order', 'ERP · Example HQ', '[["Vendor","Costco"],["Lines","14"]]', 1 from task where title='PO for Costco';
update task set status='needs_approval', result_text='Draft ... ACTION: PROPOSE' where title='PO for Costco';
select (approve_task(t.id, u.id)).status from task t, app_user u where t.title='PO for Costco' and u.username='owner';
insert into write_call (task_id, tool_name, idempotency_key, request, ok, external_id)
select id, 'mcp__erp__create_purchase_order', id::text||':1', '{}', true, 'PO-00412' from task where title='PO for Costco';
update task set status='done', write_text='Name :- Costco\nPurchase Order :- PO-00412\nStatus :- Purchase Order Made' where title='PO for Costco';

-- approving again fails
do $$ begin
  perform approve_task(t.id, u.id) from task t, app_user u where t.title='PO for Costco' and u.username='owner';
  raise exception 'SHOULD NOT REACH';
exception when others then raise notice 'OK blocked: %', sqlerrm; end $$;

-- reject + retry path
insert into task (agent_id, department_id, title, input_text) select id, department_id, 'Bill 88213', 'enter bill' from agent where key='bill-entry';
select (claim_next_task()).title;
insert into proposal (task_id, action, target) select id,'Create bill','ERP' from task where title='Bill 88213';
update task set status='needs_approval' where title='Bill 88213';
select (reject_task(t.id, u.id, 'Wrong vendor')).status from task t, app_user u where t.title='Bill 88213' and u.username='owner';
update task set status='queued' where title='Bill 88213';
select status, attempt, reject_note is null as cleared from task where title='Bill 88213';
select p.status from proposal p join task t on t.id=p.task_id where t.title='Bill 88213';

-- held task is not claimed
insert into task (agent_id, department_id, title, input_text, held) select id, department_id, 'Held check', 'stock', true from agent where key='stock-watch';
select (claim_next_task()).title as claimed_next;   -- Bill 88213 (retry), not Held check

-- routines fire
update routine set next_run_at = now() - interval '1 minute' where title like 'Low stock%';
select fire_due_routines() as fired;
select title, held, source, late from task where source='routine';
select title, next_run_at > now() as rescheduled from routine where title like 'Low stock%';

-- monthly on 31 -> last day
select routine_next_run('09:00', 'monthly', null, 31::smallint, null, 'UTC', '2026-04-10 00:00Z') as apr31_to_apr30;
select routine_next_run('09:00', 'weekly', 1::smallint, null, null, 'Asia/Kolkata', '2026-10-22 12:00Z') as next_monday_ist;

-- project mgmt
insert into work_item (project_id, title) select id, 'Create schema' from project where key='OFFICE';
insert into work_item (project_id, title, status) select id, 'Write runner', 'done' from project where key='OFFICE';
select ref, status, done_at is not null as has_done_at from work_item order by ref;
select key, items, items_done, pct_done from v_project_progress;

-- views
select key, queued, working, needs_you, done_24h from v_department_board order by sort_order;
select title, action from v_needs_you;
select key, live_status, queued, needs_you from v_agent_status where queued>0 or live_status<>'idle';
select kind, count(*) from task_event group by kind order by kind;
