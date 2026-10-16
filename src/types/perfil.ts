export interface Perfil {
  id?: string;
  nr_sequencia: number;
  ds_perfil: string;
  ds_observacao: string;
  ie_status?: string;
  /* Funções delegadas ao perfil (nomes padronizados: JSON de SectionType[]) */
  config_funcoes?: string;
  /* Configuração de campos por função (JSON: `colecao.campo` → N/O/D) */
  config_campos?: string;
  /* Última alteração de status de cada campo (JSON: `colecao.campo` → { dt_alteracao, ds_usuario_alteracao }) */
  config_campos_alteracao?: string;
  /* Permissões por função (JSON: `funcao` → [chaves de permissão concedidas]) */
  config_permissoes?: string;
  /* Versão do formato de config_permissoes (controle da migração automática) */
  config_permissoes_v?: number;
  ds_usuario_criacao?: string;
  ds_usuario_alteracao?: string;
  dt_criacao: string;
  dt_alteracao: string;
}
