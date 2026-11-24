-- Quasar: Gerenciador de Relatórios — capa com Código e SQL; bandas no modelo do Tasy.
--
-- Relatório (relatorio):
--   * cd_relatorio  Código do relatório (único, sem diferenciar maiúsculas). Identifica o
--                   relatório na exportação e na importação.
--   * ds_sql        SQL principal: usado pelas bandas que não têm SQL próprio (e pelo XLS
--                   quando não há banda).
--
-- Banda (relatorio_banda):
--   * Tipo (ie_tipo) passa a ser 'cabecalho', 'detalhe' ou 'rodape'. A banda Detalhe se
--     repete uma vez para cada linha do SQL dela: elementos lado a lado formam uma lista;
--     com "Nova página a cada registro", cada registro sai numa página.
--   * nr_seq_banda_superior  Banda (Detalhe) da qual esta depende: para cada linha da banda
--                   superior, o SQL desta roda de novo, e :NOME recebe o valor da coluna
--                   NOME da linha da banda superior.
--   * ie_nova_pagina    'S' = cada registro começa numa página nova.
--   * ie_exibir_label   'S' = antes dos registros, uma linha com o Label de cada elemento
--                       (o cabeçalho das colunas da lista), repetida a cada página.
--   * ie_imprimir_vazio 'S' = sem registros, a banda aparece uma vez (com os campos do SQL
--                       vazios); 'N' = sem registros, a banda não aparece.
--   Conversão das bandas existentes:
--     Lista    → Detalhe com Exibir labels;
--     Conteúdo → Detalhe com Imprimir sem registros (como antes, aparecia mesmo sem dados).

-- ── Relatório ──
alter table relatorio add column cd_relatorio text;
alter table relatorio add column ds_sql text;
create unique index relatorio_cd_relatorio_uk on relatorio (lower(cd_relatorio)) where cd_relatorio is not null;
comment on column relatorio.cd_relatorio is 'Código do relatório (único); identifica o relatório na exportação e importação.';
comment on column relatorio.ds_sql is 'SQL principal do relatório: usado pelas bandas sem SQL próprio.';

-- ── Banda ──
alter table relatorio_banda
  add column nr_seq_banda_superior bigint references relatorio_banda (nr_sequencia) on delete restrict,
  add column ie_nova_pagina    text not null default 'N' check (ie_nova_pagina    in ('S', 'N')),
  add column ie_exibir_label   text not null default 'N' check (ie_exibir_label   in ('S', 'N')),
  add column ie_imprimir_vazio text not null default 'N' check (ie_imprimir_vazio in ('S', 'N'));
alter table relatorio_banda add constraint relatorio_banda_superior_propria_check check (nr_seq_banda_superior <> nr_sequencia);
create index relatorio_banda_nr_seq_banda_superior_idx on relatorio_banda (nr_seq_banda_superior);

alter table relatorio_banda drop constraint if exists relatorio_banda_ie_tipo_check;
update relatorio_banda set ie_tipo = 'detalhe', ie_exibir_label = 'S' where ie_tipo = 'lista';
update relatorio_banda set ie_tipo = 'detalhe', ie_imprimir_vazio = 'S' where ie_tipo = 'conteudo';
alter table relatorio_banda add constraint relatorio_banda_ie_tipo_check check (ie_tipo in ('cabecalho', 'detalhe', 'rodape'));

comment on column relatorio_banda.ie_tipo is 'Tipo da banda: cabecalho, detalhe (repete por registro do SQL) ou rodape.';
comment on column relatorio_banda.nr_seq_banda_superior is 'Banda Detalhe superior: o SQL desta roda para cada linha dela, com :NOME = coluna NOME da linha.';
comment on column relatorio_banda.ie_nova_pagina is 'S = cada registro da banda começa numa página nova.';
comment on column relatorio_banda.ie_exibir_label is 'S = linha com o Label dos elementos antes dos registros (cabeçalho da lista).';
comment on column relatorio_banda.ie_imprimir_vazio is 'S = sem registros, a banda aparece uma vez com os campos do SQL vazios.';
