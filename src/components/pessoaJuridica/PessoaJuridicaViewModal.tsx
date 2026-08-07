"use client";

import type { PessoaJuridica } from "@/types/pessoaJuridica";
import { formatCellValuePj } from "@/lib/pessoaJuridicaUtils";

interface PessoaJuridicaViewModalProps {
  pessoa: PessoaJuridica | null;
  /** Lookups de descrição (nr_sequencia → descrição) para campos de referência. */
  cgLookups?: Record<string, Record<number, string>>;
  /** Nome da cidade (cd_ibge_cidade resolvido) — vazio se não informado. */
  cidadeNome?: string;
  onClose: () => void;
}

interface CampoDef {
  key: keyof PessoaJuridica;
  label: string;
  /** Largura no grid (soma 12 por linha). */
  span: number;
}

/** Seções do modal — mesmas seções e distribuição do formulário de Pessoa Jurídica. */
const SECOES: { titulo: string; campos: CampoDef[] }[] = [
  {
    titulo: 'Dados da Empresa',
    campos: [
      { key: 'nr_sequencia', label: 'Sequência', span: 1 },
      { key: 'ds_razao_social', label: 'Razão social', span: 11 },
      { key: 'ds_nome_fantasia', label: 'Nome fantasia', span: 8 },
      { key: 'dt_abertura', label: 'Data de abertura', span: 4 },
    ],
  },
  {
    titulo: 'Documentos',
    campos: [
      { key: 'nr_cnpj', label: 'CNPJ', span: 4 },
      { key: 'nr_inscricao_estadual', label: 'Inscrição estadual', span: 4 },
      { key: 'nr_inscricao_municipal', label: 'Inscrição municipal', span: 4 },
    ],
  },
  {
    titulo: 'Contatos',
    campos: [
      { key: 'nr_telefone', label: 'Telefone', span: 6 },
      { key: 'ds_email', label: 'E-mail', span: 6 },
    ],
  },
  {
    titulo: 'Endereço',
    campos: [
      { key: 'nr_cep', label: 'CEP', span: 3 },
      { key: 'ds_endereco', label: 'Rua', span: 3 },
      { key: 'nr_seq_logradouro', label: 'Logradouro', span: 3 },
      { key: 'nr_endereco', label: 'Número', span: 3 },
      { key: 'ds_bairro', label: 'Bairro', span: 6 },
      { key: 'ds_complemento', label: 'Complemento', span: 6 },
      { key: 'sg_estado', label: 'UF', span: 3 },
      { key: 'cd_ibge_cidade', label: 'Cidade', span: 9 },
    ],
  },
];

// Campos de referência (Cadastros Gerais): mostram a descrição via lookup.
const CAMPOS_REFERENCIA = new Set(['nr_seq_logradouro']);

// Tailwind não gera classes dinâmicas — mapa estático de spans usados.
const SPAN_CLASS: Record<number, string> = {
  1: 'sm:col-span-1',
  3: 'sm:col-span-3',
  4: 'sm:col-span-4',
  6: 'sm:col-span-6',
  8: 'sm:col-span-8',
  9: 'sm:col-span-9',
  11: 'sm:col-span-11',
};

export default function PessoaJuridicaViewModal({
  pessoa,
  cgLookups = {},
  cidadeNome = '',
  onClose,
}: PessoaJuridicaViewModalProps) {
  if (!pessoa) return null;

  function valorDoCampo(key: keyof PessoaJuridica, value: unknown): string {
    if (value === null || value === undefined || value === '') return '';

    // Campos de referência (Cadastros Gerais): mostra a descrição via lookup.
    const lookupKey = key as string;
    if (CAMPOS_REFERENCIA.has(lookupKey)) {
      const desc = cgLookups[lookupKey]?.[Number(value)];
      if (desc) return desc;
    }

    // Cidade: mostra o nome resolvido (ou o código IBGE se não houver nome).
    if (lookupKey === 'cd_ibge_cidade' && cidadeNome) return cidadeNome;

    // formatCellValuePj já trata CNPJ, datas e o fallback para texto.
    return formatCellValuePj(key, value) || String(value);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative w-full max-w-[1000px] bg-white modal-dark p-0 shadow-xl shadow-black/20 max-h-[90vh] flex flex-col">
        <div className="flex-shrink-0 flex items-center justify-between bg-[#ccc] px-[15px]">
          <h3 className="text-base font-semibold" style={{ color: '#000' }}>Pessoa jurídica</h3>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 items-center justify-center rounded-[3px] text-slate-700 transition cursor-pointer p-0 focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#066fc5] focus-visible:outline-offset-2"
            aria-label="Fechar"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18" />
              <path d="M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-[15px] overflow-auto">
          <div className="space-y-8">
            {SECOES.map((secao) => (
              <section key={secao.titulo}>
                <h2 className="mb-3 border-b border-slate-200 pb-1 text-sm font-semibold text-slate-900">{secao.titulo}</h2>
                <div className="grid gap-[15px] sm:grid-cols-12 pt-1">
                  {secao.campos.map((campo) => (
                    <div key={`${secao.titulo}-${campo.label}`} className={`${SPAN_CLASS[campo.span] ?? 'sm:col-span-12'} group`}>
                      <label className="block text-sm mb-1" style={{ color: '#666' }}>{campo.label}</label>
                      <input
                        disabled
                        value={valorDoCampo(campo.key, pessoa[campo.key])}
                        className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm"
                      />
                    </div>
                  ))}
                </div>
              </section>
            ))}

            <div className="text-[13px] text-slate-500">
              <div>Criado por {pessoa.ds_usuario_criacao || '-'} em {valorDoCampo('dt_criacao', pessoa.dt_criacao) || '-'}</div>
              <div className="mt-1">Alterado por {pessoa.ds_usuario_alteracao || '-'} em {valorDoCampo('dt_alteracao', pessoa.dt_alteracao) || '-'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
