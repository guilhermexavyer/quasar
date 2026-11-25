-- Quasar: Gerenciador de Relatórios — "Origem" no lugar do "Código".
--
-- Relatório (relatorio):
--   * ie_origem  De onde o relatório veio (campo só exibido, ninguém altera pela tela):
--                  'C' Criação    — criado (ou duplicado) no próprio ambiente (padrão);
--                  'I' Importação — veio de um arquivo exportado por outro ambiente;
--                  'Q' Quasar     — desenvolvido pela equipe do Quasar: não pode ser
--                                   alterado nem excluído (nem as bandas, os elementos e os
--                                   parâmetros dele).
--   * cd_relatorio sai (com o índice único): a exportação/importação não usa mais código.
--     Os relatórios existentes ficam com Origem 'C'.

alter table relatorio
  add column ie_origem text not null default 'C' check (ie_origem in ('C', 'I', 'Q'));
comment on column relatorio.ie_origem is 'C = Criação; I = Importação; Q = Quasar (não pode ser alterado nem excluído).';

drop index if exists relatorio_cd_relatorio_uk;
alter table relatorio drop column if exists cd_relatorio;

-- Regras de campo (Campos x Formulários) do campo que saiu.
update perfil
   set config_campos = config_campos - 'relatorio.cd_relatorio'
 where jsonb_typeof(config_campos) = 'object';
