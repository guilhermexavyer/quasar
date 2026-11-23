-- Quasar: Gerenciador de Relatórios > Elementos — tipo Imagem e Descrição.
--
--   * Tipo (ie_tipo) ganha 'imagem': o elemento mostra uma imagem de Administração do
--     Sistema > Imagens (nr_seq_imagem, coluna que já existia), no tamanho de
--     qt_largura x qt_altura (px).
--   * Descrição: ds_elemento (coluna que já existia).

alter table relatorio_banda_elemento drop constraint if exists relatorio_banda_elemento_ie_tipo_check;
alter table relatorio_banda_elemento
  add constraint relatorio_banda_elemento_ie_tipo_check check (ie_tipo in ('sql', 'conteudo', 'imagem'));
comment on column relatorio_banda_elemento.ie_tipo is 'sql = valor da coluna cd_alias do SQL da banda; conteudo = texto de ds_conteudo; imagem = imagem de nr_seq_imagem.';
comment on column relatorio_banda_elemento.nr_seq_imagem is 'Imagem exibida pelo elemento do tipo Imagem (Administração do Sistema > Imagens).';
comment on column relatorio_banda_elemento.ds_elemento is 'Descrição do elemento.';
