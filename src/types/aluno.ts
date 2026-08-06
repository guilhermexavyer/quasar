export interface Aluno {
  id?: string;
  nr_sequencia: number;
  /** Pessoa física vinculada (Identificação). */
  nr_seq_pessoa_fisica?: number;
  nr_matricula: string;
  dt_ingresso: string;
  dt_desligamento?: string;
  ds_desligamento?: string;
  ie_status?: string;
  /** Pessoa física responsável (Responsáveis). */
  nr_seq_responsavel?: number;
  nr_telefone?: string;
  ds_email?: string;
  dt_criacao: string;
  dt_alteracao: string;
  ds_usuario_criacao?: string;
  ds_usuario_alteracao?: string;
}
