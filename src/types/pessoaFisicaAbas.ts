/**
 * Abas do duplo clique em Pessoas Físicas: um único registro por pessoa física em cada aba.
 *   Residencial → pessoa_fisica_residencial
 *   Comercial   → pessoa_fisica_comercial
 *   Saúde       → pessoa_fisica_saude
 */

interface RegistroDaPessoaFisica {
  id?: string;
  nr_sequencia?: number;
  nr_seq_pessoa_fisica: number;
  dt_criacao?: string;
  dt_alteracao?: string;
  ds_usuario_criacao?: string;
  ds_usuario_alteracao?: string;
}

/** Endereço residencial ou comercial da pessoa física. */
export interface PessoaFisicaEndereco extends RegistroDaPessoaFisica {
  nr_cep?: string;
  ds_endereco?: string;
  nr_seq_logradouro?: number;
  nr_endereco?: string;
  ds_bairro?: string;
  ds_complemento?: string;
}

/** Informações médicas da pessoa física. */
export interface PessoaFisicaSaude extends RegistroDaPessoaFisica {
  ds_tipo_sanguineo?: string;
  ds_alergia?: string;
  ds_medicamento_continuo?: string;
  ds_restricao_alimentar?: string;
  ds_necessidade_especial?: string;
  ds_observacao_medica?: string;
}
