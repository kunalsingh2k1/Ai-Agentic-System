-- =====================================================================
--  SEED — example environment. Replace names with the target business.
--  Generated from environment.yaml by the build (see 01_PROJECT_AND_DATABASE.md).
-- =====================================================================
set search_path = office, public;

insert into workspace (name, short_name, timezone, currency)
values ('Example Trading Co.', 'EXCO', 'America/Los_Angeles', 'USD');

insert into app_user (username, display_name, email, role) values
  ('owner',    'Owner',        'owner@example.com',    'owner'),
  ('ops',      'Ops Manager',  'ops@example.com',      'operator'),
  ('accounts', 'Accounts',     'accounts@example.com', 'viewer');

insert into entity (key, name, aliases, external_ref, slack_channel, is_default) values
  ('hq',    'Example HQ',    '{hq,head office}',  '{"erp_org_id":"1001"}', '#ops-hq',    true),
  ('north', 'North Branch',  '{north}',           '{"erp_org_id":"1002"}', '#ops-north', false),
  ('south', 'South Branch',  '{south}',           '{"erp_org_id":"1003"}', '#ops-south', false);
insert into entity_relation (from_entity, to_entity)
select a.id, b.id from entity a, entity b where a.key = 'hq' and b.key in ('north','south');

insert into department (key, name, color_token, sort_order, is_orchestrator) values
  ('sales',      'Sales',       '--dept-1', 1, false),
  ('purchasing', 'Purchasing',  '--dept-2', 2, false),
  ('finance',    'Finance',     '--dept-3', 3, false),
  ('inventory',  'Inventory',   '--dept-4', 4, false),
  ('inbox',      'Inbox',       '--dept-5', 5, false),
  ('dispatch',   'Dispatch',    '--dept-0', 0, true);

insert into connector (key, name, kind, tool_prefix, config, secret_env) values
  ('erp',   'ERP (accounting/inventory)', 'mcp_http',  'mcp__erp__',   '{"url":"https://mcp.example.com/erp"}', '{ERP_MCP_TOKEN}'),
  ('mail',  'Email',                      'mcp_http',  'mcp__mail__',  '{"url":"https://mcp.example.com/mail"}','{MAIL_MCP_TOKEN}'),
  ('chat',  'Team chat',                  'mcp_http',  'mcp__chat__',  '{"url":"https://mcp.example.com/chat"}','{CHAT_MCP_TOKEN}');

insert into agent (key, department_id, name, purpose, can_write, makes_report, is_orchestrator, model) values
  ('dispatcher',   (select id from department where key='dispatch'),   'Dispatcher',     'Routes requests to the right agent', false, false, true,  'haiku'),
  ('order-builder',(select id from department where key='sales'),      'Order Builder',  'Builds sales orders from customer requests', true, false, false, 'sonnet'),
  ('order-chaser', (select id from department where key='sales'),      'Order Chaser',   'Lists open orders not yet invoiced', false, true, false, 'sonnet'),
  ('po-builder',   (select id from department where key='purchasing'), 'PO Builder',     'Builds purchase orders from receipts/quotes', true, false, false, 'sonnet'),
  ('bill-entry',   (select id from department where key='purchasing'), 'Bill Entry',     'Enters vendor bills from vendor invoices', true, false, false, 'sonnet'),
  ('receivables',  (select id from department where key='finance'),    'Receivables',    'Open/overdue invoices and balances', false, true, false, 'sonnet'),
  ('recon',        (select id from department where key='finance'),    'Reconciliation', 'Inter-entity balance check', false, true, false, 'sonnet'),
  ('stock-watch',  (select id from department where key='inventory'),  'Stock Watch',    'Low stock / days-of-cover alerts', false, true, false, 'sonnet'),
  ('price-sync',   (select id from department where key='inventory'),  'Price Sync',     'Applies the master price sheet', true, false, false, 'sonnet'),
  ('inbox-triage', (select id from department where key='inbox'),      'Inbox Triage',   'Sorts inbox and drafts replies (never sends)', false, false, false, 'haiku');

insert into agent_connector (agent_id, connector_id, read_tools, write_tools)
select a.id, c.id, x.r, x.w from (values
  ('order-builder','erp', '{list_contacts,list_items,list_sales_orders}'::text[], '{create_sales_order}'::text[]),
  ('order-chaser', 'erp', '{list_sales_orders,list_invoices}', '{}'),
  ('po-builder',   'erp', '{list_contacts,list_items,list_purchase_orders}', '{create_purchase_order}'),
  ('bill-entry',   'erp', '{list_contacts,list_items,list_purchase_orders,list_bills}', '{create_bill,update_bill}'),
  ('receivables',  'erp', '{list_invoices,list_customer_payments,list_credit_notes}', '{}'),
  ('recon',        'erp', '{list_invoices,list_bills,list_credit_notes,list_vendor_credits}', '{}'),
  ('stock-watch',  'erp', '{list_items,list_item_groups,get_sales_by_item_report}', '{}'),
  ('price-sync',   'erp', '{list_items,get_item}', '{update_item}'),
  ('inbox-triage', 'mail','{search_threads,get_thread}', '{create_draft}')
) x(agent, conn, r, w)
join agent a on a.key = x.agent join connector c on c.key = x.conn;

