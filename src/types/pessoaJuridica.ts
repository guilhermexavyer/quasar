export interface PessoaJuridica {
  id?: string;
  nr_sequencia: number;
  ds_razao_social: string;
  ds_nome_fantasia: string;
  nr_cnpj: string;
  nr_inscricao_estadual: string;
  nr_inscricao_municipal: string;
  dt_abertura: string;
  nr_telefone: string;
  ds_email: string;
  nr_cep?: string;
  ds_endereco?: string;
  nr_endereco?: string;
  ds_bairro?: string;
  ds_complemento?: string;
  nr_seq_logradouro?: number;
  sg_estado?: string;
  cd_ibge_cidade?: string;
  dt_criacao: string;
  dt_alteracao: string;
  ds_usuario_criacao?: string;
  ds_usuario_alteracao?: string;
}
