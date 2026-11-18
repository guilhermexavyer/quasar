-- Quasar: limpeza das colunas de código do ativo (pat_ativo).
--
--   cd_patrimonio          → excluída (legado, não aparece em nenhuma tela);
--   cd_patrimonio_externo  → renomeada para cd_externo (os valores ficam como estão).
--
-- Nenhuma informação se perde:
--   1. se cd_patrimonio tiver valor e cd_patrimonio_externo estiver vazio, o valor
--      é levado para o código externo antes da exclusão;
--   2. se as duas tiverem valores diferentes, a migração PARA com erro (a
--      transação é desfeita e nada muda) para a decisão ser tomada à mão.

do $$
declare
  conflitos integer;
begin
  select count(*) into conflitos
    from pat_ativo
   where nullif(btrim(cd_patrimonio), '') is not null
     and nullif(btrim(cd_patrimonio_externo), '') is not null
     and btrim(cd_patrimonio) <> btrim(cd_patrimonio_externo);
  if conflitos > 0 then
    raise exception 'pat_ativo: % ativo(s) com cd_patrimonio e cd_patrimonio_externo diferentes. Resolva antes de migrar.', conflitos;
  end if;
end $$;

update pat_ativo
   set cd_patrimonio_externo = cd_patrimonio
 where nullif(btrim(cd_patrimonio), '') is not null
   and nullif(btrim(cd_patrimonio_externo), '') is null;

alter table pat_ativo drop column cd_patrimonio;
alter table pat_ativo rename column cd_patrimonio_externo to cd_externo;
