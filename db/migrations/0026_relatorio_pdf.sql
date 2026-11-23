-- Quasar: Gerenciador de Relatórios > Relatórios volta a ter o formato PDF.
--
--   * Formato (ie_formato): grava 'xls' ou 'pdf' (o antigo 'excel' vira 'xls').
--   * Página (ie_pagina) sai: o tamanho da folha vem de Cadastros Gerais > Formato do papel
--     (nr_seq_formato_papel, com Largura e Altura em mm).
--   * Orientação (ie_orientacao): 'P' (Padrão: as medidas do formato do papel como estão) ou
--     'I' (Invertido: largura e altura trocadas — o A4 retrato vira paisagem).
--   * Margens (nr_margem_*): agora em centímetros (2,5 = dois centímetros e meio); são a
--     distância entre a borda da folha e o conteúdo do relatório. Os valores antigos (mm)
--     são convertidos.

-- ── Formato ──
alter table relatorio drop constraint if exists relatorio_ie_formato_check;
update relatorio set ie_formato = 'xls' where ie_formato is distinct from 'pdf';
alter table relatorio add constraint relatorio_ie_formato_check check (ie_formato in ('xls', 'pdf'));

-- ── Formato do papel (substitui a Página) ──
alter table relatorio add column nr_seq_formato_papel bigint references cg_formato_papel (nr_sequencia) on delete restrict;
create index relatorio_nr_seq_formato_papel_idx on relatorio (nr_seq_formato_papel);
alter table relatorio drop column ie_pagina;
comment on column relatorio.nr_seq_formato_papel is 'Formato do papel do PDF (cg_formato_papel: largura e altura em mm).';

-- ── Orientação ──
update relatorio
   set ie_orientacao = case ie_orientacao when 'paisagem' then 'I' when 'retrato' then 'P' when 'P' then 'P' when 'I' then 'I' end;
alter table relatorio add constraint relatorio_ie_orientacao_check check (ie_orientacao in ('P', 'I'));
comment on column relatorio.ie_orientacao is 'P = Padrão (medidas do formato do papel); I = Invertido (largura e altura trocadas).';

-- ── Margens (mm → cm) ──
update relatorio
   set nr_margem_superior = nr_margem_superior / 10,
       nr_margem_inferior = nr_margem_inferior / 10,
       nr_margem_esquerda = nr_margem_esquerda / 10,
       nr_margem_direita  = nr_margem_direita / 10;
alter table relatorio
  alter column nr_margem_superior type numeric(6, 2),
  alter column nr_margem_inferior type numeric(6, 2),
  alter column nr_margem_esquerda type numeric(6, 2),
  alter column nr_margem_direita  type numeric(6, 2);
alter table relatorio
  add constraint relatorio_nr_margem_superior_check check (nr_margem_superior >= 0),
  add constraint relatorio_nr_margem_inferior_check check (nr_margem_inferior >= 0),
  add constraint relatorio_nr_margem_esquerda_check check (nr_margem_esquerda >= 0),
  add constraint relatorio_nr_margem_direita_check  check (nr_margem_direita >= 0);
comment on column relatorio.nr_margem_superior is 'Margem superior do PDF em centímetros (distância da borda da folha ao conteúdo).';
comment on column relatorio.nr_margem_inferior is 'Margem inferior do PDF em centímetros (distância da borda da folha ao conteúdo).';
comment on column relatorio.nr_margem_esquerda is 'Margem esquerda do PDF em centímetros (distância da borda da folha ao conteúdo).';
comment on column relatorio.nr_margem_direita  is 'Margem direita do PDF em centímetros (distância da borda da folha ao conteúdo).';

-- Regras de campo (Campos x Formulários): a regra da Página passa para o Formato do papel.
update perfil
   set config_campos = (config_campos - 'relatorio.ie_pagina')
       || case when config_campos ? 'relatorio.ie_pagina'
               then jsonb_build_object('relatorio.nr_seq_formato_papel', config_campos -> 'relatorio.ie_pagina')
               else '{}'::jsonb end
 where jsonb_typeof(config_campos) = 'object';
