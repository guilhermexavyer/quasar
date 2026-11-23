-- Quasar: Gerenciador de Relatórios > Relatórios > Bandas > Elementos (relatórios PDF).
--
--   * Banda: só um Cabeçalho e um Rodapé por relatório.
--   * Elemento (relatorio_banda_elemento), campos novos:
--       ie_tipo      'sql' (valor da coluna cd_alias do SQL da banda) ou 'conteudo' (texto de ds_conteudo);
--       qt_altura    altura em pixels (px);
--       ds_label     na banda Lista, o nome da coluna (cabeçalho da lista);
--       cd_alias     coluna do SQL da banda exibida pelo elemento;
--       ds_conteudo  texto fixo do elemento do tipo Conteúdo.
--     Reaproveitados: qt_esquerda, qt_topo, qt_largura (px), ie_estilo, ie_alinhamento,
--     cd_cor, cd_background e ie_fonte. As colunas antigas continuam na tabela, sem uso.

-- ── Banda: um Cabeçalho e um Rodapé por relatório ──
create unique index relatorio_banda_cabecalho_rodape_uk
  on relatorio_banda (nr_seq_relatorio, ie_tipo)
  where ie_tipo in ('cabecalho', 'rodape');

-- ── Elemento ──
alter table relatorio_banda_elemento add column ie_tipo text check (ie_tipo in ('sql', 'conteudo'));
alter table relatorio_banda_elemento add column qt_altura integer check (qt_altura > 0);
alter table relatorio_banda_elemento add column ds_label text;
alter table relatorio_banda_elemento add column cd_alias text;
alter table relatorio_banda_elemento add column ds_conteudo text;
comment on column relatorio_banda_elemento.ie_tipo is 'sql = valor da coluna cd_alias do SQL da banda; conteudo = texto de ds_conteudo.';
comment on column relatorio_banda_elemento.qt_altura is 'Altura do elemento em pixels (px).';
comment on column relatorio_banda_elemento.ds_label is 'Banda Lista: nome da coluna (cabeçalho da lista).';
comment on column relatorio_banda_elemento.cd_alias is 'Coluna (alias) do SQL da banda exibida pelo elemento.';
comment on column relatorio_banda_elemento.ds_conteudo is 'Texto exibido pelo elemento do tipo Conteúdo.';
comment on column relatorio_banda_elemento.qt_esquerda is 'Distância da margem esquerda (início da banda) em pixels (px).';
comment on column relatorio_banda_elemento.qt_topo is 'Distância do topo da banda em pixels (px).';
comment on column relatorio_banda_elemento.qt_largura is 'Largura do elemento em pixels (px).';
