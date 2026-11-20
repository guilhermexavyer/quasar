-- Quasar: Gerenciador de Relatórios > Relatórios passa a gerar XLS a partir de SQL.
--
--   * Formato: só XLS por enquanto (ie_formato 'excel'); os campos do PDF ficam
--     desabilitados na tela até o PDF voltar. Os relatórios existentes passam para XLS.
--   * Bandas (XLS: uma por relatório): Sequência, Descrição e SQL (ds_sql). O SQL é a
--     consulta que gera o relatório; parâmetros são escritos como :nome.
--     As colunas do PDF continuam na tabela (não aparecem no formulário).
--   * Parâmetros: Sequência, Descrição do parâmetro (ds_parametro = o nome usado no SQL,
--     sem os dois-pontos), Label, Ordem, Valor padrão, Perguntar e Obrigatório.
--     Os campos do modelo antigo (coleção/campo/operador...) saem.
--   * Papel quasar_relatorio: o SQL do relatório roda com ele, numa transação somente
--     leitura. Só lê (SELECT) as tabelas do sistema; não lê sessões (sessao) nem o hash
--     das senhas (usuario.ds_senha). Sem login: o servidor entra nele com SET LOCAL ROLE.

-- ── Relatório ──
update relatorio set ie_formato = 'excel' where ie_formato is distinct from 'excel';

-- ── Bandas ──
alter table relatorio_banda add column ds_sql text;

-- ── Parâmetros ──
alter table relatorio_parametro add column ds_parametro text;
alter table relatorio_parametro add column nr_ordem integer;
alter table relatorio_parametro add column ie_perguntar text check (ie_perguntar in ('S', 'N'));
alter table relatorio_parametro
  alter column ie_obrigatorio type text using case when ie_obrigatorio then 'S' else 'N' end;
alter table relatorio_parametro add constraint relatorio_parametro_ie_obrigatorio_check check (ie_obrigatorio in ('S', 'N'));
alter table relatorio_parametro drop constraint if exists relatorio_parametro_ie_conector_check;
alter table relatorio_parametro
  drop column ie_colecao,
  drop column ie_campo,
  drop column operador,
  drop column "valorFinal",
  drop column ie_conector,
  drop column ie_mascara,
  drop column ie_parametro;

-- Regras de campo (Campos x Formulários) dos campos que saíram.
update perfil
   set config_campos = config_campos
       - 'relatorio_parametro.ie_colecao' - 'relatorio_parametro.ie_campo' - 'relatorio_parametro.operador'
       - 'relatorio_parametro.valorFinal' - 'relatorio_parametro.ie_conector' - 'relatorio_parametro.ie_mascara'
       - 'relatorio_parametro.ie_parametro'
 where jsonb_typeof(config_campos) = 'object';

-- ── Papel de leitura dos relatórios ──
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'quasar_relatorio') then
    -- BYPASSRLS: as tabelas têm RLS ativo sem políticas (acesso só pelo servidor).
    create role quasar_relatorio nologin bypassrls;
  end if;
end $$;

-- O servidor (current_user) precisa poder entrar no papel com SET ROLE.
grant quasar_relatorio to current_user with set true;

grant usage on schema public to quasar_relatorio;
grant select on all tables in schema public to quasar_relatorio;
-- Tabelas criadas depois pelo mesmo usuário (migrações) também ficam legíveis.
alter default privileges in schema public grant select on tables to quasar_relatorio;

-- Nada de sessões nem de hash de senha.
revoke select on sessao from quasar_relatorio;
revoke select on usuario from quasar_relatorio;
do $$
declare
  colunas text;
begin
  select string_agg(quote_ident(column_name), ', ' order by ordinal_position)
    into colunas
    from information_schema.columns
   where table_schema = 'public' and table_name = 'usuario' and column_name <> 'ds_senha';
  execute format('grant select (%s) on usuario to quasar_relatorio', colunas);
end $$;
