-- Quasar: Pessoas e Relacionamentos > Fornecedores e Prestadores de Serviço.
--
-- Os campos "Data do status" e "Motivo do status" saem do cadastro (o status passa a ser
-- trocado também pelo menu de contexto: Ativar/Inativar):
--   fornecedor.dt_status, fornecedor.ds_motivo_status
--   prestador_servico.dt_status, prestador_servico.ds_motivo_status
--
-- Esses valores só existiam nos registros copiados de colaboradores Desligados (migração
-- 0045), e continuam no próprio colaborador (colaborador.dt_status / ds_motivo_status). O
-- histórico da auditoria e as cópias das exclusões não mudam.
--
-- Campos x Formulários: sai a regra "Motivo do status" das duas telas nos perfis.

alter table fornecedor drop column dt_status, drop column ds_motivo_status;
alter table prestador_servico drop column dt_status, drop column ds_motivo_status;

update perfil set config_campos = config_campos
    - 'fornecedor.dt_status' - 'fornecedor.ds_motivo_status'
    - 'prestador_servico.dt_status' - 'prestador_servico.ds_motivo_status'
  where config_campos ?| array['fornecedor.dt_status', 'fornecedor.ds_motivo_status', 'prestador_servico.dt_status', 'prestador_servico.ds_motivo_status'];

update perfil set config_campos_alteracao = config_campos_alteracao
    - 'fornecedor.dt_status' - 'fornecedor.ds_motivo_status'
    - 'prestador_servico.dt_status' - 'prestador_servico.ds_motivo_status'
  where config_campos_alteracao ?| array['fornecedor.dt_status', 'fornecedor.ds_motivo_status', 'prestador_servico.dt_status', 'prestador_servico.ds_motivo_status'];
