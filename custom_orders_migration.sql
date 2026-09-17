alter table public.orders
  add column if not exists order_type text not null default 'Made to Order',
  add column if not exists custom_details text,
  add column if not exists inspiration_photos jsonb not null default '[]'::jsonb;
