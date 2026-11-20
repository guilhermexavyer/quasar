"use client";

import { useRef } from "react";
import CampoLookupReferencia from "@/components/ui/CampoLookupReferencia";
import Select from "@/components/ui/Select";
import type { CadastroGeralCamposAux } from "@/components/cadastrosGerais/CadastroGeralFormView";
import {
  acceptDoArquivoCopia,
  extensaoDoArquivo,
  nomeDoArquivoCopia,
} from "@/lib/copiaArquivoUtils";
import { STATUS_COPIA_OPTIONS } from "@/lib/copiaUtils";
import { applyDateMask } from "@/lib/pessoaFisicaUtils";

/** Campos próprios da cópia no formulário (texto; vazio = sem valor). */
export interface CopiaCamposForm {
  /** Datas (DD/MM/AAAA). */
  dt_recebimento: string;
  dt_impressao: string;
  dt_entrega: string;
  /** Status: escolhido no cadastro; depois, só pelo menu de contexto "Alterar status". */
  ie_status: string;
  dt_status: string;
  ds_motivo_status: string;
  nr_seq_solicitante: string;
  nr_seq_turma_disciplina: string;
  qt_copias: string;
  qt_folhas: string;
  ie_frente_verso: string;
  ie_grampear: string;
  ie_guilhotinar: string;
  nr_seq_formato_papel: string;
  nr_seq_tipo_papel: string;
  /** Caminho do arquivo já salvo (ie_arquivo). */
  ie_arquivo: string;
}

export const COPIA_CAMPOS_VAZIOS: CopiaCamposForm = {
  dt_recebimento: '',
  dt_impressao: '',
  dt_entrega: '',
  ie_status: 'A',
  dt_status: '',
  ds_motivo_status: '',
  nr_seq_solicitante: '',
  nr_seq_turma_disciplina: '',
  qt_copias: '',
  qt_folhas: '',
  ie_frente_verso: 'N',
  ie_grampear: 'N',
  ie_guilhotinar: 'N',
  nr_seq_formato_papel: '',
  nr_seq_tipo_papel: '',
  ie_arquivo: '',
};

interface CopiaCamposFormViewProps {
  aux: CadastroGeralCamposAux;
  valores: CopiaCamposForm;
  onChange?: (campo: keyof CopiaCamposForm, valor: string) => void;
  /** Descrições das referências (Solicitante, Turma x Disciplina). */
  descricaoSolicitante: string;
  descricaoTurmaDisciplina: string;
  opcoesFormatoPapel: { value: string; label: string }[];
  opcoesTipoPapel: { value: string; label: string }[];
  onLocalizarSolicitante?: () => void;
  onLocalizarTurmaDisciplina?: () => void;
  /** Arquivo escolhido e ainda não enviado (vai no Salvar). */
  arquivoNovo?: File | null;
  onArquivoNovoChange?: (arquivo: File | null) => void;
  /** Extensões permitidas pelo parâmetro de Controle de Cópias. */
  extensoesPermitidas: string[];
  onArquivoInvalido?: (mensagem: string) => void;
  /** Tudo desabilitado (ex.: registro excluído). */
  somenteLeitura?: boolean;
  /** Cadastro novo: o Status pode ser escolhido; depois, só pelo "Alterar status". */
  novo?: boolean;
}

/** Botão cinza do sistema (mesmo de "Selecionar arquivo" em Administração do Sistema > Imagens). */
const CLASSE_BOTAO = 'inline-flex items-center justify-center rounded-[3px] bg-[#ddd] px-[5px] py-[5px] text-sm text-black cursor-pointer whitespace-nowrap';
const ESTILO_BOTAO = { borderTop: '1px solid transparent', borderLeft: '1px solid transparent', borderRight: '1px solid transparent', borderBottom: '1px solid #000' };

/**
 * Campos de Controle de Cópias > Cópias dentro do formulário padrão de cadastro
 * (Solicitante, Turma x Disciplina, Cópias, Folhas, Formato do papel, Tipo de papel,
 * Frente e verso, Grampear, Guilhotinar e Arquivo).
 */
