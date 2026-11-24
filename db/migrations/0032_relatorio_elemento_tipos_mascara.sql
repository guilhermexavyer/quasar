-- Quasar: Gerenciador de Relatórios > Bandas > Elementos — tipos novos, máscara e quebra de linha.
--
--   * Tipo (ie_tipo) ganha:
--       'parametro'  valor do parâmetro do relatório cujo nome está em cd_alias (o informado ao gerar);
--       'pagina'     "Página X de Y";
--       'data_hora'  data e hora da geração;
--       'usuario'    usuário que gerou o relatório;
--       'linha'      linha reta na caixa do elemento (horizontal se Tamanho >= Altura; senão vertical).
--   * ie_mascara         formato do valor (SQL e Parâmetro): 'data', 'data_hora', 'hora', 'numero',
--                        'moeda', 'porcentagem' ou vazio (como o banco devolve).
--   * qt_casas_decimais  casas decimais de Número, Moeda e Porcentagem (vazio = 2).
--   * ie_quebrar_linha   'S' = o texto quebra em várias linhas dentro do Tamanho (largura) do elemento.

alter table relatorio_banda_elemento drop constraint if exists relatorio_banda_elemento_ie_tipo_check;
alter table relatorio_banda_elemento
  add constraint relatorio_banda_elemento_ie_tipo_check
  check (ie_tipo in ('sql', 'conteudo', 'imagem', 'parametro', 'pagina', 'data_hora', 'usuario', 'linha'));

alter table relatorio_banda_elemento
  add column ie_mascara text check (ie_mascara in ('data', 'data_hora', 'hora', 'numero', 'moeda', 'porcentagem')),
  add column qt_casas_decimais integer check (qt_casas_decimais between 0 and 10),
  add column ie_quebrar_linha text not null default 'N' check (ie_quebrar_linha in ('S', 'N'));

comment on column relatorio_banda_elemento.ie_tipo is 'sql = coluna cd_alias do SQL da banda; conteudo = texto de ds_conteudo; imagem = nr_seq_imagem; parametro = parâmetro cd_alias; pagina = Página X de Y; data_hora = data/hora da geração; usuario = usuário que gerou; linha = linha reta.';
comment on column relatorio_banda_elemento.cd_alias is 'Atributo: coluna do SQL da banda (tipo SQL) ou nome do parâmetro (tipo Parâmetro).';
comment on column relatorio_banda_elemento.ie_mascara is 'Formato do valor: data, data_hora, hora, numero, moeda, porcentagem; vazio = como o banco devolve.';
comment on column relatorio_banda_elemento.qt_casas_decimais is 'Casas decimais de Número, Moeda e Porcentagem (vazio = 2).';
comment on column relatorio_banda_elemento.ie_quebrar_linha is 'S = o texto quebra em linhas dentro da largura (Tamanho) do elemento.';
