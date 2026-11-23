-- Quasar: Gerenciador de Relatórios > Bandas e Elementos — bordas por lado.
--
--   * ie_borda_superior, ie_borda_inferior, ie_borda_esquerda, ie_borda_direita
--     ('S'/'N', padrão 'N') na banda (relatorio_banda) e no elemento
--     (relatorio_banda_elemento). Marcada, o PDF desenha a borda daquele lado,
--     igual à "Sólida fina" do campo Borda do relatório.
--   * Na banda as colunas já existiam (boolean, da versão antiga, sem uso): passam
--     para 'S'/'N' (true = 'S'; false ou vazio = 'N'), como ie_obrigatorio na 0024.

alter table relatorio_banda
  alter column ie_borda_superior type text using case when ie_borda_superior then 'S' else 'N' end,
  alter column ie_borda_inferior type text using case when ie_borda_inferior then 'S' else 'N' end,
  alter column ie_borda_esquerda type text using case when ie_borda_esquerda then 'S' else 'N' end,
  alter column ie_borda_direita type text using case when ie_borda_direita then 'S' else 'N' end;
alter table relatorio_banda
  alter column ie_borda_superior set default 'N',
  alter column ie_borda_superior set not null,
  add constraint relatorio_banda_ie_borda_superior_check check (ie_borda_superior in ('S', 'N')),
  alter column ie_borda_inferior set default 'N',
  alter column ie_borda_inferior set not null,
  add constraint relatorio_banda_ie_borda_inferior_check check (ie_borda_inferior in ('S', 'N')),
  alter column ie_borda_esquerda set default 'N',
  alter column ie_borda_esquerda set not null,
  add constraint relatorio_banda_ie_borda_esquerda_check check (ie_borda_esquerda in ('S', 'N')),
  alter column ie_borda_direita set default 'N',
  alter column ie_borda_direita set not null,
  add constraint relatorio_banda_ie_borda_direita_check check (ie_borda_direita in ('S', 'N'));
comment on column relatorio_banda.ie_borda_superior is 'S = borda (sólida fina) no lado superior da banda.';
comment on column relatorio_banda.ie_borda_inferior is 'S = borda (sólida fina) no lado inferior da banda.';
comment on column relatorio_banda.ie_borda_esquerda is 'S = borda (sólida fina) no lado esquerdo da banda.';
comment on column relatorio_banda.ie_borda_direita  is 'S = borda (sólida fina) no lado direito da banda.';

alter table relatorio_banda_elemento
  add column ie_borda_superior text not null default 'N' check (ie_borda_superior in ('S', 'N')),
  add column ie_borda_inferior text not null default 'N' check (ie_borda_inferior in ('S', 'N')),
  add column ie_borda_esquerda text not null default 'N' check (ie_borda_esquerda in ('S', 'N')),
  add column ie_borda_direita  text not null default 'N' check (ie_borda_direita  in ('S', 'N'));
comment on column relatorio_banda_elemento.ie_borda_superior is 'S = borda (sólida fina) no lado superior do elemento.';
comment on column relatorio_banda_elemento.ie_borda_inferior is 'S = borda (sólida fina) no lado inferior do elemento.';
comment on column relatorio_banda_elemento.ie_borda_esquerda is 'S = borda (sólida fina) no lado esquerdo do elemento.';
comment on column relatorio_banda_elemento.ie_borda_direita  is 'S = borda (sólida fina) no lado direito do elemento.';
