-- Quasar: Gerenciador de Relatórios > Bandas — campo Ordem.
--
--   * nr_ordem  Ordem das bandas Detalhe no relatório: a de menor Ordem sai primeiro (acima);
--               empate, ou sem Ordem (fica depois das que têm), pela Sequência (nr_sequencia).
--               Vale também entre as bandas dependentes de uma mesma banda superior e, no
--               XLS, para escolher a banda usada (a primeira). Cabeçalho e Rodapé não têm Ordem.

alter table relatorio_banda add column nr_ordem integer check (nr_ordem >= 0);
comment on column relatorio_banda.nr_ordem is 'Ordem das bandas Detalhe (menor primeiro; empate ou vazio: pela Sequência).';
