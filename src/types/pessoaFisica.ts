export type ToastStatus = "success" | "warning" | "error";

export interface PessoaFisica {
  id?: string;
  nr_sequencia: number;
  ds_nome: string;
  nr_cpf: string;
  dt_nascimento: string;
  ds_email: string;
  nr_telefone: string;
  dt_criacao: string;
  dt_alteracao: string;
  ds_usuario_criacao?: string;
  ds_usuario_alteracao?: string;
}
