-- Quasar: Gerenciador de Relatórios > Bandas > Elementos — campo Camada.
--
--   * nr_camada  Camada do elemento no PDF: quando elementos se sobrepõem, o de menor Camada
--                sai por cima (visível). Empate, ou sem Camada (fica abaixo dos que têm), sai
--                por cima o de menor Sequência (nr_sequencia).

alter table relatorio_banda_elemento add column nr_camada integer check (nr_camada >= 0);
comment on column relatorio_banda_elemento.nr_camada is 'Camada do elemento (menor por cima; empate ou vazio: menor Sequência por cima).';
