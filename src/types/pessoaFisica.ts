export type ToastStatus = "success" | "warning" | "error";

export interface PessoaFisica {
  id?: string;
  nr_sequencia: number;
  ds_nome: string;
  nr_cpf: string;
  dt_nascimento: string;
  ds_email: string;
  nr_telefone: string;
  nr_seq_sexo?: number;
  nr_seq_estado_civil?: number;
  nr_seq_cor_raca?: number;
  nr_seq_profissao?: number;
  cd_ibge_naturalidade?: string;
  dt_criacao: string;
  dt_alteracao: string;
  ds_usuario_criacao?: string;
  ds_usuario_alteracao?: string;
}