export default function CopiaCamposFormView({
  aux,
  valores,
  onChange = () => {},
  descricaoSolicitante,
  descricaoTurmaDisciplina,
  opcoesFormatoPapel,
  opcoesTipoPapel,
  onLocalizarSolicitante = () => {},
  onLocalizarTurmaDisciplina = () => {},
  arquivoNovo = null,
  onArquivoNovoChange = () => {},
  extensoesPermitidas,
  onArquivoInvalido = () => {},
  somenteLeitura = false,
  novo = false,
}: CopiaCamposFormViewProps) {
  const { renderFieldLabel, inputClass, statusDe } = aux;
  const inputArquivoRef = useRef<HTMLInputElement | null>(null);
  const desabilitado = (campo: string) => somenteLeitura || statusDe(campo) === 'D';

  const numero = (campo: 'qt_copias' | 'qt_folhas', rotulo: string, colunas: string) => (
    <div className={`${colunas} group`}>
      {renderFieldLabel(campo, rotulo)}
      <input
        inputMode="numeric"
        maxLength={7}
        disabled={desabilitado(campo)}
        className={`${inputClass(campo)} disabled:cursor-default disabled:bg-slate-100 disabled:text-slate-500`}
        value={valores[campo]}
        onChange={(e) => onChange(campo, e.target.value.replace(/[^0-9]/g, '').slice(0, 7))}
      />
    </div>
  );

  // Mesmo checkbox de Estrutura Acadêmica > Colaboradores: marcado = 'S', desmarcado = 'N'.
  // O rótulo do formulário padrão é inline: flex-col deixa o rótulo em cima e o checkbox embaixo.
  const simNao = (campo: 'ie_frente_verso' | 'ie_grampear' | 'ie_guilhotinar', rotulo: string) => (
    <div className="group flex flex-col items-start">
      {renderFieldLabel(campo, rotulo)}
      <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
        <input
          type="checkbox"
          className="cg-checkbox"
          disabled={desabilitado(campo)}
          checked={valores[campo] === 'S'}
          onChange={() => onChange(campo, valores[campo] === 'S' ? 'N' : 'S')}
        />
        <span>Sim</span>
      </label>
    </div>
  );

  const dropdown = (campo: 'nr_seq_formato_papel' | 'nr_seq_tipo_papel', rotulo: string, opcoes: { value: string; label: string }[], colunas: string) => (
    <div className={`${colunas} group`}>
      {renderFieldLabel(campo, rotulo)}
      <Select
        value={valores[campo]}
        onChange={(v) => onChange(campo, v)}
        options={opcoes}
        disabled={desabilitado(campo)}
        error={inputClass(campo).includes('red')}
      />
    </div>
  );

  const nomeArquivo = arquivoNovo ? arquivoNovo.name : nomeDoArquivoCopia(valores.ie_arquivo);
  const accept = acceptDoArquivoCopia(extensoesPermitidas);
  const semTipos = extensoesPermitidas.length === 0;
  const selecionarDesabilitado = desabilitado('ie_arquivo') || semTipos;

  function escolherArquivo(arquivo: File | undefined) {
    if (!arquivo) return;
    const ext = extensaoDoArquivo(arquivo.name);
    if (!extensoesPermitidas.includes(ext)) {
      onArquivoInvalido(
        semTipos
          ? "Nenhum tipo de arquivo está liberado em Controle de Cópias > Parâmetros."
          : `Tipo de arquivo não permitido. Aceitos: ${extensoesPermitidas.map((e) => `.${e}`).join(', ')}`
      );
      return;
    }
    onArquivoNovoChange(arquivo);
  }

  /**
   * Data da impressão / da entrega: preenchidas pelo "Alterar status" (Impresso / Entregue).
   * No cadastro, ficam habilitadas só quando o status escolhido é o delas.
   */
  const STATUS_DA_DATA: Partial<Record<'dt_recebimento' | 'dt_impressao' | 'dt_entrega', string>> = { dt_impressao: 'I', dt_entrega: 'E' };
  const dataDesabilitada = (campo: 'dt_recebimento' | 'dt_impressao' | 'dt_entrega') => {
    const status = STATUS_DA_DATA[campo];
    if (status && !(novo && valores.ie_status === status)) return true;
    return desabilitado(campo);
  };

  // No cadastro, trocar o status limpa a data que deixa de valer (impressão/entrega).
  function alterarStatus(status: string) {
    onChange('ie_status', status);
    if (status !== 'I' && valores.dt_impressao) onChange('dt_impressao', '');
    if (status !== 'E' && valores.dt_entrega) onChange('dt_entrega', '');
  }

  // Datas no mesmo padrão dos demais formulários (DD/MM/AAAA, com máscara).
  const data = (campo: 'dt_recebimento' | 'dt_impressao' | 'dt_entrega', rotulo: string) => (
    <div className="sm:col-span-2 group">
      {renderFieldLabel(campo, rotulo)}
      <input
        type="text"
        inputMode="numeric"
        maxLength={10}
        placeholder="DD/MM/AAAA"
        disabled={dataDesabilitada(campo)}
        className={`${inputClass(campo)} placeholder:text-[#aaa] disabled:cursor-default disabled:bg-slate-100 disabled:text-slate-500`}
        value={valores[campo]}
        onChange={(e) => onChange(campo, applyDateMask(e.target.value))}
      />
    </div>
  );

  return (
    <>
      {/* Linha 1: Sequência (do formulário padrão), Status, Recebimento, Impressão, Entrega e Data do status. */}
      <div className="sm:col-span-3 group">
        {renderFieldLabel('ie_status', 'Status')}
        <Select
          value={valores.ie_status}
          onChange={alterarStatus}
          options={STATUS_COPIA_OPTIONS}
          showPlaceholder={false}
          disabled={somenteLeitura || !novo || statusDe('ie_status') === 'D'}
        />
      </div>
      {data('dt_recebimento', 'Data do recebimento')}
      {data('dt_impressao', 'Data da impressão')}
      {data('dt_entrega', 'Data da entrega')}
      <div className="sm:col-span-2 group">
        {renderFieldLabel('dt_status', 'Data do status')}
        <input
          disabled
          className="w-full rounded-[3px] border border-slate-300 bg-slate-100 px-2 py-1.5 text-sm text-slate-500 transition focus:outline-none disabled:cursor-default"
          value={valores.dt_status}
        />
      </div>

      <CampoLookupReferencia
        className="sm:col-span-6"
        rotulo={renderFieldLabel('nr_seq_solicitante', 'Solicitante')}
        ariaLocalizar="Localizar solicitante"
        inputClass={inputClass('nr_seq_solicitante')}
        valor={valores.nr_seq_solicitante}
        descricao={descricaoSolicitante}
        desabilitado={desabilitado('nr_seq_solicitante')}
        onChange={(v) => onChange('nr_seq_solicitante', v)}
        onLocalizar={onLocalizarSolicitante}
      />
      <CampoLookupReferencia
        className="sm:col-span-6"
        rotulo={renderFieldLabel('nr_seq_turma_disciplina', 'Turma x Disciplina')}
        ariaLocalizar="Localizar turma x disciplina"
        inputClass={inputClass('nr_seq_turma_disciplina')}
        valor={valores.nr_seq_turma_disciplina}
        descricao={descricaoTurmaDisciplina}
        desabilitado={desabilitado('nr_seq_turma_disciplina')}
        onChange={(v) => onChange('nr_seq_turma_disciplina', v)}
        onLocalizar={onLocalizarTurmaDisciplina}
      />
      {numero('qt_copias', 'Cópias', 'sm:col-span-2')}
      {numero('qt_folhas', 'Folhas', 'sm:col-span-2')}
      {dropdown('nr_seq_formato_papel', 'Formato do papel', opcoesFormatoPapel, 'sm:col-span-4')}
      {dropdown('nr_seq_tipo_papel', 'Tipo de papel', opcoesTipoPapel, 'sm:col-span-4')}

      {/* Arquivo: mesmo visual de Administração do Sistema > Imagens. */}
      <div className="sm:col-span-12 group">
        {renderFieldLabel('ie_arquivo', 'Arquivo')}
        <input
          ref={inputArquivoRef}
          type="file"
          accept={accept || undefined}
          className="hidden"
          tabIndex={-1}
          onChange={(e) => {
            escolherArquivo(e.target.files?.[0]);
            e.target.value = '';
          }}
        />
        <div className="flex items-center gap-1">
          {!somenteLeitura && (
            <button
              type="button"
              onClick={() => inputArquivoRef.current?.click()}
              disabled={selecionarDesabilitado}
              className={`${CLASSE_BOTAO} ${selecionarDesabilitado ? 'opacity-40' : 'hover:bg-slate-300'}`}
              style={ESTILO_BOTAO}
              aria-label="Selecionar arquivo"
              title={semTipos ? 'Nenhum tipo de arquivo liberado em Controle de Cópias > Parâmetros' : `Tipos aceitos: ${extensoesPermitidas.map((e) => `.${e}`).join(', ')}`}
            >
              Selecionar arquivo
            </button>
          )}
          <input
            type="text"
            value={nomeArquivo}
            disabled
            className={`${inputClass('ie_arquivo')} disabled:cursor-default disabled:bg-slate-100 disabled:text-slate-500 flex-1 min-w-0`}
          />
        </div>
      </div>

      <div className="sm:col-span-12">
        <div className="flex gap-8">
          {simNao('ie_frente_verso', 'Frente e verso')}
          {simNao('ie_grampear', 'Grampear')}
          {simNao('ie_guilhotinar', 'Guilhotinar')}
        </div>
      </div>

      {/* Motivo status: preenchido pelo menu de contexto "Alterar status" (como em Colaboradores). */}
      <div className="sm:col-span-12 group">
        {renderFieldLabel('ds_motivo_status', 'Motivo status')}
        <textarea
          disabled
          rows={3}
          className="w-full rounded-[3px] border border-slate-300 bg-slate-100 px-2 py-1.5 text-sm text-slate-500 transition focus:outline-none resize-none disabled:cursor-default disabled:bg-slate-100 disabled:text-slate-500"
          value={valores.ds_motivo_status}
        />
      </div>
    </>
  );
}
