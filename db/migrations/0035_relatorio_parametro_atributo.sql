-- Quasar: Gerenciador de Relatórios > Parâmetros — Atributo separado da Descrição.
--
-- Parâmetro (relatorio_parametro):
--   * cd_atributo   O nome do parâmetro no SQL (o :nome, gravado sem os dois-pontos),
--                   como o Atributo do Tasy. Único por relatório (sem diferenciar
--                   maiúsculas), validado pela tela.
--   * ds_parametro  Passa a ser só a descrição do parâmetro (texto livre).
--   Até aqui a Descrição era o nome do SQL: o valor é copiado para o Atributo.

alter table relatorio_parametro add column cd_atributo text;
comment on column relatorio_parametro.cd_atributo is 'Nome do parâmetro no SQL (o :nome, sem os dois-pontos).';
comment on column relatorio_parametro.ds_parametro is 'Descrição do parâmetro.';

update relatorio_parametro
set cd_atributo = nullif(trim(regexp_replace(coalesce(ds_parametro, ''), '^:+', '')), '')
where cd_atributo is null;
