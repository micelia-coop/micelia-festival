-- =============================================================
-- 0010 · Desafío: se agrega el Día 0 (el día anterior al Día 1)
-- =============================================================
alter table public.desafio_dias drop constraint if exists desafio_dias_dia_check;
alter table public.desafio_dias add constraint desafio_dias_dia_check check (dia between 0 and 21);

insert into public.desafio_dias (dia, fecha, titulo, publicado)
select 0, fecha - 1, 'Día 0', false from public.desafio_dias where dia = 1
on conflict (dia) do nothing;
