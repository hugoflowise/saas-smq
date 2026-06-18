-- Logo par client (utilisé dans l'en-tête des documents/PDF) + bucket de stockage
alter table public.tenants add column logo_url text;

-- Bucket public pour les assets de tenant (logos). Upload via service_role.
insert into storage.buckets (id, name, public)
values ('tenant-assets', 'tenant-assets', true)
on conflict (id) do nothing;
