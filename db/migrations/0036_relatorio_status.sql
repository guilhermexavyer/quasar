-- Quasar: Gerenciador de Relatórios — status (Ativo/Inativo) do relatório, da banda, do
-- elemento e do parâmetro.
--
--   * ie_status  'A' = ativo (padrão), 'I' = inativo. Alterado pelo menu de contexto
--                (Ativar/Inativar). Inativo, o item não tem mais uso:
--                  - relatório: não é gerado;
--                  - banda: não sai no relatório (nem as bandas dependentes dela);
--                  - elemento: não sai no PDF;
--                  - parâmetro: não é perguntado nem usado no SQL (o :nome fica vazio).
--                Na lista, o registro inativo aparece como o colaborador Desligado.

alter table relatorio
  add column ie_status text not null default 'A' check (ie_status in ('A', 'I'));
alter table relatorio_banda
  add column ie_status text not null default 'A' check (ie_status in ('A', 'I'));
alter table relatorio_banda_elemento
  add column ie_status text not null default 'A' check (ie_status in ('A', 'I'));
alter table relatorio_parametro
  add column ie_status text not null default 'A' check (ie_status in ('A', 'I'));

comment on column relatorio.ie_status is 'A = ativo; I = inativo (não é gerado).';
comment on column relatorio_banda.ie_status is 'A = ativa; I = inativa (não sai no relatório, nem as dependentes).';
comment on column relatorio_banda_elemento.ie_status is 'A = ativo; I = inativo (não sai no PDF).';
comment on column relatorio_parametro.ie_status is 'A = ativo; I = inativo (não é perguntado; o :nome fica vazio).';
