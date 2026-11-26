"use client";

import { useEffect, useRef, useState } from "react";
import type { PessoaFisica } from "@/types/pessoaFisica";
import type { PessoaFisicaEndereco, PessoaFisicaSaude } from "@/types/pessoaFisicaAbas";
import type { CampoStatus } from "@/lib/camposConfigUtils";
import type { CgSelectOption } from "@/components/pessoaFisica/PessoaFisicaFormView";
import {
  CAMPOS_ENDERECO,
  CAMPOS_MEDICOS,
  CAMPOS_SAUDE,
  PESSOA_FISICA_ABAS,
  TIPOS_SANGUINEOS,
  colecaoDaAba,
  type CampoMedico,
  type PessoaFisicaAba,
} from "@/lib/pessoaFisicaAbasUtils";
import { applyCepMask, formatDate } from "@/lib/pessoaFisicaUtils";
import { obterRegistroDaAba, salvarRegistroDaAba } from "@/services/pessoaFisicaAbasService";
import { buscarEnderecoPorCep } from "@/services/cepService";
import Select from "@/components/ui/Select";
import RotuloCampo from "@/components/ui/RotuloCampo";
import RequiredAsterisk from "@/components/ui/RequiredAsterisk";
import LoadingModal from "@/components/ui/LoadingModal";
import { elementoVisivel } from "@/lib/visibilidade";
import NavegacaoRegistros from "@/components/ui/NavegacaoRegistros";
import AbasRegistros from "@/components/ui/AbasRegistros";

/** Valores do formulário de qualquer aba (endereço ou saúde). */
type FormAba = PessoaFisicaEndereco & PessoaFisicaSaude;

interface PessoaFisicaDetalheViewProps {
  pessoa: PessoaFisica;
  selectOptions: { value: string; label: string }[];
  manageSelection: string;
  onManageSelectionChange: (v: string) => void;
  allowedSubmodulos?: string[];
  /** Navegação entre as pessoas físicas (setas). */
  onPrevRecord: () => void;
  onNextRecord: () => void;
  hasPrevRecord: boolean;
  hasNextRecord: boolean;
  /** Volta para a lista de pessoas físicas (breadcrumb e Cancelar). */
  onVoltar: () => void;
  /** Aba aberta ao montar (mantida ao alternar entre registros pelas setas). */
  abaInicial?: PessoaFisicaAba;
  onAbaChange?: (aba: PessoaFisicaAba) => void;
  /** Opções do dropdown Logradouro (Cadastros Gerais). */
  logradouros?: CgSelectOption[];
  /** Regras de campos do perfil ativo para a coleção da aba. */
  regrasDaColecao?: (colecao: string) => Record<string, CampoStatus>;
  /** Abre o histórico de auditoria do registro da aba. */
  onOpenAudit?: (colecao: string, id: string) => void;
  resolverNomeAutor?: (nome: string) => string;
  onMessage: (mensagem: string) => void;
  onSavingChange?: (saving: boolean) => void;
  darkMode?: boolean;
}

/** Normaliza um texto para comparação (sem acentos e pontuação, maiúsculas). */
function normalizarToken(valor: string): string {
  return valor.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z]/g, '').toUpperCase();
}

/** Dados gravados de cada aba (sem os campos de controle). */
function dadosDaAba(aba: PessoaFisicaAba, form: FormAba): Partial<FormAba> {
  if (aba === 'saude') {
    const texto = (campo: CampoMedico) => (form[campo] ?? '').trim();
    return {
      ds_tipo_sanguineo: form.ds_tipo_sanguineo ?? '',
      ds_alergia: texto('ds_alergia'),
      ds_medicamento_continuo: texto('ds_medicamento_continuo'),
      ds_restricao_alimentar: texto('ds_restricao_alimentar'),
      ds_necessidade_especial: texto('ds_necessidade_especial'),
      ds_observacao_medica: texto('ds_observacao_medica'),
    };
  }
  return {
    nr_cep: form.nr_cep ?? '',
    ds_endereco: (form.ds_endereco ?? '').trim(),
    nr_seq_logradouro: form.nr_seq_logradouro,
    nr_endereco: (form.nr_endereco ?? '').trim(),
    ds_bairro: (form.ds_bairro ?? '').trim(),
    ds_complemento: (form.ds_complemento ?? '').trim(),
  };
}

