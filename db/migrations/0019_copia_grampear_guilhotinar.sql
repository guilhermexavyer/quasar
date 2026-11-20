-- Quasar: Controle de Cópias > Cópias.
--
--   * "Grampeado" passa a ser "Grampear": a coluna ie_grampeado vira ie_grampear (os
--     valores são mantidos). A regra de campo dos perfis (Campos x Formulários) acompanha.
--   * Novo checkbox "Guilhotinar" (ie_guilhotinar): S marcado / N desmarcado; as cópias
--     já cadastradas ficam com N.

alter table copia rename column ie_grampeado to ie_grampear;
alter table copia rename constraint copia_ie_grampeado_check to copia_ie_grampear_check;

alter table copia add column ie_guilhotinar text check (ie_guilhotinar in ('S', 'N'));
update copia set ie_guilhotinar = 'N' where ie_guilhotinar is null;

-- Regra do campo (Campos x Formulários): copia.ie_grampeado → copia.ie_grampear.
update perfil
   set config_campos = (config_campos - 'copia.ie_grampeado')
                       || jsonb_build_object('copia.ie_grampear', config_campos -> 'copia.ie_grampeado')
 where jsonb_typeof(config_campos) = 'object' and config_campos ? 'copia.ie_grampeado';
update perfil
   set config_campos_alteracao = (config_campos_alteracao - 'copia.ie_grampeado')
                                 || jsonb_build_object('copia.ie_grampear', config_campos_alteracao -> 'copia.ie_grampeado')
 where jsonb_typeof(config_campos_alteracao) = 'object' and config_campos_alteracao ? 'copia.ie_grampeado';