insert into routing_rule (agent_id, phrases, words)
select a.id, x.p, x.w from (values
  ('bill-entry',   '{vendor invoice,supplier invoice,enter bill}'::text[], '{bill,bills}'::text[]),
  ('po-builder',   '{purchase order,order from,buy from,reorder from}', '{po,purchase}'),
  ('order-chaser', '{open orders,not invoiced,follow up}', '{backorder,backorders}'),
  ('order-builder','{sales order,customer order,order for}', '{so,quote}'),
  ('recon',        '{trading pair,mirror check}', '{reconcile,reconciliation,intercompany}'),
  ('receivables',  '{overdue invoices,open invoices,customer balance}', '{invoice,invoices,overdue,balance,owes}'),
  ('stock-watch',  '{low stock,out of stock,days of cover}', '{stock,stockout}'),
  ('price-sync',   '{price sync,update prices,price list}', '{price,prices,pricing}'),
  ('inbox-triage', '{reply to,email from}', '{inbox,email,emails,triage}')
) x(agent, p, w) join agent a on a.key = x.agent;

insert into vault_note (path, title, kind) values
  ('SOP/SOP - Create Sales Order.md',        'SOP - Create Sales Order',        'sop'),
  ('SOP/SOP - Create Purchase Order.md',     'SOP - Create Purchase Order',     'sop'),
  ('SOP/SOP - Bill from Vendor Invoice.md',  'SOP - Bill from Vendor Invoice',  'sop'),
  ('SOP/SOP - Reconciliation.md',            'SOP - Reconciliation',            'sop'),
  ('Rules/Rule - Pricing.md',                'Rule - Pricing',                  'rule'),
  ('Rules/Rule - Confirmation Formats.md',   'Rule - Confirmation Formats',     'rule'),
  ('Rules/Rule - Write Safety.md',           'Rule - Write Safety',             'rule'),
  ('Ref/Ref - People & Vendors.md',          'Ref - People & Vendors',          'ref'),
  ('Org/Org - Entity Graph.md',              'Org - Entity Graph',              'org');

insert into agent_note (agent_id, note_id, sort_order)
select a.id, n.id, x.s from (values
  ('order-builder','SOP - Create Sales Order',1), ('order-builder','Rule - Confirmation Formats',2),
  ('po-builder','SOP - Create Purchase Order',1), ('po-builder','Rule - Pricing',2), ('po-builder','Rule - Confirmation Formats',3),
  ('bill-entry','SOP - Bill from Vendor Invoice',1), ('bill-entry','Rule - Pricing',2),
  ('recon','SOP - Reconciliation',1), ('recon','Org - Entity Graph',2),
  ('inbox-triage','Ref - People & Vendors',1)
) x(agent, note, s) join agent a on a.key = x.agent join vault_note n on n.title = x.note;
-- every writing agent also follows the write-safety rule
insert into agent_note (agent_id, note_id, sort_order)
select a.id, n.id, 99 from agent a, vault_note n where a.can_write and n.title = 'Rule - Write Safety';

insert into kpi (department_id, key, label, sort_order)
select d.id, x.k, x.l, x.s from (values
  ('sales','open_so','Open sales orders',1), ('sales','awaiting_ship','Awaiting shipment',2),
  ('purchasing','open_po','Open purchase orders',1), ('purchasing','bills_to_enter','Bills to enter',2),
  ('finance','open_ar','Open receivables',1), ('finance','recon_gap','Inter-entity gap',2),
  ('inventory','hot_low','Hot items under 2 weeks',1), ('inventory','active_skus','Active SKUs',2)
) x(dept,k,l,s) join department d on d.key = x.dept;

insert into routine (agent_id, title, prompt, run_time, repeat, weekday, month_day, timezone, needs_ok, model)
select a.id, x.t, x.t, x.tm::time, x.rp::office.repeat_kind, x.wd, x.md, 'America/Los_Angeles', x.ok, x.m
from (values
  ('stock-watch',  'Low stock check, all brands',      '08:30','weekdays', null::smallint, null::smallint, true,  null),
  ('inbox-triage', 'Sort the inbox and draft replies', '09:30','weekdays', null, null, false, 'haiku'),
  ('recon',        'Inter-entity reconciliation',      '10:00','weekly',   1,    null, false, null),
  ('receivables',  'Customer open balances',           '11:00','monthly',  null, 1,    false, null)
) x(agent,t,tm,rp,wd,md,ok,m) join agent a on a.key = x.agent;

insert into project (key, name, description, status, owner_id, start_date, due_date)
values ('OFFICE', 'Agent Office rollout', 'Build and launch the agent office', 'active',
        (select id from app_user where username='owner'), current_date, current_date + 42);

insert into milestone (project_id, name, due_date, sort_order)
select p.id, x.n, current_date + x.d, x.s from project p, (values
  ('M1 Database + API', 7, 1), ('M2 Claude runner + approvals', 21, 2),
  ('M3 UI', 35, 3), ('M4 Pilot + hardening', 42, 4)) x(n,d,s)
where p.key = 'OFFICE';

insert into setting (key, value) values
  ('default_model', '"sonnet"'), ('default_effort', '"medium"'),
  ('max_parallel_global', '3'),  ('stream_heartbeat_sec', '15');
