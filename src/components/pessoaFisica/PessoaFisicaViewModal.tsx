"use client";

import type { PessoaFisica } from "@/types/pessoaFisica";
import { formatCellValue, parsePersonDateValue } from "@/lib/pessoaFisicaUtils";

interface PessoaFisicaViewModalProps {
  pessoa: PessoaFisica | null;
  /** Lookups de descrição (nr_sequencia → descrição) para os campos de referência. */
  cgLookups?: Record<string, Record<number, string>>;
  onClose: () => void;
}

interface CampoDef {
  key: keyof PessoaFisica;
  label: string;
  /** Largura no grid (soma 12 por linha). */
  span: number;
  /** Valor computado (não vem direto da pessoa) — ex.: Idade. */
  computado?: (pessoa: PessoaFisica) => string;
}

/** Calcula a idade (anos completos) a partir da data de nascimento. */
function calcularIdade(nascimento: unknown): string {
  const ymd = parsePersonDateValue(String(nascimento ?? ''));
  if (ymd === null) return '';
  const ano = Math.floor(ymd / 10000);
  const mes = Math.floor((ymd % 10000) / 100);
  const dia = ymd % 100;
  const hoje = new Date();
  let idade = hoje.getFullYear() - ano;
  if (hoje.getMonth() + 1 < mes || (hoje.getMonth() + 1 === mes && hoje.getDate() < dia)) {
    idade -= 1;
  }
  return idade >= 0 ? String(idade) : '';
}

/** Seções do modal — mesmas seções e distribuição do formulário de Pessoa Física. */
const SECOES: { titulo: string; campos: CampoDef[] }[] = [
  {
    titulo: 'Dados Pessoais',
    campos: [
      { key: 'nr_sequencia', label: 'Sequência', span: 1 },
      { key: 'ds_nome', label: 'Nome completo', span: 5 },
      { key: 'dt_nascimento', label: 'Nascimento', span: 2 },
      { key: 'dt_nascimento', label: 'Idade', span: 1, computado: (p) => calcularIdade(p.dt_nascimento) },
      { key: 'nr_seq_sexo', label: 'Sexo', span: 3 },
      { key: 'nr_seq_estado_civil', label: 'Estado civil', span: 3 },
      { key: 'nr_seq_cor_raca', label: 'Cor/Raça', span: 3 },
      { key: 'nr_seq_profissao', label: 'Profissão', span: 3 },
      { key: 'cd_ibge_naturalidade', label: 'Naturalidade', span: 3 },
    ],
  },
  {
    titulo: 'Documentos',
    campos: [
      { key: 'nr_cpf', label: 'CPF', span: 4 },
      { key: 'nr_rg', label: 'RG', span: 4 },
      { key: 'dt_emissao', label: 'Data de emissão', span: 4 },
      { key: 'nr_seq_orgao_emissor', label: 'Órgão emissor', span: 9 },
      { key: 'sg_estado', label: 'UF', span: 3 },
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
      { key: 'ds_endereco', label: 'Rua', span: 9 },
      { key: 'nr_seq_logradouro', label: 'Logradouro', span: 6 },
      { key: 'nr_endereco', label: 'Número', span: 3 },
      { key: 'ds_bairro', label: 'Bairro', span: 3 },
      { key: 'ds_complemento', label: 'Complemento', span: 12 },
    ],
  },
];

// Campos de referência (Cadastros Gerais): mostram a descrição via lookup.
const CAMPOS_REFERENCIA = new Set([
  'nr_seq_sexo',
  'nr_seq_estado_civil',
  'nr_seq_cor_raca',
  'nr_seq_profissao',
  'nr_seq_orgao_emissor',
  'nr_seq_logradouro',
]);

// Tailwind não gera classes dinâmicas — mapa estático de spans usados.
const SPAN_CLASS: Record<number, string> = {
  1: 'sm:col-span-1',
  2: 'sm:col-span-2',
  3: 'sm:col-span-3',
  4: 'sm:col-span-4',
  5: 'sm:col-span-5',
  6: 'sm:col-span-6',
  9: 'sm:col-span-9',
  12: 'sm:col-span-12',
};

export default function PessoaFisicaViewModal({ pessoa, cgLookups = {}, onClose }: PessoaFisicaViewModalProps) {
  if (!pessoa) return null;

  function valorDoCampo(key: keyof PessoaFisica, value: unknown): string {
    if (value === null || value === undefined || value === '') return '';

    // Campos de referência (Cadastros Gerais): mostra a descrição via lookup.
    const lookupKey = key as string;
    if (CAMPOS_REFERENCIA.has(lookupKey)) {
      const desc = cgLookups[lookupKey]?.[Number(value)];
      if (desc) return desc;
    }

    // formatCellValue já trata CPF, telefone, datas e o fallback para texto.
    return formatCellValue(key, value) || String(value);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative w-full max-w-[1000px] bg-white modal-dark p-0 shadow-xl shadow-black/20 max-h-[90vh] flex flex-col">
        <div className="flex-shrink-0 flex items-center justify-between bg-[#ccc] px-[15px]">
          <h3 className="text-base font-semibold" style={{ color: '#000' }}>Pessoa física</h3>
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
                        value={campo.computado ? campo.computado(pessoa) : valorDoCampo(campo.key, pessoa[campo.key])}
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
