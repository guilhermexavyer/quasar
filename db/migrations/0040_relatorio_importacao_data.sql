-- Quasar: Gerenciador de Relatórios > Importar relatório — a data exibida é a da importação.
--
--   * dt_exportacao → dt_importacao: quando o relatório foi importado neste ambiente (a
--     data da exportação, no ambiente de origem, deixa de ser guardada). As importações já
--     feitas ficam com a data de criação do registro, que é a da importação.

alter table relatorio_importacao rename column dt_exportacao to dt_importacao;
update relatorio_importacao set dt_importacao = dt_criacao;
comment on column relatorio_importacao.dt_importacao is 'Data e hora da importação.';
