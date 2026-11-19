/** Abas do duplo clique em Pessoas Físicas (Residencial, Comercial e Saúde). */
export type PessoaFisicaAba = 'residencial' | 'comercial' | 'saude';

export const COLECAO_PF_RESIDENCIAL = 'pessoa_fisica_residencial';
export const COLECAO_PF_COMERCIAL = 'pessoa_fisica_comercial';
export const COLECAO_PF_SAUDE = 'pessoa_fisica_saude';

export const PESSOA_FISICA_ABAS: { aba: PessoaFisicaAba; rotulo: string; colecao: string }[] = [
  { aba: 'residencial', rotulo: 'Residencial', colecao: COLECAO_PF_RESIDENCIAL },
  { aba: 'comercial', rotulo: 'Comercial', colecao: COLECAO_PF_COMERCIAL },
  { aba: 'saude', rotulo: 'Saúde', colecao: COLECAO_PF_SAUDE },
];

export function colecaoDaAba(aba: PessoaFisicaAba): string {
  return PESSOA_FISICA_ABAS.find((a) => a.aba === aba)?.colecao ?? COLECAO_PF_RESIDENCIAL;
}

/** Campos do endereço (Residencial e Comercial), na ordem do formulário. */
export const CAMPOS_ENDERECO = ['nr_cep', 'ds_endereco', 'nr_seq_logradouro', 'nr_endereco', 'ds_bairro', 'ds_complemento'] as const;

/** Campos de texto livre (textarea) da aba Saúde, um embaixo do outro. */
export type CampoMedico = 'ds_alergia' | 'ds_medicamento_continuo' | 'ds_restricao_alimentar' | 'ds_necessidade_especial' | 'ds_observacao_medica';

export const CAMPOS_MEDICOS: { campo: CampoMedico; label: string }[] = [
  { campo: 'ds_alergia', label: 'Alergia' },
  { campo: 'ds_medicamento_continuo', label: 'Medicamento de uso contínuo' },
  { campo: 'ds_restricao_alimentar', label: 'Restrição alimentar' },
  { campo: 'ds_necessidade_especial', label: 'Necessidade especial' },
  { campo: 'ds_observacao_medica', label: 'Observações médicas' },
];

/** Campos da aba Saúde, na ordem do formulário. */
export const CAMPOS_SAUDE = ['ds_tipo_sanguineo', ...CAMPOS_MEDICOS.map((c) => c.campo)] as const;

/** Opções do dropdown Tipo sanguíneo. */
export const TIPOS_SANGUINEOS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((t) => ({ value: t, label: t }));

/** Campos que saíram do formulário de Pessoas Físicas (agora ficam nas abas do duplo clique). */
export const CAMPOS_PF_MOVIDOS_PARA_ABAS = new Set<string>([...CAMPOS_ENDERECO, ...CAMPOS_SAUDE]);
