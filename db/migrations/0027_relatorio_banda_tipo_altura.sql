-- Quasar: Gerenciador de Relatórios > Relatórios > Bandas (relatórios PDF).
--
--   * Tipo (ie_tipo): 'cabecalho' (Cabeçalho), 'conteudo' (Conteúdo), 'lista' (Lista) ou
--     'rodape' (Rodapé). O Cabeçalho fica no topo da folha (abaixo da margem superior) e o
--     Rodapé no pé (acima da margem inferior).
--   * Altura (qt_altura): altura da banda em pixels (px). No Rodapé, a altura cresce para cima.
--   As colunas antigas do PDF (ie_tipo_banda, nr_altura...) continuam na tabela, sem uso.

alter table relatorio_banda add column ie_tipo text check (ie_tipo in ('cabecalho', 'conteudo', 'lista', 'rodape'));
alter table relatorio_banda add column qt_altura integer check (qt_altura > 0);
comment on column relatorio_banda.ie_tipo is 'Tipo da banda do PDF: cabecalho, conteudo, lista ou rodape.';
comment on column relatorio_banda.qt_altura is 'Altura da banda do PDF em pixels (px).';
