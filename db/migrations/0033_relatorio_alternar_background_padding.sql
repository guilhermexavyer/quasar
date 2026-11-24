-- Quasar: Gerenciador de Relatórios — linhas alternadas na banda e padding no elemento.
--
-- Banda (relatorio_banda):
--   * ie_alternar_background  'S' = na banda Detalhe, os registros alternam o fundo: um
--                             transparente e o seguinte cinza (#cccccc), na largura da banda.
--
-- Elemento (relatorio_banda_elemento):
--   * qt_padding_superior, qt_padding_inferior, qt_padding_esquerda, qt_padding_direita
--     Distância (px) entre a borda da caixa do elemento e o texto, em cada direção.
--   Na banda Detalhe com Exibir labels, Estilo, Cor e Background valem só para o label (o
--   nome da coluna); os registros saem no estilo padrão. Isso é regra do PDF, sem coluna nova.

alter table relatorio_banda
  add column ie_alternar_background text not null default 'N' check (ie_alternar_background in ('S', 'N'));
comment on column relatorio_banda.ie_alternar_background is 'S = registros da banda Detalhe com fundo alternado (transparente e #cccccc).';

alter table relatorio_banda_elemento
  add column qt_padding_superior integer check (qt_padding_superior >= 0),
  add column qt_padding_inferior integer check (qt_padding_inferior >= 0),
  add column qt_padding_esquerda integer check (qt_padding_esquerda >= 0),
  add column qt_padding_direita  integer check (qt_padding_direita  >= 0);
comment on column relatorio_banda_elemento.qt_padding_superior is 'Distância (px) entre a borda superior do elemento e o texto.';
comment on column relatorio_banda_elemento.qt_padding_inferior is 'Distância (px) entre a borda inferior do elemento e o texto.';
comment on column relatorio_banda_elemento.qt_padding_esquerda is 'Distância (px) entre a borda esquerda do elemento e o texto.';
comment on column relatorio_banda_elemento.qt_padding_direita  is 'Distância (px) entre a borda direita do elemento e o texto.';
