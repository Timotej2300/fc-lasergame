alter table payments add column if not exists paypal_order_id text;
alter table payments add column if not exists paypal_capture_id text;

create unique index if not exists uq_paypal_order on payments(paypal_order_id) where paypal_order_id is not null;
