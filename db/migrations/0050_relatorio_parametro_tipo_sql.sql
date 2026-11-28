-- Quasar: Gerenciador de Relatórios > Relatórios > Parâmetros ganha os campos
-- Tipo (ie_tipo) e SQL (ds_sql):
--   ie_tipo: I = Input (campo de texto, como era) / D = Dropdown;
--   ds_sql:  só no Dropdown — consulta das opções, com as colunas (alias) cd (valor
--            passado ao :nome do SQL do relatório) e ds (texto exibido na opção).
-- Os parâmetros já cadastrados ficam como Input.

alter table relatorio_parametro add column ie_tipo text not null default 'I' check (ie_tipo in ('I', 'D'));
alter table relatorio_parametro add column ds_sql text;

comment on column relatorio_parametro.ie_tipo is 'Tipo do campo no modal ao gerar: I = Input; D = Dropdown (opções do ds_sql).';
comment on column relatorio_parametro.ds_sql is 'Dropdown: SQL das opções; coluna cd = valor passado ao relatório, coluna ds = texto exibido.';