/** Campo obrigatório vazio? */
function vazio(valor: unknown): boolean {
  return valor === undefined || valor === null || String(valor).trim() === '';
}

/**
 * Duplo clique em Pessoas Físicas: abas Residencial, Comercial e Saúde. Cada aba tem um
 * único registro por pessoa física, então não há lista: o formulário abre direto (o botão
 * Adicionar fica visível, mas desabilitado). Dropdown pai, setas e breadcrumb como nas
 * demais telas de duplo clique.
 */
export default function PessoaFisicaDetalheView({
  pessoa,
  selectOptions,
  manageSelection,
  onManageSelectionChange,
  allowedSubmodulos = ['pessoasFisicas', 'pessoasJuridicas'],
  onPrevRecord,
  onNextRecord,
  hasPrevRecord,
  hasNextRecord,
  onVoltar,
  abaInicial,
  onAbaChange,
  logradouros = [],
  regrasDaColecao = () => ({}),
  onOpenAudit,
  resolverNomeAutor = (nome) => nome,
  onMessage,
  onSavingChange,
}: PessoaFisicaDetalheViewProps) {
  const [aba, setAba] = useState<PessoaFisicaAba>(abaInicial ?? 'residencial');
  const colecao = colecaoDaAba(aba);
  /** Registro gravado da aba (null = ainda não cadastrado). */
  const [registro, setRegistro] = useState<FormAba | null>(null);
  const [form, setForm] = useState<FormAba>({ nr_seq_pessoa_fisica: pessoa.nr_sequencia });
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erros, setErros] = useState<string[]>([]);
  const [cepCarregando, setCepCarregando] = useState(false);
  const formRef = useRef<HTMLFormElement | null>(null);
  /** CEP já tratado: a busca no ViaCEP só ocorre quando o usuário muda o CEP. */
  const cepAnteriorRef = useRef<string>('');

  // Carrega o registro da aba ao abrir e ao trocar de aba.
  useEffect(() => {
    let cancelado = false;
    setCarregando(true);
    setErros([]);
    obterRegistroDaAba<FormAba>(colecao, pessoa.nr_sequencia)
      .then((r) => {
        if (cancelado) return;
        setRegistro(r);
        const inicial = r ?? { nr_seq_pessoa_fisica: pessoa.nr_sequencia };
        cepAnteriorRef.current = inicial.nr_cep ?? '';
        setForm(inicial);
      })
      .catch(() => { if (!cancelado) onMessage('Erro ao carregar registros.'); })
      .finally(() => { if (!cancelado) setCarregando(false); });
    return () => { cancelado = true; };
    // onMessage é estável o suficiente; recarrega só ao trocar de pessoa ou de aba.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [colecao, pessoa.nr_sequencia]);

  useEffect(() => { onSavingChange?.(salvando); }, [salvando, onSavingChange]);

  // Ctrl+S salva a aba aberta (só o que está visível na tela).
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (!(e.ctrlKey || e.metaKey) || e.key.toLowerCase() !== 's') return;
      const f = formRef.current;
      if (!f || !elementoVisivel(f)) return;
      e.preventDefault();
      if (!salvando) f.requestSubmit();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [salvando]);

  // Apenas itens Ativos (Cadastros Gerais), em ordem alfabética.
  const opcoesLogradouro = logradouros
    .filter((op) => (op.ie_status === 'A' || !op.ie_status || op.nr_sequencia === form.nr_seq_logradouro) && typeof op.descricao === 'string' && op.descricao.trim() !== '')
    .sort((a, b) => a.descricao.localeCompare(b.descricao, 'pt-BR', { sensitivity: 'base' }));

  /** Tipo de logradouro a partir do nome da rua do ViaCEP ("Rua das Flores" → Rua). */
  function inferirLogradouro(rua: string): number | undefined {
    const token = normalizarToken(rua.split(' ')[0] ?? '');
    if (!token) return undefined;
    let melhor: { seq: number; pontos: number } | null = null;
    for (const op of opcoesLogradouro) {
      const desc = normalizarToken(op.descricao);
      const sigla = normalizarToken(op.sigla ?? '');
      let pontos = 0;
      if (desc === token) pontos = 3;
      else if (sigla && sigla === token) pontos = 2;
      else if (desc.startsWith(token) && token.length >= 2) pontos = 1;
      if (pontos > 0 && (!melhor || pontos > melhor.pontos)) melhor = { seq: op.nr_sequencia, pontos };
    }
    return melhor?.seq;
  }

  // CEP completo informado: busca Rua e Bairro no ViaCEP (não busca ao abrir um registro salvo).
  useEffect(() => {
    if (aba === 'saude') return;
    const atual = form.nr_cep ?? '';
    if (atual === cepAnteriorRef.current) return;
    cepAnteriorRef.current = atual;
    const digitos = atual.replace(/[^0-9]/g, '');
    if (digitos.length !== 8) { setCepCarregando(false); return; }
    let cancelado = false;
    setCepCarregando(true);
    buscarEnderecoPorCep(digitos)
      .then((endereco) => {
        if (cancelado || !endereco) return;
        setForm((prev) => ({
          ...prev,
          ds_endereco: endereco.logradouro,
          ds_bairro: endereco.bairro,
          nr_seq_logradouro: inferirLogradouro(endereco.logradouro) ?? prev.nr_seq_logradouro,
        }));
      })
      .catch(() => { /* CEP não encontrado ou sem conexão: mantém os campos */ })
      .finally(() => { if (!cancelado) setCepCarregando(false); });
    return () => { cancelado = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.nr_cep, aba]);

  const regras = regrasDaColecao(colecao);
  const statusDe = (campo: string): CampoStatus => regras[campo] ?? 'N';
  const asterisco = (campo: string) => (statusDe(campo) === 'O' ? <RequiredAsterisk /> : undefined);
  const classeCampo = (campo: string, extra = '') =>
    `w-full rounded-[3px] border ${erros.includes(campo) ? 'border-red-500' : 'border-slate-300'} bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none disabled:cursor-default disabled:bg-slate-100 disabled:text-slate-500 ${extra}`;

  function trocarAba(nova: PessoaFisicaAba) {
    if (nova === aba) return;
    setAba(nova);
    onAbaChange?.(nova);
  }

  async function salvar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (salvando || carregando) return;
    const campos: readonly string[] = aba === 'saude' ? CAMPOS_SAUDE : CAMPOS_ENDERECO;
    const faltando = campos.filter((c) => statusDe(c) === 'O' && vazio(form[c as keyof FormAba]));
    setErros(faltando);
    if (faltando.length > 0) {
      onMessage('Preencha os campos obrigatórios.');
      return;
    }
    setSalvando(true);
    try {
      const gravado = await salvarRegistroDaAba<FormAba>(colecao, pessoa.nr_sequencia, registro?.id, dadosDaAba(aba, form));
      if (gravado) {
        setRegistro(gravado);
        cepAnteriorRef.current = gravado.nr_cep ?? '';
        setForm(gravado);
      }
      onMessage(registro ? 'Registro alterado com sucesso!' : 'Registro criado com sucesso!');
    } catch {
      onMessage('Erro ao salvar.');
    } finally {
      setSalvando(false);
    }
  }

  const classeSeta = (ativa: boolean) =>
    `inline-flex items-center justify-center rounded-[3px] border border-slate-300 bg-[#ddd] px-[5px] py-[5px] text-sm text-black cursor-pointer ${ativa ? 'hover:bg-slate-300' : 'opacity-40'}`;

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* ── Barra superior: dropdown pai, setas, breadcrumb, abas e Adicionar ── */}
      <div className="flex items-center justify-between gap-3 min-h-[42px]">
        <div className="flex items-center gap-2 min-w-0">
          <Select
            value={manageSelection}
            onChange={onManageSelectionChange}
            options={selectOptions.filter((o) => allowedSubmodulos.includes(o.value))}
            disabled
            showPlaceholder={false}
            className="!w-[220px]"
          />
          <div className="flex items-center gap-1">
            <button type="button" onClick={onPrevRecord} disabled={!hasPrevRecord} className={classeSeta(hasPrevRecord)} style={{ borderBottomColor: '#000' }} aria-label="Registro anterior">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18 9 12l6-6" /></svg>
            </button>
            <button type="button" onClick={onNextRecord} disabled={!hasNextRecord} className={classeSeta(hasNextRecord)} style={{ borderBottomColor: '#000' }} aria-label="Próximo registro">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18 15 12 9 6" /></svg>
            </button>
          </div>
          <NavegacaoRegistros
            className="ml-2"
            itens={[{ chave: 'pessoa', texto: `Pessoa física: ${pessoa.nr_sequencia ?? ''} ${pessoa.ds_nome ?? ''}`, onClick: onVoltar }]}
          />
        </div>
        <div className="flex items-center gap-3">
          <AbasRegistros abas={PESSOA_FISICA_ABAS.map(({ aba: a, rotulo }) => ({ valor: a, rotulo }))} ativa={aba} onChange={trocarAba} />
          {/* Um único registro por aba: o Adicionar fica visível, mas desabilitado. */}
          <button
            type="button"
            disabled
            className="inline-flex items-center rounded-[3px] border border-transparent bg-transparent px-4 py-2.5 text-sm font-normal text-[#066fc5] transition cursor-default opacity-40"
          >
            Adicionar
          </button>
        </div>
      </div>

      {carregando && <LoadingModal open message="Carregando..." />}

      <form ref={formRef} onSubmit={salvar} className="mt-6 flex-1 flex flex-col min-h-0">
        <div className="flex-1 min-h-0 overflow-y-auto pr-1">
          {aba === 'saude' ? (
            <div className="grid gap-[15px] sm:grid-cols-12 pt-2">
              <div className="sm:col-span-1">
                <RotuloCampo texto="Sequência" colecao={colecao} campo="nr_sequencia" />
                <input disabled value={String(registro?.nr_sequencia ?? '')} className="w-full rounded-[3px] border border-slate-300 px-2 py-1.5 text-sm transition focus:outline-none" />
              </div>
              <div className="sm:col-span-11">
                <RotuloCampo texto="Tipo sanguíneo" colecao={colecao} campo="ds_tipo_sanguineo" prefixo={asterisco('ds_tipo_sanguineo')} />
                <Select
                  disabled={statusDe('ds_tipo_sanguineo') === 'D'}
                  error={erros.includes('ds_tipo_sanguineo')}
                  value={form.ds_tipo_sanguineo ?? ''}
                  onChange={(v) => setForm({ ...form, ds_tipo_sanguineo: v })}
                  options={TIPOS_SANGUINEOS}
                  visibleOptions={5}
                  showPlaceholder
                />
              </div>

              {CAMPOS_MEDICOS.map((cfg) => (
                <div key={cfg.campo} className="sm:col-span-12">
                  <RotuloCampo texto={cfg.label} colecao={colecao} campo={cfg.campo} prefixo={asterisco(cfg.campo)} />
                  <textarea
                    rows={3}
                    disabled={statusDe(cfg.campo) === 'D'}
                    className={classeCampo(cfg.campo, 'resize-none')}
                    value={form[cfg.campo] ?? ''}
                    onChange={(e) => setForm({ ...form, [cfg.campo]: e.target.value })}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid gap-[15px] sm:grid-cols-12 pt-2">
              <div className="sm:col-span-1">
                <RotuloCampo texto="Sequência" colecao={colecao} campo="nr_sequencia" />
                <input disabled value={String(registro?.nr_sequencia ?? '')} className="w-full rounded-[3px] border border-slate-300 px-2 py-1.5 text-sm transition focus:outline-none" />
              </div>
              <div className="sm:col-span-2">
                <RotuloCampo texto="CEP" colecao={colecao} campo="nr_cep" prefixo={asterisco('nr_cep')} />
                <input
                  inputMode="numeric"
                  maxLength={9}
                  disabled={statusDe('nr_cep') === 'D'}
                  className={classeCampo('nr_cep')}
                  value={form.nr_cep ?? ''}
                  onChange={(e) => setForm({ ...form, nr_cep: applyCepMask(e.target.value) })}
                />
              </div>
              <div className="sm:col-span-6">
                <RotuloCampo texto="Rua" colecao={colecao} campo="ds_endereco" prefixo={asterisco('ds_endereco')} />
                <input
                  disabled={statusDe('ds_endereco') === 'D'}
                  className={classeCampo('ds_endereco', cepCarregando ? 'opacity-50' : '')}
                  value={form.ds_endereco ?? ''}
                  onChange={(e) => setForm({ ...form, ds_endereco: e.target.value })}
                />
              </div>
              <div className="sm:col-span-3">
                <RotuloCampo texto="Logradouro" colecao={colecao} campo="nr_seq_logradouro" prefixo={asterisco('nr_seq_logradouro')} />
                <Select
                  disabled={statusDe('nr_seq_logradouro') === 'D'}
                  error={erros.includes('nr_seq_logradouro')}
                  value={form.nr_seq_logradouro ? String(form.nr_seq_logradouro) : ''}
                  onChange={(v) => setForm({ ...form, nr_seq_logradouro: v ? Number(v) : undefined })}
                  options={opcoesLogradouro.map((op) => ({ value: String(op.nr_sequencia), label: op.descricao }))}
                />
              </div>
              <div className="sm:col-span-2">
                <RotuloCampo texto="Número" colecao={colecao} campo="nr_endereco" prefixo={asterisco('nr_endereco')} />
                <input
                  maxLength={10}
                  disabled={statusDe('nr_endereco') === 'D'}
                  className={classeCampo('nr_endereco')}
                  value={form.nr_endereco ?? ''}
                  onChange={(e) => setForm({ ...form, nr_endereco: e.target.value })}
                />
              </div>
              <div className="sm:col-span-4">
                <RotuloCampo texto="Bairro" colecao={colecao} campo="ds_bairro" prefixo={asterisco('ds_bairro')} />
                <input
                  disabled={statusDe('ds_bairro') === 'D'}
                  className={classeCampo('ds_bairro', cepCarregando ? 'opacity-50' : '')}
                  value={form.ds_bairro ?? ''}
                  onChange={(e) => setForm({ ...form, ds_bairro: e.target.value })}
                />
              </div>
              <div className="sm:col-span-6">
                <RotuloCampo texto="Complemento" colecao={colecao} campo="ds_complemento" prefixo={asterisco('ds_complemento')} />
                <input
                  disabled={statusDe('ds_complemento') === 'D'}
                  className={classeCampo('ds_complemento')}
                  value={form.ds_complemento ?? ''}
                  onChange={(e) => setForm({ ...form, ds_complemento: e.target.value })}
                />
              </div>
            </div>
          )}
        </div>

        <div className="mt-auto pt-4">
          <div className="flex items-center justify-between gap-3">
            {registro && (
              <div className="text-[13px] text-slate-500">
                {([
                  ['Criado', registro.ds_usuario_criacao, registro.dt_criacao],
                  ['Alterado', registro.ds_usuario_alteracao, registro.dt_alteracao],
                ] as const).map(([acao, autor, data], i) => (
                  <div key={acao} className={`relative group flex items-center gap-2 ${i > 0 ? 'mt-1' : ''}`}>
                    <span>{acao} por {resolverNomeAutor(autor ?? '') || '-'} em {data ? formatDate(data) : '-'}</span>
                    <button
                      type="button"
                      aria-hidden="true"
                      onClick={() => registro.id && onOpenAudit?.(colecao, registro.id)}
                      className="botao-auditoria inline-flex h-5 w-5 items-center justify-center rounded text-[#777] bg-transparent cursor-pointer opacity-0 group-hover:opacity-100 transition-none"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 8v4" />
                        <circle cx="12" cy="16" r="0.5" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-center justify-end gap-3 ml-auto">
              <button
                type="button"
                onClick={onVoltar}
                className="px-4 py-2.5 text-sm text-black transition rounded-[3px] border-b button-cancel cursor-pointer min-w-[96px] justify-center"
                style={{ backgroundColor: '#bdbdbd', borderBottomColor: '#000' }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={salvando || carregando}
                className="px-4 py-2.5 text-sm text-white transition rounded-[3px] border-b button-save cursor-pointer min-w-[96px] justify-center disabled:cursor-default disabled:opacity-60"
                style={{ backgroundColor: '#003056', borderBottomColor: '#000' }}
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
