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
  ds_usuario_criacao?: string;
  ds_usuario_alteracao?: string;
  dt_criacao: string;
  dt_alteracao: string;
}
