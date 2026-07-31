export interface Usuario {
  id?: string;
  nr_sequencia: number;
  nr_seq_pessoa_fisica?: number;
  ie_status?: string;
  ds_usuario: string;
  ds_usuario_alternativo: string;
  ds_email?: string;
  ds_senha: string;
  ds_observacao: string;
  dt_criacao: string;
  dt_alteracao: string;
}
