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
  nr_rg?: string;
  dt_emissao?: string;
  nr_seq_orgao_emissor?: number;
  sg_estado?: string;
  cd_ibge_naturalidade?: string;
  nr_cep?: string;
  ds_endereco?: string;
  nr_endereco?: string;
  ds_bairro?: string;
  ds_complemento?: string;
  nr_seq_logradouro?: number;
  dt_criacao: string;
  dt_alteracao: string;
  ds_usuario_criacao?: string;
  ds_usuario_alteracao?: string;
}
