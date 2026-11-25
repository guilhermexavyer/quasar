"use client";

import Image from "next/image";
import React, { useEffect, useLayoutEffect, useState, useCallback, useRef, useMemo } from "react";
import {
  criarPessoaFisica,
  excluirPessoaFisica,
  obterPessoasFisicas,
  atualizarPessoaFisica,
} from "@/services/pessoaFisicaService";
import {
  criarPessoaJuridica,
  excluirPessoaJuridica,
  obterPessoasJuridicas,
  atualizarPessoaJuridica,
} from "@/services/pessoaJuridicaService";
import {
  criarAluno,
  excluirAluno,
  obterAlunos,
  atualizarAluno,
} from "@/services/alunoService";
import {
  criarColaborador,
  excluirColaborador,
  obterColaboradores,
  atualizarColaborador,
} from "@/services/colaboradorService";
import {
  criarPeriodoLetivo,
  excluirPeriodoLetivo,
  obterPeriodosLetivos,
  observarPeriodosLetivos,
  encerrarPeriodoLetivoPorPrevisao,
  atualizarPeriodoLetivo,
} from "@/services/periodoLetivoService";
import { obterUsuarios, entrar, sair, obterSessao, alterarSenhaNoLogin } from "@/services/usuarioService";
import {
  criarUsuario,
  excluirUsuario,
  atualizarUsuario,
  atualizarPreferenciaTema,
  atualizarPreferenciasUsuario,
} from "@/services/usuarioService";
import {
  criarSexo,
  excluirSexo,
  obterSexos,
  atualizarSexo,
} from "@/services/sexoService";
import {
  criarEstadoCivil,
  excluirEstadoCivil,
  obterEstadoCivis,
  atualizarEstadoCivil,
} from "@/services/estadoCivilService";
import {
  criarCorRaca,
  excluirCorRaca,
  obterCoresRacas,
  atualizarCorRaca,
} from "@/services/corRacaService";
import {
  criarProfissao,
  excluirProfissao,
  obterProfissoes,
  atualizarProfissao,
} from "@/services/profissaoService";
import {
  criarOrgaoEmissor,
  excluirOrgaoEmissor,
  obterOrgaosEmissores,
  atualizarOrgaoEmissor,
} from "@/services/orgaoEmissorService";
import {
  criarLogradouro,
  excluirLogradouro,
  obterLogradouros,
  atualizarLogradouro,
} from "@/services/logradouroService";
import {
  criarGrauParentesco,
  excluirGrauParentesco,
  obterGrausParentesco,
  atualizarGrauParentesco,
} from "@/services/grauParentescoService";
import {
  criarCargo,
  excluirCargo,
  obterCargos,
  atualizarCargo,
} from "@/services/cargoService";
import {
  criarVinculoContratual,
  excluirVinculoContratual,
  obterVinculosContratuais,
  atualizarVinculoContratual,
} from "@/services/vinculoContratualService";
import {
  criarLocalizacao,
  excluirLocalizacao,
  obterLocalizacoes,
  atualizarLocalizacao,
} from "@/services/localizacaoService";
import {
  criarMarca,
  excluirMarca,
  obterMarcas,
  atualizarMarca,
} from "@/services/marcaService";
import {
  criarCategoriaAtivo,
  excluirCategoriaAtivo,
  obterCategoriasAtivos,
  atualizarCategoriaAtivo,
} from "@/services/categoriaAtivoService";
import {
  criarSistemaOperacional,
  excluirSistemaOperacional,
  obterSistemasOperacionais,
  atualizarSistemaOperacional,
} from "@/services/sistemaOperacionalService";
import {
  criarCombustivel,
  excluirCombustivel,
  obterCombustiveis,
  atualizarCombustivel,
} from "@/services/combustivelService";
import {
  criarAtivo,
  excluirAtivo,
  obterAtivos,
  atualizarAtivo,
} from "@/services/ativoService";
import {
  COLECAO_PARAM_COR_ATIVO_DESCARTADO,
  COLECAO_PARAM_COR_ATIVO_ESTOQUE,
  COLECAO_PARAM_COR_ATIVO_MANUTENCAO,
  COLECAO_PARAM_COR_ATIVO_OPERACIONAL,
  COLECAO_PARAM_COR_MANUTENCAO_ANDAMENTO,
  COLECAO_PARAM_COR_MANUTENCAO_CANCELADA,
  COLECAO_PARAM_COR_MANUTENCAO_CONCLUIDA,
  COLECAO_PARAM_COR_PERIODO_LETIVO_ANDAMENTO,
  COLECAO_PARAM_COR_PERIODO_LETIVO_ENCERRADO,
  COLECAO_PARAM_ENCERRAMENTO_AUTOMATICO_PERIODO_LETIVO,
  COLECAO_PARAM_MATRICULA_ALUNO,
  COLECAO_PARAM_MATRICULA_COLABORADOR,
  COLECAO_PARAM_TIPOS_ARQUIVO_COPIA,
  COLECAO_PARAM_COR_COPIA_AGUARDANDO,
  COLECAO_PARAM_COR_COPIA_CANCELADO,
  COLECAO_PARAM_COR_COPIA_ENTREGUE,
  COLECAO_PARAM_COR_COPIA_IMPRESSO,
  COLECAO_PARAM_DATA_RECEBIMENTO_AUTOMATICA,
  COLECAO_PARAM_FORMATO_PAPEL_PADRAO,
  COLECAO_PARAM_TIPO_PAPEL_PADRAO,
  obterParametro,
} from "@/services/parametroFuncaoService";
import { gerarCodigoPorRegra } from "@/lib/regraCodigoUtils";
import { EVENTO_SESSAO_EXPIRADA, atualizarPropriaSenha } from "@/lib/apiCliente";
import { fetchAuditByPessoaId, fetchAuditByUsuarioId, fetchAuditByDocumentId, AuditEntry } from "@/services/auditService";
import type { PessoaFisica, ToastStatus } from "@/types/pessoaFisica";
import type { PessoaJuridica } from "@/types/pessoaJuridica";
import type { Aluno, AlunoResponsavelLegado } from "@/types/aluno";
import type { Colaborador } from "@/types/colaborador";
import type { PeriodoLetivo } from "@/types/periodoLetivo";
import {
  applyCpfMask,
  applyDateMask,
  applyPhoneMask,
  formatDate,
  parseDateInput,
  parsePersonDateValue,
  COLUMNS,
  formatCellValue,
} from "@/lib/pessoaFisicaUtils";
import { PJ_COLUMNS, applyCnpjMask } from "@/lib/pessoaJuridicaUtils";
import { ALUNO_COLUMNS, formatCellValue as formatAlunoCellValue } from "@/lib/alunoUtils";
import { COLABORADOR_COLUMNS, STATUS_OPTIONS, formatCellValue as formatColaboradorCellValue } from "@/lib/colaboradorUtils";
import { ADMIN_COLUMNS, formatAdminCellValue } from "@/lib/usuarioUtils";
import {
  parseColunasConfig,
  serializeColunasConfig,
  parseStringColunasConfig,
  serializeStringColunasConfig,
  type ColunasConfig,
} from "@/lib/colunasUtils";
import ContextMenu from "@/components/ui/ContextMenu";
import Toast from "@/components/ui/Toast";
import LoginScreen, { type ResultadoLoginTela } from "@/components/ui/LoginScreen";
import LoadingModal from "@/components/ui/LoadingModal";
import PessoaFisicaListView from "@/components/pessoaFisica/PessoaFisicaListView";
import PessoaFisicaDetalheView from "@/components/pessoaFisica/PessoaFisicaDetalheView";
import { CAMPOS_PF_MOVIDOS_PARA_ABAS, type PessoaFisicaAba } from "@/lib/pessoaFisicaAbasUtils";
import PessoaFisicaFormView from "@/components/pessoaFisica/PessoaFisicaFormView";
import PessoaJuridicaListView from "@/components/pessoaJuridica/PessoaJuridicaListView";
import PessoaJuridicaFormView from "@/components/pessoaJuridica/PessoaJuridicaFormView";
import AlunoListView from "@/components/estruturaAcademica/AlunoListView";
import AlunoDetalheView, { type AlunoDetalheAba } from "@/components/estruturaAcademica/AlunoDetalheView";
import AlunoFormView, { type AlunoFormData } from "@/components/estruturaAcademica/AlunoFormView";
import ColaboradorListView from "@/components/estruturaAcademica/ColaboradorListView";
import ColaboradorFormView, { type ColaboradorFormData } from "@/components/estruturaAcademica/ColaboradorFormView";
import ColaboradorViewModal from "@/components/estruturaAcademica/ColaboradorViewModal";
import PeriodoLetivoListView from "@/components/estruturaAcademica/PeriodoLetivoListView";
import PeriodoLetivoFormView, { type PeriodoLetivoFormData } from "@/components/estruturaAcademica/PeriodoLetivoFormView";
import PeriodoLetivoFeriadosView from "@/components/estruturaAcademica/PeriodoLetivoFeriadosView";
import ExclusoesView, { type NavegacaoExclusoes } from "@/components/administracaoSistema/ExclusoesView";
import AcessosView, { FILTRO_ACESSOS_VAZIO, LogsSemSelecaoView, normalizarFiltroAcessos, type FiltroAcessos } from "@/components/logs/AcessosView";
import BotaoSalvarFiltro from "@/components/ui/BotaoSalvarFiltro";
import { useDescricaoLookupSemFoco } from "@/lib/useDescricaoLookupSemFoco";
import ExclusaoFormularioView from "@/components/administracaoSistema/ExclusaoFormularioView";
import FormularioExcluidoGenerico, { FORMULARIOS_GENERICOS } from "@/components/administracaoSistema/FormularioExcluidoGenerico";
import FormularioSomenteLeitura from "@/components/ui/FormularioSomenteLeitura";
import { carregarEsquema, tipoDaColuna } from "@/lib/esquemaBanco";
import { FUNCOES_EXCLUSAO } from "@/lib/exclusoesUtils";
import { definirAutorExclusoes, type Exclusao } from "@/services/exclusaoService";
import { excluirFeriadosDoPeriodo } from "@/services/periodoLetivoFeriadoService";
import { rotuloTipoFeriado } from "@/lib/periodoLetivoFeriadoUtils";
import { CORES_STATUS_PERIODO_LETIVO_PADRAO, PERIODO_LETIVO_COLUMNS, STATUS_PERIODO_LETIVO_OPTIONS, formatCellValue as formatPeriodoLetivoCellValue } from "@/lib/periodoLetivoUtils";
import AtivoListView from "@/components/patrimonio/AtivoListView";
import AtivoFormView, { type AtivoFormData } from "@/components/patrimonio/AtivoFormView";
import AtivoDetalheView, { type AtivoDetalheAba } from "@/components/patrimonio/AtivoDetalheView";
import { assumirAtivosDoColaborador, excluirResponsaveisDoAtivo, obterResponsaveisAtivos } from "@/services/ativoResponsavelService";
import { excluirResponsaveisDoAluno } from "@/services/alunoResponsavelService";
import type { AtivoResponsavel } from "@/types/ativoResponsavel";
import ParametrosDaFuncaoView from "@/components/parametros/ParametrosDaFuncaoView";
import ManutencaoListView from "@/components/patrimonio/ManutencaoListView";
import ManutencaoFormView, { type ManutencaoFormData } from "@/components/patrimonio/ManutencaoFormView";
import PrestadorLookupTable from "@/components/patrimonio/PrestadorLookupTable";
import AtivoLookupTable from "@/components/patrimonio/AtivoLookupTable";
import ManutencaoViewModal from "@/components/patrimonio/ManutencaoViewModal";
import type { Manutencao } from "@/types/manutencao";
import { obterManutencoes, criarManutencao, atualizarManutencao, excluirManutencao } from "@/services/manutencaoService";
import { CORES_STATUS_MANUTENCAO_PADRAO, MANUTENCAO_COLUMNS, MANUTENCAO_STATUS_OPTIONS, FIELD_INFOS as MANUTENCAO_FIELD_INFOS } from "@/lib/manutencaoUtils";
import PessoaJuridicaLookupTable from "@/components/pessoaJuridica/PessoaJuridicaLookupTable";
import AdministracaoSistemaListView from "@/components/administracaoSistema/AdministracaoSistemaListView";
import AdministracaoSistemaFormView from "@/components/administracaoSistema/AdministracaoSistemaFormView";
import PerfilListView from "@/components/administracaoSistema/PerfilListView";
import PerfilFormView, { type PerfilFormData } from "@/components/administracaoSistema/PerfilFormView";
import CamposView from "@/components/administracaoSistema/CamposView";
import ImagemListView from "@/components/administracaoSistema/ImagemListView";
import ImagemFormView from "@/components/administracaoSistema/ImagemFormView";
import type { Imagem } from "@/types/imagem";
import { obterImagens, criarImagem, atualizarImagem, excluirImagem, uploadImagem, excluirArquivoImagem, renomearArquivoImagem } from "@/services/imagemService";
import RelatorioBuilder, { type DadosRelatorioForm } from "@/components/relatorio/RelatorioBuilder";
import RelatorioListView from "@/components/relatorio/RelatorioListView";
import ImportacaoRelatorioView from "@/components/relatorio/ImportacaoRelatorioView";
import type { Relatorio } from "@/types/relatorio";
import { obterRelatorios, criarRelatorio, atualizarRelatorio, excluirRelatorio, duplicarRelatorio } from "@/services/relatorioService";

import { alterarStatusItem, exportarRelatorioXml, baixarPlanilha, obterDadosRelatorio, obterParametrosSql, type ParametroSql } from "@/services/relatorioSqlService";
import { gerarPdfRelatorio } from "@/lib/relatorioPdfFolha";
import { nomeDoParametro } from "@/lib/relatorioSql";
import AvisosView from "@/components/administracaoSistema/AvisosView";
import AvisoModal from "@/components/ui/AvisoModal";
import { filtrarAuditoriaDoAviso, type CampoAviso } from "@/services/avisoService";
import RegrasView from "@/components/administracaoSistema/RegrasView";
import { obterRegra, filtrarAuditoriaDaRegra, CAMPOS_REGRA, type IdRegra, type Regra } from "@/services/regraService";
import { ultimoLogoutProgramado, rotuloDiaLogout } from "@/lib/regraUtils";

import {
  parseCamposConfig,
  serializeCamposConfig,
  parseCamposAlteracao,
  auditoriaDoCampo,
  CAMPO_STATUS_LABELS,
  serializeCamposAlteracao,
  campoRegrasDaColecao,
  camposObrigatoriosVazios,
  campoKey,
  getCampoStatus,
  MODAL_ALUNO_ALTERAR_STATUS,
  MODAL_ATIVO_DESCARTAR,
  MODAL_ATIVO_ESTOQUE,
  MODAL_ATIVO_OPERACIONAL,
  MODAL_COLABORADOR_ALTERAR_STATUS,
  MODAL_COPIA_ALTERAR_STATUS,
  MODAL_CONCLUIR_MANUTENCAO,
  MODAL_ENVIAR_MANUTENCAO,
  MODAL_ATIVO_TRANSFERIR,
  type CampoStatus,
} from "@/lib/camposConfigUtils";
import {
  PERMISSOES_POR_FUNCAO,
  PERMISSOES_GRUPOS,
  PERMISSOES_CONFIG_VERSION,
  parsePermissoesConfig,
  serializePermissoesConfig,
  migrarPermissoesConfig,
  parsePermissoesConfigMigrada,
  adminSubmodulosPermitidos,
  ADMIN_OPCOES_DROPDOWN,
  pessoaSubmodulosPermitidos,
  cgSubmodulosPermitidos,
  eaSubmodulosPermitidos,
  patrimonioSubmodulosPermitidos,
  logsSubmodulosPermitidos,
  ccSubmodulosPermitidos,
  temPermissao,
} from "@/lib/permissoesUtils";
import type { PermissaoDef } from "@/lib/permissoesUtils";
import PessoaFisicaLookupTable from "@/components/pessoaFisica/PessoaFisicaLookupTable";
import CidadeLookupTable from "@/components/pessoaFisica/CidadeLookupTable";
import SearchIcon from "@/components/ui/SearchIcon";
import ViewIcon from "@/components/ui/ViewIcon";
import PessoaFisicaViewModal from "@/components/pessoaFisica/PessoaFisicaViewModal";
import PessoaJuridicaViewModal from "@/components/pessoaJuridica/PessoaJuridicaViewModal";
import { buscarCidades, cidadePorCodigo, type Cidade } from "@/services/cidadeService";
import { obterEstados } from "@/services/estadoService";
import CadastroGeralListView from "@/components/cadastrosGerais/CadastroGeralListView";
import CadastroGeralFormView, { type CadastroGeralFormData } from "@/components/cadastrosGerais/CadastroGeralFormView";
import CadastroGeralFilterModal, { type CadastroGeralFilterForm } from "@/components/cadastrosGerais/CadastroGeralFilterModal";
import PessoaJuridicaFilterModal, { type PessoaJuridicaFilterForm } from "@/components/pessoaJuridica/PessoaJuridicaFilterModal";
import Select from "@/components/ui/Select";
import { type FiltroAplicado } from "@/components/ui/FiltrosAplicados";
import RequiredAsterisk from "@/components/ui/RequiredAsterisk";
import RotuloCampo from "@/components/ui/RotuloCampo";
import ReferenciaLookupModal from "@/components/ui/ReferenciaLookupModal";
import CampoLookupReferencia from "@/components/ui/CampoLookupReferencia";
import type { Sexo } from "@/types/sexo";
import type { EstadoCivil } from "@/types/estadoCivil";
import type { CorRaca } from "@/types/corRaca";
import type { Profissao } from "@/types/profissao";
import type { OrgaoEmissor } from "@/types/orgaoEmissor";
import type { Logradouro } from "@/types/logradouro";
import type { GrauParentesco } from "@/types/grauParentesco";
import type { Cargo } from "@/types/cargo";
import type { VinculoContratual } from "@/types/vinculoContratual";
import type { Localizacao } from "@/types/localizacao";
import type { Marca } from "@/types/marca";
import type { CategoriaAtivo } from "@/types/categoriaAtivo";
import type { SistemaOperacional } from "@/types/sistemaOperacional";
import type { Combustivel } from "@/types/combustivel";
import type { Ativo } from "@/types/ativo";
import { SEXO_COLUMNS, SEXO_FIELD_INFOS } from "@/lib/sexoUtils";
import { ESTADO_CIVIL_COLUMNS, ESTADO_CIVIL_FIELD_INFOS } from "@/lib/estadoCivilUtils";
import { COR_RACA_COLUMNS, COR_RACA_FIELD_INFOS } from "@/lib/corRacaUtils";
import { PROFISSAO_COLUMNS, PROFISSAO_FIELD_INFOS } from "@/lib/profissaoUtils";
import { ORGAO_EMISSOR_COLUMNS, ORGAO_EMISSOR_FIELD_INFOS } from "@/lib/orgaoEmissorUtils";
import { LOGRADOURO_COLUMNS, LOGRADOURO_FIELD_INFOS } from "@/lib/logradouroUtils";
import { GRAU_PARENTESCO_COLUMNS, GRAU_PARENTESCO_FIELD_INFOS } from "@/lib/grauParentescoUtils";
import { CARGO_COLUMNS, CARGO_FIELD_INFOS } from "@/lib/cargoUtils";
import { VINCULO_CONTRATUAL_COLUMNS, VINCULO_CONTRATUAL_FIELD_INFOS } from "@/lib/vinculoContratualUtils";
import { LOCALIZACAO_COLUMNS, LOCALIZACAO_FIELD_INFOS } from "@/lib/localizacaoUtils";
import { MARCA_COLUMNS, MARCA_FIELD_INFOS } from "@/lib/marcaUtils";
import { CATEGORIA_ATIVO_COLUMNS, CATEGORIA_ATIVO_FIELD_INFOS } from "@/lib/categoriaAtivoUtils";
import { CURSO_COLUMNS, CURSO_FIELD_INFOS } from "@/lib/cursoUtils";
import { atualizarCurso, criarCurso, excluirCurso, obterCursos } from "@/services/cursoService";
import { DISCIPLINA_COLUMNS, DISCIPLINA_FIELD_INFOS } from "@/lib/disciplinaUtils";
import { atualizarDisciplina, criarDisciplina, excluirDisciplina, obterDisciplinas } from "@/services/disciplinaService";
import type { Disciplina } from "@/types/disciplina";
import { TURMA_COLUMNS, TURMA_COLUNAS_REFERENCIA, TURMA_FIELD_INFOS } from "@/lib/turmaUtils";
import { atualizarTurma, criarTurma, excluirTurma, obterTurmas } from "@/services/turmaService";
import type { Turma } from "@/types/turma";
import { TURMA_DISCIPLINA_CAMPOS_DA_TURMA, TURMA_DISCIPLINA_COLUMNS, TURMA_DISCIPLINA_COLUNAS_REFERENCIA, TURMA_DISCIPLINA_FIELD_INFOS } from "@/lib/turmaDisciplinaUtils";
import { atualizarTurmaDisciplina, criarTurmaDisciplina, excluirTurmaDisciplina, obterTurmasDisciplinas } from "@/services/turmaDisciplinaService";
import type { TurmaDisciplina } from "@/types/turmaDisciplina";
import { MODALIDADE_ENSINO_COLUMNS, MODALIDADE_ENSINO_FIELD_INFOS } from "@/lib/modalidadeEnsinoUtils";
import { atualizarModalidadeEnsino, criarModalidadeEnsino, excluirModalidadeEnsino, obterModalidadesEnsino } from "@/services/modalidadeEnsinoService";
import type { ModalidadeEnsino } from "@/types/modalidadeEnsino";
import { FORMATO_PAPEL_COLUMNS, FORMATO_PAPEL_FIELD_INFOS } from "@/lib/formatoPapelUtils";
import { atualizarFormatoPapel, criarFormatoPapel, excluirFormatoPapel, obterFormatosPapel } from "@/services/formatoPapelService";
import type { FormatoPapel } from "@/types/formatoPapel";
import { TIPO_PAPEL_COLUMNS, TIPO_PAPEL_FIELD_INFOS } from "@/lib/tipoPapelUtils";
import { atualizarTipoPapel, criarTipoPapel, excluirTipoPapel, obterTiposPapel } from "@/services/tipoPapelService";
import type { TipoPapel } from "@/types/tipoPapel";
import { CORES_STATUS_COPIA_PADRAO, COPIA_COLUMNS, COPIA_COLUNAS_REFERENCIA, COPIA_FIELD_INFOS, STATUS_COPIA_OPTIONS, formatCopiaCellValue, rotuloStatusCopia } from "@/lib/copiaUtils";
import CopiaListView from "@/components/controleCopias/CopiaListView";
import { atualizarCopia, criarCopia, enviarArquivoCopia, excluirCopia, obterCopias } from "@/services/copiaService";
import type { Copia } from "@/types/copia";
import CopiaCamposFormView, { COPIA_CAMPOS_VAZIOS, type CopiaCamposForm } from "@/components/controleCopias/CopiaCamposForm";
import { EXTENSOES_COPIA_PADRAO, extensoesPermitidasCopia } from "@/lib/copiaArquivoUtils";
import EmptySelectionMessage from "@/components/ui/EmptySelectionMessage";
import type { Curso } from "@/types/curso";
import { SISTEMA_OPERACIONAL_COLUMNS, SISTEMA_OPERACIONAL_FIELD_INFOS } from "@/lib/sistemaOperacionalUtils";
import { COMBUSTIVEL_COLUMNS, COMBUSTIVEL_FIELD_INFOS } from "@/lib/combustivelUtils";
import { ATIVO_COLUMNS, CORES_STATUS_ATIVO_PADRAO, lerColunasAtivo, serializarColunasAtivo, STATUS_OPTIONS as ATIVO_STATUS_OPTIONS, applyIPv4Mask } from "@/lib/ativoUtils";
import { formatCadastroGeralCellValue, formatarMedida, medidaParaBanco } from "@/lib/cadastroGeralUtils";
import type { Usuario } from "@/types/usuario";
import type { Perfil } from "@/types/perfil";
import type { ContextMenuState } from "@/types/contextMenu";
import { SecaoPaginacaoContext, limparPaginacaoDaSecao } from "@/lib/paginacaoPersistida";
import { useAtalhoSalvarModal } from "@/lib/atalhoSalvarModal";
import { useAtalhoFiltrarModal } from "@/lib/atalhoFiltrarModal";
import { PERFIL_COLUMNS, parseFuncoesConfig } from "@/lib/perfilUtils";
import { obterPerfis, criarPerfil, atualizarPerfil, excluirPerfil } from "@/services/perfilService";

/* ------------------------------------------------------------------ */
/*  Estado inicial do formulário                                      */
/* ------------------------------------------------------------------ */

const emptyForm: Omit<PessoaFisica, "id" | "nr_sequencia" | "dt_criacao" | "dt_alteracao"> = {
  ds_nome: "",
  nr_cpf: "",
  dt_nascimento: "",
  ds_email: "",
  nr_telefone: "",
  nr_seq_sexo: undefined,
  nr_seq_estado_civil: undefined,
  nr_seq_cor_raca: undefined,
  nr_seq_profissao: undefined,
  nr_rg: "",
  dt_emissao: "",
  nr_seq_orgao_emissor: undefined,
  sg_estado: "",
  cd_ibge_naturalidade: "",
  nr_cep: "",
  ds_endereco: "",
  nr_endereco: "",
  ds_bairro: "",
  ds_complemento: "",
  nr_seq_logradouro: undefined,
  ds_tipo_sanguineo: '',
  ds_alergia: [],
  ds_medicamento_continuo: [],
  ds_restricao_alimentar: [],
  ds_necessidade_especial: [],
  ds_observacao_medica: "",
};

/* Chave da sessão persistida no localStorage */
const SESSION_KEY = "quasar_session";

/* Chave da navegação de cada aba do navegador no sessionStorage */
const SESSION_NAV_KEY = "quasar_session_nav";

/* Chave base da preferência de tema no localStorage (uma por usuário) */
const DARK_MODE_KEY = "quasar_dark_mode";

/* Versão do sistema exibida na pop-up do usuário (sincronizada com package.json) */
const SYSTEM_VERSION = "0.94.0";

/* Siglas das UFs para o filtro de Estado do lookup de cidades (IBGE) */
const UF_OPTIONS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG',
  'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
].map((uf) => ({ value: uf, label: uf }));

function getDarkModeKey(userId?: string | null): string {
  return userId ? `${DARK_MODE_KEY}_${userId}` : DARK_MODE_KEY;
}

const ACTIVE_PERFIL_KEY = "quasar_active_perfil";

function getActivePerfilKey(userId?: string | null): string {
  return userId ? `${ACTIVE_PERFIL_KEY}_${userId}` : ACTIVE_PERFIL_KEY;
}

type ViewType = "list" | "form";
type SectionType = "pessoaFisica" | "administracaoSistema" | "cadastrosGerais" | "estruturaAcademica" | "patrimonio" | "relatorio" | "logs" | "controleCopias";

const SECOES: readonly SectionType[] = ["pessoaFisica", "administracaoSistema", "cadastrosGerais", "estruturaAcademica", "patrimonio", "relatorio", "logs", "controleCopias"];

function ehSecao(valor: unknown): valor is SectionType {
  return SECOES.includes(valor as SectionType);
}

type FilterFormData = Omit<
  FormData,
  "nr_sequencia" | "nr_seq_sexo" | "nr_seq_estado_civil" | "nr_seq_cor_raca" | "nr_seq_profissao"
> & {
  nr_sequencia: string;
  dt_nascimento_inicio: string;
  dt_nascimento_fim: string;
  nr_seq_sexo: string;
  nr_seq_estado_civil: string;
  nr_seq_cor_raca: string;
  nr_seq_profissao: string;
};

export type AdminFormData = Omit<Usuario, "id" | "nr_sequencia" | "dt_criacao" | "dt_alteracao">;

const emptyFilterForm: FilterFormData = {
  ...emptyForm,
  nr_sequencia: "",
  dt_nascimento_inicio: "",
  dt_nascimento_fim: "",
  nr_seq_sexo: "",
  nr_seq_estado_civil: "",
  nr_seq_cor_raca: "",
  nr_seq_profissao: "",
};

const emptyAdminForm: AdminFormData = {
  ds_usuario: "",
  ds_usuario_alternativo: "",
  ds_senha: "",
  ds_observacao: "",
  ie_status: 'A',
  ie_base_conhecimento: 'N',
  ie_central_suporte: 'N',
  ie_parametros_funcao: 'N',
  ie_ver_auditoria: 'N',
};

const emptyCgForm: CadastroGeralFormData = {
  descricao: "",
  ie_status: 'A',
  nr_cbo: '',
  sg_sigla: '',
  ds_observacao: '',
  qt_largura: '',
  qt_altura: '',
};

const CG_SELECT_OPTIONS = [
  { value: 'cargo', label: 'Cargo' },
  { value: 'combustivel', label: 'Combustível' },
  { value: 'corRaca', label: 'Cor/Raça' },
  { value: 'estadoCivil', label: 'Estado civil' },
  { value: 'formatoPapel', label: 'Formato do papel' },
  { value: 'grauParentesco', label: 'Grau de parentesco' },
  { value: 'localizacao', label: 'Localização' },
  { value: 'logradouro', label: 'Logradouro' },
  { value: 'marca', label: 'Marca' },
  { value: 'modalidadeEnsino', label: 'Modalidade de ensino' },
  { value: 'orgaoEmissor', label: 'Órgão emissor' },
  { value: 'profissao', label: 'Profissão' },
  { value: 'sexo', label: 'Sexo' },
  { value: 'sistemaOperacional', label: 'Sistema operacional' },
  { value: 'tipoPapel', label: 'Tipo de papel' },
  { value: 'vinculoContratual', label: 'Vínculo contratual' },
];

/* Opções do dropdown da função Pessoas Físicas / Pessoas Jurídicas */
const PJ_SELECT_OPTIONS = [
  { value: 'pessoasFisicas', label: 'Pessoas Físicas' },
  { value: 'pessoasJuridicas', label: 'Pessoas Jurídicas' },
];

/* Opções do dropdown da função Estrutura Acadêmica */
/** Campos próprios da turma no formulário (texto; vazio = sem valor). */
interface TurmaCamposForm {
  nr_seq_curso: string;
  nr_seq_periodo_letivo: string;
  qt_max_alunos: string;
  nr_seq_localizacao: string;
  nr_seq_modalidade_ensino: string;
}

/** Campos do formulário de Turmas preenchidos por lookup. */
type TurmaCampoLookup = 'nr_seq_curso' | 'nr_seq_periodo_letivo' | 'nr_seq_localizacao';

/** Campos próprios de Turmas x Disciplinas no formulário (texto; vazio = sem valor). */
interface TurmaDisciplinaCamposForm {
  nr_seq_turma: string;
  nr_seq_disciplina: string;
}

const TURMA_DISCIPLINA_CAMPOS_VAZIOS: TurmaDisciplinaCamposForm = { nr_seq_turma: '', nr_seq_disciplina: '' };

/** Filtro de Turmas x Disciplinas (Período letivo vem da turma). */
const TURMA_DISCIPLINA_FILTRO_VAZIO = { nr_seq_turma: '', nr_seq_disciplina: '', nr_seq_periodo_letivo: '' };

const TURMA_CAMPOS_VAZIOS: TurmaCamposForm = {
  nr_seq_curso: '',
  nr_seq_periodo_letivo: '',
  qt_max_alunos: '',
  nr_seq_localizacao: '',
  nr_seq_modalidade_ensino: '',
};

/**
 * Opções de um dropdown de referência: os registros ativos e, se já estiver
 * escolhido, o atual (mesmo inativo), para não sumir do formulário.
 */
function opcoesDeReferencia<T extends { nr_sequencia: number; ie_status?: string }>(
  lista: T[], descricao: (item: T) => string | undefined, atual: string
): { value: string; label: string }[] {
  return lista
    .filter((item) => String(item.ie_status ?? 'A').toUpperCase() !== 'I' || String(item.nr_sequencia) === atual)
    .map((item) => ({ value: String(item.nr_sequencia), label: descricao(item) || `#${item.nr_sequencia}` }))
    .sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'));
}

const EA_SELECT_OPTIONS = [
  { value: 'alunos', label: '1. Alunos' },
  { value: 'colaboradores', label: '2. Colaboradores' },
  { value: 'periodoLetivo', label: '3. Período Letivo' },
  { value: 'cursos', label: '4. Cursos' },
  { value: 'turmas', label: '5. Turmas' },
  { value: 'disciplinas', label: '6. Disciplinas' },
  { value: 'turmasDisciplinas', label: '7. Turmas x Disciplinas' },
];

/* Opções do dropdown da função Patrimônio */
const PATRIMONIO_SELECT_OPTIONS = [
  { value: 'ativos', label: 'Ativos' },
  { value: 'categoria', label: 'Categoria' },
  { value: 'manutencoes', label: 'Manutenções' },
];

const RELATORIO_SELECT_OPTIONS = [
  { value: 'relatorio', label: 'Relatórios' },
  { value: 'importarRelatorio', label: 'Importar relatório' },
];

/* Opções do dropdown da função Controle de Cópias */
const CC_SELECT_OPTIONS = [
  { value: 'copias', label: 'Cópias' },
];

/** Filtro extra de Cópias (rascunho e aplicado). */
/** Filtro de Gerenciador de Relatórios > Relatórios, além de Sequência e Descrição (rascunho e aplicado). */
const RELATORIO_FILTRO_VAZIO = {
  ie_formato: '', ds_nome_arquivo: '', nr_seq_formato_papel: '', ie_orientacao: '', ie_status: 'T',
  nr_seq_usuario_criacao: '', nr_seq_usuario_alteracao: '',
};
const RELATORIO_FORMATO_FILTRO_OPTIONS = [{ value: 'pdf', label: 'PDF' }, { value: 'xls', label: 'XLS' }];
const RELATORIO_ORIENTACAO_FILTRO_OPTIONS = [{ value: 'P', label: 'Padrão' }, { value: 'I', label: 'Invertido' }];
const RELATORIO_STATUS_FILTRO_OPTIONS = [{ value: 'T', label: 'Todos' }, { value: 'A', label: 'Ativo' }, { value: 'I', label: 'Inativo' }];

const COPIA_FILTRO_VAZIO = { ie_status: '', nr_seq_solicitante: '', nr_seq_turma_disciplina: '', nr_seq_formato_papel: '', nr_seq_tipo_papel: '' };

/** Coleções com formulário próprio reaproveitado no "Ver" de Exclusões e no Detalhe da auditoria. */
const COLECOES_COM_FORMULARIO = new Set([
  'pessoa_fisica', 'pessoa_juridica', 'usuario', 'perfil', 'imagem', 'periodo_letivo', 'aluno', 'colaborador',
  'pat_categoria', 'disciplina', 'turma', 'turma_disciplina', 'copia', 'curso', 'pat_manutencao', 'pat_ativo',
]);

/** Evento para chamar um handler de submit fora do formulário ("Salvar filtro", "Salvar e adicionar"). */
const EVENTO_SUBMIT = { preventDefault() {} } as React.FormEvent<HTMLFormElement>;

/** Datas digitadas (DD/MM/AAAA) que não formam uma data válida. */
function datasInvalidas<T extends Record<string, unknown>>(dados: T, campos: (keyof T)[]): (keyof T)[] {
  return campos.filter((campo) => {
    const texto = String(dados[campo] ?? '').trim();
    if (!texto) return false;
    const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(texto);
    if (!m) return true;
    const [dia, mes, ano] = [Number(m[1]), Number(m[2]), Number(m[3])];
    const d = new Date(Date.UTC(ano, mes - 1, dia));
    return d.getUTCFullYear() !== ano || d.getUTCMonth() !== mes - 1 || d.getUTCDate() !== dia;
  });
}

type PjFormData = Omit<PessoaJuridica, "id" | "nr_sequencia" | "dt_criacao" | "dt_alteracao">;

const emptyAlunoForm: AlunoFormData = {
  nr_seq_pessoa_fisica: undefined,
  nr_matricula: "",
  dt_ingresso: "",
  dt_status: "",
  ds_status: "",
  ie_status: 'A',
};

const emptyPeriodoLetivoForm: PeriodoLetivoFormData = {
  nr_ano: undefined,
  ds_periodo_letivo: "",
  qt_dias_letivos: undefined,
  dt_inicio: "",
  dt_previsao_termino: "",
  dt_termino: "",
  dt_reativacao: "",
  ie_status: 'A',
};

const emptyColaboradorForm: ColaboradorFormData = {
  nr_seq_pessoa_fisica: undefined,
  nr_seq_pessoa_juridica: undefined,
  nr_seq_vinculo_contratual: undefined,
  nr_seq_cargo: undefined,
  ie_coordenador: 'N',
  ie_professor: 'N',
  ie_fornecedor: 'N',
  ie_prestador_servico: 'N',
  nr_matricula: "",
  dt_admissao: "",
  dt_status: "",
  ds_motivo_status: "",
  ie_status: 'A',
};

const emptyAtivoForm: AtivoFormData = {
  cd_externo: "",
  ds_ativo: "",
  nr_seq_categoria: undefined,
  nr_seq_localizacao: undefined,
  nr_seq_marca: undefined,
  nr_seq_fornecedor: undefined,
  ds_modelo: "",
  nr_serie: "",
  ds_qr_code: "",
  ds_codigo_barras: "",
  ie_status: 'O',
  dt_ultima_manutencao: '',
  nr_seq_ultima_manutencao: undefined,
  dt_status: '',
  ds_motivo_status: '',
  vl_aquisicao: '',
  dt_aquisicao: '',
  dt_garantia: '',
  ds_processador: "",
  qt_ram: undefined,
  ie_ram: '',
  qt_armazenamento: undefined,
  ie_armazenamento: "",
  ds_endereco_mac: "",
  ds_ip: "",
  nr_seq_sistema_operacional: undefined,
  cd_placa: '',
  cd_renavam: '',
  nr_ano: undefined,
  ds_cor: '',
  nr_seq_combustivel: undefined,
  ds_observacao: "",
};

/** Chaves da seção Informações médicas (Pessoa Física) com lista de valores
 * (Observações médicas é campo único e fica de fora). */
const CAMPOS_MEDICOS = [
  'ds_alergia',
  'ds_medicamento_continuo',
  'ds_restricao_alimentar',
  'ds_necessidade_especial',
] as const;

/** Extrai os valores preenchidos das listas de informações médicas (descarta vazios). */
function filtroValoresMedicos(pessoa: Partial<PessoaFisica>): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  for (const campo of CAMPOS_MEDICOS) {
    const lista = pessoa[campo];
    result[campo] = Array.isArray(lista) ? lista.filter((v) => v && v.trim() !== '') : [];
  }
  return result;
}

const emptyPjForm: PjFormData = {
  ds_razao_social: "",
  ds_nome_fantasia: "",
  nr_cnpj: "",
  nr_inscricao_estadual: "",
  nr_inscricao_municipal: "",
  dt_abertura: "",
  nr_telefone: "",
  ds_email: "",
  nr_cep: "",
  ds_endereco: "",
  nr_endereco: "",
  ds_bairro: "",
  ds_complemento: "",
  nr_seq_logradouro: undefined,
  sg_estado: "",
  cd_ibge_cidade: "",
};

type PjFilterFormData = {
  nr_sequencia: string;
  ds_razao_social: string;
  ds_nome_fantasia: string;
  nr_cnpj: string;
  nr_inscricao_estadual: string;
  nr_inscricao_municipal: string;
  dt_abertura_inicio: string;
  dt_abertura_fim: string;
  ds_email: string;
  nr_telefone: string;
  sg_estado: string;
  cd_ibge_cidade: string;
};

const emptyPjFilterForm: PjFilterFormData = {
  nr_sequencia: '',
  ds_razao_social: '',
  ds_nome_fantasia: '',
  nr_cnpj: '',
  nr_inscricao_estadual: '',
  nr_inscricao_municipal: '',
  dt_abertura_inicio: '',
  dt_abertura_fim: '',
  ds_email: '',
  nr_telefone: '',
  sg_estado: '',
  cd_ibge_cidade: '',
};

type CgItem = Sexo | EstadoCivil | CorRaca | Profissao | OrgaoEmissor | Logradouro | GrauParentesco | Cargo | VinculoContratual | Localizacao | Marca | CategoriaAtivo | SistemaOperacional | Combustivel | ModalidadeEnsino | FormatoPapel | TipoPapel;

/* ------------------------------------------------------------------ */
/*  Funções do menu lateral (ordenáveis por arrastar)                */
/* ------------------------------------------------------------------ */

const DEFAULT_SECTION_ORDER: SectionType[] = ["pessoaFisica", "administracaoSistema", "cadastrosGerais", "estruturaAcademica", "patrimonio", "relatorio", "logs", "controleCopias"];

function normalizeMenuOrder(parsed: SectionType[]): SectionType[] {
  const result = [...new Set(parsed)];
  for (const section of DEFAULT_SECTION_ORDER) {
    if (!result.includes(section)) result.push(section);
  }
  return result;
}

function parseMenuOrder(raw?: string | null): SectionType[] | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return null;
    const valid = parsed.filter((s) => s === "pessoaFisica" || s === "administracaoSistema" || s === "cadastrosGerais" || s === "estruturaAcademica" || s === "patrimonio" || s === "relatorio" || s === "logs" || s === "controleCopias") as SectionType[];
    if (valid.length === 0) return null;
    return valid;
  } catch {
    return null;
  }
}

function serializeMenuOrder(order: SectionType[]): string {
  return JSON.stringify(order);
}

function serializeFuncoesConfig(funcoes: SectionType[]): string {
  return JSON.stringify(funcoes);
}

function parsePerfisConfig(raw?: string | null): number[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((v) => typeof v === 'number').map(Number);
  } catch {
    return [];
  }
}

function serializePerfisConfig(perfis: number[]): string {
  return JSON.stringify(perfis);
}

// Usuário 'administrador' e perfil 'Administrador' são protegidos: outros
// usuários só podem vê-los (não alterar/excluir/delegar).
function isAdministradorUsuario(usuario?: { ds_usuario?: string | null } | null): boolean {
  return (usuario?.ds_usuario ?? '').trim().toLowerCase() === 'administrador';
}

function isAdministradorPerfil(perfil?: { ds_perfil?: string | null } | null): boolean {
  return (perfil?.ds_perfil ?? '').trim().toLowerCase() === 'administrador';
}

/**
 * Largura do menu lateral aberto: acompanha o maior nome de função (medido no
 * navegador), sem ficar menor que LARGURA_MENU_MIN nem maior que LARGURA_MENU_MAX.
 */
const LARGURA_MENU_MIN = 240;
const LARGURA_MENU_MAX = 320;
/** Espaço fixo de um item além do nome: borda (1) + nav px-1 (8) + botão px-1.5 (12) + ícone (28) + 2 gaps (20) + alça (16). */
const LARGURA_MENU_FIXA_ITEM = 85;

const SECTION_DEFS: Record<SectionType, { label: string; icon: React.ReactNode }> = {
  pessoaFisica: {
    label: "Cadastro de Pessoas",
    icon: (
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="7" r="3" />
        <circle cx="6.5" cy="9.5" r="2" />
        <circle cx="17.5" cy="9.5" r="2" />
        <path d="M4 19a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4" />
      </svg>
    ),
  },
  administracaoSistema: {
    label: "Administração do Sistema",
    icon: (
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="5" y="6" width="14" height="12" rx="2" />
        <path d="M8 4v2" />
        <path d="M16 4v2" />
        <path d="M12 4v2" />
        <path d="M8 20v-2" />
        <path d="M16 20v-2" />
        <path d="M4 10h2" />
        <path d="M4 14h2" />
        <path d="M20 10h2" />
        <path d="M20 14h2" />
        <path d="M7 12h10" />
      </svg>
    ),
  },
  cadastrosGerais: {
    label: "Cadastros Gerais",
    icon: (
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  estruturaAcademica: {
    label: "Estrutura Acadêmica",
    icon: (
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m2 9 10-5 10 5-10 5z" />
        <path d="M6 11v5c0 1.1 2.7 3 6 3s6-1.9 6-3v-5" />
        <path d="M22 9v5" />
      </svg>
    ),
  },
  patrimonio: {
    label: "Patrimônio",
    icon: (
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
        <path d="m3.3 7 8.7 5 8.7-5" />
        <path d="M12 22V12" />
      </svg>
    ),
  },
  relatorio: {
    label: "Gerenciador de Relatórios",
    icon: (
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
        <path d="M14 2v6h6" />
        <path d="M16 13H8" />
        <path d="M16 17H8" />
        <path d="M10 9H8" />
      </svg>
    ),
  },
  logs: {
    label: "Logs",
    icon: (
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
        <path d="M3 3v5h5" />
        <path d="M12 7v5l4 2" />
      </svg>
    ),
  },
  controleCopias: {
    label: "Controle de Cópias",
    icon: (
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M6 9V2h12v7" />
        <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
        <path d="M6 14h12v8H6z" />
      </svg>
    ),
  },
};

/* Ordem alfabética das funções (pelos nomes do menu lateral) */
const SECTION_ORDER_ALPHABETICAL: SectionType[] = [...DEFAULT_SECTION_ORDER].sort((a, b) =>
  SECTION_DEFS[a].label.localeCompare(SECTION_DEFS[b].label, 'pt-BR')
);

/* ------------------------------------------------------------------ */
/*  Tipos das props dos subcomponentes                                */
/* ------------------------------------------------------------------ */

interface ListViewProps {
  message: string;
  loading: boolean;
  pessoasFisicas: PessoaFisica[];
  openNewForm: () => void;
  openEditForm: (pessoa: PessoaFisica) => void;
  handleDelete: (id: string) => void;
  openFilter: () => void;
  setContextMenu: React.Dispatch<React.SetStateAction<{
    x: number;
    y: number;
    pessoa: PessoaFisica;
  } | null>>;
  sortColumn: number | null;
  sortAsc: boolean | null;
  onSortChange: (logicalIndex: number) => void;
}

type FormData = Omit<PessoaFisica, "id" | "nr_sequencia" | "dt_criacao" | "dt_alteracao">;

interface FormViewProps {
  message: string;
  editingId: string | null;
  sequence?: number | null;
  form: FormData;
  setForm: React.Dispatch<React.SetStateAction<FormData>>;
  submitting: boolean;
  handleSubmit: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;
  goToList: () => void;
  createdAt: string;
  updatedAt: string;
  onOpenAudit?: (pessoaId?: string | null) => void;
  onPrevRecord: () => void;
  onNextRecord: () => void;
  hasPrevRecord: boolean;
  hasNextRecord: boolean;
}

/* ------------------------------------------------------------------ */
/*  Componente principal                                              */
/* ------------------------------------------------------------------ */

export default function Home() {
  // Nos campos de lookup, só a sequência recebe foco (a descrição não fica selecionada).
  useDescricaoLookupSemFoco();
  const [form, setForm] = useState<FormData>(emptyForm);
  const [filterForm, setFilterForm] = useState<FilterFormData>(emptyFilterForm);
  const [appliedFilterForm, setAppliedFilterForm] = useState<FilterFormData>(emptyFilterForm);
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  type AdminFilterFormData = {
    nr_sequencia: string;
    ds_usuario: string;
    ds_usuario_alternativo: string;
    nr_seq_pessoa_fisica: string;
    ie_status: string;
  };
  const emptyAdminFilterForm: AdminFilterFormData = {
    nr_sequencia: '',
    ds_usuario: '',
    ds_usuario_alternativo: '',
    nr_seq_pessoa_fisica: '',
    ie_status: 'T',
  };
  const [adminFilterForm, setAdminFilterForm] = useState<AdminFilterFormData>(emptyAdminFilterForm);
  const [appliedAdminFilterForm, setAppliedAdminFilterForm] = useState<AdminFilterFormData>(emptyAdminFilterForm);
  const [adminFilterModalOpen, setAdminFilterModalOpen] = useState(false);
  const [adminPessoaFisicaLookupOpen, setAdminPessoaFisicaLookupOpen] = useState(false);
  const [adminPessoaFisicaLookupForm, setAdminPessoaFisicaLookupForm] = useState({ ds_nome: '', nr_sequencia: '', nr_cpf: '' });
  const [adminPessoaFisicaLookupFilter, setAdminPessoaFisicaLookupFilter] = useState({ ds_nome: '', nr_sequencia: '', nr_cpf: '' });
  const [adminPessoaFisicaLookupApplied, setAdminPessoaFisicaLookupApplied] = useState(false);
  const [pessoasFisicas, setPessoasFisicas] = useState<PessoaFisica[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [auditInfo, setAuditInfo] = useState({ createdAt: '', updatedAt: '', createdBy: '', updatedBy: '' });
  const auditPessoaIdRef = useRef<string | null>(null);
  // Carregamentos de listas em andamento (contador): com várias cargas em paralelo,
  // o modal "Carregando..." só sai quando todas terminam.
  const [loadingCount, setLoadingCount] = useState(0);
  const loading = loadingCount > 0;
  const setLoading = useCallback((ativo: boolean) => {
    setLoadingCount((n) => (ativo ? n + 1 : Math.max(0, n - 1)));
  }, []);
  const [submitting, setSubmitting] = useState(false);
  const [auditModalOpen, setAuditModalOpen] = useState(false);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([]);
  const [auditDocumentType, setAuditDocumentType] = useState<'pessoa_fisica' | 'pessoa_fisica_residencial' | 'pessoa_fisica_comercial' | 'pessoa_fisica_saude' | 'pessoa_juridica' | 'usuario' | 'perfil' | 'aluno' | 'colaborador' | 'curso' | 'periodo_letivo' | 'periodo_letivo_feriado' | 'pat_ativo' | 'pat_ativo_responsavel' | 'aluno_responsavel' | 'pat_manutencao' | 'parametro' | 'cg_sexo' | 'cg_estado_civil' | 'cg_cor_raca' | 'cg_profissao' | 'cg_orgao_emissor' | 'cg_logradouro' | 'cg_grau_parentesco' | 'cg_cargo' | 'cg_vinculo_contratual' | 'cg_localizacao' | 'cg_marca' | 'pat_categoria' | 'cg_sistema_operacional' | 'cg_combustivel' | 'cg_modalidade_ensino' | 'cg_formato_papel' | 'cg_tipo_papel' | 'copia' | 'campo' | 'disciplina' | 'turma' | 'turma_disciplina' | 'relatorio' | 'imagem' | 'aviso' | 'regra'>('pessoa_fisica');
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedAuditIndex, setSelectedAuditIndex] = useState<number | null>(null);
  /** Tipos das colunas do banco (Detalhe da auditoria: datas sem hora exibidas como DD/MM/AAAA). */
  const [esquemaAuditoria, setEsquemaAuditoria] = useState<Awaited<ReturnType<typeof carregarEsquema>> | null>(null);
  /** Nome ("Cidade - UF") de cada código IBGE exibido no Detalhe da auditoria (Naturalidade, Cidade). */
  const [cidadesAuditoria, setCidadesAuditoria] = useState<Record<string, string>>({});
  const [message, setMessageEstado] = useState("");
  /** Última mensagem enviada ao toast (lida pelo "Salvar e adicionar"). */
  const ultimaMensagemRef = useRef("");
  const setMessage = useCallback((mensagem: string) => {
    ultimaMensagemRef.current = mensagem;
    setMessageEstado(mensagem);
  }, []);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  /** Aviso aberto em modal (ex.: Política de Privacidade no menu do usuário). */
  const [avisoModalCampo, setAvisoModalCampo] = useState<CampoAviso | null>(null);
  // Largura do menu aberto, medida a partir do maior nome de função exibido.
  const sidebarRef = useRef<HTMLElement | null>(null);
  const [larguraMenuAberto, setLarguraMenuAberto] = useState(LARGURA_MENU_MIN);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sessionRestoring, setSessionRestoring] = useState(true);
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isUserMenuClosing, setIsUserMenuClosing] = useState(false);
  const [currentUser, setCurrentUser] = useState<Usuario | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginWarning, setLoginWarning] = useState<string | null>(null);
  // Nenhuma função vem selecionada ao entrar: o usuário escolhe no menu lateral.
  const [activeSection, setActiveSection] = useState<SectionType | null>(null);
  /** "Parâmetros da Função" (pop-up do usuário): função a selecionar em Parâmetros; `vez` remonta a tela. */
  const [parametrosFuncaoInicial, setParametrosFuncaoInicial] = useState<{ funcao: string | null; vez: number }>({ funcao: null, vez: 0 });
  /** Funções abertas (montadas) — a ativa aparece, as demais ficam escondidas até o usuário voltar a elas. */
  const [secoesAbertas, setSecoesAbertas] = useState<SectionType[]>([]);
  /** Função cujo fechamento aguarda confirmação no modal. */
  const [secaoParaFechar, setSecaoParaFechar] = useState<SectionType | null>(null);
  /** Regras do sistema (Administração do Sistema > Sistema), ex.: logout automático. */
  const [regraSistema, setRegraSistema] = useState<Regra | null>(null);
  /** Início da sessão (ms): o logout automático encerra sessões iniciadas antes do horário programado. */
  const [sessaoInicio, setSessaoInicio] = useState<number | null>(null);
  if (activeSection && !secoesAbertas.includes(activeSection)) {
    setSecoesAbertas([...secoesAbertas, activeSection]);
  }
  const [view, setView] = useState<ViewType>("list");
  // Lembra em que tela (lista ou formulário) o usuário estava em cada função do
  // menu lateral, para restaurar ao voltar — mesma tela de antes da navegação.
  const [sectionViews, setSectionViews] = useState<Partial<Record<SectionType, ViewType>>>({});
  useEffect(() => {
    if (!activeSection) return;
    setSectionViews((prev) => {
      if (prev[activeSection] === view) return prev;
      return { ...prev, [activeSection]: view };
    });
  }, [activeSection, view]);
  const [adminManageSelection, setAdminManageSelection] = useState<string>('');
  const [adminInteracted, setAdminInteracted] = useState(false);
  const [camposPerfilId, setCamposPerfilId] = useState<string | null>(null);
  const [camposFuncao, setCamposFuncao] = useState<string | null>(null);
  const [camposFuncaoJaSelecionada, setCamposFuncaoJaSelecionada] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMounted, setToastMounted] = useState(false);
  // Status forçado do toast (quando a mensagem não permite inferência por texto).
  const [toastForced, setToastForced] = useState<{ msg: string; status: ToastStatus } | null>(null);
  const [sortColumn, setSortColumn] = useState<number | null>(null);
  const [sortAsc, setSortAsc] = useState<boolean | null>(null);
  const [adminSortColumn, setAdminSortColumn] = useState<number | null>(null);
  const [adminSortAsc, setAdminSortAsc] = useState<boolean | null>(null);
  const [cgSortColumn, setCgSortColumn] = useState<number | null>(null);
  const [cgSortAsc, setCgSortAsc] = useState<boolean | null>(null);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [perfis, setPerfis] = useState<Perfil[]>([]);
  const [sexos, setSexos] = useState<Sexo[]>([]);
  const [estadoCivis, setEstadoCivis] = useState<EstadoCivil[]>([]);
  const [coresRacas, setCoresRacas] = useState<CorRaca[]>([]);
  const [profissoes, setProfissoes] = useState<Profissao[]>([]);
  const [orgaosEmissores, setOrgaosEmissores] = useState<OrgaoEmissor[]>([]);
  const [logradouros, setLogradouros] = useState<Logradouro[]>([]);
  const [grausParentesco, setGrausParentesco] = useState<GrauParentesco[]>([]);
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [vinculosContratuais, setVinculosContratuais] = useState<VinculoContratual[]>([]);
  const [localizacoes, setLocalizacoes] = useState<Localizacao[]>([]);
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [categoriasAtivos, setCategoriasAtivos] = useState<CategoriaAtivo[]>([]);
  const [sistemasOperacionais, setSistemasOperacionais] = useState<SistemaOperacional[]>([]);
  const [combustiveis, setCombustiveis] = useState<Combustivel[]>([]);
  const [modalidadesEnsino, setModalidadesEnsino] = useState<ModalidadeEnsino[]>([]);
  const [formatosPapel, setFormatosPapel] = useState<FormatoPapel[]>([]);
  const [tiposPapel, setTiposPapel] = useState<TipoPapel[]>([]);
  const [estados, setEstados] = useState<{ value: string; label: string }[]>([]);
  const [cgForm, setCgForm] = useState<CadastroGeralFormData>(emptyCgForm);
  const [cgEditingId, setCgEditingId] = useState<string | null>(null);
  const [cgSubmitting, setCgSubmitting] = useState(false);
  const [cgAuditInfo, setCgAuditInfo] = useState({ createdAt: '', updatedAt: '', createdBy: '', updatedBy: '' });
  const auditCgIdRef = useRef<string | null>(null);
  const [cgFilterModalOpen, setCgFilterModalOpen] = useState(false);
  const [cgFilterForm, setCgFilterForm] = useState<CadastroGeralFilterForm>({ nr_sequencia: '', descricao: '', ie_status: 'T' });
  const [appliedCgFilterForm, setAppliedCgFilterForm] = useState<CadastroGeralFilterForm>({ nr_sequencia: '', descricao: '', ie_status: 'T' });
  const [cgManageSelection, setCgManageSelection] = useState<string>('');
  const [cgInteracted, setCgInteracted] = useState(false);
  const [adminForm, setAdminForm] = useState<AdminFormData>(emptyAdminForm);
  const [adminEditingId, setAdminEditingId] = useState<string | null>(null);
  const [adminSubmitting, setAdminSubmitting] = useState(false);
  const [adminAuditInfo, setAdminAuditInfo] = useState({ createdAt: '', updatedAt: '', createdBy: '', updatedBy: '' });
  const auditUsuarioIdRef = useRef<string | null>(null);
  const [perfilForm, setPerfilForm] = useState<PerfilFormData>({ ds_perfil: '', ds_observacao: '', ie_status: 'A' });
  const [perfilEditingId, setPerfilEditingId] = useState<string | null>(null);
  const [perfilSubmitting, setPerfilSubmitting] = useState(false);
  const [perfilAuditInfo, setPerfilAuditInfo] = useState({ createdAt: '', updatedAt: '', createdBy: '', updatedBy: '' });
  const auditPerfilIdRef = useRef<string | null>(null);
  const [perfilFilterForm, setPerfilFilterForm] = useState({ nr_sequencia: '', ds_perfil: '', ie_status: 'T' });
  const [appliedPerfilFilterForm, setAppliedPerfilFilterForm] = useState({ nr_sequencia: '', ds_perfil: '', ie_status: 'T' });
  const [perfilFilterModalOpen, setPerfilFilterModalOpen] = useState(false);
  const [perfilSortColumn, setPerfilSortColumn] = useState<number | null>(null);
  const [perfilSortAsc, setPerfilSortAsc] = useState<boolean | null>(null);
  const [delegateFuncoesModalOpen, setDelegateFuncoesModalOpen] = useState(false);
  const [delegateFuncoesPerfil, setDelegateFuncoesPerfil] = useState<Perfil | null>(null);
  const [delegateFuncoes, setDelegateFuncoes] = useState<SectionType[]>([]);
  const [delegateFuncoesSaving, setDelegateFuncoesSaving] = useState(false);
  // Modal "Permissões da função" (aberto pelo card de função no modal Delegar funções).
  const [permissoesModalOpen, setPermissoesModalOpen] = useState(false);
  const [permissoesPerfil, setPermissoesPerfil] = useState<Perfil | null>(null);
  const [permissoesFuncao, setPermissoesFuncao] = useState<SectionType | null>(null);
  const [permissoesSelecionadas, setPermissoesSelecionadas] = useState<string[]>([]);
  const [permissoesSaving, setPermissoesSaving] = useState(false);
  const [delegatePerfisModalOpen, setDelegatePerfisModalOpen] = useState(false);
  const [activePerfilSequencia, setActivePerfilSequencia] = useState<number | null>(null);
  const [duplicatePerfilModalOpen, setDuplicatePerfilModalOpen] = useState(false);
  const [duplicatePerfilSource, setDuplicatePerfilSource] = useState<Perfil | null>(null);
  const [duplicatePerfilName, setDuplicatePerfilName] = useState('');
  const [duplicatePerfilSaving, setDuplicatePerfilSaving] = useState(false);
  // Campos obrigatórios vazios por formulário (Administração > Campos).
  const [pfCampoErros, setPfCampoErros] = useState<string[]>([]);
  const [pjCampoErros, setPjCampoErros] = useState<string[]>([]);
  const [adminCampoErros, setAdminCampoErros] = useState<string[]>([]);
  const [perfilCampoErros, setPerfilCampoErros] = useState<string[]>([]);
  const [cgCampoErros, setCgCampoErros] = useState<string[]>([]);
  /* Patrimônio > Categoria (coleção pat_categoria): usa os componentes genéricos
     de Cadastros Gerais, mas com estado próprio — as duas funções podem estar
     abertas ao mesmo tempo sem uma interferir na edição da outra. */
  const [categoriaForm, setCategoriaForm] = useState<CadastroGeralFormData>(emptyCgForm);
  /* Estrutura Acadêmica > Cursos (coleção curso): mesmos componentes genéricos da Categoria. */
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [cursoForm, setCursoForm] = useState<CadastroGeralFormData>(emptyCgForm);
  const [cursoEditingId, setCursoEditingId] = useState<string | null>(null);
  const [cursoSubmitting, setCursoSubmitting] = useState(false);
  const [cursoAuditInfo, setCursoAuditInfo] = useState({ createdAt: '', updatedAt: '', createdBy: '', updatedBy: '' });
  const auditCursoIdRef = useRef<string | null>(null);
  const [cursoCampoErros, setCursoCampoErros] = useState<string[]>([]);
  const [cursoSortColumn, setCursoSortColumn] = useState<number | null>(null);
  const [cursoSortAsc, setCursoSortAsc] = useState<boolean | null>(null);
  const [cursoFilterModalOpen, setCursoFilterModalOpen] = useState(false);
  const [cursoFilterForm, setCursoFilterForm] = useState<CadastroGeralFilterForm>({ nr_sequencia: '', descricao: '', ie_status: 'T' });
  const [appliedCursoFilterForm, setAppliedCursoFilterForm] = useState<CadastroGeralFilterForm>({ nr_sequencia: '', descricao: '', ie_status: 'T' });
  /* Estrutura Acadêmica > Disciplinas (coleção disciplina): mesmos componentes genéricos da Categoria. */
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [disciplinaForm, setDisciplinaForm] = useState<CadastroGeralFormData>(emptyCgForm);
  const [disciplinaEditingId, setDisciplinaEditingId] = useState<string | null>(null);
  const [disciplinaSubmitting, setDisciplinaSubmitting] = useState(false);
  const [disciplinaAuditInfo, setDisciplinaAuditInfo] = useState({ createdAt: '', updatedAt: '', createdBy: '', updatedBy: '' });
  const auditDisciplinaIdRef = useRef<string | null>(null);
  const [disciplinaCampoErros, setDisciplinaCampoErros] = useState<string[]>([]);
  const [disciplinaSortColumn, setDisciplinaSortColumn] = useState<number | null>(null);
  const [disciplinaSortAsc, setDisciplinaSortAsc] = useState<boolean | null>(null);
  const [disciplinaFilterModalOpen, setDisciplinaFilterModalOpen] = useState(false);
  const [disciplinaFilterForm, setDisciplinaFilterForm] = useState<CadastroGeralFilterForm>({ nr_sequencia: '', descricao: '', ie_status: 'T' });
  const [appliedDisciplinaFilterForm, setAppliedDisciplinaFilterForm] = useState<CadastroGeralFilterForm>({ nr_sequencia: '', descricao: '', ie_status: 'T' });
  /* Estrutura Acadêmica > Turmas (coleção turma): mesmos componentes genéricos da Categoria. */
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [turmaForm, setTurmaForm] = useState<CadastroGeralFormData>(emptyCgForm);
  const [turmaEditingId, setTurmaEditingId] = useState<string | null>(null);
  const [turmaSubmitting, setTurmaSubmitting] = useState(false);
  const [turmaAuditInfo, setTurmaAuditInfo] = useState({ createdAt: '', updatedAt: '', createdBy: '', updatedBy: '' });
  const auditTurmaIdRef = useRef<string | null>(null);
  const [turmaCampoErros, setTurmaCampoErros] = useState<string[]>([]);
  const [turmaSortColumn, setTurmaSortColumn] = useState<number | null>(null);
  const [turmaSortAsc, setTurmaSortAsc] = useState<boolean | null>(null);
  const [turmaFilterModalOpen, setTurmaFilterModalOpen] = useState(false);
  const [turmaFilterForm, setTurmaFilterForm] = useState<CadastroGeralFilterForm>({ nr_sequencia: '', descricao: '', ie_status: 'T' });
  const [appliedTurmaFilterForm, setAppliedTurmaFilterForm] = useState<CadastroGeralFilterForm>({ nr_sequencia: '', descricao: '', ie_status: 'T' });
  /** Campos próprios da turma (além da descrição), como texto do formulário. */
  const [turmaExtra, setTurmaExtra] = useState<TurmaCamposForm>(TURMA_CAMPOS_VAZIOS);
  /** Lookup aberto no formulário de Turmas (Curso, Período letivo ou Localização). */
  const [turmaLookupCampo, setTurmaLookupCampo] = useState<TurmaCampoLookup | null>(null);
  /** Filtro extra de Turmas: Curso e Período letivo (rascunho e aplicado). */
  const [turmaFiltroExtra, setTurmaFiltroExtra] = useState({ nr_seq_curso: '', nr_seq_periodo_letivo: '' });
  const [turmaFiltroExtraAplicado, setTurmaFiltroExtraAplicado] = useState({ nr_seq_curso: '', nr_seq_periodo_letivo: '' });
  /* Estrutura Acadêmica > Turmas x Disciplinas (coleção turma_disciplina). */
  const [turmasDisciplinas, setTurmasDisciplinas] = useState<TurmaDisciplina[]>([]);
  const [turmaDisciplinaForm, setTurmaDisciplinaForm] = useState<CadastroGeralFormData>(emptyCgForm);
  const [turmaDisciplinaExtra, setTurmaDisciplinaExtra] = useState<TurmaDisciplinaCamposForm>(TURMA_DISCIPLINA_CAMPOS_VAZIOS);
  const [turmaDisciplinaEditingId, setTurmaDisciplinaEditingId] = useState<string | null>(null);
  const [turmaDisciplinaSubmitting, setTurmaDisciplinaSubmitting] = useState(false);
  const [turmaDisciplinaAuditInfo, setTurmaDisciplinaAuditInfo] = useState({ createdAt: '', updatedAt: '', createdBy: '', updatedBy: '' });
  const auditTurmaDisciplinaIdRef = useRef<string | null>(null);
  const [turmaDisciplinaCampoErros, setTurmaDisciplinaCampoErros] = useState<string[]>([]);
  const [turmaDisciplinaSortColumn, setTurmaDisciplinaSortColumn] = useState<number | null>(null);
  const [turmaDisciplinaSortAsc, setTurmaDisciplinaSortAsc] = useState<boolean | null>(null);
  const [turmaDisciplinaFilterModalOpen, setTurmaDisciplinaFilterModalOpen] = useState(false);
  const [turmaDisciplinaFilterForm, setTurmaDisciplinaFilterForm] = useState<CadastroGeralFilterForm>({ nr_sequencia: '', descricao: '', ie_status: 'T' });
  const [appliedTurmaDisciplinaFilterForm, setAppliedTurmaDisciplinaFilterForm] = useState<CadastroGeralFilterForm>({ nr_sequencia: '', descricao: '', ie_status: 'T' });
  /** Filtro extra: Turma e Disciplina (rascunho e aplicado). */
  const [turmaDisciplinaFiltroExtra, setTurmaDisciplinaFiltroExtra] = useState(TURMA_DISCIPLINA_FILTRO_VAZIO);
  const [turmaDisciplinaFiltroExtraAplicado, setTurmaDisciplinaFiltroExtraAplicado] = useState(TURMA_DISCIPLINA_FILTRO_VAZIO);
  /** Lookup aberto no formulário de Turmas x Disciplinas. */
  const [turmaDisciplinaLookupCampo, setTurmaDisciplinaLookupCampo] = useState<'nr_seq_turma' | 'nr_seq_disciplina' | null>(null);
  /* Controle de Cópias > Cópias (coleção copia). */
  const [copias, setCopias] = useState<Copia[]>([]);
  const [copiaForm, setCopiaForm] = useState<CadastroGeralFormData>(emptyCgForm);
  const [copiaExtra, setCopiaExtra] = useState<CopiaCamposForm>(COPIA_CAMPOS_VAZIOS);
  /** Arquivo escolhido no formulário e ainda não enviado (vai ao Storage no Salvar). */
  const [copiaArquivoNovo, setCopiaArquivoNovo] = useState<File | null>(null);
  const [copiaEditingId, setCopiaEditingId] = useState<string | null>(null);
  const [copiaSubmitting, setCopiaSubmitting] = useState(false);
  const [copiaAuditInfo, setCopiaAuditInfo] = useState({ createdAt: '', updatedAt: '', createdBy: '', updatedBy: '' });
  const auditCopiaIdRef = useRef<string | null>(null);
  const [copiaCampoErros, setCopiaCampoErros] = useState<string[]>([]);
  const [copiaSortColumn, setCopiaSortColumn] = useState<number | null>(null);
  const [copiaSortAsc, setCopiaSortAsc] = useState<boolean | null>(null);
  const [copiaFilterModalOpen, setCopiaFilterModalOpen] = useState(false);
  const [copiaFilterForm, setCopiaFilterForm] = useState<CadastroGeralFilterForm>({ nr_sequencia: '', descricao: '', ie_status: 'T' });
  const [appliedCopiaFilterForm, setAppliedCopiaFilterForm] = useState<CadastroGeralFilterForm>({ nr_sequencia: '', descricao: '', ie_status: 'T' });
  const [copiaFiltroExtra, setCopiaFiltroExtra] = useState(COPIA_FILTRO_VAZIO);
  const [copiaFiltroExtraAplicado, setCopiaFiltroExtraAplicado] = useState(COPIA_FILTRO_VAZIO);
  /** Lookup de Turma x Disciplina aberto: no formulário ou no filtro. */
  const [copiaTurmaDisciplinaLookup, setCopiaTurmaDisciplinaLookup] = useState<'form' | 'filtro' | null>(null);
  /** Extensões liberadas no parâmetro "Tipos de arquivo para anexar em 'Cópias'". */
  const [extensoesCopia, setExtensoesCopia] = useState<string[]>(EXTENSOES_COPIA_PADRAO);
  /** Parâmetro: a Data do recebimento de uma cópia nova já vem com a data atual. */
  const [recebimentoAutomaticoCopia, setRecebimentoAutomaticoCopia] = useState(false);
  /** Parâmetros: Formato do papel / Tipo de papel já preenchidos numa cópia nova ("" = sem padrão). */
  const [papelPadraoCopia, setPapelPadraoCopia] = useState({ nr_seq_formato_papel: '', nr_seq_tipo_papel: '' });
  const [categoriaEditingId, setCategoriaEditingId] = useState<string | null>(null);
  const [categoriaSubmitting, setCategoriaSubmitting] = useState(false);
  const [categoriaAuditInfo, setCategoriaAuditInfo] = useState({ createdAt: '', updatedAt: '', createdBy: '', updatedBy: '' });
  const auditCategoriaIdRef = useRef<string | null>(null);
  const [categoriaCampoErros, setCategoriaCampoErros] = useState<string[]>([]);
  const [categoriaSortColumn, setCategoriaSortColumn] = useState<number | null>(null);
  const [categoriaSortAsc, setCategoriaSortAsc] = useState<boolean | null>(null);
  const [categoriaFilterModalOpen, setCategoriaFilterModalOpen] = useState(false);
  const [categoriaFilterForm, setCategoriaFilterForm] = useState<CadastroGeralFilterForm>({ nr_sequencia: '', descricao: '', ie_status: 'T' });
  const [appliedCategoriaFilterForm, setAppliedCategoriaFilterForm] = useState<CadastroGeralFilterForm>({ nr_sequencia: '', descricao: '', ie_status: 'T' });
  const [delegatePerfisUsuario, setDelegatePerfisUsuario] = useState<Usuario | null>(null);

  // Perfis ativos disponíveis no modal "Delegar perfis": ordenados por nome e,
  // para usuários comuns, sem o perfil Administrador (exclusivo do admin).
  const delegatePerfisDisponiveis = useMemo(() => {
    const alvoEhAdministrador = isAdministradorUsuario(delegatePerfisUsuario);
    return perfis
      .filter((p) => String(p.ie_status ?? '').toUpperCase() === 'A')
      .filter((p) => alvoEhAdministrador || !isAdministradorPerfil(p))
      .sort((a, b) => (a.ds_perfil ?? '').localeCompare(b.ds_perfil ?? '', 'pt-BR'));
  }, [delegatePerfisUsuario, perfis]);
  const [delegatePerfis, setDelegatePerfis] = useState<number[]>([]);
  const [delegatePerfisSaving, setDelegatePerfisSaving] = useState(false);
  const [changePasswordModalOpen, setChangePasswordModalOpen] = useState(false);
  const [pessoaFisicaLookupOpen, setPessoaFisicaLookupOpen] = useState(false);
  // Pessoa física em visualização (modal de leitura, estilo Detalhe da auditoria).
  const [pessoaFisicaView, setPessoaFisicaView] = useState<PessoaFisica | null>(null);
  const [ativoView, setAtivoView] = useState<Ativo | null>(null);
  // Manutenção em visualização (modal de leitura).
  const [manutencaoView, setManutencaoView] = useState<Manutencao | null>(null);
  // Colaborador em visualização (modal de leitura).
  const [colaboradorView, setColaboradorView] = useState<Colaborador | null>(null);
  const [pessoaJuridicaView, setPessoaJuridicaView] = useState<PessoaJuridica | null>(null);
  const [pessoaJuridicaViewCidade, setPessoaJuridicaViewCidade] = useState('');
  const pessoaJuridicaViewCodeRef = useRef<string>('');
  const [lookupForm, setLookupForm] = useState({ ds_nome: '', nr_sequencia: '', nr_cpf: '' });
  const [lookupFilter, setLookupFilter] = useState({ ds_nome: '', nr_sequencia: '', nr_cpf: '' });
  const [lookupApplied, setLookupApplied] = useState(false);
  const [naturalidadeLookupOpen, setNaturalidadeLookupOpen] = useState(false);
  const [cidadeLookupForm, setCidadeLookupForm] = useState({ codigo: '', nome: '', uf: '' });
  const [cidadeLookupApplied, setCidadeLookupApplied] = useState(false);
  const [cidadeResults, setCidadeResults] = useState<Cidade[]>([]);
  const [cidadeLoading, setCidadeLoading] = useState(false);
  const [naturalidadeNome, setNaturalidadeNome] = useState('');
  const naturalidadeCodeRef = useRef('');
  /* ── Estado de Pessoas Jurídicas ── */
  const [pjManageSelection, setPjManageSelection] = useState<string>('');
  const [pjInteracted, setPjInteracted] = useState(false);
  const [pessoasJuridicas, setPessoasJuridicas] = useState<PessoaJuridica[]>([]);
  const [pjForm, setPjForm] = useState<PjFormData>(emptyPjForm);
  const [pjFilterForm, setPjFilterForm] = useState<PjFilterFormData>(emptyPjFilterForm);
  const [appliedPjFilterForm, setAppliedPjFilterForm] = useState<PjFilterFormData>(emptyPjFilterForm);
  const [pjFilterModalOpen, setPjFilterModalOpen] = useState(false);
  const [pjEditingId, setPjEditingId] = useState<string | null>(null);
  const [pjAuditInfo, setPjAuditInfo] = useState({ createdAt: '', updatedAt: '', createdBy: '', updatedBy: '' });
  const auditPjIdRef = useRef<string | null>(null);
  const [pjSubmitting, setPjSubmitting] = useState(false);
  const [pjSortColumn, setPjSortColumn] = useState<number | null>(null);
  const [pjSortAsc, setPjSortAsc] = useState<boolean | null>(null);
  const [pjCidadeLookupOpen, setPjCidadeLookupOpen] = useState(false);
  const [pjCidadeLookupForm, setPjCidadeLookupForm] = useState({ codigo: '', nome: '', uf: '' });
  const [pjCidadeLookupApplied, setPjCidadeLookupApplied] = useState(false);
  const [pjCidadeResults, setPjCidadeResults] = useState<Cidade[]>([]);
  const [pjCidadeLoading, setPjCidadeLoading] = useState(false);
  const [pjCidadeNome, setPjCidadeNome] = useState('');
  const pjCidadeCodeRef = useRef('');
  // Define se o lookup de cidade aberto grava no formulário ou no filtro de PJ.
  const pjCidadeLookupTargetRef = useRef<'form' | 'filter'>('form');
  /* ── Estado de Estrutura Acadêmica (Alunos) ── */
  const [alunoManageSelection, setAlunoManageSelection] = useState<string>('');
  const [alunoInteracted, setAlunoInteracted] = useState(false);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [alunoForm, setAlunoForm] = useState<AlunoFormData>(emptyAlunoForm);
  const [alunoEditingId, setAlunoEditingId] = useState<string | null>(null);
  const [alunoAuditInfo, setAlunoAuditInfo] = useState({ createdAt: '', updatedAt: '', createdBy: '', updatedBy: '' });
  const auditAlunoIdRef = useRef<string | null>(null);
  const [alunoSubmitting, setAlunoSubmitting] = useState(false);
  const [alunoSortColumn, setAlunoSortColumn] = useState<number | null>(null);
  const [alunoSortAsc, setAlunoSortAsc] = useState<boolean | null>(null);
  const [alunoCampoErros, setAlunoCampoErros] = useState<string[]>([]);
  const [alunoFilterModalOpen, setAlunoFilterModalOpen] = useState(false);
  const [alunoFilterForm, setAlunoFilterForm] = useState({ nr_sequencia: '', nr_matricula: '', nr_seq_pessoa_fisica: '', dt_ingresso_inicio: '', dt_ingresso_fim: '' });
  const [appliedAlunoFilterForm, setAppliedAlunoFilterForm] = useState({ nr_sequencia: '', nr_matricula: '', nr_seq_pessoa_fisica: '', dt_ingresso_inicio: '', dt_ingresso_fim: '' });
  const [alunoPessoaFisicaLookupOpen, setAlunoPessoaFisicaLookupOpen] = useState(false);
  const alunoPessoaFisicaLookupTargetRef = useRef<'aluno' | 'responsavel' | 'colaborador' | 'alunoFilter' | 'colaboradorFilter' | 'manutencaoFilter'>('aluno');
  /** Responsáveis do aluno (aba Responsáveis): recebe a pessoa física escolhida no lookup. */
  const alunoResponsavelLookupCallbackRef = useRef<((nrSequencia: number) => void) | null>(null);
  /** Quem recebe o colaborador escolhido no lookup aberto pelos responsáveis do ativo. */
  const ativoResponsavelLookupCallbackRef = useRef<((nrSequencia: number) => void) | null>(null);
  // Modal "Alterar status" do aluno (menu de contexto de Estrutura Acadêmica).
  const [alterarStatusModalOpen, setAlterarStatusModalOpen] = useState(false);
  const [alterarStatusAluno, setAlterarStatusAluno] = useState<Aluno | null>(null);
  /** Todos os alunos que recebem o novo status (um ou vários, pela seleção). */
  const [alterarStatusAlunoLote, setAlterarStatusAlunoLote] = useState<Aluno[]>([]);
  const [alterarStatusForm, setAlterarStatusForm] = useState({ dt_status: '', ie_status: '', ds_status: '' });
  const [alterarStatusSaving, setAlterarStatusSaving] = useState(false);
  // Modal "Alterar data de ingresso" do aluno (menu de contexto de Estrutura Acadêmica).
  const [alterarIngressoModalOpen, setAlterarIngressoModalOpen] = useState(false);
  const [alterarIngressoAluno, setAlterarIngressoAluno] = useState<Aluno | null>(null);
  const [alterarIngressoLote, setAlterarIngressoLote] = useState<Aluno[]>([]);
  const [alterarIngressoForm, setAlterarIngressoForm] = useState({ dt_ingresso: '' });
  const [alterarIngressoSaving, setAlterarIngressoSaving] = useState(false);

  // Colaboradores (Estrutura Acadêmica > Colaboradores).
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [colaboradorForm, setColaboradorForm] = useState<ColaboradorFormData>(emptyColaboradorForm);
  const [colaboradorEditingId, setColaboradorEditingId] = useState<string | null>(null);
  const [colaboradorAuditInfo, setColaboradorAuditInfo] = useState({ createdAt: '', updatedAt: '', createdBy: '', updatedBy: '' });
  const auditColaboradorIdRef = useRef<string | null>(null);
  const [colaboradorSubmitting, setColaboradorSubmitting] = useState(false);
  const [colaboradorSortColumn, setColaboradorSortColumn] = useState<number | null>(null);
  const [colaboradorSortAsc, setColaboradorSortAsc] = useState<boolean | null>(null);
  const [colaboradorCampoErros, setColaboradorCampoErros] = useState<string[]>([]);
  const [colaboradorFilterModalOpen, setColaboradorFilterModalOpen] = useState(false);
  const [colaboradorFilterForm, setColaboradorFilterForm] = useState({ nr_sequencia: '', nr_matricula: '', nr_seq_pessoa_fisica: '', nr_seq_pessoa_juridica: '', dt_admissao_inicio: '', dt_admissao_fim: '' });
  const [appliedColaboradorFilterForm, setAppliedColaboradorFilterForm] = useState({ nr_sequencia: '', nr_matricula: '', nr_seq_pessoa_fisica: '', nr_seq_pessoa_juridica: '', dt_admissao_inicio: '', dt_admissao_fim: '' });
  // Períodos letivos (Estrutura Acadêmica > Período letivo).
  const [periodosLetivos, setPeriodosLetivos] = useState<PeriodoLetivo[]>([]);
  const [periodoLetivoForm, setPeriodoLetivoForm] = useState<PeriodoLetivoFormData>(emptyPeriodoLetivoForm);
  const [periodoLetivoEditingId, setPeriodoLetivoEditingId] = useState<string | null>(null);
  const [periodoLetivoAuditInfo, setPeriodoLetivoAuditInfo] = useState({ createdAt: '', updatedAt: '', createdBy: '', updatedBy: '' });
  const [periodoLetivoSubmitting, setPeriodoLetivoSubmitting] = useState(false);
  // Modal "Encerrar"/"Reativar" do período letivo (menu de contexto): só a data da ação.
  const [statusPeriodoModal, setStatusPeriodoModal] = useState<{ periodo: PeriodoLetivo; acao: 'encerrar' | 'reativar' } | null>(null);
  const [statusPeriodoData, setStatusPeriodoData] = useState('');
  const [statusPeriodoSaving, setStatusPeriodoSaving] = useState(false);
  const [periodoLetivoSortColumn, setPeriodoLetivoSortColumn] = useState<number | null>(null);
  const [periodoLetivoSortAsc, setPeriodoLetivoSortAsc] = useState<boolean | null>(null);
  const [periodoLetivoCampoErros, setPeriodoLetivoCampoErros] = useState<string[]>([]);
  const [periodoLetivoFilterModalOpen, setPeriodoLetivoFilterModalOpen] = useState(false);
  const [periodoLetivoFilterForm, setPeriodoLetivoFilterForm] = useState({ nr_sequencia: '', nr_ano: '', ds_periodo_letivo: '', ie_status: '' });
  const [appliedPeriodoLetivoFilterForm, setAppliedPeriodoLetivoFilterForm] = useState({ nr_sequencia: '', nr_ano: '', ds_periodo_letivo: '', ie_status: '' });
  // Modal "Alterar data de admissão" do colaborador (menu de contexto de Estrutura Acadêmica).
  const [alterarAdmissaoModalOpen, setAlterarAdmissaoModalOpen] = useState(false);
  const [alterarAdmissaoColaborador, setAlterarAdmissaoColaborador] = useState<Colaborador | null>(null);
  const [alterarAdmissaoLote, setAlterarAdmissaoLote] = useState<Colaborador[]>([]);
  const [alterarAdmissaoForm, setAlterarAdmissaoForm] = useState({ dt_admissao: '' });
  const [alterarAdmissaoSaving, setAlterarAdmissaoSaving] = useState(false);
  // Modal "Alterar status" do colaborador (menu de contexto de Estrutura Acadêmica).
  const [alterarStatusColaboradorModalOpen, setAlterarStatusColaboradorModalOpen] = useState(false);
  const [alterarStatusColaborador, setAlterarStatusColaborador] = useState<Colaborador | null>(null);
  const [alterarStatusColaboradorLote, setAlterarStatusColaboradorLote] = useState<Colaborador[]>([]);
  // Alunos e colaboradores marcados na coluna de seleção (checkbox), por id.
  // As ações do menu de contexto valem para todos eles quando o registro clicado
  // com o botão direito está entre os marcados (como em Patrimônio > Ativos).
  const [alunosSelecionados, setAlunosSelecionados] = useState<string[]>([]);
  const [colaboradoresSelecionados, setColaboradoresSelecionados] = useState<string[]>([]);
  // Modal "Assumir ativos de" (menu de contexto de Colaboradores): o colaborador
  // clicado (destino) assume os ativos do colaborador escolhido no lookup (origem).
  const [assumirAtivosDestino, setAssumirAtivosDestino] = useState<Colaborador | null>(null);
  const [assumirAtivosOrigem, setAssumirAtivosOrigem] = useState('');
  /** Modo (obrigatório): começa vazio. */
  const [assumirAtivosModo, setAssumirAtivosModo] = useState<'' | 'adicionar' | 'substituir'>('');
  const [assumirAtivosModoErro, setAssumirAtivosModoErro] = useState(false);
  const [assumirAtivosErro, setAssumirAtivosErro] = useState(false);
  const [assumirAtivosSaving, setAssumirAtivosSaving] = useState(false);
  const [alterarStatusColaboradorForm, setAlterarStatusColaboradorForm] = useState({ dt_status: '', ie_status: '', ds_motivo_status: '' });
  const [alterarStatusColaboradorSaving, setAlterarStatusColaboradorSaving] = useState(false);
  // Ativos marcados na coluna de seleção (checkbox) da lista de Ativos, por id.
  // As ações do menu de contexto valem para todos eles quando o registro clicado
  // com o botão direito está entre os marcados.
  const [ativosSelecionados, setAtivosSelecionados] = useState<string[]>([]);
  // Modal "Alterar status" do ativo (menu de contexto de Patrimônio).
  const [ativoStatusModalOpen, setAtivoStatusModalOpen] = useState(false);
  const [ativoStatusTarget, setAtivoStatusTarget] = useState<Ativo | null>(null);
  /** Todos os ativos que recebem o novo status (um ou vários, pela seleção). */
  const [ativoStatusLote, setAtivoStatusLote] = useState<Ativo[]>([]);
  const [ativoStatusValue, setAtivoStatusValue] = useState('');
  const [ativoStatusForm, setAtivoStatusForm] = useState({ dt_data: '', ds_motivo_status: '' });
  const [ativoStatusSaving, setAtivoStatusSaving] = useState(false);
  // Modal "Transferir" (menu de contexto de Ativos): troca a localização de um ou vários ativos.
  /** Ativos a transferir (vazio = modal fechado). */
  const [ativoTransferirLote, setAtivoTransferirLote] = useState<Ativo[]>([]);
  const [ativoTransferirLocal, setAtivoTransferirLocal] = useState('');
  const [ativoTransferirMotivo, setAtivoTransferirMotivo] = useState('');
  const [ativoTransferirErro, setAtivoTransferirErro] = useState(false);
  const [ativoTransferirSaving, setAtivoTransferirSaving] = useState(false);
  // Modal "Enviar para manutenção" (menu de contexto de Ativos).
  const [enviarManutModalOpen, setEnviarManutModalOpen] = useState(false);
  const [enviarManutTarget, setEnviarManutTarget] = useState<Ativo | null>(null);
  /** Todos os ativos enviados para manutenção (uma manutenção é criada para cada um). */
  const [enviarManutLote, setEnviarManutLote] = useState<Ativo[]>([]);
  const [enviarManutForm, setEnviarManutForm] = useState({ dt_data: '', nr_seq_prestador_servico: undefined as number | undefined, ds_motivo_manutencao: '' });
  const [enviarManutSaving, setEnviarManutSaving] = useState(false);
  // Lookup de prestador de serviço (filtra colaboradores com ie_prestador_servico='S').
  const [enviarManutPrestadorLookupOpen, setEnviarManutPrestadorLookupOpen] = useState(false);
  const [enviarManutPrestLookupForm, setEnviarManutPrestLookupForm] = useState({ nr_sequencia: '', ds_nome: '', nr_cpf: '', nr_cnpj: '' });
  const [enviarManutPrestLookupFilter, setEnviarManutPrestLookupFilter] = useState({ nr_sequencia: '', ds_nome: '', nr_cpf: '', nr_cnpj: '' });
  const [enviarManutPrestLookupApplied, setEnviarManutPrestLookupApplied] = useState(false);
  const enviarManutPrestadorLookupTargetRef = useRef<'modal' | 'form' | 'ativoResponsavel' | 'ativoFilter' | 'assumirAtivos' | 'ativoFornecedor' | 'ativoFilterFornecedor' | 'copiaSolicitante' | 'copiaFiltroSolicitante'>('modal');
  /** O lookup lista só os colaboradores com "Fornecedor" marcado (Fornecedor do ativo). */
  const [lookupColaboradorFornecedor, setLookupColaboradorFornecedor] = useState(false);
  /** O lookup lista todos os colaboradores (Responsável do ativo), não só os prestadores de serviço. */
  const [lookupColaboradorTodos, setLookupColaboradorTodos] = useState(false);
  // Modal "Concluir manutenção" (menu de contexto de Ativos).
  const [concluirManutModalOpen, setConcluirManutModalOpen] = useState(false);
  const [concluirManutTarget, setConcluirManutTarget] = useState<{ ativo: Ativo | null; manutencao: Manutencao } | null>(null);
  /** Todas as manutenções concluídas de uma vez (seleção de vários ativos em manutenção). */
  const [concluirManutLote, setConcluirManutLote] = useState<{ ativo: Ativo | null; manutencao: Manutencao }[]>([]);
  const [concluirManutForm, setConcluirManutForm] = useState({ dt_termino: '', vl_total: '', ie_isento: false, ds_correcoes: '', ie_status_ativo: 'O' });
  const [concluirManutSaving, setConcluirManutSaving] = useState(false);
  const [cancelarManutOpen, setCancelarManutOpen] = useState(false);
  const [cancelarManutTarget, setCancelarManutTarget] = useState<Manutencao | null>(null);
  /** Todas as manutenções canceladas de uma vez (seleção de várias manutenções). */
  const [cancelarManutLote, setCancelarManutLote] = useState<Manutencao[]>([]);
  // Manutenções marcadas na coluna de seleção (checkbox) da lista de Manutenções, por id.
  const [manutencoesSelecionadas, setManutencoesSelecionadas] = useState<string[]>([]);
  const [cancelarManutSaving, setCancelarManutSaving] = useState(false);
  const enviarManutPrestadores = useMemo(() => {
    // Apenas colaboradores com ie_prestador_servico === 'S' (ou todos, no Responsável do ativo).
    if (lookupColaboradorFornecedor) return colaboradores.filter((c) => c.ie_fornecedor === 'S');
    return lookupColaboradorTodos ? colaboradores : colaboradores.filter((c) => c.ie_prestador_servico === 'S');
  }, [colaboradores, lookupColaboradorTodos, lookupColaboradorFornecedor]);
  const enviarManutFilteredPrestadores = useMemo(() => {
    if (!enviarManutPrestLookupApplied) return [];
    return enviarManutPrestadores.filter((c) => {
      const pf = pessoasFisicas.find((p) => p.nr_sequencia === c.nr_seq_pessoa_fisica);
      if (enviarManutPrestLookupFilter.nr_sequencia && String(c.nr_sequencia ?? '') !== enviarManutPrestLookupFilter.nr_sequencia.trim()) return false;
      if (enviarManutPrestLookupFilter.ds_nome && pf && !pf.ds_nome.toLowerCase().includes(enviarManutPrestLookupFilter.ds_nome.toLowerCase())) return false;
      if (enviarManutPrestLookupFilter.nr_cpf && pf) {
        const queryCpf = enviarManutPrestLookupFilter.nr_cpf.replace(/\D/g, '');
        const pessoaCpf = (pf.nr_cpf ?? '').replace(/\D/g, '');
        if (!pessoaCpf.includes(queryCpf)) return false;
      }
      if (enviarManutPrestLookupFilter.nr_cnpj && c.nr_seq_pessoa_juridica) {
        const pj = pessoasJuridicas.find((p) => p.nr_sequencia === c.nr_seq_pessoa_juridica);
        if (pj) {
          const queryCnpj = enviarManutPrestLookupFilter.nr_cnpj.replace(/\D/g, '');
          const pessoaCnpj = (pj.nr_cnpj ?? '').replace(/\D/g, '');
          if (!pessoaCnpj.includes(queryCnpj)) return false;
        } else {
          return false;
        }
      } else if (enviarManutPrestLookupFilter.nr_cnpj) {
        return false;
      }
      return true;
    });
  }, [enviarManutPrestadores, enviarManutPrestLookupFilter, enviarManutPrestLookupApplied, pessoasFisicas]);
  // Nome do prestador derivado do nr_seq_prestador_servico selecionado.
  const enviarManutPrestadorName = useMemo(() => {
    if (!enviarManutForm.nr_seq_prestador_servico) return '';
    const seq = enviarManutForm.nr_seq_prestador_servico;
    const col = colaboradores.find((c) => c.nr_sequencia === seq);
    if (col) {
      if (col.nr_seq_pessoa_juridica) {
        const pj = pessoasJuridicas.find((p) => p.nr_sequencia === col.nr_seq_pessoa_juridica);
        if (pj) return pj.ds_razao_social ?? '';
      }
      const pf = pessoasFisicas.find((p) => p.nr_sequencia === col.nr_seq_pessoa_fisica);
      if (pf) return pf.ds_nome ?? '';
    }
    return pessoasFisicas.find((p) => p.nr_sequencia === seq)?.ds_nome ?? '';
  }, [enviarManutForm.nr_seq_prestador_servico, pessoasFisicas, colaboradores, pessoasJuridicas]);
  const [colaboradorPessoaFisicaLookupOpen, setColaboradorPessoaFisicaLookupOpen] = useState(false);
  const [colaboradorPessoaJuridicaLookupOpen, setColaboradorPessoaJuridicaLookupOpen] = useState(false);
  const [colaboradorPjLookupForm, setColaboradorPjLookupForm] = useState({ nr_sequencia: '', ds_razao_social: '', nr_cnpj: '' });
  const [colaboradorPjLookupFilter, setColaboradorPjLookupFilter] = useState({ nr_sequencia: '', ds_razao_social: '', nr_cnpj: '' });
  const [colaboradorPjLookupApplied, setColaboradorPjLookupApplied] = useState(false);
  const colaboradorPjLookupTargetRef = useRef<'form' | 'filter'>('form');

  // Patrimônio > Ativos.
  const [ativoManageSelection, setAtivoManageSelection] = useState<string>('');
  const [ativoInteracted, setAtivoInteracted] = useState(false);
  const [ativos, setAtivos] = useState<Ativo[]>([]);
  /** Responsáveis de todos os ativos (filtro e visualização do ativo). */
  const [responsaveisAtivos, setResponsaveisAtivos] = useState<AtivoResponsavel[]>([]);
  const [ativoForm, setAtivoForm] = useState<AtivoFormData>(emptyAtivoForm);
  const [ativoEditingId, setAtivoEditingId] = useState<string | null>(null);
  const [ativoAuditInfo, setAtivoAuditInfo] = useState({ createdAt: '', updatedAt: '', createdBy: '', updatedBy: '' });
  const auditAtivoIdRef = useRef<string | null>(null);
  const [ativoSubmitting, setAtivoSubmitting] = useState(false);
  const [gerandoMatricula, setGerandoMatricula] = useState(false);
  // Confirmação de ações do menu de contexto (Gerar/Regerar matrícula, Reativar período letivo).
  const [confirmAcao, setConfirmAcao] = useState<{ titulo: string; mensagem: string; acao: () => void } | null>(null);

  // Filtro de Ativos.
  type AtivoFilterFormData = {
    // Identificação
    nr_sequencia: string;
    cd_externo: string;
    ds_ativo: string;
    ds_modelo: string;
    nr_serie: string;
    ds_qr_code: string;
    ds_codigo_barras: string;
    dt_aquisicao_inicio: string;
    dt_aquisicao_fim: string;
    dt_garantia_inicio: string;
    dt_garantia_fim: string;
    ie_status: string;
    // Classificação
    nr_seq_categoria: string;
    nr_seq_localizacao: string;
    nr_seq_marca: string;
    nr_seq_responsavel: string;
    nr_seq_fornecedor: string;
    // Dispositivo
    ds_endereco_mac: string;
    ds_ip: string;
    nr_seq_sistema_operacional: string;
  };
  const emptyAtivoFilterForm: AtivoFilterFormData = {
    nr_sequencia: '', cd_externo: '', ds_ativo: '', ds_modelo: '', nr_serie: '', ds_qr_code: '', ds_codigo_barras: '',
    dt_aquisicao_inicio: '', dt_aquisicao_fim: '', dt_garantia_inicio: '', dt_garantia_fim: '', ie_status: 'T',
    nr_seq_categoria: '', nr_seq_localizacao: '', nr_seq_marca: '', nr_seq_responsavel: '', nr_seq_fornecedor: '',
    ds_endereco_mac: '', ds_ip: '', nr_seq_sistema_operacional: '',
  };
  const [ativoFilterForm, setAtivoFilterForm] = useState<AtivoFilterFormData>(emptyAtivoFilterForm);
  const [appliedAtivoFilterForm, setAppliedAtivoFilterForm] = useState<AtivoFilterFormData>(emptyAtivoFilterForm);
  const [ativoFilterModalOpen, setAtivoFilterModalOpen] = useState(false);
  const [parametrosSaving, setParametrosSaving] = useState(false);
  const [imagemCampoErros, setImagemCampoErros] = useState<string[]>([]);
  const [periodoLetivoFeriadoSaving, setPeriodoLetivoFeriadoSaving] = useState(false);
  const [ativoResponsavelSaving, setAtivoResponsavelSaving] = useState(false);
  const [alunoResponsavelSaving, setAlunoResponsavelSaving] = useState(false);
  // Cores da bolinha de status do Período letivo (Estrutura Acadêmica > Parâmetros).
  const [coresStatusPeriodoLetivo, setCoresStatusPeriodoLetivo] = useState<Record<string, string>>(CORES_STATUS_PERIODO_LETIVO_PADRAO);
  // Cores da bolinha de status dos Ativos (Patrimônio > Parâmetros).
  const [coresStatusAtivo, setCoresStatusAtivo] = useState<Record<string, string>>(CORES_STATUS_ATIVO_PADRAO);
  // Controle de Cópias > Cópias: cores das bolinhas de status e o modal "Alterar status".
  const [coresStatusCopia, setCoresStatusCopia] = useState<Record<string, string>>(CORES_STATUS_COPIA_PADRAO);
  const [alterarStatusCopiaModalOpen, setAlterarStatusCopiaModalOpen] = useState(false);
  const [alterarStatusCopia, setAlterarStatusCopia] = useState<Copia | null>(null);
  const [alterarStatusCopiaForm, setAlterarStatusCopiaForm] = useState({ dt_status: '', ie_status: '', ds_motivo_status: '' });
  const [alterarStatusCopiaSaving, setAlterarStatusCopiaSaving] = useState(false);
  // Cores da bolinha de status das Manutenções (Patrimônio > Parâmetros).
  const [coresStatusManutencao, setCoresStatusManutencao] = useState<Record<string, string>>(CORES_STATUS_MANUTENCAO_PADRAO);

  // Patrimônio > Manutenções.
  const [manutencoes, setManutencoes] = useState<Manutencao[]>([]);
  const [manutencaoForm, setManutencaoForm] = useState<ManutencaoFormData>({ nr_seq_ativo: undefined, dt_envio: '', dt_termino: '', vl_total: undefined, ds_observacao: '', ie_status_manutencao: 'E' });
  const [manutencaoEditingId, setManutencaoEditingId] = useState<string | null>(null);
  const [manutencaoAuditInfo, setManutencaoAuditInfo] = useState({ createdAt: '', updatedAt: '', createdBy: '', updatedBy: '' });
  const auditManutencaoIdRef = useRef<string | null>(null);
  const [manutencaoSubmitting, setManutencaoSubmitting] = useState(false);
  const [manutencaoSortColumn, setManutencaoSortColumn] = useState<number | null>(null);
  const [manutencaoSortAsc, setManutencaoSortAsc] = useState<boolean | null>(null);
  const [manutencaoCampoErros, setManutencaoCampoErros] = useState<string[]>([]);

  // Filtro de Manutenções.
  type ManutencaoFilterFormData = {
    // Identificação
    nr_sequencia: string;
    nr_seq_ativo: string;
    // Dados da manutenção
    nr_seq_prestador_servico: string;
    dt_envio_inicio: string;
    dt_envio_fim: string;
    dt_termino_inicio: string;
    dt_termino_fim: string;
    vl_total_menor: string;
    vl_total_maior: string;
    ie_status_manutencao: string;
  };
  const emptyManutencaoFilterForm: ManutencaoFilterFormData = {
    nr_sequencia: '', nr_seq_ativo: '',
    nr_seq_prestador_servico: '', dt_envio_inicio: '', dt_envio_fim: '', dt_termino_inicio: '', dt_termino_fim: '',
    vl_total_menor: '', vl_total_maior: '', ie_status_manutencao: 'T',
  };
  const [manutencaoFilterForm, setManutencaoFilterForm] = useState<ManutencaoFilterFormData>(emptyManutencaoFilterForm);
  const [appliedManutencaoFilterForm, setAppliedManutencaoFilterForm] = useState<ManutencaoFilterFormData>(emptyManutencaoFilterForm);
  const [manutencaoFilterModalOpen, setManutencaoFilterModalOpen] = useState(false);

  // ── Gerenciador de Relatórios ──
  const [relatorios, setRelatorios] = useState<Relatorio[]>([]);
  const [relatorioView, setRelatorioView] = useState<'list' | 'builder'>('list');
  const [relatorioEditingId, setRelatorioEditingId] = useState<string | null>(null);
  const lastRelatorioEditingIdRef = useRef<string | null>(null);
  useEffect(() => { if (relatorioEditingId) lastRelatorioEditingIdRef.current = relatorioEditingId; }, [relatorioEditingId]);
  const [relatorioBandasMode, setRelatorioBandasMode] = useState(false);
  const [relatorioForm, setRelatorioForm] = useState<Relatorio | null>(null);
  const [relatorioSubmitting, setRelatorioSubmitting] = useState(false);
  const [relatorioGerando, setRelatorioGerando] = useState(false);
  const [relatorioParamModal, setRelatorioParamModal] = useState<{ relatorio: Relatorio; parametros: ParametroSql[] } | null>(null);
  const [relatorioParamValues, setRelatorioParamValues] = useState<Record<string, string>>({});
  // Parâmetros obrigatórios vazios após tentar gerar (borda vermelha no modal).
  const [paramGerarFaltantes, setParamGerarFaltantes] = useState<string[]>([]);
  const [relatorioManageSelection, setRelatorioManageSelection] = useState('');
  const [relatorioInteracted, setRelatorioInteracted] = useState(false);
  // ── Logs (Acessos e Exclusões) ──
  const [logsManageSelection, setLogsManageSelection] = useState('');
  // ── Controle de Cópias (Cópias e Parâmetros) ──
  const [ccManageSelection, setCcManageSelection] = useState('');
  const [acessosFiltro, setAcessosFiltro] = useState<FiltroAcessos>(FILTRO_ACESSOS_VAZIO);
  /** "Salvar filtro": gravando o filtro do usuário (modal "Carregando..."). */
  const [salvandoFiltro, setSalvandoFiltro] = useState(false);
  const [relatorioAuditInfo, setRelatorioAuditInfo] = useState({ createdAt: '', updatedAt: '', createdBy: '', updatedBy: '' });
  const [bandaAuditInfo, setBandaAuditInfo] = useState({ createdAt: '', updatedAt: '', createdBy: '', updatedBy: '' });
  const relatorioAuditIdRef = useRef<string | null>(null);
  const [relatorioAuditModalOpen, setRelatorioAuditModalOpen] = useState(false);
  const [relatorioAuditLoading, setRelatorioAuditLoading] = useState(false);
  const [relatorioAuditLogs, setRelatorioAuditLogs] = useState<AuditEntry[]>([]);
  const [relatorioAuditTipo, setRelatorioAuditTipo] = useState<'relatorio' | 'relatorio_banda' | 'relatorio_banda_elemento' | 'relatorio_parametro'>('relatorio');
  const [relatorioAuditItemId, setRelatorioAuditItemId] = useState<string | null>(null);
  const [relatorioSortColumn, setRelatorioSortColumn] = useState<number | null>(null);
  const [relatorioSortAsc, setRelatorioSortAsc] = useState<boolean | null>(null);
  const [relatorioFilterModalOpen, setRelatorioFilterModalOpen] = useState(false);
  const [relatorioFilterForm, setRelatorioFilterForm] = useState<CadastroGeralFilterForm>({ nr_sequencia: '', descricao: '', ie_status: 'T' });
  const [appliedRelatorioFilterForm, setAppliedRelatorioFilterForm] = useState<CadastroGeralFilterForm>({ nr_sequencia: '', descricao: '', ie_status: 'T' });
  const [relatorioFiltroExtra, setRelatorioFiltroExtra] = useState(RELATORIO_FILTRO_VAZIO);
  const [relatorioFiltroExtraAplicado, setRelatorioFiltroExtraAplicado] = useState(RELATORIO_FILTRO_VAZIO);
  /** Lookup de usuário aberto no filtro de Relatórios (Usuário criação / Usuário alteração). */
  const [relatorioUsuarioLookup, setRelatorioUsuarioLookup] = useState<'nr_seq_usuario_criacao' | 'nr_seq_usuario_alteracao' | null>(null);

  // ── Callbacks de exclusão remota (campo / banda) ──
  const relatorioStateActionsRef = useRef<{ removeCampo: (id: string) => void; removeBanda: (id: string) => void } | null>(null);

  // ── Imagens (Administração do Sistema) ──
  const [imagens, setImagens] = useState<Imagem[]>([]);
  const [imagemEditingId, setImagemEditingId] = useState<string | null>(null);
  const [imagemForm, setImagemForm] = useState<Partial<Imagem>>({});
  const [imagemSubmitting, setImagemSubmitting] = useState(false);
  const [imagemSortColumn, setImagemSortColumn] = useState<number | null>(null);
  const [imagemSortAsc, setImagemSortAsc] = useState<boolean | null>(null);
  async function loadImagens() { try { const data = await obterImagens(); setImagens(data); } catch { /* */ } }
  function handleImagemSortChange(logicalIndex: number) { if (imagemSortColumn === logicalIndex) { if (imagemSortAsc === true) setImagemSortAsc(false); else if (imagemSortAsc === false) { setImagemSortColumn(null); setImagemSortAsc(null); } else { setImagemSortColumn(logicalIndex); setImagemSortAsc(true); } } else { setImagemSortColumn(logicalIndex); setImagemSortAsc(true); } }
  const filteredSortedImagens = useMemo(() => { const list = [...imagens].sort((a, b) => b.nr_sequencia - a.nr_sequencia); /* Ordem padrão: coluna # decrescente */ if (imagemSortColumn != null && imagemSortAsc != null) { const keys = ['preview', 'nr_sequencia', 'ds_imagem', 'ie_arquivo', 'dt_criacao', 'dt_alteracao', 'ds_usuario_criacao', 'ds_usuario_alteracao']; const key = keys[imagemSortColumn]; if (key) list.sort((a, b) => { const av = a[key as keyof Imagem] ?? ''; const bv = b[key as keyof Imagem] ?? ''; return imagemSortAsc ? String(av).localeCompare(String(bv), 'pt-BR', { numeric: true }) : String(bv).localeCompare(String(av), 'pt-BR', { numeric: true }); }); } return list; }, [imagens, imagemSortColumn, imagemSortAsc]);
  function openImagemNewForm() { setImagemEditingId(null); setImagemForm({ ds_imagem: '', ie_arquivo: '' }); setView('form'); }
  function openImagemEditForm(imagem: Imagem) { setImagemEditingId(imagem.id); setImagemForm({ ...imagem }); setView('form'); }
  async function handleImagemSubmit(e: React.FormEvent) { e.preventDefault(); if (imagemEditingId && bloquearEdicaoSemPermissao(permissoesAdmin.editarImagem)) return; const imagemFaltantes = camposObrigatoriosVazios(imagemForm as Record<string, unknown>, campoRegrasDaColecao(campoRegrasAtivas, 'imagem')); setImagemCampoErros(imagemFaltantes); if (imagemFaltantes.length > 0) { setMessage('Preencha os campos obrigatórios.'); return; } setImagemSubmitting(true); try { const file = (imagemForm as any)._file as File | undefined; let ieArquivo = imagemForm.ie_arquivo || ''; if (file) { try { ieArquivo = await uploadImagem(file); } catch (uploadErr: any) { const msg = uploadErr?.message || ''; if (msg.includes('já existe')) { setMessage('A imagem já existe.'); setImagemSubmitting(false); return; } setMessage(msg ? `Erro ao salvar imagem: ${msg}` : 'Erro ao salvar imagem.'); setImagemSubmitting(false); return; } } const data = { ds_imagem: imagemForm.ds_imagem || '', ie_arquivo: ieArquivo }; if (imagemEditingId) { await atualizarImagem(imagemEditingId, data, currentUser?.ds_usuario); } else { await criarImagem(data as any, currentUser?.ds_usuario); } await loadImagens(); setView('list'); setMessage(imagemEditingId ? 'Imagem alterada!' : 'Imagem criada!'); abrirNovoAposSalvar(); } catch (err: any) { setMessage(err?.message ? `Erro ao salvar imagem: ${err.message}` : 'Erro ao salvar imagem.'); } finally { setImagemSubmitting(false); } }
  async function handleImagemDelete(id: string) { setMessage(''); try { const img = imagens.find((i) => i.id === id); if (img?.ie_arquivo) { await excluirArquivoImagem(img.ie_arquivo); } await excluirImagem(id); setMessage('Excluído com sucesso!'); await loadImagens(); } catch { setMessage('Erro ao excluir.'); } if (view === 'form') setView('list'); }
  const imagemAuditInfo = useMemo(() => { const img = imagens.find((i) => i.id === imagemEditingId); return { createdAt: img?.dt_criacao || '', updatedAt: img?.dt_alteracao || '', createdBy: img?.ds_usuario_criacao || '', updatedBy: img?.ds_usuario_alteracao || '' }; }, [imagens, imagemEditingId]);
  const imagemIndex = useMemo(() => { if (!imagemEditingId) return -1; return filteredSortedImagens.findIndex((i) => i.id === imagemEditingId); }, [filteredSortedImagens, imagemEditingId]);
  const hasPrevImagemRecord = imagemIndex > 0;
  const hasNextImagemRecord = imagemIndex >= 0 && imagemIndex < filteredSortedImagens.length - 1;
  function goToPrevImagemRecord() { if (imagemIndex > 0) { openImagemEditForm(filteredSortedImagens[imagemIndex - 1]); } }
  function goToNextImagemRecord() { if (imagemIndex >= 0 && imagemIndex < filteredSortedImagens.length - 1) { openImagemEditForm(filteredSortedImagens[imagemIndex + 1]); } }

  // ── Renomear imagem ──
  const [renomearModalOpen, setRenomearModalOpen] = useState(false);
  const [renomearImagemId, setRenomearImagemId] = useState<string | null>(null);
  const [renomearNovoNome, setRenomearNovoNome] = useState('');
  const [renomearSubmitting, setRenomearSubmitting] = useState(false);
  const [camposStatusSaving, setCamposStatusSaving] = useState(false);

  function openRenomearModal(imagem: Imagem) {
    const currentFile = imagem.ie_arquivo ? imagem.ie_arquivo.split('/').pop() || '' : '';
    const currentName = currentFile.replace(/\.[^.]+$/, '');
    setRenomearImagemId(imagem.id);
    setRenomearNovoNome(currentName);
    setRenomearModalOpen(true);
  }

  async function handleRenomearSubmit() {
    if (!renomearImagemId || !renomearNovoNome.trim()) return;
    setRenomearSubmitting(true);
    try {
      const img = imagens.find((i) => i.id === renomearImagemId);
      if (!img?.ie_arquivo) throw new Error('Arquivo não encontrado');
      const ext = img.ie_arquivo.includes('.') ? '.' + img.ie_arquivo.split('.').pop() : '';
      const newNameWithExt = renomearNovoNome.trim() + ext;
      const newPath = await renomearArquivoImagem(img.ie_arquivo, newNameWithExt);
      await atualizarImagem(renomearImagemId, { ie_arquivo: newPath } as any, currentUser?.ds_usuario);
      await loadImagens();
      setRenomearModalOpen(false);
      setMessage('Imagem renomeada!');
    } catch (err: any) {
      const msg = err?.message || '';
      if (msg.includes('já existe')) {
        setMessage('A imagem já existe.');
      } else {
        setMessage('Erro ao renomear imagem.');
      }
    } finally {
      setRenomearSubmitting(false);
    }
  }

  function handleRelatorioManageSelectionChange(v: string) {
    setRelatorioManageSelection(v);
    setRelatorioInteracted(true);
  }

  // When the user navigates to relatorio section, auto-select 'relatorio' if interacted
  useEffect(() => {
    if (activeSection === 'relatorio' && relatorioInteracted && !relatorioManageSelection) {
      setRelatorioManageSelection('relatorio');
    }
  }, [activeSection, relatorioInteracted, relatorioManageSelection]);


  function handleRelatorioSortChange(logicalIndex: number) {
    // Se já está ordenando por esta coluna
    if (relatorioSortColumn === logicalIndex) {
      if (relatorioSortAsc === true) {
        // asc → desc
        setRelatorioSortAsc(false);
      } else if (relatorioSortAsc === false) {
        // desc → padrão (limpa tudo)
        setRelatorioSortColumn(null);
        setRelatorioSortAsc(null);
      } else {
        // padrão → asc
        setRelatorioSortColumn(logicalIndex);
        setRelatorioSortAsc(true);
      }
    } else {
      // Nova coluna → asc
      setRelatorioSortColumn(logicalIndex);
      setRelatorioSortAsc(true);
    }
  }

  const filteredSortedRelatorios = useMemo(() => {
    // Ordem padrão: coluna # decrescente (mais recente primeiro).
    const list = [...relatorios].filter(relatorioPassaNoFiltro).sort((a, b) => b.nr_sequencia - a.nr_sequencia);
    if (relatorioSortColumn != null && relatorioSortAsc != null) {
      // Mesma ordem das colunas de RelatorioListView (o índice vem de lá).
      const keys = ['nr_sequencia', 'ds_relatorio', 'ie_formato', 'dt_criacao', 'dt_alteracao', 'ds_usuario_criacao', 'ds_usuario_alteracao'];
      const key = keys[relatorioSortColumn];
      if (key) {
        list.sort((a, b) => {
          const av = a[key as keyof Relatorio] ?? '';
          const bv = b[key as keyof Relatorio] ?? '';
          const cmp = String(av).localeCompare(String(bv), 'pt-BR', { numeric: true });
          return relatorioSortAsc ? cmp : -cmp;
        });
      }
    }
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [relatorios, relatorioSortColumn, relatorioSortAsc, appliedRelatorioFilterForm, relatorioFiltroExtraAplicado, usuarios]);

  /** ds_usuario do usuário pela sequência (filtro de Relatórios: Usuário criação/alteração). */
  function dsUsuarioPorSeq(seq: string): string {
    return seq ? usuarios.find((u) => String(u.nr_sequencia) === seq)?.ds_usuario ?? '' : '';
  }
  /** Filtro de Relatórios: Sequência, Descrição, Formato, Nome do arquivo, Formato do papel, Orientação, Status e usuários. */
  function relatorioPassaNoFiltro(r: Relatorio): boolean {
    const f = appliedRelatorioFilterForm;
    const x = relatorioFiltroExtraAplicado;
    const contem = (valor: unknown, busca: string) => String(valor ?? '').toLowerCase().includes(busca.trim().toLowerCase());
    const mesmoUsuario = (valor: unknown, seq: string) => {
      const ds = dsUsuarioPorSeq(seq);
      return String(valor ?? '').trim().toLowerCase() === ds.trim().toLowerCase();
    };
    if (f.nr_sequencia && String(r.nr_sequencia) !== f.nr_sequencia) return false;
    if (f.descricao.trim() && !contem(r.ds_relatorio, f.descricao)) return false;
    if (x.ie_formato && (r.ie_formato === 'pdf' ? 'pdf' : 'xls') !== x.ie_formato) return false;
    if (x.ds_nome_arquivo.trim() && !contem(r.ds_nome_arquivo, x.ds_nome_arquivo)) return false;
    if (x.nr_seq_formato_papel && String(r.nr_seq_formato_papel ?? '') !== x.nr_seq_formato_papel) return false;
    if (x.ie_orientacao && (r.ie_orientacao ?? '') !== x.ie_orientacao) return false;
    if (x.ie_status !== 'T' && (r.ie_status === 'I' ? 'I' : 'A') !== x.ie_status) return false;
    if (x.nr_seq_usuario_criacao && !mesmoUsuario(r.ds_usuario_criacao, x.nr_seq_usuario_criacao)) return false;
    if (x.nr_seq_usuario_alteracao && !mesmoUsuario(r.ds_usuario_alteracao, x.nr_seq_usuario_alteracao)) return false;
    return true;
  }

  function openRelatorioFilterModal() {
    setRelatorioFilterForm(appliedRelatorioFilterForm);
    setRelatorioFiltroExtra(relatorioFiltroExtraAplicado);
    setRelatorioFilterModalOpen(true);
  }
  function clearRelatorioFilter() {
    setRelatorioFilterForm({ nr_sequencia: '', descricao: '', ie_status: 'T' });
    setAppliedRelatorioFilterForm({ nr_sequencia: '', descricao: '', ie_status: 'T' });
    setRelatorioFiltroExtra(RELATORIO_FILTRO_VAZIO);
    setRelatorioFiltroExtraAplicado(RELATORIO_FILTRO_VAZIO);
  }
  function handleRelatorioFilterSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAppliedRelatorioFilterForm({ ...relatorioFilterForm, ie_status: 'T' });
    setRelatorioFiltroExtraAplicado(relatorioFiltroExtra);
    setRelatorioFilterModalOpen(false);
  }

  // ── Navegação entre registros de relatório ──
  const currentRelatorioEditIndex = useMemo(() => {
    if (!relatorioEditingId) return -1;
    return filteredSortedRelatorios.findIndex((r) => r.id === relatorioEditingId);
  }, [filteredSortedRelatorios, relatorioEditingId]);

  const hasPrevRelatorioRecord = currentRelatorioEditIndex > 0;
  const hasNextRelatorioRecord = currentRelatorioEditIndex >= 0 && currentRelatorioEditIndex < filteredSortedRelatorios.length - 1;

  function goToPrevRelatorioRecord() {
    if (!hasPrevRelatorioRecord) return;
    const previous = filteredSortedRelatorios[currentRelatorioEditIndex - 1];
    if (relatorioBandasMode) {
      openRelatorioBandas(previous);
    } else {
      openRelatorioEditForm(previous);
    }
  }

  function goToNextRelatorioRecord() {
    if (!hasNextRelatorioRecord) return;
    const next = filteredSortedRelatorios[currentRelatorioEditIndex + 1];
    if (relatorioBandasMode) {
      openRelatorioBandas(next);
    } else {
      openRelatorioEditForm(next);
    }
  }

  // Lookup de ativo no formulário de manutenção.
  const [manutencaoAtivoLookupOpen, setManutencaoAtivoLookupOpen] = useState(false);
  const manutencaoAtivoLookupTargetRef = useRef<'manutencao' | 'manutencaoFilter'>('manutencao');
  const [manutencaoAtivoLookupForm, setManutencaoAtivoLookupForm] = useState({ nr_sequencia: '', ds_ativo: '', ds_modelo: '', ie_status: '' });
  const [manutencaoAtivoLookupFilter, setManutencaoAtivoLookupFilter] = useState({ nr_sequencia: '', ds_ativo: '', ds_modelo: '', ie_status: '' });
  const [manutencaoAtivoLookupApplied, setManutencaoAtivoLookupApplied] = useState(false);
  const manutencaoAtivoName = useMemo(() => {
    if (!manutencaoForm.nr_seq_ativo) return '';
    return ativos.find((a) => a.nr_sequencia === manutencaoForm.nr_seq_ativo)?.ds_ativo ?? '';
  }, [manutencaoForm.nr_seq_ativo, ativos]);
  const manutencaoPrestadorName = useMemo(() => {
    if (!manutencaoForm.nr_seq_prestador_servico) return '';
    const seq = manutencaoForm.nr_seq_prestador_servico;
    // Busca o colaborador que tem esse nr_sequencia (o campo armazena a sequência do colaborador).
    const col = colaboradores.find((c) => c.nr_sequencia === seq);
    if (col) {
      if (col.nr_seq_pessoa_juridica) {
        const pj = pessoasJuridicas.find((p) => p.nr_sequencia === col.nr_seq_pessoa_juridica);
        if (pj) return pj.ds_razao_social ?? '';
      }
      const pf = pessoasFisicas.find((p) => p.nr_sequencia === col.nr_seq_pessoa_fisica);
      return pf?.ds_nome ?? '';
    }
    // Fallback: busca direta na PF (para dados legados).
    return pessoasFisicas.find((p) => p.nr_sequencia === seq)?.ds_nome ?? '';
  }, [manutencaoForm.nr_seq_prestador_servico, pessoasFisicas, colaboradores, pessoasJuridicas]);
  const manutencaoFilteredAtivos = useMemo(() => {
    if (!manutencaoAtivoLookupApplied) return [];
    return ativos.filter((a) => {
      if (manutencaoAtivoLookupFilter.nr_sequencia && String(a.nr_sequencia) !== manutencaoAtivoLookupFilter.nr_sequencia.trim()) return false;
      if (manutencaoAtivoLookupFilter.ds_ativo && !a.ds_ativo?.toLowerCase().includes(manutencaoAtivoLookupFilter.ds_ativo.toLowerCase())) return false;
      if (manutencaoAtivoLookupFilter.ds_modelo && !a.ds_modelo?.toLowerCase().includes(manutencaoAtivoLookupFilter.ds_modelo.toLowerCase())) return false;
      if (manutencaoAtivoLookupFilter.ie_status) {
        if (a.ie_status !== manutencaoAtivoLookupFilter.ie_status) return false;
      } else {
        // Por padrão, exibir apenas ativos Operacionais e em Estoque.
        if (a.ie_status !== 'O' && a.ie_status !== 'E') return false;
      }
      return true;
    });
  }, [ativos, manutencaoAtivoLookupFilter, manutencaoAtivoLookupApplied]);
  const [ativoSortColumn, setAtivoSortColumn] = useState<number | null>(null);
  const [ativoSortAsc, setAtivoSortAsc] = useState<boolean | null>(null);
  const [ativoCampoErros, setAtivoCampoErros] = useState<string[]>([]);
  const [alunoLookupForm, setAlunoLookupForm] = useState({ ds_nome: '', nr_sequencia: '', nr_cpf: '' });
  const [alunoLookupFilter, setAlunoLookupFilter] = useState({ ds_nome: '', nr_sequencia: '', nr_cpf: '' });
  const [alunoLookupApplied, setAlunoLookupApplied] = useState(false);
  const [passwordChangeValue, setPasswordChangeValue] = useState("");
  const [passwordChangeConfirmValue, setPasswordChangeConfirmValue] = useState("");
  const [passwordChangeUserId, setPasswordChangeUserId] = useState<string | null>(null);
  const [passwordChangeIsSelf, setPasswordChangeIsSelf] = useState(false);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [confirmDeleteMessage, setConfirmDeleteMessage] = useState('');
  const [confirmDeleteAction, setConfirmDeleteAction] = useState<(() => void) | null>(null);
  const [confirmDeleteType, setConfirmDeleteType] = useState<string>('');
  const [confirmDeleteItemId, setConfirmDeleteItemId] = useState<string>('');
  const [confirmDeleteExtra, setConfirmDeleteExtra] = useState<any>(null);
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [menuOrder, setMenuOrder] = useState<SectionType[]>(DEFAULT_SECTION_ORDER);
  const [dragSection, setDragSection] = useState<SectionType | null>(null);
  const [dragOverSection, setDragOverSection] = useState<SectionType | null>(null);
  const draggedRef = useRef(false);

  const currentUserPersonName = useMemo(() => {
    if (!currentUser) return "";

    const matchingPerson = pessoasFisicas.find((pessoa) => pessoa.nr_sequencia === currentUser.nr_seq_pessoa_fisica);
    return matchingPerson?.ds_nome?.trim() || currentUser.ds_usuario_alternativo?.trim() || currentUser.ds_usuario?.trim() || "Usuário";
  }, [currentUser, pessoasFisicas]);

  /* ── Funções liberadas ao usuário logado (via perfis vinculados) ── */
  const isAdministrador = useMemo(
    () => (currentUser?.ds_usuario ?? '').trim().toLowerCase() === 'administrador',
    [currentUser]
  );

  /*
   * "Ver auditoria" (Administração do Sistema > Usuários): sem ela, os infobuttons dos logs
   * de criação/alteração do rodapé (classe botao-auditoria, em todas as telas) somem pelo
   * CSS (html[data-sem-auditoria]) e o histórico de auditoria não abre. O Administrador sempre vê.
   */
  const podeVerAuditoria = isAdministrador || currentUser?.ie_ver_auditoria === 'S';
  useEffect(() => {
    const raiz = document.documentElement;
    if (podeVerAuditoria) raiz.removeAttribute('data-sem-auditoria');
    else raiz.setAttribute('data-sem-auditoria', '');
  }, [podeVerAuditoria]);

  // Administrador sem perfis configurados: tem acesso total a tudo.
  // Se o admin configurar perfis para si mesmo, esses perfis são respeitados
  // (as permissões e funções configuradas prevalecem).
  const isAdminSemConfig = useMemo(
    () => isAdministrador && parsePerfisConfig(currentUser?.config_perfis).length === 0,
    [isAdministrador, currentUser?.config_perfis]
  );

  // Item protegido: o usuário 'administrador' e o perfil 'Administrador' são o
  // acesso padrão do sistema e não podem ser alterados nem excluídos por ninguém
  // (inclusive pelo próprio administrador): no menu de contexto só aparece "Ver".
  const isProtectedAdminItem = useMemo(() => {
    if (!contextMenu || contextMenu.section !== 'administracaoSistema') return false;
    if (adminManageSelection === 'perfis') {
      return isAdministradorPerfil(contextMenu.item as Perfil);
    }
    if (adminManageSelection === 'usuarios') {
      return isAdministradorUsuario(contextMenu.item as Usuario);
    }
    return false;
  }, [contextMenu, adminManageSelection]);

  // Perfis vinculados ao usuário logado que estão ativos, em ordem alfabética.
  // Para usuários comuns, o perfil Administrador (exclusivo do admin) não entra.
  const usuarioPerfisVinculados = useMemo(() => {
    const perfilIds = parsePerfisConfig(currentUser?.config_perfis);
    if (perfilIds.length === 0) return [];
    return perfis
      .filter(
        (p) =>
          perfilIds.includes(p.nr_sequencia) &&
          String(p.ie_status ?? '').toUpperCase() === 'A' &&
          (isAdministrador || !isAdministradorPerfil(p))
      )
      .sort((a, b) => (a.ds_perfil ?? '').localeCompare(b.ds_perfil ?? '', 'pt-BR'));
  }, [currentUser?.config_perfis, perfis, isAdministrador]);

  // Regras de campos do perfil ATIVO do usuário logado (Administração > Campos).
  const campoRegrasAtivas = useMemo(() => {
    const ativo =
      usuarioPerfisVinculados.find((p) => p.nr_sequencia === activePerfilSequencia) ??
      usuarioPerfisVinculados[0];
    return ativo ? parseCamposConfig(ativo.config_campos) : {};
  }, [usuarioPerfisVinculados, activePerfilSequencia]);

  // Campos dos modais (Administração > Campos: "[Modal] > [Campo]"): cada modal
  // tem regras próprias (coleção modal_*), independentes das do formulário.
  const [modalCampoErros, setModalCampoErros] = useState<string[]>([]);
  function regraModal(modal: string, campo: string): CampoStatus {
    return getCampoStatus(campoRegrasAtivas, modal, campo);
  }
  function asteriscoModal(modal: string, campo: string) {
    return regraModal(modal, campo) === 'O' ? <RequiredAsterisk /> : undefined;
  }
  /** Classe do campo do modal: borda vermelha se for obrigatório e estiver vazio ao salvar. */
  function classeCampoModal(modal: string, campo: string, base: string): string {
    return modalCampoErros.includes(campoKey(modal, campo)) ? base.replace('border-slate-300', 'border-red-500') : base;
  }
  /** Valida os obrigatórios do modal (valores por campo); marca os vazios e avisa. */
  function validarCamposModal(modal: string, valores: Record<string, unknown>): boolean {
    const faltando = camposObrigatoriosVazios(valores, campoRegrasDaColecao(campoRegrasAtivas, modal));
    setModalCampoErros(faltando.map((c) => campoKey(modal, c)));
    if (faltando.length > 0) {
      setMessage("Preencha os campos obrigatórios.");
      return false;
    }
    return true;
  }
  /** Modal de status do ativo conforme o status escolhido (Operacional / Estoque / Descartar). */
  const modalAtivoStatus = ativoStatusValue === 'E' ? MODAL_ATIVO_ESTOQUE : ativoStatusValue === 'D' ? MODAL_ATIVO_DESCARTAR : MODAL_ATIVO_OPERACIONAL;

  // Permissões do perfil ATIVO do usuário logado (Administração > Delegar funções).
  // Aplica a migração automática APENAS em configurações antigas (versão anterior
  // à atual): configurações atuais são autoritativas (revogações explícitas valem).
  const permissoesAtivas = useMemo(() => {
    const ativo =
      usuarioPerfisVinculados.find((p) => p.nr_sequencia === activePerfilSequencia) ??
      usuarioPerfisVinculados[0];
    return ativo ? parsePermissoesConfigMigrada(ativo.config_permissoes, ativo.config_permissoes_v) : {};
  }, [usuarioPerfisVinculados, activePerfilSequencia]);

  // Submódulos da função Administração do Sistema liberados ao usuário logado
  // (Campos/Perfis/Usuários) conforme as permissões do perfil ativo.
  const allowedAdminSubmodulos = useMemo(() => {
    // Administrador sem perfis vinculados: acesso total.
    if (isAdminSemConfig) return ['avisos', 'camposFormularios', 'camposModais', 'parametros', 'perfis', 'usuarios', 'imagens', 'regras'];
    return adminSubmodulosPermitidos(permissoesAtivas);
  }, [isAdminSemConfig, permissoesAtivas]);

  // Submódulos da função Logs (Acessos/Exclusões) liberados ao usuário logado.
  const allowedLogsSubmodulos = useMemo(() => {
    if (isAdminSemConfig) return ['acessos', 'exclusoes'];
    return logsSubmodulosPermitidos(permissoesAtivas);
  }, [isAdminSemConfig, permissoesAtivas]);

  // Opção de Logs que deixou de ser permitida: volta para a seleção vazia.
  useEffect(() => {
    if (logsManageSelection && !allowedLogsSubmodulos.includes(logsManageSelection)) setLogsManageSelection('');
  }, [allowedLogsSubmodulos, logsManageSelection]);

  function handleLogsManageSelectionChange(value: string) {
    setLogsManageSelection(value);
    setMessage("");
  }

  // Submódulos da função Controle de Cópias (Cópias/Parâmetros) liberados ao usuário logado.
  const allowedCcSubmodulos = useMemo(() => {
    if (isAdminSemConfig) return ['copias'];
    return ccSubmodulosPermitidos(permissoesAtivas);
  }, [isAdminSemConfig, permissoesAtivas]);

  // Permissões de Controle de Cópias para o usuário logado (administrador: tudo liberado).
  const permissoesCC = useMemo(() => {
    const permitida = (permissao: string) =>
      isAdminSemConfig || temPermissao(permissoesAtivas, 'controleCopias', permissao);
    return {
      adicionarCopia: permitida('adicionar_copia'),
      verCopia: permitida('ver_copia'),
      editarCopia: permitida('editar_copia'),
      alterarStatusCopia: permitida('alterar_status_copia'),
      excluirCopia: permitida('excluir_copia'),
    };
  }, [isAdminSemConfig, permissoesAtivas]);

  // Opção de Controle de Cópias que deixou de ser permitida: volta para a seleção vazia.
  useEffect(() => {
    if (ccManageSelection && !allowedCcSubmodulos.includes(ccManageSelection)) setCcManageSelection('');
  }, [allowedCcSubmodulos, ccManageSelection]);

  function handleCcManageSelectionChange(value: string) {
    setCcManageSelection(value);
    // Ao trocar a seleção no meio da edição, zera o registro em edição.
    setCopiaForm(emptyCgForm);
    setCopiaExtra(COPIA_CAMPOS_VAZIOS);
    setCopiaArquivoNovo(null);
    setCopiaEditingId(null);
    setCopiaFilterModalOpen(false);
    setMessage("");
    setView("list");
  }

  // Permissões das opções de Administração do Sistema (menu de contexto) para
  // o usuário logado: o administrador tem tudo liberado; os demais seguem o
  // perfil ativo (sem configuração salva = tudo liberado).
  const permissoesAdmin = useMemo(() => {
    const permitida = (permissao: string) =>
      isAdminSemConfig || temPermissao(permissoesAtivas, 'administracaoSistema', permissao);
    return {
      alterarStatusCampoFormulario: permitida('alterar_status_campo_formulario'),
      alterarStatusCampoModal: permitida('alterar_status_campo_modal'),
      adicionarImagem: permitida('adicionar_imagem'),
      verImagem: permitida('ver_imagem'),
      editarImagem: permitida('editar_imagem'),
      renomearImagem: permitida('renomear_imagem'),
      excluirImagem: permitida('excluir_imagem'),
      adicionarPerfil: permitida('adicionar_perfil'),
      verPerfil: permitida('ver_perfil'),
      editarPerfil: permitida('editar_perfil'),
      delegarFuncoesPerfil: permitida('delegar_funcoes_perfil'),
      duplicarPerfil: permitida('duplicar_perfil'),
      excluirPerfil: permitida('excluir_perfil'),
      adicionarUsuario: permitida('adicionar_usuario'),
      verUsuario: permitida('ver_usuario'),
      editarUsuario: permitida('editar_usuario'),
      alterarSenhaUsuario: permitida('alterar_senha_usuario'),
      delegarPerfisUsuario: permitida('delegar_perfis_usuario'),
      excluirUsuario: permitida('excluir_usuario'),
    };
  }, [isAdminSemConfig, permissoesAtivas]);

  // Permissões da função Cadastro de Pessoas (Pessoas Físicas/Jurídicas) para
  // o usuário logado: o administrador tem tudo liberado; os demais seguem o
  // perfil ativo (sem configuração salva = tudo liberado).
  const permissoesPessoa = useMemo(() => {
    const permitida = (permissao: string) =>
      isAdminSemConfig || temPermissao(permissoesAtivas, 'pessoaFisica', permissao);
    return {
      adicionarPessoaFisica: permitida('adicionar_pessoa_fisica'),
      verPessoaFisica: permitida('ver_pessoa_fisica'),
      editarPessoaFisica: permitida('editar_pessoa_fisica'),
      detalhesPessoaFisica: permitida('detalhes_pessoa_fisica'),
      excluirPessoaFisica: permitida('excluir_pessoa_fisica'),
      adicionarPessoaJuridica: permitida('adicionar_pessoa_juridica'),
      verPessoaJuridica: permitida('ver_pessoa_juridica'),
      editarPessoaJuridica: permitida('editar_pessoa_juridica'),
      excluirPessoaJuridica: permitida('excluir_pessoa_juridica'),
    };
  }, [isAdminSemConfig, permissoesAtivas]);

  // Submódulos da função Cadastro de Pessoas (Pessoas Físicas/Jurídicas)
  // liberados ao usuário logado conforme as permissões do perfil ativo.
  const allowedPessoaSubmodulos = useMemo(() => {
    // Administrador sem perfis vinculados: acesso total.
    if (isAdminSemConfig) return ['pessoasFisicas', 'pessoasJuridicas'];
    return pessoaSubmodulosPermitidos(permissoesAtivas);
  }, [isAdminSemConfig, permissoesAtivas]);

  // Permissões da função Cadastros Gerais (por seção/tipo de cadastro) para
  // o usuário logado: o administrador tem tudo liberado; os demais seguem o
  // perfil ativo (sem configuração salva = tudo liberado).
  const permissoesCg = useMemo(() => {
    const permitida = (permissao: string) =>
      isAdminSemConfig || temPermissao(permissoesAtivas, 'cadastrosGerais', permissao);
    // Chave de seção (dropdown) → sufixo usado nas chaves de permissão (snake_case).
    const secoes: Record<string, string> = {
      cargo: 'cargo',
      vinculoContratual: 'vinculo_contratual',
      sexo: 'sexo',
      estadoCivil: 'estado_civil',
      corRaca: 'cor_raca',
      grauParentesco: 'grau_parentesco',
      localizacao: 'localizacao',
      marca: 'marca',
      profissao: 'profissao',
      orgaoEmissor: 'orgao_emissor',
      logradouro: 'logradouro',
      sistemaOperacional: 'sistema_operacional',
      combustivel: 'combustivel',
      modalidadeEnsino: 'modalidade_ensino',
      formatoPapel: 'formato_papel',
      tipoPapel: 'tipo_papel',
    };
    const resultado: Record<string, { adicionar: boolean; ver: boolean; editar: boolean; excluir: boolean }> = {};
    for (const [chave, sufixo] of Object.entries(secoes)) {
      resultado[chave] = {
        adicionar: permitida(`adicionar_${sufixo}`),
        ver: permitida(`ver_${sufixo}`),
        editar: permitida(`editar_${sufixo}`),
        excluir: permitida(`excluir_${sufixo}`),
      };
    }
    return resultado;
  }, [isAdminSemConfig, permissoesAtivas]);

  // Submódulos da função Cadastros Gerais (dropdown PAI) liberados ao usuário
  // logado conforme as permissões do perfil ativo.
  const allowedCgSubmodulos = useMemo(() => {
    // Administrador sem perfis vinculados: acesso total.
    if (isAdminSemConfig) return ['cargo', 'vinculoContratual', 'sexo', 'estadoCivil', 'corRaca', 'grauParentesco', 'localizacao', 'marca', 'profissao', 'orgaoEmissor', 'logradouro', 'sistemaOperacional', 'combustivel', 'modalidadeEnsino', 'formatoPapel', 'tipoPapel'];
    return cgSubmodulosPermitidos(permissoesAtivas);
  }, [isAdminSemConfig, permissoesAtivas]);

  // Se o submódulo ativo deixar de ser permitido (ex.: perfil sem a permissão),
  // volta para o primeiro submódulo permitido.
  useEffect(() => {
    if (!currentUser) return;
    if (adminManageSelection && !allowedAdminSubmodulos.includes(adminManageSelection)) {
      setAdminManageSelection(allowedAdminSubmodulos[0] ?? 'usuarios');
    }
  }, [allowedAdminSubmodulos, adminManageSelection, currentUser]);

  // Se o submódulo ativo de Cadastro de Pessoas deixar de ser permitido,
  // volta para o primeiro submódulo permitido.
  useEffect(() => {
    if (!currentUser) return;
    if (pjManageSelection && !allowedPessoaSubmodulos.includes(pjManageSelection)) {
      setPjManageSelection(allowedPessoaSubmodulos[0] ?? 'pessoasFisicas');
    }
  }, [allowedPessoaSubmodulos, pjManageSelection, currentUser]);

  // Se o submódulo ativo de Cadastros Gerais deixar de ser permitido, volta
  // para o primeiro submódulo permitido.
  useEffect(() => {
    if (!currentUser) return;
    if (cgManageSelection && !allowedCgSubmodulos.includes(cgManageSelection)) {
      setCgManageSelection(allowedCgSubmodulos[0] ?? 'sexo');
    }
  }, [allowedCgSubmodulos, cgManageSelection, currentUser]);

  // Submódulos da função Estrutura Acadêmica (Alunos/Colaboradores) liberados
  // ao usuário logado conforme as permissões do perfil ativo.
  const allowedAlunoSubmodulos = useMemo(() => {
    // Administrador sem perfis vinculados: acesso total.
    if (isAdminSemConfig) return ['alunos', 'colaboradores', 'periodoLetivo', 'cursos', 'turmas', 'disciplinas', 'turmasDisciplinas'];
    return eaSubmodulosPermitidos(permissoesAtivas);
  }, [isAdminSemConfig, permissoesAtivas]);

  // Permissões da função Estrutura Acadêmica (Alunos/Colaboradores) para o
  // usuário logado: o administrador tem tudo liberado; os demais seguem o
  // perfil ativo (sem configuração salva = tudo liberado).
  const permissoesEA = useMemo(() => {
    const permitida = (permissao: string) =>
      isAdminSemConfig || temPermissao(permissoesAtivas, 'estruturaAcademica', permissao);
    return {
      acessarAluno: permitida('acessar_aluno'),
      adicionarAluno: permitida('adicionar_aluno'),
      verAluno: permitida('ver_aluno'),
      editarAluno: permitida('editar_aluno'),
      gerarMatricula: permitida('gerar_matricula_aluno'),
      alterarDataIngresso: permitida('alterar_data_ingresso_aluno'),
      alterarStatusAluno: permitida('alterar_status_aluno'),
      detalhesAluno: permitida('detalhes_aluno'),
      excluirAluno: permitida('excluir_aluno'),
      acessarColaborador: permitida('acessar_colaborador'),
      adicionarColaborador: permitida('adicionar_colaborador'),
      verColaborador: permitida('ver_colaborador'),
      editarColaborador: permitida('editar_colaborador'),
      gerarMatriculaColaborador: permitida('gerar_matricula_colaborador'),
      alterarDataAdmissao: permitida('alterar_data_admissao_colaborador'),
      alterarStatusColaborador: permitida('alterar_status_colaborador'),
      assumirAtivosColaborador: permitida('assumir_ativos_colaborador'),
      excluirColaborador: permitida('excluir_colaborador'),
      adicionarPeriodoLetivo: permitida('adicionar_periodo_letivo'),
      verPeriodoLetivo: permitida('ver_periodo_letivo'),
      editarPeriodoLetivo: permitida('editar_periodo_letivo'),
      encerrarPeriodoLetivo: permitida('encerrar_periodo_letivo'),
      reativarPeriodoLetivo: permitida('reativar_periodo_letivo'),
      feriadosPeriodoLetivo: permitida('feriados_periodo_letivo'),
      excluirPeriodoLetivo: permitida('excluir_periodo_letivo'),
      adicionarCurso: permitida('adicionar_curso'),
      verCurso: permitida('ver_curso'),
      editarCurso: permitida('editar_curso'),
      excluirCurso: permitida('excluir_curso'),
      adicionarDisciplina: permitida('adicionar_disciplina'),
      verDisciplina: permitida('ver_disciplina'),
      editarDisciplina: permitida('editar_disciplina'),
      excluirDisciplina: permitida('excluir_disciplina'),
      adicionarTurma: permitida('adicionar_turma'),
      verTurma: permitida('ver_turma'),
      editarTurma: permitida('editar_turma'),
      excluirTurma: permitida('excluir_turma'),
      adicionarTurmaDisciplina: permitida('adicionar_turma_disciplina'),
      verTurmaDisciplina: permitida('ver_turma_disciplina'),
      editarTurmaDisciplina: permitida('editar_turma_disciplina'),
      excluirTurmaDisciplina: permitida('excluir_turma_disciplina'),
    };
  }, [isAdminSemConfig, permissoesAtivas]);

  // Se o submódulo ativo de Estrutura Acadêmica deixar de ser permitido,
  // volta para o primeiro submódulo permitido.
  useEffect(() => {
    if (!currentUser) return;
    if (alunoManageSelection && !allowedAlunoSubmodulos.includes(alunoManageSelection)) {
      setAlunoManageSelection(allowedAlunoSubmodulos[0] ?? 'alunos');
    }
  }, [allowedAlunoSubmodulos, alunoManageSelection, currentUser]);

  // Submódulos da função Patrimônio (Ativos/...) liberados ao usuário logado
  // conforme as permissões do perfil ativo.
  const allowedPatrimonioSubmodulos = useMemo(() => {
    // Administrador sem perfis vinculados: acesso total.
    if (isAdminSemConfig) return ['ativos', 'categoria', 'manutencoes'];
    return patrimonioSubmodulosPermitidos(permissoesAtivas);
  }, [isAdminSemConfig, permissoesAtivas]);

  // Permissões da função Patrimônio (Ativos) para o usuário logado: o
  // administrador tem tudo liberado; os demais seguem o perfil ativo.
  const permissoesPatrimonio = useMemo(() => {
    const permitida = (permissao: string) =>
      isAdminSemConfig || temPermissao(permissoesAtivas, 'patrimonio', permissao);
    return {
      acessarAtivo: permitida('acessar_ativo'),
      adicionarAtivo: permitida('adicionar_ativo'),
      verAtivo: permitida('ver_ativo'),
      editarAtivo: permitida('editar_ativo'),
      mudarParaOperacional: permitida('mudar_para_operacional'),
      enviarParaManutencao: permitida('enviar_para_manutencao'),
      moverParaEstoque: permitida('mover_para_estoque'),
      descartarAtivo: permitida('descartar_ativo'),
      excluirAtivo: permitida('excluir_ativo'),
      detalhesAtivo: permitida('detalhes_ativo'),
      transferirAtivo: permitida('transferir_ativo'),
      alterarStatusDescartado: permitida('alterar_status_descartado'),
      acessarManutencao: permitida('acessar_manutencao'),
      adicionarManutencao: permitida('adicionar_manutencao'),
      verManutencao: permitida('ver_manutencao'),
      editarManutencao: permitida('editar_manutencao'),
      concluirManutencao: permitida('concluir_manutencao'),
      concluirManutencaoRegistro: permitida('concluir_manutencao_registro'),
      cancelarManutencao: permitida('cancelar_manutencao'),
      excluirManutencao: permitida('excluir_manutencao'),
      adicionarCategoria: permitida('adicionar_categoria'),
      verCategoria: permitida('ver_categoria'),
      editarCategoria: permitida('editar_categoria'),
      excluirCategoria: permitida('excluir_categoria'),
    };
  }, [isAdminSemConfig, permissoesAtivas]);

  // Permissões da função Gerenciador de Relatórios para o usuário logado: o
  // administrador tem tudo liberado; os demais seguem o perfil ativo.
  const permissoesRelatorio = useMemo(() => {
    const permitida = (permissao: string) =>
      isAdminSemConfig || temPermissao(permissoesAtivas, 'relatorio', permissao);
    return {
      adicionar: permitida('adicionar_relatorio'),
      ver: permitida('ver_relatorio'),
      editar: permitida('editar_relatorio'),
      gerar: permitida('gerar_relatorio'),
      duplicar: permitida('duplicar_relatorio'),
      bandas: permitida('bandas_relatorio'),
      excluir: permitida('excluir_relatorio'),
      importar: permitida('importar_relatorio'),
    };
  }, [isAdminSemConfig, permissoesAtivas]);

  // Importar relatório: com a permissão "Permite importar relatório".
  const allowedRelatorioSubmodulos = useMemo(() => {
    return ['relatorio', ...(permissoesRelatorio.importar ? ['importarRelatorio'] : [])];
  }, [permissoesRelatorio.importar]);
  // Opção que deixou de ser permitida (ex.: sessão restaurada): volta para a seleção vazia
  // (ajuste durante o render, sem efeito).
  if (relatorioManageSelection && !allowedRelatorioSubmodulos.includes(relatorioManageSelection)) setRelatorioManageSelection('');

  // Se o submódulo ativo de Patrimônio deixar de ser permitido, volta para
  // o primeiro submódulo permitido.
  useEffect(() => {
    if (!currentUser) return;
    if (ativoManageSelection && !allowedPatrimonioSubmodulos.includes(ativoManageSelection)) {
      setAtivoManageSelection(allowedPatrimonioSubmodulos[0] ?? 'ativos');
    }
  }, [allowedPatrimonioSubmodulos, ativoManageSelection, currentUser]);

  // Migração única de config_permissoes antigas: perfis salvos antes da adição
  // das permissões granulares ganham as permissões novas como concedidas (a
  // runtime já usa a configuração migrada via permissoesAtivas).
  useEffect(() => {
    if (!currentUser) return;
    const atualizados: Perfil[] = [];
    for (const perfil of perfis) {
      if (!perfil.id) continue;
      const versao = Number(perfil.config_permissoes_v ?? 0);
      if (versao >= PERMISSOES_CONFIG_VERSION) continue;
      const config = parsePermissoesConfig(perfil.config_permissoes);
      if (Object.keys(config).length === 0) continue;
      const migrada = migrarPermissoesConfig(config);
      if (JSON.stringify(migrada) === JSON.stringify(config)) continue;
      atualizados.push({
        ...perfil,
        config_permissoes: serializePermissoesConfig(migrada),
        config_permissoes_v: PERMISSOES_CONFIG_VERSION,
      });
      atualizarPerfil(perfil.id, {
        config_permissoes: serializePermissoesConfig(migrada),
        config_permissoes_v: PERMISSOES_CONFIG_VERSION,
      }).catch(() => {});
    }
    if (atualizados.length > 0) {
      setPerfis((prev) =>
        prev.map((p) => atualizados.find((a) => a.id === p.id) ?? p)
      );
    }
  }, [perfis, currentUser]);

  const allowedSections = useMemo(() => {
    // Administrador sem perfis vinculados: todas as funções liberadas.
    if (isAdminSemConfig) return [...DEFAULT_SECTION_ORDER];

    // Sem perfis vinculados = comportamento padrão: todas as funções liberadas.
    const perfilIds = parsePerfisConfig(currentUser?.config_perfis);
    if (perfilIds.length === 0) return [...DEFAULT_SECTION_ORDER];

    // Perfis vinculados, porém todos inativos: sem acesso a nenhuma função.
    if (usuarioPerfisVinculados.length === 0) return [];

    // As funções liberadas vêm do perfil ATIVO selecionado na pop-up do usuário.
    const ativo =
      usuarioPerfisVinculados.find((p) => p.nr_sequencia === activePerfilSequencia) ??
      usuarioPerfisVinculados[0];
    // Perfil sem config_funcoes salvo não libera nenhuma função.
    const funcoes = parseFuncoesConfig(ativo.config_funcoes);
    // Mantém a ordem padrão do sistema, filtrando apenas o que foi liberado.
    return DEFAULT_SECTION_ORDER.filter((s) => funcoes.includes(s));
  }, [isAdminSemConfig, currentUser?.config_perfis, usuarioPerfisVinculados, activePerfilSequencia]);

  const pfColunasConfig = useMemo(
    () => parseColunasConfig(currentUser?.config_colunas_pessoa_fisica),
    [currentUser?.config_colunas_pessoa_fisica]
  );
  const pjColunasConfig = useMemo(
    () => parseColunasConfig(currentUser?.config_colunas_pessoa_juridica),
    [currentUser?.config_colunas_pessoa_juridica]
  );
  const alunoColunasConfig = useMemo(
    () => parseColunasConfig(currentUser?.config_colunas_aluno),
    [currentUser?.config_colunas_aluno]
  );
  const ativoColunasConfig = useMemo(
    () => lerColunasAtivo(currentUser?.config_colunas_pat_ativo),
    [currentUser?.config_colunas_pat_ativo]
  );
  const manutencaoColunasConfig = useMemo(
    () => parseColunasConfig(currentUser?.config_colunas_pat_manutencao),
    [currentUser?.config_colunas_pat_manutencao]
  );
  const adminColunasConfig = useMemo(
    () => parseColunasConfig(currentUser?.config_colunas_as_usuario),
    [currentUser?.config_colunas_as_usuario]
  );
  const perfilColunasConfig = useMemo(
    () => parseColunasConfig(currentUser?.config_colunas_as_perfil),
    [currentUser?.config_colunas_as_perfil]
  );
  const relatorioColunasConfig = useMemo(
    () => parseStringColunasConfig(currentUser?.config_colunas_relatorio),
    [currentUser?.config_colunas_relatorio]
  );
  const relatorioBandasColunasConfig = useMemo(
    () => parseStringColunasConfig(currentUser?.config_colunas_relatorio_bandas),
    [currentUser?.config_colunas_relatorio_bandas]
  );
  const relatorioListaColunasConfig = useMemo(
    () => parseStringColunasConfig(currentUser?.config_colunas_relatorio_lista),
    [currentUser?.config_colunas_relatorio_lista]
  );
  const relatorioDadosColunasConfig = useMemo(
    () => parseStringColunasConfig(currentUser?.config_colunas_relatorio_dados),
    [currentUser?.config_colunas_relatorio_dados]
  );
  const relatorioFiltrosColunasConfig = useMemo(
    () => parseStringColunasConfig(currentUser?.config_colunas_relatorio_filtros),
    [currentUser?.config_colunas_relatorio_filtros]
  );
  const relatorioOrdenacaoColunasConfig = useMemo(
    () => parseStringColunasConfig(currentUser?.config_colunas_relatorio_ordenacao),
    [currentUser?.config_colunas_relatorio_ordenacao]
  );
  const imagemColunasConfig = useMemo(
    () => parseStringColunasConfig(currentUser?.config_colunas_as_imagem),
    [currentUser?.config_colunas_as_imagem]
  );
  const CG_DEFS = {
    sexo: {
      descKey: 'ds_sexo',
      collection: 'cg_sexo',
      configKey: 'config_colunas_cg_sexo',
      columns: SEXO_COLUMNS,
      fieldInfos: SEXO_FIELD_INFOS,
      items: (): CgItem[] => sexos,
      emptyMessage: 'Clique em "Adicionar" para cadastrar um sexo.',
    },
    estadoCivil: {
      descKey: 'ds_estado_civil',
      collection: 'cg_estado_civil',
      configKey: 'config_colunas_cg_estado_civil',
      columns: ESTADO_CIVIL_COLUMNS,
      fieldInfos: ESTADO_CIVIL_FIELD_INFOS,
      items: (): CgItem[] => estadoCivis,
      emptyMessage: 'Clique em "Adicionar" para cadastrar um estado civil.',
    },
    corRaca: {
      descKey: 'ds_cor_raca',
      collection: 'cg_cor_raca',
      configKey: 'config_colunas_cg_cor_raca',
      columns: COR_RACA_COLUMNS,
      fieldInfos: COR_RACA_FIELD_INFOS,
      items: (): CgItem[] => coresRacas,
      emptyMessage: 'Clique em "Adicionar" para cadastrar uma cor/raça.',
    },
    profissao: {
      descKey: 'ds_profissao',
      collection: 'cg_profissao',
      configKey: 'config_colunas_cg_profissao',
      columns: PROFISSAO_COLUMNS,
      fieldInfos: PROFISSAO_FIELD_INFOS,
      items: (): CgItem[] => profissoes,
      emptyMessage: 'Clique em "Adicionar" para cadastrar uma profissão.',
    },
    orgaoEmissor: {
      descKey: 'ds_orgao_emissor',
      collection: 'cg_orgao_emissor',
      configKey: 'config_colunas_cg_orgao_emissor',
      columns: ORGAO_EMISSOR_COLUMNS,
      fieldInfos: ORGAO_EMISSOR_FIELD_INFOS,
      items: (): CgItem[] => orgaosEmissores,
      emptyMessage: 'Clique em "Adicionar" para cadastrar um órgão emissor.',
    },
    logradouro: {
      descKey: 'ds_logradouro',
      collection: 'cg_logradouro',
      configKey: 'config_colunas_cg_logradouro',
      columns: LOGRADOURO_COLUMNS,
      fieldInfos: LOGRADOURO_FIELD_INFOS,
      items: (): CgItem[] => logradouros,
      emptyMessage: 'Clique em "Adicionar" para cadastrar um logradouro.',
    },
    grauParentesco: {
      descKey: 'ds_grau_parentesco',
      collection: 'cg_grau_parentesco',
      configKey: 'config_colunas_cg_grau_parentesco',
      columns: GRAU_PARENTESCO_COLUMNS,
      fieldInfos: GRAU_PARENTESCO_FIELD_INFOS,
      items: (): CgItem[] => grausParentesco,
      emptyMessage: 'Clique em "Adicionar" para cadastrar um grau de parentesco.',
    },
    localizacao: {
      descKey: 'ds_localizacao',
      collection: 'cg_localizacao',
      configKey: 'config_colunas_cg_localizacao',
      columns: LOCALIZACAO_COLUMNS,
      fieldInfos: LOCALIZACAO_FIELD_INFOS,
      items: (): CgItem[] => localizacoes,
      emptyMessage: 'Clique em "Adicionar" para cadastrar uma localização.',
    },
    marca: {
      descKey: 'ds_marca',
      collection: 'cg_marca',
      configKey: 'config_colunas_cg_marca',
      columns: MARCA_COLUMNS,
      fieldInfos: MARCA_FIELD_INFOS,
      items: (): CgItem[] => marcas,
      emptyMessage: 'Clique em "Adicionar" para cadastrar uma marca.',
    },
    cargo: {
      descKey: 'ds_cargo',
      collection: 'cg_cargo',
      configKey: 'config_colunas_cg_cargo',
      columns: CARGO_COLUMNS,
      fieldInfos: CARGO_FIELD_INFOS,
      items: (): CgItem[] => cargos,
      emptyMessage: 'Clique em "Adicionar" para cadastrar um cargo.',
    },
    vinculoContratual: {
      descKey: 'ds_vinculo_contratual',
      collection: 'cg_vinculo_contratual',
      configKey: 'config_colunas_cg_vinculo_contratual',
      columns: VINCULO_CONTRATUAL_COLUMNS,
      fieldInfos: VINCULO_CONTRATUAL_FIELD_INFOS,
      items: (): CgItem[] => vinculosContratuais,
      emptyMessage: 'Clique em "Adicionar" para cadastrar um vínculo contratual.',
    },
    sistemaOperacional: {
      descKey: 'ds_sistema_operacional',
      collection: 'cg_sistema_operacional',
      configKey: 'config_colunas_cg_sistema_operacional',
      columns: SISTEMA_OPERACIONAL_COLUMNS,
      fieldInfos: SISTEMA_OPERACIONAL_FIELD_INFOS,
      items: (): CgItem[] => sistemasOperacionais,
      emptyMessage: 'Clique em "Adicionar" para cadastrar um sistema operacional.',
    },
    combustivel: {
      descKey: 'ds_combustivel',
      collection: 'cg_combustivel',
      configKey: 'config_colunas_cg_combustivel',
      columns: COMBUSTIVEL_COLUMNS,
      fieldInfos: COMBUSTIVEL_FIELD_INFOS,
      items: (): CgItem[] => combustiveis,
      emptyMessage: 'Clique em "Adicionar" para cadastrar um combustível.',
    },
    modalidadeEnsino: {
      descKey: 'ds_modalidade_ensino',
      collection: 'cg_modalidade_ensino',
      configKey: 'config_colunas_cg_modalidade_ensino',
      columns: MODALIDADE_ENSINO_COLUMNS,
      fieldInfos: MODALIDADE_ENSINO_FIELD_INFOS,
      items: (): CgItem[] => modalidadesEnsino,
      emptyMessage: 'Clique em "Adicionar" para cadastrar uma modalidade de ensino.',
    },
    formatoPapel: {
      descKey: 'ds_formato_papel',
      collection: 'cg_formato_papel',
      configKey: 'config_colunas_cg_formato_papel',
      columns: FORMATO_PAPEL_COLUMNS,
      fieldInfos: FORMATO_PAPEL_FIELD_INFOS,
      items: (): CgItem[] => formatosPapel,
      emptyMessage: 'Clique em "Adicionar" para cadastrar um formato do papel.',
    },
    tipoPapel: {
      descKey: 'ds_tipo_papel',
      collection: 'cg_tipo_papel',
      configKey: 'config_colunas_cg_tipo_papel',
      columns: TIPO_PAPEL_COLUMNS,
      fieldInfos: TIPO_PAPEL_FIELD_INFOS,
      items: (): CgItem[] => tiposPapel,
      emptyMessage: 'Clique em "Adicionar" para cadastrar um tipo de papel.',
    },
  } as const;

  const cgKind = cgManageSelection === 'estadoCivil' ? 'estadoCivil' : cgManageSelection === 'corRaca' ? 'corRaca' : cgManageSelection === 'grauParentesco' ? 'grauParentesco' : cgManageSelection === 'cargo' ? 'cargo' : cgManageSelection === 'vinculoContratual' ? 'vinculoContratual' : cgManageSelection === 'profissao' ? 'profissao' : cgManageSelection === 'orgaoEmissor' ? 'orgaoEmissor' : cgManageSelection === 'logradouro' ? 'logradouro' : cgManageSelection === 'localizacao' ? 'localizacao' : cgManageSelection === 'marca' ? 'marca' : cgManageSelection === 'sistemaOperacional' ? 'sistemaOperacional' : cgManageSelection === 'combustivel' ? 'combustivel' : cgManageSelection === 'modalidadeEnsino' ? 'modalidadeEnsino' : cgManageSelection === 'formatoPapel' ? 'formatoPapel' : cgManageSelection === 'tipoPapel' ? 'tipoPapel' : 'sexo';
  const cgDef = CG_DEFS[cgKind];
  const cgDescKey = cgDef.descKey;
  const cgCollection = cgDef.collection;
  const cgConfigKey = cgDef.configKey;
  const cgColumns = cgDef.columns;
  const cgFieldInfos = cgDef.fieldInfos;
  const cgItems = cgDef.items();
  const cgEmptyMessage = cgDef.emptyMessage;
  const cgColunasConfig = useMemo(
    () => parseColunasConfig(currentUser?.[cgDef.configKey]),
    [currentUser?.[cgDef.configKey], cgKind]
  );

  const auditAutor = useMemo(() => {
    if (!currentUser) return undefined;
    return {
      usuarioId: currentUser.id ?? null,
      usuarioNome: currentUser.ds_usuario?.trim() || "-",
    };
  }, [currentUser]);

  // Quem exclui um registro fica documentado em Administração do Sistema > Exclusões.
  // O perfil em uso no momento da exclusão também fica registrado.
  const perfilEmUso = usuarioPerfisVinculados.find((p) => p.nr_sequencia === activePerfilSequencia) ?? usuarioPerfisVinculados[0];
  useEffect(() => {
    definirAutorExclusoes(auditAutor, perfilEmUso ? { nr_sequencia: perfilEmUso.nr_sequencia, ds_perfil: perfilEmUso.ds_perfil } : undefined);
  }, [auditAutor, perfilEmUso]);

  // Administração do Sistema > Exclusões: função selecionada e registro aberto no "Ver".
  const [exclusoesColecao, setExclusoesColecao] = useState<string | null>(null);
  const [exclusaoVer, setExclusaoVer] = useState<Exclusao | null>(null);
  const [exclusoesNavegacao, setExclusoesNavegacao] = useState<NavegacaoExclusoes>({ caminho: [], aba: null });
  const [exclusaoCidadeNome, setExclusaoCidadeNome] = useState('');

  // Resolve ds_usuario → nome da pessoa física vinculada (exibição nos rodapés de auditoria).
  const nomeAutorExibicao = useMemo(() => {
    const nomesPf = Object.fromEntries(pessoasFisicas.map((p) => [p.nr_sequencia, p.ds_nome]));
    const map: Record<string, string> = {};
    for (const u of usuarios) {
      const login = u.ds_usuario?.trim();
      if (!login) continue;
      const nome = u.nr_seq_pessoa_fisica != null ? nomesPf[u.nr_seq_pessoa_fisica]?.trim() : undefined;
      if (nome) map[login] = nome;
    }
    return map;
  }, [usuarios, pessoasFisicas]);

  function resolverNomeAutorExibicao(dsUsuario: string): string {
    if (!dsUsuario || dsUsuario === '-') return dsUsuario;
    return nomeAutorExibicao[dsUsuario.trim()] || dsUsuario;
  }

  /** Cópia do registro com ds_usuario_criacao/alteracao resolvidos para exibição (modais de visualização). */
  function comAutorExibicao<T extends { ds_usuario_criacao?: string; ds_usuario_alteracao?: string }>(registro: T | null): T | null {
    if (!registro) return registro;
    return {
      ...registro,
      ds_usuario_criacao: resolverNomeAutorExibicao(registro.ds_usuario_criacao ?? ''),
      ds_usuario_alteracao: resolverNomeAutorExibicao(registro.ds_usuario_alteracao ?? ''),
    };
  }

  /* ── Opções de Cadastros Gerais para o dropdown de Cargo (Colaborador) ── */
  const colaboradorCargosOptions = useMemo(
    () => cargos.map((c) => ({ nr_sequencia: c.nr_sequencia, descricao: c.ds_cargo, ie_status: c.ie_status })),
    [cargos]
  );

  /* ── Opções de Cadastros Gerais para o dropdown de Vínculo contratual (Colaborador) ── */
  const colaboradorVinculosOptions = useMemo(
    () => vinculosContratuais.map((v) => ({ nr_sequencia: v.nr_sequencia, descricao: v.ds_vinculo_contratual, ie_status: v.ie_status })),
    [vinculosContratuais]
  );

  /* ── Opções de Cadastros Gerais para os dropdowns de Pessoa Física ── */
  const pfCgOptions = useMemo(
    () => ({
      sexos: sexos.map((s) => ({ nr_sequencia: s.nr_sequencia, descricao: s.ds_sexo, ie_status: s.ie_status })),
      estadoCivis: estadoCivis.map((s) => ({ nr_sequencia: s.nr_sequencia, descricao: s.ds_estado_civil, ie_status: s.ie_status })),
      coresRacas: coresRacas.map((s) => ({ nr_sequencia: s.nr_sequencia, descricao: s.ds_cor_raca, ie_status: s.ie_status })),
      profissoes: profissoes.map((s) => ({ nr_sequencia: s.nr_sequencia, descricao: s.ds_profissao, ie_status: s.ie_status })),
      orgaosEmissores: orgaosEmissores.map((o) => ({ nr_sequencia: o.nr_sequencia, descricao: o.ds_orgao_emissor, ie_status: o.ie_status, sigla: o.sg_orgao_emissor ?? '' })),
      logradouros: logradouros.map((l) => ({ nr_sequencia: l.nr_sequencia, descricao: l.ds_logradouro, ie_status: l.ie_status, sigla: l.sg_logradouro ?? '' })),
    }),
    [sexos, estadoCivis, coresRacas, profissoes, orgaosEmissores, logradouros]
  );

  /* ── Lookups (nr_sequencia → descrição) para as colunas de Pessoa Física ── */
  const pfCgLookups = useMemo(
    () => ({
      nr_seq_sexo: Object.fromEntries(pfCgOptions.sexos.map((o) => [o.nr_sequencia, o.descricao])),
      nr_seq_estado_civil: Object.fromEntries(pfCgOptions.estadoCivis.map((o) => [o.nr_sequencia, o.descricao])),
      nr_seq_cor_raca: Object.fromEntries(pfCgOptions.coresRacas.map((o) => [o.nr_sequencia, o.descricao])),
      nr_seq_profissao: Object.fromEntries(pfCgOptions.profissoes.map((o) => [o.nr_sequencia, o.descricao])),
      nr_seq_orgao_emissor: Object.fromEntries(pfCgOptions.orgaosEmissores.map((o) => [o.nr_sequencia, o.descricao])),
      nr_seq_logradouro: Object.fromEntries(pfCgOptions.logradouros.map((o) => [o.nr_sequencia, o.descricao])),
    }),
    [pfCgOptions]
  );

  /* ── Lookups (nr_sequencia → descrição) para as colunas de Pessoa Jurídica ── */
  const pjCgLookups = useMemo(
    () => ({
      nr_seq_logradouro: Object.fromEntries(pfCgOptions.logradouros.map((o) => [o.nr_sequencia, o.descricao])),
    }),
    [pfCgOptions]
  );

  /* ── Lookups (nr_sequencia → nome) para as colunas de Aluno ── */
  const nomePessoaFisicaDoAluno = useCallback(
    (seq?: number) => (seq ? pessoasFisicas.find((p) => p.nr_sequencia === seq)?.ds_nome ?? '' : ''),
    [pessoasFisicas]
  );

  const alunoPessoaFisicaLookups = useMemo(() => ({
    nr_seq_pessoa_fisica: Object.fromEntries(pessoasFisicas.map((p) => [p.nr_sequencia, p.ds_nome])),
  }), [pessoasFisicas]);

  /* ── Carregar pessoas físicas, jurídicas e usuários ── */
  const loadPessoasFisicas = useCallback(async () => {
    setLoading(true);
    try {
      const data = await obterPessoasFisicas();
      setPessoasFisicas(data);
    } catch {
      setMessage("Erro ao carregar registros.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadPessoasJuridicas = useCallback(async () => {
    setLoading(true);
    try {
      const data = await obterPessoasJuridicas();
      setPessoasJuridicas(data);
    } catch {
      setMessage("Erro ao carregar registros.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAlunos = useCallback(async () => {
    setLoading(true);
    try {
      const data = await obterAlunos();
      setAlunos(data);
    } catch {
      setMessage("Erro ao carregar registros.");
    } finally {
      setLoading(false);
    }
  }, []);

  /** Cores configuradas para a bolinha de status do Período letivo (padrão enquanto não configuradas). */
  // Parâmetro "A previsão de término encerra o período letivo automaticamente" (Sim = 'S').
  const [encerramentoAutomaticoPeriodoLetivo, setEncerramentoAutomaticoPeriodoLetivo] = useState(false);
  const loadEncerramentoAutomaticoPeriodoLetivo = useCallback(async () => {
    try {
      const doc = await obterParametro(COLECAO_PARAM_ENCERRAMENTO_AUTOMATICO_PERIODO_LETIVO);
      setEncerramentoAutomaticoPeriodoLetivo(doc?.ie_regra === 'S');
    } catch {
      // mantém o valor atual em caso de falha
    }
  }, []);

  const loadCoresStatusPeriodoLetivo = useCallback(async () => {
    try {
      const [andamento, encerrado] = await Promise.all([
        obterParametro(COLECAO_PARAM_COR_PERIODO_LETIVO_ANDAMENTO),
        obterParametro(COLECAO_PARAM_COR_PERIODO_LETIVO_ENCERRADO),
      ]);
      setCoresStatusPeriodoLetivo({
        A: andamento?.cd_cor || CORES_STATUS_PERIODO_LETIVO_PADRAO.A,
        E: encerrado?.cd_cor || CORES_STATUS_PERIODO_LETIVO_PADRAO.E,
      });
    } catch {
      // mantém as cores atuais em caso de falha
    }
  }, []);

  const loadCoresStatusAtivo = useCallback(async () => {
    try {
      const [descartado, estoque, manutencao, operacional] = await Promise.all([
        obterParametro(COLECAO_PARAM_COR_ATIVO_DESCARTADO),
        obterParametro(COLECAO_PARAM_COR_ATIVO_ESTOQUE),
        obterParametro(COLECAO_PARAM_COR_ATIVO_MANUTENCAO),
        obterParametro(COLECAO_PARAM_COR_ATIVO_OPERACIONAL),
      ]);
      setCoresStatusAtivo({
        D: descartado?.cd_cor || CORES_STATUS_ATIVO_PADRAO.D,
        E: estoque?.cd_cor || CORES_STATUS_ATIVO_PADRAO.E,
        M: manutencao?.cd_cor || CORES_STATUS_ATIVO_PADRAO.M,
        O: operacional?.cd_cor || CORES_STATUS_ATIVO_PADRAO.O,
      });
    } catch {
      // mantém as cores atuais em caso de falha
    }
  }, []);

  const loadRecebimentoAutomaticoCopia = useCallback(async () => {
    try {
      const doc = await obterParametro(COLECAO_PARAM_DATA_RECEBIMENTO_AUTOMATICA);
      setRecebimentoAutomaticoCopia(doc?.ie_regra === 'S');
    } catch {
      // mantém o valor atual em caso de falha
    }
  }, []);

  const loadPapelPadraoCopia = useCallback(async () => {
    try {
      const [formato, tipo] = await Promise.all([
        obterParametro(COLECAO_PARAM_FORMATO_PAPEL_PADRAO),
        obterParametro(COLECAO_PARAM_TIPO_PAPEL_PADRAO),
      ]);
      setPapelPadraoCopia({
        nr_seq_formato_papel: formato?.nr_seq_formato_papel != null ? String(formato.nr_seq_formato_papel) : '',
        nr_seq_tipo_papel: tipo?.nr_seq_tipo_papel != null ? String(tipo.nr_seq_tipo_papel) : '',
      });
    } catch {
      // mantém o valor atual em caso de falha
    }
  }, []);

  /** Opções do dropdown "Valor padrão" dos parâmetros de Formato do papel e Tipo de papel. */
  const opcoesValorPadraoCopia = useMemo(() => ({
    formato_papel_padrao: opcoesDeReferencia(formatosPapel, (f) => f.ds_formato_papel, papelPadraoCopia.nr_seq_formato_papel),
    tipo_papel_padrao: opcoesDeReferencia(tiposPapel, (t) => t.ds_tipo_papel, papelPadraoCopia.nr_seq_tipo_papel),
  }), [formatosPapel, tiposPapel, papelPadraoCopia]);

  const loadCoresStatusCopia = useCallback(async () => {
    try {
      const [aguardando, cancelado, entregue, impresso] = await Promise.all([
        obterParametro(COLECAO_PARAM_COR_COPIA_AGUARDANDO),
        obterParametro(COLECAO_PARAM_COR_COPIA_CANCELADO),
        obterParametro(COLECAO_PARAM_COR_COPIA_ENTREGUE),
        obterParametro(COLECAO_PARAM_COR_COPIA_IMPRESSO),
      ]);
      setCoresStatusCopia({
        A: aguardando?.cd_cor || CORES_STATUS_COPIA_PADRAO.A,
        C: cancelado?.cd_cor || CORES_STATUS_COPIA_PADRAO.C,
        E: entregue?.cd_cor || CORES_STATUS_COPIA_PADRAO.E,
        I: impresso?.cd_cor || CORES_STATUS_COPIA_PADRAO.I,
      });
    } catch {
      // mantém as cores atuais em caso de falha
    }
  }, []);

  const loadCoresStatusManutencao = useCallback(async () => {
    try {
      const [andamento, concluida, cancelada] = await Promise.all([
        obterParametro(COLECAO_PARAM_COR_MANUTENCAO_ANDAMENTO),
        obterParametro(COLECAO_PARAM_COR_MANUTENCAO_CONCLUIDA),
        obterParametro(COLECAO_PARAM_COR_MANUTENCAO_CANCELADA),
      ]);
      setCoresStatusManutencao({
        E: andamento?.cd_cor || CORES_STATUS_MANUTENCAO_PADRAO.E,
        CO: concluida?.cd_cor || CORES_STATUS_MANUTENCAO_PADRAO.CO,
        CA: cancelada?.cd_cor || CORES_STATUS_MANUTENCAO_PADRAO.CA,
      });
    } catch {
      // mantém as cores atuais em caso de falha
    }
  }, []);

  const loadPeriodosLetivos = useCallback(async () => {
    setLoading(true);
    try {
      const data = await obterPeriodosLetivos();
      setPeriodosLetivos(data);
    } catch {
      setMessage("Erro ao carregar registros.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadColaboradores = useCallback(async () => {
    setLoading(true);
    try {
      const data = await obterColaboradores();
      setColaboradores(data);
    } catch {
      setMessage("Erro ao carregar registros.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadUsuarios = useCallback(async () => {
    setLoading(true);
    try {
      const data = await obterUsuarios();
      setUsuarios(data);
    } catch {
      setMessage("Erro ao carregar usuários.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadPerfis = useCallback(async () => {
    setLoading(true);
    try {
      const data = await obterPerfis();
      setPerfis(data);
    } catch {
      setMessage("Erro ao carregar perfis.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSexos = useCallback(async () => {
    setLoading(true);
    try {
      const data = await obterSexos();
      setSexos(data);
    } catch {
      setMessage("Erro ao carregar registros.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadEstadoCivis = useCallback(async () => {
    setLoading(true);
    try {
      const data = await obterEstadoCivis();
      setEstadoCivis(data);
    } catch {
      setMessage("Erro ao carregar registros.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadCoresRacas = useCallback(async () => {
    setLoading(true);
    try {
      const data = await obterCoresRacas();
      setCoresRacas(data);
    } catch {
      setMessage("Erro ao carregar registros.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadProfissoes = useCallback(async () => {
    setLoading(true);
    try {
      const data = await obterProfissoes();
      setProfissoes(data);
    } catch {
      setMessage("Erro ao carregar registros.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadOrgaosEmissores = useCallback(async () => {
    setLoading(true);
    try {
      const data = await obterOrgaosEmissores();
      setOrgaosEmissores(data);
    } catch {
      setMessage("Erro ao carregar registros.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadLogradouros = useCallback(async () => {
    setLoading(true);
    try {
      const data = await obterLogradouros();
      setLogradouros(data);
    } catch {
      setMessage("Erro ao carregar registros.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadGrausParentesco = useCallback(async () => {
    setLoading(true);
    try {
      const data = await obterGrausParentesco();
      setGrausParentesco(data);
    } catch {
      setMessage("Erro ao carregar registros.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadCargos = useCallback(async () => {
    setLoading(true);
    try {
      const data = await obterCargos();
      setCargos(data);
    } catch {
      setMessage("Erro ao carregar registros.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadVinculosContratuais = useCallback(async () => {
    setLoading(true);
    try {
      const data = await obterVinculosContratuais();
      setVinculosContratuais(data);
    } catch {
      setMessage("Erro ao carregar registros.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadLocalizacoes = useCallback(async () => {
    setLoading(true);
    try {
      const data = await obterLocalizacoes();
      setLocalizacoes(data);
    } catch {
      setMessage("Erro ao carregar registros.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMarcas = useCallback(async () => {
    setLoading(true);
    try {
      const data = await obterMarcas();
      setMarcas(data);
    } catch {
      setMessage("Erro ao carregar registros.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadModalidadesEnsino = useCallback(async () => {
    setLoading(true);
    try {
      setModalidadesEnsino(await obterModalidadesEnsino());
    } catch {
      setMessage("Erro ao carregar registros.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadFormatosPapel = useCallback(async () => {
    setLoading(true);
    try {
      setFormatosPapel(await obterFormatosPapel());
    } catch {
      setMessage("Erro ao carregar registros.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadTiposPapel = useCallback(async () => {
    setLoading(true);
    try {
      setTiposPapel(await obterTiposPapel());
    } catch {
      setMessage("Erro ao carregar registros.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadCopias = useCallback(async () => {
    setLoading(true);
    try {
      setCopias(await obterCopias());
    } catch {
      setMessage("Erro ao carregar registros.");
    } finally {
      setLoading(false);
    }
  }, []);

  /** Tipos de arquivo liberados para o anexo de Cópias (parâmetro de Controle de Cópias). */
  const loadExtensoesCopia = useCallback(async () => {
    try {
      const doc = await obterParametro(COLECAO_PARAM_TIPOS_ARQUIVO_COPIA);
      setExtensoesCopia(extensoesPermitidasCopia(doc?.id ? (doc.ds_regra ?? '') : null));
    } catch {
      // mantém o valor atual em caso de falha
    }
  }, []);

  /** Administração do Sistema > Parâmetros: depois de salvar, recarrega o que usa o parâmetro. */
  const aposSalvarParametro = useCallback((colecao: string) => {
    if ([COLECAO_PARAM_COR_ATIVO_DESCARTADO, COLECAO_PARAM_COR_ATIVO_ESTOQUE, COLECAO_PARAM_COR_ATIVO_MANUTENCAO, COLECAO_PARAM_COR_ATIVO_OPERACIONAL].includes(colecao)) loadCoresStatusAtivo();
    if ([COLECAO_PARAM_COR_MANUTENCAO_ANDAMENTO, COLECAO_PARAM_COR_MANUTENCAO_CONCLUIDA, COLECAO_PARAM_COR_MANUTENCAO_CANCELADA].includes(colecao)) loadCoresStatusManutencao();
    if (colecao === COLECAO_PARAM_COR_PERIODO_LETIVO_ANDAMENTO || colecao === COLECAO_PARAM_COR_PERIODO_LETIVO_ENCERRADO) loadCoresStatusPeriodoLetivo();
    if (colecao === COLECAO_PARAM_ENCERRAMENTO_AUTOMATICO_PERIODO_LETIVO) loadEncerramentoAutomaticoPeriodoLetivo();
    if (colecao === COLECAO_PARAM_TIPOS_ARQUIVO_COPIA) loadExtensoesCopia();
    if ([COLECAO_PARAM_COR_COPIA_AGUARDANDO, COLECAO_PARAM_COR_COPIA_CANCELADO, COLECAO_PARAM_COR_COPIA_ENTREGUE, COLECAO_PARAM_COR_COPIA_IMPRESSO].includes(colecao)) loadCoresStatusCopia();
    if (colecao === COLECAO_PARAM_DATA_RECEBIMENTO_AUTOMATICA) loadRecebimentoAutomaticoCopia();
    if (colecao === COLECAO_PARAM_FORMATO_PAPEL_PADRAO || colecao === COLECAO_PARAM_TIPO_PAPEL_PADRAO) loadPapelPadraoCopia();
  }, [loadCoresStatusAtivo, loadCoresStatusManutencao, loadCoresStatusPeriodoLetivo, loadEncerramentoAutomaticoPeriodoLetivo, loadExtensoesCopia, loadCoresStatusCopia, loadRecebimentoAutomaticoCopia, loadPapelPadraoCopia]);

  const loadDisciplinas = useCallback(async () => {
    setLoading(true);
    try {
      setDisciplinas(await obterDisciplinas());
    } catch {
      setMessage("Erro ao carregar registros.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadTurmasDisciplinas = useCallback(async () => {
    setLoading(true);
    try {
      setTurmasDisciplinas(await obterTurmasDisciplinas());
    } catch {
      setMessage("Erro ao carregar registros.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadTurmas = useCallback(async () => {
    setLoading(true);
    try {
      setTurmas(await obterTurmas());
    } catch {
      setMessage("Erro ao carregar registros.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadCursos = useCallback(async () => {
    setLoading(true);
    try {
      setCursos(await obterCursos());
    } catch {
      setMessage("Erro ao carregar registros.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadCategoriasAtivos = useCallback(async () => {
    setLoading(true);
    try {
      const data = await obterCategoriasAtivos();
      setCategoriasAtivos(data);
    } catch {
      setMessage("Erro ao carregar registros.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSistemasOperacionais = useCallback(async () => {
    setLoading(true);
    try {
      const data = await obterSistemasOperacionais();
      setSistemasOperacionais(data);
    } catch {
      setMessage("Erro ao carregar registros.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadCombustiveis = useCallback(async () => {
    setLoading(true);
    try {
      const data = await obterCombustiveis();
      setCombustiveis(data);
    } catch {
      setMessage("Erro ao carregar registros.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAtivos = useCallback(async () => {
    setLoading(true);
    try {
      const [data, responsaveis] = await Promise.all([
        obterAtivos(),
        obterResponsaveisAtivos().catch(() => [] as AtivoResponsavel[]),
      ]);
      setAtivos(data);
      setResponsaveisAtivos(responsaveis);
    } catch {
      setMessage("Erro ao carregar registros.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadManutencoes = useCallback(async () => {
    setLoading(true);
    try {
      const data = await obterManutencoes();
      setManutencoes(data);
    } catch {
      setMessage("Erro ao carregar registros.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadRelatorios = useCallback(async () => {
    setLoading(true);
    try {
      const data = await obterRelatorios();
      setRelatorios(data);
    } catch {
      setMessage("Erro ao carregar relatórios.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadCgItems = useCallback(async () => {
    if (cgKind === 'sexo') {
      await loadSexos();
    } else if (cgKind === 'estadoCivil') {
      await loadEstadoCivis();
    } else if (cgKind === 'corRaca') {
      await loadCoresRacas();
    } else if (cgKind === 'grauParentesco') {
      await loadGrausParentesco();
    } else if (cgKind === 'cargo') {
      await loadCargos();
    } else if (cgKind === 'vinculoContratual') {
      await loadVinculosContratuais();
    } else if (cgKind === 'localizacao') {
      await loadLocalizacoes();
    } else if (cgKind === 'marca') {
      await loadMarcas();
    } else if (cgKind === 'profissao') {
      await loadProfissoes();
    } else if (cgKind === 'logradouro') {
      await loadLogradouros();
    } else if (cgKind === 'sistemaOperacional') {
      await loadSistemasOperacionais();
    } else if (cgKind === 'combustivel') {
      await loadCombustiveis();
    } else if (cgKind === 'modalidadeEnsino') {
      await loadModalidadesEnsino();
    } else if (cgKind === 'formatoPapel') {
      await loadFormatosPapel();
    } else if (cgKind === 'tipoPapel') {
      await loadTiposPapel();
    } else {
      await loadOrgaosEmissores();
    }
  }, [cgKind, loadSexos, loadEstadoCivis, loadCoresRacas, loadGrausParentesco, loadCargos, loadVinculosContratuais, loadLocalizacoes, loadMarcas, loadProfissoes, loadLogradouros, loadOrgaosEmissores, loadSistemasOperacionais, loadCombustiveis, loadModalidadesEnsino, loadFormatosPapel, loadTiposPapel]);

  /* Enter nos modais de filtro e lookups aciona o "Filtrar": useAtalhoFiltrarModal. */

  useEffect(() => {
    // As rotas de dados exigem sessão: carrega ao entrar (ou ao restaurar a sessão).
    if (!isAuthenticated) return;
    loadPessoasFisicas();
    loadUsuarios();
    loadPerfis();
    loadImagens();
    loadSexos();
    loadEstadoCivis();
    loadCoresRacas();
    loadProfissoes();
    loadOrgaosEmissores();
    loadLogradouros();
    loadGrausParentesco();
    loadCargos();
    loadVinculosContratuais();
    loadLocalizacoes();
    loadMarcas();
    loadCategoriasAtivos();
    loadCursos();
    loadDisciplinas();
    loadTurmas();
    loadTurmasDisciplinas();
    loadSistemasOperacionais();
    loadCombustiveis();
    loadModalidadesEnsino();
    loadFormatosPapel();
    loadTiposPapel();
    loadCopias();
    loadExtensoesCopia();
    loadCoresStatusCopia();
    loadRecebimentoAutomaticoCopia();
    loadPapelPadraoCopia();
    loadAtivos();
    loadManutencoes();
    loadRelatorios();
    loadPessoasJuridicas();
    loadAlunos();
    loadColaboradores();
    loadPeriodosLetivos();
    loadCoresStatusPeriodoLetivo();
    loadEncerramentoAutomaticoPeriodoLetivo();
    loadCoresStatusAtivo();
    loadCoresStatusManutencao();
  }, [isAuthenticated, loadPessoasFisicas, loadUsuarios, loadPerfis, loadSexos, loadEstadoCivis, loadCoresRacas, loadProfissoes, loadOrgaosEmissores, loadLogradouros, loadGrausParentesco, loadCargos, loadVinculosContratuais, loadLocalizacoes, loadMarcas, loadCategoriasAtivos, loadCursos, loadDisciplinas, loadTurmas, loadTurmasDisciplinas, loadModalidadesEnsino, loadFormatosPapel, loadTiposPapel, loadCopias, loadExtensoesCopia, loadCoresStatusCopia, loadRecebimentoAutomaticoCopia, loadPapelPadraoCopia, loadSistemasOperacionais, loadCombustiveis, loadAtivos, loadManutencoes, loadPessoasJuridicas, loadAlunos, loadColaboradores, loadPeriodosLetivos, loadCoresStatusPeriodoLetivo, loadEncerramentoAutomaticoPeriodoLetivo, loadCoresStatusAtivo, loadCoresStatusManutencao]);

  // Período letivo em tempo real: a lista acompanha qualquer alteração no banco
  // (ex.: encerramento automático feito por este ou por outro usuário).
  useEffect(() => {
    if (!currentUser?.id) return;
    return observarPeriodosLetivos(setPeriodosLetivos, () => setMessage("Erro ao carregar registros."));
  }, [currentUser?.id]);

  // Encerramento automático pela previsão de término (parâmetro = Sim): verifica ao
  // abrir e a cada minuto, enquanto o sistema estiver aberto. A data de término passa
  // a ser a própria previsão; a transação no serviço evita encerrar duas vezes.
  const encerrandoPeriodosRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!currentUser?.id || !encerramentoAutomaticoPeriodoLetivo) return;
    function verificar() {
      const hoje = new Date();
      const hojeNum = hoje.getFullYear() * 10000 + (hoje.getMonth() + 1) * 100 + hoje.getDate();
      for (const periodo of periodosLetivos) {
        if (!periodo.id || periodo.ie_status === 'E' || encerrandoPeriodosRef.current.has(periodo.id)) continue;
        const previsao = parseDateInput(periodo.dt_previsao_termino ?? '');
        if (previsao === null || previsao > hojeNum) continue;
        const id = periodo.id;
        encerrandoPeriodosRef.current.add(id);
        encerrarPeriodoLetivoPorPrevisao(id, { usuarioId: null, usuarioNome: 'Sistema' })
          .catch((e) => console.error('Erro no encerramento automático do período letivo', e))
          .finally(() => encerrandoPeriodosRef.current.delete(id));
      }
    }
    verificar();
    const timer = window.setInterval(verificar, 60_000);
    return () => window.clearInterval(timer);
  }, [currentUser?.id, encerramentoAutomaticoPeriodoLetivo, periodosLetivos]);

  /* ── Carregar unidades federativas (UF) da API do IBGE para o dropdown do formulário ── */
  useEffect(() => {
    let cancelled = false;
    obterEstados()
      .then((lista) => {
        if (cancelled) return;
        setEstados(lista.map((e) => ({ value: e.sigla, label: `${e.sigla} - ${e.nome}` })));
      })
      .catch(() => {
        /* Sem conexão com a API — usa as siglas estáticas como fallback */
        if (!cancelled) setEstados(UF_OPTIONS);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  /* ── Ctrl+S nos modais com campos (aciona o botão principal do modal do topo) ── */
  useAtalhoSalvarModal(isAuthenticated);
  useAtalhoFiltrarModal(isAuthenticated);

  /* ── Persistir sessão: sobrevive à recarga; só quebra no Sair ──
     O login fica no localStorage (compartilhado entre as abas do navegador).
     A navegação (função ativa, funções abertas, dropdowns PAI) também vai para o
     sessionStorage, que é de cada aba: assim o F5 numa aba restaura a função
     dela, e não a última usada em outra aba. O localStorage só serve de ponto
     de partida para abas novas. */
  useEffect(() => {
    if (!isAuthenticated || !currentUser?.id) return;
    const navegacao = {
      activeSection,
      secoesAbertas,
      adminManageSelection,
      cgManageSelection,
      pjManageSelection,
      alunoManageSelection,
      patrimonioManageSelection: ativoManageSelection,
      relatorioManageSelection,
      logsManageSelection,
      ccManageSelection,
    };
    try {
      window.sessionStorage.setItem(SESSION_NAV_KEY, JSON.stringify(navegacao));
    } catch {
      /* storage indisponível — navegação da aba não persiste */
    }
    try {
      window.localStorage.setItem(
        SESSION_KEY,
        JSON.stringify({
          userId: currentUser.id,
          ...navegacao,
          sessaoInicio,
        })
      );
    } catch {
      /* storage indisponível — sessão não persiste */
    }
  }, [isAuthenticated, currentUser, sessaoInicio, activeSection, secoesAbertas, adminManageSelection, cgManageSelection, pjManageSelection, alunoManageSelection, ativoManageSelection, relatorioManageSelection, logsManageSelection, ccManageSelection]);

  /* ── Aplicar preferência de tema do usuário logado ── */
  useEffect(() => {
    if (!currentUser?.id) return;
    const userKey = getDarkModeKey(currentUser.id);
    if (currentUser.config_tema) {
      setDarkMode(currentUser.config_tema === 'E');
      try {
        window.localStorage.setItem(userKey, currentUser.config_tema === 'E' ? "1" : "0");
      } catch {
        /* storage indisponível */
      }
      return;
    }
    /* Fallback: preferência local do próprio usuário (nunca a de outro) */
    try {
      const saved = window.localStorage.getItem(userKey);
      setDarkMode(saved === "1");
    } catch {
      /* storage indisponível — mantém claro */
    }
  }, [currentUser]);

  /* ── Aplicar ordem das funções do menu do usuário logado ── */
  useEffect(() => {
    if (!currentUser) return;
    const parsed = parseMenuOrder(currentUser.config_ordem_menu_lateral);
    setMenuOrder(parsed ? normalizeMenuOrder(parsed) : SECTION_ORDER_ALPHABETICAL);
  }, [currentUser]);

  /* ── Perfil ativo do usuário logado (selecionado na pop-up) ── */
  useEffect(() => {
    if (!currentUser) return;
    if (usuarioPerfisVinculados.length === 0) {
      setActivePerfilSequencia(null);
      return;
    }
    const saved = Number(currentUser.config_perfil_ativo);
    const savedOk = usuarioPerfisVinculados.some((p) => p.nr_sequencia === saved);
    if (savedOk) {
      setActivePerfilSequencia(saved);
      return;
    }
    /* Fallback: preferência local do próprio usuário (nunca a de outro) */
    try {
      const local = Number(window.localStorage.getItem(getActivePerfilKey(currentUser.id)));
      const localOk = usuarioPerfisVinculados.some((p) => p.nr_sequencia === local);
      if (localOk) {
        setActivePerfilSequencia(local);
        return;
      }
    } catch {
      /* storage indisponível */
    }
    setActivePerfilSequencia(usuarioPerfisVinculados[0].nr_sequencia);
  }, [currentUser, usuarioPerfisVinculados]);

  function handleActivePerfilChange(nr: number) {
    setActivePerfilSequencia(nr);
    if (!currentUser?.id) return;
    try {
      window.localStorage.setItem(getActivePerfilKey(currentUser.id), String(nr));
    } catch {
      /* storage indisponível */
    }
    atualizarPreferenciasUsuario(currentUser.id, { config_perfil_ativo: String(nr) })
      .then(() => {
        setCurrentUser((u) => (u ? { ...u, config_perfil_ativo: String(nr) } : u));
      })
      .catch((err) => {
        console.error('Erro ao salvar perfil ativo no banco', err);
      });
  }

  /* ── Se a seção ativa não está liberada ao usuário, volta à primeira liberada ── */
  useEffect(() => {
    if (!currentUser) return;
    if (allowedSections.length === 0) {
      // Nenhuma função liberada: não deixa nenhuma seção ativa.
      setView('list');
      setContextMenu(null);
      return;
    }
    if (activeSection && !allowedSections.includes(activeSection)) {
      setActiveSection(allowedSections[0]);
      setView('list');
      setContextMenu(null);
    }
  }, [allowedSections, activeSection, currentUser]);

  /* ── Largura do menu lateral aberto: cabe o maior nome de função ── */
  useLayoutEffect(() => {
    function medir() {
      const rotulos = sidebarRef.current?.querySelectorAll<HTMLElement>("[data-rotulo-funcao]") ?? [];
      const maior = Array.from(rotulos).reduce((max, el) => Math.max(max, Math.ceil(el.scrollWidth)), 0);
      if (maior === 0) return;
      setLarguraMenuAberto(Math.min(LARGURA_MENU_MAX, Math.max(LARGURA_MENU_MIN, maior + LARGURA_MENU_FIXA_ITEM)));
    }
    medir();
    let ativo = true;
    document.fonts?.ready.then(() => { if (ativo) medir(); });
    return () => { ativo = false; };
  }, [currentUser, allowedSections, menuOrder]);

  /* ── Restaurar sessão ao montar ── */
  useEffect(() => {
    let cancelled = false;

    async function restaurarSessao() {
      try {
        const raw = window.localStorage.getItem(SESSION_KEY);
        if (!raw) return;

        const sessionLocal = JSON.parse(raw) as {
          userId?: string;
          activeSection?: SectionType;
          secoesAbertas?: unknown;
          adminManageSelection?: string;
          cgManageSelection?: string;
          pjManageSelection?: string;
          alunoManageSelection?: string;
          patrimonioManageSelection?: string;
          relatorioManageSelection?: string;
          logsManageSelection?: string;
          ccManageSelection?: string;
          sessaoInicio?: number;
        };

        // A navegação salva nesta aba (sessionStorage) tem prioridade sobre a do
        // localStorage, que reflete a última aba usada.
        let navegacaoDaAba: Partial<typeof sessionLocal> = {};
        try {
          const rawNav = window.sessionStorage.getItem(SESSION_NAV_KEY);
          const parsed = rawNav ? JSON.parse(rawNav) : null;
          if (parsed && typeof parsed === "object") {
            const { userId: _u, sessaoInicio: _s, ...resto } = parsed as typeof sessionLocal;
            void _u; void _s;
            navegacaoDaAba = resto;
          }
        } catch {
          /* navegação da aba corrompida — usa a do localStorage */
        }
        const session = sessionLocal ? { ...sessionLocal, ...navegacaoDaAba } : sessionLocal;

        if (!session?.userId) return;

        // A sessão vale pelo cookie do servidor; o localStorage guarda só a navegação.
        const usuarioSalvo = await Promise.race([
          obterSessao(),
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Timeout')), 10000)),
        ]);
        if (cancelled) return;

        if (!usuarioSalvo) {
          window.localStorage.removeItem(SESSION_KEY);
          return;
        }

        setCurrentUser(usuarioSalvo);
        restaurarFiltrosSalvos(usuarioSalvo);
        // Funções abertas sobrevivem à recarga: só fecham pelo X ou no Sair.
        if (Array.isArray(session.secoesAbertas)) {
          setSecoesAbertas(session.secoesAbertas.filter(ehSecao).filter((s, i, lista) => lista.indexOf(s) === i));
        }
        if (ehSecao(session.activeSection)) {
          setActiveSection(session.activeSection);
        }
        if (typeof session.adminManageSelection === "string" && (session.adminManageSelection === 'usuarios' || session.adminManageSelection === 'perfis' || session.adminManageSelection === 'camposFormularios' || session.adminManageSelection === 'camposModais' || session.adminManageSelection === 'imagens' || session.adminManageSelection === 'avisos' || session.adminManageSelection === 'regras' || session.adminManageSelection === 'parametros')) {
          setAdminManageSelection(session.adminManageSelection);
          setAdminInteracted(true);
        } else if (session.adminManageSelection === 'campos') {
          // Sessão salva antes da divisão de Campos: abre Campos x Formulários.
          setAdminManageSelection('camposFormularios');
          setAdminInteracted(true);
        }
        if (typeof session.cgManageSelection === "string" && session.cgManageSelection.trim() !== "") {
          setCgManageSelection(session.cgManageSelection);
          setCgInteracted(true);
        }
        if (typeof session.pjManageSelection === "string" && (session.pjManageSelection === 'pessoasFisicas' || session.pjManageSelection === 'pessoasJuridicas')) {
          setPjManageSelection(session.pjManageSelection);
          setPjInteracted(true);
        }
        if (typeof session.alunoManageSelection === "string" && (session.alunoManageSelection === 'alunos' || session.alunoManageSelection === 'colaboradores' || session.alunoManageSelection === 'periodoLetivo' || session.alunoManageSelection === 'cursos' || session.alunoManageSelection === 'disciplinas' || session.alunoManageSelection === 'turmas' || session.alunoManageSelection === 'turmasDisciplinas')) {
          setAlunoManageSelection(session.alunoManageSelection);
          setAlunoInteracted(true);
        }
        if (typeof session.patrimonioManageSelection === "string" && session.patrimonioManageSelection.trim() !== "" && session.patrimonioManageSelection !== "parametrosFuncao") {
          setAtivoManageSelection(session.patrimonioManageSelection);
          setAtivoInteracted(true);
        }
        if (session.ccManageSelection === 'copias') {
          setCcManageSelection(session.ccManageSelection);
        }
        if (session.logsManageSelection === 'acessos' || session.logsManageSelection === 'exclusoes') {
          setLogsManageSelection(session.logsManageSelection);
        } else if (session.adminManageSelection === 'exclusoes') {
          // Sessão salva antes de Exclusões ir para Logs.
          setLogsManageSelection('exclusoes');
        }
        if (typeof session.relatorioManageSelection === "string" && session.relatorioManageSelection.trim() !== "") {
          setRelatorioManageSelection(session.relatorioManageSelection);
          setRelatorioInteracted(true);
        }
        // Sessões salvas antes do logout automático não guardavam o início: conta a partir de agora.
        setSessaoInicio(typeof session.sessaoInicio === "number" ? session.sessaoInicio : Date.now());
        setView("list");
        setIsAuthenticated(true);
      } catch {
        /* sessão corrompida — cai para a tela de login */
      } finally {
        if (!cancelled) setSessionRestoring(false);
      }
    }

    restaurarSessao();
    return () => {
      cancelled = true;
    };
  }, []);

  /* ── Sessão encerrada no servidor (expirou ou o usuário foi bloqueado): volta ao login ── */
  useEffect(() => {
    if (!isAuthenticated) return;
    const aoExpirar = () => handleLogout();
    window.addEventListener(EVENTO_SESSAO_EXPIRADA, aoExpirar);
    return () => window.removeEventListener(EVENTO_SESSAO_EXPIRADA, aoExpirar);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  /* ── Logout automático (Administração do Sistema > Sistema) ── */
  // A regra é carregada ao entrar e recarregada periodicamente: uma alteração
  // feita por outro usuário passa a valer sem recarregar a página.
  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelado = false;
    const carregar = () => {
      obterRegra()
        .then((regra) => { if (!cancelado) setRegraSistema(regra); })
        .catch((e) => console.error("Erro ao carregar regras do sistema", e));
    };
    carregar();
    const intervalo = window.setInterval(carregar, 5 * 60 * 1000);
    return () => {
      cancelado = true;
      window.clearInterval(intervalo);
    };
  }, [isAuthenticated]);

  // Encerra a sessão quando o último horário programado é posterior ao início
  // dela — inclusive se a aba estava fechada ou o computador suspenso na hora.
  // A regra só vale a partir de quando foi salva: salvar um horário que já
  // passou hoje não derruba ninguém naquele momento.
  useEffect(() => {
    if (!isAuthenticated || sessaoInicio === null) return;
    const inicio = sessaoInicio;
    function verificar() {
      const programado = ultimoLogoutProgramado(regraSistema, new Date());
      const vigencia = Math.max(inicio, Date.parse(regraSistema?.dt_vigencia_logout ?? regraSistema?.dt_alteracao ?? "") || 0);
      if (programado && programado.getTime() > vigencia) {
        handleLogout('automatico');
        setLoginWarning("Sua sessão foi encerrada automaticamente.");
      }
    }
    verificar();
    const intervalo = window.setInterval(verificar, 30 * 1000);
    document.addEventListener("visibilitychange", verificar);
    return () => {
      window.clearInterval(intervalo);
      document.removeEventListener("visibilitychange", verificar);
    };
  }, [isAuthenticated, sessaoInicio, regraSistema]);

  /* ── Fechar menu de contexto ao clicar/right-click fora ── */
  useEffect(() => {
    if (!contextMenu) return;
    function handleClose() {
      setContextMenu(null);
    }
    document.addEventListener("click", handleClose);
    document.addEventListener("contextmenu", handleClose);
    return () => {
      document.removeEventListener("click", handleClose);
      document.removeEventListener("contextmenu", handleClose);
    };
  }, [contextMenu]);


  /* ── Abrir formulário para novo registro ── */
  function openNewForm() {
    setForm(emptyForm);
    setEditingId(null);
    setAuditInfo({ createdAt: '', updatedAt: '', createdBy: '', updatedBy: '' });
    setMessage("");
    setNaturalidadeNome('');
    setPfCampoErros([]);
    setView("form");
    setActiveSection("pessoaFisica");
  }

  function openPjNewForm() {
    setPjForm(emptyPjForm);
    setPjEditingId(null);
    setPjAuditInfo({ createdAt: '', updatedAt: '', createdBy: '', updatedBy: '' });
    setMessage("");
    setPjCidadeNome('');
    setPjCampoErros([]);
    setView("form");
    setActiveSection("pessoaFisica");
  }

  function openAdminNewForm() {
    setAdminForm({ ...emptyAdminForm, nr_seq_pessoa_fisica: undefined });
    setAdminEditingId(null);
    setAdminAuditInfo({ createdAt: '', updatedAt: '', createdBy: '', updatedBy: '' });
    setMessage("");
    setAdminCampoErros([]);
    setView("form");
    setActiveSection("administracaoSistema");
  }

  function openPerfilNewForm() {
    setPerfilForm({ ds_perfil: '', ds_observacao: '', ie_status: 'A' });
    setPerfilEditingId(null);
    setPerfilAuditInfo({ createdAt: '', updatedAt: '', createdBy: '', updatedBy: '' });
    setMessage("");
    setPerfilCampoErros([]);
    setView("form");
    setActiveSection("administracaoSistema");
  }

  // Botão "Adicionar" de Usuários: sem a permissão, mostra aviso em vez de abrir o formulário.
  function handleAdminNewForm() {
    if (!permissoesAdmin.adicionarUsuario) {
      setMessage("Você não tem permissão para adicionar.");
      return;
    }
    openAdminNewForm();
  }

  // Botão "Adicionar" de Perfis: sem a permissão, mostra aviso em vez de abrir o formulário.
  function handlePerfilNewForm() {
    if (!permissoesAdmin.adicionarPerfil) {
      setMessage("Você não tem permissão para adicionar.");
      return;
    }
    openPerfilNewForm();
  }

  // Botão "Adicionar" de Pessoas Físicas: sem a permissão, mostra aviso.
  function handlePessoaNewForm() {
    if (!permissoesPessoa.adicionarPessoaFisica) {
      setMessage("Você não tem permissão para adicionar.");
      return;
    }
    openNewForm();
  }

  // Botão "Adicionar" de Pessoas Jurídicas: sem a permissão, mostra aviso.
  function handlePjNewForm() {
    if (!permissoesPessoa.adicionarPessoaJuridica) {
      setMessage("Você não tem permissão para adicionar.");
      return;
    }
    openPjNewForm();
  }

  function openAlunoNewForm() {
    // O campo Data de ingresso já vem preenchido com a data atual (formato DD/MM/AAAA).
    const hoje = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    setAlunoForm({
      ...emptyAlunoForm,
      dt_ingresso: `${pad(hoje.getDate())}/${pad(hoje.getMonth() + 1)}/${hoje.getFullYear()}`,
    });
    setAlunoEditingId(null);
    setAlunoAuditInfo({ createdAt: '', updatedAt: '', createdBy: '', updatedBy: '' });
    setMessage("");
    setAlunoCampoErros([]);
    setView("form");
    setActiveSection("estruturaAcademica");
  }

  // Botão "Adicionar" de Alunos: sem a permissão, mostra aviso.
  function handleAlunoNewForm() {
    if (!permissoesEA.adicionarAluno) {
      setMessage("Você não tem permissão para adicionar.");
      return;
    }
    openAlunoNewForm();
  }

  function openColaboradorNewForm() {
    // Data de admissão já vem preenchida com a data atual (formato DD/MM/AAAA).
    const hoje = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    setColaboradorForm({
      ...emptyColaboradorForm,
      dt_admissao: `${pad(hoje.getDate())}/${pad(hoje.getMonth() + 1)}/${hoje.getFullYear()}`,
    });
    setColaboradorEditingId(null);
    setColaboradorAuditInfo({ createdAt: '', updatedAt: '', createdBy: '', updatedBy: '' });
    setMessage("");
    setColaboradorCampoErros([]);
    setView("form");
    setActiveSection("estruturaAcademica");
  }

  function openPeriodoLetivoNewForm() {
    setPeriodoLetivoForm(emptyPeriodoLetivoForm);
    setPeriodoLetivoEditingId(null);
    setPeriodoLetivoAuditInfo({ createdAt: '', updatedAt: '', createdBy: '', updatedBy: '' });
    setMessage("");
    setPeriodoLetivoCampoErros([]);
    setView("form");
    setActiveSection("estruturaAcademica");
  }

  // Botão "Adicionar" de Período letivo: sem a permissão, mostra aviso.
  function handlePeriodoLetivoNewForm() {
    if (!permissoesEA.adicionarPeriodoLetivo) {
      setMessage("Você não tem permissão para adicionar.");
      return;
    }
    openPeriodoLetivoNewForm();
  }

  // Botão "Adicionar" de Colaboradores: sem a permissão, mostra aviso.
  function handleColaboradorNewForm() {
    if (!permissoesEA.adicionarColaborador) {
      setMessage("Você não tem permissão para adicionar.");
      return;
    }
    openColaboradorNewForm();
  }

  function openAtivoNewForm() {
    setAtivoForm(emptyAtivoForm);
    setAtivoEditingId(null);
    setAtivoAuditInfo({ createdAt: '', updatedAt: '', createdBy: '', updatedBy: '' });
    setMessage("");
    setAtivoCampoErros([]);
    setView("form");
    setActiveSection("patrimonio");
  }

  // Botão "Adicionar" de Ativos: sem a permissão, mostra aviso.
  function handleAtivoNewForm() {
    if (!permissoesPatrimonio.adicionarAtivo) {
      setMessage("Você não tem permissão para adicionar.");
      return;
    }
    openAtivoNewForm();
  }

  // Botão "Adicionar" de Cadastros Gerais: sem a permissão da seção ativa, mostra aviso.
  function handleCgNewForm() {
    if (!permissoesCg[cgKind]?.adicionar) {
      setMessage("Você não tem permissão para adicionar.");
      return;
    }
    openCgNewForm();
  }

  // ── Relatórios ──
  function openRelatorioNewForm() {
    setRelatorioEditingId(null);
    setRelatorioForm(null);
    setRelatorioView('builder');
    setMessage('');
    setRelatorioAuditInfo({ createdAt: '', updatedAt: '', createdBy: '', updatedBy: '' });
  }

  // Botão "Adicionar" de Relatórios: sem a permissão, mostra aviso.
  function handleRelatorioNewForm() {
    if (!permissoesRelatorio.adicionar) {
      setMessage("Você não tem permissão para adicionar.");
      return;
    }
    openRelatorioNewForm();
  }

  // Duplo clique na lista de relatórios abre as bandas: respeita a permissão.
  function handleRelatorioBandasDaLista(relatorio: Relatorio) {
    if (!permissoesRelatorio.bandas) return;
    openRelatorioBandas(relatorio);
  }

  /** Ver: formulário do relatório (Sequência, Descrição, Formato e Saída). */
  function openRelatorioEditForm(relatorio: Relatorio) {
    setRelatorioEditingId(relatorio.id ?? null);
    setRelatorioForm(relatorio);
    setRelatorioView('builder');
    setRelatorioBandasMode(false);
    setMessage('');
    setRelatorioAuditInfo({
      createdAt: relatorio.dt_criacao ?? '',
      updatedAt: relatorio.dt_alteracao ?? '',
      createdBy: relatorio.ds_usuario_criacao ?? '',
      updatedBy: relatorio.ds_usuario_alteracao ?? '',
    });
  }

  /** Duplo clique: abas Bandas e Parâmetros (o construtor carrega e grava cada um). */
  function openRelatorioBandas(relatorio: Relatorio) {
    openRelatorioEditForm(relatorio);
    setRelatorioBandasMode(true);
  }

  function closeRelatorioBuilder() {
    setRelatorioView('list');
    setRelatorioEditingId(null);
    setRelatorioForm(null);
    setRelatorioBandasMode(false);
  }

  async function handleRelatorioSave(data: DadosRelatorioForm) {
    if (relatorioEditingId && bloquearEdicaoSemPermissao(permissoesRelatorio.editar)) return;
    if (relatorioEditingId && relatorioForm?.ie_origem === 'Q') {
      setMessage('Relatório de origem Quasar não pode ser alterado.');
      return;
    }
    setRelatorioSubmitting(true);
    setMessage('');
    try {
      const auditAutor = { usuarioId: currentUser?.id ?? null, usuarioNome: currentUser?.ds_usuario || '' };
      if (!relatorioEditingId) {
        await criarRelatorio(data as unknown as Parameters<typeof criarRelatorio>[0], auditAutor);
        setMessage('Relatório criado com sucesso!');
      } else {
        await atualizarRelatorio(relatorioEditingId, data as unknown as Parameters<typeof atualizarRelatorio>[1], auditAutor);
        setMessage('Relatório atualizado com sucesso!');
      }
      await loadRelatorios();
      closeRelatorioBuilder();
    } catch (err) {
      // Ex.: Código repetido ("Já existe um registro com este valor.").
      setMessage(err instanceof Error && err.message ? `Erro ao salvar relatório: ${err.message}` : 'Erro ao salvar relatório.');
    } finally {
      setRelatorioSubmitting(false);
    }
  }

  async function handleRelatorioDelete(id: string) {
    if (relatorios.find((r) => r.id === id)?.ie_origem === 'Q') {
      setMessage('Relatório de origem Quasar não pode ser excluído.');
      return;
    }
    try {
      // Excluir bandas vinculadas ao relatório na coleção relatorio_banda
      const { obterBandasPorRelatorioId, excluirBanda } = await import('@/services/relatorioServiceBandas');
      // Bandas dependentes antes da banda superior delas (a superior não sai enquanto é referenciada).
      let restantes = await obterBandasPorRelatorioId(id);
      while (restantes.length > 0) {
        const referenciadas = new Set(restantes.map((b) => String(b.nr_seq_banda_superior ?? '')));
        const livres = restantes.filter((b) => !referenciadas.has(String(b.nr_sequencia)));
        const lote = livres.length > 0 ? livres : restantes; // ciclo (não deveria existir): tenta todas
        for (const b of lote) await excluirBanda(b.id);
        if (livres.length === 0) break;
        restantes = restantes.filter((b) => !lote.includes(b));
      }
      // Parâmetros também ficam em coleção própria (relatorio_parametro).
      const relatorioExcluido = relatorios.find((r) => r.id === id);
      if (relatorioExcluido?.nr_sequencia != null) {
        const { excluirParametrosPorRelatorio } = await import('@/services/relatorioServiceParametros');
        await excluirParametrosPorRelatorio(relatorioExcluido.nr_sequencia);
      }
      await excluirRelatorio(id);
      await loadRelatorios();
      setMessage('Relatório excluído com sucesso!');
    } catch {
      setMessage('Erro ao excluir relatório.');
    }
  }

  /**
   * "Gerar relatório": os parâmetros com Perguntar marcado aparecem num modal (na ordem
   * do campo Ordem; empate pela Sequência), já com o Valor padrão. Sem eles, gera direto.
   */
  async function handleRelatorioGerar(relatorio: Relatorio) {
    if (relatorio.nr_sequencia == null) return;
    if (relatorio.ie_status === 'I') {
      setMessage('O relatório está inativo.');
      return;
    }
    try {
      const perguntar = (await obterParametrosSql(relatorio.nr_sequencia)).filter((p) => p.ie_perguntar === 'S' && p.ie_status !== 'I');
      if (perguntar.length > 0) {
        setRelatorioParamValues(Object.fromEntries(perguntar.map((p) => [nomeDoParametro(p.cd_atributo), p.vl_padrao ?? ''])));
        setParamGerarFaltantes([]);
        setRelatorioParamModal({ relatorio, parametros: perguntar });
        return;
      }
      await executarRelatorioGerar(relatorio, {});
    } catch {
      setMessage('Erro ao carregar os parâmetros do relatório.');
    }
  }

  /** Exporta o relatório (com bandas, elementos, parâmetros e formato do papel; sem as imagens) em .xml. */
  async function handleRelatorioExportar(relatorio: Relatorio) {
    if (relatorio.nr_sequencia == null) return;
    setRelatorioGerando(true);
    try {
      await exportarRelatorioXml(relatorio as unknown as Record<string, unknown> & { nr_sequencia: number }, formatosPapel, SYSTEM_VERSION);
      setMessage('Relatório exportado com sucesso!');
    } catch {
      setMessage('Erro ao exportar o relatório.');
    } finally {
      setRelatorioGerando(false);
    }
  }

  /** Ativa ou inativa o relatório (menu de contexto). Inativo, o relatório não é gerado. */
  async function handleRelatorioStatus(relatorio: Relatorio) {
    if (!relatorio.id || relatorio.ie_origem === 'Q') return;
    const novo = relatorio.ie_status === 'I' ? 'A' : 'I';
    try {
      setRelatorioGerando(true);
      await alterarStatusItem('relatorio', relatorio.id, novo);
      setRelatorioForm((atual) => (atual && atual.id === relatorio.id ? { ...atual, ie_status: novo } : atual));
      await loadRelatorios();
      setMessage(novo === 'I' ? 'Relatório inativado com sucesso!' : 'Relatório ativado com sucesso!');
    } catch {
      setMessage(novo === 'I' ? 'Erro ao inativar o relatório.' : 'Erro ao ativar o relatório.');
    } finally {
      setRelatorioGerando(false);
    }
  }

  /** Executa o SQL do relatório no servidor e baixa a planilha (colunas e linhas da consulta). */
  async function executarRelatorioGerar(relatorio: Relatorio, valores: Record<string, string>) {
    setRelatorioGerando(true);
    setMessage('');
    try {
      const nomeArquivo = (relatorio.ds_nome_arquivo ?? '').trim() || relatorio.ds_relatorio || 'relatorio';
      // PDF: folha (formato do papel, orientação, margens, borda) com as bandas e os elementos.
      if (relatorio.ie_formato === 'pdf') {
        const formato = formatosPapel.find((f) => String(f.nr_sequencia) === String(relatorio.nr_seq_formato_papel ?? ''));
        await gerarPdfRelatorio(relatorio, formato, valores, nomeArquivo, imagens, currentUser?.ds_usuario ?? '');
        setMessage('Relatório gerado com sucesso!');
        return;
      }
      const dados = await obterDadosRelatorio(relatorio.nr_sequencia, valores);
      baixarPlanilha(dados, nomeArquivo);
      setMessage(`Relatório gerado com sucesso! ${dados.linhas.length} registro(s).`);
    } catch (err) {
      setMessage(err instanceof Error && err.message ? err.message : 'Erro ao gerar relatório.');
    } finally {
      setRelatorioGerando(false);
    }
  }

  function handleRelatorioParamConfirm() {
    if (!relatorioParamModal) return;
    const faltantes = relatorioParamModal.parametros
      .filter((p) => p.ie_obrigatorio === 'S' && !(relatorioParamValues[nomeDoParametro(p.cd_atributo)] ?? '').trim())
      .map((p) => nomeDoParametro(p.cd_atributo));
    if (faltantes.length > 0) {
      setParamGerarFaltantes(faltantes);
      setMessage('Preencha todos os campos obrigatórios antes de gerar o relatório.');
      return;
    }
    const { relatorio } = relatorioParamModal;
    const valores = { ...relatorioParamValues };
    setParamGerarFaltantes([]);
    setRelatorioParamModal(null);
    setRelatorioParamValues({});
    void executarRelatorioGerar(relatorio, valores);
  }

  async function handleRelatorioDuplicate(relatorio: Relatorio) {
    try {
      if (!relatorio.id) return;
      const auditAutor = { usuarioId: currentUser?.id ?? null, usuarioNome: currentUser?.ds_usuario || '' };
      setRelatorioGerando(true);
      // Copia também bandas, elementos e parâmetros (coleções próprias).
      await duplicarRelatorio(relatorio.id, auditAutor);
      await loadRelatorios();
      setMessage('Relatório duplicado com sucesso!');
    } catch {
      setMessage('Erro ao duplicar relatório.');
    } finally {
      setRelatorioGerando(false);
    }
  }

  // "Ver" do menu de contexto: respeita as permissões da seção ativa.
  function podeVerNoContexto(): boolean {
    if (view !== 'list') return false;
    const s = contextMenu?.section;
    if (!s) return false;
    if (s === 'administracaoSistema') {
      if (adminManageSelection === 'perfis') return permissoesAdmin.verPerfil;
      if (adminManageSelection === 'usuarios') return permissoesAdmin.verUsuario;
      if (adminManageSelection === 'imagens') return permissoesAdmin.verImagem;
      return true;
    }
    if (s === 'pessoaFisica') {
      if (pjManageSelection === 'pessoasJuridicas') return permissoesPessoa.verPessoaJuridica;
      return permissoesPessoa.verPessoaFisica;
    }
    if (s === 'cadastrosGerais') {
      return permissoesCg[cgKind]?.ver ?? true;
    }
    if (s === 'estruturaAcademica') {
      // "Ver" abre um único formulário: não aparece com vários registros selecionados.
      if (alunoManageSelection === 'colaboradores') {
        if (contextMenu?.item && colaboradoresAlvoDoContexto(contextMenu.item as unknown as Colaborador).length > 1) return false;
        return permissoesEA.verColaborador;
      }
      if (alunoManageSelection === 'periodoLetivo') return permissoesEA.verPeriodoLetivo;
      if (alunoManageSelection === 'cursos') return permissoesEA.verCurso;
      if (alunoManageSelection === 'disciplinas') return permissoesEA.verDisciplina;
      if (alunoManageSelection === 'turmas') return permissoesEA.verTurma;
      if (alunoManageSelection === 'turmasDisciplinas') return permissoesEA.verTurmaDisciplina;
      if (contextMenu?.item && alunosAlvoDoContexto(contextMenu.item as Aluno).length > 1) return false;
      return permissoesEA.verAluno;
    }
    if (s === 'patrimonio') {
      if (ativoManageSelection === 'manutencoes') return false; // gerenciado via customItems
      if (ativoManageSelection === 'categoria') return permissoesPatrimonio.verCategoria;
      // "Ver" abre um único formulário: não aparece com vários ativos selecionados.
      if (contextMenu?.item && ativosAlvoDoContexto(contextMenu.item as Ativo).length > 1) return false;
      return permissoesPatrimonio.verAtivo;
    }
    if (s === 'controleCopias') return permissoesCC.verCopia;
    if (s === 'relatorio') return permissoesRelatorio.ver;
    return true;
  }

  // "Excluir" do menu de contexto: respeita as permissões da seção ativa.
  function podeExcluirNoContexto(): boolean {
    if (isProtectedAdminItem) return false;
    const s = contextMenu?.section;
    if (!s) return true;
    if (s === 'administracaoSistema') {
      // Perfil 'Administrador' e usuário 'administrador' não podem ser excluídos por ninguém.
      if (adminManageSelection === 'perfis' && isAdministradorPerfil(contextMenu?.item as Perfil)) return false;
      if (adminManageSelection === 'usuarios' && isAdministradorUsuario(contextMenu?.item as Usuario)) return false;
      if (adminManageSelection === 'perfis') return permissoesAdmin.excluirPerfil;
      if (adminManageSelection === 'usuarios') return permissoesAdmin.excluirUsuario;
      if (adminManageSelection === 'imagens') return permissoesAdmin.excluirImagem;
      return true;
    }
    if (s === 'pessoaFisica') {
      if (pjManageSelection === 'pessoasJuridicas') return permissoesPessoa.excluirPessoaJuridica;
      return permissoesPessoa.excluirPessoaFisica;
    }
    if (s === 'cadastrosGerais') {
      return permissoesCg[cgKind]?.excluir ?? true;
    }
    if (s === 'estruturaAcademica') {
      if (alunoManageSelection === 'colaboradores') return permissoesEA.excluirColaborador;
      if (alunoManageSelection === 'periodoLetivo') return permissoesEA.excluirPeriodoLetivo;
      if (alunoManageSelection === 'cursos') return permissoesEA.excluirCurso;
      if (alunoManageSelection === 'disciplinas') return permissoesEA.excluirDisciplina;
      if (alunoManageSelection === 'turmas') return permissoesEA.excluirTurma;
      if (alunoManageSelection === 'turmasDisciplinas') return permissoesEA.excluirTurmaDisciplina;
      return permissoesEA.excluirAluno;
    }
    if (s === 'patrimonio') {
      if (ativoManageSelection === 'manutencoes') return false; // gerenciado via customItems
      if (ativoManageSelection === 'categoria') return permissoesPatrimonio.excluirCategoria;
      return permissoesPatrimonio.excluirAtivo;
    }
    if (s === 'controleCopias') return permissoesCC.excluirCopia;
    // Relatório Quasar (Origem 'Q'): não pode ser excluído.
    if (s === 'relatorio') return permissoesRelatorio.excluir && (contextMenu?.item as Relatorio | undefined)?.ie_origem !== 'Q';
    return true;
  }

  function openCgNewForm() {
    setCgForm(emptyCgForm);
    setCgEditingId(null);
    setCgAuditInfo({ createdAt: '', updatedAt: '', createdBy: '', updatedBy: '' });
    setMessage("");
    setCgCampoErros([]);
    setView("form");
    setActiveSection("cadastrosGerais");
  }

  function handleAdminManageSelectionChange(value: string) {
    setAdminInteracted(true);
    setAdminManageSelection(value);
    // Ao trocar entre Usuários/Perfis/Campos, zera o formulário em edição
    // para nunca salvar contra a coleção errada.
    setAdminForm(emptyAdminForm);
    setAdminEditingId(null);
    setAdminAuditInfo({ createdAt: '', updatedAt: '', createdBy: '', updatedBy: '' });
    setPerfilForm({ ds_perfil: '', ds_observacao: '', ie_status: 'A' });
    setPerfilEditingId(null);
    setPerfilAuditInfo({ createdAt: '', updatedAt: '', createdBy: '', updatedBy: '' });
    setAdminFilterModalOpen(false);
    setPerfilFilterModalOpen(false);
    setMessage("");
    setView("list");
  }

  // Salva o status de um campo na configuração do perfil (Administração > Campos).
  async function handleCamposStatusChange(perfil: Perfil, chave: string, status: CampoStatus) {
    if (!perfil.id) return;
    // O perfil Administrador não pode ser alterado (só consulta).
    if (isAdministradorPerfil(perfil)) return;
    setMessage("");
    const config = parseCamposConfig(perfil.config_campos);
    config[chave] = status;
    // Registra quando e quem alterou o status do campo (colunas Alteração/Usuário alteração).
    const alteracoes = parseCamposAlteracao(perfil.config_campos_alteracao);
    const agoraCampo = new Date().toISOString();
    const autorCampo = auditAutor?.usuarioNome ?? '-';
    alteracoes[chave] = {
      dt_criacao: alteracoes[chave]?.dt_criacao || agoraCampo,
      ds_usuario_criacao: alteracoes[chave]?.ds_usuario_criacao || autorCampo,
      dt_alteracao: agoraCampo,
      ds_usuario_alteracao: autorCampo,
    };
    setCamposStatusSaving(true);
    try {
      await atualizarPerfil(
        perfil.id,
        { config_campos: serializeCamposConfig(config), config_campos_alteracao: serializeCamposAlteracao(alteracoes) },
        auditAutor
      );
      setMessage(`Campo atualizado com sucesso: ${status === 'O' ? 'Obrigatório' : status === 'D' ? 'Desabilitado' : 'Normal'}`);
      await loadPerfis();
    } catch {
      setMessage("Erro ao salvar configuração do campo.");
    } finally {
      setCamposStatusSaving(false);
    }
  }

  function handleCgManageSelectionChange(value: string) {
    setCgInteracted(true);
    setCgManageSelection(value);
    // Ao trocar a seleção no meio da edição, zera o registro em edição
    // para nunca salvar contra a coleção errada.
    setCgForm(emptyCgForm);
    setCgEditingId(null);
    setCgAuditInfo({ createdAt: '', updatedAt: '', createdBy: '', updatedBy: '' });
  }

  function handlePjManageSelectionChange(value: string) {
    setPjInteracted(true);
    setPfDetalheId(null);
    setPjManageSelection(value);
    // Ao trocar entre Pessoas Físicas/Jurídicas, zera os formulários e
    // retorna à listagem para nunca salvar contra a coleção errada.
    setForm(emptyForm);
    setEditingId(null);
    setAuditInfo({ createdAt: '', updatedAt: '', createdBy: '', updatedBy: '' });
    setPjForm(emptyPjForm);
    setPjEditingId(null);
    setPjAuditInfo({ createdAt: '', updatedAt: '', createdBy: '', updatedBy: '' });
    setFilterModalOpen(false);
    setPjFilterModalOpen(false);
    setMessage("");
    setView("list");
  }

  function handleAlunoManageSelectionChange(value: string) {
    setAlunoInteracted(true);
    setPeriodoLetivoFeriadosId(null);
    setAlunoDetalheId(null);
    setAlunoManageSelection(value);
    // Ao trocar entre Alunos/Colaboradores, zera os formulários em edição
    // para nunca salvar contra a coleção errada.
    setAlunoForm(emptyAlunoForm);
    setAlunoEditingId(null);
    setAlunoAuditInfo({ createdAt: '', updatedAt: '', createdBy: '', updatedBy: '' });
    setAlunoFilterModalOpen(false);
    setColaboradorForm(emptyColaboradorForm);
    setColaboradorEditingId(null);
    setColaboradorAuditInfo({ createdAt: '', updatedAt: '', createdBy: '', updatedBy: '' });
    setPeriodoLetivoForm(emptyPeriodoLetivoForm);
    setPeriodoLetivoEditingId(null);
    setPeriodoLetivoAuditInfo({ createdAt: '', updatedAt: '', createdBy: '', updatedBy: '' });
    setPeriodoLetivoFilterModalOpen(false);
    setCursoForm(emptyCgForm);
    setCursoEditingId(null);
    setCursoFilterModalOpen(false);
    setDisciplinaForm(emptyCgForm);
    setDisciplinaEditingId(null);
    setDisciplinaFilterModalOpen(false);
    setTurmaForm(emptyCgForm);
    setTurmaExtra(TURMA_CAMPOS_VAZIOS);
    setTurmaEditingId(null);
    setTurmaFilterModalOpen(false);
    setTurmaDisciplinaForm(emptyCgForm);
    setTurmaDisciplinaExtra(TURMA_DISCIPLINA_CAMPOS_VAZIOS);
    setTurmaDisciplinaEditingId(null);
    setTurmaDisciplinaFilterModalOpen(false);
    setMessage("");
    setView("list");
  }

  function handlePatrimonioManageSelectionChange(value: string) {
    setAtivoInteracted(true);
    setAtivoDetalheId(null);
    setAtivoManageSelection(value);
    // Ao trocar a seleção no meio da edição, zera o registro em edição
    // para nunca salvar contra a coleção errada.
    setAtivoForm(emptyAtivoForm);
    setAtivoEditingId(null);
    setAtivoAuditInfo({ createdAt: '', updatedAt: '', createdBy: '', updatedBy: '' });
    setCategoriaForm(emptyCgForm);
    setCategoriaEditingId(null);
    setCategoriaFilterModalOpen(false);
    setMessage("");
    setView("list");
  }

  async function openAuditModal(pessoaId?: string | null) {
    if (!pessoaId) return;
    setAuditDocumentType('pessoa_fisica');
    setAuditModalOpen(true);
    setAuditLoading(true);
    try {
      const logs = await fetchAuditByPessoaId(pessoaId);
      setAuditLogs(logs);
    } catch (e) {
      setAuditLogs([]);
    } finally {
      setAuditLoading(false);
    }
  }

  async function openPjAuditModal(pessoaId?: string | null) {
    if (!pessoaId) return;
    setAuditDocumentType('pessoa_juridica');
    setAuditModalOpen(true);
    setAuditLoading(true);
    try {
      const logs = await fetchAuditByDocumentId('pessoa_juridica', pessoaId);
      setAuditLogs(logs);
    } catch (e) {
      setAuditLogs([]);
    } finally {
      setAuditLoading(false);
    }
  }

  async function openAdminAuditModal(usuarioId?: string | null) {
    if (!usuarioId) return;
    setAuditDocumentType('usuario');
    setAuditModalOpen(true);
    setAuditLoading(true);
    try {
      const logs = await fetchAuditByUsuarioId(usuarioId);
      setAuditLogs(logs);
    } catch (e) {
      setAuditLogs([]);
    } finally {
      setAuditLoading(false);
    }
  }

  async function openPerfilAuditModal(perfilId?: string | null) {
    if (!perfilId) return;
    setAuditDocumentType('perfil');
    setAuditModalOpen(true);
    setAuditLoading(true);
    try {
      const logs = await fetchAuditByDocumentId('perfil', perfilId);
      setAuditLogs(logs);
    } catch (e) {
      setAuditLogs([]);
    } finally {
      setAuditLoading(false);
    }
  }

  async function openImagemAuditModal(nr_seq_imagem?: string | null) {
    if (!nr_seq_imagem) return;
    setAuditDocumentType('imagem');
    setAuditModalOpen(true);
    setAuditLoading(true);
    try {
      const logs = await fetchAuditByDocumentId('imagem', nr_seq_imagem);
      setAuditLogs(logs);
    } catch (e) {
      setAuditLogs([]);
    } finally {
      setAuditLoading(false);
    }
  }

  async function openCgAuditModal(cgId?: string | null) {
    if (!cgId) return;
    setAuditDocumentType(cgCollection as 'cg_sexo' | 'cg_estado_civil' | 'cg_cor_raca' | 'cg_profissao' | 'cg_orgao_emissor' | 'cg_logradouro' | 'cg_grau_parentesco' | 'cg_cargo' | 'cg_vinculo_contratual' | 'cg_localizacao' | 'cg_marca' | 'pat_categoria' | 'cg_sistema_operacional' | 'cg_combustivel' | 'cg_modalidade_ensino' | 'cg_formato_papel' | 'cg_tipo_papel');
    setAuditModalOpen(true);
    setAuditLoading(true);
    try {
      const logs = await fetchAuditByDocumentId(cgCollection, cgId);
      setAuditLogs(logs);
    } catch (e) {
      setAuditLogs([]);
    } finally {
      setAuditLoading(false);
    }
  }

  async function openAlunoAuditModal(alunoId?: string | null) {
    if (!alunoId) return;
    setAuditDocumentType('aluno');
    setAuditModalOpen(true);
    setAuditLoading(true);
    try {
      const logs = await fetchAuditByDocumentId('aluno', alunoId);
      setAuditLogs(logs);
    } catch (e) {
      setAuditLogs([]);
    } finally {
      setAuditLoading(false);
    }
  }

  async function openColaboradorAuditModal(colaboradorId?: string | null) {
    if (!colaboradorId) return;
    setAuditDocumentType('colaborador');
    setAuditModalOpen(true);
    setAuditLoading(true);
    try {
      const logs = await fetchAuditByDocumentId('colaborador', colaboradorId);
      setAuditLogs(logs);
    } catch (e) {
      setAuditLogs([]);
    } finally {
      setAuditLoading(false);
    }
  }

  async function openPessoaFisicaAbaAuditModal(colecao: string, id: string) {
    setAuditDocumentType(colecao as typeof auditDocumentType);
    setAuditModalOpen(true);
    setAuditLoading(true);
    try {
      setAuditLogs(await fetchAuditByDocumentId(colecao, id));
    } catch {
      setAuditLogs([]);
    } finally {
      setAuditLoading(false);
    }
  }

  async function openFeriadoAuditModal(feriadoId: string) {
    setAuditDocumentType('periodo_letivo_feriado');
    setAuditModalOpen(true);
    setAuditLoading(true);
    try {
      setAuditLogs(await fetchAuditByDocumentId('periodo_letivo_feriado', feriadoId));
    } catch {
      setAuditLogs([]);
    } finally {
      setAuditLoading(false);
    }
  }

  async function openPeriodoLetivoAuditModal(periodoId?: string | null) {
    if (!periodoId) return;
    setAuditDocumentType('periodo_letivo');
    setAuditModalOpen(true);
    setAuditLoading(true);
    try {
      const logs = await fetchAuditByDocumentId('periodo_letivo', periodoId);
      setAuditLogs(logs);
    } catch (e) {
      setAuditLogs([]);
    } finally {
      setAuditLoading(false);
    }
  }

  async function openAtivoAuditModal(ativoId?: string | null) {
    if (!ativoId) return;
    setAuditDocumentType('pat_ativo');
    setAuditModalOpen(true);
    setAuditLoading(true);
    try {
      const logs = await fetchAuditByDocumentId('pat_ativo', ativoId);
      setAuditLogs(logs);
    } catch (e) {
      setAuditLogs([]);
    } finally {
      setAuditLoading(false);
    }
  }

  async function openAlunoResponsavelAuditModal(responsavelId: string) {
    setAuditDocumentType('aluno_responsavel');
    setAuditModalOpen(true);
    setAuditLoading(true);
    try {
      setAuditLogs(await fetchAuditByDocumentId('aluno_responsavel', responsavelId));
    } catch {
      setAuditLogs([]);
    } finally {
      setAuditLoading(false);
    }
  }

  async function openAtivoResponsavelAuditModal(responsavelId: string) {
    setAuditDocumentType('pat_ativo_responsavel');
    setAuditModalOpen(true);
    setAuditLoading(true);
    try {
      setAuditLogs(await fetchAuditByDocumentId('pat_ativo_responsavel', responsavelId));
    } catch {
      setAuditLogs([]);
    } finally {
      setAuditLoading(false);
    }
  }

  async function openParametroAuditModal(colecao: string) {
    setAuditDocumentType('parametro');
    setAuditModalOpen(true);
    setAuditLoading(true);
    try {
      const paramDoc = await obterParametro(colecao);
      if (paramDoc?.id) {
        const logs = await fetchAuditByDocumentId(colecao, paramDoc.id);
        setAuditLogs(logs);
      } else {
        setAuditLogs([]);
      }
    } catch {
      setAuditLogs([]);
    } finally {
      setAuditLoading(false);
    }
  }

  /** Aviso cujo histórico está aberto: o Detalhe da auditoria mostra só o Conteúdo dele. */
  const [avisoAuditCampo, setAvisoAuditCampo] = useState<CampoAviso>('ds_esqueceu_senha');
  async function openAvisoAuditModal(avisoId: string, campo: CampoAviso) {
    setAuditDocumentType('aviso');
    setAvisoAuditCampo(campo);
    setAuditModalOpen(true);
    setAuditLoading(true);
    try {
      setAuditLogs(filtrarAuditoriaDoAviso(await fetchAuditByDocumentId('aviso', avisoId), campo));
    } catch {
      setAuditLogs([]);
    } finally {
      setAuditLoading(false);
    }
  }

  /** Campos x Formulários/Modais > "Auditoria": histórico do status de um campo no perfil. */
  async function openCampoAuditModal(perfil: Perfil, chave: string, rotulo: string) {
    if (!perfil.id) return;
    setAuditDocumentType('campo');
    setAuditModalOpen(true);
    setAuditLoading(true);
    try {
      setAuditLogs(auditoriaDoCampo(await fetchAuditByDocumentId('perfil', perfil.id), chave, rotulo));
    } catch {
      setAuditLogs([]);
    } finally {
      setAuditLoading(false);
    }
  }

  /** Regra cujo histórico está aberto: o Detalhe da auditoria mostra só os campos dela. */
  const [regraAuditId, setRegraAuditId] = useState<IdRegra>('logout_automatico');
  async function openRegraAuditModal(regraDocId: string, regra: IdRegra) {
    setAuditDocumentType('regra');
    setRegraAuditId(regra);
    setAuditModalOpen(true);
    setAuditLoading(true);
    try {
      setAuditLogs(filtrarAuditoriaDaRegra(await fetchAuditByDocumentId('regra', regraDocId), regra));
    } catch {
      setAuditLogs([]);
    } finally {
      setAuditLoading(false);
    }
  }

  function closeAuditModal() {
    setAuditModalOpen(false);
    setAuditLogs([]);
  }

  function openFilterModal() {
    setFilterModalOpen(true);
  }

  function closeFilterModal() {
    setFilterModalOpen(false);
  }

  function openAtivoFilterModal() {
    setAtivoFilterForm(appliedAtivoFilterForm);
    setAtivoFilterModalOpen(true);
  }

  function closeAtivoFilterModal() {
    setAtivoFilterModalOpen(false);
  }

  function applyAtivoFilter() {
    setAppliedAtivoFilterForm(ativoFilterForm);
    setAtivoFilterModalOpen(false);
  }

  function clearAtivoFilter() {
    setAtivoFilterForm(emptyAtivoFilterForm);
    setAppliedAtivoFilterForm(emptyAtivoFilterForm);
  }

  function openManutencaoFilterModal() {
    setManutencaoFilterForm(appliedManutencaoFilterForm);
    setManutencaoFilterModalOpen(true);
  }

  function closeManutencaoFilterModal() {
    setManutencaoFilterModalOpen(false);
  }

  function applyManutencaoFilter() {
    setAppliedManutencaoFilterForm(manutencaoFilterForm);
    setManutencaoFilterModalOpen(false);
  }

  function clearManutencaoFilter() {
    setManutencaoFilterForm(emptyManutencaoFilterForm);
    setAppliedManutencaoFilterForm(emptyManutencaoFilterForm);
  }

  function openPjFilterModal() {
    setPjFilterForm(appliedPjFilterForm);
    setPjFilterModalOpen(true);
  }

  function closePjFilterModal() {
    setPjFilterModalOpen(false);
  }

  function applyPjFilter() {
    setAppliedPjFilterForm(pjFilterForm);
    setPjFilterModalOpen(false);
  }

  function clearPjFilter() {
    setPjFilterForm(emptyPjFilterForm);
    setAppliedPjFilterForm(emptyPjFilterForm);
  }

  function handlePjFilterSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    applyPjFilter();
  }

  function openAlunoFilterModal() {
    setAlunoFilterForm(appliedAlunoFilterForm);
    setAlunoFilterModalOpen(true);
  }

  function closeAlunoFilterModal() {
    setAlunoFilterModalOpen(false);
  }

  function applyAlunoFilter() {
    setAppliedAlunoFilterForm(alunoFilterForm);
    setAlunoFilterModalOpen(false);
  }

  function clearAlunoFilter() {
    const empty = { nr_sequencia: '', nr_matricula: '', nr_seq_pessoa_fisica: '', dt_ingresso_inicio: '', dt_ingresso_fim: '' };
    setAlunoFilterForm(empty);
    setAppliedAlunoFilterForm(empty);
  }

  function handleAlunoFilterSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    applyAlunoFilter();
  }

  function openColaboradorFilterModal() {
    setColaboradorFilterForm(appliedColaboradorFilterForm);
    setColaboradorFilterModalOpen(true);
  }

  function closeColaboradorFilterModal() {
    setColaboradorFilterModalOpen(false);
  }

  function applyColaboradorFilter() {
    setAppliedColaboradorFilterForm(colaboradorFilterForm);
    setColaboradorFilterModalOpen(false);
  }

  function clearColaboradorFilter() {
    const empty = { nr_sequencia: '', nr_matricula: '', nr_seq_pessoa_fisica: '', nr_seq_pessoa_juridica: '', dt_admissao_inicio: '', dt_admissao_fim: '' };
    setColaboradorFilterForm(empty);
    setAppliedColaboradorFilterForm(empty);
  }

  function handleColaboradorFilterSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    applyColaboradorFilter();
  }

  function openPeriodoLetivoFilterModal() {
    setPeriodoLetivoFilterForm(appliedPeriodoLetivoFilterForm);
    setPeriodoLetivoFilterModalOpen(true);
  }

  function closePeriodoLetivoFilterModal() {
    setPeriodoLetivoFilterModalOpen(false);
  }

  function clearPeriodoLetivoFilter() {
    const empty = { nr_sequencia: '', nr_ano: '', ds_periodo_letivo: '', ie_status: '' };
    setPeriodoLetivoFilterForm(empty);
    setAppliedPeriodoLetivoFilterForm(empty);
  }

  function handlePeriodoLetivoFilterSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAppliedPeriodoLetivoFilterForm(periodoLetivoFilterForm);
    setPeriodoLetivoFilterModalOpen(false);
  }

  function openAdminFilterModal() {
    setAdminFilterForm(appliedAdminFilterForm);
    setAdminFilterModalOpen(true);
  }

  function closeAdminFilterModal() {
    setAdminFilterModalOpen(false);
  }

  function openPerfilFilterModal() {
    setPerfilFilterForm(appliedPerfilFilterForm);
    setPerfilFilterModalOpen(true);
  }

  function closePerfilFilterModal() {
    setPerfilFilterModalOpen(false);
  }

  function applyPerfilFilter() {
    setAppliedPerfilFilterForm({ ...perfilFilterForm, ie_status: perfilFilterForm.ie_status || 'T' });
    setPerfilFilterModalOpen(false);
  }

  function clearPerfilFilter() {
    setPerfilFilterForm({ nr_sequencia: '', ds_perfil: '', ie_status: 'T' });
    setAppliedPerfilFilterForm({ nr_sequencia: '', ds_perfil: '', ie_status: 'T' });
  }

  function handlePerfilFilterSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    applyPerfilFilter();
  }

  function openCgFilterModal() {
    setCgFilterForm(appliedCgFilterForm);
    setCgFilterModalOpen(true);
  }

  function closeCgFilterModal() {
    setCgFilterModalOpen(false);
  }

  function applyCgFilter() {
    setAppliedCgFilterForm({ ...cgFilterForm, ie_status: cgFilterForm.ie_status || 'T' });
    setCgFilterModalOpen(false);
  }

  function clearCgFilter() {
    setCgFilterForm({ nr_sequencia: '', descricao: '', ie_status: 'T' });
    setAppliedCgFilterForm({ nr_sequencia: '', descricao: '', ie_status: 'T' });
  }

  function handleCgFilterSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    applyCgFilter();
  }

  function openAdminPessoaFisicaLookup() {
    const salvo = filtroSalvoDoLookup('pessoa_fisica', { ds_nome: '', nr_sequencia: '', nr_cpf: '' });
    setAdminPessoaFisicaLookupForm(salvo ?? { ds_nome: '', nr_sequencia: '', nr_cpf: '' });
    setAdminPessoaFisicaLookupFilter(salvo ?? { ds_nome: '', nr_sequencia: '', nr_cpf: '' });
    setAdminPessoaFisicaLookupApplied(!!salvo);
    setAdminPessoaFisicaLookupOpen(true);
  }

  function closeAdminPessoaFisicaLookup() {
    setAdminPessoaFisicaLookupOpen(false);
  }

  function applyAdminPessoaFisicaLookupFilter() {
    setAdminPessoaFisicaLookupFilter(adminPessoaFisicaLookupForm);
    setAdminPessoaFisicaLookupApplied(true);
  }

  function clearAdminPessoaFisicaLookupFilter() {
    setAdminPessoaFisicaLookupForm({ ds_nome: '', nr_sequencia: '', nr_cpf: '' });
    setAdminPessoaFisicaLookupFilter({ ds_nome: '', nr_sequencia: '', nr_cpf: '' });
    setAdminPessoaFisicaLookupApplied(false);
  }

  function handleAdminPessoaFisicaSelect(pessoa: PessoaFisica) {
    setAdminFilterForm({ ...adminFilterForm, nr_seq_pessoa_fisica: String(pessoa.nr_sequencia) });
    closeAdminPessoaFisicaLookup();
  }

  function applyAdminFilter() {
    setAppliedAdminFilterForm({ ...adminFilterForm, ie_status: adminFilterForm.ie_status || 'T' });
    setAdminFilterModalOpen(false);
  }

  function clearAdminFilter() {
    setAdminFilterForm(emptyAdminFilterForm);
    setAppliedAdminFilterForm(emptyAdminFilterForm);
  }

  function handleAdminFilterSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    applyAdminFilter();
  }

  /* ── "Salvar e adicionar" (rodapé dos formulários) ── */
  /** Formulário novo a abrir quando o salvamento em andamento terminar com sucesso. */
  const salvarEAdicionarRef = useRef<(() => void) | null>(null);
  /**
   * Chamado no caminho de sucesso dos handlers de salvar (depois de voltar para a lista):
   * se o salvamento veio do "Salvar e adicionar", abre o formulário de um registro novo.
   * O formulário novo limpa a mensagem; a de sucesso ("Cadastrado com sucesso!"...) é
   * mantida, a menos que ele mostre outra (ex.: sem permissão para adicionar).
   */
  function abrirNovoAposSalvar() {
    const novo = salvarEAdicionarRef.current;
    if (!novo) return;
    salvarEAdicionarRef.current = null;
    const mensagem = ultimaMensagemRef.current;
    novo();
    if (mensagem && ultimaMensagemRef.current === "") setMessage(mensagem);
  }
  /** Salva pelo mesmo handler do "Salvar" e, se der certo, abre o formulário novo. */
  async function salvarEAdicionar(salvar: (event: React.FormEvent<HTMLFormElement>) => unknown, novo: () => void) {
    salvarEAdicionarRef.current = novo;
    try {
      await salvar(EVENTO_SUBMIT);
    } finally {
      salvarEAdicionarRef.current = null;
    }
  }


  /* ── "Salvar filtro" (rodapé dos modais de filtro) ── */
  /**
   * Grava, para o usuário logado, os campos do filtro da tela (tabela usuario_filtro, via
   * preferências: config_filtro_<tela>) e aplica o filtro como o botão "Filtrar".
   * Enquanto grava, mostra o modal "Carregando...". Devolve true se gravou.
   */
  async function salvarFiltroDaTela(tela: string, dados: Record<string, unknown>, aplicar: () => void): Promise<boolean> {
    if (!currentUser?.id) return false;
    const chave = `config_filtro_${tela}` as const;
    const json = JSON.stringify(dados);
    setSalvandoFiltro(true);
    try {
      await atualizarPreferenciasUsuario(currentUser.id, { [chave]: json });
      setCurrentUser((u) => (u ? { ...u, [chave]: json } : u));
      aplicar();
      setMessage("Filtro salvo com sucesso!");
      return true;
    } catch {
      setMessage("Erro ao salvar o filtro.");
      return false;
    } finally {
      setSalvandoFiltro(false);
    }
  }

  /* ── "Salvar filtro" dos lookups (janelas de localizar) ── */
  /**
   * Filtro salvo do lookup (usuario_filtro, ie_tela lookup_<id>): os campos salvos que o
   * filtro do lookup conhece, sobre o filtro vazio. null se não houver filtro salvo.
   * Ao abrir o lookup, o filtro salvo já vem preenchido e aplicado.
   */
  function filtroSalvoDoLookup<T extends Record<string, string>>(lookup: string, vazio: T): T | null {
    const campos = camposDoFiltroSalvoDoLookup(lookup);
    return campos ? { ...vazio, ...Object.fromEntries(Object.entries(campos).filter(([k]) => k in vazio)) } : null;
  }
  /** Todos os campos (texto) do filtro salvo do lookup; null se não houver. */
  function camposDoFiltroSalvoDoLookup(lookup: string): Record<string, string> | null {
    const texto = currentUser?.[`config_filtro_lookup_${lookup}` as const];
    if (!texto) return null;
    try {
      const form = (JSON.parse(texto) as { form?: unknown } | null)?.form;
      if (!form || typeof form !== 'object') return null;
      return Object.fromEntries(Object.entries(form).filter(([, v]) => typeof v === 'string')) as Record<string, string>;
    } catch {
      return null;
    }
  }
  /** Grava o filtro do lookup para o usuário e o aplica (como o "Filtrar"). */
  function salvarFiltroDoLookup(lookup: string, form: Record<string, string>, aplicar: () => void) {
    void salvarFiltroDaTela(`lookup_${lookup}`, { form }, aplicar);
  }
  /** Props de "Salvar filtro" do ReferenciaLookupModal (lookup_<colecao>). */
  function filtroDoReferenciaLookup(lookup: string) {
    return {
      filtroSalvo: camposDoFiltroSalvoDoLookup(lookup),
      onSalvarFiltro: (form: Record<string, string>, aplicar: () => void) => salvarFiltroDoLookup(lookup, form, aplicar),
    };
  }

  /**
   * Ao entrar (login ou sessão restaurada), aplica os filtros salvos de cada tela. Só os
   * campos que o filtro da tela conhece entram (filtros salvos antes de uma mudança na
   * tela não quebram nada); o restante fica como está.
   */
  function restaurarFiltrosSalvos(usuario: Usuario) {
    const salvo = (tela: string): { form?: Record<string, unknown>; extra?: Record<string, unknown> } | null => {
      const texto = usuario[`config_filtro_${tela}`];
      if (!texto) return null;
      try {
        const obj = JSON.parse(texto);
        return obj && typeof obj === 'object' ? obj : null;
      } catch {
        return null;
      }
    };
    /** Aplica os campos salvos (texto) que existem no filtro, no aplicado e no formulário do filtro. */
    function restaurar<T extends object>(
      campos: Record<string, unknown> | undefined,
      setAplicado: React.Dispatch<React.SetStateAction<T>>,
      setRascunho: React.Dispatch<React.SetStateAction<T>>,
    ) {
      if (!campos) return;
      const mesclar = (f: T): T => ({
        ...f,
        ...Object.fromEntries(Object.entries(campos).filter(([k, v]) => k in f && typeof v === 'string')),
      });
      setAplicado(mesclar);
      setRascunho(mesclar);
    }
    restaurar(salvo('pessoa_fisica')?.form, setAppliedFilterForm, setFilterForm);
    restaurar(salvo('pessoa_juridica')?.form, setAppliedPjFilterForm, setPjFilterForm);
    restaurar(salvo('as_usuario')?.form, setAppliedAdminFilterForm, setAdminFilterForm);
    restaurar(salvo('as_perfil')?.form, setAppliedPerfilFilterForm, setPerfilFilterForm);
    restaurar(salvo('cadastros_gerais')?.form, setAppliedCgFilterForm, setCgFilterForm);
    restaurar(salvo('pat_categoria')?.form, setAppliedCategoriaFilterForm, setCategoriaFilterForm);
    restaurar(salvo('pat_ativo')?.form, setAppliedAtivoFilterForm, setAtivoFilterForm);
    restaurar(salvo('pat_manutencao')?.form, setAppliedManutencaoFilterForm, setManutencaoFilterForm);
    restaurar(salvo('curso')?.form, setAppliedCursoFilterForm, setCursoFilterForm);
    restaurar(salvo('disciplina')?.form, setAppliedDisciplinaFilterForm, setDisciplinaFilterForm);
    restaurar(salvo('turma')?.form, setAppliedTurmaFilterForm, setTurmaFilterForm);
    restaurar(salvo('turma')?.extra, setTurmaFiltroExtraAplicado, setTurmaFiltroExtra);
    restaurar(salvo('turma_disciplina')?.form, setAppliedTurmaDisciplinaFilterForm, setTurmaDisciplinaFilterForm);
    restaurar(salvo('turma_disciplina')?.extra, setTurmaDisciplinaFiltroExtraAplicado, setTurmaDisciplinaFiltroExtra);
    restaurar(salvo('periodo_letivo')?.form, setAppliedPeriodoLetivoFilterForm, setPeriodoLetivoFilterForm);
    restaurar(salvo('aluno')?.form, setAppliedAlunoFilterForm, setAlunoFilterForm);
    restaurar(salvo('colaborador')?.form, setAppliedColaboradorFilterForm, setColaboradorFilterForm);
    restaurar(salvo('copia')?.form, setAppliedCopiaFilterForm, setCopiaFilterForm);
    restaurar(salvo('copia')?.extra, setCopiaFiltroExtraAplicado, setCopiaFiltroExtra);
    restaurar(salvo('relatorio')?.form, setAppliedRelatorioFilterForm, setRelatorioFilterForm);
    restaurar(salvo('relatorio')?.extra, setRelatorioFiltroExtraAplicado, setRelatorioFiltroExtra);
    const acessos = salvo('logs_acessos')?.form;
    if (acessos) setAcessosFiltro(normalizarFiltroAcessos(acessos as Partial<FiltroAcessos>));
  }

  function applyFilter() {
    setAppliedFilterForm(filterForm);
    setFilterModalOpen(false);
  }

  function clearFilter() {
    setFilterForm(emptyFilterForm);
    setAppliedFilterForm(emptyFilterForm);
  }

  function handleFilterSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    applyFilter();
  }

  function handleSortChange(logicalIndex: number) {
    if (sortColumn === logicalIndex) {
      if (sortAsc) {
        setSortAsc(false);
      } else {
        setSortColumn(null);
        setSortAsc(null);
      }
    } else {
      setSortColumn(logicalIndex);
      setSortAsc(true);
    }
  }

  function handleAdminSortChange(logicalIndex: number) {
    if (adminSortColumn === logicalIndex) {
      if (adminSortAsc) {
        setAdminSortAsc(false);
      } else {
        setAdminSortColumn(null);
        setAdminSortAsc(null);
      }
    } else {
      setAdminSortColumn(logicalIndex);
      setAdminSortAsc(true);
    }
  }

  function handlePerfilSortChange(logicalIndex: number) {
    if (perfilSortColumn === logicalIndex) {
      if (perfilSortAsc) {
        setPerfilSortAsc(false);
      } else {
        setPerfilSortColumn(null);
        setPerfilSortAsc(null);
      }
    } else {
      setPerfilSortColumn(logicalIndex);
      setPerfilSortAsc(true);
    }
  }

  function handleCgSortChange(logicalIndex: number) {
    if (cgSortColumn === logicalIndex) {
      if (cgSortAsc) {
        setCgSortAsc(false);
      } else {
        setCgSortColumn(null);
        setCgSortAsc(null);
      }
    } else {
      setCgSortColumn(logicalIndex);
      setCgSortAsc(true);
    }
  }

  function handlePjSortChange(logicalIndex: number) {
    if (pjSortColumn === logicalIndex) {
      if (pjSortAsc) {
        setPjSortAsc(false);
      } else {
        setPjSortColumn(null);
        setPjSortAsc(null);
      }
    } else {
      setPjSortColumn(logicalIndex);
      setPjSortAsc(true);
    }
  }

  function handleAlunoSortChange(logicalIndex: number) {
    if (alunoSortColumn === logicalIndex) {
      if (alunoSortAsc) {
        setAlunoSortAsc(false);
      } else {
        setAlunoSortColumn(null);
        setAlunoSortAsc(null);
      }
    } else {
      setAlunoSortColumn(logicalIndex);
      setAlunoSortAsc(true);
    }
  }

  function handleColaboradorSortChange(logicalIndex: number) {
    if (colaboradorSortColumn === logicalIndex) {
      if (colaboradorSortAsc) {
        setColaboradorSortAsc(false);
      } else {
        setColaboradorSortColumn(null);
        setColaboradorSortAsc(null);
      }
    } else {
      setColaboradorSortColumn(logicalIndex);
      setColaboradorSortAsc(true);
    }
  }

  function handlePeriodoLetivoSortChange(logicalIndex: number) {
    if (periodoLetivoSortColumn === logicalIndex) {
      if (periodoLetivoSortAsc) {
        setPeriodoLetivoSortAsc(false);
      } else {
        setPeriodoLetivoSortColumn(null);
        setPeriodoLetivoSortAsc(null);
      }
    } else {
      setPeriodoLetivoSortColumn(logicalIndex);
      setPeriodoLetivoSortAsc(true);
    }
  }

  function handleAtivoSortChange(logicalIndex: number) {
    if (ativoSortColumn === logicalIndex) {
      if (ativoSortAsc) {
        setAtivoSortAsc(false);
      } else {
        setAtivoSortColumn(null);
        setAtivoSortAsc(null);
      }
    } else {
      setAtivoSortColumn(logicalIndex);
      setAtivoSortAsc(true);
    }
  }

  /* ── Carregar autor da auditoria (para o rodapé do formulário) ── */
  async function carregarAutorAuditoriaPessoa(id: string) {
    try {
      const logs = await fetchAuditByPessoaId(id);
      if (auditPessoaIdRef.current !== id) return;
      const createLog = logs.find((l) => String(l.acao ?? '').toLowerCase() === 'create');
      const lastChangeLog = logs.find((l) => {
        const acao = String(l.acao ?? '').toLowerCase();
        return acao === 'update' || acao === 'password';
      });
      setAuditInfo((prev) => ({
        ...prev,
        createdBy: createLog?.usuarioNome ?? prev.createdBy,
        updatedBy: lastChangeLog?.usuarioNome ?? prev.updatedBy,
      }));
    } catch {
      // mantém vazio em caso de falha
    }
  }

  async function carregarAutorAuditoriaPessoaJuridica(id: string) {
    try {
      const logs = await fetchAuditByDocumentId('pessoa_juridica', id);
      if (auditPjIdRef.current !== id) return;
      const createLog = logs.find((l) => String(l.acao ?? '').toLowerCase() === 'create');
      const lastChangeLog = logs.find((l) => {
        const acao = String(l.acao ?? '').toLowerCase();
        return acao === 'update' || acao === 'password';
      });
      setPjAuditInfo((prev) => ({
        ...prev,
        createdBy: createLog?.usuarioNome ?? prev.createdBy,
        updatedBy: lastChangeLog?.usuarioNome ?? prev.updatedBy,
      }));
    } catch {
      // mantém vazio em caso de falha
    }
  }

  async function carregarAutorAuditoriaPerfil(id: string) {
    try {
      const logs = await fetchAuditByDocumentId('perfil', id);
      if (auditPerfilIdRef.current !== id) return;
      const createLog = logs.find((l) => String(l.acao ?? '').toLowerCase() === 'create');
      const lastChangeLog = logs.find((l) => {
        const acao = String(l.acao ?? '').toLowerCase();
        return acao === 'update';
      });
      setPerfilAuditInfo((prev) => ({
        ...prev,
        createdBy: createLog?.usuarioNome ?? prev.createdBy,
        updatedBy: lastChangeLog?.usuarioNome ?? prev.updatedBy,
      }));
    } catch {
      // mantém vazio em caso de falha
    }
  }

  async function carregarAutorAuditoriaUsuario(id: string) {
    try {
      const logs = await fetchAuditByUsuarioId(id);
      if (auditUsuarioIdRef.current !== id) return;
      const createLog = logs.find((l) => String(l.acao ?? '').toLowerCase() === 'create');
      const lastChangeLog = logs.find((l) => {
        const acao = String(l.acao ?? '').toLowerCase();
        return acao === 'update' || acao === 'password';
      });
      setAdminAuditInfo((prev) => ({
        ...prev,
        createdBy: createLog?.usuarioNome ?? prev.createdBy,
        updatedBy: lastChangeLog?.usuarioNome ?? prev.updatedBy,
      }));
    } catch {
      // mantém vazio em caso de falha
    }
  }

  async function carregarAutorAuditoriaCg(id: string) {
    try {
      const logs = await fetchAuditByDocumentId(cgCollection, id);
      if (auditCgIdRef.current !== id) return;
      const createLog = logs.find((l) => String(l.acao ?? '').toLowerCase() === 'create');
      const lastChangeLog = logs.find((l) => {
        const acao = String(l.acao ?? '').toLowerCase();
        return acao === 'update' || acao === 'password';
      });
      setCgAuditInfo((prev) => ({
        ...prev,
        createdBy: createLog?.usuarioNome ?? prev.createdBy,
        updatedBy: lastChangeLog?.usuarioNome ?? prev.updatedBy,
      }));
    } catch {
      // mantém vazio em caso de falha
    }
  }

  async function carregarAutorAuditoriaAluno(id: string) {
    try {
      const logs = await fetchAuditByDocumentId('aluno', id);
      if (auditAlunoIdRef.current !== id) return;
      const createLog = logs.find((l) => String(l.acao ?? '').toLowerCase() === 'create');
      const lastChangeLog = logs.find((l) => {
        const acao = String(l.acao ?? '').toLowerCase();
        return acao === 'update' || acao === 'password';
      });
      setAlunoAuditInfo((prev) => ({
        ...prev,
        createdBy: createLog?.usuarioNome ?? prev.createdBy,
        updatedBy: lastChangeLog?.usuarioNome ?? prev.updatedBy,
      }));
    } catch {
      // mantém vazio em caso de falha
    }
  }

  async function carregarAutorAuditoriaAtivo(id: string) {
    try {
      const logs = await fetchAuditByDocumentId('pat_ativo', id);
      if (auditAtivoIdRef.current !== id) return;
      const createLog = logs.find((l) => String(l.acao ?? '').toLowerCase() === 'create');
      const lastChangeLog = logs.find((l) => {
        const acao = String(l.acao ?? '').toLowerCase();
        return acao === 'update' || acao === 'password';
      });
      setAtivoAuditInfo((prev) => ({
        ...prev,
        createdBy: createLog?.usuarioNome ?? prev.createdBy,
        updatedBy: lastChangeLog?.usuarioNome ?? prev.updatedBy,
      }));
    } catch {
      // mantém vazio em caso de falha
    }
  }

  /* ── Abrir formulário para editar ── */
  function openEditForm(pessoa: PessoaFisica) {
    setForm({
      ds_nome: pessoa.ds_nome,
      nr_cpf: pessoa.nr_cpf,
      dt_nascimento: pessoa.dt_nascimento,
      ds_email: pessoa.ds_email,
      nr_telefone: pessoa.nr_telefone,
      nr_seq_sexo: pessoa.nr_seq_sexo,
      nr_seq_estado_civil: pessoa.nr_seq_estado_civil,
      nr_seq_cor_raca: pessoa.nr_seq_cor_raca,
      nr_seq_profissao: pessoa.nr_seq_profissao,
      nr_rg: pessoa.nr_rg ?? '',
      dt_emissao: pessoa.dt_emissao ?? '',
      nr_seq_orgao_emissor: pessoa.nr_seq_orgao_emissor,
      sg_estado: pessoa.sg_estado ?? '',
      cd_ibge_naturalidade: pessoa.cd_ibge_naturalidade ?? '',
      nr_cep: pessoa.nr_cep ?? '',
      ds_endereco: pessoa.ds_endereco ?? '',
      nr_endereco: pessoa.nr_endereco ?? '',
      ds_bairro: pessoa.ds_bairro ?? '',
      ds_complemento: pessoa.ds_complemento ?? '',
      nr_seq_logradouro: pessoa.nr_seq_logradouro,
      ds_tipo_sanguineo: pessoa.ds_tipo_sanguineo ?? '',
      ds_alergia: Array.isArray(pessoa.ds_alergia) ? [...pessoa.ds_alergia] : [],
      ds_medicamento_continuo: Array.isArray(pessoa.ds_medicamento_continuo) ? [...pessoa.ds_medicamento_continuo] : [],
      ds_restricao_alimentar: Array.isArray(pessoa.ds_restricao_alimentar) ? [...pessoa.ds_restricao_alimentar] : [],
      ds_necessidade_especial: Array.isArray(pessoa.ds_necessidade_especial) ? [...pessoa.ds_necessidade_especial] : [],
      ds_observacao_medica: pessoa.ds_observacao_medica ?? '',
    });
    // Resolve o nome da cidade a partir do código IBGE salvo
    const codigo = pessoa.cd_ibge_naturalidade ?? '';
    naturalidadeCodeRef.current = codigo;
    setNaturalidadeNome('');
    if (codigo) {
      cidadePorCodigo(codigo)
        .then((cidade) => {
          if (naturalidadeCodeRef.current === codigo) {
            setNaturalidadeNome(cidade ? `${cidade.nome} - ${cidade.uf}` : '');
          }
        })
        .catch(() => {
          if (naturalidadeCodeRef.current === codigo) setNaturalidadeNome('');
        });
    }
    setEditingId(pessoa.id ?? null);
    setAuditInfo({
      createdAt: pessoa.dt_criacao ?? '',
      updatedAt: pessoa.dt_alteracao ?? '',
      createdBy: pessoa.ds_usuario_criacao ?? '',
      updatedBy: pessoa.ds_usuario_alteracao ?? '',
    });
    auditPessoaIdRef.current = pessoa.id ?? null;
    setMessage("");
    setPfCampoErros([]);
    setView("form");
    setActiveSection("pessoaFisica");
    if (pessoa.id) {
      carregarAutorAuditoriaPessoa(pessoa.id);
    }
  }

  function openPjEditForm(pessoa: PessoaJuridica) {
    setPjForm({
      ds_razao_social: pessoa.ds_razao_social,
      ds_nome_fantasia: pessoa.ds_nome_fantasia,
      nr_cnpj: pessoa.nr_cnpj,
      nr_inscricao_estadual: pessoa.nr_inscricao_estadual,
      nr_inscricao_municipal: pessoa.nr_inscricao_municipal,
      dt_abertura: pessoa.dt_abertura,
      nr_telefone: pessoa.nr_telefone,
      ds_email: pessoa.ds_email,
      nr_cep: pessoa.nr_cep ?? '',
      ds_endereco: pessoa.ds_endereco ?? '',
      nr_endereco: pessoa.nr_endereco ?? '',
      ds_bairro: pessoa.ds_bairro ?? '',
      ds_complemento: pessoa.ds_complemento ?? '',
      nr_seq_logradouro: pessoa.nr_seq_logradouro,
      sg_estado: pessoa.sg_estado ?? '',
      cd_ibge_cidade: pessoa.cd_ibge_cidade ?? '',
    });
    // Resolve o nome da cidade a partir do código IBGE salvo
    const codigo = pessoa.cd_ibge_cidade ?? '';
    pjCidadeCodeRef.current = codigo;
    setPjCidadeNome('');
    if (codigo) {
      cidadePorCodigo(codigo)
        .then((cidade) => {
          if (pjCidadeCodeRef.current === codigo) {
            setPjCidadeNome(cidade ? `${cidade.nome} - ${cidade.uf}` : '');
          }
        })
        .catch(() => {
          if (pjCidadeCodeRef.current === codigo) setPjCidadeNome('');
        });
    }
    setPjEditingId(pessoa.id ?? null);
    setPjAuditInfo({
      createdAt: pessoa.dt_criacao ?? '',
      updatedAt: pessoa.dt_alteracao ?? '',
      createdBy: pessoa.ds_usuario_criacao ?? '',
      updatedBy: pessoa.ds_usuario_alteracao ?? '',
    });
    auditPjIdRef.current = pessoa.id ?? null;
    setMessage("");
    setPjCampoErros([]);
    setView("form");
    setActiveSection("pessoaFisica");
    if (pessoa.id) {
      carregarAutorAuditoriaPessoaJuridica(pessoa.id);
    }
  }

  function openAlunoEditForm(aluno: Aluno) {
    setAlunoForm({
      nr_seq_pessoa_fisica: aluno.nr_seq_pessoa_fisica,
      nr_matricula: aluno.nr_matricula ?? '',
      dt_ingresso: aluno.dt_ingresso ?? '',
      dt_status: aluno.dt_status ?? '',
      ds_status: aluno.ds_status ?? '',
      ie_status: aluno.ie_status ?? 'A',
    });
    setAlunoEditingId(aluno.id ?? null);
    setAlunoAuditInfo({
      createdAt: aluno.dt_criacao ?? '',
      updatedAt: aluno.dt_alteracao ?? '',
      createdBy: aluno.ds_usuario_criacao ?? '',
      updatedBy: aluno.ds_usuario_alteracao ?? '',
    });
    auditAlunoIdRef.current = aluno.id ?? null;
    setMessage("");
    setAlunoCampoErros([]);
    setView("form");
    setActiveSection("estruturaAcademica");
    if (aluno.id) {
      carregarAutorAuditoriaAluno(aluno.id);
    }
  }

  function openColaboradorEditForm(colaborador: Colaborador) {
    setColaboradorForm({
      nr_seq_pessoa_fisica: colaborador.nr_seq_pessoa_fisica,
      nr_seq_pessoa_juridica: colaborador.nr_seq_pessoa_juridica,
      nr_seq_vinculo_contratual: colaborador.nr_seq_vinculo_contratual,
      nr_seq_cargo: colaborador.nr_seq_cargo,
      ie_coordenador: colaborador.ie_coordenador ?? 'N',
      ie_professor: colaborador.ie_professor ?? 'N',
      ie_fornecedor: colaborador.ie_fornecedor ?? 'N',
      ie_prestador_servico: colaborador.ie_prestador_servico ?? 'N',
      nr_matricula: colaborador.nr_matricula ?? '',
      dt_admissao: colaborador.dt_admissao ?? '',
      dt_status: colaborador.dt_status ?? '',
      ds_motivo_status: colaborador.ds_motivo_status ?? '',
      ie_status: colaborador.ie_status ?? 'A',
    });
    setColaboradorEditingId(colaborador.id ?? null);
    setColaboradorAuditInfo({
      createdAt: colaborador.dt_criacao ?? '',
      updatedAt: colaborador.dt_alteracao ?? '',
      createdBy: colaborador.ds_usuario_criacao ?? '',
      updatedBy: colaborador.ds_usuario_alteracao ?? '',
    });
    auditColaboradorIdRef.current = colaborador.id ?? null;
    setMessage("");
    setColaboradorCampoErros([]);
    setView("form");
    setActiveSection("estruturaAcademica");
  }

  function openAtivoEditForm(ativo: Ativo) {
    setAtivoForm({
      cd_externo: ativo.cd_externo ?? '',
      ds_ativo: ativo.ds_ativo ?? '',
      nr_seq_categoria: ativo.nr_seq_categoria,
      nr_seq_localizacao: ativo.nr_seq_localizacao,
      nr_seq_marca: ativo.nr_seq_marca,
      nr_seq_fornecedor: ativo.nr_seq_fornecedor,
      ds_modelo: ativo.ds_modelo ?? '',
      nr_serie: ativo.nr_serie ?? '',
      ds_qr_code: ativo.ds_qr_code ?? '',
      ds_codigo_barras: ativo.ds_codigo_barras ?? '',
      ie_status: ativo.ie_status ?? 'O',
      dt_ultima_manutencao: ativo.dt_ultima_manutencao ?? '',
      nr_seq_ultima_manutencao: ativo.nr_seq_ultima_manutencao,
      dt_status: ativo.dt_status ?? '',
      ds_motivo_status: ativo.ds_motivo_status ?? '',
      vl_aquisicao: ativo.vl_aquisicao ?? '',
      dt_aquisicao: ativo.dt_aquisicao ?? '',
      dt_garantia: ativo.dt_garantia ?? '',
      ds_processador: ativo.ds_processador ?? '',
      qt_ram: ativo.qt_ram,
      ie_ram: ativo.ie_ram ?? '',
      qt_armazenamento: ativo.qt_armazenamento,
      ie_armazenamento: ativo.ie_armazenamento ?? '',
      ds_endereco_mac: ativo.ds_endereco_mac ?? '',
      ds_ip: ativo.ds_ip ?? '',
      nr_seq_sistema_operacional: ativo.nr_seq_sistema_operacional,
      cd_placa: ativo.cd_placa ?? '',
      cd_renavam: ativo.cd_renavam ?? '',
      nr_ano: ativo.nr_ano,
      ds_cor: ativo.ds_cor ?? '',
      nr_seq_combustivel: ativo.nr_seq_combustivel,
      ds_observacao: ativo.ds_observacao ?? '',
    });
    setAtivoEditingId(ativo.id ?? null);
    setAtivoAuditInfo({
      createdAt: ativo.dt_criacao ?? '',
      updatedAt: ativo.dt_alteracao ?? '',
      createdBy: ativo.ds_usuario_criacao ?? '',
      updatedBy: ativo.ds_usuario_alteracao ?? '',
    });
    auditAtivoIdRef.current = ativo.id ?? null;
    setMessage("");
    setAtivoCampoErros([]);
    setView("form");
    setActiveSection("patrimonio");
    if (ativo.id) {
      carregarAutorAuditoriaAtivo(ativo.id);
    }
  }

  function openPerfilEditForm(perfil: Perfil) {
    // Outros usuários também abrem o perfil Administrador, mas só para ver
    // (PerfilFormView readOnly; handlePerfilSubmit bloqueia a gravação).
    setPerfilForm({
      ds_perfil: perfil.ds_perfil,
      ds_observacao: perfil.ds_observacao,
      ie_status: perfil.ie_status ?? 'A',
    });
    setPerfilEditingId(perfil.id ?? null);
    setPerfilAuditInfo({
      createdAt: perfil.dt_criacao ?? '',
      updatedAt: perfil.dt_alteracao ?? '',
      createdBy: perfil.ds_usuario_criacao ?? '',
      updatedBy: perfil.ds_usuario_alteracao ?? '',
    });
    auditPerfilIdRef.current = perfil.id ?? null;
    setMessage("");
    setPerfilCampoErros([]);
    setView("form");
    setActiveSection("administracaoSistema");
    if (perfil.id) {
      carregarAutorAuditoriaPerfil(perfil.id);
    }
  }

  function openAdminEditForm(usuario: Usuario) {
    setAdminForm({
      ds_usuario: usuario.ds_usuario,
      ds_usuario_alternativo: usuario.ds_usuario_alternativo,
      ds_email: usuario.ds_email ?? '',
      ds_senha: "",
      ds_observacao: usuario.ds_observacao,
      nr_seq_pessoa_fisica: usuario.nr_seq_pessoa_fisica,
      ie_status: usuario.ie_status ?? 'A',
      ie_base_conhecimento: usuario.ie_base_conhecimento ?? 'N',
      ie_central_suporte: usuario.ie_central_suporte ?? 'N',
      ie_parametros_funcao: usuario.ie_parametros_funcao ?? 'N',
      ie_ver_auditoria: usuario.ie_ver_auditoria ?? 'N',
    });
    setAdminEditingId(usuario.id ?? null);
    setAdminAuditInfo({
      createdAt: usuario.dt_criacao ?? '',
      updatedAt: usuario.dt_alteracao ?? '',
      createdBy: usuario.ds_usuario_criacao ?? '',
      updatedBy: usuario.ds_usuario_alteracao ?? '',
    });
    auditUsuarioIdRef.current = usuario.id ?? null;
    setMessage("");
    setAdminCampoErros([]);
    setView("form");
    setActiveSection("administracaoSistema");
    if (usuario.id) {
      carregarAutorAuditoriaUsuario(usuario.id);
    }
  }

  function openCgEditForm(item: CgItem) {
    setCgForm({
      descricao: String((item as unknown as Record<string, unknown>)[cgDef.descKey] ?? ''),
      ie_status: item.ie_status ?? 'A',
      nr_cbo: String((item as unknown as Record<string, unknown>).nr_cbo ?? ''),
      sg_sigla: String((item as unknown as Record<string, unknown>).sg_orgao_emissor ?? (item as unknown as Record<string, unknown>).sg_logradouro ?? ''),
      ds_observacao: String((item as unknown as Record<string, unknown>).ds_observacao ?? ''),
      qt_largura: formatarMedida((item as unknown as Record<string, unknown>).qt_largura),
      qt_altura: formatarMedida((item as unknown as Record<string, unknown>).qt_altura),
    });
    setCgEditingId(item.id ?? null);
    setCgAuditInfo({
      createdAt: item.dt_criacao ?? '',
      updatedAt: item.dt_alteracao ?? '',
      createdBy: (item as unknown as Record<string, unknown>).ds_usuario_criacao ? String((item as unknown as Record<string, unknown>).ds_usuario_criacao) : '',
      updatedBy: (item as unknown as Record<string, unknown>).ds_usuario_alteracao ? String((item as unknown as Record<string, unknown>).ds_usuario_alteracao) : '',
    });
    auditCgIdRef.current = item.id ?? null;
    setMessage("");
    setCgCampoErros([]);
    setView("form");
    setActiveSection("cadastrosGerais");
    if (item.id) {
      carregarAutorAuditoriaCg(item.id);
    }
  }

  /* ── Voltar para lista ── */
  function goToList() {
    setForm(emptyForm);
    setEditingId(null);
    setMessage("");
    setView("list");
    setActiveSection("pessoaFisica");
  }

  function goToPjList() {
    setPjForm(emptyPjForm);
    setPjEditingId(null);
    setMessage("");
    setView("list");
    setActiveSection("pessoaFisica");
  }

  function goToAlunoList() {
    setAlunoForm(emptyAlunoForm);
    setAlunoEditingId(null);
    setMessage("");
    setView("list");
    setActiveSection("estruturaAcademica");
  }

  function openPeriodoLetivoEditForm(periodo: PeriodoLetivo) {
    setPeriodoLetivoForm({
      nr_ano: periodo.nr_ano,
      ds_periodo_letivo: periodo.ds_periodo_letivo ?? '',
      qt_dias_letivos: periodo.qt_dias_letivos,
      dt_inicio: periodo.dt_inicio ?? '',
      dt_previsao_termino: periodo.dt_previsao_termino ?? '',
      dt_termino: periodo.dt_termino ?? '',
      dt_reativacao: periodo.dt_reativacao ?? '',
      ie_status: periodo.ie_status ?? 'A',
    });
    setPeriodoLetivoEditingId(periodo.id ?? null);
    setPeriodoLetivoAuditInfo({
      createdAt: periodo.dt_criacao ?? '',
      updatedAt: periodo.dt_alteracao ?? '',
      createdBy: periodo.ds_usuario_criacao ?? '',
      updatedBy: periodo.ds_usuario_alteracao ?? '',
    });
    setMessage("");
    setPeriodoLetivoCampoErros([]);
    setView("form");
    setActiveSection("estruturaAcademica");
  }

  function goToPeriodoLetivoList() {
    setPeriodoLetivoForm(emptyPeriodoLetivoForm);
    setPeriodoLetivoEditingId(null);
    setMessage("");
    setView("list");
    setActiveSection("estruturaAcademica");
  }

  function goToColaboradorList() {
    setColaboradorForm(emptyColaboradorForm);
    setColaboradorEditingId(null);
    setMessage("");
    setView("list");
    setActiveSection("estruturaAcademica");
  }

  function goToAtivoList() {
    setAtivoForm(emptyAtivoForm);
    setAtivoEditingId(null);
    setMessage("");
    setView("list");
    setActiveSection("patrimonio");
  }

  function goToAdminList() {
    setAdminForm(emptyAdminForm);
    setAdminEditingId(null);
    setMessage("");
    setView("list");
    setActiveSection("administracaoSistema");
  }

  function goToPerfilList() {
    setPerfilForm({ ds_perfil: '', ds_observacao: '', ie_status: 'A' });
    setPerfilEditingId(null);
    setMessage("");
    setView("list");
    setActiveSection("administracaoSistema");
  }

  function goToCgList() {
    setCgForm(emptyCgForm);
    setCgEditingId(null);
    setMessage("");
    setView("list");
    setActiveSection("cadastrosGerais");
  }

  const filteredPessoasFisicas = useMemo(() => {
    return pessoasFisicas.filter((pessoa) => {
      if (appliedFilterForm.ds_nome && !pessoa.ds_nome.toLowerCase().includes(appliedFilterForm.ds_nome.toLowerCase())) {
        return false;
      }
      if (appliedFilterForm.nr_sequencia) {
        if (String(pessoa.nr_sequencia) !== appliedFilterForm.nr_sequencia.trim()) return false;
      }
      if (appliedFilterForm.nr_cpf) {
        const queryCpf = appliedFilterForm.nr_cpf.replace(/\D/g, '');
        const pessoaCpf = pessoa.nr_cpf.replace(/\D/g, '');
        if (!pessoaCpf.includes(queryCpf)) return false;
      }
      if (appliedFilterForm.dt_nascimento_inicio) {
        const startDate = parseDateInput(appliedFilterForm.dt_nascimento_inicio);
        const pessoaDate = parsePersonDateValue(pessoa.dt_nascimento);
        if (!startDate || pessoaDate === null || pessoaDate < startDate) return false;
      }
      if (appliedFilterForm.dt_nascimento_fim) {
        const endDate = parseDateInput(appliedFilterForm.dt_nascimento_fim);
        const pessoaDate = parsePersonDateValue(pessoa.dt_nascimento);
        if (!endDate || pessoaDate === null || pessoaDate > endDate) return false;
      }
      if (appliedFilterForm.ds_email && !pessoa.ds_email.toLowerCase().includes(appliedFilterForm.ds_email.toLowerCase())) {
        return false;
      }
      if (appliedFilterForm.nr_telefone) {
        const queryPhone = appliedFilterForm.nr_telefone.replace(/\D/g, '');
        const pessoaPhone = pessoa.nr_telefone.replace(/\D/g, '');
        if (!pessoaPhone.includes(queryPhone)) return false;
      }
      if (appliedFilterForm.nr_seq_sexo && String(pessoa.nr_seq_sexo ?? '') !== appliedFilterForm.nr_seq_sexo) {
        return false;
      }
      if (appliedFilterForm.nr_seq_estado_civil && String(pessoa.nr_seq_estado_civil ?? '') !== appliedFilterForm.nr_seq_estado_civil) {
        return false;
      }
      if (appliedFilterForm.nr_seq_cor_raca && String(pessoa.nr_seq_cor_raca ?? '') !== appliedFilterForm.nr_seq_cor_raca) {
        return false;
      }
      if (appliedFilterForm.nr_seq_profissao && String(pessoa.nr_seq_profissao ?? '') !== appliedFilterForm.nr_seq_profissao) {
        return false;
      }
      return true;
    });
  }, [pessoasFisicas, appliedFilterForm]);

  const filteredUsuarios = useMemo(() => {
    return usuarios.filter((usuario) => {
      if (appliedAdminFilterForm.nr_sequencia) {
        const q = appliedAdminFilterForm.nr_sequencia.replace(/\D/g, '');
        if (!q) return false;
        const seq = Number(q);
        if (usuario.nr_sequencia !== seq) return false;
      }
      if (appliedAdminFilterForm.ds_usuario && !usuario.ds_usuario.toLowerCase().includes(appliedAdminFilterForm.ds_usuario.toLowerCase())) return false;
      if (appliedAdminFilterForm.ds_usuario_alternativo && !usuario.ds_usuario_alternativo.toLowerCase().includes(appliedAdminFilterForm.ds_usuario_alternativo.toLowerCase())) return false;
      if (appliedAdminFilterForm.nr_seq_pessoa_fisica) {
        const q = appliedAdminFilterForm.nr_seq_pessoa_fisica.replace(/\D/g, '');
        if (!q) return false;
        const seq = Number(q);
        if ((usuario.nr_seq_pessoa_fisica ?? null) !== seq) return false;
      }
      if (appliedAdminFilterForm.ie_status && appliedAdminFilterForm.ie_status.toUpperCase() !== 'T') {
        if (String(usuario.ie_status ?? '').toUpperCase() !== appliedAdminFilterForm.ie_status.toUpperCase()) return false;
      }
      return true;
    });
  }, [usuarios, appliedAdminFilterForm]);

  const filteredSortedPessoasFisicas = useMemo(() => {
    const sorted = [...filteredPessoasFisicas];
    if (sortColumn === null || sortAsc === null) {
      // Ordem padrão: coluna # decrescente (mais recente primeiro).
      return sorted.sort((a, b) => b.nr_sequencia - a.nr_sequencia);
    }

    const key = COLUMNS[sortColumn].key;
    return sorted.sort((a, b) => {
      const valA = a[key];
      const valB = b[key];
      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortAsc ? valA - valB : valB - valA;
      }
      const strA = String(valA ?? '').toLowerCase();
      const strB = String(valB ?? '').toLowerCase();
      if (strA < strB) return sortAsc ? -1 : 1;
      if (strA > strB) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [filteredPessoasFisicas, sortColumn, sortAsc]);

  const filteredAlunos = useMemo(() => {
    return alunos.filter((aluno) => {
      if (appliedAlunoFilterForm.nr_sequencia) {
        if (String(aluno.nr_sequencia) !== appliedAlunoFilterForm.nr_sequencia.trim()) return false;
      }
      if (appliedAlunoFilterForm.nr_matricula && !aluno.nr_matricula.toLowerCase().includes(appliedAlunoFilterForm.nr_matricula.toLowerCase())) {
        return false;
      }
      if (appliedAlunoFilterForm.nr_seq_pessoa_fisica) {
        if (String(aluno.nr_seq_pessoa_fisica ?? '') !== appliedAlunoFilterForm.nr_seq_pessoa_fisica.trim()) return false;
      }
      if (appliedAlunoFilterForm.dt_ingresso_inicio) {
        const startDate = parseDateInput(appliedAlunoFilterForm.dt_ingresso_inicio);
        const alunoDate = parsePersonDateValue(aluno.dt_ingresso);
        if (!startDate || alunoDate === null || alunoDate < startDate) return false;
      }
      if (appliedAlunoFilterForm.dt_ingresso_fim) {
        const endDate = parseDateInput(appliedAlunoFilterForm.dt_ingresso_fim);
        const alunoDate = parsePersonDateValue(aluno.dt_ingresso);
        if (!endDate || alunoDate === null || alunoDate > endDate) return false;
      }
      return true;
    });
  }, [alunos, appliedAlunoFilterForm]);

  const filteredSortedAlunos = useMemo(() => {
    const sorted = [...filteredAlunos];
    if (alunoSortColumn === null || alunoSortAsc === null) {
      // Ordem padrão: coluna # decrescente (mais recente primeiro).
      return sorted.sort((a, b) => b.nr_sequencia - a.nr_sequencia);
    }

    const key = ALUNO_COLUMNS[alunoSortColumn].key;
    return sorted.sort((a, b) => {
      const valA = a[key];
      const valB = b[key];
      if (typeof valA === 'number' && typeof valB === 'number') {
        return alunoSortAsc ? valA - valB : valB - valA;
      }
      const strA = String(valA ?? '').toLowerCase();
      const strB = String(valB ?? '').toLowerCase();
      if (strA < strB) return alunoSortAsc ? -1 : 1;
      if (strA > strB) return alunoSortAsc ? 1 : -1;
      return 0;
    });
  }, [filteredAlunos, alunoSortColumn, alunoSortAsc]);

  const filteredColaboradores = useMemo(() => {
    return colaboradores.filter((colaborador) => {
      if (appliedColaboradorFilterForm.nr_sequencia) {
        if (String(colaborador.nr_sequencia) !== appliedColaboradorFilterForm.nr_sequencia.trim()) return false;
      }
      if (appliedColaboradorFilterForm.nr_matricula && !(colaborador.nr_matricula ?? '').toLowerCase().includes(appliedColaboradorFilterForm.nr_matricula.toLowerCase())) {
        return false;
      }
      if (appliedColaboradorFilterForm.nr_seq_pessoa_fisica) {
        if (String(colaborador.nr_seq_pessoa_fisica ?? '') !== appliedColaboradorFilterForm.nr_seq_pessoa_fisica.trim()) return false;
      }
      if (appliedColaboradorFilterForm.nr_seq_pessoa_juridica) {
        if (String(colaborador.nr_seq_pessoa_juridica ?? '') !== appliedColaboradorFilterForm.nr_seq_pessoa_juridica.trim()) return false;
      }
      if (appliedColaboradorFilterForm.dt_admissao_inicio) {
        const startDate = parseDateInput(appliedColaboradorFilterForm.dt_admissao_inicio);
        const colaboradorDate = parsePersonDateValue(colaborador.dt_admissao);
        if (!startDate || colaboradorDate === null || colaboradorDate < startDate) return false;
      }
      if (appliedColaboradorFilterForm.dt_admissao_fim) {
        const endDate = parseDateInput(appliedColaboradorFilterForm.dt_admissao_fim);
        const colaboradorDate = parsePersonDateValue(colaborador.dt_admissao);
        if (!endDate || colaboradorDate === null || colaboradorDate > endDate) return false;
      }
      return true;
    });
  }, [colaboradores, appliedColaboradorFilterForm]);

  const filteredSortedColaboradores = useMemo(() => {
    const sorted = [...filteredColaboradores];
    if (colaboradorSortColumn === null || colaboradorSortAsc === null) {
      // Ordem padrão: coluna # decrescente (mais recente primeiro).
      return sorted.sort((a, b) => b.nr_sequencia - a.nr_sequencia);
    }

    const key = COLABORADOR_COLUMNS[colaboradorSortColumn].key;
    return sorted.sort((a, b) => {
      const valA = a[key];
      const valB = b[key];
      if (typeof valA === 'number' && typeof valB === 'number') {
        return colaboradorSortAsc ? valA - valB : valB - valA;
      }
      const strA = String(valA ?? '').toLowerCase();
      const strB = String(valB ?? '').toLowerCase();
      if (strA < strB) return colaboradorSortAsc ? -1 : 1;
      if (strA > strB) return colaboradorSortAsc ? 1 : -1;
      return 0;
    });
  }, [filteredColaboradores, colaboradorSortColumn, colaboradorSortAsc]);

  const filteredSortedPeriodosLetivos = useMemo(() => {
    const f = appliedPeriodoLetivoFilterForm;
    const filtrados = periodosLetivos.filter((p) => {
      if (f.nr_sequencia && String(p.nr_sequencia) !== f.nr_sequencia.trim()) return false;
      if (f.nr_ano && String(p.nr_ano ?? '') !== f.nr_ano.trim()) return false;
      if (f.ds_periodo_letivo && !(p.ds_periodo_letivo ?? '').toLowerCase().includes(f.ds_periodo_letivo.trim().toLowerCase())) return false;
      if (f.ie_status && (p.ie_status ?? '') !== f.ie_status) return false;
      return true;
    });
    if (periodoLetivoSortColumn === null || periodoLetivoSortAsc === null) {
      // Ordem padrão: coluna # decrescente (mais recente primeiro).
      return filtrados.sort((a, b) => b.nr_sequencia - a.nr_sequencia);
    }
    const key = PERIODO_LETIVO_COLUMNS[periodoLetivoSortColumn].key;
    return filtrados.sort((a, b) => {
      const valA = a[key];
      const valB = b[key];
      if (typeof valA === 'number' && typeof valB === 'number') {
        return periodoLetivoSortAsc ? valA - valB : valB - valA;
      }
      const strA = String(valA ?? '').toLowerCase();
      const strB = String(valB ?? '').toLowerCase();
      if (strA < strB) return periodoLetivoSortAsc ? -1 : 1;
      if (strA > strB) return periodoLetivoSortAsc ? 1 : -1;
      return 0;
    });
  }, [periodosLetivos, appliedPeriodoLetivoFilterForm, periodoLetivoSortColumn, periodoLetivoSortAsc]);

  const currentPeriodoLetivoEditIndex = useMemo(() => {
    if (!periodoLetivoEditingId) return -1;
    return filteredSortedPeriodosLetivos.findIndex((p) => p.id === periodoLetivoEditingId);
  }, [filteredSortedPeriodosLetivos, periodoLetivoEditingId]);
  // Feriados de um período letivo (duplo clique na lista, como as bandas de um relatório).
  const [periodoLetivoFeriadosId, setPeriodoLetivoFeriadosId] = useState<string | null>(null);
  const periodoLetivoFeriados = periodoLetivoFeriadosId ? periodosLetivos.find((p) => p.id === periodoLetivoFeriadosId) ?? null : null;
  const periodoLetivoFeriadosIndex = periodoLetivoFeriadosId ? filteredSortedPeriodosLetivos.findIndex((p) => p.id === periodoLetivoFeriadosId) : -1;
  function abrirFeriadosDoPeriodo(periodo: PeriodoLetivo) {
    if (!permissoesEA.feriadosPeriodoLetivo || !periodo.id) return;
    setMessage("");
    setPeriodoLetivoFeriadosId(periodo.id);
  }
  function navegarFeriadosDoPeriodo(direcao: -1 | 1) {
    const alvo = filteredSortedPeriodosLetivos[periodoLetivoFeriadosIndex + direcao];
    if (periodoLetivoFeriadosIndex >= 0 && alvo?.id) setPeriodoLetivoFeriadosId(alvo.id);
  }

  // Responsáveis de um aluno (duplo clique na lista, como os responsáveis de um ativo).
  const [alunoDetalheId, setAlunoDetalheId] = useState<string | null>(null);
  // Aba aberta no duplo clique: mantida ao alternar entre os alunos pelas setas.
  const [alunoDetalheAba, setAlunoDetalheAba] = useState<AlunoDetalheAba | undefined>(undefined);
  const alunoDetalhe = alunoDetalheId ? alunos.find((a) => a.id === alunoDetalheId) ?? null : null;
  const alunoDetalheIndex = alunoDetalheId ? filteredSortedAlunos.findIndex((a) => a.id === alunoDetalheId) : -1;
  function abrirDetalheDoAluno(aluno: Aluno) {
    if (!permissoesEA.detalhesAluno || !aluno.id) return;
    setMessage("");
    setAlunoDetalheAba(undefined);
    setAlunoDetalheId(aluno.id);
  }
  function navegarDetalheDoAluno(direcao: -1 | 1) {
    const alvo = filteredSortedAlunos[alunoDetalheIndex + direcao];
    if (alunoDetalheIndex >= 0 && alvo?.id) setAlunoDetalheId(alvo.id);
  }

  const hasPrevPeriodoLetivoRecord = currentPeriodoLetivoEditIndex > 0;
  const hasNextPeriodoLetivoRecord = currentPeriodoLetivoEditIndex >= 0 && currentPeriodoLetivoEditIndex < filteredSortedPeriodosLetivos.length - 1;

  const filteredSortedAtivos = useMemo(() => {
    let sorted = [...ativos].filter((a) => {
      // Identificação
      if (appliedAtivoFilterForm.nr_sequencia) {
        const q = appliedAtivoFilterForm.nr_sequencia.replace(/\D/g, '');
        if (q && String(a.nr_sequencia) !== q) return false;
      }
      if (appliedAtivoFilterForm.ds_ativo && !(a.ds_ativo ?? '').toLowerCase().includes(appliedAtivoFilterForm.ds_ativo.toLowerCase())) return false;
      if (appliedAtivoFilterForm.cd_externo && !(a.cd_externo ?? '').toLowerCase().includes(appliedAtivoFilterForm.cd_externo.toLowerCase())) return false;
      if (appliedAtivoFilterForm.ds_modelo && !(a.ds_modelo ?? '').toLowerCase().includes(appliedAtivoFilterForm.ds_modelo.toLowerCase())) return false;
      if (appliedAtivoFilterForm.nr_serie && !(a.nr_serie ?? '').toLowerCase().includes(appliedAtivoFilterForm.nr_serie.toLowerCase())) return false;
      if (appliedAtivoFilterForm.ds_qr_code && !(a.ds_qr_code ?? '').toLowerCase().includes(appliedAtivoFilterForm.ds_qr_code.toLowerCase())) return false;
      if (appliedAtivoFilterForm.ds_codigo_barras && !(a.ds_codigo_barras ?? '').toLowerCase().includes(appliedAtivoFilterForm.ds_codigo_barras.toLowerCase())) return false;
      if (appliedAtivoFilterForm.dt_aquisicao_inicio && a.dt_aquisicao && a.dt_aquisicao < appliedAtivoFilterForm.dt_aquisicao_inicio) return false;
      if (appliedAtivoFilterForm.dt_aquisicao_fim && a.dt_aquisicao && a.dt_aquisicao > appliedAtivoFilterForm.dt_aquisicao_fim) return false;
      if (appliedAtivoFilterForm.dt_garantia_inicio && a.dt_garantia && a.dt_garantia < appliedAtivoFilterForm.dt_garantia_inicio) return false;
      if (appliedAtivoFilterForm.dt_garantia_fim && a.dt_garantia && a.dt_garantia > appliedAtivoFilterForm.dt_garantia_fim) return false;
      if (appliedAtivoFilterForm.ie_status !== 'T' && a.ie_status !== appliedAtivoFilterForm.ie_status) return false;
      // Classificação
      if (appliedAtivoFilterForm.nr_seq_categoria) {
        const q = appliedAtivoFilterForm.nr_seq_categoria.replace(/\D/g, '');
        if (q && String(a.nr_seq_categoria ?? '') !== q) return false;
      }
      if (appliedAtivoFilterForm.nr_seq_localizacao) {
        const q = appliedAtivoFilterForm.nr_seq_localizacao.replace(/\D/g, '');
        if (q && String(a.nr_seq_localizacao ?? '') !== q) return false;
      }
      if (appliedAtivoFilterForm.nr_seq_marca) {
        const q = appliedAtivoFilterForm.nr_seq_marca.replace(/\D/g, '');
        if (q && String(a.nr_seq_marca ?? '') !== q) return false;
      }
      if (appliedAtivoFilterForm.nr_seq_responsavel) {
        const q = appliedAtivoFilterForm.nr_seq_responsavel.replace(/\D/g, '');
        if (q && !responsaveisAtivos.some((r) => r.nr_seq_ativo === a.nr_sequencia && String(r.nr_seq_colaborador ?? '') === q)) return false;
      }
      if (appliedAtivoFilterForm.nr_seq_fornecedor) {
        const q = appliedAtivoFilterForm.nr_seq_fornecedor.replace(/\D/g, '');
        if (q && String(a.nr_seq_fornecedor ?? '') !== q) return false;
      }
      // Dispositivo
      if (appliedAtivoFilterForm.ds_endereco_mac && !(a.ds_endereco_mac ?? '').toLowerCase().includes(appliedAtivoFilterForm.ds_endereco_mac.toLowerCase())) return false;
      if (appliedAtivoFilterForm.ds_ip && !(a.ds_ip ?? '').toLowerCase().includes(appliedAtivoFilterForm.ds_ip.toLowerCase())) return false;
      if (appliedAtivoFilterForm.nr_seq_sistema_operacional) {
        const q = appliedAtivoFilterForm.nr_seq_sistema_operacional.replace(/\D/g, '');
        if (q && String(a.nr_seq_sistema_operacional ?? '') !== q) return false;
      }
      return true;
    });
    if (ativoSortColumn === null || ativoSortAsc === null) {
      // Ordem padrão: coluna # decrescente (mais recente primeiro).
      return sorted.sort((a, b) => b.nr_sequencia - a.nr_sequencia);
    }

    const key = ATIVO_COLUMNS[ativoSortColumn].key;
    return sorted.sort((a, b) => {
      const valA = a[key];
      const valB = b[key];
      if (typeof valA === 'number' && typeof valB === 'number') {
        return ativoSortAsc ? valA - valB : valB - valA;
      }
      const strA = String(valA ?? '').toLowerCase();
      const strB = String(valB ?? '').toLowerCase();
      if (strA < strB) return ativoSortAsc ? -1 : 1;
      if (strA > strB) return ativoSortAsc ? 1 : -1;
      return 0;
    });
  }, [ativos, ativoSortColumn, ativoSortAsc, appliedAtivoFilterForm, responsaveisAtivos]);

  // Responsáveis e manutenções de um ativo (duplo clique na lista, como os feriados de um período letivo).
  const [ativoDetalheId, setAtivoDetalheId] = useState<string | null>(null);
  // Aba aberta no duplo clique: mantida ao alternar entre os ativos pelas setas.
  const [ativoDetalheAba, setAtivoDetalheAba] = useState<AtivoDetalheAba | undefined>(undefined);
  const ativoDetalhe = ativoDetalheId ? ativos.find((a) => a.id === ativoDetalheId) ?? null : null;
  const ativoDetalheIndex = ativoDetalheId ? filteredSortedAtivos.findIndex((a) => a.id === ativoDetalheId) : -1;
  function abrirDetalheDoAtivo(ativo: Ativo) {
    if (!permissoesPatrimonio.detalhesAtivo || !ativo.id) return;
    setMessage("");
    setAtivoDetalheAba(undefined);
    setAtivoDetalheId(ativo.id);
  }
  function navegarDetalheDoAtivo(direcao: -1 | 1) {
    const alvo = filteredSortedAtivos[ativoDetalheIndex + direcao];
    if (ativoDetalheIndex >= 0 && alvo?.id) setAtivoDetalheId(alvo.id);
  }
  // Residencial, Comercial e Saúde de uma pessoa física (duplo clique na lista).
  const [pfDetalheId, setPfDetalheId] = useState<string | null>(null);
  // Aba aberta no duplo clique: mantida ao alternar entre as pessoas físicas pelas setas.
  const [pfDetalheAba, setPfDetalheAba] = useState<PessoaFisicaAba | undefined>(undefined);
  const [pfDetalheSaving, setPfDetalheSaving] = useState(false);
  const pfDetalhe = pfDetalheId ? pessoasFisicas.find((p) => p.id === pfDetalheId) ?? null : null;
  const pfDetalheIndex = pfDetalheId ? filteredSortedPessoasFisicas.findIndex((p) => p.id === pfDetalheId) : -1;
  function abrirDetalheDaPessoaFisica(pessoa: PessoaFisica) {
    if (!permissoesPessoa.detalhesPessoaFisica || !pessoa.id) return;
    setMessage("");
    setPfDetalheAba(undefined);
    setPfDetalheId(pessoa.id);
  }
  function navegarDetalheDaPessoaFisica(direcao: -1 | 1) {
    const alvo = filteredSortedPessoasFisicas[pfDetalheIndex + direcao];
    if (pfDetalheIndex >= 0 && alvo?.id) setPfDetalheId(alvo.id);
  }

  function fecharDetalheDoAtivo() {
    setMessage("");
    setAtivoDetalheId(null);
    // Atualiza o filtro por responsável com o que foi alterado na tela.
    obterResponsaveisAtivos().then(setResponsaveisAtivos).catch(() => {});
  }

  const filteredPessoasJuridicas = useMemo(() => {
    return pessoasJuridicas.filter((pessoa) => {
      if (appliedPjFilterForm.nr_sequencia) {
        if (String(pessoa.nr_sequencia) !== appliedPjFilterForm.nr_sequencia.trim()) return false;
      }
      if (appliedPjFilterForm.ds_razao_social && !pessoa.ds_razao_social.toLowerCase().includes(appliedPjFilterForm.ds_razao_social.toLowerCase())) {
        return false;
      }
      if (appliedPjFilterForm.ds_nome_fantasia && !pessoa.ds_nome_fantasia.toLowerCase().includes(appliedPjFilterForm.ds_nome_fantasia.toLowerCase())) {
        return false;
      }
      if (appliedPjFilterForm.nr_cnpj) {
        const queryCnpj = appliedPjFilterForm.nr_cnpj.replace(/\D/g, '');
        const pessoaCnpj = pessoa.nr_cnpj.replace(/\D/g, '');
        if (!pessoaCnpj.includes(queryCnpj)) return false;
      }
      if (appliedPjFilterForm.nr_inscricao_estadual && !pessoa.nr_inscricao_estadual.toLowerCase().includes(appliedPjFilterForm.nr_inscricao_estadual.toLowerCase())) {
        return false;
      }
      if (appliedPjFilterForm.nr_inscricao_municipal && !pessoa.nr_inscricao_municipal.toLowerCase().includes(appliedPjFilterForm.nr_inscricao_municipal.toLowerCase())) {
        return false;
      }
      if (appliedPjFilterForm.dt_abertura_inicio) {
        const startDate = parseDateInput(appliedPjFilterForm.dt_abertura_inicio);
        const pessoaDate = parsePersonDateValue(pessoa.dt_abertura);
        if (!startDate || pessoaDate === null || pessoaDate < startDate) return false;
      }
      if (appliedPjFilterForm.dt_abertura_fim) {
        const endDate = parseDateInput(appliedPjFilterForm.dt_abertura_fim);
        const pessoaDate = parsePersonDateValue(pessoa.dt_abertura);
        if (!endDate || pessoaDate === null || pessoaDate > endDate) return false;
      }
      if (appliedPjFilterForm.ds_email && !pessoa.ds_email.toLowerCase().includes(appliedPjFilterForm.ds_email.toLowerCase())) {
        return false;
      }
      if (appliedPjFilterForm.nr_telefone) {
        const queryPhone = appliedPjFilterForm.nr_telefone.replace(/\D/g, '');
        const pessoaPhone = pessoa.nr_telefone.replace(/\D/g, '');
        if (!pessoaPhone.includes(queryPhone)) return false;
      }
      if (appliedPjFilterForm.sg_estado && String(pessoa.sg_estado ?? '') !== appliedPjFilterForm.sg_estado) {
        return false;
      }
      if (appliedPjFilterForm.cd_ibge_cidade && String(pessoa.cd_ibge_cidade ?? '') !== appliedPjFilterForm.cd_ibge_cidade.trim()) {
        return false;
      }
      return true;
    });
  }, [pessoasJuridicas, appliedPjFilterForm]);

  const filteredSortedPessoasJuridicas = useMemo(() => {
    const sorted = [...filteredPessoasJuridicas];
    if (pjSortColumn === null || pjSortAsc === null) {
      // Ordem padrão: coluna # decrescente (mais recente primeiro).
      return sorted.sort((a, b) => b.nr_sequencia - a.nr_sequencia);
    }

    const key = PJ_COLUMNS[pjSortColumn].key;
    return sorted.sort((a, b) => {
      const valA = a[key];
      const valB = b[key];
      if (typeof valA === 'number' && typeof valB === 'number') {
        return pjSortAsc ? valA - valB : valB - valA;
      }
      const strA = String(valA ?? '').toLowerCase();
      const strB = String(valB ?? '').toLowerCase();
      if (strA < strB) return pjSortAsc ? -1 : 1;
      if (strA > strB) return pjSortAsc ? 1 : -1;
      return 0;
    });
  }, [filteredPessoasJuridicas, pjSortColumn, pjSortAsc]);

  const filteredSortedUsuarios = useMemo(() => {
    const sorted = [...filteredUsuarios];
    if (adminSortColumn === null || adminSortAsc === null) {
      // Ordem padrão: coluna # decrescente (mais recente primeiro).
      return sorted.sort((a, b) => b.nr_sequencia - a.nr_sequencia);
    }

    const key = ADMIN_COLUMNS[adminSortColumn].key;
    return sorted.sort((a, b) => {
      const valA = a[key];
      const valB = b[key];
      if (typeof valA === 'number' && typeof valB === 'number') {
        return adminSortAsc ? valA - valB : valB - valA;
      }
      const strA = String(valA ?? '').toLowerCase();
      const strB = String(valB ?? '').toLowerCase();
      if (strA < strB) return adminSortAsc ? -1 : 1;
      if (strA > strB) return adminSortAsc ? 1 : -1;
      return 0;
    });
  }, [filteredUsuarios, adminSortColumn, adminSortAsc]);

  const filteredPerfis = useMemo(() => {
    return perfis.filter((perfil) => {
      if (appliedPerfilFilterForm.nr_sequencia) {
        const q = appliedPerfilFilterForm.nr_sequencia.replace(/\D/g, '');
        if (!q) return false;
        const seq = Number(q);
        if (perfil.nr_sequencia !== seq) return false;
      }
      if (appliedPerfilFilterForm.ds_perfil && !perfil.ds_perfil.toLowerCase().includes(appliedPerfilFilterForm.ds_perfil.toLowerCase())) return false;
      if (appliedPerfilFilterForm.ie_status && appliedPerfilFilterForm.ie_status.toUpperCase() !== 'T') {
        if (String(perfil.ie_status ?? '').toUpperCase() !== appliedPerfilFilterForm.ie_status.toUpperCase()) return false;
      }
      return true;
    });
  }, [perfis, appliedPerfilFilterForm]);

  const filteredSortedPerfis = useMemo(() => {
    const sorted = [...filteredPerfis];
    if (perfilSortColumn === null || perfilSortAsc === null) {
      // Ordem padrão: coluna # decrescente (mais recente primeiro).
      return sorted.sort((a, b) => b.nr_sequencia - a.nr_sequencia);
    }

    const key = PERFIL_COLUMNS[perfilSortColumn].key;
    return sorted.sort((a, b) => {
      const valA = a[key];
      const valB = b[key];
      if (typeof valA === 'number' && typeof valB === 'number') {
        return perfilSortAsc ? valA - valB : valB - valA;
      }
      const strA = String(valA ?? '').toLowerCase();
      const strB = String(valB ?? '').toLowerCase();
      if (strA < strB) return perfilSortAsc ? -1 : 1;
      if (strA > strB) return perfilSortAsc ? 1 : -1;
      return 0;
    });
  }, [filteredPerfis, perfilSortColumn, perfilSortAsc]);

  const filteredCgItems = useMemo(() => {
    return cgItems.filter((item) => {
      const rec = item as unknown as Record<string, unknown>;
      if (appliedCgFilterForm.nr_sequencia) {
        if (String(rec.nr_sequencia) !== appliedCgFilterForm.nr_sequencia.trim()) return false;
      }
      if (appliedCgFilterForm.descricao && !String(rec[cgDescKey] ?? '').toLowerCase().includes(appliedCgFilterForm.descricao.toLowerCase())) return false;
      if (appliedCgFilterForm.ie_status && appliedCgFilterForm.ie_status.toUpperCase() !== 'T') {
        if (String(rec.ie_status ?? '').toUpperCase() !== appliedCgFilterForm.ie_status.toUpperCase()) return false;
      }
      return true;
    });
  }, [cgItems, appliedCgFilterForm, cgDescKey]);

  const filteredSortedCgItems = useMemo(() => {
    const sorted = [...filteredCgItems];
    if (cgSortColumn === null || cgSortAsc === null) {
      // Ordem padrão: coluna # decrescente (mais recente primeiro).
      return sorted.sort((a, b) => Number((b as unknown as Record<string, unknown>).nr_sequencia) - Number((a as unknown as Record<string, unknown>).nr_sequencia));
    }

    const key = cgColumns[cgSortColumn].key as string;
    return sorted.sort((a, b) => {
      const ra = a as unknown as Record<string, unknown>;
      const rb = b as unknown as Record<string, unknown>;
      const valA = ra[key];
      const valB = rb[key];
      if (typeof valA === 'number' && typeof valB === 'number') {
        return cgSortAsc ? valA - valB : valB - valA;
      }
      const strA = String(valA ?? '').toLowerCase();
      const strB = String(valB ?? '').toLowerCase();
      if (strA < strB) return cgSortAsc ? -1 : 1;
      if (strA > strB) return cgSortAsc ? 1 : -1;
      return 0;
    });
  }, [filteredCgItems, cgSortColumn, cgSortAsc, cgColumns]);

  const currentEditIndex = useMemo(() => {
    if (!editingId) return -1;
    return filteredSortedPessoasFisicas.findIndex((p) => p.id === editingId);
  }, [filteredSortedPessoasFisicas, editingId]);

  const currentAdminEditIndex = useMemo(() => {
    if (!adminEditingId) return -1;
    return filteredSortedUsuarios.findIndex((u) => u.id === adminEditingId);
  }, [filteredSortedUsuarios, adminEditingId]);

  const currentCgEditIndex = useMemo(() => {
    if (!cgEditingId) return -1;
    return filteredSortedCgItems.findIndex((s) => s.id === cgEditingId);
  }, [filteredSortedCgItems, cgEditingId]);

  const currentPjEditIndex = useMemo(() => {
    if (!pjEditingId) return -1;
    return filteredSortedPessoasJuridicas.findIndex((p) => p.id === pjEditingId);
  }, [filteredSortedPessoasJuridicas, pjEditingId]);

  const currentAlunoEditIndex = useMemo(() => {
    if (!alunoEditingId) return -1;
    return filteredSortedAlunos.findIndex((a) => a.id === alunoEditingId);
  }, [filteredSortedAlunos, alunoEditingId]);

  const hasPrevRecord = currentEditIndex > 0;
  const hasNextRecord = currentEditIndex >= 0 && currentEditIndex < filteredSortedPessoasFisicas.length - 1;
  const hasPrevAdminRecord = currentAdminEditIndex > 0;
  const hasNextAdminRecord = currentAdminEditIndex >= 0 && currentAdminEditIndex < filteredSortedUsuarios.length - 1;
  const currentPerfilEditIndex = useMemo(() => {
    if (!perfilEditingId) return -1;
    return filteredSortedPerfis.findIndex((p) => p.id === perfilEditingId);
  }, [filteredSortedPerfis, perfilEditingId]);
  const hasPrevPerfilRecord = currentPerfilEditIndex > 0;
  const hasNextPerfilRecord = currentPerfilEditIndex >= 0 && currentPerfilEditIndex < filteredSortedPerfis.length - 1;
  const hasPrevCgRecord = currentCgEditIndex > 0;
  const hasNextCgRecord = currentCgEditIndex >= 0 && currentCgEditIndex < filteredSortedCgItems.length - 1;
  const hasPrevPjRecord = currentPjEditIndex > 0;
  const hasNextPjRecord = currentPjEditIndex >= 0 && currentPjEditIndex < filteredSortedPessoasJuridicas.length - 1;
  const hasPrevAlunoRecord = currentAlunoEditIndex > 0;
  const hasNextAlunoRecord = currentAlunoEditIndex >= 0 && currentAlunoEditIndex < filteredSortedAlunos.length - 1;
  const currentColaboradorEditIndex = useMemo(() => {
    if (!colaboradorEditingId) return -1;
    return filteredSortedColaboradores.findIndex((c) => c.id === colaboradorEditingId);
  }, [filteredSortedColaboradores, colaboradorEditingId]);
  const hasPrevColaboradorRecord = currentColaboradorEditIndex > 0;
  const hasNextColaboradorRecord = currentColaboradorEditIndex >= 0 && currentColaboradorEditIndex < filteredSortedColaboradores.length - 1;

  const currentAtivoEditIndex = useMemo(() => {
    if (!ativoEditingId) return -1;
    return filteredSortedAtivos.findIndex((a) => a.id === ativoEditingId);
  }, [filteredSortedAtivos, ativoEditingId]);
  const hasPrevAtivoRecord = currentAtivoEditIndex > 0;
  const hasNextAtivoRecord = currentAtivoEditIndex >= 0 && currentAtivoEditIndex < filteredSortedAtivos.length - 1;

  function goToPrevRecord() {
    if (!hasPrevRecord) return;
    const previous = filteredSortedPessoasFisicas[currentEditIndex - 1];
    if (previous) openEditForm(previous);
  }

  function goToNextRecord() {
    if (!hasNextRecord) return;
    const next = filteredSortedPessoasFisicas[currentEditIndex + 1];
    if (next) openEditForm(next);
  }

  function goToPrevAdminRecord() {
    if (!hasPrevAdminRecord) return;
    const previous = filteredSortedUsuarios[currentAdminEditIndex - 1];
    if (previous) openAdminEditForm(previous);
  }

  function goToNextAdminRecord() {
    if (!hasNextAdminRecord) return;
    const next = filteredSortedUsuarios[currentAdminEditIndex + 1];
    if (next) openAdminEditForm(next);
  }

  function goToPrevPerfilRecord() {
    if (!hasPrevPerfilRecord) return;
    const previous = filteredSortedPerfis[currentPerfilEditIndex - 1];
    if (previous) openPerfilEditForm(previous);
  }

  function goToNextPerfilRecord() {
    if (!hasNextPerfilRecord) return;
    const next = filteredSortedPerfis[currentPerfilEditIndex + 1];
    if (next) openPerfilEditForm(next);
  }

  function goToPrevCgRecord() {
    if (!hasPrevCgRecord) return;
    const previous = filteredSortedCgItems[currentCgEditIndex - 1];
    if (previous) openCgEditForm(previous);
  }

  function goToNextCgRecord() {
    if (!hasNextCgRecord) return;
    const next = filteredSortedCgItems[currentCgEditIndex + 1];
    if (next) openCgEditForm(next);
  }

  /* ── Patrimônio > Categoria ── */
  const filteredSortedCategorias = useMemo(() => {
    const filtro = appliedCategoriaFilterForm;
    const lista = categoriasAtivos.filter((c) => {
      if (filtro.nr_sequencia && String(c.nr_sequencia) !== filtro.nr_sequencia.trim()) return false;
      if (filtro.descricao && !String(c.ds_categoria ?? '').toLowerCase().includes(filtro.descricao.toLowerCase())) return false;
      if (filtro.ie_status && filtro.ie_status.toUpperCase() !== 'T' && String(c.ie_status ?? '').toUpperCase() !== filtro.ie_status.toUpperCase()) return false;
      return true;
    });
    if (categoriaSortColumn === null || categoriaSortAsc === null) {
      // Ordem padrão: coluna # decrescente (mais recente primeiro).
      return lista.sort((a, b) => Number(b.nr_sequencia) - Number(a.nr_sequencia));
    }
    const key = CATEGORIA_ATIVO_COLUMNS[categoriaSortColumn].key;
    return lista.sort((a, b) => {
      const valA = a[key];
      const valB = b[key];
      if (typeof valA === 'number' && typeof valB === 'number') return categoriaSortAsc ? valA - valB : valB - valA;
      const strA = String(valA ?? '').toLowerCase();
      const strB = String(valB ?? '').toLowerCase();
      if (strA < strB) return categoriaSortAsc ? -1 : 1;
      if (strA > strB) return categoriaSortAsc ? 1 : -1;
      return 0;
    });
  }, [categoriasAtivos, appliedCategoriaFilterForm, categoriaSortColumn, categoriaSortAsc]);

  const currentCategoriaEditIndex = categoriaEditingId ? filteredSortedCategorias.findIndex((c) => c.id === categoriaEditingId) : -1;
  const hasPrevCategoriaRecord = currentCategoriaEditIndex > 0;
  const hasNextCategoriaRecord = currentCategoriaEditIndex >= 0 && currentCategoriaEditIndex < filteredSortedCategorias.length - 1;

  function handleCategoriaSortChange(logicalIndex: number) {
    if (categoriaSortColumn === logicalIndex) {
      if (categoriaSortAsc) {
        setCategoriaSortAsc(false);
      } else {
        setCategoriaSortColumn(null);
        setCategoriaSortAsc(null);
      }
    } else {
      setCategoriaSortColumn(logicalIndex);
      setCategoriaSortAsc(true);
    }
  }

  // Botão "Adicionar": sem a permissão, mostra aviso.
  function handleCategoriaNewForm() {
    if (!permissoesPatrimonio.adicionarCategoria) {
      setMessage("Você não tem permissão para adicionar.");
      return;
    }
    setCategoriaForm(emptyCgForm);
    setCategoriaEditingId(null);
    setCategoriaAuditInfo({ createdAt: '', updatedAt: '', createdBy: '', updatedBy: '' });
    setMessage("");
    setCategoriaCampoErros([]);
    setView("form");
    setActiveSection("patrimonio");
  }

  async function carregarAutorAuditoriaCategoria(id: string) {
    try {
      const logs = await fetchAuditByDocumentId('pat_categoria', id);
      if (auditCategoriaIdRef.current !== id) return;
      const createLog = logs.find((l) => String(l.acao ?? '').toLowerCase() === 'create');
      const lastChangeLog = logs.find((l) => String(l.acao ?? '').toLowerCase() === 'update');
      setCategoriaAuditInfo((prev) => ({
        ...prev,
        createdBy: createLog?.usuarioNome ?? prev.createdBy,
        updatedBy: lastChangeLog?.usuarioNome ?? prev.updatedBy,
      }));
    } catch {
      // mantém vazio em caso de falha
    }
  }

  function openCategoriaEditForm(categoria: CategoriaAtivo) {
    setCategoriaForm({
      descricao: categoria.ds_categoria ?? '',
      ie_status: categoria.ie_status ?? 'A',
      nr_cbo: '',
      sg_sigla: '',
      ds_observacao: categoria.ds_observacao ?? '',
    });
    setCategoriaEditingId(categoria.id ?? null);
    setCategoriaAuditInfo({
      createdAt: categoria.dt_criacao ?? '',
      updatedAt: categoria.dt_alteracao ?? '',
      createdBy: categoria.ds_usuario_criacao ?? '',
      updatedBy: categoria.ds_usuario_alteracao ?? '',
    });
    auditCategoriaIdRef.current = categoria.id ?? null;
    setMessage("");
    setCategoriaCampoErros([]);
    setView("form");
    setActiveSection("patrimonio");
    if (categoria.id) carregarAutorAuditoriaCategoria(categoria.id);
  }

  function goToCategoriaList() {
    setCategoriaForm(emptyCgForm);
    setCategoriaEditingId(null);
    setMessage("");
    setView("list");
    setActiveSection("patrimonio");
  }

  function goToPrevCategoriaRecord() {
    const anterior = hasPrevCategoriaRecord ? filteredSortedCategorias[currentCategoriaEditIndex - 1] : undefined;
    if (anterior) openCategoriaEditForm(anterior);
  }

  function goToNextCategoriaRecord() {
    const proximo = hasNextCategoriaRecord ? filteredSortedCategorias[currentCategoriaEditIndex + 1] : undefined;
    if (proximo) openCategoriaEditForm(proximo);
  }

  async function openCategoriaAuditModal(categoriaId?: string | null) {
    if (!categoriaId) return;
    setAuditDocumentType('pat_categoria');
    setAuditModalOpen(true);
    setAuditLoading(true);
    try {
      setAuditLogs(await fetchAuditByDocumentId('pat_categoria', categoriaId));
    } catch {
      setAuditLogs([]);
    } finally {
      setAuditLoading(false);
    }
  }

  function openCategoriaFilterModal() {
    setCategoriaFilterForm(appliedCategoriaFilterForm);
    setCategoriaFilterModalOpen(true);
  }

  function clearCategoriaFilter() {
    setCategoriaFilterForm({ nr_sequencia: '', descricao: '', ie_status: 'T' });
    setAppliedCategoriaFilterForm({ nr_sequencia: '', descricao: '', ie_status: 'T' });
  }

  function handleCategoriaFilterSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAppliedCategoriaFilterForm({ ...categoriaFilterForm, ie_status: categoriaFilterForm.ie_status || 'T' });
    setCategoriaFilterModalOpen(false);
  }

  async function handleCategoriaSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (categoriaEditingId && bloquearEdicaoSemPermissao(permissoesPatrimonio.editarCategoria)) return;
    setMessage("");
    const payload = {
      ds_categoria: categoriaForm.descricao,
      ie_status: categoriaForm.ie_status,
      ds_observacao: categoriaForm.ds_observacao ?? '',
    };
    // Campos obrigatórios (perfil ativo) precisam estar preenchidos.
    const faltantes = camposObrigatoriosVazios(payload, campoRegrasDaColecao(campoRegrasAtivas, 'pat_categoria'));
    if (faltantes.length > 0) {
      setCategoriaCampoErros(faltantes);
      setMessage("Preencha os campos obrigatórios.");
      return;
    }
    setCategoriaCampoErros([]);
    setCategoriaSubmitting(true);
    try {
      if (categoriaEditingId) {
        const atual = categoriasAtivos.find((c) => c.id === categoriaEditingId);
        const mudou = !atual || (Object.keys(payload) as (keyof typeof payload)[]).some((k) => String(atual[k] ?? '') !== String(payload[k] ?? ''));
        if (!mudou) {
          setMessage("Nenhuma alteração detectada.");
        } else {
          await atualizarCategoriaAtivo(categoriaEditingId, payload, auditAutor);
          setMessage("Atualizado com sucesso!");
        }
      } else {
        await criarCategoriaAtivo(payload, auditAutor);
        setMessage("Cadastrado com sucesso!");
      }
      setCategoriaForm(emptyCgForm);
      setCategoriaEditingId(null);
      await loadCategoriasAtivos();
      setView("list");
      abrirNovoAposSalvar();
    } catch {
      setMessage("Erro ao salvar.");
    } finally {
      setCategoriaSubmitting(false);
    }
  }

  async function handleCategoriaDelete(id: string) {
    setMessage("");
    try {
      await excluirCategoriaAtivo(id);
      setMessage("Excluído com sucesso!");
      await loadCategoriasAtivos();
    } catch {
      setMessage("Erro ao excluir.");
    }
    if (view === 'form') goToCategoriaList();
  }

  /* ── Estrutura Acadêmica > Cursos ── */
  const filteredSortedCursos = useMemo(() => {
    const filtro = appliedCursoFilterForm;
    const lista = cursos.filter((c) => {
      if (filtro.nr_sequencia && String(c.nr_sequencia) !== filtro.nr_sequencia.trim()) return false;
      if (filtro.descricao && !String(c.ds_curso ?? '').toLowerCase().includes(filtro.descricao.toLowerCase())) return false;
      if (filtro.ie_status && filtro.ie_status.toUpperCase() !== 'T' && String(c.ie_status ?? '').toUpperCase() !== filtro.ie_status.toUpperCase()) return false;
      return true;
    });
    if (cursoSortColumn === null || cursoSortAsc === null) {
      // Ordem padrão: coluna # decrescente (mais recente primeiro).
      return lista.sort((a, b) => Number(b.nr_sequencia) - Number(a.nr_sequencia));
    }
    const key = CURSO_COLUMNS[cursoSortColumn].key;
    return lista.sort((a, b) => {
      const valA = a[key];
      const valB = b[key];
      if (typeof valA === 'number' && typeof valB === 'number') return cursoSortAsc ? valA - valB : valB - valA;
      const strA = String(valA ?? '').toLowerCase();
      const strB = String(valB ?? '').toLowerCase();
      if (strA < strB) return cursoSortAsc ? -1 : 1;
      if (strA > strB) return cursoSortAsc ? 1 : -1;
      return 0;
    });
  }, [cursos, appliedCursoFilterForm, cursoSortColumn, cursoSortAsc]);

  const currentCursoEditIndex = cursoEditingId ? filteredSortedCursos.findIndex((c) => c.id === cursoEditingId) : -1;
  const hasPrevCursoRecord = currentCursoEditIndex > 0;
  const hasNextCursoRecord = currentCursoEditIndex >= 0 && currentCursoEditIndex < filteredSortedCursos.length - 1;

  function handleCursoSortChange(logicalIndex: number) {
    if (cursoSortColumn === logicalIndex) {
      if (cursoSortAsc) {
        setCursoSortAsc(false);
      } else {
        setCursoSortColumn(null);
        setCursoSortAsc(null);
      }
    } else {
      setCursoSortColumn(logicalIndex);
      setCursoSortAsc(true);
    }
  }

  // Botão "Adicionar": sem a permissão, mostra aviso.
  function handleCursoNewForm() {
    if (!permissoesEA.adicionarCurso) {
      setMessage("Você não tem permissão para adicionar.");
      return;
    }
    setCursoForm(emptyCgForm);
    setCursoEditingId(null);
    setCursoAuditInfo({ createdAt: '', updatedAt: '', createdBy: '', updatedBy: '' });
    setMessage("");
    setCursoCampoErros([]);
    setView("form");
    setActiveSection("estruturaAcademica");
  }

  async function carregarAutorAuditoriaCurso(id: string) {
    try {
      const logs = await fetchAuditByDocumentId('curso', id);
      if (auditCursoIdRef.current !== id) return;
      const createLog = logs.find((l) => String(l.acao ?? '').toLowerCase() === 'create');
      const lastChangeLog = logs.find((l) => String(l.acao ?? '').toLowerCase() === 'update');
      setCursoAuditInfo((prev) => ({
        ...prev,
        createdBy: createLog?.usuarioNome ?? prev.createdBy,
        updatedBy: lastChangeLog?.usuarioNome ?? prev.updatedBy,
      }));
    } catch {
      // mantém vazio em caso de falha
    }
  }

  function openCursoEditForm(curso: Curso) {
    setCursoForm({
      descricao: curso.ds_curso ?? '',
      ie_status: curso.ie_status ?? 'A',
      nr_cbo: '',
      sg_sigla: '',
      ds_observacao: curso.ds_observacao ?? '',
    });
    setCursoEditingId(curso.id ?? null);
    setCursoAuditInfo({
      createdAt: curso.dt_criacao ?? '',
      updatedAt: curso.dt_alteracao ?? '',
      createdBy: curso.ds_usuario_criacao ?? '',
      updatedBy: curso.ds_usuario_alteracao ?? '',
    });
    auditCursoIdRef.current = curso.id ?? null;
    setMessage("");
    setCursoCampoErros([]);
    setView("form");
    setActiveSection("estruturaAcademica");
    if (curso.id) carregarAutorAuditoriaCurso(curso.id);
  }

  function goToCursoList() {
    setCursoForm(emptyCgForm);
    setCursoEditingId(null);
    setMessage("");
    setView("list");
    setActiveSection("estruturaAcademica");
  }

  function goToPrevCursoRecord() {
    const anterior = hasPrevCursoRecord ? filteredSortedCursos[currentCursoEditIndex - 1] : undefined;
    if (anterior) openCursoEditForm(anterior);
  }

  function goToNextCursoRecord() {
    const proximo = hasNextCursoRecord ? filteredSortedCursos[currentCursoEditIndex + 1] : undefined;
    if (proximo) openCursoEditForm(proximo);
  }

  async function openCursoAuditModal(cursoId?: string | null) {
    if (!cursoId) return;
    setAuditDocumentType('curso');
    setAuditModalOpen(true);
    setAuditLoading(true);
    try {
      setAuditLogs(await fetchAuditByDocumentId('curso', cursoId));
    } catch {
      setAuditLogs([]);
    } finally {
      setAuditLoading(false);
    }
  }

  function openCursoFilterModal() {
    setCursoFilterForm(appliedCursoFilterForm);
    setCursoFilterModalOpen(true);
  }

  function clearCursoFilter() {
    setCursoFilterForm({ nr_sequencia: '', descricao: '', ie_status: 'T' });
    setAppliedCursoFilterForm({ nr_sequencia: '', descricao: '', ie_status: 'T' });
  }

  function handleCursoFilterSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAppliedCursoFilterForm({ ...cursoFilterForm, ie_status: cursoFilterForm.ie_status || 'T' });
    setCursoFilterModalOpen(false);
  }

  async function handleCursoSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (cursoEditingId && bloquearEdicaoSemPermissao(permissoesEA.editarCurso)) return;
    setMessage("");
    const payload = {
      ds_curso: cursoForm.descricao,
      ie_status: cursoForm.ie_status,
      ds_observacao: cursoForm.ds_observacao ?? '',
    };
    // Campos obrigatórios (perfil ativo) precisam estar preenchidos.
    const faltantes = camposObrigatoriosVazios(payload, campoRegrasDaColecao(campoRegrasAtivas, 'curso'));
    if (faltantes.length > 0) {
      setCursoCampoErros(faltantes);
      setMessage("Preencha os campos obrigatórios.");
      return;
    }
    setCursoCampoErros([]);
    setCursoSubmitting(true);
    try {
      if (cursoEditingId) {
        const atual = cursos.find((c) => c.id === cursoEditingId);
        const mudou = !atual || (Object.keys(payload) as (keyof typeof payload)[]).some((k) => String(atual[k] ?? '') !== String(payload[k] ?? ''));
        if (!mudou) {
          setMessage("Nenhuma alteração detectada.");
        } else {
          await atualizarCurso(cursoEditingId, payload, auditAutor);
          setMessage("Atualizado com sucesso!");
        }
      } else {
        await criarCurso(payload, auditAutor);
        setMessage("Cadastrado com sucesso!");
      }
      setCursoForm(emptyCgForm);
      setCursoEditingId(null);
      await loadCursos();
      setView("list");
      abrirNovoAposSalvar();
    } catch {
      setMessage("Erro ao salvar.");
    } finally {
      setCursoSubmitting(false);
    }
  }

  async function handleCursoDelete(id: string) {
    setMessage("");
    try {
      await excluirCurso(id);
      setMessage("Excluído com sucesso!");
      await loadCursos();
    } catch {
      setMessage("Erro ao excluir.");
    }
    if (view === 'form') goToCursoList();
  }

  /* ── Estrutura Acadêmica > Disciplinas ── */
  const filteredSortedDisciplinas = useMemo(() => {
    const filtro = appliedDisciplinaFilterForm;
    const lista = disciplinas.filter((c) => {
      if (filtro.nr_sequencia && String(c.nr_sequencia) !== filtro.nr_sequencia.trim()) return false;
      if (filtro.descricao && !String(c.ds_disciplina ?? '').toLowerCase().includes(filtro.descricao.toLowerCase())) return false;
      return true;
    });
    if (disciplinaSortColumn === null || disciplinaSortAsc === null) {
      // Ordem padrão: coluna # decrescente (mais recente primeiro).
      return lista.sort((a, b) => Number(b.nr_sequencia) - Number(a.nr_sequencia));
    }
    const key = DISCIPLINA_COLUMNS[disciplinaSortColumn].key;
    return lista.sort((a, b) => {
      const valA = a[key];
      const valB = b[key];
      if (typeof valA === 'number' && typeof valB === 'number') return disciplinaSortAsc ? valA - valB : valB - valA;
      const strA = String(valA ?? '').toLowerCase();
      const strB = String(valB ?? '').toLowerCase();
      if (strA < strB) return disciplinaSortAsc ? -1 : 1;
      if (strA > strB) return disciplinaSortAsc ? 1 : -1;
      return 0;
    });
  }, [disciplinas, appliedDisciplinaFilterForm, disciplinaSortColumn, disciplinaSortAsc]);

  const currentDisciplinaEditIndex = disciplinaEditingId ? filteredSortedDisciplinas.findIndex((c) => c.id === disciplinaEditingId) : -1;
  const hasPrevDisciplinaRecord = currentDisciplinaEditIndex > 0;
  const hasNextDisciplinaRecord = currentDisciplinaEditIndex >= 0 && currentDisciplinaEditIndex < filteredSortedDisciplinas.length - 1;

  function handleDisciplinaSortChange(logicalIndex: number) {
    if (disciplinaSortColumn === logicalIndex) {
      if (disciplinaSortAsc) {
        setDisciplinaSortAsc(false);
      } else {
        setDisciplinaSortColumn(null);
        setDisciplinaSortAsc(null);
      }
    } else {
      setDisciplinaSortColumn(logicalIndex);
      setDisciplinaSortAsc(true);
    }
  }

  // Botão "Adicionar": sem a permissão, mostra aviso.
  function handleDisciplinaNewForm() {
    if (!permissoesEA.adicionarDisciplina) {
      setMessage("Você não tem permissão para adicionar.");
      return;
    }
    setDisciplinaForm(emptyCgForm);
    setDisciplinaEditingId(null);
    setDisciplinaAuditInfo({ createdAt: '', updatedAt: '', createdBy: '', updatedBy: '' });
    setMessage("");
    setDisciplinaCampoErros([]);
    setView("form");
    setActiveSection("estruturaAcademica");
  }

  async function carregarAutorAuditoriaDisciplina(id: string) {
    try {
      const logs = await fetchAuditByDocumentId('disciplina', id);
      if (auditDisciplinaIdRef.current !== id) return;
      const createLog = logs.find((l) => String(l.acao ?? '').toLowerCase() === 'create');
      const lastChangeLog = logs.find((l) => String(l.acao ?? '').toLowerCase() === 'update');
      setDisciplinaAuditInfo((prev) => ({
        ...prev,
        createdBy: createLog?.usuarioNome ?? prev.createdBy,
        updatedBy: lastChangeLog?.usuarioNome ?? prev.updatedBy,
      }));
    } catch {
      // mantém vazio em caso de falha
    }
  }

  function openDisciplinaEditForm(disciplina: Disciplina) {
    setDisciplinaForm({
      descricao: disciplina.ds_disciplina ?? '',
      ie_status: 'A',
      nr_cbo: '',
      sg_sigla: '',
      ds_observacao: disciplina.ds_observacao ?? '',
    });
    setDisciplinaEditingId(disciplina.id ?? null);
    setDisciplinaAuditInfo({
      createdAt: disciplina.dt_criacao ?? '',
      updatedAt: disciplina.dt_alteracao ?? '',
      createdBy: disciplina.ds_usuario_criacao ?? '',
      updatedBy: disciplina.ds_usuario_alteracao ?? '',
    });
    auditDisciplinaIdRef.current = disciplina.id ?? null;
    setMessage("");
    setDisciplinaCampoErros([]);
    setView("form");
    setActiveSection("estruturaAcademica");
    if (disciplina.id) carregarAutorAuditoriaDisciplina(disciplina.id);
  }

  function goToDisciplinaList() {
    setDisciplinaForm(emptyCgForm);
    setDisciplinaEditingId(null);
    setMessage("");
    setView("list");
    setActiveSection("estruturaAcademica");
  }

  function goToPrevDisciplinaRecord() {
    const anterior = hasPrevDisciplinaRecord ? filteredSortedDisciplinas[currentDisciplinaEditIndex - 1] : undefined;
    if (anterior) openDisciplinaEditForm(anterior);
  }

  function goToNextDisciplinaRecord() {
    const proximo = hasNextDisciplinaRecord ? filteredSortedDisciplinas[currentDisciplinaEditIndex + 1] : undefined;
    if (proximo) openDisciplinaEditForm(proximo);
  }

  async function openDisciplinaAuditModal(disciplinaId?: string | null) {
    if (!disciplinaId) return;
    setAuditDocumentType('disciplina');
    setAuditModalOpen(true);
    setAuditLoading(true);
    try {
      setAuditLogs(await fetchAuditByDocumentId('disciplina', disciplinaId));
    } catch {
      setAuditLogs([]);
    } finally {
      setAuditLoading(false);
    }
  }

  function openDisciplinaFilterModal() {
    setDisciplinaFilterForm(appliedDisciplinaFilterForm);
    setDisciplinaFilterModalOpen(true);
  }

  function clearDisciplinaFilter() {
    setDisciplinaFilterForm({ nr_sequencia: '', descricao: '', ie_status: 'T' });
    setAppliedDisciplinaFilterForm({ nr_sequencia: '', descricao: '', ie_status: 'T' });
  }

  function handleDisciplinaFilterSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAppliedDisciplinaFilterForm({ ...disciplinaFilterForm, ie_status: disciplinaFilterForm.ie_status || 'T' });
    setDisciplinaFilterModalOpen(false);
  }

  async function handleDisciplinaSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (disciplinaEditingId && bloquearEdicaoSemPermissao(permissoesEA.editarDisciplina)) return;
    setMessage("");
    const payload = {
      ds_disciplina: disciplinaForm.descricao,
      ds_observacao: disciplinaForm.ds_observacao ?? '',
    };
    // Campos obrigatórios (perfil ativo) precisam estar preenchidos.
    const faltantes = camposObrigatoriosVazios(payload, campoRegrasDaColecao(campoRegrasAtivas, 'disciplina'));
    if (faltantes.length > 0) {
      setDisciplinaCampoErros(faltantes);
      setMessage("Preencha os campos obrigatórios.");
      return;
    }
    setDisciplinaCampoErros([]);
    setDisciplinaSubmitting(true);
    try {
      if (disciplinaEditingId) {
        const atual = disciplinas.find((c) => c.id === disciplinaEditingId);
        const mudou = !atual || (Object.keys(payload) as (keyof typeof payload)[]).some((k) => String(atual[k] ?? '') !== String(payload[k] ?? ''));
        if (!mudou) {
          setMessage("Nenhuma alteração detectada.");
        } else {
          await atualizarDisciplina(disciplinaEditingId, payload, auditAutor);
          setMessage("Atualizado com sucesso!");
        }
      } else {
        await criarDisciplina(payload, auditAutor);
        setMessage("Cadastrado com sucesso!");
      }
      setDisciplinaForm(emptyCgForm);
      setDisciplinaEditingId(null);
      await loadDisciplinas();
      setView("list");
      abrirNovoAposSalvar();
    } catch {
      setMessage("Erro ao salvar.");
    } finally {
      setDisciplinaSubmitting(false);
    }
  }

  async function handleDisciplinaDelete(id: string) {
    setMessage("");
    try {
      await excluirDisciplina(id);
      setMessage("Excluído com sucesso!");
      await loadDisciplinas();
    } catch {
      setMessage("Erro ao excluir.");
    }
    if (view === 'form') goToDisciplinaList();
  }

  /** Descrição de uma referência da turma (Curso, Período letivo, Localização, Modalidade de ensino). */
  function descricaoReferenciaTurma(key: string, valor: unknown): string {
    if (valor === null || valor === undefined || valor === '') return '';
    const seq = Number(valor);
    if (key === 'nr_seq_curso') return cursos.find((c) => c.nr_sequencia === seq)?.ds_curso ?? '';
    if (key === 'nr_seq_periodo_letivo') return periodosLetivos.find((p) => p.nr_sequencia === seq)?.ds_periodo_letivo ?? '';
    if (key === 'nr_seq_localizacao') return localizacoes.find((l) => l.nr_sequencia === seq)?.ds_localizacao ?? '';
    if (key === 'nr_seq_modalidade_ensino') return modalidadesEnsino.find((m) => m.nr_sequencia === seq)?.ds_modalidade_ensino ?? '';
    return String(valor);
  }

  /** Célula da lista de Turmas: referências pela descrição; o resto como nos Cadastros Gerais. */
  function formatTurmaCellValue(key: string, value: unknown): string {
    if ((TURMA_COLUNAS_REFERENCIA as readonly string[]).includes(key)) return descricaoReferenciaTurma(key, value);
    return formatCadastroGeralCellValue(key, value);
  }

  /* ── Estrutura Acadêmica > Turmas ── */
  const filteredSortedTurmas = useMemo(() => {
    const filtro = appliedTurmaFilterForm;
    const lista = turmas.filter((c) => {
      if (filtro.nr_sequencia && String(c.nr_sequencia) !== filtro.nr_sequencia.trim()) return false;
      if (filtro.descricao && !String(c.ds_turma ?? '').toLowerCase().includes(filtro.descricao.toLowerCase())) return false;
      if (turmaFiltroExtraAplicado.nr_seq_curso && String(c.nr_seq_curso ?? '') !== turmaFiltroExtraAplicado.nr_seq_curso) return false;
      if (turmaFiltroExtraAplicado.nr_seq_periodo_letivo && String(c.nr_seq_periodo_letivo ?? '') !== turmaFiltroExtraAplicado.nr_seq_periodo_letivo) return false;
      return true;
    });
    if (turmaSortColumn === null || turmaSortAsc === null) {
      // Ordem padrão: coluna # decrescente (mais recente primeiro).
      return lista.sort((a, b) => Number(b.nr_sequencia) - Number(a.nr_sequencia));
    }
    const key = TURMA_COLUMNS[turmaSortColumn].key;
    return lista.sort((a, b) => {
      // Referências (Curso, Período letivo...) ordenam pela descrição exibida.
      const valA = (TURMA_COLUNAS_REFERENCIA as readonly string[]).includes(key) ? descricaoReferenciaTurma(key, a[key]) : a[key];
      const valB = (TURMA_COLUNAS_REFERENCIA as readonly string[]).includes(key) ? descricaoReferenciaTurma(key, b[key]) : b[key];
      if (typeof valA === 'number' && typeof valB === 'number') return turmaSortAsc ? valA - valB : valB - valA;
      const strA = String(valA ?? '').toLowerCase();
      const strB = String(valB ?? '').toLowerCase();
      if (strA < strB) return turmaSortAsc ? -1 : 1;
      if (strA > strB) return turmaSortAsc ? 1 : -1;
      return 0;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turmas, appliedTurmaFilterForm, turmaFiltroExtraAplicado, turmaSortColumn, turmaSortAsc, cursos, periodosLetivos, localizacoes, modalidadesEnsino]);

  const currentTurmaEditIndex = turmaEditingId ? filteredSortedTurmas.findIndex((c) => c.id === turmaEditingId) : -1;
  const hasPrevTurmaRecord = currentTurmaEditIndex > 0;
  const hasNextTurmaRecord = currentTurmaEditIndex >= 0 && currentTurmaEditIndex < filteredSortedTurmas.length - 1;

  function handleTurmaSortChange(logicalIndex: number) {
    if (turmaSortColumn === logicalIndex) {
      if (turmaSortAsc) {
        setTurmaSortAsc(false);
      } else {
        setTurmaSortColumn(null);
        setTurmaSortAsc(null);
      }
    } else {
      setTurmaSortColumn(logicalIndex);
      setTurmaSortAsc(true);
    }
  }

  // Botão "Adicionar": sem a permissão, mostra aviso.
  function handleTurmaNewForm() {
    if (!permissoesEA.adicionarTurma) {
      setMessage("Você não tem permissão para adicionar.");
      return;
    }
    setTurmaForm(emptyCgForm);
    setTurmaExtra(TURMA_CAMPOS_VAZIOS);
    setTurmaEditingId(null);
    setTurmaAuditInfo({ createdAt: '', updatedAt: '', createdBy: '', updatedBy: '' });
    setMessage("");
    setTurmaCampoErros([]);
    setView("form");
    setActiveSection("estruturaAcademica");
  }

  async function carregarAutorAuditoriaTurma(id: string) {
    try {
      const logs = await fetchAuditByDocumentId('turma', id);
      if (auditTurmaIdRef.current !== id) return;
      const createLog = logs.find((l) => String(l.acao ?? '').toLowerCase() === 'create');
      const lastChangeLog = logs.find((l) => String(l.acao ?? '').toLowerCase() === 'update');
      setTurmaAuditInfo((prev) => ({
        ...prev,
        createdBy: createLog?.usuarioNome ?? prev.createdBy,
        updatedBy: lastChangeLog?.usuarioNome ?? prev.updatedBy,
      }));
    } catch {
      // mantém vazio em caso de falha
    }
  }

  function openTurmaEditForm(turma: Turma) {
    setTurmaForm({
      descricao: turma.ds_turma ?? '',
      ie_status: 'A',
      nr_cbo: '',
      sg_sigla: '',
      ds_observacao: '',
    });
    setTurmaExtra({
      nr_seq_curso: turma.nr_seq_curso != null ? String(turma.nr_seq_curso) : '',
      nr_seq_periodo_letivo: turma.nr_seq_periodo_letivo != null ? String(turma.nr_seq_periodo_letivo) : '',
      qt_max_alunos: turma.qt_max_alunos != null ? String(turma.qt_max_alunos) : '',
      nr_seq_localizacao: turma.nr_seq_localizacao != null ? String(turma.nr_seq_localizacao) : '',
      nr_seq_modalidade_ensino: turma.nr_seq_modalidade_ensino != null ? String(turma.nr_seq_modalidade_ensino) : '',
    });
    setTurmaEditingId(turma.id ?? null);
    setTurmaAuditInfo({
      createdAt: turma.dt_criacao ?? '',
      updatedAt: turma.dt_alteracao ?? '',
      createdBy: turma.ds_usuario_criacao ?? '',
      updatedBy: turma.ds_usuario_alteracao ?? '',
    });
    auditTurmaIdRef.current = turma.id ?? null;
    setMessage("");
    setTurmaCampoErros([]);
    setView("form");
    setActiveSection("estruturaAcademica");
    if (turma.id) carregarAutorAuditoriaTurma(turma.id);
  }

  function goToTurmaList() {
    setTurmaForm(emptyCgForm);
    setTurmaExtra(TURMA_CAMPOS_VAZIOS);
    setTurmaEditingId(null);
    setMessage("");
    setView("list");
    setActiveSection("estruturaAcademica");
  }

  function goToPrevTurmaRecord() {
    const anterior = hasPrevTurmaRecord ? filteredSortedTurmas[currentTurmaEditIndex - 1] : undefined;
    if (anterior) openTurmaEditForm(anterior);
  }

  function goToNextTurmaRecord() {
    const proximo = hasNextTurmaRecord ? filteredSortedTurmas[currentTurmaEditIndex + 1] : undefined;
    if (proximo) openTurmaEditForm(proximo);
  }

  async function openTurmaAuditModal(turmaId?: string | null) {
    if (!turmaId) return;
    setAuditDocumentType('turma');
    setAuditModalOpen(true);
    setAuditLoading(true);
    try {
      setAuditLogs(await fetchAuditByDocumentId('turma', turmaId));
    } catch {
      setAuditLogs([]);
    } finally {
      setAuditLoading(false);
    }
  }

  function openTurmaFilterModal() {
    setTurmaFilterForm(appliedTurmaFilterForm);
    setTurmaFiltroExtra(turmaFiltroExtraAplicado);
    setTurmaFilterModalOpen(true);
  }

  function clearTurmaFilter() {
    setTurmaFilterForm({ nr_sequencia: '', descricao: '', ie_status: 'T' });
    setAppliedTurmaFilterForm({ nr_sequencia: '', descricao: '', ie_status: 'T' });
    setTurmaFiltroExtra({ nr_seq_curso: '', nr_seq_periodo_letivo: '' });
    setTurmaFiltroExtraAplicado({ nr_seq_curso: '', nr_seq_periodo_letivo: '' });
  }

  function handleTurmaFilterSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAppliedTurmaFilterForm({ ...turmaFilterForm, ie_status: turmaFilterForm.ie_status || 'T' });
    setTurmaFiltroExtraAplicado(turmaFiltroExtra);
    setTurmaFilterModalOpen(false);
  }

  async function handleTurmaSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (turmaEditingId && bloquearEdicaoSemPermissao(permissoesEA.editarTurma)) return;
    setMessage("");
    const numero = (v: string) => (v.trim() === '' ? null : Number(v));
    const payload = {
      ds_turma: turmaForm.descricao,
      nr_seq_curso: numero(turmaExtra.nr_seq_curso),
      nr_seq_periodo_letivo: numero(turmaExtra.nr_seq_periodo_letivo),
      qt_max_alunos: numero(turmaExtra.qt_max_alunos),
      nr_seq_localizacao: numero(turmaExtra.nr_seq_localizacao),
      nr_seq_modalidade_ensino: numero(turmaExtra.nr_seq_modalidade_ensino),
    };
    // Campos obrigatórios (perfil ativo) precisam estar preenchidos.
    const faltantes = camposObrigatoriosVazios(payload, campoRegrasDaColecao(campoRegrasAtivas, 'turma'));
    if (faltantes.length > 0) {
      setTurmaCampoErros(faltantes);
      setMessage("Preencha os campos obrigatórios.");
      return;
    }
    setTurmaCampoErros([]);
    setTurmaSubmitting(true);
    try {
      if (turmaEditingId) {
        const atual = turmas.find((c) => c.id === turmaEditingId);
        const mudou = !atual || (Object.keys(payload) as (keyof typeof payload)[]).some((k) => String(atual[k] ?? '') !== String(payload[k] ?? ''));
        if (!mudou) {
          setMessage("Nenhuma alteração detectada.");
        } else {
          await atualizarTurma(turmaEditingId, payload as Partial<Turma>, auditAutor);
          setMessage("Atualizado com sucesso!");
        }
      } else {
        await criarTurma(payload as unknown as Omit<Turma, 'id' | 'nr_sequencia' | 'dt_criacao' | 'dt_alteracao' | 'ds_usuario_criacao' | 'ds_usuario_alteracao'>, auditAutor);
        setMessage("Cadastrado com sucesso!");
      }
      setTurmaForm(emptyCgForm);
      setTurmaExtra(TURMA_CAMPOS_VAZIOS);
      setTurmaEditingId(null);
      await loadTurmas();
      setView("list");
      abrirNovoAposSalvar();
    } catch {
      setMessage("Erro ao salvar.");
    } finally {
      setTurmaSubmitting(false);
    }
  }

  async function handleTurmaDelete(id: string) {
    setMessage("");
    try {
      await excluirTurma(id);
      setMessage("Excluído com sucesso!");
      await loadTurmas();
    } catch {
      setMessage("Erro ao excluir.");
    }
    if (view === 'form') goToTurmaList();
  }

  /* ── Estrutura Acadêmica > Turmas x Disciplinas ── */
  /** Descrição de uma referência de Turmas x Disciplinas (Turma, Disciplina). */
  function descricaoReferenciaTurmaDisciplina(key: string, valor: unknown): string {
    if (valor === null || valor === undefined || valor === '') return '';
    const seq = Number(valor);
    if (key === 'nr_seq_turma') return turmas.find((t) => t.nr_sequencia === seq)?.ds_turma ?? '';
    if (key === 'nr_seq_disciplina') return disciplinas.find((d) => d.nr_sequencia === seq)?.ds_disciplina ?? '';
    if (key === 'nr_seq_periodo_letivo' || key === 'nr_seq_curso' || key === 'nr_seq_modalidade_ensino') return descricaoReferenciaTurma(key, seq);
    return String(valor);
  }

  /** Período letivo, Curso e Modalidade de ensino da turma informada (só exibição; não são de turma_disciplina). */
  function camposDaTurmaDisciplina(nrSeqTurma: unknown): Pick<TurmaDisciplina, 'nr_seq_periodo_letivo' | 'nr_seq_curso' | 'nr_seq_modalidade_ensino'> {
    const seq = nrSeqTurma === null || nrSeqTurma === undefined || nrSeqTurma === '' ? NaN : Number(nrSeqTurma);
    const turma = Number.isNaN(seq) ? undefined : turmas.find((t) => t.nr_sequencia === seq);
    return {
      nr_seq_periodo_letivo: turma?.nr_seq_periodo_letivo ?? undefined,
      nr_seq_curso: turma?.nr_seq_curso ?? undefined,
      nr_seq_modalidade_ensino: turma?.nr_seq_modalidade_ensino ?? undefined,
    };
  }

  /** Célula da lista: Turma e Disciplina pela descrição; o resto como nos Cadastros Gerais. */
  function formatTurmaDisciplinaCellValue(key: string, value: unknown): string {
    if ((TURMA_DISCIPLINA_COLUNAS_REFERENCIA as readonly string[]).includes(key)) return descricaoReferenciaTurmaDisciplina(key, value);
    return formatCadastroGeralCellValue(key, value);
  }

  const filteredSortedTurmasDisciplinas = useMemo(() => {
    const filtro = appliedTurmaDisciplinaFilterForm;
    const extra = turmaDisciplinaFiltroExtraAplicado;
    // Período letivo, Curso e Modalidade de ensino vêm da turma de cada registro.
    const lista = turmasDisciplinas.map((td) => ({ ...td, ...camposDaTurmaDisciplina(td.nr_seq_turma) })).filter((td) => {
      if (filtro.nr_sequencia && String(td.nr_sequencia) !== filtro.nr_sequencia.trim()) return false;
      if (filtro.ie_status && filtro.ie_status !== 'T' && (td.ie_status ?? 'A') !== filtro.ie_status) return false;
      if (extra.nr_seq_turma && String(td.nr_seq_turma ?? '') !== extra.nr_seq_turma) return false;
      if (extra.nr_seq_disciplina && String(td.nr_seq_disciplina ?? '') !== extra.nr_seq_disciplina) return false;
      if (extra.nr_seq_periodo_letivo && String(td.nr_seq_periodo_letivo ?? '') !== extra.nr_seq_periodo_letivo) return false;
      return true;
    });
    if (turmaDisciplinaSortColumn === null || turmaDisciplinaSortAsc === null) {
      // Ordem padrão: coluna # decrescente (mais recente primeiro).
      return lista.sort((a, b) => Number(b.nr_sequencia) - Number(a.nr_sequencia));
    }
    const key = TURMA_DISCIPLINA_COLUMNS[turmaDisciplinaSortColumn].key;
    const referencia = (TURMA_DISCIPLINA_COLUNAS_REFERENCIA as readonly string[]).includes(key);
    return lista.sort((a, b) => {
      // Turma e Disciplina ordenam pela descrição exibida.
      const valA = referencia ? descricaoReferenciaTurmaDisciplina(key, a[key]) : a[key];
      const valB = referencia ? descricaoReferenciaTurmaDisciplina(key, b[key]) : b[key];
      if (typeof valA === 'number' && typeof valB === 'number') return turmaDisciplinaSortAsc ? valA - valB : valB - valA;
      const strA = String(valA ?? '').toLowerCase();
      const strB = String(valB ?? '').toLowerCase();
      if (strA < strB) return turmaDisciplinaSortAsc ? -1 : 1;
      if (strA > strB) return turmaDisciplinaSortAsc ? 1 : -1;
      return 0;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turmasDisciplinas, appliedTurmaDisciplinaFilterForm, turmaDisciplinaFiltroExtraAplicado, turmaDisciplinaSortColumn, turmaDisciplinaSortAsc, turmas, disciplinas, cursos, periodosLetivos, modalidadesEnsino]);

  const currentTurmaDisciplinaEditIndex = turmaDisciplinaEditingId ? filteredSortedTurmasDisciplinas.findIndex((td) => td.id === turmaDisciplinaEditingId) : -1;
  const hasPrevTurmaDisciplinaRecord = currentTurmaDisciplinaEditIndex > 0;
  const hasNextTurmaDisciplinaRecord = currentTurmaDisciplinaEditIndex >= 0 && currentTurmaDisciplinaEditIndex < filteredSortedTurmasDisciplinas.length - 1;

  function handleTurmaDisciplinaSortChange(logicalIndex: number) {
    if (turmaDisciplinaSortColumn === logicalIndex) {
      if (turmaDisciplinaSortAsc) {
        setTurmaDisciplinaSortAsc(false);
      } else {
        setTurmaDisciplinaSortColumn(null);
        setTurmaDisciplinaSortAsc(null);
      }
    } else {
      setTurmaDisciplinaSortColumn(logicalIndex);
      setTurmaDisciplinaSortAsc(true);
    }
  }

  // Botão "Adicionar": sem a permissão, mostra aviso.
  function handleTurmaDisciplinaNewForm() {
    if (!permissoesEA.adicionarTurmaDisciplina) {
      setMessage("Você não tem permissão para adicionar.");
      return;
    }
    setTurmaDisciplinaForm(emptyCgForm);
    setTurmaDisciplinaExtra(TURMA_DISCIPLINA_CAMPOS_VAZIOS);
    setTurmaDisciplinaEditingId(null);
    setTurmaDisciplinaAuditInfo({ createdAt: '', updatedAt: '', createdBy: '', updatedBy: '' });
    setMessage("");
    setTurmaDisciplinaCampoErros([]);
    setView("form");
    setActiveSection("estruturaAcademica");
  }

  async function carregarAutorAuditoriaTurmaDisciplina(id: string) {
    try {
      const logs = await fetchAuditByDocumentId('turma_disciplina', id);
      if (auditTurmaDisciplinaIdRef.current !== id) return;
      const createLog = logs.find((l) => String(l.acao ?? '').toLowerCase() === 'create');
      const lastChangeLog = logs.find((l) => String(l.acao ?? '').toLowerCase() === 'update');
      setTurmaDisciplinaAuditInfo((prev) => ({
        ...prev,
        createdBy: createLog?.usuarioNome ?? prev.createdBy,
        updatedBy: lastChangeLog?.usuarioNome ?? prev.updatedBy,
      }));
    } catch {
      // mantém vazio em caso de falha
    }
  }

  function openTurmaDisciplinaEditForm(td: TurmaDisciplina) {
    setTurmaDisciplinaForm({ ...emptyCgForm, ie_status: td.ie_status || 'A' });
    setTurmaDisciplinaExtra({
      nr_seq_turma: td.nr_seq_turma != null ? String(td.nr_seq_turma) : '',
      nr_seq_disciplina: td.nr_seq_disciplina != null ? String(td.nr_seq_disciplina) : '',
    });
    setTurmaDisciplinaEditingId(td.id ?? null);
    setTurmaDisciplinaAuditInfo({
      createdAt: td.dt_criacao ?? '',
      updatedAt: td.dt_alteracao ?? '',
      createdBy: td.ds_usuario_criacao ?? '',
      updatedBy: td.ds_usuario_alteracao ?? '',
    });
    auditTurmaDisciplinaIdRef.current = td.id ?? null;
    setMessage("");
    setTurmaDisciplinaCampoErros([]);
    setView("form");
    setActiveSection("estruturaAcademica");
    if (td.id) carregarAutorAuditoriaTurmaDisciplina(td.id);
  }

  function goToTurmaDisciplinaList() {
    setTurmaDisciplinaForm(emptyCgForm);
    setTurmaDisciplinaExtra(TURMA_DISCIPLINA_CAMPOS_VAZIOS);
    setTurmaDisciplinaEditingId(null);
    setMessage("");
    setView("list");
    setActiveSection("estruturaAcademica");
  }

  function goToPrevTurmaDisciplinaRecord() {
    const anterior = hasPrevTurmaDisciplinaRecord ? filteredSortedTurmasDisciplinas[currentTurmaDisciplinaEditIndex - 1] : undefined;
    if (anterior) openTurmaDisciplinaEditForm(anterior);
  }

  function goToNextTurmaDisciplinaRecord() {
    const proximo = hasNextTurmaDisciplinaRecord ? filteredSortedTurmasDisciplinas[currentTurmaDisciplinaEditIndex + 1] : undefined;
    if (proximo) openTurmaDisciplinaEditForm(proximo);
  }

  async function openTurmaDisciplinaAuditModal(id?: string | null) {
    if (!id) return;
    setAuditDocumentType('turma_disciplina');
    setAuditModalOpen(true);
    setAuditLoading(true);
    try {
      setAuditLogs(await fetchAuditByDocumentId('turma_disciplina', id));
    } catch {
      setAuditLogs([]);
    } finally {
      setAuditLoading(false);
    }
  }

  function openTurmaDisciplinaFilterModal() {
    setTurmaDisciplinaFilterForm(appliedTurmaDisciplinaFilterForm);
    setTurmaDisciplinaFiltroExtra(turmaDisciplinaFiltroExtraAplicado);
    setTurmaDisciplinaFilterModalOpen(true);
  }

  function clearTurmaDisciplinaFilter() {
    setTurmaDisciplinaFilterForm({ nr_sequencia: '', descricao: '', ie_status: 'T' });
    setAppliedTurmaDisciplinaFilterForm({ nr_sequencia: '', descricao: '', ie_status: 'T' });
    setTurmaDisciplinaFiltroExtra(TURMA_DISCIPLINA_FILTRO_VAZIO);
    setTurmaDisciplinaFiltroExtraAplicado(TURMA_DISCIPLINA_FILTRO_VAZIO);
  }

  function handleTurmaDisciplinaFilterSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAppliedTurmaDisciplinaFilterForm({ ...turmaDisciplinaFilterForm, ie_status: turmaDisciplinaFilterForm.ie_status || 'T' });
    setTurmaDisciplinaFiltroExtraAplicado(turmaDisciplinaFiltroExtra);
    setTurmaDisciplinaFilterModalOpen(false);
  }

  async function handleTurmaDisciplinaSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (turmaDisciplinaEditingId && bloquearEdicaoSemPermissao(permissoesEA.editarTurmaDisciplina)) return;
    setMessage("");
    const numero = (v: string) => (v.trim() === '' ? null : Number(v));
    const payload = {
      nr_seq_turma: numero(turmaDisciplinaExtra.nr_seq_turma),
      nr_seq_disciplina: numero(turmaDisciplinaExtra.nr_seq_disciplina),
      ie_status: turmaDisciplinaForm.ie_status || 'A',
    };
    // Campos obrigatórios (perfil ativo) precisam estar preenchidos.
    const faltantes = camposObrigatoriosVazios(payload, campoRegrasDaColecao(campoRegrasAtivas, 'turma_disciplina'));
    if (faltantes.length > 0) {
      setTurmaDisciplinaCampoErros(faltantes);
      setMessage("Preencha os campos obrigatórios.");
      return;
    }
    // Turma e Disciplina digitadas precisam existir.
    const invalidos = [
      payload.nr_seq_turma != null && !turmas.some((t) => t.nr_sequencia === payload.nr_seq_turma) ? 'nr_seq_turma' : '',
      payload.nr_seq_disciplina != null && !disciplinas.some((d) => d.nr_sequencia === payload.nr_seq_disciplina) ? 'nr_seq_disciplina' : '',
    ].filter(Boolean);
    if (invalidos.length > 0) {
      setTurmaDisciplinaCampoErros(invalidos);
      setMessage(invalidos.includes('nr_seq_turma') ? "Turma não encontrada." : "Disciplina não encontrada.");
      return;
    }
    setTurmaDisciplinaCampoErros([]);
    setTurmaDisciplinaSubmitting(true);
    try {
      if (turmaDisciplinaEditingId) {
        const atual = turmasDisciplinas.find((td) => td.id === turmaDisciplinaEditingId);
        const mudou = !atual || (Object.keys(payload) as (keyof typeof payload)[]).some((k) => String(atual[k] ?? '') !== String(payload[k] ?? ''));
        if (!mudou) {
          setMessage("Nenhuma alteração detectada.");
        } else {
          await atualizarTurmaDisciplina(turmaDisciplinaEditingId, payload as Partial<TurmaDisciplina>, auditAutor);
          setMessage("Atualizado com sucesso!");
        }
      } else {
        await criarTurmaDisciplina(payload as unknown as Omit<TurmaDisciplina, 'id' | 'nr_sequencia' | 'dt_criacao' | 'dt_alteracao' | 'ds_usuario_criacao' | 'ds_usuario_alteracao'>, auditAutor);
        setMessage("Cadastrado com sucesso!");
      }
      setTurmaDisciplinaForm(emptyCgForm);
      setTurmaDisciplinaExtra(TURMA_DISCIPLINA_CAMPOS_VAZIOS);
      setTurmaDisciplinaEditingId(null);
      await loadTurmasDisciplinas();
      setView("list");
      abrirNovoAposSalvar();
    } catch {
      setMessage("Erro ao salvar.");
    } finally {
      setTurmaDisciplinaSubmitting(false);
    }
  }

  async function handleTurmaDisciplinaDelete(id: string) {
    setMessage("");
    try {
      await excluirTurmaDisciplina(id);
      setMessage("Excluído com sucesso!");
      await loadTurmasDisciplinas();
    } catch {
      setMessage("Erro ao excluir.");
    }
    if (view === 'form') goToTurmaDisciplinaList();
  }

  /* ── Controle de Cópias > Cópias ── */
  /** "[turma] x [disciplina]" de um registro de Turmas x Disciplinas. */
  function descricaoTurmaDisciplinaPorSeq(seq: number): string {
    const td = turmasDisciplinas.find((t) => t.nr_sequencia === seq);
    if (!td) return '';
    const turma = turmas.find((t) => t.nr_sequencia === td.nr_seq_turma)?.ds_turma ?? '';
    const disciplina = disciplinas.find((d) => d.nr_sequencia === td.nr_seq_disciplina)?.ds_disciplina ?? '';
    return [turma, disciplina].filter(Boolean).join(' x ') || `#${seq}`;
  }

  /** Descrição de uma referência da cópia (Solicitante, Turma x Disciplina, Formato e Tipo de papel). */
  function descricaoReferenciaCopia(key: string, valor: unknown): string {
    if (valor === null || valor === undefined || valor === '') return '';
    const seq = Number(valor);
    if (key === 'nr_seq_solicitante') return nomeColaboradorPorSeq(seq);
    if (key === 'nr_seq_turma_disciplina') return descricaoTurmaDisciplinaPorSeq(seq);
    if (key === 'nr_seq_formato_papel') return formatosPapel.find((f) => f.nr_sequencia === seq)?.ds_formato_papel ?? '';
    if (key === 'nr_seq_tipo_papel') return tiposPapel.find((t) => t.nr_sequencia === seq)?.ds_tipo_papel ?? '';
    return String(valor);
  }

  /** Célula da lista: referências pela descrição; Sim/Não, nome do arquivo e o resto como nos Cadastros Gerais. */
  function formatCopiaListaCellValue(key: string, value: unknown): string {
    if ((COPIA_COLUNAS_REFERENCIA as readonly string[]).includes(key)) return descricaoReferenciaCopia(key, value);
    return formatCopiaCellValue(key, value);
  }

  const filteredSortedCopias = useMemo(() => {
    const filtro = appliedCopiaFilterForm;
    const extra = copiaFiltroExtraAplicado;
    const lista = copias.filter((c) => {
      if (filtro.nr_sequencia && String(c.nr_sequencia) !== filtro.nr_sequencia.trim()) return false;
      if (extra.nr_seq_solicitante && String(c.nr_seq_solicitante ?? '') !== extra.nr_seq_solicitante) return false;
      if (extra.nr_seq_turma_disciplina && String(c.nr_seq_turma_disciplina ?? '') !== extra.nr_seq_turma_disciplina) return false;
      if (extra.nr_seq_formato_papel && String(c.nr_seq_formato_papel ?? '') !== extra.nr_seq_formato_papel) return false;
      if (extra.nr_seq_tipo_papel && String(c.nr_seq_tipo_papel ?? '') !== extra.nr_seq_tipo_papel) return false;
      if (extra.ie_status && (c.ie_status ?? '') !== extra.ie_status) return false;
      return true;
    });
    if (copiaSortColumn === null || copiaSortAsc === null) {
      // Ordem padrão: coluna # decrescente (mais recente primeiro).
      return lista.sort((a, b) => Number(b.nr_sequencia) - Number(a.nr_sequencia));
    }
    const key = COPIA_COLUMNS[copiaSortColumn].key;
    const referencia = (COPIA_COLUNAS_REFERENCIA as readonly string[]).includes(key);
    return lista.sort((a, b) => {
      // Referências ordenam pela descrição exibida.
      const valA = referencia ? descricaoReferenciaCopia(key, a[key]) : a[key];
      const valB = referencia ? descricaoReferenciaCopia(key, b[key]) : b[key];
      if (typeof valA === 'number' && typeof valB === 'number') return copiaSortAsc ? valA - valB : valB - valA;
      const strA = String(valA ?? '').toLowerCase();
      const strB = String(valB ?? '').toLowerCase();
      if (strA < strB) return copiaSortAsc ? -1 : 1;
      if (strA > strB) return copiaSortAsc ? 1 : -1;
      return 0;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [copias, appliedCopiaFilterForm, copiaFiltroExtraAplicado, copiaSortColumn, copiaSortAsc, colaboradores, pessoasFisicas, pessoasJuridicas, turmasDisciplinas, turmas, disciplinas, formatosPapel, tiposPapel]);

  const currentCopiaEditIndex = copiaEditingId ? filteredSortedCopias.findIndex((c) => c.id === copiaEditingId) : -1;
  const hasPrevCopiaRecord = currentCopiaEditIndex > 0;
  const hasNextCopiaRecord = currentCopiaEditIndex >= 0 && currentCopiaEditIndex < filteredSortedCopias.length - 1;

  function handleCopiaSortChange(logicalIndex: number) {
    if (copiaSortColumn === logicalIndex) {
      if (copiaSortAsc) {
        setCopiaSortAsc(false);
      } else {
        setCopiaSortColumn(null);
        setCopiaSortAsc(null);
      }
    } else {
      setCopiaSortColumn(logicalIndex);
      setCopiaSortAsc(true);
    }
  }

  // Botão "Adicionar": sem a permissão, mostra aviso.
  function handleCopiaNewForm() {
    if (!permissoesCC.adicionarCopia) {
      setMessage("Você não tem permissão para adicionar.");
      return;
    }
    setCopiaForm(emptyCgForm);
    // Parâmetro "'Data de recebimento' é automaticamente preenchido com a data atual".
    const hoje = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    // Parâmetros "'Formato do papel' padrão" e "'Tipo de papel' padrão": só se o cadastro ainda existe e está ativo.
    const ativoNaLista = (lista: { nr_sequencia: number; ie_status?: string }[], valor: string) =>
      valor !== '' && lista.some((item) => String(item.nr_sequencia) === valor && String(item.ie_status ?? 'A').toUpperCase() !== 'I') ? valor : '';
    setCopiaExtra({
      ...COPIA_CAMPOS_VAZIOS,
      ...(recebimentoAutomaticoCopia ? { dt_recebimento: `${pad(hoje.getDate())}/${pad(hoje.getMonth() + 1)}/${hoje.getFullYear()}` } : {}),
      nr_seq_formato_papel: ativoNaLista(formatosPapel, papelPadraoCopia.nr_seq_formato_papel),
      nr_seq_tipo_papel: ativoNaLista(tiposPapel, papelPadraoCopia.nr_seq_tipo_papel),
    });
    setCopiaArquivoNovo(null);
    setCopiaEditingId(null);
    setCopiaAuditInfo({ createdAt: '', updatedAt: '', createdBy: '', updatedBy: '' });
    setMessage("");
    setCopiaCampoErros([]);
    setView("form");
    setActiveSection("controleCopias");
  }

  async function carregarAutorAuditoriaCopia(id: string) {
    try {
      const logs = await fetchAuditByDocumentId('copia', id);
      if (auditCopiaIdRef.current !== id) return;
      const createLog = logs.find((l) => String(l.acao ?? '').toLowerCase() === 'create');
      const lastChangeLog = logs.find((l) => String(l.acao ?? '').toLowerCase() === 'update');
      setCopiaAuditInfo((prev) => ({
        ...prev,
        createdBy: createLog?.usuarioNome ?? prev.createdBy,
        updatedBy: lastChangeLog?.usuarioNome ?? prev.updatedBy,
      }));
    } catch {
      // mantém vazio em caso de falha
    }
  }

  function openCopiaEditForm(c: Copia) {
    const texto = (v: number | undefined) => (v != null ? String(v) : '');
    setCopiaForm(emptyCgForm);
    setCopiaExtra({
      dt_recebimento: c.dt_recebimento ?? '',
      dt_impressao: c.dt_impressao ?? '',
      dt_entrega: c.dt_entrega ?? '',
      ie_status: c.ie_status ?? 'A',
      dt_status: c.dt_status ?? '',
      ds_motivo_status: c.ds_motivo_status ?? '',
      nr_seq_solicitante: texto(c.nr_seq_solicitante),
      nr_seq_turma_disciplina: texto(c.nr_seq_turma_disciplina),
      qt_copias: texto(c.qt_copias),
      qt_folhas: texto(c.qt_folhas),
      ie_frente_verso: c.ie_frente_verso === 'S' ? 'S' : 'N',
      ie_grampear: c.ie_grampear === 'S' ? 'S' : 'N',
      ie_guilhotinar: c.ie_guilhotinar === 'S' ? 'S' : 'N',
      nr_seq_formato_papel: texto(c.nr_seq_formato_papel),
      nr_seq_tipo_papel: texto(c.nr_seq_tipo_papel),
      ie_arquivo: c.ie_arquivo ?? '',
    });
    setCopiaArquivoNovo(null);
    setCopiaEditingId(c.id ?? null);
    setCopiaAuditInfo({
      createdAt: c.dt_criacao ?? '',
      updatedAt: c.dt_alteracao ?? '',
      createdBy: c.ds_usuario_criacao ?? '',
      updatedBy: c.ds_usuario_alteracao ?? '',
    });
    auditCopiaIdRef.current = c.id ?? null;
    setMessage("");
    setCopiaCampoErros([]);
    setView("form");
    setActiveSection("controleCopias");
    if (c.id) carregarAutorAuditoriaCopia(c.id);
  }

  function goToCopiaList() {
    setCopiaForm(emptyCgForm);
    setCopiaExtra(COPIA_CAMPOS_VAZIOS);
    setCopiaArquivoNovo(null);
    setCopiaEditingId(null);
    setMessage("");
    setView("list");
    setActiveSection("controleCopias");
  }

  function goToPrevCopiaRecord() {
    const anterior = hasPrevCopiaRecord ? filteredSortedCopias[currentCopiaEditIndex - 1] : undefined;
    if (anterior) openCopiaEditForm(anterior);
  }

  function goToNextCopiaRecord() {
    const proximo = hasNextCopiaRecord ? filteredSortedCopias[currentCopiaEditIndex + 1] : undefined;
    if (proximo) openCopiaEditForm(proximo);
  }

  async function openCopiaAuditModal(id?: string | null) {
    if (!id) return;
    setAuditDocumentType('copia');
    setAuditModalOpen(true);
    setAuditLoading(true);
    try {
      setAuditLogs(await fetchAuditByDocumentId('copia', id));
    } catch {
      setAuditLogs([]);
    } finally {
      setAuditLoading(false);
    }
  }

  function openCopiaFilterModal() {
    setCopiaFilterForm(appliedCopiaFilterForm);
    setCopiaFiltroExtra(copiaFiltroExtraAplicado);
    setCopiaFilterModalOpen(true);
  }

  function clearCopiaFilter() {
    setCopiaFilterForm({ nr_sequencia: '', descricao: '', ie_status: 'T' });
    setAppliedCopiaFilterForm({ nr_sequencia: '', descricao: '', ie_status: 'T' });
    setCopiaFiltroExtra(COPIA_FILTRO_VAZIO);
    setCopiaFiltroExtraAplicado(COPIA_FILTRO_VAZIO);
  }

  function handleCopiaFilterSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAppliedCopiaFilterForm({ ...copiaFilterForm, ie_status: 'T' });
    setCopiaFiltroExtraAplicado(copiaFiltroExtra);
    setCopiaFilterModalOpen(false);
  }

  async function handleCopiaSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (copiaEditingId && bloquearEdicaoSemPermissao(permissoesCC.editarCopia)) return;
    setMessage("");
    const numero = (v: string) => (v.trim() === '' ? null : Number(v));
    const data = (v: string) => (v.trim() === '' ? null : v.trim());
    const payload = {
      dt_recebimento: data(copiaExtra.dt_recebimento),
      dt_impressao: data(copiaExtra.dt_impressao),
      dt_entrega: data(copiaExtra.dt_entrega),
      nr_seq_solicitante: numero(copiaExtra.nr_seq_solicitante),
      nr_seq_turma_disciplina: numero(copiaExtra.nr_seq_turma_disciplina),
      qt_copias: numero(copiaExtra.qt_copias),
      qt_folhas: numero(copiaExtra.qt_folhas),
      ie_frente_verso: copiaExtra.ie_frente_verso === 'S' ? 'S' : 'N',
      ie_grampear: copiaExtra.ie_grampear === 'S' ? 'S' : 'N',
      ie_guilhotinar: copiaExtra.ie_guilhotinar === 'S' ? 'S' : 'N',
      nr_seq_formato_papel: numero(copiaExtra.nr_seq_formato_papel),
      nr_seq_tipo_papel: numero(copiaExtra.nr_seq_tipo_papel),
      ie_arquivo: copiaExtra.ie_arquivo.trim() === '' ? null : copiaExtra.ie_arquivo,
    };
    // Campos obrigatórios (perfil ativo) precisam estar preenchidos (o arquivo novo conta como preenchido).
    // Só valem os campos que o usuário consegue preencher no formulário: Data do status e
    // Motivo status vêm do "Alterar status" (sempre bloqueados aqui), e as datas de impressão
    // e de entrega só se abrem no cadastro com o status delas (Impresso / Entregue).
    const statusCopia = copiaEditingId ? (copias.find((c) => c.id === copiaEditingId)?.ie_status ?? copiaExtra.ie_status) : copiaExtra.ie_status;
    const naoEditaveis = new Set<string>(['dt_status', 'ds_motivo_status']);
    if (copiaEditingId || statusCopia !== 'I') naoEditaveis.add('dt_impressao');
    if (copiaEditingId || statusCopia !== 'E') naoEditaveis.add('dt_entrega');
    const regrasCopia = Object.fromEntries(
      Object.entries(campoRegrasDaColecao(campoRegrasAtivas, 'copia')).filter(([campo]) => !naoEditaveis.has(campo))
    );
    const faltantes = camposObrigatoriosVazios(
      { ...payload, ie_status: statusCopia, ie_arquivo: copiaArquivoNovo ? copiaArquivoNovo.name : payload.ie_arquivo },
      regrasCopia
    );
    if (faltantes.length > 0) {
      setCopiaCampoErros(faltantes);
      setMessage("Preencha os campos obrigatórios.");
      return;
    }
    // Datas digitadas precisam ser válidas.
    const datasErradas = datasInvalidas(payload, ['dt_recebimento', 'dt_impressao', 'dt_entrega']);
    if (datasErradas.length > 0) {
      setCopiaCampoErros(datasErradas as string[]);
      setMessage("Data inválida: informe no formato DD/MM/AAAA.");
      return;
    }
    // Solicitante e Turma x Disciplina digitados precisam existir.
    const invalidos = [
      payload.nr_seq_solicitante != null && !colaboradores.some((c) => c.nr_sequencia === payload.nr_seq_solicitante) ? 'nr_seq_solicitante' : '',
      payload.nr_seq_turma_disciplina != null && !turmasDisciplinas.some((td) => td.nr_sequencia === payload.nr_seq_turma_disciplina) ? 'nr_seq_turma_disciplina' : '',
    ].filter(Boolean);
    if (invalidos.length > 0) {
      setCopiaCampoErros(invalidos);
      setMessage(invalidos.includes('nr_seq_solicitante') ? "Solicitante não encontrado." : "Turma x Disciplina não encontrada.");
      return;
    }
    setCopiaCampoErros([]);
    setCopiaSubmitting(true);
    try {
      // Arquivo novo: vai ao Storage antes de gravar o registro.
      if (copiaArquivoNovo) {
        try {
          payload.ie_arquivo = await enviarArquivoCopia(copiaArquivoNovo);
        } catch (e) {
          setCopiaCampoErros(['ie_arquivo']);
          setMessage(e instanceof Error && e.message ? e.message : "Erro ao enviar o arquivo.");
          return;
        }
      }
      if (copiaEditingId) {
        const atual = copias.find((c) => c.id === copiaEditingId);
        const mudou = !atual || (Object.keys(payload) as (keyof typeof payload)[]).some((k) => String(atual[k] ?? '') !== String(payload[k] ?? ''));
        if (!mudou) {
          setMessage("Nenhuma alteração detectada.");
        } else {
          await atualizarCopia(copiaEditingId, payload as unknown as Partial<Copia>, auditAutor);
          setMessage("Atualizado com sucesso!");
        }
      } else {
        // O status só é escolhido no cadastro (depois, pelo "Alterar status").
        await criarCopia({ ...payload, ie_status: copiaExtra.ie_status || 'A' } as unknown as Omit<Copia, 'id' | 'nr_sequencia' | 'dt_criacao' | 'dt_alteracao' | 'ds_usuario_criacao' | 'ds_usuario_alteracao'>, auditAutor);
        setMessage("Cadastrado com sucesso!");
      }
      setCopiaForm(emptyCgForm);
      setCopiaExtra(COPIA_CAMPOS_VAZIOS);
      setCopiaArquivoNovo(null);
      setCopiaEditingId(null);
      await loadCopias();
      setView("list");
      abrirNovoAposSalvar();
    } catch {
      setMessage("Erro ao salvar.");
    } finally {
      setCopiaSubmitting(false);
    }
  }

  function openAlterarStatusCopiaModal(copia: Copia) {
    setModalCampoErros([]);
    setAlterarStatusCopia(copia);
    // Como em Colaboradores: a data vem com a de hoje; status e motivo começam vazios
    // (o status atual não fica disponível no dropdown).
    const hoje = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    setAlterarStatusCopiaForm({ dt_status: `${pad(hoje.getDate())}/${pad(hoje.getMonth() + 1)}/${hoje.getFullYear()}`, ie_status: '', ds_motivo_status: '' });
    setMessage("");
    setAlterarStatusCopiaModalOpen(true);
  }

  function closeAlterarStatusCopiaModal() {
    setAlterarStatusCopiaModalOpen(false);
    setAlterarStatusCopia(null);
  }

  async function handleAlterarStatusCopiaSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!alterarStatusCopia?.id) return;
    setMessage("");
    if (!alterarStatusCopiaForm.ie_status) {
      setMessage("Selecione um status.");
      return;
    }
    if (!validarCamposModal(MODAL_COPIA_ALTERAR_STATUS, alterarStatusCopiaForm)) return;
    if (datasInvalidas(alterarStatusCopiaForm, ['dt_status']).length > 0) {
      setMessage("Data inválida: informe no formato DD/MM/AAAA.");
      return;
    }
    setAlterarStatusCopiaSaving(true);
    try {
      // Impresso / Entregue também preenchem a Data da impressão / da entrega com a data do status.
      const datasDoStatus: Partial<Copia> =
        alterarStatusCopiaForm.ie_status === 'I' ? { dt_impressao: alterarStatusCopiaForm.dt_status }
        : alterarStatusCopiaForm.ie_status === 'E' ? { dt_entrega: alterarStatusCopiaForm.dt_status }
        : {};
      await atualizarCopia(alterarStatusCopia.id, {
        ie_status: alterarStatusCopiaForm.ie_status,
        dt_status: alterarStatusCopiaForm.dt_status,
        ds_motivo_status: alterarStatusCopiaForm.ds_motivo_status,
        ...datasDoStatus,
      }, auditAutor);
      setMessage("Status alterado com sucesso!");
      closeAlterarStatusCopiaModal();
      await loadCopias();
      // Formulário aberto no mesmo registro: mostra o novo status.
      if (view === 'form' && copiaEditingId === alterarStatusCopia.id) {
        setCopiaExtra((c) => ({ ...c, ie_status: alterarStatusCopiaForm.ie_status, dt_status: alterarStatusCopiaForm.dt_status, ds_motivo_status: alterarStatusCopiaForm.ds_motivo_status, ...(datasDoStatus as Partial<CopiaCamposForm>) }));
      }
    } catch {
      setMessage("Erro ao alterar o status.");
    } finally {
      setAlterarStatusCopiaSaving(false);
    }
  }

  async function handleCopiaDelete(id: string) {
    setMessage("");
    try {
      await excluirCopia(id);
      setMessage("Excluído com sucesso!");
      await loadCopias();
    } catch {
      setMessage("Erro ao excluir.");
    }
    if (view === 'form') goToCopiaList();
  }

  function goToPrevPjRecord() {
    if (!hasPrevPjRecord) return;
    const previous = filteredSortedPessoasJuridicas[currentPjEditIndex - 1];
    if (previous) openPjEditForm(previous);
  }

  function goToNextPjRecord() {
    if (!hasNextPjRecord) return;
    const next = filteredSortedPessoasJuridicas[currentPjEditIndex + 1];
    if (next) openPjEditForm(next);
  }

  function goToPrevAlunoRecord() {
    if (!hasPrevAlunoRecord) return;
    const previous = filteredSortedAlunos[currentAlunoEditIndex - 1];
    if (previous) openAlunoEditForm(previous);
  }

  function goToNextAlunoRecord() {
    if (!hasNextAlunoRecord) return;
    const next = filteredSortedAlunos[currentAlunoEditIndex + 1];
    if (next) openAlunoEditForm(next);
  }

  function goToPrevPeriodoLetivoRecord() {
    if (!hasPrevPeriodoLetivoRecord) return;
    const previous = filteredSortedPeriodosLetivos[currentPeriodoLetivoEditIndex - 1];
    if (previous) openPeriodoLetivoEditForm(previous);
  }

  function goToNextPeriodoLetivoRecord() {
    if (!hasNextPeriodoLetivoRecord) return;
    const next = filteredSortedPeriodosLetivos[currentPeriodoLetivoEditIndex + 1];
    if (next) openPeriodoLetivoEditForm(next);
  }

  function goToPrevColaboradorRecord() {
    if (!hasPrevColaboradorRecord) return;
    const previous = filteredSortedColaboradores[currentColaboradorEditIndex - 1];
    if (previous) openColaboradorEditForm(previous);
  }

  function goToNextColaboradorRecord() {
    if (!hasNextColaboradorRecord) return;
    const next = filteredSortedColaboradores[currentColaboradorEditIndex + 1];
    if (next) openColaboradorEditForm(next);
  }

  function goToPrevAtivoRecord() {
    if (!hasPrevAtivoRecord) return;
    const previous = filteredSortedAtivos[currentAtivoEditIndex - 1];
    if (previous) openAtivoEditForm(previous);
  }

  function goToNextAtivoRecord() {
    if (!hasNextAtivoRecord) return;
    const next = filteredSortedAtivos[currentAtivoEditIndex + 1];
    if (next) openAtivoEditForm(next);
  }

  /* ── Salvar (criar ou atualizar) ── */
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (editingId && bloquearEdicaoSemPermissao(permissoesPessoa.editarPessoaFisica)) return;
    setMessage("");
    // Campos obrigatórios (perfil ativo) precisam estar preenchidos.
    const pfRegras = Object.fromEntries(Object.entries(campoRegrasDaColecao(campoRegrasAtivas, 'pessoa_fisica')).filter(([campo]) => !CAMPOS_PF_MOVIDOS_PARA_ABAS.has(campo)));
    const pfFaltantes = camposObrigatoriosVazios(form as unknown as Record<string, any>, pfRegras);
    if (pfFaltantes.length > 0) {
      setPfCampoErros(pfFaltantes);
      setMessage("Preencha os campos obrigatórios.");
      return;
    }
    setPfCampoErros([]);
    setSubmitting(true);

    const payloadPessoa = { ...form, ...filtroValoresMedicos(form) };

    try {
      if (editingId) {
        const currentPessoa = pessoasFisicas.find((p) => p.id === editingId);
        const formKeys: Array<keyof FormData> = [
          'ds_nome',
          'nr_cpf',
          'dt_nascimento',
          'ds_email',
          'nr_telefone',
          'nr_seq_sexo',
          'nr_seq_estado_civil',
          'nr_seq_cor_raca',
          'nr_seq_profissao',
          'nr_rg',
          'dt_emissao',
          'nr_seq_orgao_emissor',
          'sg_estado',
          'cd_ibge_naturalidade',
          'nr_cep',
          'ds_endereco',
          'nr_endereco',
          'ds_bairro',
          'ds_complemento',
          'nr_seq_logradouro',
          'ds_tipo_sanguineo',
          'ds_observacao_medica',
        ];
        const medicasMudaram =
          JSON.stringify(filtroValoresMedicos(currentPessoa ?? {})) !==
          JSON.stringify(filtroValoresMedicos(form));
        const hasChanges = currentPessoa
          ? formKeys.some((key) => String(currentPessoa[key] ?? '') !== String(form[key] ?? '')) || medicasMudaram
          : true;

        if (!hasChanges) {
          setMessage("Nenhuma alteração detectada.");
          setForm(emptyForm);
          setEditingId(null);
          await loadPessoasFisicas();
          setView("list");
          abrirNovoAposSalvar();
          return;
        }

        await atualizarPessoaFisica(editingId, payloadPessoa, auditAutor);
        setMessage("Atualizado com sucesso!");
      } else {
        await criarPessoaFisica(payloadPessoa, auditAutor);
        setMessage("Cadastrado com sucesso!");
      }

      setForm(emptyForm);
      setEditingId(null);
      await loadPessoasFisicas();
      setView("list");
      abrirNovoAposSalvar();
    } catch {
      setMessage("Erro ao salvar.");
    } finally {
      setSubmitting(false);
    }
  }

  /* ── Salvar (criar ou atualizar) Aluno ── */
  async function handleAlunoSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (alunoEditingId && bloquearEdicaoSemPermissao(permissoesEA.editarAluno)) return;
    setMessage("");

    // Campos obrigatórios (perfil ativo) precisam estar preenchidos.
    // Os responsáveis ficam em aluno_responsavel (duplo clique no aluno).
    const alunoRegras = campoRegrasDaColecao(campoRegrasAtivas, 'aluno');
    const alunoFaltantes = camposObrigatoriosVazios(alunoForm as unknown as Record<string, unknown>, alunoRegras);
    if (alunoFaltantes.length > 0) {
      setAlunoCampoErros(alunoFaltantes);
      setMessage("Preencha os campos obrigatórios.");
      return;
    }
    setAlunoCampoErros([]);
    setAlunoSubmitting(true);

    const payloadAluno = { ...alunoForm };

    try {
      if (alunoEditingId) {
        const currentAluno = alunos.find((a) => a.id === alunoEditingId);
        const formKeys: Array<keyof AlunoFormData> = [
          'nr_seq_pessoa_fisica',
          'nr_matricula',
          'dt_ingresso',
          'dt_status',
          'ds_status',
          'ie_status',
        ];
        const hasChanges = currentAluno
          ? formKeys.some((key) => String(currentAluno[key] ?? '') !== String(alunoForm[key] ?? ''))
          : true;

        if (!hasChanges) {
          setMessage("Nenhuma alteração detectada.");
          setAlunoForm(emptyAlunoForm);
          setAlunoEditingId(null);
          await loadAlunos();
          setView("list");
          abrirNovoAposSalvar();
          return;
        }

        await atualizarAluno(alunoEditingId, payloadAluno, auditAutor);
        setMessage("Atualizado com sucesso!");
      } else {
        await criarAluno(payloadAluno, auditAutor);
        setMessage("Cadastrado com sucesso!");
      }

      setAlunoForm(emptyAlunoForm);
      setAlunoEditingId(null);
      await loadAlunos();
      setView("list");
      abrirNovoAposSalvar();
    } catch {
      setMessage("Erro ao salvar.");
    } finally {
      setAlunoSubmitting(false);
    }
  }

  /* ── Salvar (criar ou atualizar) Colaborador ── */
  async function handleColaboradorSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (colaboradorEditingId && bloquearEdicaoSemPermissao(permissoesEA.editarColaborador)) return;
    setMessage("");
    // Campos obrigatórios (perfil ativo) precisam estar preenchidos.
    const colaboradorRegras = campoRegrasDaColecao(campoRegrasAtivas, 'colaborador');
    const colaboradorFaltantes = camposObrigatoriosVazios(colaboradorForm as unknown as Record<string, any>, colaboradorRegras);
    if (colaboradorFaltantes.length > 0) {
      setColaboradorCampoErros(colaboradorFaltantes);
      setMessage("Preencha os campos obrigatórios.");
      return;
    }
    setColaboradorCampoErros([]);
    setColaboradorSubmitting(true);

    try {
      if (colaboradorEditingId) {
        const currentColaborador = colaboradores.find((c) => c.id === colaboradorEditingId);
        const formKeys: Array<keyof ColaboradorFormData> = [
          'nr_seq_pessoa_fisica',
          'nr_seq_pessoa_juridica',
          'nr_seq_vinculo_contratual',
          'nr_seq_cargo',
          'ie_coordenador',
          'ie_professor',
          'ie_fornecedor',
          'ie_prestador_servico',
          'nr_matricula',
          'dt_admissao',
        ];
        const hasChanges = currentColaborador
          ? formKeys.some((key) => String(currentColaborador[key] ?? '') !== String(colaboradorForm[key] ?? ''))
          : true;

        if (!hasChanges) {
          setMessage("Nenhuma alteração detectada.");
          setColaboradorForm(emptyColaboradorForm);
          setColaboradorEditingId(null);
          await loadColaboradores();
          setView("list");
          abrirNovoAposSalvar();
          return;
        }

        await atualizarColaborador(colaboradorEditingId, colaboradorForm, auditAutor);
        setMessage("Atualizado com sucesso!");
      } else {
        await criarColaborador(colaboradorForm, auditAutor);
        setMessage("Cadastrado com sucesso!");
      }

      setColaboradorForm(emptyColaboradorForm);
      setColaboradorEditingId(null);
      await loadColaboradores();
      setView("list");
      abrirNovoAposSalvar();
    } catch {
      setMessage("Erro ao salvar.");
    } finally {
      setColaboradorSubmitting(false);
    }
  }

  /* ── Salvar (criar ou atualizar) Período letivo ── */
  async function handlePeriodoLetivoSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (periodoLetivoEditingId && bloquearEdicaoSemPermissao(permissoesEA.editarPeriodoLetivo)) return;
    setMessage("");
    // Campos obrigatórios (perfil ativo) precisam estar preenchidos.
    const periodoRegras = campoRegrasDaColecao(campoRegrasAtivas, 'periodo_letivo');
    const periodoFaltantes = camposObrigatoriosVazios(periodoLetivoForm as unknown as Record<string, unknown>, periodoRegras);
    if (periodoFaltantes.length > 0) {
      setPeriodoLetivoCampoErros(periodoFaltantes);
      setMessage("Preencha os campos obrigatórios.");
      return;
    }
    setPeriodoLetivoCampoErros([]);
    setPeriodoLetivoSubmitting(true);

    try {
      if (periodoLetivoEditingId) {
        const currentPeriodo = periodosLetivos.find((p) => p.id === periodoLetivoEditingId);
        const formKeys: Array<keyof PeriodoLetivoFormData> = [
          'nr_ano',
          'ds_periodo_letivo',
          'qt_dias_letivos',
          'dt_inicio',
          'dt_previsao_termino',
          'dt_termino',
          'dt_reativacao',
          'ie_status',
        ];
        const hasChanges = currentPeriodo
          ? formKeys.some((key) => String(currentPeriodo[key] ?? '') !== String(periodoLetivoForm[key] ?? ''))
          : true;

        if (!hasChanges) {
          setMessage("Nenhuma alteração detectada.");
          setPeriodoLetivoForm(emptyPeriodoLetivoForm);
          setPeriodoLetivoEditingId(null);
          await loadPeriodosLetivos();
          setView("list");
          abrirNovoAposSalvar();
          return;
        }

        await atualizarPeriodoLetivo(periodoLetivoEditingId, periodoLetivoForm, auditAutor);
        setMessage("Atualizado com sucesso!");
      } else {
        await criarPeriodoLetivo(periodoLetivoForm, auditAutor);
        setMessage("Cadastrado com sucesso!");
      }

      setPeriodoLetivoForm(emptyPeriodoLetivoForm);
      setPeriodoLetivoEditingId(null);
      await loadPeriodosLetivos();
      setView("list");
      abrirNovoAposSalvar();
    } catch {
      setMessage("Erro ao salvar.");
    } finally {
      setPeriodoLetivoSubmitting(false);
    }
  }

  /* ── Salvar (criar ou atualizar) Ativo ── */
  async function handleAtivoSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (ativoEditingId && bloquearEdicaoSemPermissao(permissoesPatrimonio.editarAtivo)) return;
    setMessage("");
    // Campos obrigatórios (perfil ativo) precisam estar preenchidos.
    const ativoRegras = campoRegrasDaColecao(campoRegrasAtivas, 'pat_ativo');
    // nr_seq_responsavel ficou em pat_ativo_responsavel; regra antiga salva no perfil não vale aqui.
    const { nr_seq_responsavel: _regraResponsavelLegada, ...ativoRegrasPlanas } = ativoRegras;
    void _regraResponsavelLegada;
    const ativoFaltantes = camposObrigatoriosVazios(ativoForm as unknown as Record<string, unknown>, ativoRegrasPlanas);
    if (ativoFaltantes.length > 0) {
      setAtivoCampoErros(ativoFaltantes);
      setMessage("Preencha os campos obrigatórios.");
      return;
    }
    setAtivoCampoErros([]);
    setAtivoSubmitting(true);

    try {
      if (ativoEditingId) {
        const currentAtivo = ativos.find((a) => a.id === ativoEditingId);
        const formKeys: Array<keyof AtivoFormData> = [
          'cd_externo', 'ds_ativo', 'nr_seq_categoria', 'nr_seq_localizacao',
          'nr_seq_marca', 'nr_seq_fornecedor', 'ds_modelo', 'nr_serie', 'ds_qr_code', 'ds_codigo_barras',
          'vl_aquisicao', 'dt_aquisicao', 'dt_garantia', 'ie_status', 'ds_processador',
          'qt_ram', 'ie_ram', 'qt_armazenamento', 'ie_armazenamento',
          'ds_endereco_mac', 'ds_ip', 'nr_seq_sistema_operacional', 'ds_observacao',
          'cd_placa', 'cd_renavam', 'nr_ano', 'ds_cor', 'nr_seq_combustivel',
        ];
        const hasChanges = currentAtivo
          ? formKeys.some((key) => String(currentAtivo[key] ?? '') !== String(ativoForm[key] ?? ''))
          : true;

        if (!hasChanges) {
          setMessage("Nenhuma alteração detectada.");
          setAtivoForm(emptyAtivoForm);
          setAtivoEditingId(null);
          await loadAtivos();
          setView("list");
          abrirNovoAposSalvar();
          return;
        }

        await atualizarAtivo(ativoEditingId, ativoForm, auditAutor);
        setMessage("Atualizado com sucesso!");
      } else {
        await criarAtivo(ativoForm, auditAutor);
        setMessage("Cadastrado com sucesso!");
      }

      setAtivoForm(emptyAtivoForm);
      setAtivoEditingId(null);
      await loadAtivos();
      setView("list");
      abrirNovoAposSalvar();
    } catch (e) {
      console.error('Erro ao salvar ativo:', e);
      setMessage("Erro ao salvar.");
    } finally {
      setAtivoSubmitting(false);
    }
  }

  /* ── Salvar (criar ou atualizar) Pessoa Jurídica ── */
  async function handlePjSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pjEditingId && bloquearEdicaoSemPermissao(permissoesPessoa.editarPessoaJuridica)) return;
    setMessage("");
    // Campos obrigatórios (perfil ativo) precisam estar preenchidos.
    const pjRegras = campoRegrasDaColecao(campoRegrasAtivas, 'pessoa_juridica');
    const pjFaltantes = camposObrigatoriosVazios(pjForm as unknown as Record<string, any>, pjRegras);
    if (pjFaltantes.length > 0) {
      setPjCampoErros(pjFaltantes);
      setMessage("Preencha os campos obrigatórios.");
      return;
    }
    setPjCampoErros([]);
    setPjSubmitting(true);

    try {
      if (pjEditingId) {
        const currentPessoa = pessoasJuridicas.find((p) => p.id === pjEditingId);
        const formKeys: Array<keyof PjFormData> = [
          'ds_razao_social',
          'ds_nome_fantasia',
          'nr_cnpj',
          'nr_inscricao_estadual',
          'nr_inscricao_municipal',
          'dt_abertura',
          'nr_telefone',
          'ds_email',
          'nr_cep',
          'ds_endereco',
          'nr_endereco',
          'ds_bairro',
          'ds_complemento',
          'nr_seq_logradouro',
          'sg_estado',
          'cd_ibge_cidade',
        ];
        const hasChanges = currentPessoa
          ? formKeys.some((key) => String(currentPessoa[key] ?? '') !== String(pjForm[key] ?? ''))
          : true;

        if (!hasChanges) {
          setMessage("Nenhuma alteração detectada.");
          setPjForm(emptyPjForm);
          setPjEditingId(null);
          await loadPessoasJuridicas();
          setView("list");
          abrirNovoAposSalvar();
          return;
        }

        await atualizarPessoaJuridica(pjEditingId, pjForm, auditAutor);
        setMessage("Atualizado com sucesso!");
      } else {
        await criarPessoaJuridica(pjForm, auditAutor);
        setMessage("Cadastrado com sucesso!");
      }

      setPjForm(emptyPjForm);
      setPjEditingId(null);
      await loadPessoasJuridicas();
      setView("list");
      abrirNovoAposSalvar();
    } catch {
      setMessage("Erro ao salvar.");
    } finally {
      setPjSubmitting(false);
    }
  }

  async function handleAdminSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (adminEditingId && bloquearEdicaoSemPermissao(permissoesAdmin.editarUsuario)) return;
    setMessage("");
    // Defesa em profundidade: o usuário administrador não pode ser alterado.
    if (adminEditingId && isAdministradorUsuario(usuarios.find((a) => a.id === adminEditingId))) {
      setMessage("O usuário administrador não pode ser alterado.");
      return;
    }
    // Campos obrigatórios (perfil ativo) precisam estar preenchidos.
    const adminRegras = campoRegrasDaColecao(campoRegrasAtivas, 'usuario');
    const adminFaltantes = camposObrigatoriosVazios(adminForm as unknown as Record<string, any>, adminRegras);
    if (adminFaltantes.length > 0) {
      setAdminCampoErros(adminFaltantes);
      setMessage("Preencha os campos obrigatórios.");
      return;
    }
    setAdminCampoErros([]);
    setAdminSubmitting(true);

    try {
      // A senha vai em texto para o servidor, que guarda só o hash; vazia mantém a atual.
      const senha = adminForm.ds_senha ?? '';

      const usuarioPayload: Record<string, any> = {
        ds_usuario: adminForm.ds_usuario,
        ds_usuario_alternativo: adminForm.ds_usuario_alternativo,
        ds_email: adminForm.ds_email ?? '',
        ds_senha: senha,
        ds_observacao: adminForm.ds_observacao,
        ie_status: adminForm.ie_status,
        ie_base_conhecimento: adminForm.ie_base_conhecimento ?? 'N',
        ie_central_suporte: adminForm.ie_central_suporte ?? 'N',
        ie_parametros_funcao: adminForm.ie_parametros_funcao ?? 'N',
        ie_ver_auditoria: adminForm.ie_ver_auditoria ?? 'N',
      };
      if (adminForm.nr_seq_pessoa_fisica !== undefined && adminForm.nr_seq_pessoa_fisica !== null) {
        usuarioPayload.nr_seq_pessoa_fisica = adminForm.nr_seq_pessoa_fisica;
      }

      if (adminEditingId) {
        const currentUsuario = usuarios.find((u) => u.id === adminEditingId);
        const hasChanges = currentUsuario
          ?          [
              'nr_seq_pessoa_fisica',
              'ds_usuario',
              'ds_usuario_alternativo',
              'ds_email',
              'ds_observacao',
              'ie_status',
              'ie_base_conhecimento',
              'ie_central_suporte',
              'ie_parametros_funcao',
              'ie_ver_auditoria',
            ].some((field) => String((currentUsuario as any)[field] ?? '') !== String((adminForm as any)[field] ?? ''))
            || Boolean(adminForm.ds_senha)
          : true;

        if (!hasChanges) {
          setMessage("Nenhuma alteração detectada.");
          setAdminForm(emptyAdminForm);
          setAdminEditingId(null);
          await loadUsuarios();
          setView("list");
          abrirNovoAposSalvar();
          return;
        }

        const updatePayload = {
          ...usuarioPayload,
          nr_seq_pessoa_fisica: adminForm.nr_seq_pessoa_fisica ?? null,
          ie_status: adminForm.ie_status ?? null,
        };
        await atualizarUsuario(adminEditingId, updatePayload as any, auditAutor);
        // Se o usuário editado é o logado, atualizar o currentUser para
        // refletir as alterações imediatamente (ex.: checkboxes do menu lateral).
        if (adminEditingId === currentUser?.id) {
          setCurrentUser((u) => u ? {
            ...u,
            ds_usuario: adminForm.ds_usuario,
            ds_usuario_alternativo: adminForm.ds_usuario_alternativo,
            ds_email: adminForm.ds_email,
            ds_observacao: adminForm.ds_observacao,
            ie_status: adminForm.ie_status,
            ie_base_conhecimento: adminForm.ie_base_conhecimento,
            ie_central_suporte: adminForm.ie_central_suporte,
            ie_parametros_funcao: adminForm.ie_parametros_funcao,
            ie_ver_auditoria: adminForm.ie_ver_auditoria,
            nr_seq_pessoa_fisica: adminForm.nr_seq_pessoa_fisica,
          } : u);
        }
        setMessage("Atualizado com sucesso!");
      } else {
        const novoUsuario = (adminForm.ds_usuario ?? "").trim().toLowerCase();
        const novoAlternativo = (adminForm.ds_usuario_alternativo ?? "").trim().toLowerCase();
        const jaExiste = usuarios.some((u) => {
          const uPrincipal = (u.ds_usuario ?? "").trim().toLowerCase();
          const uAlternativo = (u.ds_usuario_alternativo ?? "").trim().toLowerCase();
          return (
            (novoUsuario !== "" && (novoUsuario === uPrincipal || novoUsuario === uAlternativo)) ||
            (novoAlternativo !== "" && (novoAlternativo === uPrincipal || novoAlternativo === uAlternativo))
          );
        });
        if (jaExiste) {
          setMessage("Usuário já existente.");
          return;
        }
        const id = await criarUsuario(usuarioPayload as any, auditAutor);
        setMessage("Cadastrado com sucesso!");
      }

      await loadUsuarios();
      setAdminForm(emptyAdminForm);
      setAdminEditingId(null);
      setView("list");
      abrirNovoAposSalvar();
    } catch {
      setMessage("Erro ao salvar.");
    } finally {
      setAdminSubmitting(false);
    }
  }

  async function handlePerfilSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (perfilEditingId && bloquearEdicaoSemPermissao(permissoesAdmin.editarPerfil)) return;
    setMessage("");
    // Defesa em profundidade: o perfil Administrador não pode ser alterado.
    if (perfilEditingId && isAdministradorPerfil(perfis.find((a) => a.id === perfilEditingId))) {
      setMessage("O perfil Administrador não pode ser alterado.");
      return;
    }
    // Campos obrigatórios (perfil ativo) precisam estar preenchidos.
    const perfilRegras = campoRegrasDaColecao(campoRegrasAtivas, 'perfil');
    const perfilFaltantes = camposObrigatoriosVazios(perfilForm as unknown as Record<string, any>, perfilRegras);
    if (perfilFaltantes.length > 0) {
      setPerfilCampoErros(perfilFaltantes);
      setMessage("Preencha os campos obrigatórios.");
      return;
    }
    setPerfilCampoErros([]);
    setPerfilSubmitting(true);

    try {
      const payload = {
        ds_perfil: perfilForm.ds_perfil,
        ds_observacao: perfilForm.ds_observacao,
        ie_status: perfilForm.ie_status,
      };

      if (perfilEditingId) {
        const currentPerfil = perfis.find((p) => p.id === perfilEditingId);
        const hasChanges = currentPerfil
          ? ['ds_perfil', 'ds_observacao', 'ie_status'].some((field) => String((currentPerfil as any)[field] ?? '') !== String((perfilForm as any)[field] ?? ''))
          : true;

        if (!hasChanges) {
          setMessage("Nenhuma alteração detectada.");
          setPerfilForm({ ds_perfil: '', ds_observacao: '', ie_status: 'A' });
          setPerfilEditingId(null);
          await loadPerfis();
          setView("list");
          abrirNovoAposSalvar();
          return;
        }

        await atualizarPerfil(perfilEditingId, payload as any, auditAutor);
        setMessage("Atualizado com sucesso!");
      } else {
        const novoPerfil = (perfilForm.ds_perfil ?? "").trim().toLowerCase();
        const jaExiste = perfis.some((p) => (p.ds_perfil ?? "").trim().toLowerCase() === novoPerfil);
        if (jaExiste) {
          setMessage("Perfil já existente.");
          return;
        }
        await criarPerfil(payload as any, auditAutor);
        setMessage("Cadastrado com sucesso!");
      }

      await loadPerfis();
      setPerfilForm({ ds_perfil: '', ds_observacao: '', ie_status: 'A' });
      setPerfilEditingId(null);
      setView("list");
      abrirNovoAposSalvar();
    } catch {
      setMessage("Erro ao salvar.");
    } finally {
      setPerfilSubmitting(false);
    }
  }

  async function handleCgSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (cgEditingId && bloquearEdicaoSemPermissao((permissoesCg[cgKind]?.editar ?? true))) return;
    setMessage("");
    // Campos obrigatórios (perfil ativo) precisam estar preenchidos.
    const cgRegras = campoRegrasDaColecao(campoRegrasAtivas, cgCollection);
    const cgSiglaChave = cgKind === 'orgaoEmissor' ? 'sg_orgao_emissor' : cgKind === 'logradouro' ? 'sg_logradouro' : null;
    const cgFaltantes = camposObrigatoriosVazios(
      {
        [cgDescKey]: cgForm.descricao,
        ie_status: cgForm.ie_status,
        nr_cbo: cgForm.nr_cbo ?? '',
        ...(cgSiglaChave ? { [cgSiglaChave]: cgForm.sg_sigla ?? '' } : {}),
        ...(cgKind === 'formatoPapel' ? { qt_largura: cgForm.qt_largura ?? '', qt_altura: cgForm.qt_altura ?? '' } : {}),
      },
      cgRegras
    );
    if (cgFaltantes.length > 0) {
      setCgCampoErros(cgFaltantes);
      setMessage("Preencha os campos obrigatórios.");
      return;
    }
    // Formato do papel: Largura e Altura, quando informadas, precisam ser maiores que zero.
    if (cgKind === 'formatoPapel') {
      const medidasInvalidas = (['qt_largura', 'qt_altura'] as const).filter((campo) => {
        const texto = (cgForm[campo] ?? '').trim();
        if (texto === '') return false;
        const n = medidaParaBanco(texto);
        return n === null || n <= 0;
      });
      if (medidasInvalidas.length > 0) {
        setCgCampoErros([...medidasInvalidas]);
        setMessage("Informe uma medida maior que zero.");
        return;
      }
    }
    setCgCampoErros([]);
    setCgSubmitting(true);

    try {
      const payload = {
        [cgDescKey]: cgForm.descricao,
        ie_status: cgForm.ie_status,
        ...(cgKind === 'profissao' ? { nr_cbo: cgForm.nr_cbo ?? '' } : {}),
        ...(cgKind === 'orgaoEmissor' ? { sg_orgao_emissor: cgForm.sg_sigla ?? '' } : {}),
        ...(cgKind === 'logradouro' ? { sg_logradouro: cgForm.sg_sigla ?? '' } : {}),
        ...(cgKind === 'formatoPapel' ? { qt_largura: medidaParaBanco(cgForm.qt_largura), qt_altura: medidaParaBanco(cgForm.qt_altura) } : {}),
      } as Record<string, unknown>;

      if (cgEditingId) {
        const currentItem = cgItems.find((s) => s.id === cgEditingId);
        const changeKeys = cgKind === 'profissao' ? [cgDescKey, 'ie_status', 'nr_cbo'] : cgKind === 'orgaoEmissor' ? [cgDescKey, 'ie_status', 'sg_orgao_emissor'] : cgKind === 'logradouro' ? [cgDescKey, 'ie_status', 'sg_logradouro'] : cgKind === 'formatoPapel' ? [cgDescKey, 'ie_status', 'qt_largura', 'qt_altura'] : [cgDescKey, 'ie_status'];
        // Medidas: compara o número ("210.00" do banco = 210 digitado).
        const valorComparavel = (key: string, v: unknown) =>
          (key === 'qt_largura' || key === 'qt_altura') ? String(medidaParaBanco(v == null ? '' : String(v)) ?? '') : String(v ?? '');
        const hasChanges = currentItem
          ? changeKeys.some((key) => valorComparavel(key, (currentItem as any)[key]) !== valorComparavel(key, payload[key]))
          : true;

        if (!hasChanges) {
          setMessage("Nenhuma alteração detectada.");
          setCgForm(emptyCgForm);
          setCgEditingId(null);
          await loadCgItems();
          setView("list");
          abrirNovoAposSalvar();
          return;
        }

        if (cgKind === 'sexo') {
          await atualizarSexo(cgEditingId, payload as any, auditAutor);
        } else if (cgKind === 'estadoCivil') {
          await atualizarEstadoCivil(cgEditingId, payload as any, auditAutor);
        } else if (cgKind === 'corRaca') {
          await atualizarCorRaca(cgEditingId, payload as any, auditAutor);
        } else if (cgKind === 'profissao') {
          await atualizarProfissao(cgEditingId, payload as any, auditAutor);
        } else if (cgKind === 'logradouro') {
          await atualizarLogradouro(cgEditingId, payload as any, auditAutor);
        } else if (cgKind === 'grauParentesco') {
          await atualizarGrauParentesco(cgEditingId, payload as any, auditAutor);
        } else if (cgKind === 'cargo') {
          await atualizarCargo(cgEditingId, payload as any, auditAutor);
        } else if (cgKind === 'vinculoContratual') {
          await atualizarVinculoContratual(cgEditingId, payload as any, auditAutor);
        } else if (cgKind === 'localizacao') {
          await atualizarLocalizacao(cgEditingId, payload as any, auditAutor);
        } else if (cgKind === 'marca') {
          await atualizarMarca(cgEditingId, payload as any, auditAutor);
        } else if (cgKind === 'sistemaOperacional') {
          await atualizarSistemaOperacional(cgEditingId, payload as any, auditAutor);
        } else if (cgKind === 'combustivel') {
          await atualizarCombustivel(cgEditingId, payload as any, auditAutor);
        } else if (cgKind === 'modalidadeEnsino') {
          await atualizarModalidadeEnsino(cgEditingId, payload as any, auditAutor);
        } else if (cgKind === 'formatoPapel') {
          await atualizarFormatoPapel(cgEditingId, payload as any, auditAutor);
        } else if (cgKind === 'tipoPapel') {
          await atualizarTipoPapel(cgEditingId, payload as any, auditAutor);
        } else {
          await atualizarOrgaoEmissor(cgEditingId, payload as any, auditAutor);
        }
        setMessage("Atualizado com sucesso!");
      } else {
        if (cgKind === 'sexo') {
          await criarSexo(payload as any, auditAutor);
        } else if (cgKind === 'estadoCivil') {
          await criarEstadoCivil(payload as any, auditAutor);
        } else if (cgKind === 'corRaca') {
          await criarCorRaca(payload as any, auditAutor);
        } else if (cgKind === 'profissao') {
          await criarProfissao(payload as any, auditAutor);
        } else if (cgKind === 'logradouro') {
          await criarLogradouro(payload as any, auditAutor);
        } else if (cgKind === 'grauParentesco') {
          await criarGrauParentesco(payload as any, auditAutor);
        } else if (cgKind === 'cargo') {
          await criarCargo(payload as any, auditAutor);
        } else if (cgKind === 'vinculoContratual') {
          await criarVinculoContratual(payload as any, auditAutor);
        } else if (cgKind === 'localizacao') {
          await criarLocalizacao(payload as any, auditAutor);
        } else if (cgKind === 'marca') {
          await criarMarca(payload as any, auditAutor);
        } else if (cgKind === 'sistemaOperacional') {
          await criarSistemaOperacional(payload as any, auditAutor);
        } else if (cgKind === 'combustivel') {
          await criarCombustivel(payload as any, auditAutor);
        } else if (cgKind === 'modalidadeEnsino') {
          await criarModalidadeEnsino(payload as any, auditAutor);
        } else if (cgKind === 'formatoPapel') {
          await criarFormatoPapel(payload as any, auditAutor);
        } else if (cgKind === 'tipoPapel') {
          await criarTipoPapel(payload as any, auditAutor);
        } else {
          await criarOrgaoEmissor(payload as any, auditAutor);
        }
        setMessage("Cadastrado com sucesso!");
      }

      setCgForm(emptyCgForm);
      setCgEditingId(null);
      await loadCgItems();
      setView("list");
      abrirNovoAposSalvar();
    } catch {
      setMessage("Erro ao salvar.");
    } finally {
      setCgSubmitting(false);
    }
  }

  function openChangePasswordModal(usuario: Usuario, isSelf = false) {
    setPasswordChangeUserId(usuario.id ?? null);
    setPasswordChangeValue("");
    setPasswordChangeConfirmValue("");
    setPasswordChangeIsSelf(isSelf);
    setChangePasswordModalOpen(true);
  }

  function closeChangePasswordModal() {
    setChangePasswordModalOpen(false);
    setPasswordChangeValue("");
    setPasswordChangeConfirmValue("");
    setPasswordChangeUserId(null);
    setPasswordChangeIsSelf(false);
  }

  function openPessoaFisicaLookup() {
    const salvo = filtroSalvoDoLookup('pessoa_fisica', { ds_nome: '', nr_sequencia: '', nr_cpf: '' });
    setLookupForm(salvo ?? lookupFilter);
    if (salvo) setLookupFilter(salvo);
    setLookupApplied(!!salvo);
    setPessoaFisicaLookupOpen(true);
  }

  function closePessoaFisicaLookup() {
    setPessoaFisicaLookupOpen(false);
  }

  function handlePessoaFisicaSelect(pessoa: PessoaFisica) {
    setAdminForm({ ...adminForm, nr_seq_pessoa_fisica: pessoa.nr_sequencia });
    closePessoaFisicaLookup();
  }

  function applyLookupFilter() {
    setLookupFilter(lookupForm);
    setLookupApplied(true);
  }

  function clearLookupFilter() {
    const empty = { ds_nome: '', nr_sequencia: '', nr_cpf: '' };
    setLookupForm(empty);
    setLookupFilter(empty);
    setLookupApplied(false);
  }

  const selectedPessoaFisicaName = useMemo(() => {
    if (!adminForm.nr_seq_pessoa_fisica) return "";
    return pessoasFisicas.find((p) => p.nr_sequencia === adminForm.nr_seq_pessoa_fisica)?.ds_nome ?? "";
  }, [adminForm.nr_seq_pessoa_fisica, pessoasFisicas]);

  const filteredLookupPessoasFisicas = useMemo(() => {
    return pessoasFisicas.filter((pessoa) => {
      if (lookupFilter.nr_sequencia) {
        if (String(pessoa.nr_sequencia) !== lookupFilter.nr_sequencia.trim()) return false;
      }
      if (lookupFilter.ds_nome && !pessoa.ds_nome.toLowerCase().includes(lookupFilter.ds_nome.toLowerCase())) {
        return false;
      }
      if (lookupFilter.nr_cpf) {
        const queryCpf = lookupFilter.nr_cpf.replace(/\D/g, '');
        const pessoaCpf = pessoa.nr_cpf.replace(/\D/g, '');
        if (!pessoaCpf.includes(queryCpf)) return false;
      }
      return true;
    });
  }, [pessoasFisicas, lookupFilter]);

  /* ── Lookup de Pessoa Física para Alunos (aluno / responsável) ── */
  function openAlunoPessoaFisicaLookup(target: 'aluno' | 'responsavel' | 'colaborador' | 'alunoFilter' | 'colaboradorFilter' | 'manutencaoFilter') {
    alunoPessoaFisicaLookupTargetRef.current = target;
    const salvo = filtroSalvoDoLookup('pessoa_fisica', { ds_nome: '', nr_sequencia: '', nr_cpf: '' });
    setAlunoLookupForm(salvo ?? alunoLookupFilter);
    if (salvo) setAlunoLookupFilter(salvo);
    setAlunoLookupApplied(!!salvo);
    setAlunoPessoaFisicaLookupOpen(true);
  }

  function closeAlunoPessoaFisicaLookup() {
    setAlunoPessoaFisicaLookupOpen(false);
  }

  function handleAlunoPessoaFisicaSelect(pessoa: PessoaFisica) {
    const target = alunoPessoaFisicaLookupTargetRef.current;
    if (target === 'alunoFilter') {
      setAlunoFilterForm((prev) => ({ ...prev, nr_seq_pessoa_fisica: String(pessoa.nr_sequencia) }));
    } else if (target === 'colaboradorFilter') {
      setColaboradorFilterForm((prev) => ({ ...prev, nr_seq_pessoa_fisica: String(pessoa.nr_sequencia) }));
    } else if (target === 'colaborador') {
      setColaboradorForm({ ...colaboradorForm, nr_seq_pessoa_fisica: pessoa.nr_sequencia });
    } else if (target === 'responsavel') {
      alunoResponsavelLookupCallbackRef.current?.(pessoa.nr_sequencia);
      alunoResponsavelLookupCallbackRef.current = null;
    } else if (target === 'manutencaoFilter') {
      setManutencaoFilterForm((prev) => ({ ...prev, nr_seq_prestador_servico: String(pessoa.nr_sequencia) }));
    } else {
      setAlunoForm({ ...alunoForm, nr_seq_pessoa_fisica: pessoa.nr_sequencia });
    }
    closeAlunoPessoaFisicaLookup();
  }

  // Abre o lookup de Pessoa Física a partir do filtro de Alunos.
  function openAlunoFilterPessoaFisicaLookup() {
    openAlunoPessoaFisicaLookup('alunoFilter');
  }

  // Abre o lookup de Pessoa Física a partir do filtro de Colaboradores.
  function openColaboradorFilterPessoaFisicaLookup() {
    openAlunoPessoaFisicaLookup('colaboradorFilter');
  }

  // Abre o lookup de Pessoa Física a partir do filtro de Ativos (Responsável).
  // Helper para filtrar e ordenar opções de Cadastros Gerais (apenas itens Ativos).
  function cgFilterOptions<T extends { nr_sequencia: number; ie_status?: string }>(items: T[], labelFn: (item: T) => string): { value: string; label: string }[] {
    return items
      .filter((op) => op.ie_status === 'A' || !op.ie_status)
      .filter((op) => { const l = labelFn(op); return l && l.trim() !== ''; })
      .sort((a, b) => labelFn(a).localeCompare(labelFn(b), 'pt-BR', { sensitivity: 'base' }))
      .map((op) => ({ value: String(op.nr_sequencia), label: labelFn(op) }));
  }

  function openAtivoFilterResponsavelLookup() {
    openEnviarManutPrestadorLookup('ativoFilter');
  }

  // Abre o lookup de Pessoa Física a partir do filtro de Manutenções (Prestador de serviço).
  function openManutencaoFilterPrestadorLookup() {
    openAlunoPessoaFisicaLookup('manutencaoFilter');
  }

  function applyAlunoLookupFilter() {
    setAlunoLookupFilter(alunoLookupForm);
    setAlunoLookupApplied(true);
  }

  function clearAlunoLookupFilter() {
    const empty = { ds_nome: '', nr_sequencia: '', nr_cpf: '' };
    setAlunoLookupForm(empty);
    setAlunoLookupFilter(empty);
    setAlunoLookupApplied(false);
  }

  // Nome exibido no campo "Pessoa física" do formulário de Aluno (Identificação).
  const selectedAlunoPessoaFisicaName = useMemo(() => {
    if (!alunoForm.nr_seq_pessoa_fisica) return "";
    return pessoasFisicas.find((p) => p.nr_sequencia === alunoForm.nr_seq_pessoa_fisica)?.ds_nome ?? "";
  }, [alunoForm.nr_seq_pessoa_fisica, pessoasFisicas]);

  // Abre o modal de visualização de uma pessoa física pelo nr_sequencia.
  function openPessoaFisicaView(nrSequencia: number | undefined) {
    if (!nrSequencia) return;
    const pessoa = pessoasFisicas.find((p) => p.nr_sequencia === nrSequencia);
    setPessoaFisicaView(pessoa ?? null);
  }

  // Abre o modal de visualização de uma manutenção pelo nr_sequencia.
  function openManutencaoView(nrSequencia: number | undefined) {
    if (!nrSequencia) return;
    const manut = manutencoes.find((m) => m.nr_sequencia === nrSequencia);
    setManutencaoView(manut ?? null);
  }

  // Abre o modal de visualização de um colaborador pelo nr_sequencia.
  /** Nome do colaborador: razão social da pessoa jurídica ou nome da pessoa física. */
  function nomeColaboradorPorSeq(nrSequencia?: number): string {
    if (!nrSequencia) return '';
    const col = colaboradores.find((c) => c.nr_sequencia === nrSequencia);
    if (!col) return '';
    const pj = col.nr_seq_pessoa_juridica ? pessoasJuridicas.find((p) => p.nr_sequencia === col.nr_seq_pessoa_juridica) : undefined;
    return pj ? pj.ds_razao_social ?? '' : pessoasFisicas.find((p) => p.nr_sequencia === col.nr_seq_pessoa_fisica)?.ds_nome ?? '';
  }

  function openColaboradorView(nrSequencia: number | undefined) {
    if (!nrSequencia) return;
    const col = colaboradores.find((c) => c.nr_sequencia === nrSequencia);
    setColaboradorView(col ?? null);
  }

  // Abre o modal de visualização de Pessoa Jurídica, resolvendo o nome da cidade.
  function openPessoaJuridicaView(nrSequencia: number | undefined) {
    if (!nrSequencia) return;
    const pessoa = pessoasJuridicas.find((p) => p.nr_sequencia === nrSequencia);
    setPessoaJuridicaView(pessoa ?? null);
    const codigo = pessoa?.cd_ibge_cidade ?? '';
    pessoaJuridicaViewCodeRef.current = codigo;
    setPessoaJuridicaViewCidade('');
    if (codigo) {
      cidadePorCodigo(codigo)
        .then((cidade) => {
          if (pessoaJuridicaViewCodeRef.current === codigo && cidade) {
            setPessoaJuridicaViewCidade(cidade.nome);
          }
        })
        .catch(() => {});
    }
  }

  // Nome exibido no campo "Pessoa física" do formulário de Colaborador.
  const selectedColaboradorPessoaFisicaName = useMemo(() => {
    if (!colaboradorForm.nr_seq_pessoa_fisica) return "";
    return pessoasFisicas.find((p) => p.nr_sequencia === colaboradorForm.nr_seq_pessoa_fisica)?.ds_nome ?? "";
  }, [colaboradorForm.nr_seq_pessoa_fisica, pessoasFisicas]);

  // Nome exibido no campo "Pessoa jurídica" do formulário de Colaborador.
  const selectedColaboradorPessoaJuridicaName = useMemo(() => {
    if (!colaboradorForm.nr_seq_pessoa_juridica) return "";
    return pessoasJuridicas.find((p) => p.nr_sequencia === colaboradorForm.nr_seq_pessoa_juridica)?.ds_razao_social ?? "";
  }, [colaboradorForm.nr_seq_pessoa_juridica, pessoasJuridicas]);

  /* ── Lookup de Pessoa Jurídica para Colaboradores ── */
  function openColaboradorPessoaJuridicaLookup() {
    colaboradorPjLookupTargetRef.current = 'form';
    abrirColaboradorPjLookup();
  }

  // Abre o lookup de Pessoa Jurídica a partir do filtro de Colaboradores.
  function openColaboradorFilterPessoaJuridicaLookup() {
    colaboradorPjLookupTargetRef.current = 'filter';
    abrirColaboradorPjLookup();
  }

  function abrirColaboradorPjLookup() {
    const salvo = filtroSalvoDoLookup('pessoa_juridica', { nr_sequencia: '', ds_razao_social: '', nr_cnpj: '' });
    setColaboradorPjLookupForm(salvo ?? colaboradorPjLookupFilter);
    if (salvo) setColaboradorPjLookupFilter(salvo);
    setColaboradorPjLookupApplied(!!salvo);
    setColaboradorPessoaJuridicaLookupOpen(true);
  }

  function closeColaboradorPessoaJuridicaLookup() {
    setColaboradorPessoaJuridicaLookupOpen(false);
  }

  function handleColaboradorPessoaJuridicaSelect(pessoa: PessoaJuridica) {
    if (colaboradorPjLookupTargetRef.current === 'filter') {
      setColaboradorFilterForm((prev) => ({ ...prev, nr_seq_pessoa_juridica: String(pessoa.nr_sequencia) }));
    } else {
      setColaboradorForm({ ...colaboradorForm, nr_seq_pessoa_juridica: pessoa.nr_sequencia });
    }
    closeColaboradorPessoaJuridicaLookup();
  }

  function applyColaboradorPjLookupFilter() {
    setColaboradorPjLookupFilter(colaboradorPjLookupForm);
    setColaboradorPjLookupApplied(true);
  }

  function clearColaboradorPjLookupFilter() {
    const empty = { nr_sequencia: '', ds_razao_social: '', nr_cnpj: '' };
    setColaboradorPjLookupForm(empty);
    setColaboradorPjLookupFilter(empty);
    setColaboradorPjLookupApplied(false);
  }

  const filteredColaboradorPjLookupPessoasJuridicas = useMemo(() => {
    return pessoasJuridicas.filter((pessoa) => {
      if (colaboradorPjLookupFilter.nr_sequencia) {
        if (String(pessoa.nr_sequencia) !== colaboradorPjLookupFilter.nr_sequencia.trim()) return false;
      }
      if (colaboradorPjLookupFilter.ds_razao_social && !pessoa.ds_razao_social.toLowerCase().includes(colaboradorPjLookupFilter.ds_razao_social.toLowerCase())) {
        return false;
      }
      if (colaboradorPjLookupFilter.nr_cnpj) {
        const queryCnpj = colaboradorPjLookupFilter.nr_cnpj.replace(/\D/g, '');
        const pessoaCnpj = pessoa.nr_cnpj.replace(/\D/g, '');
        if (!pessoaCnpj.includes(queryCnpj)) return false;
      }
      return true;
    });
  }, [pessoasJuridicas, colaboradorPjLookupFilter]);

  // Opções do dropdown "Grau de parentesco" (Responsáveis) — apenas os ativos,
  // em ordem alfabética (pt-BR).
  const alunoGrauParentescoOptions = useMemo(
    () =>
      grausParentesco
        .filter((g) => (g.ie_status ?? 'A') === 'A')
        .map((g) => ({ value: String(g.nr_sequencia), label: g.ds_grau_parentesco }))
        .sort((a, b) => a.label.localeCompare(b.label, 'pt-BR')),
    [grausParentesco]
  );

  const filteredAlunoLookupPessoasFisicas = useMemo(() => {
    return pessoasFisicas.filter((pessoa) => {
      if (alunoLookupFilter.nr_sequencia) {
        if (String(pessoa.nr_sequencia) !== alunoLookupFilter.nr_sequencia.trim()) return false;
      }
      if (alunoLookupFilter.ds_nome && !pessoa.ds_nome.toLowerCase().includes(alunoLookupFilter.ds_nome.toLowerCase())) {
        return false;
      }
      if (alunoLookupFilter.nr_cpf) {
        const queryCpf = alunoLookupFilter.nr_cpf.replace(/\D/g, '');
        const pessoaCpf = pessoa.nr_cpf.replace(/\D/g, '');
        if (!pessoaCpf.includes(queryCpf)) return false;
      }
      return true;
    });
  }, [pessoasFisicas, alunoLookupFilter]);

  /* ── Lookup de cidades (Naturalidade — API IBGE) ── */
  async function openNaturalidadeLookup() {
    const salvo = filtroSalvoDoLookup('cidade', { codigo: '', nome: '', uf: '' });
    setCidadeLookupForm(salvo ?? { codigo: '', nome: '', uf: '' });
    setCidadeLookupApplied(false);
    setCidadeResults([]);
    setNaturalidadeLookupOpen(true);
    if (salvo) await handleCidadeSearch(salvo);
  }

  function closeNaturalidadeLookup() {
    setNaturalidadeLookupOpen(false);
  }

  async function handleCidadeSearch(filtro: typeof cidadeLookupForm = cidadeLookupForm) {
    setCidadeLoading(true);
    try {
      const results = await buscarCidades(filtro);
      setCidadeResults(results);
      setCidadeLookupApplied(true);
    } catch {
      setCidadeResults([]);
      setCidadeLookupApplied(true);
    } finally {
      setCidadeLoading(false);
    }
  }

  function handleCidadeSelect(cidade: Cidade) {
    const codigo = String(cidade.id);
    naturalidadeCodeRef.current = codigo;
    setForm({ ...form, cd_ibge_naturalidade: codigo });
    setNaturalidadeNome(`${cidade.nome} - ${cidade.uf}`);
    closeNaturalidadeLookup();
  }

  function clearCidadeLookup() {
    setCidadeLookupForm({ codigo: '', nome: '', uf: '' });
    setCidadeResults([]);
    setCidadeLookupApplied(false);
  }

  async function handleNaturalidadeCodeChange(codigo: string) {
    naturalidadeCodeRef.current = codigo;
    setForm({ ...form, cd_ibge_naturalidade: codigo });
    if (codigo.length < 7) {
      setNaturalidadeNome('');
      return;
    }
    try {
      const cidade = await cidadePorCodigo(codigo);
      if (naturalidadeCodeRef.current !== codigo) return;
      setNaturalidadeNome(cidade ? `${cidade.nome} - ${cidade.uf}` : '');
    } catch {
      if (naturalidadeCodeRef.current === codigo) setNaturalidadeNome('');
    }
  }

  /* ── Lookup de cidades da Pessoa Jurídica (Endereço/Filtro — API IBGE) ── */
  async function openPjCidadeLookup() {
    pjCidadeLookupTargetRef.current = 'form';
    await abrirPjCidadeLookup();
  }

  async function openPjFilterCidadeLookup() {
    pjCidadeLookupTargetRef.current = 'filter';
    await abrirPjCidadeLookup();
  }

  async function abrirPjCidadeLookup() {
    const salvo = filtroSalvoDoLookup('cidade', { codigo: '', nome: '', uf: '' });
    setPjCidadeLookupForm(salvo ?? { codigo: '', nome: '', uf: '' });
    setPjCidadeLookupApplied(false);
    setPjCidadeResults([]);
    setPjCidadeLookupOpen(true);
    if (salvo) await handlePjCidadeSearch(salvo);
  }

  function closePjCidadeLookup() {
    setPjCidadeLookupOpen(false);
  }

  async function handlePjCidadeSearch(filtro: typeof pjCidadeLookupForm = pjCidadeLookupForm) {
    setPjCidadeLoading(true);
    try {
      const results = await buscarCidades(filtro);
      setPjCidadeResults(results);
      setPjCidadeLookupApplied(true);
    } catch {
      setPjCidadeResults([]);
      setPjCidadeLookupApplied(true);
    } finally {
      setPjCidadeLoading(false);
    }
  }

  function handlePjCidadeSelect(cidade: Cidade) {
    const codigo = String(cidade.id);
    pjCidadeCodeRef.current = codigo;
    if (pjCidadeLookupTargetRef.current === 'filter') {
      // Grava no filtro de PJ — o nome é resolvido pelo próprio modal de filtro.
      setPjFilterForm((prev) => ({ ...prev, cd_ibge_cidade: codigo }));
    } else {
      setPjForm({ ...pjForm, cd_ibge_cidade: codigo });
      setPjCidadeNome(`${cidade.nome} - ${cidade.uf}`);
    }
    closePjCidadeLookup();
  }

  function clearPjCidadeLookup() {
    setPjCidadeLookupForm({ codigo: '', nome: '', uf: '' });
    setPjCidadeResults([]);
    setPjCidadeLookupApplied(false);
  }

  async function handlePjCidadeCodeChange(codigo: string) {
    pjCidadeCodeRef.current = codigo;
    setPjForm({ ...pjForm, cd_ibge_cidade: codigo });
    if (codigo.length < 7) {
      setPjCidadeNome('');
      return;
    }
    try {
      const cidade = await cidadePorCodigo(codigo);
      if (pjCidadeCodeRef.current !== codigo) return;
      setPjCidadeNome(cidade ? `${cidade.nome} - ${cidade.uf}` : '');
    } catch {
      if (pjCidadeCodeRef.current === codigo) setPjCidadeNome('');
    }
  }

  async function handleChangePasswordSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!passwordChangeUserId) return;
    setMessage("");

    if (!passwordChangeValue) {
      setMessage("Informe a nova senha.");
      return;
    }
    if (passwordChangeIsSelf && passwordChangeValue !== passwordChangeConfirmValue) {
      setMessage("As senhas não coincidem.");
      return;
    }

    setAdminSubmitting(true);

    try {
      if (passwordChangeIsSelf) {
        // Menu do usuário: a pessoa define a própria senha (tira a marca "alterar no próximo login").
        await atualizarPropriaSenha(passwordChangeUserId, passwordChangeValue);
      } else {
        // Menu de contexto de Usuários: marca o usuário se "Alterar senha no próximo login" estiver em Sim.
        await atualizarUsuario(passwordChangeUserId, { ds_senha: passwordChangeValue }, auditAutor);
      }
      await loadUsuarios();
      closeChangePasswordModal();
      setMessage("Senha alterada com sucesso!");
    } catch (error) {
      console.error("Erro ao alterar senha:", error);
      setMessage("Erro ao alterar senha.");
    } finally {
      setAdminSubmitting(false);
    }
  }
  function openFormContextMenu(event: React.MouseEvent) {
    if (view !== 'form' || !activeSection) return;
    let item: ContextMenuState['item'] | null = null;
    const section: SectionType = activeSection;

    if (activeSection === 'pessoaFisica') {
      if (pjManageSelection === 'pessoasJuridicas') {
        item = pessoasJuridicas.find((p) => p.id === pjEditingId) ?? null;
      } else {
        item = pessoasFisicas.find((p) => p.id === editingId) ?? null;
      }
    } else if (activeSection === 'administracaoSistema') {
      if (adminManageSelection === 'perfis') {
        item = perfis.find((p) => p.id === perfilEditingId) ?? null;
      } else {
        item = usuarios.find((u) => u.id === adminEditingId) ?? null;
      }
    } else if (activeSection === 'estruturaAcademica') {
      if (alunoManageSelection === 'colaboradores') {
        item = colaboradores.find((c) => c.id === colaboradorEditingId) ?? null;
      } else if (alunoManageSelection === 'periodoLetivo') {
        item = periodosLetivos.find((p) => p.id === periodoLetivoEditingId) ?? null;
      } else if (alunoManageSelection === 'cursos') {
        item = cursos.find((c) => c.id === cursoEditingId) ?? null;
      } else if (alunoManageSelection === 'disciplinas') {
        item = disciplinas.find((d) => d.id === disciplinaEditingId) ?? null;
      } else if (alunoManageSelection === 'turmas') {
        item = turmas.find((t) => t.id === turmaEditingId) ?? null;
      } else if (alunoManageSelection === 'turmasDisciplinas') {
        item = turmasDisciplinas.find((td) => td.id === turmaDisciplinaEditingId) ?? null;
      } else {
        item = alunos.find((a) => a.id === alunoEditingId) ?? null;
      }
    } else if (activeSection === 'controleCopias') {
      item = (copias.find((c) => c.id === copiaEditingId) ?? null) as unknown as ContextMenuState['item'] | null;
    } else if (activeSection === 'patrimonio') {
      item = ativoManageSelection === 'categoria'
        ? categoriasAtivos.find((c) => c.id === categoriaEditingId) ?? null
        : ativos.find((a) => a.id === ativoEditingId) ?? null;
    } else {
      item = cgItems.find((i) => i.id === cgEditingId) ?? null;
    }

    if (!item) return;
    // Itens protegidos (usuário administrador / perfil Administrador): o menu
    // abre só com "Ver" (ver isProtectedAdminItem).
    event.preventDefault();
    setContextMenu({ x: event.clientX, y: event.clientY, section, item });
  }

  async function handleDelete(id: string) {
    setMessage("");
    try {
      await excluirPessoaFisica(id);
      setMessage("Excluído com sucesso!");
      await loadPessoasFisicas();
    } catch {
      setMessage("Erro ao excluir.");
    }
    if (view === 'form') goToList();
  }

  async function handlePjDelete(id: string) {
    setMessage("");
    try {
      await excluirPessoaJuridica(id);
      setMessage("Excluído com sucesso!");
      await loadPessoasJuridicas();
    } catch {
      setMessage("Erro ao excluir.");
    }
    if (view === 'form') goToPjList();
  }

  /** Exclui o aluno junto com os responsáveis dele (que vão para Exclusões antes do aluno). */
  async function excluirAlunoComResponsaveis(id: string) {
    const aluno = alunos.find((a) => a.id === id);
    if (aluno) await excluirResponsaveisDoAluno(aluno.nr_sequencia);
    await excluirAluno(id);
  }

  async function handleAlunoDelete(id: string) {
    setMessage("");
    try {
      await excluirAlunoComResponsaveis(id);
      setMessage("Excluído com sucesso!");
      await loadAlunos();
    } catch {
      setMessage("Erro ao excluir.");
    }
    if (view === 'form') goToAlunoList();
  }

  /**
   * Alunos/colaboradores alvo de uma ação do menu de contexto: se o registro
   * clicado com o botão direito está marcado na coluna de seleção, a ação vale
   * para todos os marcados (visíveis na lista); senão, só para o clicado.
   */
  function alunosAlvoDoContexto(item: Aluno): Aluno[] {
    if (!item.id || !alunosSelecionados.includes(item.id)) return [item];
    const marcados = filteredSortedAlunos.filter((a) => a.id && alunosSelecionados.includes(a.id));
    return marcados.length > 0 ? marcados : [item];
  }
  function colaboradoresAlvoDoContexto(item: Colaborador): Colaborador[] {
    if (!item.id || !colaboradoresSelecionados.includes(item.id)) return [item];
    const marcados = filteredSortedColaboradores.filter((c) => c.id && colaboradoresSelecionados.includes(c.id));
    return marcados.length > 0 ? marcados : [item];
  }

  /** Exclui de uma vez os alunos selecionados (confirmado no modal "Excluir registro"). */
  async function handleAlunosDeleteLote(ids: string[]) {
    setMessage("");
    let excluidos = 0;
    try {
      excluidos = await aplicarEmLote(ids, (id) => excluirAlunoComResponsaveis(id));
      setMessage(`${ids.length} registros excluídos com sucesso!`);
      setAlunosSelecionados([]);
    } catch {
      setMessage(excluidos > 0 ? `Erro ao excluir: ${excluidos} de ${ids.length} registros foram excluídos.` : "Erro ao excluir.");
    }
    await loadAlunos();
  }

  /** Exclui de uma vez os colaboradores selecionados. */
  async function handleColaboradoresDeleteLote(ids: string[]) {
    setMessage("");
    let excluidos = 0;
    try {
      excluidos = await aplicarEmLote(ids, (id) => excluirColaborador(id));
      setMessage(`${ids.length} registros excluídos com sucesso!`);
      setColaboradoresSelecionados([]);
    } catch {
      setMessage(excluidos > 0 ? `Erro ao excluir: ${excluidos} de ${ids.length} registros foram excluídos.` : "Erro ao excluir.");
    }
    await loadColaboradores();
  }

  async function handleColaboradorDelete(id: string) {
    setMessage("");
    try {
      await excluirColaborador(id);
      setMessage("Excluído com sucesso!");
      await loadColaboradores();
    } catch {
      setMessage("Erro ao excluir.");
    }
    if (view === 'form') goToColaboradorList();
  }

  /** Abre o modal "Encerrar"/"Reativar" do período letivo, com a data atual preenchida. */
  function openStatusPeriodoModal(periodo: PeriodoLetivo, acao: 'encerrar' | 'reativar') {
    const hoje = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    setStatusPeriodoData(`${pad(hoje.getDate())}/${pad(hoje.getMonth() + 1)}/${hoje.getFullYear()}`);
    setStatusPeriodoModal({ periodo, acao });
    setMessage("");
  }

  function closeStatusPeriodoModal() {
    setStatusPeriodoModal(null);
  }

  /**
   * Encerrar: status Encerrado + Data de término.
   * Reativar: status Em andamento + Data de reativação (a Data de término é mantida como histórico).
   */
  async function handleStatusPeriodoSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!statusPeriodoModal?.periodo.id) return;
    const { periodo, acao } = statusPeriodoModal;
    const encerrar = acao === 'encerrar';
    setMessage("");
    if (parseDateInput(statusPeriodoData) === null) {
      setMessage(encerrar ? "Informe a data de término." : "Informe a data de reativação.");
      return;
    }
    setStatusPeriodoSaving(true);
    try {
      await atualizarPeriodoLetivo(
        periodo.id!,
        encerrar
          ? { ie_status: 'E', dt_termino: statusPeriodoData }
          : { ie_status: 'A', dt_reativacao: statusPeriodoData },
        auditAutor
      );
      closeStatusPeriodoModal();
      await loadPeriodosLetivos();
      if (view === 'form') goToPeriodoLetivoList();
      setMessage(encerrar ? "Período letivo encerrado com sucesso." : "Período letivo reativado com sucesso.");
    } catch {
      setMessage(encerrar ? "Erro ao encerrar o período letivo." : "Erro ao reativar o período letivo.");
    } finally {
      setStatusPeriodoSaving(false);
    }
  }

  async function handlePeriodoLetivoDelete(id: string) {
    setMessage("");
    try {
      const periodoExcluido = periodosLetivos.find((p) => p.id === id);
      await excluirPeriodoLetivo(id);
      // Os feriados pertencem ao período: saem junto com ele.
      if (periodoExcluido) await excluirFeriadosDoPeriodo(periodoExcluido.nr_sequencia);
      setMessage("Excluído com sucesso!");
      await loadPeriodosLetivos();
    } catch {
      setMessage("Erro ao excluir.");
    }
    if (view === 'form') goToPeriodoLetivoList();
  }

  async function handleAtivoDelete(id: string) {
    setMessage("");
    try {
      const ativoExcluido = ativos.find((a) => a.id === id);
      await excluirAtivo(id);
      // Os responsáveis pertencem ao ativo: saem junto com ele.
      if (ativoExcluido) await excluirResponsaveisDoAtivo(ativoExcluido.nr_sequencia);
      setMessage("Excluído com sucesso!");
      await loadAtivos();
    } catch {
      setMessage("Erro ao excluir.");
    }
    if (view === 'form') goToAtivoList();
  }

  /** Gera a matrícula de um aluno com base na regra salva (Estrutura Acadêmica > Parâmetros). */
  async function handleGerarMatricula(aluno: Aluno, lote: Aluno[] = [aluno]) {
    setMessage("");
    setGerandoMatricula(true);
    try {
      const doc = await obterParametro(COLECAO_PARAM_MATRICULA_ALUNO);
      if (!doc?.ds_regra) {
        setMessage("Nenhuma regra de geração de matrícula configurada.");
        return;
      }
      if (doc.ds_regra.split("-").every((v) => v.trim() === "")) {
        setMessage("Regra de matrícula vazia.");
        return;
      }

      const alvos = lote.filter((a) => a.id);
      if (alvos.length === 0) {
        setMessage("Erro: aluno sem ID.");
        return;
      }
      const regra = doc.ds_regra;
      const regerando = alvos.every((a) => !!a.nr_matricula?.trim());
      // Matrículas geradas neste lote: entram no Sequencial dos próximos.
      const geradas = new Map<string, string>();
      try {
        await aplicarEmLote(alvos, async (alvo) => {
          // Ao regerar, a matrícula atual do próprio aluno não conta para o Sequencial.
          const matricula = gerarCodigoPorRegra(
            regra,
            alvo.nr_sequencia,
            alunos.filter((a) => a.id !== alvo.id).map((a) => geradas.get(a.id ?? '') ?? a.nr_matricula ?? "")
          );
          await atualizarAluno(alvo.id as string, { nr_matricula: matricula }, auditAutor);
          geradas.set(alvo.id as string, matricula);
        });
      } finally {
        if (geradas.size > 0) await loadAlunos();
      }
      if (alvos.length > 1) setAlunosSelecionados([]);
      setMessage(alvos.length > 1
        ? `${alvos.length} matrículas ${regerando ? 'regeradas' : 'geradas'}.`
        : (regerando ? "Matrícula regerada." : "Matrícula gerada."));
    } catch (e) {
      console.error("Erro ao gerar matrícula", e);
      setMessage("Erro ao gerar matrícula.");
    } finally {
      setGerandoMatricula(false);
    }
  }

  /** Gera a matrícula de um colaborador com base na regra salva (Estrutura Acadêmica > Parâmetros). */
  async function handleGerarMatriculaColaborador(colaborador: Colaborador, lote: Colaborador[] = [colaborador]) {
    setMessage("");
    setGerandoMatricula(true);
    try {
      const doc = await obterParametro(COLECAO_PARAM_MATRICULA_COLABORADOR);
      if (!doc?.ds_regra) {
        setMessage("Nenhuma regra de geração de matrícula configurada.");
        return;
      }
      if (doc.ds_regra.split("-").every((v) => v.trim() === "")) {
        setMessage("Regra de matrícula vazia.");
        return;
      }
      const alvos = lote.filter((c) => c.id);
      if (alvos.length === 0) {
        setMessage("Erro: colaborador sem ID.");
        return;
      }
      const regra = doc.ds_regra;
      const regerando = alvos.every((c) => !!c.nr_matricula?.trim());
      // Matrículas geradas neste lote: entram no Sequencial dos próximos.
      const geradas = new Map<string, string>();
      try {
        await aplicarEmLote(alvos, async (alvo) => {
          // Ao regerar, a matrícula atual do próprio colaborador não conta para o Sequencial.
          const matricula = gerarCodigoPorRegra(
            regra,
            alvo.nr_sequencia,
            colaboradores.filter((c) => c.id !== alvo.id).map((c) => geradas.get(c.id ?? '') ?? c.nr_matricula ?? "")
          );
          await atualizarColaborador(alvo.id as string, { nr_matricula: matricula }, auditAutor);
          geradas.set(alvo.id as string, matricula);
        });
      } finally {
        if (geradas.size > 0) await loadColaboradores();
      }
      if (alvos.length > 1) setColaboradoresSelecionados([]);
      setMessage(alvos.length > 1
        ? `${alvos.length} matrículas ${regerando ? 'regeradas' : 'geradas'}.`
        : (regerando ? "Matrícula regerada." : "Matrícula gerada."));
    } catch (e) {
      console.error("Erro ao gerar matrícula de colaborador", e);
      setMessage("Erro ao gerar matrícula.");
    } finally {
      setGerandoMatricula(false);
    }
  }

  function openAlterarStatusModal(aluno: Aluno, lote: Aluno[] = [aluno]) {
    setModalCampoErros([]);
    setAlterarStatusAluno(aluno);
    setAlterarStatusAlunoLote(lote);
    // Data do status já vem com a data atual; os demais campos começam vazios
    // (o status atual NÃO fica disponível no dropdown e o motivo não é
    // preenchido mesmo se houver valor salvo no banco).
    const hoje = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    setAlterarStatusForm({
      dt_status: `${pad(hoje.getDate())}/${pad(hoje.getMonth() + 1)}/${hoje.getFullYear()}`,
      ie_status: '',
      ds_status: '',
    });
    setMessage("");
    setAlterarStatusModalOpen(true);
  }

  function closeAlterarStatusModal() {
    setAlterarStatusModalOpen(false);
    setAlterarStatusAluno(null);
    setAlterarStatusAlunoLote([]);
  }

  async function handleAlterarStatusSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!alterarStatusAluno?.id) return;
    setMessage("");
    if (!alterarStatusForm.ie_status) {
      setMessage("Selecione um status.");
      return;
    }
    if (!validarCamposModal(MODAL_ALUNO_ALTERAR_STATUS, alterarStatusForm)) return;
    const lote = (alterarStatusAlunoLote.length > 0 ? alterarStatusAlunoLote : [alterarStatusAluno]).filter((a) => a.id);
    setAlterarStatusSaving(true);
    let alterados = 0;
    try {
      alterados = await aplicarEmLote(lote, (a) => atualizarAluno(
        a.id as string,
        {
          dt_status: alterarStatusForm.dt_status,
          ie_status: alterarStatusForm.ie_status,
          ds_status: alterarStatusForm.ds_status,
        },
        auditAutor
      ));
      setMessage(lote.length > 1 ? `Status de ${lote.length} alunos alterado com sucesso!` : "Status alterado com sucesso!");
      if (lote.length > 1) setAlunosSelecionados([]);
      closeAlterarStatusModal();
      await loadAlunos();
    } catch {
      setMessage(alterados > 0 ? `Erro ao alterar o status: ${alterados} de ${lote.length} alunos foram alterados.` : "Erro ao alterar o status.");
      if (alterados > 0) await loadAlunos();
    } finally {
      setAlterarStatusSaving(false);
    }
  }

  /**
   * Ativos alvo de uma ação do menu de contexto: se o registro clicado com o
   * botão direito está marcado na coluna de seleção, a ação vale para todos os
   * marcados (visíveis na lista); senão, só para o registro clicado.
   */
  function ativosAlvoDoContexto(item: Ativo): Ativo[] {
    if (!item.id || !ativosSelecionados.includes(item.id)) return [item];
    const marcados = filteredSortedAtivos.filter((a) => a.id && ativosSelecionados.includes(a.id));
    return marcados.length > 0 ? marcados : [item];
  }

  /** Executa uma operação em cada ativo do lote, na ordem; para no primeiro erro. */
  async function aplicarEmLote<T>(lote: T[], operacao: (item: T) => Promise<unknown>): Promise<number> {
    let feitos = 0;
    for (const item of lote) {
      await operacao(item);
      feitos++;
    }
    return feitos;
  }

  /** Exclui de uma vez os ativos selecionados (confirmado no modal "Excluir registro"). */
  async function handleAtivosDeleteLote(ids: string[]) {
    setMessage("");
    let excluidos = 0;
    try {
      excluidos = await aplicarEmLote(ids, async (id) => {
        const ativoExcluido = ativos.find((a) => a.id === id);
        await excluirAtivo(id);
        if (ativoExcluido) await excluirResponsaveisDoAtivo(ativoExcluido.nr_sequencia);
      });
      setMessage(`${ids.length} registros excluídos com sucesso!`);
      setAtivosSelecionados([]);
    } catch {
      setMessage(excluidos > 0 ? `Erro ao excluir: ${excluidos} de ${ids.length} registros foram excluídos.` : "Erro ao excluir.");
    }
    await loadAtivos();
  }

  function openAtivoStatusModal(ativo: Ativo, statusValue: string, lote: Ativo[] = [ativo]) {
    setModalCampoErros([]);
    setAtivoStatusTarget(ativo);
    setAtivoStatusLote(lote);
    setAtivoStatusValue(statusValue);
    const hoje = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    setAtivoStatusForm({
      dt_data: `${pad(hoje.getDate())}/${pad(hoje.getMonth() + 1)}/${hoje.getFullYear()}`,
      ds_motivo_status: '',
    });
    setMessage("");
    setAtivoStatusModalOpen(true);
  }

  function closeAtivoStatusModal() {
    setAtivoStatusModalOpen(false);
    setAtivoStatusTarget(null);
    setAtivoStatusLote([]);
    setAtivoStatusValue('');
  }

  async function handleAtivoStatusSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!ativoStatusTarget?.id || !ativoStatusValue) return;
    setMessage("");
    if (!validarCamposModal(modalAtivoStatus, { dt_status: ativoStatusForm.dt_data, ds_motivo_status: ativoStatusForm.ds_motivo_status })) return;
    const lote = (ativoStatusLote.length > 0 ? ativoStatusLote : [ativoStatusTarget]).filter((a) => a.id);
    setAtivoStatusSaving(true);
    let alterados = 0;
    try {
      const updates: Record<string, unknown> = { ie_status: ativoStatusValue, dt_status: ativoStatusForm.dt_data, ds_motivo_status: ativoStatusForm.ds_motivo_status };
      if (ativoStatusValue === 'O') {
        // data do status e motivo já definidos acima
      } else if (ativoStatusValue === 'M') {
        updates.dt_ultima_manutencao = ativoStatusForm.dt_data;
      }
      alterados = await aplicarEmLote(lote, (a) => atualizarAtivo(a.id as string, updates as any, auditAutor));
      setMessage(lote.length > 1 ? `Status de ${lote.length} ativos alterado com sucesso!` : "Status alterado com sucesso!");
      if (lote.length > 1) setAtivosSelecionados([]);
      closeAtivoStatusModal();
      await loadAtivos();
    } catch {
      setMessage(alterados > 0 ? `Erro ao alterar o status: ${alterados} de ${lote.length} ativos foram alterados.` : "Erro ao alterar o status.");
      if (alterados > 0) await loadAtivos();
    } finally {
      setAtivoStatusSaving(false);
    }
  }

  function openAtivoTransferirModal(lote: Ativo[]) {
    setMessage("");
    setModalCampoErros([]);
    setAtivoTransferirErro(false);
    setAtivoTransferirMotivo('');
    // Um ativo (ou todos na mesma localização): já vem a atual selecionada.
    const locais = new Set(lote.map((a) => a.nr_seq_localizacao ?? ''));
    setAtivoTransferirLocal(locais.size === 1 ? String([...locais][0] ?? '') : '');
    setAtivoTransferirLote(lote);
  }

  function closeAtivoTransferirModal() {
    setAtivoTransferirLote([]);
    setAtivoTransferirLocal('');
    setAtivoTransferirMotivo('');
    setAtivoTransferirErro(false);
  }

  async function handleAtivoTransferirSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (ativoTransferirSaving) return;
    setMessage("");
    const destino = Number(ativoTransferirLocal);
    // Localização: campo principal, sempre obrigatório. Motivo: conforme Campos.
    const motivoOk = validarCamposModal(MODAL_ATIVO_TRANSFERIR, { ds_motivo_transferencia: ativoTransferirMotivo });
    if (!destino) {
      setAtivoTransferirErro(true);
      setMessage("Preencha os campos obrigatórios.");
      return;
    }
    if (!motivoOk) return;
    setAtivoTransferirErro(false);
    // Só transfere quem está em outra localização.
    const lote = ativoTransferirLote.filter((a) => a.id && a.nr_seq_localizacao !== destino);
    if (lote.length === 0) {
      setMessage(ativoTransferirLote.length > 1 ? "Os ativos já estão nesta localização." : "O ativo já está nesta localização.");
      return;
    }
    setAtivoTransferirSaving(true);
    let transferidos = 0;
    try {
      // O motivo vai junto (mesmo vazio, para não herdar o da transferência anterior):
      // o log de auditoria desta alteração é o registro da transferência.
      transferidos = await aplicarEmLote(lote, (a) => atualizarAtivo(a.id as string, { nr_seq_localizacao: destino, ds_motivo_transferencia: ativoTransferirMotivo.trim() }, auditAutor));
      setMessage(lote.length > 1 ? `${lote.length} ativos transferidos com sucesso!` : "Ativo transferido com sucesso!");
      if (ativoTransferirLote.length > 1) setAtivosSelecionados([]);
      closeAtivoTransferirModal();
      await loadAtivos();
    } catch {
      setMessage(transferidos > 0 ? `Erro ao transferir: ${transferidos} de ${lote.length} ativos foram transferidos.` : "Erro ao transferir.");
      if (transferidos > 0) await loadAtivos();
    } finally {
      setAtivoTransferirSaving(false);
    }
  }

  /* ── Enviar para manutenção (modal) ── */

  function openEnviarManutModal(ativo: Ativo, lote: Ativo[] = [ativo]) {
    setModalCampoErros([]);
    setEnviarManutTarget(ativo);
    setEnviarManutLote(lote);
    const hoje = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    setEnviarManutForm({ dt_data: `${pad(hoje.getDate())}/${pad(hoje.getMonth() + 1)}/${hoje.getFullYear()}`, nr_seq_prestador_servico: undefined, ds_motivo_manutencao: '' });
    setEnviarManutPrestLookupForm({ nr_sequencia: '', ds_nome: '', nr_cpf: '', nr_cnpj: '' });
    setEnviarManutPrestLookupFilter({ nr_sequencia: '', ds_nome: '', nr_cpf: '', nr_cnpj: '' });
    setEnviarManutPrestLookupApplied(false);
    setMessage('');
    setEnviarManutModalOpen(true);
  }

  function closeEnviarManutModal() {
    setEnviarManutModalOpen(false);
    setEnviarManutTarget(null);
    setEnviarManutLote([]);
  }

  /* ── Concluir manutenção (modal) ── */

  function openConcluirManutModalFromAtivo(ativo: Ativo, lote: Ativo[] = [ativo]) {
    setModalCampoErros([]);
    // Manutenção em andamento de cada ativo do lote (ativos sem manutenção aberta ficam de fora).
    const alvos = lote
      .map((a) => ({ ativo: a, manutencao: manutencoes.find((m) => m.nr_seq_ativo === a.nr_sequencia && m.ie_status_manutencao === 'E') }))
      .filter((x): x is { ativo: Ativo; manutencao: Manutencao } => !!x.manutencao);
    const principal = alvos.find((x) => x.ativo.id === ativo.id) ?? alvos[0];
    if (!principal) return;
    const hoje = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    setConcluirManutTarget(principal);
    setConcluirManutLote(alvos);
    setConcluirManutForm({
      dt_termino: `${pad(hoje.getDate())}/${pad(hoje.getMonth() + 1)}/${hoje.getFullYear()}`,
      vl_total: '',
      ie_isento: false,
      ds_correcoes: '',
      ie_status_ativo: 'O',
    });
    setMessage('');
    setConcluirManutModalOpen(true);
  }

  /**
   * Manutenções alvo de uma ação do menu de contexto: se a clicada com o botão
   * direito está marcada, a ação vale para todas as marcadas (visíveis na
   * lista); senão, só para a clicada.
   */
  function manutencoesAlvoDoContexto(item: Manutencao): Manutencao[] {
    if (!item.id || !manutencoesSelecionadas.includes(item.id)) return [item];
    const marcadas = filteredSortedManutencoes.filter((m) => m.id && manutencoesSelecionadas.includes(m.id));
    return marcadas.length > 0 ? marcadas : [item];
  }

  /** Exclui de uma vez as manutenções selecionadas (confirmado no modal "Excluir registro"). */
  async function handleManutencoesDeleteLote(ids: string[]) {
    setMessage('');
    let excluidas = 0;
    try {
      excluidas = await aplicarEmLote(ids, (id) => excluirManutencao(id));
      setMessage(`${ids.length} registros excluídos com sucesso!`);
      setManutencoesSelecionadas([]);
    } catch {
      setMessage(excluidas > 0 ? `Erro ao excluir: ${excluidas} de ${ids.length} registros foram excluídos.` : 'Erro ao excluir.');
    }
    await loadManutencoes();
  }

  function openConcluirManutModalFromManut(manut: Manutencao, lote: Manutencao[] = [manut]) {
    setModalCampoErros([]);
    const alvoDe = (m: Manutencao) => ({ ativo: ativos.find((a) => a.nr_sequencia === m.nr_seq_ativo) ?? null, manutencao: m });
    const hoje = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    setConcluirManutTarget(alvoDe(manut));
    setConcluirManutLote(lote.length > 1 ? lote.map(alvoDe) : []);
    setConcluirManutForm({
      dt_termino: `${pad(hoje.getDate())}/${pad(hoje.getMonth() + 1)}/${hoje.getFullYear()}`,
      vl_total: '',
      ie_isento: false,
      ds_correcoes: '',
      ie_status_ativo: 'O',
    });
    setMessage('');
    setConcluirManutModalOpen(true);
  }

  function closeConcluirManutModal() {
    setConcluirManutModalOpen(false);
    setConcluirManutTarget(null);
    setConcluirManutLote([]);
  }

  function openCancelarManutModal(manut: Manutencao, lote: Manutencao[] = [manut]) {
    setCancelarManutTarget(manut);
    setCancelarManutLote(lote);
    setCancelarManutOpen(true);
  }

  async function handleCancelarManutSubmit() {
    if (!cancelarManutTarget || cancelarManutSaving) return;
    const lote = cancelarManutLote.length > 0 ? cancelarManutLote : [cancelarManutTarget];
    setCancelarManutSaving(true);
    let canceladas = 0;
    try {
      canceladas = await aplicarEmLote(lote, async (manut) => {
        await atualizarManutencao(manut.id!, { ie_status_manutencao: 'CA', dt_termino: manut.dt_termino || new Date().toISOString().slice(0, 10) } as any, auditAutor);
        const ativo = ativos.find((a) => a.nr_sequencia === manut.nr_seq_ativo);
        if (ativo && ativo.id) {
          await atualizarAtivo(ativo.id, { ie_status: 'O', dt_status: manut.dt_termino || new Date().toISOString().slice(0, 10) } as any, auditAutor);
        }
      });
      setMessage(lote.length > 1 ? `${lote.length} manutenções canceladas com sucesso.` : 'Manutenção cancelada com sucesso.');
      if (lote.length > 1) setManutencoesSelecionadas([]);
      setCancelarManutOpen(false);
      setCancelarManutTarget(null);
      setCancelarManutLote([]);
      await loadAtivos();
      await loadManutencoes();
    } catch {
      setMessage(canceladas > 0 ? `Erro ao cancelar manutenção: ${canceladas} de ${lote.length} foram canceladas.` : 'Erro ao cancelar manutenção.');
      if (canceladas > 0) { await loadAtivos(); await loadManutencoes(); }
    } finally {
      setCancelarManutSaving(false);
    }
  }

  async function handleConcluirManutSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!concluirManutTarget) return;
    setMessage('');
    // Isento conta como valor informado (o valor total é zerado).
    if (!validarCamposModal(MODAL_CONCLUIR_MANUTENCAO, {
      dt_termino: concluirManutForm.dt_termino,
      vl_total: concluirManutForm.ie_isento ? '0,00' : concluirManutForm.vl_total,
      ds_correcoes: concluirManutForm.ds_correcoes,
    })) return;
    const lote = concluirManutLote.length > 0 ? concluirManutLote : [concluirManutTarget];
    setConcluirManutSaving(true);
    let concluidas = 0;
    try {
      const updates: Record<string, unknown> = { dt_termino: concluirManutForm.dt_termino, ie_status_manutencao: 'CO' };
      // Isento: manutenção sem custos (ex.: o prestador avaliou e não havia solução) — valor total zerado.
      // Checkbox: marcado = 'S', desmarcado = 'N'.
      updates.ie_isento = concluirManutForm.ie_isento ? 'S' : 'N';
      if (concluirManutForm.ie_isento) {
        updates.vl_total = '0,00';
      } else if (concluirManutForm.vl_total) {
        updates.vl_total = concluirManutForm.vl_total;
      }
      if (concluirManutForm.ds_correcoes) updates.ds_correcoes = concluirManutForm.ds_correcoes;
      const ativoUpdates: Record<string, unknown> = { ie_status: concluirManutForm.ie_status_ativo || 'O' };
      if (concluirManutForm.ie_status_ativo === 'O') {
        ativoUpdates.dt_status = concluirManutForm.dt_termino;
      }
      concluidas = await aplicarEmLote(lote, async (alvo) => {
        await atualizarManutencao(alvo.manutencao.id!, updates as any, auditAutor);
        if (alvo.ativo) await atualizarAtivo(alvo.ativo.id!, ativoUpdates as any, auditAutor);
      });
      setMessage(lote.length > 1 ? `${lote.length} manutenções concluídas com sucesso!` : 'Manutenção concluída com sucesso!');
      if (lote.length > 1) { setAtivosSelecionados([]); setManutencoesSelecionadas([]); }
      closeConcluirManutModal();
      await loadAtivos();
      await loadManutencoes();
    } catch {
      setMessage(concluidas > 0 ? `Erro ao concluir manutenção: ${concluidas} de ${lote.length} foram concluídas.` : 'Erro ao concluir manutenção.');
      if (concluidas > 0) { await loadAtivos(); await loadManutencoes(); }
    } finally {
      setConcluirManutSaving(false);
    }
  }

  function openEnviarManutPrestadorLookup(target: 'modal' | 'form' | 'ativoResponsavel' | 'ativoFilter' | 'assumirAtivos' | 'ativoFornecedor' | 'ativoFilterFornecedor' | 'copiaSolicitante' | 'copiaFiltroSolicitante' = 'modal') {
    enviarManutPrestadorLookupTargetRef.current = target;
    const fornecedor = target === 'ativoFornecedor' || target === 'ativoFilterFornecedor';
    const todos = target === 'ativoResponsavel' || target === 'ativoFilter' || target === 'assumirAtivos' || target === 'copiaSolicitante' || target === 'copiaFiltroSolicitante';
    setLookupColaboradorFornecedor(fornecedor);
    setLookupColaboradorTodos(todos);
    const salvo = filtroSalvoDoLookup(idLookupColaborador(fornecedor, todos), { nr_sequencia: '', ds_nome: '', nr_cpf: '', nr_cnpj: '' });
    setEnviarManutPrestLookupForm(salvo ?? enviarManutPrestLookupFilter);
    if (salvo) setEnviarManutPrestLookupFilter(salvo);
    setEnviarManutPrestLookupApplied(!!salvo);
    setEnviarManutPrestadorLookupOpen(true);
  }

  /** Filtro salvo do lookup de colaboradores: um por janela (fornecedor, colaborador, prestador de serviço). */
  function idLookupColaborador(fornecedor: boolean, todos: boolean) {
    return fornecedor ? 'fornecedor' : todos ? 'colaborador' : 'prestador_servico';
  }

  function closeEnviarManutPrestadorLookup() {
    setEnviarManutPrestadorLookupOpen(false);
  }

  function applyEnviarManutPrestadorLookup() {
    setEnviarManutPrestLookupFilter(enviarManutPrestLookupForm);
    setEnviarManutPrestLookupApplied(true);
  }

  function clearEnviarManutPrestadorLookup() {
    const empty = { nr_sequencia: '', ds_nome: '', nr_cpf: '', nr_cnpj: '' };
    setEnviarManutPrestLookupForm(empty);
    setEnviarManutPrestLookupFilter(empty);
    setEnviarManutPrestLookupApplied(false);
  }

  function handleEnviarManutPrestadorSelect(colaborador: Colaborador) {
    const target = enviarManutPrestadorLookupTargetRef.current;
    if (target === 'form') {
      setManutencaoForm((prev) => ({ ...prev, nr_seq_prestador_servico: colaborador.nr_sequencia }));
    } else if (target === 'ativoResponsavel') {
      ativoResponsavelLookupCallbackRef.current?.(colaborador.nr_sequencia);
      ativoResponsavelLookupCallbackRef.current = null;
    } else if (target === 'ativoFilter') {
      setAtivoFilterForm((prev) => ({ ...prev, nr_seq_responsavel: String(colaborador.nr_sequencia) }));
    } else if (target === 'ativoFornecedor') {
      setAtivoForm((prev) => ({ ...prev, nr_seq_fornecedor: colaborador.nr_sequencia }));
    } else if (target === 'ativoFilterFornecedor') {
      setAtivoFilterForm((prev) => ({ ...prev, nr_seq_fornecedor: String(colaborador.nr_sequencia) }));
    } else if (target === 'copiaSolicitante') {
      setCopiaExtra((prev) => ({ ...prev, nr_seq_solicitante: String(colaborador.nr_sequencia) }));
    } else if (target === 'copiaFiltroSolicitante') {
      setCopiaFiltroExtra((prev) => ({ ...prev, nr_seq_solicitante: String(colaborador.nr_sequencia) }));
    } else if (target === 'assumirAtivos') {
      setAssumirAtivosOrigem(String(colaborador.nr_sequencia));
      setAssumirAtivosErro(false);
    } else {
      setEnviarManutForm((prev) => ({ ...prev, nr_seq_prestador_servico: colaborador.nr_sequencia }));
    }
    closeEnviarManutPrestadorLookup();
  }

  async function handleEnviarManutSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!enviarManutTarget?.id) return;
    setMessage('');
    if (!validarCamposModal(MODAL_ENVIAR_MANUTENCAO, {
      dt_envio: enviarManutForm.dt_data,
      nr_seq_prestador_servico: enviarManutForm.nr_seq_prestador_servico,
      ds_motivo_manutencao: enviarManutForm.ds_motivo_manutencao,
    })) return;
    const lote = (enviarManutLote.length > 0 ? enviarManutLote : [enviarManutTarget]).filter((a) => a.id);
    setEnviarManutSaving(true);
    let enviados = 0;
    try {
      // Uma manutenção para cada ativo, com os mesmos dados do modal.
      enviados = await aplicarEmLote(lote, async (ativo) => {
        const { nr_sequencia: nrSeqManut } = await criarManutencao({
          nr_seq_ativo: ativo.nr_sequencia,
          nr_seq_prestador_servico: enviarManutForm.nr_seq_prestador_servico,
          dt_envio: enviarManutForm.dt_data,
          dt_termino: '',
          ie_status_manutencao: 'E',
          vl_total: undefined,
          ds_observacao: '',
          ds_motivo_manutencao: enviarManutForm.ds_motivo_manutencao,
        }, auditAutor);
        await atualizarAtivo(ativo.id as string, { ie_status: 'M', dt_status: enviarManutForm.dt_data, dt_ultima_manutencao: enviarManutForm.dt_data, nr_seq_ultima_manutencao: nrSeqManut, ds_motivo_status: enviarManutForm.ds_motivo_manutencao } as any, auditAutor);
      });
      setMessage(lote.length > 1 ? `${lote.length} ativos enviados para manutenção com sucesso.` : 'Ativo enviado para manutenção com sucesso.');
      if (lote.length > 1) setAtivosSelecionados([]);
      closeEnviarManutModal();
      await loadAtivos();
      await loadManutencoes();
    } catch {
      setMessage(enviados > 0 ? `Erro ao enviar para manutenção: ${enviados} de ${lote.length} ativos foram enviados.` : 'Erro ao enviar para manutenção.');
      if (enviados > 0) { await loadAtivos(); await loadManutencoes(); }
    } finally {
      setEnviarManutSaving(false);
    }
  }

  /* ── Manutenções: CRUD ── */

  const emptyManutencaoForm: ManutencaoFormData = {
    nr_seq_ativo: undefined,
    nr_seq_prestador_servico: undefined,
    dt_envio: '',
    dt_termino: '',
    ie_status_manutencao: 'E',
    vl_total: undefined,
    ds_observacao: '',
    ds_motivo_manutencao: '',
    ds_correcoes: '',
  };

  function goToManutencaoList() {
    setView('list');
    setManutencaoEditingId(null);
    setManutencaoForm(emptyManutencaoForm);
    setManutencaoCampoErros([]);
    setMessage('');
  }

  function handleManutencaoNewForm() {
    if (!permissoesPatrimonio.adicionarManutencao) {
      setMessage("Você não tem permissão para adicionar.");
      return;
    }
    const hoje = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const dataAtual = `${pad(hoje.getDate())}/${pad(hoje.getMonth() + 1)}/${hoje.getFullYear()}`;
    setManutencaoForm({ ...emptyManutencaoForm, dt_envio: dataAtual });
    setManutencaoEditingId(null);
    setManutencaoAuditInfo({ createdAt: '', updatedAt: '', createdBy: '', updatedBy: '' });
    auditManutencaoIdRef.current = null;
    setMessage('');
    setManutencaoCampoErros([]);
    setView('form');
    setActiveSection('patrimonio');
    setAtivoManageSelection('manutencoes');
  }

  /* ── Lookup de ativo no formulário de manutenção ── */
  function openManutencaoAtivoLookup() {
    manutencaoAtivoLookupTargetRef.current = 'manutencao';
    abrirManutencaoAtivoLookup();
  }
  function openManutencaoFilterAtivoLookup() {
    manutencaoAtivoLookupTargetRef.current = 'manutencaoFilter';
    abrirManutencaoAtivoLookup();
  }
  function abrirManutencaoAtivoLookup() {
    const salvo = filtroSalvoDoLookup('ativo', { nr_sequencia: '', ds_ativo: '', ds_modelo: '', ie_status: '' });
    setManutencaoAtivoLookupForm(salvo ?? manutencaoAtivoLookupFilter);
    if (salvo) setManutencaoAtivoLookupFilter(salvo);
    setManutencaoAtivoLookupApplied(!!salvo);
    setManutencaoAtivoLookupOpen(true);
  }
  function closeManutencaoAtivoLookup() {
    setManutencaoAtivoLookupOpen(false);
  }
  function applyManutencaoAtivoLookup() {
    setManutencaoAtivoLookupFilter(manutencaoAtivoLookupForm);
    setManutencaoAtivoLookupApplied(true);
  }
  function clearManutencaoAtivoLookup() {
    const empty = { nr_sequencia: '', ds_ativo: '', ds_modelo: '', ie_status: '' };
    setManutencaoAtivoLookupForm(empty);
    setManutencaoAtivoLookupFilter(empty);
    setManutencaoAtivoLookupApplied(false);
  }
  function handleManutencaoAtivoSelect(ativo: Ativo) {
    const target = manutencaoAtivoLookupTargetRef.current;
    if (target === 'manutencaoFilter') {
      setManutencaoFilterForm((prev) => ({ ...prev, nr_seq_ativo: String(ativo.nr_sequencia) }));
    } else {
      setManutencaoForm((prev) => ({ ...prev, nr_seq_ativo: ativo.nr_sequencia }));
    }
    closeManutencaoAtivoLookup();
  }

  function openManutencaoEditForm(m: Manutencao) {
    setManutencaoForm({
      nr_seq_ativo: m.nr_seq_ativo,
      nr_seq_prestador_servico: m.nr_seq_prestador_servico ?? m.nr_seq_pessoa_fisica,
      dt_envio: m.dt_envio ?? '',
      dt_termino: m.dt_termino ?? '',
      ie_status_manutencao: m.ie_status_manutencao ?? 'E',
      vl_total: m.vl_total,
      ds_observacao: m.ds_observacao ?? '',
      ds_motivo_manutencao: m.ds_motivo_manutencao ?? '',
      ds_correcoes: m.ds_correcoes ?? '',
    });
    setManutencaoEditingId(m.id ?? null);
    setManutencaoAuditInfo({
      createdAt: m.dt_criacao ?? '',
      updatedAt: m.dt_alteracao ?? '',
      createdBy: m.ds_usuario_criacao ?? '',
      updatedBy: m.ds_usuario_alteracao ?? '',
    });
    auditManutencaoIdRef.current = m.id ?? null;
    setMessage('');
    setManutencaoCampoErros([]);
    setView('form');
    setActiveSection('patrimonio');
    if (m.id) carregarAutorAuditoriaManutencao(m.id);
  }

  const filteredManutencoes = useMemo(() => manutencoes.filter((m) => {
    // Identificação
    if (appliedManutencaoFilterForm.nr_sequencia) {
      const q = appliedManutencaoFilterForm.nr_sequencia.replace(/\D/g, '');
      if (q && String(m.nr_sequencia) !== q) return false;
    }
    if (appliedManutencaoFilterForm.nr_seq_ativo) {
      const q = appliedManutencaoFilterForm.nr_seq_ativo.replace(/\D/g, '');
      if (q && String(m.nr_seq_ativo ?? '') !== q) return false;
    }
    // Dados da manutenção
    if (appliedManutencaoFilterForm.nr_seq_prestador_servico) {
      const q = appliedManutencaoFilterForm.nr_seq_prestador_servico.replace(/\D/g, '');
      if (q && String(m.nr_seq_prestador_servico ?? (m as any).nr_seq_pessoa_fisica ?? '') !== q) return false;
    }
    if (appliedManutencaoFilterForm.dt_envio_inicio && m.dt_envio && m.dt_envio < appliedManutencaoFilterForm.dt_envio_inicio) return false;
    if (appliedManutencaoFilterForm.dt_envio_fim && m.dt_envio && m.dt_envio > appliedManutencaoFilterForm.dt_envio_fim) return false;
    if (appliedManutencaoFilterForm.dt_termino_inicio && m.dt_termino && m.dt_termino < appliedManutencaoFilterForm.dt_termino_inicio) return false;
    if (appliedManutencaoFilterForm.dt_termino_fim && m.dt_termino && m.dt_termino > appliedManutencaoFilterForm.dt_termino_fim) return false;
    if (appliedManutencaoFilterForm.vl_total_menor) {
      const minVal = Number(appliedManutencaoFilterForm.vl_total_menor.replace(/[^\d.,]/g, '').replace(',', '.'));
      const regVal = Number(String(m.vl_total ?? '').replace(/[^\d.,]/g, '').replace(',', '.'));
      if (!isNaN(minVal) && regVal < minVal) return false;
    }
    if (appliedManutencaoFilterForm.vl_total_maior) {
      const maxVal = Number(appliedManutencaoFilterForm.vl_total_maior.replace(/[^\d.,]/g, '').replace(',', '.'));
      const regVal = Number(String(m.vl_total ?? '').replace(/[^\d.,]/g, '').replace(',', '.'));
      if (!isNaN(maxVal) && regVal > maxVal) return false;
    }
    if (appliedManutencaoFilterForm.ie_status_manutencao !== 'T' && m.ie_status_manutencao !== appliedManutencaoFilterForm.ie_status_manutencao) return false;
    return true;
  }), [manutencoes, appliedManutencaoFilterForm]);

  const filteredSortedManutencoes = useMemo(() => {
    // Ordem padrão: coluna # decrescente (mais recente primeiro).
    const list = [...filteredManutencoes].sort((a, b) => b.nr_sequencia - a.nr_sequencia);
    if (manutencaoSortColumn !== null && manutencaoSortAsc !== null) {
      list.sort((a, b) => {
        const colKey = MANUTENCAO_COLUMNS[manutencaoSortColumn]?.key;
        if (!colKey) return 0;
        const av = (a as unknown as Record<string, unknown>)[colKey];
        const bv = (b as unknown as Record<string, unknown>)[colKey];
        if (av == null && bv == null) return 0;
        if (av == null) return 1;
        if (bv == null) return -1;
        const an = Number(av);
        const bn = Number(bv);
        if (!isNaN(an) && !isNaN(bn)) return manutencaoSortAsc ? an - bn : bn - an;
        return manutencaoSortAsc ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
      });
    }
    return list;
  }, [filteredManutencoes, manutencaoSortColumn, manutencaoSortAsc]);

  const currentManutencaoEditIndex = useMemo(() => {
    if (!manutencaoEditingId) return -1;
    return filteredSortedManutencoes.findIndex((m) => m.id === manutencaoEditingId);
  }, [manutencaoEditingId, filteredSortedManutencoes]);

  const hasPrevManutencaoRecord = currentManutencaoEditIndex > 0;
  const hasNextManutencaoRecord = currentManutencaoEditIndex >= 0 && currentManutencaoEditIndex < filteredSortedManutencoes.length - 1;

  function goToPrevManutencaoRecord() {
    if (currentManutencaoEditIndex > 0) {
      openManutencaoEditForm(filteredSortedManutencoes[currentManutencaoEditIndex - 1]);
    }
  }

  function goToNextManutencaoRecord() {
    if (currentManutencaoEditIndex >= 0 && currentManutencaoEditIndex < filteredSortedManutencoes.length - 1) {
      openManutencaoEditForm(filteredSortedManutencoes[currentManutencaoEditIndex + 1]);
    }
  }

  function handleManutencaoDelete(id: string) {
    const m = manutencoes.find((man) => man.id === id);
    setConfirmDeleteMessage(`Deseja mesmo excluir o registro ${m?.nr_sequencia ?? ''}?`);
    setConfirmDeleteAction(() => async () => {
      try {
        await excluirManutencao(id);
        await loadManutencoes();
      } catch {
        setMessage('Erro ao excluir.');
      }
    });
    setConfirmDeleteOpen(true);
  }

  async function handleManutencaoSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (manutencaoEditingId && bloquearEdicaoSemPermissao(permissoesPatrimonio.editarManutencao)) return;
    setMessage('');
    setManutencaoCampoErros([]);
    const obrigatorios = camposObrigatoriosVazios(manutencaoForm as unknown as Record<string, unknown>, campoRegrasDaColecao(campoRegrasAtivas, 'pat_manutencao'));
    if (obrigatorios.length > 0) {
      setManutencaoCampoErros(obrigatorios);
      setMessage('Preencha os campos obrigatórios.');
      return;
    }
    setManutencaoSubmitting(true);
    try {
      if (manutencaoEditingId) {
        const current = manutencoes.find((m) => m.id === manutencaoEditingId);
        const formKeys: Array<keyof ManutencaoFormData> = ['nr_seq_ativo', 'nr_seq_prestador_servico', 'dt_envio', 'dt_termino', 'ie_status_manutencao', 'vl_total', 'ds_observacao', 'ds_motivo_manutencao', 'ds_correcoes'];
        const hasChanges = current ? formKeys.some((k) => String((current as unknown as Record<string, unknown>)[k] ?? '') !== String((manutencaoForm as unknown as Record<string, unknown>)[k] ?? '')) : true;
        if (!hasChanges) {
          setMessage('Nenhuma alteração detectada.');
          setManutencaoForm(emptyManutencaoForm);
          setManutencaoEditingId(null);
          await loadManutencoes();
          setView('list');
          abrirNovoAposSalvar();
          return;
        }
        await atualizarManutencao(manutencaoEditingId, manutencaoForm, auditAutor);
      } else {
        await criarManutencao(manutencaoForm, auditAutor);
      }
      await loadManutencoes();
      setView('list');
      abrirNovoAposSalvar();
    } catch {
      setMessage('Erro ao salvar.');
    } finally {
      setManutencaoSubmitting(false);
    }
  }

  function handleManutencaoSortChange(logicalIndex: number) {
    if (manutencaoSortColumn === logicalIndex) {
      setManutencaoSortAsc((prev) => (prev === null ? true : prev ? false : null));
      if (manutencaoSortAsc === false) {
        setManutencaoSortColumn(null);
      }
    } else {
      setManutencaoSortColumn(logicalIndex);
      setManutencaoSortAsc(true);
    }
  }

  async function carregarAutorAuditoriaManutencao(id: string) {
    try {
      const logs = await fetchAuditByDocumentId('pat_manutencao', id);
      if (auditManutencaoIdRef.current !== id) return;
      const createLog = logs.find((l) => String(l.acao ?? '').toLowerCase() === 'create');
      const lastChangeLog = logs.find((l) => {
        const acao = String(l.acao ?? '').toLowerCase();
        return acao === 'update';
      });
      setManutencaoAuditInfo((prev) => ({
        ...prev,
        createdBy: createLog?.usuarioNome ?? prev.createdBy,
        updatedBy: lastChangeLog?.usuarioNome ?? prev.updatedBy,
      }));
    } catch {
      // mantém vazio
    }
  }

  async function openManutencaoAuditModal(manutencaoId?: string | null) {
    if (!manutencaoId) return;
    setAuditDocumentType('pat_manutencao');
    setAuditModalOpen(true);
    setAuditLoading(true);
    try {
      const logs = await fetchAuditByDocumentId('pat_manutencao', manutencaoId);
      setAuditLogs(logs);
    } catch {
      setAuditLogs([]);
    } finally {
      setAuditLoading(false);
    }
  }

  function openAlterarIngressoModal(aluno: Aluno, lote: Aluno[] = [aluno]) {
    setAlterarIngressoAluno(aluno);
    setAlterarIngressoLote(lote);
    // Igual ao modal "Alterar status": a data já vem preenchida com a data atual.
    const hoje = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    setAlterarIngressoForm({
      dt_ingresso: `${pad(hoje.getDate())}/${pad(hoje.getMonth() + 1)}/${hoje.getFullYear()}`,
    });
    setMessage("");
    setAlterarIngressoModalOpen(true);
  }

  function closeAlterarIngressoModal() {
    setAlterarIngressoModalOpen(false);
    setAlterarIngressoAluno(null);
    setAlterarIngressoLote([]);
  }

  async function handleAlterarIngressoSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!alterarIngressoAluno?.id) return;
    setMessage("");
    if (!alterarIngressoForm.dt_ingresso) {
      setMessage("Informe a data de ingresso.");
      return;
    }
    const lote = (alterarIngressoLote.length > 0 ? alterarIngressoLote : [alterarIngressoAluno]).filter((a) => a.id);
    setAlterarIngressoSaving(true);
    let alterados = 0;
    try {
      alterados = await aplicarEmLote(lote, (a) => atualizarAluno(
        a.id as string,
        { dt_ingresso: alterarIngressoForm.dt_ingresso },
        auditAutor
      ));
      setMessage(lote.length > 1 ? `Data de ingresso de ${lote.length} alunos alterada com sucesso!` : "Data de ingresso alterada com sucesso!");
      if (lote.length > 1) setAlunosSelecionados([]);
      closeAlterarIngressoModal();
      await loadAlunos();
    } catch {
      setMessage(alterados > 0 ? `Erro ao alterar a data de ingresso: ${alterados} de ${lote.length} alunos foram alterados.` : "Erro ao alterar a data de ingresso.");
      if (alterados > 0) await loadAlunos();
    } finally {
      setAlterarIngressoSaving(false);
    }
  }

  function openAlterarAdmissaoModal(colaborador: Colaborador, lote: Colaborador[] = [colaborador]) {
    setAlterarAdmissaoColaborador(colaborador);
    setAlterarAdmissaoLote(lote);
    // Igual ao modal "Alterar data de ingresso": já vem preenchido com a data atual.
    const hoje = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    setAlterarAdmissaoForm({
      dt_admissao: `${pad(hoje.getDate())}/${pad(hoje.getMonth() + 1)}/${hoje.getFullYear()}`,
    });
    setMessage("");
    setAlterarAdmissaoModalOpen(true);
  }

  function closeAlterarAdmissaoModal() {
    setAlterarAdmissaoModalOpen(false);
    setAlterarAdmissaoColaborador(null);
    setAlterarAdmissaoLote([]);
  }

  async function handleAlterarAdmissaoSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!alterarAdmissaoColaborador?.id) return;
    setMessage("");
    if (!alterarAdmissaoForm.dt_admissao) {
      setMessage("Informe a data de admissão.");
      return;
    }
    const lote = (alterarAdmissaoLote.length > 0 ? alterarAdmissaoLote : [alterarAdmissaoColaborador]).filter((c) => c.id);
    setAlterarAdmissaoSaving(true);
    let alterados = 0;
    try {
      alterados = await aplicarEmLote(lote, (c) => atualizarColaborador(
        c.id as string,
        { dt_admissao: alterarAdmissaoForm.dt_admissao },
        auditAutor
      ));
      setMessage(lote.length > 1 ? `Data de admissão de ${lote.length} colaboradores alterada com sucesso!` : "Data de admissão alterada com sucesso!");
      if (lote.length > 1) setColaboradoresSelecionados([]);
      closeAlterarAdmissaoModal();
      await loadColaboradores();
    } catch {
      setMessage(alterados > 0 ? `Erro ao alterar a data de admissão: ${alterados} de ${lote.length} colaboradores foram alterados.` : "Erro ao alterar a data de admissão.");
      if (alterados > 0) await loadColaboradores();
    } finally {
      setAlterarAdmissaoSaving(false);
    }
  }

  function openAlterarStatusColaboradorModal(colaborador: Colaborador, lote: Colaborador[] = [colaborador]) {
    setModalCampoErros([]);
    setAlterarStatusColaborador(colaborador);
    setAlterarStatusColaboradorLote(lote);
    // Igual ao modal "Alterar status" do aluno: a data já vem com a data atual,
    // os demais campos começam vazios (o status atual NÃO fica disponível no
    // dropdown e o motivo não é preenchido mesmo se houver valor salvo no banco).
    const hoje = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    setAlterarStatusColaboradorForm({
      dt_status: `${pad(hoje.getDate())}/${pad(hoje.getMonth() + 1)}/${hoje.getFullYear()}`,
      ie_status: '',
      ds_motivo_status: '',
    });
    setMessage("");
    setAlterarStatusColaboradorModalOpen(true);
  }

  function closeAlterarStatusColaboradorModal() {
    setAlterarStatusColaboradorModalOpen(false);
    setAlterarStatusColaborador(null);
    setAlterarStatusColaboradorLote([]);
  }

  function openAssumirAtivosModal(colaborador: Colaborador) {
    setMessage("");
    setAssumirAtivosDestino(colaborador);
    setAssumirAtivosOrigem('');
    setAssumirAtivosModo('');
    setAssumirAtivosErro(false);
    setAssumirAtivosModoErro(false);
  }

  function closeAssumirAtivosModal() {
    setAssumirAtivosDestino(null);
    setAssumirAtivosOrigem('');
    setAssumirAtivosModo('');
    setAssumirAtivosErro(false);
    setAssumirAtivosModoErro(false);
  }

  async function handleAssumirAtivosSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!assumirAtivosDestino || assumirAtivosSaving) return;
    setMessage("");
    const origem = Number(assumirAtivosOrigem);
    const modo = assumirAtivosModo;
    // Colaborador e Modo são obrigatórios: marca os dois de uma vez.
    setAssumirAtivosErro(!origem);
    setAssumirAtivosModoErro(!modo);
    if (!origem || !modo) {
      setMessage("Preencha os campos obrigatórios.");
      return;
    }
    if (!colaboradores.some((c) => c.nr_sequencia === origem)) {
      setAssumirAtivosErro(true);
      setMessage("Colaborador não encontrado.");
      return;
    }
    if (origem === assumirAtivosDestino.nr_sequencia) {
      setAssumirAtivosErro(true);
      setMessage("Selecione um colaborador diferente do que vai assumir os ativos.");
      return;
    }
    setAssumirAtivosErro(false);
    setAssumirAtivosSaving(true);
    try {
      const { assumidos, jaResponsavel } = await assumirAtivosDoColaborador(origem, assumirAtivosDestino.nr_sequencia, modo, auditAutor);
      if (assumidos === 0 && jaResponsavel === 0) {
        setMessage("O colaborador selecionado não é responsável por nenhum ativo.");
        return;
      }
      const partes = [`${assumidos} ativo(s) assumido(s) com sucesso!`];
      if (jaResponsavel > 0) partes.push(`${jaResponsavel} já era(m) do colaborador.`);
      setMessage(partes.join(' '));
      closeAssumirAtivosModal();
      setResponsaveisAtivos(await obterResponsaveisAtivos());
    } catch {
      setMessage("Erro ao assumir os ativos.");
      obterResponsaveisAtivos().then(setResponsaveisAtivos).catch(() => {});
    } finally {
      setAssumirAtivosSaving(false);
    }
  }

  async function handleAlterarStatusColaboradorSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!alterarStatusColaborador?.id) return;
    setMessage("");
    if (!alterarStatusColaboradorForm.ie_status) {
      setMessage("Selecione um status.");
      return;
    }
    if (!validarCamposModal(MODAL_COLABORADOR_ALTERAR_STATUS, alterarStatusColaboradorForm)) return;
    const lote = (alterarStatusColaboradorLote.length > 0 ? alterarStatusColaboradorLote : [alterarStatusColaborador]).filter((c) => c.id);
    setAlterarStatusColaboradorSaving(true);
    let alterados = 0;
    try {
      alterados = await aplicarEmLote(lote, (c) => atualizarColaborador(
        c.id as string,
        {
          dt_status: alterarStatusColaboradorForm.dt_status,
          ie_status: alterarStatusColaboradorForm.ie_status,
          ds_motivo_status: alterarStatusColaboradorForm.ds_motivo_status,
        },
        auditAutor
      ));
      setMessage(lote.length > 1 ? `Status de ${lote.length} colaboradores alterado com sucesso!` : "Status alterado com sucesso!");
      if (lote.length > 1) setColaboradoresSelecionados([]);
      closeAlterarStatusColaboradorModal();
      await loadColaboradores();
    } catch {
      setMessage(alterados > 0 ? `Erro ao alterar o status: ${alterados} de ${lote.length} colaboradores foram alterados.` : "Erro ao alterar o status.");
      if (alterados > 0) await loadColaboradores();
    } finally {
      setAlterarStatusColaboradorSaving(false);
    }
  }

  async function handleAdminDelete(id: string) {
    setMessage("");
    if (isAdministradorUsuario(usuarios.find((u) => u.id === id))) {
      setMessage("O usuário administrador não pode ser excluído.");
      return;
    }
    try {
      await excluirUsuario(id);
      setMessage("Excluído com sucesso!");
      await loadUsuarios();
    } catch {
      setMessage("Erro ao excluir usuário.");
    }
    if (view === 'form') goToAdminList();
  }

  async function handlePerfilDelete(id: string) {
    setMessage("");
    if (isAdministradorPerfil(perfis.find((p) => p.id === id))) {
      setMessage("O perfil Administrador não pode ser excluído.");
      return;
    }
    try {
      await excluirPerfil(id);
      setMessage("Excluído com sucesso!");
      await loadPerfis();
    } catch {
      setMessage("Erro ao excluir perfil.");
    }
    if (view === 'form') goToPerfilList();
  }

  function openDelegateFuncoesModal(perfil: Perfil) {
    const saved = parseFuncoesConfig(perfil.config_funcoes);
    setDelegateFuncoesPerfil(perfil);
    // Perfil novo (sem config_funcoes) não vem com nenhuma função liberada.
    setDelegateFuncoes(saved);
    setMessage("");
    setDelegateFuncoesModalOpen(true);
  }

  function closeDelegateFuncoesModal() {
    setDelegateFuncoesModalOpen(false);
    setDelegateFuncoesPerfil(null);
  }

  function toggleDelegateFuncao(section: SectionType) {
    setDelegateFuncoes((prev) =>
      prev.includes(section) ? prev.filter((s) => s !== section) : [...prev, section]
    );
  }

  async function handleDelegateFuncoesSave() {
    if (!delegateFuncoesPerfil?.id) return;
    setMessage("");

    const current = parseFuncoesConfig(delegateFuncoesPerfil.config_funcoes);
    const sameAsSaved =
      current.length === delegateFuncoes.length &&
      current.every((s) => delegateFuncoes.includes(s));

    if (sameAsSaved) {
      setMessage("Nenhuma alteração detectada.");
      closeDelegateFuncoesModal();
      return;
    }

    setDelegateFuncoesSaving(true);
    try {
      await atualizarPerfil(
        delegateFuncoesPerfil.id,
        { config_funcoes: serializeFuncoesConfig(delegateFuncoes) },
        auditAutor
      );
      setMessage("Funções atualizadas com sucesso!");
      await loadPerfis();
      closeDelegateFuncoesModal();
    } catch {
      setMessage("Erro ao salvar funções.");
    } finally {
      setDelegateFuncoesSaving(false);
    }
  }

  /* ── Permissões da função (modal aberto pelo card de função) ── */
  function openPermissoesModal(perfil: Perfil, funcao: SectionType) {
    // Usa a versão mais recente do perfil: o objeto em memória pode estar
    // desatualizado (ex.: permissões salvas numa edição anterior do mesmo modal).
    const perfilAtual = perfis.find((p) => p.id === perfil.id) ?? perfil;
    const config = parsePermissoesConfigMigrada(perfilAtual.config_permissoes, perfilAtual.config_permissoes_v);
    // Função nunca configurada = tudo liberado por padrão; o modal reflete isso
    // pré-marcando todas as permissões (estado efetivo, não o array salvo).
    const atuais = config[funcao];
    const selecionadas = atuais
      ? [...atuais]
      : (PERMISSOES_POR_FUNCAO[funcao] ?? []).map((p) => p.key);
    setPermissoesPerfil(perfilAtual);
    setPermissoesFuncao(funcao);
    setPermissoesSelecionadas(selecionadas);
    setMessage("");
    setPermissoesModalOpen(true);
  }

  function closePermissoesModal() {
    setPermissoesModalOpen(false);
    setPermissoesPerfil(null);
    setPermissoesFuncao(null);
    setPermissoesSelecionadas([]);
  }

  function togglePermissao(permissao: string) {
    setPermissoesSelecionadas((prev) =>
      prev.includes(permissao) ? prev.filter((p) => p !== permissao) : [...prev, permissao]
    );
  }

  async function handlePermissoesSave() {
    if (!permissoesPerfil?.id || !permissoesFuncao) return;
    setMessage("");
    const config = parsePermissoesConfigMigrada(permissoesPerfil.config_permissoes, permissoesPerfil.config_permissoes_v);
    // Compara com o estado EFETIVO: função nunca configurada conta como todas
    // as permissões marcadas (não apenas o array salvo, que é vazio/ausente).
    const atuaisEfetivas =
      config[permissoesFuncao] ??
      (PERMISSOES_POR_FUNCAO[permissoesFuncao] ?? []).map((p) => p.key);
    const sameAsSaved =
      atuaisEfetivas.length === permissoesSelecionadas.length &&
      atuaisEfetivas.every((p) => permissoesSelecionadas.includes(p));

    if (sameAsSaved) {
      setMessage("Nenhuma alteração detectada.");
      closePermissoesModal();
      return;
    }

    config[permissoesFuncao] = permissoesSelecionadas;
    setPermissoesSaving(true);
    try {
      await atualizarPerfil(
        permissoesPerfil.id,
        {
          config_permissoes: serializePermissoesConfig(config),
          config_permissoes_v: PERMISSOES_CONFIG_VERSION,
        },
        auditAutor
      );
      setMessage("Permissões atualizadas com sucesso!");
      await loadPerfis();
      closePermissoesModal();
    } catch {
      setMessage("Erro ao salvar permissões.");
    } finally {
      setPermissoesSaving(false);
    }
  }

  function openDelegatePerfisModal(usuario: Usuario) {
    const saved = parsePerfisConfig(usuario.config_perfis);
    setDelegatePerfisUsuario(usuario);
    setDelegatePerfis(saved);
    setMessage("");
    setDelegatePerfisModalOpen(true);
  }

  function closeDelegatePerfisModal() {
    setDelegatePerfisModalOpen(false);
    setDelegatePerfisUsuario(null);
  }

  function toggleDelegatePerfil(nr_sequencia: number) {
    setDelegatePerfis((prev) =>
      prev.includes(nr_sequencia)
        ? prev.filter((s) => s !== nr_sequencia)
        : [...prev, nr_sequencia]
    );
  }

  async function handleDelegatePerfisSave() {
    if (!delegatePerfisUsuario?.id) return;
    setMessage("");

    const current = parsePerfisConfig(delegatePerfisUsuario.config_perfis);
    const sameAsSaved =
      current.length === delegatePerfis.length &&
      current.every((s) => delegatePerfis.includes(s));

    if (sameAsSaved) {
      setMessage("Nenhuma alteração detectada.");
      closeDelegatePerfisModal();
      return;
    }

    setDelegatePerfisSaving(true);
    try {
      await atualizarUsuario(
        delegatePerfisUsuario.id,
        { config_perfis: serializePerfisConfig(delegatePerfis) },
        auditAutor
      );
      setMessage("Perfis atualizados com sucesso!");
      await loadUsuarios();
      // Se o usuário delegado é o logado, atualiza o currentUser para refletir na hora.
      if (currentUser?.id === delegatePerfisUsuario.id) {
        setCurrentUser((u) => (u ? { ...u, config_perfis: serializePerfisConfig(delegatePerfis) } : u));
      }
      closeDelegatePerfisModal();
    } catch {
      setMessage("Erro ao salvar perfis.");
    } finally {
      setDelegatePerfisSaving(false);
    }
  }

  function openDuplicatePerfilModal(perfil: Perfil) {
    setDuplicatePerfilSource(perfil);
    setDuplicatePerfilName('');
    setMessage("");
    setDuplicatePerfilModalOpen(true);
  }

  function closeDuplicatePerfilModal() {
    setDuplicatePerfilModalOpen(false);
    setDuplicatePerfilSource(null);
    setDuplicatePerfilName('');
  }

  async function handleDuplicatePerfilSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const nome = duplicatePerfilName.trim();
    if (!nome || !duplicatePerfilSource) return;

    // Não é possível ter perfis com o mesmo nome.
    const jaExiste = perfis.some((p) => (p.ds_perfil ?? '').trim().toLowerCase() === nome.toLowerCase());
    if (jaExiste) {
      setMessage("Perfil já existente.");
      return;
    }

    setDuplicatePerfilSaving(true);
    try {
      // Duplica o perfil preservando status, observação, funções liberadas,
      // as regras de campos e as permissões de cada função.
      await criarPerfil(
        {
          ds_perfil: nome,
          ds_observacao: duplicatePerfilSource.ds_observacao ?? '',
          ie_status: duplicatePerfilSource.ie_status ?? 'A',
          config_funcoes: duplicatePerfilSource.config_funcoes,
          config_campos: duplicatePerfilSource.config_campos,
          config_permissoes: duplicatePerfilSource.config_permissoes,
          config_permissoes_v: duplicatePerfilSource.config_permissoes_v,
        } as any,
        auditAutor
      );
      setMessage("Perfil duplicado com sucesso!");
      // Busca os perfis atualizados do banco (a variável perfis da closure
      // ainda não contém o novo perfil recém-criado) para a listagem refletir.
      const perfisAtualizados = await obterPerfis();
      setPerfis(perfisAtualizados);
      // Permanece na listagem de registros (Perfis).
      closeDuplicatePerfilModal();
    } catch {
      setMessage("Erro ao duplicar perfil.");
    } finally {
      setDuplicatePerfilSaving(false);
    }
  }

  async function handleCgDelete(id: string) {
    setMessage("");
    try {
      if (cgKind === 'sexo') {
        await excluirSexo(id);
      } else if (cgKind === 'estadoCivil') {
        await excluirEstadoCivil(id);
      } else if (cgKind === 'corRaca') {
        await excluirCorRaca(id);
      } else if (cgKind === 'grauParentesco') {
        await excluirGrauParentesco(id);
      } else if (cgKind === 'cargo') {
        await excluirCargo(id);
      } else if (cgKind === 'vinculoContratual') {
        await excluirVinculoContratual(id);
      } else if (cgKind === 'localizacao') {
        await excluirLocalizacao(id);
      } else if (cgKind === 'marca') {
        await excluirMarca(id);
      } else if (cgKind === 'profissao') {
        await excluirProfissao(id);
      } else if (cgKind === 'logradouro') {
        await excluirLogradouro(id);
      } else if (cgKind === 'sistemaOperacional') {
        await excluirSistemaOperacional(id);
      } else if (cgKind === 'combustivel') {
        await excluirCombustivel(id);
      } else if (cgKind === 'modalidadeEnsino') {
        await excluirModalidadeEnsino(id);
      } else if (cgKind === 'formatoPapel') {
        await excluirFormatoPapel(id);
      } else if (cgKind === 'tipoPapel') {
        await excluirTipoPapel(id);
      } else {
        await excluirOrgaoEmissor(id);
      }
      setMessage("Excluído com sucesso!");
      await loadCgItems();
    } catch {
      setMessage("Erro ao excluir.");
    }
    if (view === 'form') goToCgList();
  }  function getMessageStatus(message: string) {
    if (
      message.toLowerCase().includes("sucesso") ||
      message.toLowerCase().includes("gerado") ||
      message.toLowerCase().includes("gerada") ||
      message.toLowerCase().includes("criada") ||
      message.toLowerCase().includes("criado") ||
      message.toLowerCase().includes("alterada") ||
      message.toLowerCase().includes("alterado") ||
      message.toLowerCase().includes("renomeada") ||
      message.toLowerCase().includes("renomeado")
    ) return "success";
    if (
      message.toLowerCase().includes("erro") || message.toLowerCase().includes("não coincidem") || message.toLowerCase().includes("informe a")
    ) return "error";
    return "warning";
  }

  const messageStatus = toastForced && toastForced.msg === message ? toastForced.status : getMessageStatus(message);

  function mostrarToast(msg: string, status: ToastStatus) {
    setToastForced({ msg, status });
    setMessage(msg);
  }

  /**
   * "Permite editar": quem só tem "Permite ver" abre o registro, mas não salva alterações.
   * Sem a permissão, mostra o aviso e devolve true (o Salvar para).
   */
  function bloquearEdicaoSemPermissao(podeEditar: boolean): boolean {
    if (podeEditar) return false;
    mostrarToast('Você não tem permissão para editar este registro.', 'warning');
    return true;
  }

  const toastBg = messageStatus === 'success' ? '#2cc958' : messageStatus === 'warning' ? '#f59e0b' : '#ef4444';
  const toastTextClass = messageStatus === 'warning' ? 'text-slate-950' : 'text-white';
  const toastBorderColor = messageStatus === 'success' ? '#23A146' : messageStatus === 'warning' ? '#b46a00' : '#9b1230';

  useEffect(() => {
    if (!message) {
      setToastVisible(false);
      return;
    }

    setToastMounted(true);
    setToastVisible(true);

    const hideTimer = window.setTimeout(() => {
      setToastVisible(false);
    }, 3000);

    return () => window.clearTimeout(hideTimer);
  }, [message]);

  useEffect(() => {
    if (!toastMounted) return;
    if (toastVisible) return;

    const unmountTimer = window.setTimeout(() => {
      setToastMounted(false);
      setMessage("");
      setToastForced(null);
    }, 220);

    return () => window.clearTimeout(unmountTimer);
  }, [toastMounted, toastVisible]);

  async function handleLogin(username: string, password: string): Promise<ResultadoLoginTela> {
    const normalizedUsername = username.trim();
    const normalizedPassword = password.trim();

    if (!normalizedUsername || !normalizedPassword) {
      setLoginError("Usuário ou senha incorretos");
      return;
    }

    setLoginError(null);
    setLoginWarning(null);
    setIsLoginLoading(true);

    try {
      // Usuário e senha são conferidos no servidor; o navegador não recebe a lista de usuários.
      const resultado = await entrar(normalizedUsername, normalizedPassword);

      if (resultado.status === 'ok') {
        const usuarioValido = resultado.usuario;
        window.setTimeout(() => {
          // Ao entrar, nenhuma função vem selecionada (inclusive após a sessão ter sido encerrada).
          limparPaginacaoDaSecao();
          setActiveSection(null);
          setSecoesAbertas([]);
          setSectionViews({});
          setView('list');
          setCurrentUser(usuarioValido);
          restaurarFiltrosSalvos(usuarioValido);
          setSessaoInicio(Date.now());
          setIsAuthenticated(true);
          setIsLoginLoading(false);
        }, 250);
        return;
      }

      if (resultado.status === 'alterar_senha') {
        // Senha alterada por outra pessoa: a tela de login abre o modal "Alterar senha".
        setIsLoginLoading(false);
        return 'alterar_senha';
      }

      if (resultado.status === 'bloqueado' || resultado.status === 'inativo') {
        setLoginWarning(resultado.status === 'bloqueado' ? "Usuário bloqueado." : "Usuário inativo.");
      } else if (resultado.status === 'sem_perfil') {
        setLoginError("O usuário não possui um perfil.");
      } else {
        setLoginError("Usuário ou senha incorretos");
      }
    } catch (error) {
      console.error("[Login] erro ao autenticar", error);
      setLoginError("Erro ao autenticar. Veja o console para detalhes.");
    }

    setIsLoginLoading(false);
  }

  /** Troca de senha pedida no login: devolve null se deu certo, ou a mensagem de erro. */
  async function handleAlterarSenhaLogin(username: string, senhaAtual: string, novaSenha: string): Promise<string | null> {
    try {
      const status = await alterarSenhaNoLogin(username.trim(), senhaAtual, novaSenha);
      if (status === 'ok') return null;
      if (status === 'mesma_senha') return 'A nova senha deve ser diferente da senha atual.';
      if (status === 'nova_vazia') return 'Informe a nova senha.';
      return 'Senha atual incorreta.';
    } catch (error) {
      console.error('[Login] erro ao alterar a senha', error);
      return 'Erro ao alterar a senha.';
    }
  }

  function handleLogout(motivo: 'manual' | 'automatico' = 'manual') {
    sair(motivo).catch(() => { /* a sessão expira sozinha no servidor */ });
    try {
      window.localStorage.removeItem(SESSION_KEY);
      window.sessionStorage.removeItem(SESSION_NAV_KEY);
    } catch {
      /* ignora */
    }
    setAtivosSelecionados([]);
    setManutencoesSelecionadas([]);
    setAlunosSelecionados([]);
    setColaboradoresSelecionados([]);
    limparPaginacaoDaSecao();
    setIsAuthenticated(false);
    setSessaoInicio(null);
    setIsLoginLoading(false);
    setIsUserMenuOpen(false);
    setActiveSection(null);
    setSecoesAbertas([]);
    setSectionViews({});
    setView('list');
    setIsUserMenuClosing(false);
    setCurrentUser(null);
    setLoginError(null);
    setLoginWarning(null);
    setMessage("");
    // Ao sair, todas as funções voltam ao estado de quem acabou de entrar: o mesmo que
    // fechar cada uma pelo X (dropdown PAI em "---", nada em edição). Assim nenhuma
    // função reabre com a opção do dropdown PAI já selecionada.
    SECOES.forEach((secao) => fecharSecao(secao));
    setRelatorioParamValues({});
  }

  /**
   * Fecha uma função aberta: desmonta a tela e volta ao estado padrão do login
   * (nenhuma opção no dropdown PAI, nada em edição). Se era a função ativa,
   * nenhuma fica selecionada.
   */
  function fecharSecao(secao: SectionType) {
    // Rodapé de paginação (página e quantidade por página) volta ao padrão.
    limparPaginacaoDaSecao(secao);
    setSecoesAbertas((prev) => prev.filter((s) => s !== secao));
    setSectionViews((prev) => Object.fromEntries(Object.entries(prev).filter(([chave]) => chave !== secao)) as typeof prev);
    if (secao === 'pessoaFisica') {
      setPjManageSelection(''); setPjInteracted(false); setEditingId(null); setPjEditingId(null);
    } else if (secao === 'administracaoSistema') {
      setAdminManageSelection(''); setAdminInteracted(false); setAdminEditingId(null); setPerfilEditingId(null); setImagemEditingId(null);
      setCamposPerfilId(null); setCamposFuncao(null); setCamposFuncaoJaSelecionada(false);
    } else if (secao === 'cadastrosGerais') {
      setCgManageSelection(''); setCgInteracted(false); setCgEditingId(null);
    } else if (secao === 'estruturaAcademica') {
      setAlunoManageSelection(''); setAlunosSelecionados([]); setColaboradoresSelecionados([]); setAlunoInteracted(false); setAlunoEditingId(null); setColaboradorEditingId(null); setPeriodoLetivoEditingId(null); setCursoEditingId(null);
    } else if (secao === 'patrimonio') {
      setAtivoManageSelection(''); setAtivosSelecionados([]); setManutencoesSelecionadas([]); setAtivoInteracted(false); setAtivoEditingId(null); setManutencaoEditingId(null); setCategoriaEditingId(null);
    } else if (secao === 'relatorio') {
      setRelatorioManageSelection(''); setRelatorioInteracted(false); setRelatorioView('list'); setRelatorioEditingId(null); setRelatorioForm(null); setRelatorioBandasMode(false);
    } else if (secao === 'logs') {
      setLogsManageSelection(''); setAcessosFiltro(FILTRO_ACESSOS_VAZIO); setExclusaoVer(null);
    } else if (secao === 'controleCopias') {
      setCcManageSelection(''); setCopiaEditingId(null); setCopiaArquivoNovo(null); setCopiaFilterModalOpen(false);
    }
    if (secao === activeSection) {
      setActiveSection(null);
      setView('list');
      setContextMenu(null);
    }
  }

  function toggleDarkMode() {
    const next = !darkMode;
    setDarkMode(next);
    try {
      window.localStorage.setItem(getDarkModeKey(currentUser?.id), next ? "1" : "0");
    } catch {
      /* storage indisponível */
    }
    if (currentUser?.id) {
      const config_tema = next ? 'E' : 'C';
      atualizarPreferenciaTema(currentUser.id, config_tema)
        .then(() => {
          setCurrentUser((u) => (u ? { ...u, config_tema } : u));
        })
        .catch((err) => {
          console.error('Erro ao salvar preferência de tema no banco', err);
        });
    }
  }

  /* ── Configuração de colunas por usuário (ordem e larguras ajustadas) ── */
  type ChaveColunas = Extract<keyof Usuario, `config_colunas_${string}`>;
  type ChavePaineis = Extract<keyof Usuario, `config_paineis_${string}`>;
  function salvarConfigColunas(chave: ChaveColunas | ChavePaineis, serialized: string) {
    if (!currentUser?.id) return;
    atualizarPreferenciasUsuario(currentUser.id, { [chave]: serialized })
      .then(() => {
        setCurrentUser((u) => (u ? { ...u, [chave]: serialized } : u));
      })
      .catch((err) => {
        console.error(`Erro ao salvar configuração de colunas (${chave})`, err);
      });
  }
  /** Props de persistência da largura dos painéis (containers lado a lado redimensionáveis). */
  function paineisPorChave(chave: ChavePaineis) {
    return {
      config: currentUser?.[chave],
      onChange: (serialized: string) => salvarConfigColunas(chave, serialized),
    };
  }
  /** Props de persistência para tabelas com colunas por índice (listas e janelas de busca). */
  /** Descrições das colunas de referência (nr_seq_* → nome) da lista de registros excluídos. */
  const exclusoesLookups = useMemo(() => {
    const nomePf = Object.fromEntries(pessoasFisicas.map((p) => [p.nr_sequencia, p.ds_nome ?? '']));
    const nomePj = Object.fromEntries(pessoasJuridicas.map((p) => [p.nr_sequencia, p.ds_razao_social ?? '']));
    const nomeColaborador = Object.fromEntries(colaboradores.map((c) => [
      c.nr_sequencia,
      (c.nr_seq_pessoa_juridica ? nomePj[c.nr_seq_pessoa_juridica] : undefined) || (c.nr_seq_pessoa_fisica ? nomePf[c.nr_seq_pessoa_fisica] : '') || '',
    ]));
    return {
      ...pfCgLookups,
      nr_seq_pessoa_fisica: nomePf,
      nr_seq_colaborador: nomeColaborador,
      nr_seq_pessoa_juridica: nomePj,
      nr_seq_prestador_servico: nomeColaborador,
      nr_seq_fornecedor: nomeColaborador,
      nr_seq_vinculo_contratual: Object.fromEntries(vinculosContratuais.map((v) => [v.nr_sequencia, v.ds_vinculo_contratual ?? ''])),
      nr_seq_cargo: Object.fromEntries(cargos.map((c) => [c.nr_sequencia, c.ds_cargo ?? ''])),
      nr_seq_categoria: Object.fromEntries(categoriasAtivos.map((c) => [c.nr_sequencia, c.ds_categoria ?? ''])),
      nr_seq_localizacao: Object.fromEntries(localizacoes.map((l) => [l.nr_sequencia, l.ds_localizacao ?? ''])),
      nr_seq_marca: Object.fromEntries(marcas.map((m) => [m.nr_sequencia, m.ds_marca ?? ''])),
      nr_seq_sistema_operacional: Object.fromEntries(sistemasOperacionais.map((s) => [s.nr_sequencia, s.ds_sistema_operacional ?? ''])),
      nr_seq_combustivel: Object.fromEntries(combustiveis.map((c) => [c.nr_sequencia, c.ds_combustivel ?? ''])),
      nr_seq_ativo: Object.fromEntries(ativos.map((a) => [a.nr_sequencia, a.ds_ativo ?? ''])),
      nr_seq_grau_parentesco: Object.fromEntries(grausParentesco.map((g) => [g.nr_sequencia, g.ds_grau_parentesco ?? ''])),
      nr_seq_curso: Object.fromEntries(cursos.map((c) => [c.nr_sequencia, c.ds_curso ?? ''])),
      nr_seq_periodo_letivo: Object.fromEntries(periodosLetivos.map((p) => [p.nr_sequencia, p.ds_periodo_letivo ?? ''])),
      nr_seq_modalidade_ensino: Object.fromEntries(modalidadesEnsino.map((m) => [m.nr_sequencia, m.ds_modalidade_ensino ?? ''])),
      nr_seq_turma: Object.fromEntries(turmas.map((t) => [t.nr_sequencia, t.ds_turma ?? ''])),
      nr_seq_disciplina: Object.fromEntries(disciplinas.map((d) => [d.nr_sequencia, d.ds_disciplina ?? ''])),
      nr_seq_solicitante: nomeColaborador,
      nr_seq_turma_disciplina: Object.fromEntries(turmasDisciplinas.map((td) => [td.nr_sequencia, descricaoTurmaDisciplinaPorSeq(td.nr_sequencia)])),
      nr_seq_formato_papel: Object.fromEntries(formatosPapel.map((f) => [f.nr_sequencia, f.ds_formato_papel ?? ''])),
      nr_seq_tipo_papel: Object.fromEntries(tiposPapel.map((t) => [t.nr_sequencia, t.ds_tipo_papel ?? ''])),
    } as Record<string, Record<number, string>>;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turmasDisciplinas, formatosPapel, tiposPapel, turmas, disciplinas, cursos, periodosLetivos, modalidadesEnsino, pfCgLookups, pessoasFisicas, pessoasJuridicas, colaboradores, vinculosContratuais, cargos, categoriasAtivos, localizacoes, marcas, sistemasOperacionais, combustiveis, ativos, grausParentesco]);

  /** Colunas da lista de registros excluídos: uma configuração por função, salvas juntas no usuário. */
  function colunasExclusoesRegistro(colecao: string) {
    let mapa: Record<string, string> = {};
    try { mapa = JSON.parse(currentUser?.config_colunas_exclusoes_registro || '{}') ?? {}; } catch { mapa = {}; }
    return {
      initialColumns: parseStringColunasConfig(mapa[colecao]),
      onColumnsChange: (order: string[], widths: Record<string, number>) =>
        salvarConfigColunas('config_colunas_exclusoes_registro', JSON.stringify({ ...mapa, [colecao]: serializeStringColunasConfig(order, widths) })),
      storageKeySuffix: currentUser?.id ?? undefined,
    };
  }

  /** "Ver" de um registro excluído: abre o formulário (somente leitura) da função. */
  function abrirExclusaoVer(ex: Exclusao) {
    setExclusaoVer(ex);
    setExclusaoCidadeNome('');
    const codigo = String(ex.dados.cd_ibge_naturalidade ?? ex.dados.cd_ibge_cidade ?? '');
    if (codigo) {
      cidadePorCodigo(codigo)
        .then((cidade) => setExclusaoCidadeNome(cidade ? `${cidade.nome} - ${cidade.uf}` : ''))
        .catch(() => setExclusaoCidadeNome(''));
    }
  }

  /** Formulário da função com os dados do registro excluído (tudo desabilitado). */
  /** Descrição dos nr_seq_* do formulário genérico (Formato do papel, Imagem, Banda superior). */
  function descricaoReferenciaGenerica(campo: string, valor: unknown, dados: Record<string, unknown>): string | undefined {
    const nr = String(valor);
    if (campo === 'nr_seq_formato_papel') return formatosPapel.find((p) => String(p.nr_sequencia) === nr)?.ds_formato_papel;
    if (campo === 'nr_seq_imagem') return imagens.find((i) => String(i.nr_sequencia) === nr)?.ds_imagem;
    if (campo === 'nr_seq_banda_superior') return bandasDaAuditoria.find((b) => String(b.nr_sequencia) === nr && (dados.nr_seq_relatorio == null || String(b.nr_seq_relatorio) === String(dados.nr_seq_relatorio)))?.ds_banda;
    return undefined;
  }

  function renderFormularioExcluido(ex: Exclusao, cidadeNome: string = exclusaoCidadeNome) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dados = ex.dados as any;
    const nada = () => {};
    const comuns = {
      message: '',
      editingId: ex.id_registro,
      sequence: typeof dados.nr_sequencia === 'number' ? dados.nr_sequencia : null,
      form: dados,
      setForm: nada,
      submitting: false,
      handleSubmit: async (e: React.FormEvent) => { e.preventDefault(); },
      goToList: nada,
      createdAt: String(dados.dt_criacao ?? ''),
      updatedAt: String(dados.dt_alteracao ?? ''),
      createdBy: resolverNomeAutorExibicao(String(dados.ds_usuario_criacao ?? '')),
      updatedBy: resolverNomeAutorExibicao(String(dados.ds_usuario_alteracao ?? '')),
      onOpenAudit: nada,
      onPrevRecord: nada,
      onNextRecord: nada,
      hasPrevRecord: false,
      hasNextRecord: false,
      manageSelection: '',
      onManageSelectionChange: nada,
      allowedSubmodulos: [] as string[],
      campoRegras: {},
      campoErros: [] as string[],
    };
    const nomePf = (seq?: number) => (seq ? pessoasFisicas.find((p) => p.nr_sequencia === seq)?.ds_nome ?? '' : '');
    const cg = Object.values(CG_DEFS).find((d) => d.collection === ex.ds_colecao);
    switch (ex.ds_colecao) {
      case 'pessoa_fisica':
        return <PessoaFisicaFormView {...comuns} sexos={pfCgOptions.sexos} estadoCivis={pfCgOptions.estadoCivis} coresRacas={pfCgOptions.coresRacas} profissoes={pfCgOptions.profissoes} orgaosEmissores={pfCgOptions.orgaosEmissores} logradouros={pfCgOptions.logradouros} estados={estados} naturalidadeNome={cidadeNome} onOpenNaturalidadeLookup={nada} onNaturalidadeCodeChange={nada} selectOptions={[]} />;
      case 'pessoa_juridica':
        return <PessoaJuridicaFormView {...comuns} cidadeNome={cidadeNome} onOpenCidadeLookup={nada} onCidadeCodeChange={nada} logradouros={pfCgOptions.logradouros} estados={estados} selectOptions={[]} />;
      case 'usuario':
        return <AdministracaoSistemaFormView {...comuns} pessoaFisicaName={nomePf(dados.nr_seq_pessoa_fisica)} onOpenPessoaFisicaLookup={nada} onViewPessoaFisica={nada} readOnly />;
      case 'perfil':
        return <PerfilFormView {...comuns} readOnly />;
      case 'imagem':
        return <ImagemFormView {...comuns} imagem={dados} setImagem={nada} />;
      case 'periodo_letivo':
        return <PeriodoLetivoFormView {...comuns} selectOptions={[]} />;
      case 'aluno':
        return <AlunoFormView {...comuns} pessoaFisicaName={nomePf(dados.nr_seq_pessoa_fisica)} onOpenPessoaFisicaLookup={nada} onViewPessoaFisica={nada} selectOptions={[]} />;
      case 'colaborador':
        return <ColaboradorFormView {...comuns} pessoaFisicaName={nomePf(dados.nr_seq_pessoa_fisica)} onOpenPessoaFisicaLookup={nada} onViewPessoaFisica={nada} pessoaJuridicaName={exclusoesLookups.nr_seq_pessoa_juridica[dados.nr_seq_pessoa_juridica] ?? ''} onOpenPessoaJuridicaLookup={nada} onViewPessoaJuridica={nada} vinculosContratuais={colaboradorVinculosOptions} cargos={colaboradorCargosOptions} selectOptions={[]} />;
      case 'pat_categoria':
        return <CadastroGeralFormView {...comuns} selectOptions={[]} fieldInfos={CATEGORIA_ATIVO_FIELD_INFOS} descFieldKey="ds_categoria" collectionName="pat_categoria" showObservacao />;
      case 'disciplina':
        return <CadastroGeralFormView {...comuns} form={{ descricao: dados.ds_disciplina ?? '', ie_status: 'A', nr_cbo: '', sg_sigla: '', ds_observacao: dados.ds_observacao ?? '' }} selectOptions={[]} fieldInfos={DISCIPLINA_FIELD_INFOS} descFieldKey="ds_disciplina" collectionName="disciplina" showObservacao hideStatus />;
      case 'turma':
        return <CadastroGeralFormView {...comuns} form={{ descricao: dados.ds_turma ?? '', ie_status: 'A', nr_cbo: '', sg_sigla: '', ds_observacao: '' }} selectOptions={[]} fieldInfos={TURMA_FIELD_INFOS} descFieldKey="ds_turma" collectionName="turma" hideStatus
          extraFields={({ renderFieldLabel }) => (
            <>
              {([
                ['nr_seq_curso', 'Curso', 'sm:col-span-6'],
                ['nr_seq_periodo_letivo', 'Período letivo', 'sm:col-span-6'],
                ['qt_max_alunos', 'Máximo de alunos', 'sm:col-span-2'],
                ['nr_seq_localizacao', 'Localização', 'sm:col-span-5'],
                ['nr_seq_modalidade_ensino', 'Modalidade de ensino', 'sm:col-span-5'],
              ] as const).map(([campo, rotulo, colunas]) => (
                <div key={campo} className={`${colunas} group`}>
                  {renderFieldLabel(campo, rotulo)}
                  <input disabled readOnly className="w-full rounded-[3px] border border-slate-300 px-2 py-1.5 text-sm" value={campo === 'qt_max_alunos' ? String(dados.qt_max_alunos ?? '') : descricaoReferenciaTurma(campo, dados[campo])} />
                </div>
              ))}
            </>
          )}
        />;
      case 'turma_disciplina':
        return <CadastroGeralFormView {...comuns} form={{ descricao: '', ie_status: dados.ie_status ?? 'A', nr_cbo: '', sg_sigla: '', ds_observacao: '' }} selectOptions={[]} fieldInfos={TURMA_DISCIPLINA_FIELD_INFOS} descFieldKey="nr_seq_turma" collectionName="turma_disciplina" hideDescricao
          extraFields={({ renderFieldLabel }) => (
            <>
              {([
                ['nr_seq_turma', 'Turma', 'sm:col-span-6'],
                ['nr_seq_disciplina', 'Disciplina', 'sm:col-span-5'],
              ] as const).map(([campo, rotulo, colunas]) => (
                <div key={campo} className={`${colunas} group`}>
                  {renderFieldLabel(campo, rotulo)}
                  <input disabled readOnly className="w-full rounded-[3px] border border-slate-300 px-2 py-1.5 text-sm" value={descricaoReferenciaTurmaDisciplina(campo, dados[campo])} />
                </div>
              ))}
              {TURMA_DISCIPLINA_CAMPOS_DA_TURMA.map(([campo, rotulo], i) => (
                <div key={campo} className={`sm:col-span-4 ${i === 0 ? 'sm:col-start-1' : ''} group`}>
                  {renderFieldLabel(campo, rotulo)}
                  <input disabled readOnly className="w-full rounded-[3px] border border-slate-300 px-2 py-1.5 text-sm" value={descricaoReferenciaTurmaDisciplina(campo, camposDaTurmaDisciplina(dados.nr_seq_turma)[campo])} />
                </div>
              ))}
            </>
          )}
        />;
      case 'copia': {
        const valores: CopiaCamposForm = {
          ...COPIA_CAMPOS_VAZIOS,
          ...Object.fromEntries(Object.keys(COPIA_CAMPOS_VAZIOS).map((k) => [k, dados[k] != null ? String(dados[k]) : ''])),
        };
        return <CadastroGeralFormView {...comuns} form={{ descricao: '', ie_status: 'A', nr_cbo: '', sg_sigla: '', ds_observacao: '' }} selectOptions={[]} fieldInfos={COPIA_FIELD_INFOS} descFieldKey="nr_seq_solicitante" collectionName="copia" hideDescricao hideStatus
          extraFields={(aux) => (
            <CopiaCamposFormView
              aux={aux}
              valores={valores}
              descricaoSolicitante={descricaoReferenciaCopia('nr_seq_solicitante', dados.nr_seq_solicitante)}
              descricaoTurmaDisciplina={descricaoReferenciaCopia('nr_seq_turma_disciplina', dados.nr_seq_turma_disciplina)}
              opcoesFormatoPapel={formatosPapel.map((f) => ({ value: String(f.nr_sequencia), label: f.ds_formato_papel || `#${f.nr_sequencia}` }))}
              opcoesTipoPapel={tiposPapel.map((t) => ({ value: String(t.nr_sequencia), label: t.ds_tipo_papel || `#${t.nr_sequencia}` }))}
              extensoesPermitidas={extensoesCopia}
              somenteLeitura
            />
          )}
        />;
      }
      case 'curso':
        return <CadastroGeralFormView {...comuns} form={{ descricao: dados.ds_curso ?? '', ie_status: dados.ie_status ?? 'A', nr_cbo: '', sg_sigla: '', ds_observacao: dados.ds_observacao ?? '' }} selectOptions={[]} fieldInfos={CURSO_FIELD_INFOS} descFieldKey="ds_curso" collectionName="curso" showObservacao />;
      case 'pat_manutencao':
        return <ManutencaoFormView {...comuns} ativos={ativos.map((a) => ({ nr_sequencia: a.nr_sequencia, ds_ativo: a.ds_ativo ?? `#${a.nr_sequencia}` }))} ativoName={exclusoesLookups.nr_seq_ativo[dados.nr_seq_ativo] ?? ''} onOpenAtivoLookup={nada} onViewAtivo={nada} prestadorName={exclusoesLookups.nr_seq_prestador_servico[dados.nr_seq_prestador_servico] ?? nomePf(dados.nr_seq_prestador_servico)} onOpenPrestadorLookup={nada} onViewPrestador={nada} selectOptions={[]} />;
      case 'pat_ativo':
        return <AtivoFormView {...comuns} categoriasAtivos={categoriasAtivos.map((c) => ({ nr_sequencia: c.nr_sequencia, descricao: c.ds_categoria, ie_status: c.ie_status }))} localizacoes={localizacoes.map((l) => ({ nr_sequencia: l.nr_sequencia, descricao: l.ds_localizacao, ie_status: l.ie_status }))} marcas={marcas.map((m) => ({ nr_sequencia: m.nr_sequencia, descricao: m.ds_marca, ie_status: m.ie_status }))} sistemasOperacionais={sistemasOperacionais.map((s) => ({ nr_sequencia: s.nr_sequencia, descricao: s.ds_sistema_operacional }))} combustiveis={combustiveis.map((c) => ({ nr_sequencia: c.nr_sequencia, descricao: c.ds_combustivel, ie_status: c.ie_status }))} selectOptions={[]} ultimaManutencaoSeq={dados.nr_seq_ultima_manutencao ?? null} onViewManutencao={nada} fornecedorName={exclusoesLookups.nr_seq_fornecedor[dados.nr_seq_fornecedor] ?? ''} onOpenFornecedorLookup={nada} onViewFornecedor={nada} />;
      default:
        if (cg) {
          return <CadastroGeralFormView {...comuns} selectOptions={[]} fieldInfos={cg.fieldInfos} descFieldKey={cg.descKey} collectionName={cg.collection} showCbo={cg.collection === 'cg_profissao'} showDimensoes={cg.collection === 'cg_formato_papel'} showSigla={cg.collection === 'cg_orgao_emissor' || cg.collection === 'cg_logradouro'} siglaFieldKey={cg.collection === 'cg_orgao_emissor' ? 'sg_orgao_emissor' : cg.collection === 'cg_logradouro' ? 'sg_logradouro' : undefined} />;
        }
        return <FormularioExcluidoGenerico colecao={ex.ds_colecao} dados={ex.dados} resolverNomeAutor={resolverNomeAutorExibicao} resolverReferencia={descricaoReferenciaGenerica} />;
    }
  }

  /** Administração do Sistema > Exclusões (lista ou "Ver" do registro excluído). */
  function renderExclusoes() {
    const funcaoVer = exclusaoVer ? FUNCOES_EXCLUSAO.find((fx) => fx.colecao === exclusaoVer.ds_colecao) : undefined;
    if (exclusaoVer && funcaoVer) {
      return (
        <ExclusaoFormularioView
          exclusao={exclusaoVer}
          funcao={funcaoVer}
          manageSelection={logsManageSelection}
          allowedSubmodulos={allowedLogsSubmodulos}
          onFechar={() => setExclusaoVer(null)}
          resolverNomeAutor={resolverNomeAutorExibicao}
          darkMode={darkMode}
          generico={!!FORMULARIOS_GENERICOS[exclusaoVer.ds_colecao]}
        >
          {renderFormularioExcluido(exclusaoVer)}
        </ExclusaoFormularioView>
      );
    }
    return (
      <ExclusoesView
        manageSelection={logsManageSelection}
        onManageSelectionChange={handleLogsManageSelectionChange}
        allowedSubmodulos={allowedLogsSubmodulos}
        colecaoSelecionada={exclusoesColecao}
        onColecaoSelecionadaChange={setExclusoesColecao}
        navegacao={exclusoesNavegacao}
        onNavegacaoChange={setExclusoesNavegacao}
        darkMode={darkMode}
        onVer={abrirExclusaoVer}
        lookups={exclusoesLookups}
        resolverNomeAutor={resolverNomeAutorExibicao}
        onMessage={setMessage}
        colunasFuncoes={colunasPorChave('config_colunas_exclusoes_funcao')}
        colunasDropdowns={colunasPorChave('config_colunas_exclusoes_dropdown')}
        colunasRegistros={colunasExclusoesRegistro}
        paineis={paineisPorChave('config_paineis_exclusoes')}
      />
    );
  }

  function colunasPorIndice(chave: ChaveColunas) {
    return {
      initialColumns: parseColunasConfig(currentUser?.[chave]),
      onColumnsChange: (config: ColunasConfig) => salvarConfigColunas(chave, serializeColunasConfig(config.order, config.widths)),
    };
  }
  /** Props de persistência para o ResizableTable (colunas por chave). */
  function colunasPorChave(chave: ChaveColunas) {
    return {
      initialColumns: parseStringColunasConfig(currentUser?.[chave]),
      onColumnsChange: (order: string[], widths: Record<string, number>) => salvarConfigColunas(chave, serializeStringColunasConfig(order, widths)),
      storageKeySuffix: currentUser?.id ?? undefined,
    };
  }

  function handlePfColumnsChange(config: ColunasConfig) {
    if (!currentUser?.id) return;
    const serialized = serializeColunasConfig(config.order, config.widths);
    atualizarPreferenciasUsuario(currentUser.id, { config_colunas_pessoa_fisica: serialized })
      .then(() => {
        setCurrentUser((u) => (u ? { ...u, config_colunas_pessoa_fisica: serialized } : u));
      })
      .catch((err) => {
        console.error('Erro ao salvar configuração de colunas (Pessoas Físicas)', err);
      });
  }

  function handlePjColumnsChange(config: ColunasConfig) {
    if (!currentUser?.id) return;
    const serialized = serializeColunasConfig(config.order, config.widths);
    atualizarPreferenciasUsuario(currentUser.id, { config_colunas_pessoa_juridica: serialized })
      .then(() => {
        setCurrentUser((u) => (u ? { ...u, config_colunas_pessoa_juridica: serialized } : u));
      })
      .catch((err) => {
        console.error('Erro ao salvar configuração de colunas (Pessoas Jurídicas)', err);
      });
  }

  function handleAlunoColumnsChange(config: ColunasConfig) {
    if (!currentUser?.id) return;
    const serialized = serializeColunasConfig(config.order, config.widths);
    atualizarPreferenciasUsuario(currentUser.id, { config_colunas_aluno: serialized })
      .then(() => {
        setCurrentUser((u) => (u ? { ...u, config_colunas_aluno: serialized } : u));
      })
      .catch((err) => {
        console.error('Erro ao salvar configuração de colunas (Alunos)', err);
      });
  }

  function handleAtivoColumnsChange(config: ColunasConfig) {
    if (!currentUser?.id) return;
    const serialized = serializarColunasAtivo(config.order, config.widths);
    atualizarPreferenciasUsuario(currentUser.id, { config_colunas_pat_ativo: serialized })
      .then(() => {
        setCurrentUser((u) => (u ? { ...u, config_colunas_pat_ativo: serialized } : u));
      })
      .catch((err) => {
        console.error('Erro ao salvar configuração de colunas (Ativos)', err);
      });
  }

  function handleManutencaoColumnsChange(config: ColunasConfig) {
    if (!currentUser?.id) return;
    const serialized = serializeColunasConfig(config.order, config.widths);
    atualizarPreferenciasUsuario(currentUser.id, { config_colunas_pat_manutencao: serialized })
      .then(() => {
        setCurrentUser((u) => (u ? { ...u, config_colunas_pat_manutencao: serialized } : u));
      })
      .catch((err) => {
        console.error('Erro ao salvar configuração de colunas (Manutenções)', err);
      });
  }

  function handleAdminColumnsChange(config: ColunasConfig) {
    if (!currentUser?.id) return;
    const serialized = serializeColunasConfig(config.order, config.widths);
    atualizarPreferenciasUsuario(currentUser.id, { config_colunas_as_usuario: serialized })
      .then(() => {
        setCurrentUser((u) => (u ? { ...u, config_colunas_as_usuario: serialized } : u));
      })
      .catch((err) => {
        console.error('Erro ao salvar configuração de colunas (Usuários)', err);
      });
  }

  function handlePerfilColumnsChange(config: ColunasConfig) {
    if (!currentUser?.id) return;
    const serialized = serializeColunasConfig(config.order, config.widths);
    atualizarPreferenciasUsuario(currentUser.id, { config_colunas_as_perfil: serialized })
      .then(() => {
        setCurrentUser((u) => (u ? { ...u, config_colunas_as_perfil: serialized } : u));
      })
      .catch((err) => {
        console.error('Erro ao salvar configuração de colunas (Perfis)', err);
      });
  }

  function handleImagemNewForm() {
    if (!permissoesAdmin.adicionarImagem) {
      setMessage("Você não tem permissão para adicionar.");
      return;
    }
    openImagemNewForm();
  }

  function handleImagemColumnsChange(order: string[], widths: Record<string, number>) {
    if (!currentUser?.id) return;
    const serialized = serializeStringColunasConfig(order, widths);
    atualizarPreferenciasUsuario(currentUser.id, { config_colunas_as_imagem: serialized })
      .then(() => {
        setCurrentUser((u) => (u ? { ...u, config_colunas_as_imagem: serialized } : u));
      })
      .catch((err) => {
        console.error('Erro ao salvar configuração de colunas (Imagens)', err);
      });
  }

  function handleRelatorioListaColumnsChange(order: string[], widths: Record<string, number>) {
    if (!currentUser?.id) return;
    const serialized = serializeStringColunasConfig(order, widths);
    atualizarPreferenciasUsuario(currentUser.id, { config_colunas_relatorio_lista: serialized })
      .then(() => {
        setCurrentUser((u) => (u ? { ...u, config_colunas_relatorio_lista: serialized } : u));
      })
      .catch((err) => {
        console.error('Erro ao salvar configuração de colunas (Relatório Lista)', err);
      });
  }

  function handleRelatorioDadosColumnsChange(order: string[], widths: Record<string, number>) {
    if (!currentUser?.id) return;
    const serialized = serializeStringColunasConfig(order, widths);
    atualizarPreferenciasUsuario(currentUser.id, { config_colunas_relatorio_dados: serialized })
      .then(() => {
        setCurrentUser((u) => (u ? { ...u, config_colunas_relatorio_dados: serialized } : u));
      })
      .catch((err) => {
        console.error('Erro ao salvar configuração de colunas (Relatório Dados)', err);
      });
  }

  function handleRelatorioFiltrosColumnsChange(order: string[], widths: Record<string, number>) {
    if (!currentUser?.id) return;
    const serialized = serializeStringColunasConfig(order, widths);
    atualizarPreferenciasUsuario(currentUser.id, { config_colunas_relatorio_filtros: serialized })
      .then(() => {
        setCurrentUser((u) => (u ? { ...u, config_colunas_relatorio_filtros: serialized } : u));
      })
      .catch((err) => {
        console.error('Erro ao salvar configuração de colunas (Relatório Filtros)', err);
      });
  }

  function handleRelatorioOrdenacaoColumnsChange(order: string[], widths: Record<string, number>) {
    if (!currentUser?.id) return;
    const serialized = serializeStringColunasConfig(order, widths);
    atualizarPreferenciasUsuario(currentUser.id, { config_colunas_relatorio_ordenacao: serialized })
      .then(() => {
        setCurrentUser((u) => (u ? { ...u, config_colunas_relatorio_ordenacao: serialized } : u));
      })
      .catch((err) => {
        console.error('Erro ao salvar configuração de colunas (Relatório Ordenação)', err);
      });
  }

  function handleRelatorioColumnsChange(order: string[], widths: Record<string, number>) {
    if (!currentUser?.id) return;
    const serialized = serializeStringColunasConfig(order, widths);
    atualizarPreferenciasUsuario(currentUser.id, { config_colunas_relatorio: serialized })
      .then(() => {
        setCurrentUser((u) => (u ? { ...u, config_colunas_relatorio: serialized } : u));
      })
      .catch((err) => {
        console.error('Erro ao salvar configuração de colunas (Relatório)', err);
      });
  }

  function handleRelatorioBandasColumnsChange(order: string[], widths: Record<string, number>) {
    if (!currentUser?.id) return;
    const serialized = serializeStringColunasConfig(order, widths);
    atualizarPreferenciasUsuario(currentUser.id, { config_colunas_relatorio_bandas: serialized })
      .then(() => {
        setCurrentUser((u) => (u ? { ...u, config_colunas_relatorio_bandas: serialized } : u));
      })
      .catch((err) => {
        console.error('Erro ao salvar configuração de colunas (Relatório Bandas)', err);
      });
  }

  useEffect(() => {
    if (!detailModalOpen || selectedAuditIndex === null) return;
    let ativo = true;
    if (!esquemaAuditoria) carregarEsquema().then((e) => { if (ativo) setEsquemaAuditoria(e); }).catch(() => undefined);
    const estado = (log?: AuditEntry) => (log?.detalhes ?? (log as { depois?: unknown } | undefined)?.depois) as Record<string, unknown> | undefined;
    const codigos = [estado(auditLogs[selectedAuditIndex]), estado(auditLogs[selectedAuditIndex + 1])]
      .flatMap((d) => (d ? [d.cd_ibge_naturalidade, d.cd_ibge_cidade] : []))
      .map((c) => String(c ?? '').trim())
      .filter((c) => c && !(c in cidadesAuditoria));
    for (const codigo of new Set(codigos)) {
      cidadePorCodigo(codigo)
        .then((cidade) => { if (ativo) setCidadesAuditoria((m) => ({ ...m, [codigo]: cidade ? `${cidade.nome} - ${cidade.uf}` : '' })); })
        .catch(() => undefined);
    }
    return () => { ativo = false; };
  }, [detailModalOpen, selectedAuditIndex, auditLogs, esquemaAuditoria, cidadesAuditoria]);

  /**
   * Dados do histórico como o formulário os recebe ao abrir o registro: datas sem hora
   * (coluna date) em DD/MM/AAAA — os logs antigos guardam AAAA-MM-DD ou o instante ISO.
   */
  function dadosDoHistoricoParaFormulario(colecao: string, dados: Record<string, unknown>): Record<string, unknown> {
    if (!esquemaAuditoria) return dados;
    const saida: Record<string, unknown> = { ...dados };
    for (const [campo, valor] of Object.entries(dados)) {
      if (typeof valor !== 'string' || tipoDaColuna(esquemaAuditoria, colecao, campo) !== 'date') continue;
      const m = /^(\d{4})-(\d{2})-(\d{2})(T.*)?$/.exec(valor.trim());
      if (!m) continue;
      if (m[4]) {
        // Instante: o dia no fuso do Brasil.
        const d = new Date(valor);
        if (Number.isNaN(d.getTime())) continue;
        const [ano, mes, dia] = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(d).split('-');
        saida[campo] = `${dia}/${mes}/${ano}`;
      } else {
        saida[campo] = `${m[3]}/${m[2]}/${m[1]}`;
      }
    }
    return saida;
  }

  const [bandasDaAuditoria, setBandasDaAuditoria] = useState<{ nr_sequencia?: number; nr_seq_relatorio?: number; ds_banda?: string }[]>([]);
  /** Histórico de auditoria de uma importação (Gerenciador de Relatórios > Importar relatório). */
  async function openImportacaoRelatorioAuditModal(id: string) {
    setAuditDocumentType('relatorio_importacao' as typeof auditDocumentType);
    setAuditModalOpen(true);
    setAuditLoading(true);
    try {
      setAuditLogs(await fetchAuditByDocumentId('relatorio_importacao', id));
    } catch {
      setAuditLogs([]);
    } finally {
      setAuditLoading(false);
    }
  }

  async function openRelatorioAuditModal(
    relatorioId?: string | null,
    itemId?: string | null,
    tipo: 'relatorio' | 'relatorio_banda' | 'relatorio_banda_elemento' | 'relatorio_parametro' = 'relatorio'
  ) {
    const docId = itemId ?? relatorioId;
    if (!docId) return;
    setAuditDocumentType('relatorio' as any);
    setRelatorioAuditTipo(tipo);
    setRelatorioAuditItemId(docId);
    setAuditModalOpen(true);
    setAuditLoading(true);
    try {
      const logs = await fetchAuditByDocumentId(tipo, docId);
      setAuditLogs(logs);
      if (tipo === 'relatorio_banda') {
        const nrRel = (logs.find((l) => l.detalhes && (l.detalhes as Record<string, unknown>).nr_seq_relatorio != null)?.detalhes as Record<string, unknown> | undefined)?.nr_seq_relatorio;
        if (nrRel != null) {
          const { obterBandasSql } = await import('@/services/relatorioSqlService');
          setBandasDaAuditoria(await obterBandasSql(Number(nrRel)).catch(() => []));
        }
      }
    } catch (e) {
      setAuditLogs([]);
    } finally {
      setAuditLoading(false);
    }
  }

  function handleCgColumnsChange(config: ColunasConfig) {
    if (!currentUser?.id) return;
    const serialized = serializeColunasConfig(config.order, config.widths);
    atualizarPreferenciasUsuario(currentUser.id, { [cgConfigKey]: serialized })
      .then(() => {
        setCurrentUser((u) => (u ? { ...u, [cgConfigKey]: serialized } : u));
      })
      .catch((err) => {
        console.error('Erro ao salvar configuração de colunas (Cadastros Gerais)', err);
      });
  }

  /* ── Ordenar funções do menu lateral (apenas com o menu aberto) ── */
  function handleSectionDragStart(section: SectionType) {
    if (!isSidebarOpen) return;
    draggedRef.current = true;
    setDragSection(section);
  }

  function handleSectionDragOver(section: SectionType) {
    if (!isSidebarOpen || !dragSection) return;
    setDragOverSection(section);
  }

  function handleSectionDrop(target: SectionType) {
    const from = dragSection;
    setDragSection(null);
    setDragOverSection(null);
    if (!isSidebarOpen || !from || from === target) return;

    const next = [...menuOrder];
    const fromIndex = next.indexOf(from);
    const toIndex = next.indexOf(target);
    next.splice(fromIndex, 1);
    next.splice(toIndex, 0, from);
    setMenuOrder(next);
    persistMenuOrder(next);
  }

  function handleSectionDragEnd() {
    draggedRef.current = false;
    setDragSection(null);
    setDragOverSection(null);
  }

  function persistMenuOrder(order: SectionType[]) {
    if (!currentUser?.id) return;
    const serialized = serializeMenuOrder(order);
    atualizarPreferenciasUsuario(currentUser.id, { config_ordem_menu_lateral: serialized })
      .then(() => {
        setCurrentUser((u) => (u ? { ...u, config_ordem_menu_lateral: serialized } : u));
      })
      .catch((err) => {
        console.error('Erro ao salvar ordem do menu', err);
      });
  }

  /* ================================================================ */
  /*  Render principal                                                */
  /* ================================================================ */

  if (sessionRestoring) {
    return (
      <div className={`relative min-h-screen overflow-hidden ${darkMode ? "dark bg-[#18181b]" : "bg-white"}`}>
        <LoadingModal open={true} message="Restaurando sessão..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-white">
        <LoginScreen
          onLogin={handleLogin}
          onAlterarSenha={handleAlterarSenhaLogin}
          errorMessage={loginError}
          onClearError={() => setLoginError(null)}
          warningMessage={loginWarning}
          onClearWarning={() => setLoginWarning(null)}
          isLoading={isLoginLoading}
        />

        {isLoginLoading && <LoadingModal open={true} message="Validando login..." />}
      </div>
    );
  }

  /* ── Cards dos filtros aplicados (entre o dropdown e a tabela de cada tela de registros) ── */
  /** Tira um filtro: volta o campo ao valor padrão no filtro aplicado e no formulário do filtro. */
  function removedorDeFiltro<T extends object>(
    setAplicado: React.Dispatch<React.SetStateAction<T>>,
    setRascunho: React.Dispatch<React.SetStateAction<T>>,
  ) {
    return (campo: string, padrao: string) => {
      setAplicado((f) => ({ ...f, [campo]: padrao }) as T);
      setRascunho((f) => ({ ...f, [campo]: padrao }) as T);
    };
  }
  /** Um card por campo preenchido (diferente do padrão), na ordem informada. */
  function cardsDeFiltro<T extends object>(
    prefixo: string,
    aplicado: T,
    campos: { campo: keyof T & string; rotulo: string; exibir?: (v: string) => string; padrao?: string }[],
    remover: (campo: string, padrao: string) => void,
  ): FiltroAplicado[] {
    return campos.flatMap(({ campo, rotulo, exibir, padrao = '' }) => {
      const valor = String((aplicado as Record<string, unknown>)[campo] ?? '').trim();
      if (valor === '' || valor === padrao) return [];
      return [{ chave: `${prefixo}.${campo}`, rotulo, valor: (exibir ? exibir(valor) : valor) || valor, onRemover: () => remover(campo, padrao) }];
    });
  }
  const rotuloDeOpcao = (opcoes: { value: string; label: string }[]) => (v: string) => opcoes.find((o) => o.value === v)?.label ?? v;
  const statusAtivoInativo = rotuloDeOpcao([{ value: 'A', label: 'Ativo' }, { value: 'I', label: 'Inativo' }]);
  const nomePessoaFisicaFiltro = (v: string) => pessoasFisicas.find((p) => String(p.nr_sequencia) === v)?.ds_nome ?? v;
  const nomePessoaJuridicaFiltro = (v: string) => pessoasJuridicas.find((p) => String(p.nr_sequencia) === v)?.ds_razao_social ?? v;
  const nomeColaboradorFiltro = (v: string) => nomeColaboradorPorSeq(Number(v)) || v;
  const descricaoDeLista = <I extends { nr_sequencia: number },>(lista: I[], descricao: (item: I) => string | undefined) =>
    (v: string) => descricao(lista.find((item) => String(item.nr_sequencia) === v) ?? ({} as I)) ?? v;
  /** Sequência + Descrição + Status dos filtros no padrão dos Cadastros Gerais. */
  const camposCg = (comDescricao: boolean, comStatus: boolean) => [
    { campo: 'nr_sequencia' as const, rotulo: 'Sequência' },
    ...(comDescricao ? [{ campo: 'descricao' as const, rotulo: 'Descrição' }] : []),
    ...(comStatus ? [{ campo: 'ie_status' as const, rotulo: 'Status', exibir: statusAtivoInativo, padrao: 'T' }] : []),
  ];

  const cardsPf = cardsDeFiltro('pf', appliedFilterForm, [
    { campo: 'nr_sequencia', rotulo: 'Sequência' },
    { campo: 'ds_nome', rotulo: 'Nome completo' },
    { campo: 'nr_cpf', rotulo: 'CPF' },
    { campo: 'dt_nascimento_inicio', rotulo: 'Nascimento (início)' },
    { campo: 'dt_nascimento_fim', rotulo: 'Nascimento (fim)' },
    { campo: 'ds_email', rotulo: 'E-mail' },
    { campo: 'nr_telefone', rotulo: 'Telefone' },
    { campo: 'nr_seq_sexo', rotulo: 'Sexo', exibir: (v) => pfCgLookups.nr_seq_sexo[Number(v)] ?? v },
    { campo: 'nr_seq_estado_civil', rotulo: 'Estado civil', exibir: (v) => pfCgLookups.nr_seq_estado_civil[Number(v)] ?? v },
    { campo: 'nr_seq_cor_raca', rotulo: 'Cor/Raça', exibir: (v) => pfCgLookups.nr_seq_cor_raca[Number(v)] ?? v },
    { campo: 'nr_seq_profissao', rotulo: 'Profissão', exibir: (v) => pfCgLookups.nr_seq_profissao[Number(v)] ?? v },
  ], removedorDeFiltro(setAppliedFilterForm, setFilterForm));

  const cardsPj = cardsDeFiltro('pj', appliedPjFilterForm, [
    { campo: 'nr_sequencia', rotulo: 'Sequência' },
    { campo: 'nr_cnpj', rotulo: 'CNPJ' },
    { campo: 'dt_abertura_inicio', rotulo: 'Data de abertura (início)' },
    { campo: 'dt_abertura_fim', rotulo: 'Data de abertura (fim)' },
    { campo: 'ds_razao_social', rotulo: 'Razão social' },
    { campo: 'ds_nome_fantasia', rotulo: 'Nome fantasia' },
    { campo: 'nr_inscricao_estadual', rotulo: 'Inscrição estadual' },
    { campo: 'nr_inscricao_municipal', rotulo: 'Inscrição municipal' },
    { campo: 'nr_telefone', rotulo: 'Telefone' },
    { campo: 'ds_email', rotulo: 'E-mail' },
    { campo: 'sg_estado', rotulo: 'UF' },
    { campo: 'cd_ibge_cidade', rotulo: 'Cidade (código IBGE)' },
  ], removedorDeFiltro(setAppliedPjFilterForm, setPjFilterForm));

  const cardsAdmin = cardsDeFiltro('as_usuario', appliedAdminFilterForm, [
    { campo: 'nr_sequencia', rotulo: 'Sequência' },
    { campo: 'ds_usuario', rotulo: 'Usuário' },
    { campo: 'ds_usuario_alternativo', rotulo: 'Usuário alternativo' },
    { campo: 'nr_seq_pessoa_fisica', rotulo: 'Pessoa física', exibir: nomePessoaFisicaFiltro },
    { campo: 'ie_status', rotulo: 'Status', padrao: 'T', exibir: rotuloDeOpcao([{ value: 'A', label: 'Ativo' }, { value: 'B', label: 'Bloqueado' }, { value: 'I', label: 'Inativo' }]) },
  ], removedorDeFiltro(setAppliedAdminFilterForm, setAdminFilterForm));

  const cardsPerfil = cardsDeFiltro('as_perfil', appliedPerfilFilterForm, [
    { campo: 'nr_sequencia', rotulo: 'Sequência' },
    { campo: 'ds_perfil', rotulo: 'Perfil' },
    { campo: 'ie_status', rotulo: 'Status', padrao: 'T', exibir: statusAtivoInativo },
  ], removedorDeFiltro(setAppliedPerfilFilterForm, setPerfilFilterForm));

  const cardsCg = cardsDeFiltro('cg', appliedCgFilterForm, camposCg(true, true), removedorDeFiltro(setAppliedCgFilterForm, setCgFilterForm));
  const cardsCategoria = cardsDeFiltro('pat_categoria', appliedCategoriaFilterForm, camposCg(true, true), removedorDeFiltro(setAppliedCategoriaFilterForm, setCategoriaFilterForm));
  const cardsCurso = cardsDeFiltro('curso', appliedCursoFilterForm, camposCg(true, true), removedorDeFiltro(setAppliedCursoFilterForm, setCursoFilterForm));
  const cardsDisciplina = cardsDeFiltro('disciplina', appliedDisciplinaFilterForm, camposCg(true, false), removedorDeFiltro(setAppliedDisciplinaFilterForm, setDisciplinaFilterForm));
  const cardsTurma = [
    ...cardsDeFiltro('turma', appliedTurmaFilterForm, camposCg(true, false), removedorDeFiltro(setAppliedTurmaFilterForm, setTurmaFilterForm)),
    ...cardsDeFiltro('turma_extra', turmaFiltroExtraAplicado, [
      { campo: 'nr_seq_curso', rotulo: 'Curso', exibir: (v) => descricaoReferenciaTurma('nr_seq_curso', v) || v },
      { campo: 'nr_seq_periodo_letivo', rotulo: 'Período letivo', exibir: (v) => descricaoReferenciaTurma('nr_seq_periodo_letivo', v) || v },
    ], removedorDeFiltro(setTurmaFiltroExtraAplicado, setTurmaFiltroExtra)),
  ];
  const cardsTurmaDisciplina = [
    ...cardsDeFiltro('turma_disciplina', appliedTurmaDisciplinaFilterForm, camposCg(false, true), removedorDeFiltro(setAppliedTurmaDisciplinaFilterForm, setTurmaDisciplinaFilterForm)),
    ...cardsDeFiltro('turma_disciplina_extra', turmaDisciplinaFiltroExtraAplicado, [
      { campo: 'nr_seq_turma', rotulo: 'Turma', exibir: (v) => descricaoReferenciaTurmaDisciplina('nr_seq_turma', v) || v },
      { campo: 'nr_seq_disciplina', rotulo: 'Disciplina', exibir: (v) => descricaoReferenciaTurmaDisciplina('nr_seq_disciplina', v) || v },
      { campo: 'nr_seq_periodo_letivo', rotulo: 'Período letivo', exibir: (v) => descricaoReferenciaTurmaDisciplina('nr_seq_periodo_letivo', v) || v },
    ], removedorDeFiltro(setTurmaDisciplinaFiltroExtraAplicado, setTurmaDisciplinaFiltroExtra)),
  ];

  const cardsPeriodoLetivo = cardsDeFiltro('periodo_letivo', appliedPeriodoLetivoFilterForm, [
    { campo: 'nr_sequencia', rotulo: 'Sequência' },
    { campo: 'nr_ano', rotulo: 'Ano' },
    { campo: 'ds_periodo_letivo', rotulo: 'Descrição' },
    { campo: 'ie_status', rotulo: 'Status', exibir: rotuloDeOpcao(STATUS_PERIODO_LETIVO_OPTIONS) },
  ], removedorDeFiltro(setAppliedPeriodoLetivoFilterForm, setPeriodoLetivoFilterForm));

  const cardsAluno = cardsDeFiltro('aluno', appliedAlunoFilterForm, [
    { campo: 'nr_sequencia', rotulo: 'Sequência' },
    { campo: 'nr_matricula', rotulo: 'Matrícula' },
    { campo: 'nr_seq_pessoa_fisica', rotulo: 'Pessoa física', exibir: nomePessoaFisicaFiltro },
    { campo: 'dt_ingresso_inicio', rotulo: 'Data de ingresso (início)' },
    { campo: 'dt_ingresso_fim', rotulo: 'Data de ingresso (fim)' },
  ], removedorDeFiltro(setAppliedAlunoFilterForm, setAlunoFilterForm));

  const cardsColaborador = cardsDeFiltro('colaborador', appliedColaboradorFilterForm, [
    { campo: 'nr_sequencia', rotulo: 'Sequência' },
    { campo: 'nr_matricula', rotulo: 'Matrícula' },
    { campo: 'nr_seq_pessoa_fisica', rotulo: 'Pessoa física', exibir: nomePessoaFisicaFiltro },
    { campo: 'nr_seq_pessoa_juridica', rotulo: 'Pessoa jurídica', exibir: nomePessoaJuridicaFiltro },
    { campo: 'dt_admissao_inicio', rotulo: 'Data de admissão (início)' },
    { campo: 'dt_admissao_fim', rotulo: 'Data de admissão (fim)' },
  ], removedorDeFiltro(setAppliedColaboradorFilterForm, setColaboradorFilterForm));

  const cardsAtivo = cardsDeFiltro('pat_ativo', appliedAtivoFilterForm, [
    { campo: 'nr_sequencia', rotulo: 'Sequência' },
    { campo: 'cd_externo', rotulo: 'Código externo' },
    { campo: 'ds_ativo', rotulo: 'Descrição' },
    { campo: 'ds_modelo', rotulo: 'Modelo' },
    { campo: 'nr_serie', rotulo: 'Nº de série' },
    { campo: 'ds_qr_code', rotulo: 'QR Code' },
    { campo: 'ds_codigo_barras', rotulo: 'Código de barras' },
    { campo: 'dt_aquisicao_inicio', rotulo: 'Data aquisição (início)' },
    { campo: 'dt_aquisicao_fim', rotulo: 'Data aquisição (fim)' },
    { campo: 'dt_garantia_inicio', rotulo: 'Data garantia (início)' },
    { campo: 'dt_garantia_fim', rotulo: 'Data garantia (fim)' },
    { campo: 'ie_status', rotulo: 'Status', padrao: 'T', exibir: rotuloDeOpcao(ATIVO_STATUS_OPTIONS) },
    { campo: 'nr_seq_categoria', rotulo: 'Categoria', exibir: descricaoDeLista(categoriasAtivos, (c) => c.ds_categoria) },
    { campo: 'nr_seq_localizacao', rotulo: 'Localização', exibir: descricaoDeLista(localizacoes, (l) => l.ds_localizacao) },
    { campo: 'nr_seq_marca', rotulo: 'Marca', exibir: descricaoDeLista(marcas, (m) => m.ds_marca) },
    { campo: 'nr_seq_responsavel', rotulo: 'Responsável', exibir: nomeColaboradorFiltro },
    { campo: 'nr_seq_fornecedor', rotulo: 'Fornecedor', exibir: nomeColaboradorFiltro },
    { campo: 'ds_endereco_mac', rotulo: 'Endereço MAC' },
    { campo: 'ds_ip', rotulo: 'IPv4' },
    { campo: 'nr_seq_sistema_operacional', rotulo: 'Sistema operacional', exibir: descricaoDeLista(sistemasOperacionais, (s) => s.ds_sistema_operacional) },
  ], removedorDeFiltro(setAppliedAtivoFilterForm, setAtivoFilterForm));

  const cardsManutencao = cardsDeFiltro('pat_manutencao', appliedManutencaoFilterForm, [
    { campo: 'nr_sequencia', rotulo: 'Sequência' },
    { campo: 'nr_seq_ativo', rotulo: 'Ativo', exibir: descricaoDeLista(ativos, (a) => a.ds_ativo) },
    { campo: 'nr_seq_prestador_servico', rotulo: 'Prestador de serviço', exibir: nomeColaboradorFiltro },
    { campo: 'dt_envio_inicio', rotulo: 'Data envio (início)' },
    { campo: 'dt_envio_fim', rotulo: 'Data envio (fim)' },
    { campo: 'dt_termino_inicio', rotulo: 'Data término (início)' },
    { campo: 'dt_termino_fim', rotulo: 'Data término (fim)' },
    { campo: 'vl_total_menor', rotulo: 'Valor total (menor)' },
    { campo: 'vl_total_maior', rotulo: 'Valor total (maior)' },
    { campo: 'ie_status_manutencao', rotulo: 'Status', padrao: 'T', exibir: rotuloDeOpcao(MANUTENCAO_STATUS_OPTIONS) },
  ], removedorDeFiltro(setAppliedManutencaoFilterForm, setManutencaoFilterForm));

  const cardsRelatorio = [
    ...cardsDeFiltro('relatorio', appliedRelatorioFilterForm, [
      { campo: 'nr_sequencia', rotulo: 'Sequência' },
      { campo: 'descricao', rotulo: 'Descrição' },
    ], removedorDeFiltro(setAppliedRelatorioFilterForm, setRelatorioFilterForm)),
    ...cardsDeFiltro('relatorio_extra', relatorioFiltroExtraAplicado, [
      { campo: 'ie_formato', rotulo: 'Formato', exibir: rotuloDeOpcao(RELATORIO_FORMATO_FILTRO_OPTIONS) },
      { campo: 'ds_nome_arquivo', rotulo: 'Nome do arquivo' },
      { campo: 'nr_seq_formato_papel', rotulo: 'Formato do papel', exibir: (v) => formatosPapel.find((p) => String(p.nr_sequencia) === v)?.ds_formato_papel ?? v },
      { campo: 'ie_orientacao', rotulo: 'Orientação', exibir: rotuloDeOpcao(RELATORIO_ORIENTACAO_FILTRO_OPTIONS) },
      { campo: 'ie_status', rotulo: 'Status', padrao: 'T', exibir: rotuloDeOpcao(RELATORIO_STATUS_FILTRO_OPTIONS) },
      { campo: 'nr_seq_usuario_criacao', rotulo: 'Usuário criação', exibir: (v) => dsUsuarioPorSeq(v) || v },
      { campo: 'nr_seq_usuario_alteracao', rotulo: 'Usuário alteração', exibir: (v) => dsUsuarioPorSeq(v) || v },
    ], removedorDeFiltro(setRelatorioFiltroExtraAplicado, setRelatorioFiltroExtra)),
  ];

  const cardsCopia = [
    ...cardsDeFiltro('copia', appliedCopiaFilterForm, camposCg(false, false), removedorDeFiltro(setAppliedCopiaFilterForm, setCopiaFilterForm)),
    ...cardsDeFiltro('copia_extra', copiaFiltroExtraAplicado, [
      { campo: 'ie_status', rotulo: 'Status', exibir: rotuloDeOpcao(STATUS_COPIA_OPTIONS) },
      { campo: 'nr_seq_solicitante', rotulo: 'Solicitante', exibir: (v) => descricaoReferenciaCopia('nr_seq_solicitante', v) || v },
      { campo: 'nr_seq_turma_disciplina', rotulo: 'Turma x Disciplina', exibir: (v) => descricaoReferenciaCopia('nr_seq_turma_disciplina', v) || v },
      { campo: 'nr_seq_formato_papel', rotulo: 'Formato do papel', exibir: (v) => descricaoReferenciaCopia('nr_seq_formato_papel', v) || v },
      { campo: 'nr_seq_tipo_papel', rotulo: 'Tipo de papel', exibir: (v) => descricaoReferenciaCopia('nr_seq_tipo_papel', v) || v },
    ], removedorDeFiltro(setCopiaFiltroExtraAplicado, setCopiaFiltroExtra)),
  ];

  /**
   * Conteúdo (lista ou formulário) de uma função do menu. Recebe a seção e a tela
   * como parâmetros para que cada função aberta mantenha a sua própria tela.
   */
  function renderConteudoSecao(activeSection: SectionType, view: ViewType) {
    return (
      view === "list" ? (
              activeSection === "pessoaFisica" ? (
                pjManageSelection === 'pessoasJuridicas' ? (
                  <PessoaJuridicaListView
                    filtrosAplicados={cardsPj}
                    message={message}
                    loading={loading}
                    pessoasJuridicas={filteredSortedPessoasJuridicas}
                    openNewForm={handlePjNewForm}
                    openEditForm={openPjEditForm}
                    openFilter={openPjFilterModal}
                    handleDelete={handlePjDelete}
                    setContextMenu={setContextMenu}
                    selectOptions={PJ_SELECT_OPTIONS}
                    manageSelection={pjManageSelection}
                    onManageSelectionChange={handlePjManageSelectionChange}
                    allowedSubmodulos={allowedPessoaSubmodulos}
                    sortColumn={pjSortColumn}
                    sortAsc={pjSortAsc}
                    onSortChange={handlePjSortChange}
                    initialColumns={pjColunasConfig}
                    onColumnsChange={handlePjColumnsChange}
                    columnLookups={pjCgLookups}
                  />
                ) : pfDetalhe ? (
                  <PessoaFisicaDetalheView
                    key={pfDetalhe.id}
                    abaInicial={pfDetalheAba}
                    onAbaChange={setPfDetalheAba}
                    pessoa={pfDetalhe}
                    selectOptions={PJ_SELECT_OPTIONS}
                    manageSelection={pjManageSelection}
                    onManageSelectionChange={handlePjManageSelectionChange}
                    allowedSubmodulos={allowedPessoaSubmodulos}
                    onPrevRecord={() => navegarDetalheDaPessoaFisica(-1)}
                    onNextRecord={() => navegarDetalheDaPessoaFisica(1)}
                    hasPrevRecord={pfDetalheIndex > 0}
                    hasNextRecord={pfDetalheIndex >= 0 && pfDetalheIndex < filteredSortedPessoasFisicas.length - 1}
                    onVoltar={() => { setMessage(""); setPfDetalheId(null); }}
                    logradouros={pfCgOptions.logradouros}
                    regrasDaColecao={(colecao) => campoRegrasDaColecao(campoRegrasAtivas, colecao)}
                    onOpenAudit={openPessoaFisicaAbaAuditModal}
                    resolverNomeAutor={resolverNomeAutorExibicao}
                    onMessage={setMessage}
                    onSavingChange={setPfDetalheSaving}
                    darkMode={darkMode}
                  />
                ) : (
                  <PessoaFisicaListView
                    filtrosAplicados={cardsPf}
                    message={message}
                    loading={loading}
                    pessoasFisicas={filteredSortedPessoasFisicas}
                    openNewForm={handlePessoaNewForm}
                    openEditForm={openEditForm}
                    openFilter={openFilterModal}
                    handleDelete={handleDelete}
                    setContextMenu={setContextMenu}
                    selectOptions={PJ_SELECT_OPTIONS}
                    manageSelection={pjManageSelection}
                    onManageSelectionChange={handlePjManageSelectionChange}
                    allowedSubmodulos={allowedPessoaSubmodulos}
                    sortColumn={sortColumn}
                    sortAsc={sortAsc}
                    onSortChange={handleSortChange}
                    initialColumns={pfColunasConfig}
                    onColumnsChange={handlePfColumnsChange}
                    columnLookups={pfCgLookups}
                    onOpenDetalhe={permissoesPessoa.detalhesPessoaFisica ? abrirDetalheDaPessoaFisica : undefined}
                  />
                )
              ) : activeSection === "administracaoSistema" ? (
              adminManageSelection === 'avisos' ? (
                <AvisosView
                  colunas={colunasPorChave('config_colunas_avisos')}
                  paineis={paineisPorChave('config_paineis_avisos')}
                  manageSelection={adminManageSelection}
                  onManageSelectionChange={handleAdminManageSelectionChange}
                  allowedSubmodulos={allowedAdminSubmodulos}
                  auditAutor={auditAutor}
                  resolverNomeAutorExibicao={resolverNomeAutorExibicao}
                  onOpenAudit={openAvisoAuditModal}
                  onSaveSuccess={(msg) => setMessage(msg)}
                  onSavingChange={setParametrosSaving}
                />
              ) : adminManageSelection === 'parametros' ? (
                <ParametrosDaFuncaoView key={`parametros-${parametrosFuncaoInicial.vez}`} funcaoInicial={parametrosFuncaoInicial.funcao} colunas={colunasPorChave('config_colunas_parametros_funcao_as')} paineis={paineisPorChave('config_paineis_parametros_funcao_as')}
                  opcoesValorPadrao={opcoesValorPadraoCopia}
                  onAfterSave={aposSalvarParametro}
                  manageSelection={adminManageSelection}
                  onManageSelectionChange={handleAdminManageSelectionChange}
                  selectOptions={ADMIN_OPCOES_DROPDOWN}
                  allowedSubmodulos={allowedAdminSubmodulos}
                  onSaveSuccess={(msg) => setMessage(msg)}
                  onSavingChange={setParametrosSaving}
                  onOpenAudit={openParametroAuditModal}
                  resolverNomeAutor={resolverNomeAutorExibicao}
                  auditAutor={auditAutor}
                />
              ) : adminManageSelection === 'regras' ? (
                <RegrasView
                  colunas={colunasPorChave('config_colunas_regras')}
                  paineis={paineisPorChave('config_paineis_regras')}
                  manageSelection={adminManageSelection}
                  onManageSelectionChange={handleAdminManageSelectionChange}
                  allowedSubmodulos={allowedAdminSubmodulos}
                  auditAutor={auditAutor}
                  resolverNomeAutorExibicao={resolverNomeAutorExibicao}
                  onOpenAudit={openRegraAuditModal}
                  onSaveSuccess={(msg) => setMessage(msg)}
                  onSavingChange={setParametrosSaving}
                  onRegraSalva={setRegraSistema}
                />
              ) : (adminManageSelection === 'camposFormularios' || adminManageSelection === 'camposModais') ? (
                <CamposView key={adminManageSelection} modo={adminManageSelection === 'camposModais' ? 'modais' : 'formularios'} {...(adminManageSelection === 'camposModais'
                  ? { paineis: paineisPorChave('config_paineis_campos_modais'), colunasPerfil: colunasPorChave('config_colunas_campos_modais_perfil'), colunasFuncao: colunasPorChave('config_colunas_campos_modais_funcao'), colunasCampos: colunasPorChave('config_colunas_campos_modais_campo') }
                  : { paineis: paineisPorChave('config_paineis_campos'), colunasPerfil: colunasPorChave('config_colunas_campos_perfil'), colunasFuncao: colunasPorChave('config_colunas_campos_funcao'), colunasCampos: colunasPorChave('config_colunas_campos_campo') })}
                  perfis={perfis}
                  onChangeStatus={handleCamposStatusChange}
                  onOpenAuditCampo={openCampoAuditModal}
                  manageSelection={adminManageSelection}
                  onManageSelectionChange={handleAdminManageSelectionChange}
                  allowedSubmodulos={allowedAdminSubmodulos}
                  podeAlterarStatusCampo={(adminManageSelection === 'camposModais' ? permissoesAdmin.alterarStatusCampoModal : permissoesAdmin.alterarStatusCampoFormulario) && !isAdministradorPerfil(perfis.find((p) => p.id === camposPerfilId))}
                  selectedPerfilId={camposPerfilId}
                  onSelectedPerfilIdChange={setCamposPerfilId}
                  selectedFuncao={camposFuncao}
                  onSelectedFuncaoChange={setCamposFuncao}
                  funcaoJaSelecionada={camposFuncaoJaSelecionada}
                  onFuncaoJaSelecionadaChange={setCamposFuncaoJaSelecionada}
                />
              ) : adminManageSelection === 'usuarios' ? (
                  <AdministracaoSistemaListView
                    filtrosAplicados={cardsAdmin}
                    message={message}
                    loading={loading}
                    usuarios={filteredSortedUsuarios}
                    pessoasFisicas={pessoasFisicas}
                    openNewForm={handleAdminNewForm}
                    openEditForm={openAdminEditForm}
                    setContextMenu={setContextMenu}
                    sortColumn={adminSortColumn}
                    sortAsc={adminSortAsc}
                    onSortChange={handleAdminSortChange}
                    manageSelection={adminManageSelection}
                    onManageSelectionChange={handleAdminManageSelectionChange}
                    allowedSubmodulos={allowedAdminSubmodulos}
                    openFilter={openAdminFilterModal}
                    initialColumns={adminColunasConfig}
                    onColumnsChange={handleAdminColumnsChange}
                  />
                ) : adminManageSelection === 'imagens' ? (
                  <ImagemListView
                    loading={loading}
                    imagens={filteredSortedImagens}
                    openNewForm={handleImagemNewForm}
                    openEditForm={openImagemEditForm}
                    handleDelete={handleImagemDelete}
                    setContextMenu={setContextMenu}
                    sortColumn={imagemSortColumn}
                    sortAsc={imagemSortAsc}
                    onSortChange={handleImagemSortChange}
                    manageSelection={adminManageSelection}
                    onManageSelectionChange={handleAdminManageSelectionChange}
                    allowedSubmodulos={allowedAdminSubmodulos}
                    initialColumns={imagemColunasConfig}
                    onColumnsChange={handleImagemColumnsChange}
                  />
                ) : (
                  <PerfilListView
                    filtrosAplicados={cardsPerfil}
                    message={message}
                    loading={loading}
                    perfis={filteredSortedPerfis}
                    openNewForm={handlePerfilNewForm}
                    openEditForm={openPerfilEditForm}
                    setContextMenu={setContextMenu}
                    sortColumn={perfilSortColumn}
                    sortAsc={perfilSortAsc}
                    onSortChange={handlePerfilSortChange}
                    manageSelection={adminManageSelection}
                    onManageSelectionChange={handleAdminManageSelectionChange}
                    allowedSubmodulos={allowedAdminSubmodulos}
                    openFilter={openPerfilFilterModal}
                    initialColumns={perfilColunasConfig}
                    onColumnsChange={handlePerfilColumnsChange}
                  />
                )
              ) : activeSection === "estruturaAcademica" ? (
                alunoManageSelection === 'cursos' ? (
                  <CadastroGeralListView
                    filtrosAplicados={cardsCurso}
                    key="cursos"
                    loading={loading}
                    items={filteredSortedCursos}
                    columns={CURSO_COLUMNS}
                    formatCellValue={formatCadastroGeralCellValue}
                    emptyMessage='Clique em "Adicionar" para cadastrar um curso.'
                    selectOptions={EA_SELECT_OPTIONS}
                    manageSelection={alunoManageSelection}
                    onManageSelectionChange={handleAlunoManageSelectionChange}
                    allowedSubmodulos={allowedAlunoSubmodulos}
                    openNewForm={handleCursoNewForm}
                    openEditForm={openCursoEditForm}
                    openFilter={openCursoFilterModal}
                    setContextMenu={setContextMenu}
                    contextMenuSection="estruturaAcademica"
                    sortColumn={cursoSortColumn}
                    sortAsc={cursoSortAsc}
                    onSortChange={handleCursoSortChange}
                    {...colunasPorIndice('config_colunas_curso')}
                  />
                ) : alunoManageSelection === 'disciplinas' ? (
                  <CadastroGeralListView
                    filtrosAplicados={cardsDisciplina}
                    key="disciplinas"
                    loading={loading}
                    items={filteredSortedDisciplinas}
                    columns={DISCIPLINA_COLUMNS}
                    formatCellValue={formatCadastroGeralCellValue}
                    emptyMessage='Clique em "Adicionar" para cadastrar uma disciplina.'
                    selectOptions={EA_SELECT_OPTIONS}
                    manageSelection={alunoManageSelection}
                    onManageSelectionChange={handleAlunoManageSelectionChange}
                    allowedSubmodulos={allowedAlunoSubmodulos}
                    openNewForm={handleDisciplinaNewForm}
                    openEditForm={openDisciplinaEditForm}
                    openFilter={openDisciplinaFilterModal}
                    setContextMenu={setContextMenu}
                    contextMenuSection="estruturaAcademica"
                    sortColumn={disciplinaSortColumn}
                    sortAsc={disciplinaSortAsc}
                    onSortChange={handleDisciplinaSortChange}
                    {...colunasPorIndice('config_colunas_disciplina')}
                  />
                ) : alunoManageSelection === 'turmas' ? (
                  <CadastroGeralListView
                    filtrosAplicados={cardsTurma}
                    key="turmas"
                    loading={loading}
                    items={filteredSortedTurmas}
                    columns={TURMA_COLUMNS}
                    formatCellValue={formatTurmaCellValue}
                    emptyMessage='Clique em "Adicionar" para cadastrar uma turma.'
                    selectOptions={EA_SELECT_OPTIONS}
                    manageSelection={alunoManageSelection}
                    onManageSelectionChange={handleAlunoManageSelectionChange}
                    allowedSubmodulos={allowedAlunoSubmodulos}
                    openNewForm={handleTurmaNewForm}
                    openEditForm={openTurmaEditForm}
                    openFilter={openTurmaFilterModal}
                    setContextMenu={setContextMenu}
                    contextMenuSection="estruturaAcademica"
                    sortColumn={turmaSortColumn}
                    sortAsc={turmaSortAsc}
                    onSortChange={handleTurmaSortChange}
                    {...colunasPorIndice('config_colunas_turma')}
                  />
                ) : alunoManageSelection === 'turmasDisciplinas' ? (
                  <CadastroGeralListView
                    filtrosAplicados={cardsTurmaDisciplina}
                    key="turmasDisciplinas"
                    loading={loading}
                    items={filteredSortedTurmasDisciplinas}
                    columns={TURMA_DISCIPLINA_COLUMNS}
                    formatCellValue={formatTurmaDisciplinaCellValue}
                    emptyMessage='Clique em "Adicionar" para cadastrar uma turma x disciplina.'
                    selectOptions={EA_SELECT_OPTIONS}
                    manageSelection={alunoManageSelection}
                    onManageSelectionChange={handleAlunoManageSelectionChange}
                    allowedSubmodulos={allowedAlunoSubmodulos}
                    openNewForm={handleTurmaDisciplinaNewForm}
                    openEditForm={openTurmaDisciplinaEditForm}
                    openFilter={openTurmaDisciplinaFilterModal}
                    setContextMenu={setContextMenu}
                    contextMenuSection="estruturaAcademica"
                    sortColumn={turmaDisciplinaSortColumn}
                    sortAsc={turmaDisciplinaSortAsc}
                    onSortChange={handleTurmaDisciplinaSortChange}
                    {...colunasPorIndice('config_colunas_turma_disciplina')}
                  />
                ) : alunoManageSelection === 'periodoLetivo' && periodoLetivoFeriados ? (
                  <PeriodoLetivoFeriadosView
                    key={periodoLetivoFeriados.id}
                    periodo={periodoLetivoFeriados}
                    selectOptions={EA_SELECT_OPTIONS}
                    manageSelection={alunoManageSelection}
                    onManageSelectionChange={handleAlunoManageSelectionChange}
                    allowedSubmodulos={allowedAlunoSubmodulos}
                    onPrevRecord={() => navegarFeriadosDoPeriodo(-1)}
                    onNextRecord={() => navegarFeriadosDoPeriodo(1)}
                    hasPrevRecord={periodoLetivoFeriadosIndex > 0}
                    hasNextRecord={periodoLetivoFeriadosIndex >= 0 && periodoLetivoFeriadosIndex < filteredSortedPeriodosLetivos.length - 1}
                    onVoltar={() => { setMessage(""); setPeriodoLetivoFeriadosId(null); }}
                    auditAutor={auditAutor}
                    campoRegras={campoRegrasDaColecao(campoRegrasAtivas, 'periodo_letivo_feriado')}
                    onOpenAudit={openFeriadoAuditModal}
                    resolverNomeAutor={resolverNomeAutorExibicao}
                    onMessage={setMessage}
                    onSavingChange={setPeriodoLetivoFeriadoSaving}
                    confirmar={(titulo, mensagem, acao) => setConfirmAcao({ titulo, mensagem, acao })}
                    colunas={colunasPorChave('config_colunas_periodo_letivo_feriado')}
                    darkMode={darkMode}
                  />
                ) : alunoManageSelection === 'periodoLetivo' ? (
                  <PeriodoLetivoListView
                    filtrosAplicados={cardsPeriodoLetivo}
                    onOpenFeriados={abrirFeriadosDoPeriodo}
                    message={message}
                    loading={loading}
                    periodosLetivos={filteredSortedPeriodosLetivos}
                    openNewForm={handlePeriodoLetivoNewForm}
                    openEditForm={openPeriodoLetivoEditForm}
                    openFilter={openPeriodoLetivoFilterModal}
                    handleDelete={handlePeriodoLetivoDelete}
                    setContextMenu={setContextMenu}
                    selectOptions={EA_SELECT_OPTIONS}
                    manageSelection={alunoManageSelection}
                    onManageSelectionChange={handleAlunoManageSelectionChange}
                    allowedSubmodulos={allowedAlunoSubmodulos}
                    sortColumn={periodoLetivoSortColumn}
                    sortAsc={periodoLetivoSortAsc}
                    onSortChange={handlePeriodoLetivoSortChange}
                    {...colunasPorIndice('config_colunas_periodo_letivo')}
                    coresStatus={coresStatusPeriodoLetivo}
                  />
                ) : alunoManageSelection === 'alunos' && alunoDetalhe ? (
                  <AlunoDetalheView
                    key={alunoDetalhe.id}
                    abaInicial={alunoDetalheAba}
                    onAbaChange={setAlunoDetalheAba}
                    aluno={alunoDetalhe}
                    nomeAluno={nomePessoaFisicaDoAluno(alunoDetalhe.nr_seq_pessoa_fisica)}
                    selectOptions={EA_SELECT_OPTIONS}
                    manageSelection={alunoManageSelection}
                    onManageSelectionChange={handleAlunoManageSelectionChange}
                    allowedSubmodulos={allowedAlunoSubmodulos}
                    onPrevRecord={() => navegarDetalheDoAluno(-1)}
                    onNextRecord={() => navegarDetalheDoAluno(1)}
                    hasPrevRecord={alunoDetalheIndex > 0}
                    hasNextRecord={alunoDetalheIndex >= 0 && alunoDetalheIndex < filteredSortedAlunos.length - 1}
                    onVoltar={() => { setMessage(""); setAlunoDetalheId(null); }}
                    campoRegras={campoRegrasDaColecao(campoRegrasAtivas, 'aluno_responsavel')}
                    onOpenAudit={openAlunoResponsavelAuditModal}
                    resolverNomeAutor={resolverNomeAutorExibicao}
                    onMessage={setMessage}
                    onSavingChange={setAlunoResponsavelSaving}
                    confirmar={(titulo, mensagem, acao) => setConfirmAcao({ titulo, mensagem, acao })}
                    pessoasFisicas={pessoasFisicas}
                    nomePessoaFisica={nomePessoaFisicaDoAluno}
                    onOpenPessoaFisicaLookup={(aoSelecionar) => {
                      alunoResponsavelLookupCallbackRef.current = aoSelecionar;
                      openAlunoPessoaFisicaLookup('responsavel');
                    }}
                    onViewPessoaFisica={(seq) => openPessoaFisicaView(seq)}
                    grauParentescoOptions={alunoGrauParentescoOptions}
                    colunasResponsaveis={colunasPorChave('config_colunas_aluno_responsavel')}
                    darkMode={darkMode}
                  />
                ) : alunoManageSelection === 'alunos' ? (
                  <AlunoListView
                    filtrosAplicados={cardsAluno}
                    onOpenDetalhe={abrirDetalheDoAluno}
                    message={message}
                    loading={loading}
                    alunos={filteredSortedAlunos}
                    selecionados={alunosSelecionados}
                    onSelecionadosChange={setAlunosSelecionados}
                    openNewForm={handleAlunoNewForm}
                    openEditForm={openAlunoEditForm}
                    openFilter={openAlunoFilterModal}
                    handleDelete={handleAlunoDelete}
                    setContextMenu={setContextMenu}
                    selectOptions={EA_SELECT_OPTIONS}
                    manageSelection={alunoManageSelection}
                    onManageSelectionChange={handleAlunoManageSelectionChange}
                    allowedSubmodulos={allowedAlunoSubmodulos}
                    sortColumn={alunoSortColumn}
                    sortAsc={alunoSortAsc}
                    onSortChange={handleAlunoSortChange}
                    initialColumns={alunoColunasConfig}
                    onColumnsChange={handleAlunoColumnsChange}
                    columnLookups={alunoPessoaFisicaLookups}
                  />
                ) : (
                  <ColaboradorListView
                    filtrosAplicados={cardsColaborador}
                    message={message}
                    loading={loading}
                    colaboradores={filteredSortedColaboradores}
                    selecionados={colaboradoresSelecionados}
                    onSelecionadosChange={setColaboradoresSelecionados}
                    openNewForm={handleColaboradorNewForm}
                    openEditForm={openColaboradorEditForm}
                    openFilter={openColaboradorFilterModal}
                    handleDelete={handleColaboradorDelete}
                    setContextMenu={setContextMenu}
                    selectOptions={EA_SELECT_OPTIONS}
                    manageSelection={alunoManageSelection}
                    onManageSelectionChange={handleAlunoManageSelectionChange}
                    allowedSubmodulos={allowedAlunoSubmodulos}
                    sortColumn={colaboradorSortColumn}
                    sortAsc={colaboradorSortAsc}
                    onSortChange={handleColaboradorSortChange}
                    {...colunasPorIndice('config_colunas_colaborador')}
                    columnLookups={{
                      nr_seq_pessoa_fisica: Object.fromEntries(pessoasFisicas.map((p) => [p.nr_sequencia, p.ds_nome])),
                      nr_seq_pessoa_juridica: Object.fromEntries(pessoasJuridicas.map((p) => [p.nr_sequencia, p.ds_razao_social])),
                    }}
                  />
                )
              ) : activeSection === "patrimonio" ? (
                ativoManageSelection === 'categoria' ? (
                  <CadastroGeralListView
                    filtrosAplicados={cardsCategoria}
                    loading={loading}
                    items={filteredSortedCategorias}
                    columns={CATEGORIA_ATIVO_COLUMNS}
                    formatCellValue={formatCadastroGeralCellValue}
                    emptyMessage='Clique em "Adicionar" para cadastrar uma categoria.'
                    selectOptions={PATRIMONIO_SELECT_OPTIONS.filter((o) => (o.value !== 'manutencoes' || permissoesPatrimonio.acessarManutencao))}
                    manageSelection={ativoManageSelection}
                    onManageSelectionChange={handlePatrimonioManageSelectionChange}
                    allowedSubmodulos={allowedPatrimonioSubmodulos}
                    openNewForm={handleCategoriaNewForm}
                    openEditForm={openCategoriaEditForm}
                    openFilter={openCategoriaFilterModal}
                    setContextMenu={setContextMenu}
                    contextMenuSection="patrimonio"
                    sortColumn={categoriaSortColumn}
                    sortAsc={categoriaSortAsc}
                    onSortChange={handleCategoriaSortChange}
                    {...colunasPorIndice('config_colunas_pat_categoria')}
                  />
                ) : ativoManageSelection === 'manutencoes' ? (
                  <ManutencaoListView
                    filtrosAplicados={cardsManutencao}
                    message={message}
                    loading={loading}
                    manutencoes={filteredSortedManutencoes}
                    selecionados={manutencoesSelecionadas}
                    onSelecionadosChange={setManutencoesSelecionadas}
                    openNewForm={handleManutencaoNewForm}
                    openEditForm={openManutencaoEditForm}
                    handleDelete={handleManutencaoDelete}
                    setContextMenu={setContextMenu}
                    selectOptions={PATRIMONIO_SELECT_OPTIONS.filter((o) => (o.value !== 'manutencoes' || permissoesPatrimonio.acessarManutencao))}
                    manageSelection={ativoManageSelection}
                    onManageSelectionChange={handlePatrimonioManageSelectionChange}
                    openFilter={openManutencaoFilterModal}
                    allowedSubmodulos={allowedPatrimonioSubmodulos}
                    sortColumn={manutencaoSortColumn}
                    sortAsc={manutencaoSortAsc}
                    onSortChange={handleManutencaoSortChange}
                    initialColumns={manutencaoColunasConfig}
                    onColumnsChange={handleManutencaoColumnsChange}
                    columnLookups={{
                      nr_seq_ativo: Object.fromEntries(ativos.map((a) => [a.nr_sequencia, a.ds_ativo ?? `#${a.nr_sequencia}`])),
                      ...Object.fromEntries([
                        ['nr_seq_prestador_servico', Object.fromEntries(
                          colaboradores.map((c) => {
                            const pf = pessoasFisicas.find((p) => p.nr_sequencia === c.nr_seq_pessoa_fisica);
                            const pj = c.nr_seq_pessoa_juridica ? pessoasJuridicas.find((p) => p.nr_sequencia === c.nr_seq_pessoa_juridica) : undefined;
                            const nome = c.nr_seq_pessoa_juridica && pj ? pj.ds_razao_social : (pf?.ds_nome ?? '');
                            return [c.nr_sequencia, nome];
                          })
                        )],
                        ['nr_seq_pessoa_fisica', Object.fromEntries(
                          colaboradores.map((c) => {
                            const pf = pessoasFisicas.find((p) => p.nr_sequencia === c.nr_seq_pessoa_fisica);
                            const pj = c.nr_seq_pessoa_juridica ? pessoasJuridicas.find((p) => p.nr_sequencia === c.nr_seq_pessoa_juridica) : undefined;
                            const nome = c.nr_seq_pessoa_juridica && pj ? pj.ds_razao_social : (pf?.ds_nome ?? '');
                            return [c.nr_sequencia, nome];
                          })
                        )],
                      ]),
                    }}
                    coresStatus={coresStatusManutencao}
                  />
                ) : ativoDetalhe ? (
                  <AtivoDetalheView
                    key={ativoDetalhe.id}
                    abaInicial={ativoDetalheAba}
                    onAbaChange={setAtivoDetalheAba}
                    ativo={ativoDetalhe}
                    selectOptions={PATRIMONIO_SELECT_OPTIONS.filter((o) => (o.value !== 'manutencoes' || permissoesPatrimonio.acessarManutencao))}
                    manageSelection={ativoManageSelection}
                    onManageSelectionChange={handlePatrimonioManageSelectionChange}
                    allowedSubmodulos={allowedPatrimonioSubmodulos}
                    onPrevRecord={() => navegarDetalheDoAtivo(-1)}
                    onNextRecord={() => navegarDetalheDoAtivo(1)}
                    hasPrevRecord={ativoDetalheIndex > 0}
                    hasNextRecord={ativoDetalheIndex >= 0 && ativoDetalheIndex < filteredSortedAtivos.length - 1}
                    onVoltar={fecharDetalheDoAtivo}
                    auditAutor={auditAutor}
                    campoRegras={campoRegrasDaColecao(campoRegrasAtivas, 'pat_ativo_responsavel')}
                    onOpenAudit={openAtivoResponsavelAuditModal}
                    onOpenAuditAtivo={() => openAtivoAuditModal(ativoDetalhe.id)}
                    resolverNomeAutor={resolverNomeAutorExibicao}
                    onMessage={setMessage}
                    onSavingChange={setAtivoResponsavelSaving}
                    confirmar={(titulo, mensagem, acao) => setConfirmAcao({ titulo, mensagem, acao })}
                    colaboradores={colaboradores}
                    nomeColaborador={nomeColaboradorPorSeq}
                    onOpenColaboradorLookup={(aoSelecionar) => {
                      ativoResponsavelLookupCallbackRef.current = aoSelecionar;
                      openEnviarManutPrestadorLookup('ativoResponsavel');
                    }}
                    onViewColaborador={(seq) => openColaboradorView(seq)}
                    manutencoes={manutencoes}
                    nomePrestador={(seq) => {
                      if (!seq) return '';
                      const col = colaboradores.find((c) => c.nr_sequencia === seq);
                      if (!col) return '';
                      const pj = col.nr_seq_pessoa_juridica ? pessoasJuridicas.find((p) => p.nr_sequencia === col.nr_seq_pessoa_juridica) : undefined;
                      return pj ? pj.ds_razao_social ?? '' : pessoasFisicas.find((p) => p.nr_sequencia === col.nr_seq_pessoa_fisica)?.ds_nome ?? '';
                    }}
                    onViewManutencao={(m) => setManutencaoView(m)}
                    coresStatusManutencao={coresStatusManutencao}
                    colunasResponsaveis={colunasPorChave('config_colunas_ativo_responsavel')}
                    colunasManutencoes={colunasPorChave('config_colunas_ativo_manutencao')}
                    localizacoes={localizacoes}
                    colunasTransferencias={colunasPorChave('config_colunas_ativo_transferencia')}
                    darkMode={darkMode}
                  />
                ) : (
                <AtivoListView
                  filtrosAplicados={cardsAtivo}
                  onOpenDetalhe={abrirDetalheDoAtivo}
                  message={message}
                  loading={loading}
                  ativos={filteredSortedAtivos}
                  selecionados={ativosSelecionados}
                  onSelecionadosChange={setAtivosSelecionados}
                  openNewForm={handleAtivoNewForm}
                  openEditForm={openAtivoEditForm}
                  handleDelete={handleAtivoDelete}
                  setContextMenu={setContextMenu}
                  selectOptions={PATRIMONIO_SELECT_OPTIONS.filter((o) => (o.value !== 'manutencoes' || permissoesPatrimonio.acessarManutencao))}
                  manageSelection={ativoManageSelection}
                  onManageSelectionChange={handlePatrimonioManageSelectionChange}
                  openFilter={openAtivoFilterModal}
                  allowedSubmodulos={allowedPatrimonioSubmodulos}
                  sortColumn={ativoSortColumn}
                  sortAsc={ativoSortAsc}
                  onSortChange={handleAtivoSortChange}
                  initialColumns={ativoColunasConfig}
                  onColumnsChange={handleAtivoColumnsChange}
                  columnLookups={{
                    nr_seq_categoria: Object.fromEntries(categoriasAtivos.map((c) => [c.nr_sequencia, c.ds_categoria])),
                    nr_seq_localizacao: Object.fromEntries(localizacoes.map((l) => [l.nr_sequencia, l.ds_localizacao])),
                    nr_seq_marca: Object.fromEntries(marcas.map((m) => [m.nr_sequencia, m.ds_marca])),
                    nr_seq_fornecedor: Object.fromEntries(colaboradores.map((c) => [c.nr_sequencia, nomeColaboradorPorSeq(c.nr_sequencia)])),
                  }}
                  coresStatus={coresStatusAtivo}
                />
                )
              ) : activeSection === "controleCopias" ? (
                ccManageSelection === 'copias' ? (
                  <CopiaListView
                    filtrosAplicados={cardsCopia}
                    key="copias"
                    message={message}
                    loading={loading}
                    copias={filteredSortedCopias}
                    formatCellValue={formatCopiaListaCellValue}
                    coresStatus={coresStatusCopia}
                    handleDelete={handleCopiaDelete}
                    selectOptions={CC_SELECT_OPTIONS}
                    manageSelection={ccManageSelection}
                    onManageSelectionChange={handleCcManageSelectionChange}
                    allowedSubmodulos={allowedCcSubmodulos}
                    openNewForm={handleCopiaNewForm}
                    openEditForm={openCopiaEditForm}
                    openFilter={openCopiaFilterModal}
                    setContextMenu={setContextMenu}
                    sortColumn={copiaSortColumn}
                    sortAsc={copiaSortAsc}
                    onSortChange={handleCopiaSortChange}
                    {...colunasPorIndice('config_colunas_copia')}
                  />
                ) : (
                  <div className="flex-1 flex flex-col min-h-0 space-y-6">
                    <div className="flex min-h-[42px] items-center gap-2">
                      <Select
                        value={ccManageSelection}
                        onChange={handleCcManageSelectionChange}
                        options={CC_SELECT_OPTIONS.filter((o) => allowedCcSubmodulos.includes(o.value))}
                        showPlaceholder={!ccManageSelection}
                        className="!w-[180px]"
                      />
                    </div>
                    <div className="bg-white flex-1 flex flex-col min-h-0 overflow-hidden">
                      <EmptySelectionMessage />
                    </div>
                  </div>
                )
              ) : activeSection === "logs" ? (
                logsManageSelection === 'exclusoes' ? (
                  renderExclusoes()
                ) : logsManageSelection === 'acessos' ? (
                  <AcessosView
                    manageSelection={logsManageSelection}
                    onManageSelectionChange={handleLogsManageSelectionChange}
                    allowedSubmodulos={allowedLogsSubmodulos}
                    filtro={acessosFiltro}
                    onFiltroChange={setAcessosFiltro}
                    onSalvarFiltro={(filtro) => salvarFiltroDaTela('logs_acessos', { form: filtro }, () => setAcessosFiltro(filtro))}
                    onMessage={setMessage}
                    colunas={colunasPorChave('config_colunas_logs_acessos')}
                    nomePessoaFisica={(nr) => pessoasFisicas.find((p) => p.nr_sequencia === nr)?.ds_nome ?? ''}
                    onOpenPessoaFisicaLookup={(aoSelecionar) => {
                      // Mesmo lookup da aba Responsáveis: devolve a sequência pelo retorno.
                      alunoResponsavelLookupCallbackRef.current = aoSelecionar;
                      openAlunoPessoaFisicaLookup('responsavel');
                    }}
                  />
                ) : (
                  <LogsSemSelecaoView
                    manageSelection={logsManageSelection}
                    onManageSelectionChange={handleLogsManageSelectionChange}
                    allowedSubmodulos={allowedLogsSubmodulos}
                  />
                )
              ) : activeSection === "relatorio" ? (
                relatorioManageSelection === 'importarRelatorio' ? (
                  <ImportacaoRelatorioView
                    manageSelection={relatorioManageSelection}
                    onManageSelectionChange={handleRelatorioManageSelectionChange}
                    selectOptions={RELATORIO_SELECT_OPTIONS.filter((o) => allowedRelatorioSubmodulos.includes(o.value))}
                    // Importar cria bandas, elementos e parâmetros: também pede a permissão de configurar bandas.
                    podeImportar={permissoesRelatorio.importar && permissoesRelatorio.bandas}
                    podeExcluir={permissoesRelatorio.importar}
                    onMensagem={setMessage}
                    onImportado={() => { void loadRelatorios(); }}
                    onOpenAudit={podeVerAuditoria ? openImportacaoRelatorioAuditModal : undefined}
                    resolverNomeAutor={resolverNomeAutorExibicao}
                    onConfirmarExclusao={(mensagem, acao) => {
                      setConfirmDeleteMessage(mensagem);
                      setConfirmDeleteType('');
                      setConfirmDeleteAction(() => acao);
                      setConfirmDeleteOpen(true);
                    }}
                    darkMode={darkMode}
                  />
                ) : relatorioView === 'builder' ? (
                  <div className="flex flex-col h-full">
                    <RelatorioBuilder
                      key={`rel-${relatorioEditingId ?? 'new'}-${relatorioBandasMode ? 'bandas' : 'form'}`}
                      relatorio={relatorioForm}
                      viewMode={relatorioBandasMode ? 'bandas' : 'form'}
                      onSave={handleRelatorioSave}
                      onCancel={closeRelatorioBuilder}
                      saving={relatorioSubmitting}
                      manageSelection={relatorioManageSelection}
                      onManageSelectionChange={handleRelatorioManageSelectionChange}
                      allowedSubmodulos={allowedRelatorioSubmodulos}
                      resolverNomeAutorExibicao={resolverNomeAutorExibicao}
                      onToast={mostrarToast}
                      contextMenuItems={relatorioEditingId ? [
                        ...(permissoesRelatorio.gerar && relatorioForm?.ie_status !== 'I' ? [{ label: 'Gerar relatório', onClick: () => { if (relatorioForm) void handleRelatorioGerar(relatorioForm); } }] : []),
                        ...(permissoesRelatorio.duplicar ? [{ label: 'Duplicar', onClick: () => { if (relatorioForm) handleRelatorioDuplicate(relatorioForm); } }] : []),
                        ...(permissoesRelatorio.bandas ? [{ label: 'Exportar relatório', onClick: () => { if (relatorioForm) void handleRelatorioExportar(relatorioForm); } }] : []),
                        ...(permissoesRelatorio.editar && relatorioForm?.ie_origem !== 'Q' ? [{ label: relatorioForm?.ie_status === 'I' ? 'Ativar' : 'Inativar', onClick: () => { if (relatorioForm) void handleRelatorioStatus(relatorioForm); } }] : []),
                        ...(permissoesRelatorio.excluir && relatorioForm?.ie_origem !== 'Q' ? [{ label: 'Excluir', onClick: () => { if (relatorioEditingId) handleRelatorioDelete(relatorioEditingId); } }] : []),
                      ] : []}
                      onPrevRecord={goToPrevRelatorioRecord}
                      onNextRecord={goToNextRelatorioRecord}
                      hasPrevRecord={hasPrevRelatorioRecord}
                      hasNextRecord={hasNextRelatorioRecord}
                      createdAt={relatorioAuditInfo.createdAt}
                      updatedAt={relatorioAuditInfo.updatedAt}
                      createdBy={relatorioAuditInfo.createdBy}
                      updatedBy={relatorioAuditInfo.updatedBy}
                      onOpenAudit={(rid) => openRelatorioAuditModal(rid, null, 'relatorio')}
                      onOpenBandaAudit={(rid, bid) => openRelatorioAuditModal(rid, bid, 'relatorio_banda')}
                      onOpenFiltroAudit={(rid, fid) => openRelatorioAuditModal(rid, fid, 'relatorio_parametro')}
                      onOpenElementoAudit={(rid, eid) => openRelatorioAuditModal(rid, eid, 'relatorio_banda_elemento')}
                      darkMode={darkMode}
                      campoRegras={campoRegrasDaColecao(campoRegrasAtivas, 'relatorio')}
                      bandaCampoRegras={campoRegrasDaColecao(campoRegrasAtivas, 'relatorio_banda')}
                      elementoCampoRegras={campoRegrasDaColecao(campoRegrasAtivas, 'relatorio_banda_elemento')}
                      parametroCampoRegras={campoRegrasDaColecao(campoRegrasAtivas, 'relatorio_parametro')}
                      onNavigateToList={closeRelatorioBuilder}
                      onConfirmarExclusao={(mensagem, acao) => {
                        setConfirmDeleteMessage(mensagem);
                        setConfirmDeleteType('');
                        setConfirmDeleteAction(() => acao);
                        setConfirmDeleteOpen(true);
                      }}
                      colunasBandas={{ initialColumns: relatorioBandasColunasConfig, onColumnsChange: handleRelatorioBandasColumnsChange }}
                      colunasParametros={{ initialColumns: relatorioFiltrosColunasConfig, onColumnsChange: handleRelatorioFiltrosColumnsChange }}
                      opcoesFormatoPapel={opcoesDeReferencia(formatosPapel, (f) => f.ds_formato_papel, relatorioForm?.nr_seq_formato_papel != null ? String(relatorioForm.nr_seq_formato_papel) : '')}
                      opcoesImagem={opcoesDeReferencia(imagens, (i) => i.ds_imagem, '')}
                    />
                  </div>
                ) : (
                  <RelatorioListView
                    loading={loading}
                    relatorios={filteredSortedRelatorios}
                    openNewForm={handleRelatorioNewForm}
                    openEditForm={openRelatorioEditForm}
                    openBandas={handleRelatorioBandasDaLista}
                    handleDelete={handleRelatorioDelete}
                    setContextMenu={setContextMenu}
                    sortColumn={relatorioSortColumn}
                    sortAsc={relatorioSortAsc}
                    onSortChange={handleRelatorioSortChange}
                    manageSelection={relatorioManageSelection}
                    onManageSelectionChange={handleRelatorioManageSelectionChange}
                    allowedSubmodulos={allowedRelatorioSubmodulos}
                    userId={currentUser?.id}
                    initialColumns={relatorioColunasConfig}
                    openFilter={openRelatorioFilterModal}
                    filtrosAplicados={cardsRelatorio}
                    onColumnsChange={handleRelatorioColumnsChange}
                    selectedRecordId={lastRelatorioEditingIdRef.current}
                  />
                )
              ) : (
                <CadastroGeralListView
                  filtrosAplicados={cardsCg}
                  key={cgManageSelection}
                  loading={loading}
                  items={filteredSortedCgItems}
                  columns={cgColumns}
                  formatCellValue={formatCadastroGeralCellValue}
                  emptyMessage={cgEmptyMessage}
                  selectOptions={CG_SELECT_OPTIONS}
                  manageSelection={cgManageSelection}
                  onManageSelectionChange={handleCgManageSelectionChange}
                  allowedSubmodulos={allowedCgSubmodulos}
                  openNewForm={handleCgNewForm}
                  openEditForm={openCgEditForm}
                  openFilter={openCgFilterModal}
                  setContextMenu={setContextMenu}
                  sortColumn={cgSortColumn}
                  sortAsc={cgSortAsc}
                  onSortChange={handleCgSortChange}
                  initialColumns={cgColunasConfig}
                  onColumnsChange={handleCgColumnsChange}
                />
              )
            ) : activeSection === "pessoaFisica" ? (
              pjManageSelection === 'pessoasJuridicas' ? (
                <PessoaJuridicaFormView
                  message={message}
                  editingId={pjEditingId}
                  sequence={pjEditingId ? (pessoasJuridicas.find((a) => a.id === pjEditingId)?.nr_sequencia ?? null) : null}
                  form={pjForm}
                  setForm={setPjForm}
                  submitting={pjSubmitting}
                  handleSubmit={handlePjSubmit}
                  onSalvarEAdicionar={() => { void salvarEAdicionar(handlePjSubmit, handlePjNewForm); }}
                  goToList={goToPjList}
                  createdAt={pjAuditInfo.createdAt}
                  updatedAt={pjAuditInfo.updatedAt}
                  createdBy={resolverNomeAutorExibicao(pjAuditInfo.createdBy)}
                  updatedBy={resolverNomeAutorExibicao(pjAuditInfo.updatedBy)}
                  onOpenAudit={openPjAuditModal}
                  onPrevRecord={goToPrevPjRecord}
                  onNextRecord={goToNextPjRecord}
                  hasPrevRecord={hasPrevPjRecord}
                  hasNextRecord={hasNextPjRecord}
                  cidadeNome={pjCidadeNome}
                  onOpenCidadeLookup={openPjCidadeLookup}
                  onCidadeCodeChange={handlePjCidadeCodeChange}
                  logradouros={pfCgOptions.logradouros}
                  estados={estados}
                  selectOptions={PJ_SELECT_OPTIONS}
                  manageSelection={pjManageSelection}
                  onManageSelectionChange={handlePjManageSelectionChange}
                  allowedSubmodulos={allowedPessoaSubmodulos}
                  campoRegras={campoRegrasDaColecao(campoRegrasAtivas, 'pessoa_juridica')}
                  campoErros={pjCampoErros}
                />
              ) : (
                <PessoaFisicaFormView
                  message={message}
                  editingId={editingId}
                  sequence={editingId ? (pessoasFisicas.find((a) => a.id === editingId)?.nr_sequencia ?? null) : null}
                  form={form}
                  setForm={setForm}
                  submitting={submitting}
                  handleSubmit={handleSubmit}
                  onSalvarEAdicionar={() => { void salvarEAdicionar(handleSubmit, handlePessoaNewForm); }}
                  goToList={goToList}
                  createdAt={auditInfo.createdAt}
                  updatedAt={auditInfo.updatedAt}
                  createdBy={resolverNomeAutorExibicao(auditInfo.createdBy)}
                  updatedBy={resolverNomeAutorExibicao(auditInfo.updatedBy)}
                  onOpenAudit={openAuditModal}
                  onPrevRecord={goToPrevRecord}
                  onNextRecord={goToNextRecord}
                  hasPrevRecord={hasPrevRecord}
                  hasNextRecord={hasNextRecord}
                  sexos={pfCgOptions.sexos}
                  estadoCivis={pfCgOptions.estadoCivis}
                  coresRacas={pfCgOptions.coresRacas}
                  profissoes={pfCgOptions.profissoes}
                  orgaosEmissores={pfCgOptions.orgaosEmissores}
                  logradouros={pfCgOptions.logradouros}
                  estados={estados}
                  naturalidadeNome={naturalidadeNome}
                  onOpenNaturalidadeLookup={openNaturalidadeLookup}
                  onNaturalidadeCodeChange={handleNaturalidadeCodeChange}
                  selectOptions={PJ_SELECT_OPTIONS}
                  manageSelection={pjManageSelection}
                  onManageSelectionChange={handlePjManageSelectionChange}
                  allowedSubmodulos={allowedPessoaSubmodulos}
                  campoRegras={campoRegrasDaColecao(campoRegrasAtivas, 'pessoa_fisica')}
                  campoErros={pfCampoErros}
                />
              )
            ) : activeSection === "administracaoSistema" ? (
              adminManageSelection === 'avisos' ? (
                <AvisosView
                  colunas={colunasPorChave('config_colunas_avisos')}
                  paineis={paineisPorChave('config_paineis_avisos')}
                  manageSelection={adminManageSelection}
                  onManageSelectionChange={handleAdminManageSelectionChange}
                  allowedSubmodulos={allowedAdminSubmodulos}
                  auditAutor={auditAutor}
                  resolverNomeAutorExibicao={resolverNomeAutorExibicao}
                  onOpenAudit={openAvisoAuditModal}
                  onSaveSuccess={(msg) => setMessage(msg)}
                  onSavingChange={setParametrosSaving}
                />
              ) : adminManageSelection === 'parametros' ? (
                <ParametrosDaFuncaoView key={`parametros-${parametrosFuncaoInicial.vez}`} funcaoInicial={parametrosFuncaoInicial.funcao} colunas={colunasPorChave('config_colunas_parametros_funcao_as')} paineis={paineisPorChave('config_paineis_parametros_funcao_as')}
                  opcoesValorPadrao={opcoesValorPadraoCopia}
                  onAfterSave={aposSalvarParametro}
                  manageSelection={adminManageSelection}
                  onManageSelectionChange={handleAdminManageSelectionChange}
                  selectOptions={ADMIN_OPCOES_DROPDOWN}
                  allowedSubmodulos={allowedAdminSubmodulos}
                  onSaveSuccess={(msg) => setMessage(msg)}
                  onSavingChange={setParametrosSaving}
                  onOpenAudit={openParametroAuditModal}
                  resolverNomeAutor={resolverNomeAutorExibicao}
                  auditAutor={auditAutor}
                />
              ) : adminManageSelection === 'regras' ? (
                <RegrasView
                  colunas={colunasPorChave('config_colunas_regras')}
                  paineis={paineisPorChave('config_paineis_regras')}
                  manageSelection={adminManageSelection}
                  onManageSelectionChange={handleAdminManageSelectionChange}
                  allowedSubmodulos={allowedAdminSubmodulos}
                  auditAutor={auditAutor}
                  resolverNomeAutorExibicao={resolverNomeAutorExibicao}
                  onOpenAudit={openRegraAuditModal}
                  onSaveSuccess={(msg) => setMessage(msg)}
                  onSavingChange={setParametrosSaving}
                  onRegraSalva={setRegraSistema}
                />
              ) : (adminManageSelection === 'camposFormularios' || adminManageSelection === 'camposModais') ? (
                  <CamposView key={adminManageSelection} modo={adminManageSelection === 'camposModais' ? 'modais' : 'formularios'} {...(adminManageSelection === 'camposModais'
                    ? { paineis: paineisPorChave('config_paineis_campos_modais'), colunasPerfil: colunasPorChave('config_colunas_campos_modais_perfil'), colunasFuncao: colunasPorChave('config_colunas_campos_modais_funcao'), colunasCampos: colunasPorChave('config_colunas_campos_modais_campo') }
                    : { paineis: paineisPorChave('config_paineis_campos'), colunasPerfil: colunasPorChave('config_colunas_campos_perfil'), colunasFuncao: colunasPorChave('config_colunas_campos_funcao'), colunasCampos: colunasPorChave('config_colunas_campos_campo') })}
                    perfis={perfis}
                    onChangeStatus={handleCamposStatusChange}
                    onOpenAuditCampo={openCampoAuditModal}
                    manageSelection={adminManageSelection}
                    onManageSelectionChange={handleAdminManageSelectionChange}
                    allowedSubmodulos={allowedAdminSubmodulos}
                    podeAlterarStatusCampo={(adminManageSelection === 'camposModais' ? permissoesAdmin.alterarStatusCampoModal : permissoesAdmin.alterarStatusCampoFormulario) && !isAdministradorPerfil(perfis.find((p) => p.id === camposPerfilId))}
                    selectedPerfilId={camposPerfilId}
                    onSelectedPerfilIdChange={setCamposPerfilId}
                    selectedFuncao={camposFuncao}
                    onSelectedFuncaoChange={setCamposFuncao}
                    funcaoJaSelecionada={camposFuncaoJaSelecionada}
                    onFuncaoJaSelecionadaChange={setCamposFuncaoJaSelecionada}
                  />
                ) : adminManageSelection === 'usuarios' ? (
                  <AdministracaoSistemaFormView
                  message={message}
                  editingId={adminEditingId}
                  sequence={adminEditingId ? (usuarios.find((a) => a.id === adminEditingId)?.nr_sequencia ?? null) : null}
                  form={adminForm}
                  setForm={setAdminForm}
                  submitting={adminSubmitting}
                  handleSubmit={handleAdminSubmit}
                  onSalvarEAdicionar={() => { void salvarEAdicionar(handleAdminSubmit, handleAdminNewForm); }}
                  goToList={goToAdminList}
                  createdAt={adminAuditInfo.createdAt}
                  updatedAt={adminAuditInfo.updatedAt}
                  createdBy={resolverNomeAutorExibicao(adminAuditInfo.createdBy)}
                  updatedBy={resolverNomeAutorExibicao(adminAuditInfo.updatedBy)}
                  onPrevRecord={goToPrevAdminRecord}
                  onNextRecord={goToNextAdminRecord}
                  hasPrevRecord={hasPrevAdminRecord}
                  hasNextRecord={hasNextAdminRecord}
                  pessoaFisicaName={selectedPessoaFisicaName}
                  onOpenPessoaFisicaLookup={openPessoaFisicaLookup}
                  onViewPessoaFisica={(seq) => openPessoaFisicaView(seq)}
                  onOpenAudit={openAdminAuditModal}
                  manageSelection={adminManageSelection}
                  onManageSelectionChange={handleAdminManageSelectionChange}
                  allowedSubmodulos={allowedAdminSubmodulos}
                  readOnly={adminEditingId ? isAdministradorUsuario(usuarios.find((a) => a.id === adminEditingId)) : false}
                  campoRegras={campoRegrasDaColecao(campoRegrasAtivas, 'usuario')}
                  campoErros={adminCampoErros}
                />
              ) : adminManageSelection === 'imagens' ? (
                <ImagemFormView
                  campoRegras={campoRegrasDaColecao(campoRegrasAtivas, 'imagem')}
                  campoErros={imagemCampoErros}
                  message={message}
                  editingId={imagemEditingId}
                  imagem={imagemForm}
                  setImagem={setImagemForm as any}
                  submitting={imagemSubmitting}
                  handleSubmit={handleImagemSubmit}
                  onSalvarEAdicionar={() => { void salvarEAdicionar(handleImagemSubmit, handleImagemNewForm); }}
                  goToList={() => { setView('list'); }}
                  createdAt={imagemAuditInfo.createdAt}
                  updatedAt={imagemAuditInfo.updatedAt}
                  createdBy={resolverNomeAutorExibicao(imagemAuditInfo.createdBy)}
                  updatedBy={resolverNomeAutorExibicao(imagemAuditInfo.updatedBy)}
                  onPrevRecord={goToPrevImagemRecord}
                  onNextRecord={goToNextImagemRecord}
                  hasPrevRecord={hasPrevImagemRecord}
                  hasNextRecord={hasNextImagemRecord}
                  onOpenAudit={openImagemAuditModal}
                  manageSelection={adminManageSelection}
                  onManageSelectionChange={handleAdminManageSelectionChange}
                  allowedSubmodulos={allowedAdminSubmodulos}
                />
              ) : (
                <PerfilFormView
                  message={message}
                  editingId={perfilEditingId}
                  sequence={perfilEditingId ? (perfis.find((a) => a.id === perfilEditingId)?.nr_sequencia ?? null) : null}
                  form={perfilForm}
                  setForm={setPerfilForm}
                  submitting={perfilSubmitting}
                  handleSubmit={handlePerfilSubmit}
                  onSalvarEAdicionar={() => { void salvarEAdicionar(handlePerfilSubmit, handlePerfilNewForm); }}
                  goToList={goToPerfilList}
                  createdAt={perfilAuditInfo.createdAt}
                  updatedAt={perfilAuditInfo.updatedAt}
                  createdBy={resolverNomeAutorExibicao(perfilAuditInfo.createdBy)}
                  updatedBy={resolverNomeAutorExibicao(perfilAuditInfo.updatedBy)}
                  onPrevRecord={goToPrevPerfilRecord}
                  onNextRecord={goToNextPerfilRecord}
                  hasPrevRecord={hasPrevPerfilRecord}
                  hasNextRecord={hasNextPerfilRecord}
                  onOpenAudit={openPerfilAuditModal}
                  manageSelection={adminManageSelection}
                  onManageSelectionChange={handleAdminManageSelectionChange}
                  allowedSubmodulos={allowedAdminSubmodulos}
                  readOnly={perfilEditingId ? isAdministradorPerfil(perfis.find((a) => a.id === perfilEditingId)) : false}
                  campoRegras={campoRegrasDaColecao(campoRegrasAtivas, 'perfil')}
                  campoErros={perfilCampoErros}
                />
              )            ) : activeSection === "estruturaAcademica" ? (
                alunoManageSelection === 'cursos' ? (
                  <CadastroGeralFormView
                    editingId={cursoEditingId}
                    sequence={cursoEditingId ? (cursos.find((c) => c.id === cursoEditingId)?.nr_sequencia ?? null) : null}
                    form={cursoForm}
                    setForm={setCursoForm}
                    submitting={cursoSubmitting}
                    handleSubmit={handleCursoSubmit}
                    onSalvarEAdicionar={() => { void salvarEAdicionar(handleCursoSubmit, handleCursoNewForm); }}
                    goToList={goToCursoList}
                    createdAt={cursoAuditInfo.createdAt}
                    updatedAt={cursoAuditInfo.updatedAt}
                    createdBy={resolverNomeAutorExibicao(cursoAuditInfo.createdBy)}
                    updatedBy={resolverNomeAutorExibicao(cursoAuditInfo.updatedBy)}
                    onPrevRecord={goToPrevCursoRecord}
                    onNextRecord={goToNextCursoRecord}
                    hasPrevRecord={hasPrevCursoRecord}
                    hasNextRecord={hasNextCursoRecord}
                    onOpenAudit={openCursoAuditModal}
                    manageSelection={alunoManageSelection}
                    onManageSelectionChange={handleAlunoManageSelectionChange}
                    allowedSubmodulos={allowedAlunoSubmodulos}
                    selectOptions={EA_SELECT_OPTIONS}
                    fieldInfos={CURSO_FIELD_INFOS}
                    descFieldKey="ds_curso"
                    collectionName="curso"
                    showObservacao
                    campoRegras={campoRegrasDaColecao(campoRegrasAtivas, 'curso')}
                    campoErros={cursoCampoErros}
                  />
                ) : alunoManageSelection === 'disciplinas' ? (
                  <CadastroGeralFormView
                    editingId={disciplinaEditingId}
                    sequence={disciplinaEditingId ? (disciplinas.find((c) => c.id === disciplinaEditingId)?.nr_sequencia ?? null) : null}
                    form={disciplinaForm}
                    setForm={setDisciplinaForm}
                    submitting={disciplinaSubmitting}
                    handleSubmit={handleDisciplinaSubmit}
                    onSalvarEAdicionar={() => { void salvarEAdicionar(handleDisciplinaSubmit, handleDisciplinaNewForm); }}
                    goToList={goToDisciplinaList}
                    createdAt={disciplinaAuditInfo.createdAt}
                    updatedAt={disciplinaAuditInfo.updatedAt}
                    createdBy={resolverNomeAutorExibicao(disciplinaAuditInfo.createdBy)}
                    updatedBy={resolverNomeAutorExibicao(disciplinaAuditInfo.updatedBy)}
                    onPrevRecord={goToPrevDisciplinaRecord}
                    onNextRecord={goToNextDisciplinaRecord}
                    hasPrevRecord={hasPrevDisciplinaRecord}
                    hasNextRecord={hasNextDisciplinaRecord}
                    onOpenAudit={openDisciplinaAuditModal}
                    manageSelection={alunoManageSelection}
                    onManageSelectionChange={handleAlunoManageSelectionChange}
                    allowedSubmodulos={allowedAlunoSubmodulos}
                    selectOptions={EA_SELECT_OPTIONS}
                    fieldInfos={DISCIPLINA_FIELD_INFOS}
                    descFieldKey="ds_disciplina"
                    collectionName="disciplina"
                    showObservacao
                    hideStatus
                    campoRegras={campoRegrasDaColecao(campoRegrasAtivas, 'disciplina')}
                    campoErros={disciplinaCampoErros}
                  />
                ) : alunoManageSelection === 'turmas' ? (
                  <CadastroGeralFormView
                    editingId={turmaEditingId}
                    sequence={turmaEditingId ? (turmas.find((c) => c.id === turmaEditingId)?.nr_sequencia ?? null) : null}
                    form={turmaForm}
                    setForm={setTurmaForm}
                    submitting={turmaSubmitting}
                    handleSubmit={handleTurmaSubmit}
                    onSalvarEAdicionar={() => { void salvarEAdicionar(handleTurmaSubmit, handleTurmaNewForm); }}
                    goToList={goToTurmaList}
                    createdAt={turmaAuditInfo.createdAt}
                    updatedAt={turmaAuditInfo.updatedAt}
                    createdBy={resolverNomeAutorExibicao(turmaAuditInfo.createdBy)}
                    updatedBy={resolverNomeAutorExibicao(turmaAuditInfo.updatedBy)}
                    onPrevRecord={goToPrevTurmaRecord}
                    onNextRecord={goToNextTurmaRecord}
                    hasPrevRecord={hasPrevTurmaRecord}
                    hasNextRecord={hasNextTurmaRecord}
                    onOpenAudit={openTurmaAuditModal}
                    manageSelection={alunoManageSelection}
                    onManageSelectionChange={handleAlunoManageSelectionChange}
                    allowedSubmodulos={allowedAlunoSubmodulos}
                    selectOptions={EA_SELECT_OPTIONS}
                    fieldInfos={TURMA_FIELD_INFOS}
                    descFieldKey="ds_turma"
                    collectionName="turma"
                    hideStatus
                    extraFields={({ renderFieldLabel, statusDe, inputClass }) => {
                      const selectTurma = (campo: keyof TurmaCamposForm, rotulo: string, opcoes: { value: string; label: string }[], colunas: string) => (
                        <div className={`${colunas} group`}>
                          {renderFieldLabel(campo, rotulo)}
                          <Select
                            value={turmaExtra[campo]}
                            onChange={(v) => setTurmaExtra((t) => ({ ...t, [campo]: v }))}
                            options={opcoes}
                            disabled={statusDe(campo) === 'D'}
                            error={turmaCampoErros.includes(campo)}
                          />
                        </div>
                      );
                      // Código + descrição (somente leitura) + botão de localizar, como nos demais lookups.
                      const lookupTurma = (campo: TurmaCampoLookup, rotulo: string, colunas: string) => (
                        <CampoLookupReferencia
                          className={colunas}
                          rotulo={renderFieldLabel(campo, rotulo)}
                          ariaLocalizar={`Localizar ${rotulo.toLowerCase()}`}
                          inputClass={inputClass(campo)}
                          valor={turmaExtra[campo]}
                          descricao={descricaoReferenciaTurma(campo, turmaExtra[campo])}
                          desabilitado={statusDe(campo) === 'D'}
                          onChange={(valor) => setTurmaExtra((t) => ({ ...t, [campo]: valor }))}
                          onLocalizar={() => setTurmaLookupCampo(campo)}
                        />
                      );
                      return (
                        <>
                          {lookupTurma('nr_seq_curso', 'Curso', 'sm:col-span-6')}
                          {lookupTurma('nr_seq_periodo_letivo', 'Período letivo', 'sm:col-span-6')}
                          <div className="sm:col-span-2 group">
                            {renderFieldLabel('qt_max_alunos', 'Máximo de alunos')}
                            <input
                              inputMode="numeric"
                              maxLength={5}
                              disabled={statusDe('qt_max_alunos') === 'D'}
                              className={`${inputClass('qt_max_alunos')} disabled:cursor-default disabled:bg-slate-100 disabled:text-slate-500`}
                              value={turmaExtra.qt_max_alunos}
                              onChange={(e) => setTurmaExtra((t) => ({ ...t, qt_max_alunos: e.target.value.replace(/[^0-9]/g, '') }))}
                            />
                          </div>
                          {lookupTurma('nr_seq_localizacao', 'Localização', 'sm:col-span-5')}
                          {selectTurma('nr_seq_modalidade_ensino', 'Modalidade de ensino', opcoesDeReferencia(modalidadesEnsino, (m) => m.ds_modalidade_ensino, turmaExtra.nr_seq_modalidade_ensino), 'sm:col-span-5')}
                        </>
                      );
                    }}
                    campoRegras={campoRegrasDaColecao(campoRegrasAtivas, 'turma')}
                    campoErros={turmaCampoErros}
                  />
                ) : alunoManageSelection === 'turmasDisciplinas' ? (
                  <CadastroGeralFormView
                    editingId={turmaDisciplinaEditingId}
                    sequence={turmaDisciplinaEditingId ? (turmasDisciplinas.find((td) => td.id === turmaDisciplinaEditingId)?.nr_sequencia ?? null) : null}
                    form={turmaDisciplinaForm}
                    setForm={setTurmaDisciplinaForm}
                    submitting={turmaDisciplinaSubmitting}
                    handleSubmit={handleTurmaDisciplinaSubmit}
                    onSalvarEAdicionar={() => { void salvarEAdicionar(handleTurmaDisciplinaSubmit, handleTurmaDisciplinaNewForm); }}
                    goToList={goToTurmaDisciplinaList}
                    createdAt={turmaDisciplinaAuditInfo.createdAt}
                    updatedAt={turmaDisciplinaAuditInfo.updatedAt}
                    createdBy={resolverNomeAutorExibicao(turmaDisciplinaAuditInfo.createdBy)}
                    updatedBy={resolverNomeAutorExibicao(turmaDisciplinaAuditInfo.updatedBy)}
                    onPrevRecord={goToPrevTurmaDisciplinaRecord}
                    onNextRecord={goToNextTurmaDisciplinaRecord}
                    hasPrevRecord={hasPrevTurmaDisciplinaRecord}
                    hasNextRecord={hasNextTurmaDisciplinaRecord}
                    onOpenAudit={openTurmaDisciplinaAuditModal}
                    manageSelection={alunoManageSelection}
                    onManageSelectionChange={handleAlunoManageSelectionChange}
                    allowedSubmodulos={allowedAlunoSubmodulos}
                    selectOptions={EA_SELECT_OPTIONS}
                    fieldInfos={TURMA_DISCIPLINA_FIELD_INFOS}
                    descFieldKey="nr_seq_turma"
                    collectionName="turma_disciplina"
                    hideDescricao
                    extraFields={({ renderFieldLabel, statusDe, inputClass }) => {
                      const lookup = (campo: 'nr_seq_turma' | 'nr_seq_disciplina', rotulo: string, colunas: string) => (
                        <CampoLookupReferencia
                          className={colunas}
                          rotulo={renderFieldLabel(campo, rotulo)}
                          ariaLocalizar={`Localizar ${rotulo.toLowerCase()}`}
                          inputClass={inputClass(campo)}
                          valor={turmaDisciplinaExtra[campo]}
                          descricao={descricaoReferenciaTurmaDisciplina(campo, turmaDisciplinaExtra[campo])}
                          desabilitado={statusDe(campo) === 'D'}
                          onChange={(valor) => setTurmaDisciplinaExtra((t) => ({ ...t, [campo]: valor }))}
                          onLocalizar={() => setTurmaDisciplinaLookupCampo(campo)}
                        />
                      );
                      // Período letivo, Curso e Modalidade de ensino: da turma informada, só para exibição.
                      const daTurma = camposDaTurmaDisciplina(turmaDisciplinaExtra.nr_seq_turma);
                      return (
                        <>
                          {lookup('nr_seq_turma', 'Turma', 'sm:col-span-6')}
                          {lookup('nr_seq_disciplina', 'Disciplina', 'sm:col-span-5')}
                          {TURMA_DISCIPLINA_CAMPOS_DA_TURMA.map(([campo, rotulo], i) => (
                            <div key={campo} className={`sm:col-span-4 ${i === 0 ? 'sm:col-start-1' : ''}`}>
                              {renderFieldLabel(campo, rotulo)}
                              <input
                                disabled
                                readOnly
                                tabIndex={-1}
                                className={`${inputClass(campo)} disabled:cursor-default disabled:bg-slate-100 disabled:text-slate-500`}
                                value={descricaoReferenciaTurmaDisciplina(campo, daTurma[campo])}
                              />
                            </div>
                          ))}
                        </>
                      );
                    }}
                    campoRegras={campoRegrasDaColecao(campoRegrasAtivas, 'turma_disciplina')}
                    campoErros={turmaDisciplinaCampoErros}
                  />
                ) : alunoManageSelection === 'periodoLetivo' ? (
                  <PeriodoLetivoFormView
                    message={message}
                    editingId={periodoLetivoEditingId}
                    sequence={periodoLetivoEditingId ? (periodosLetivos.find((p) => p.id === periodoLetivoEditingId)?.nr_sequencia ?? null) : null}
                    form={periodoLetivoForm}
                    setForm={setPeriodoLetivoForm}
                    submitting={periodoLetivoSubmitting}
                    handleSubmit={handlePeriodoLetivoSubmit}
                    onSalvarEAdicionar={() => { void salvarEAdicionar(handlePeriodoLetivoSubmit, handlePeriodoLetivoNewForm); }}
                    goToList={goToPeriodoLetivoList}
                    createdAt={periodoLetivoAuditInfo.createdAt}
                    updatedAt={periodoLetivoAuditInfo.updatedAt}
                    createdBy={resolverNomeAutorExibicao(periodoLetivoAuditInfo.createdBy)}
                    updatedBy={resolverNomeAutorExibicao(periodoLetivoAuditInfo.updatedBy)}
                    onOpenAudit={openPeriodoLetivoAuditModal}
                    onPrevRecord={goToPrevPeriodoLetivoRecord}
                    onNextRecord={goToNextPeriodoLetivoRecord}
                    hasPrevRecord={hasPrevPeriodoLetivoRecord}
                    hasNextRecord={hasNextPeriodoLetivoRecord}
                    selectOptions={EA_SELECT_OPTIONS}
                    manageSelection={alunoManageSelection}
                    onManageSelectionChange={handleAlunoManageSelectionChange}
                    allowedSubmodulos={allowedAlunoSubmodulos}
                    campoRegras={campoRegrasDaColecao(campoRegrasAtivas, 'periodo_letivo')}
                    campoErros={periodoLetivoCampoErros}
                  />
                ) : alunoManageSelection === 'alunos' ? (
                  <AlunoFormView
                    message={message}
                    editingId={alunoEditingId}
                    sequence={alunoEditingId ? (alunos.find((a) => a.id === alunoEditingId)?.nr_sequencia ?? null) : null}
                    form={alunoForm}
                    setForm={setAlunoForm}
                    submitting={alunoSubmitting}
                    handleSubmit={handleAlunoSubmit}
                    onSalvarEAdicionar={() => { void salvarEAdicionar(handleAlunoSubmit, handleAlunoNewForm); }}
                    goToList={goToAlunoList}
                    createdAt={alunoAuditInfo.createdAt}
                    updatedAt={alunoAuditInfo.updatedAt}
                    createdBy={resolverNomeAutorExibicao(alunoAuditInfo.createdBy)}
                    updatedBy={resolverNomeAutorExibicao(alunoAuditInfo.updatedBy)}
                    onOpenAudit={openAlunoAuditModal}
                    onPrevRecord={goToPrevAlunoRecord}
                    onNextRecord={goToNextAlunoRecord}
                    hasPrevRecord={hasPrevAlunoRecord}
                    hasNextRecord={hasNextAlunoRecord}
                    pessoaFisicaName={selectedAlunoPessoaFisicaName}
                    onOpenPessoaFisicaLookup={() => openAlunoPessoaFisicaLookup('aluno')}
                    onViewPessoaFisica={(seq) => openPessoaFisicaView(seq)}
                    selectOptions={EA_SELECT_OPTIONS}
                    manageSelection={alunoManageSelection}
                    onManageSelectionChange={handleAlunoManageSelectionChange}
                    allowedSubmodulos={allowedAlunoSubmodulos}
                    campoRegras={campoRegrasDaColecao(campoRegrasAtivas, 'aluno')}
                    campoErros={alunoCampoErros}
                  />
                ) : (
                  <ColaboradorFormView
                    message={message}
                    editingId={colaboradorEditingId}
                    sequence={colaboradorEditingId ? (colaboradores.find((c) => c.id === colaboradorEditingId)?.nr_sequencia ?? null) : null}
                    form={colaboradorForm}
                    setForm={setColaboradorForm}
                    submitting={colaboradorSubmitting}
                    handleSubmit={handleColaboradorSubmit}
                    onSalvarEAdicionar={() => { void salvarEAdicionar(handleColaboradorSubmit, handleColaboradorNewForm); }}
                    goToList={goToColaboradorList}
                    createdAt={colaboradorAuditInfo.createdAt}
                    updatedAt={colaboradorAuditInfo.updatedAt}
                    createdBy={resolverNomeAutorExibicao(colaboradorAuditInfo.createdBy)}
                    updatedBy={resolverNomeAutorExibicao(colaboradorAuditInfo.updatedBy)}
                    onOpenAudit={openColaboradorAuditModal}
                    onPrevRecord={goToPrevColaboradorRecord}
                    onNextRecord={goToNextColaboradorRecord}
                    hasPrevRecord={hasPrevColaboradorRecord}
                    hasNextRecord={hasNextColaboradorRecord}
                    pessoaFisicaName={selectedColaboradorPessoaFisicaName}
                    onOpenPessoaFisicaLookup={() => openAlunoPessoaFisicaLookup('colaborador')}
                    onViewPessoaFisica={(seq) => openPessoaFisicaView(seq)}
                    pessoaJuridicaName={selectedColaboradorPessoaJuridicaName}
                    onOpenPessoaJuridicaLookup={openColaboradorPessoaJuridicaLookup}
                    onViewPessoaJuridica={(seq) => openPessoaJuridicaView(seq)}
                    vinculosContratuais={colaboradorVinculosOptions}
                    cargos={colaboradorCargosOptions}
                    selectOptions={EA_SELECT_OPTIONS}
                    manageSelection={alunoManageSelection}
                    onManageSelectionChange={handleAlunoManageSelectionChange}
                    allowedSubmodulos={allowedAlunoSubmodulos}
                    campoRegras={campoRegrasDaColecao(campoRegrasAtivas, 'colaborador')}
                    campoErros={colaboradorCampoErros}
                  />
                )
              ) : activeSection === "controleCopias" ? (
                ccManageSelection === 'copias' ? (
                  <CadastroGeralFormView
                    editingId={copiaEditingId}
                    sequence={copiaEditingId ? (copias.find((c) => c.id === copiaEditingId)?.nr_sequencia ?? null) : null}
                    form={copiaForm}
                    setForm={setCopiaForm}
                    submitting={copiaSubmitting}
                    handleSubmit={handleCopiaSubmit}
                    onSalvarEAdicionar={() => { void salvarEAdicionar(handleCopiaSubmit, handleCopiaNewForm); }}
                    goToList={goToCopiaList}
                    createdAt={copiaAuditInfo.createdAt}
                    updatedAt={copiaAuditInfo.updatedAt}
                    createdBy={resolverNomeAutorExibicao(copiaAuditInfo.createdBy)}
                    updatedBy={resolverNomeAutorExibicao(copiaAuditInfo.updatedBy)}
                    onPrevRecord={goToPrevCopiaRecord}
                    onNextRecord={goToNextCopiaRecord}
                    hasPrevRecord={hasPrevCopiaRecord}
                    hasNextRecord={hasNextCopiaRecord}
                    onOpenAudit={openCopiaAuditModal}
                    manageSelection={ccManageSelection}
                    onManageSelectionChange={handleCcManageSelectionChange}
                    allowedSubmodulos={allowedCcSubmodulos}
                    selectOptions={CC_SELECT_OPTIONS}
                    fieldInfos={COPIA_FIELD_INFOS}
                    descFieldKey="nr_seq_solicitante"
                    collectionName="copia"
                    hideDescricao
                    hideStatus
                    extraFields={(aux) => (
                      <CopiaCamposFormView
                        aux={aux}
                        valores={copiaExtra}
                        onChange={(campo, valor) => setCopiaExtra((c) => ({ ...c, [campo]: valor }))}
                        descricaoSolicitante={descricaoReferenciaCopia('nr_seq_solicitante', copiaExtra.nr_seq_solicitante)}
                        descricaoTurmaDisciplina={descricaoReferenciaCopia('nr_seq_turma_disciplina', copiaExtra.nr_seq_turma_disciplina)}
                        opcoesFormatoPapel={opcoesDeReferencia(formatosPapel, (f) => f.ds_formato_papel, copiaExtra.nr_seq_formato_papel)}
                        opcoesTipoPapel={opcoesDeReferencia(tiposPapel, (t) => t.ds_tipo_papel, copiaExtra.nr_seq_tipo_papel)}
                        onLocalizarSolicitante={() => openEnviarManutPrestadorLookup('copiaSolicitante')}
                        onLocalizarTurmaDisciplina={() => setCopiaTurmaDisciplinaLookup('form')}
                        arquivoNovo={copiaArquivoNovo}
                        onArquivoNovoChange={setCopiaArquivoNovo}
                        extensoesPermitidas={extensoesCopia}
                        onArquivoInvalido={setMessage}
                        novo={!copiaEditingId}
                      />
                    )}
                    campoRegras={campoRegrasDaColecao(campoRegrasAtivas, 'copia')}
                    campoErros={copiaCampoErros}
                  />
                ) : (
                  <div className="flex-1 flex flex-col min-h-0 space-y-6">
                    <div className="flex min-h-[42px] items-center gap-2">
                      <Select
                        value={ccManageSelection}
                        onChange={handleCcManageSelectionChange}
                        options={CC_SELECT_OPTIONS.filter((o) => allowedCcSubmodulos.includes(o.value))}
                        showPlaceholder={!ccManageSelection}
                        className="!w-[180px]"
                      />
                    </div>
                    <div className="bg-white flex-1 flex flex-col min-h-0 overflow-hidden">
                      <EmptySelectionMessage />
                    </div>
                  </div>
                )
              ) : activeSection === "logs" ? (
                logsManageSelection === 'exclusoes' ? (
                  renderExclusoes()
                ) : logsManageSelection === 'acessos' ? (
                  <AcessosView
                    manageSelection={logsManageSelection}
                    onManageSelectionChange={handleLogsManageSelectionChange}
                    allowedSubmodulos={allowedLogsSubmodulos}
                    filtro={acessosFiltro}
                    onFiltroChange={setAcessosFiltro}
                    onSalvarFiltro={(filtro) => salvarFiltroDaTela('logs_acessos', { form: filtro }, () => setAcessosFiltro(filtro))}
                    onMessage={setMessage}
                    colunas={colunasPorChave('config_colunas_logs_acessos')}
                    nomePessoaFisica={(nr) => pessoasFisicas.find((p) => p.nr_sequencia === nr)?.ds_nome ?? ''}
                    onOpenPessoaFisicaLookup={(aoSelecionar) => {
                      // Mesmo lookup da aba Responsáveis: devolve a sequência pelo retorno.
                      alunoResponsavelLookupCallbackRef.current = aoSelecionar;
                      openAlunoPessoaFisicaLookup('responsavel');
                    }}
                  />
                ) : (
                  <LogsSemSelecaoView
                    manageSelection={logsManageSelection}
                    onManageSelectionChange={handleLogsManageSelectionChange}
                    allowedSubmodulos={allowedLogsSubmodulos}
                  />
                )
              ) : activeSection === "patrimonio" && ativoManageSelection === 'categoria' ? (
                <CadastroGeralFormView
                  editingId={categoriaEditingId}
                  sequence={categoriaEditingId ? (categoriasAtivos.find((c) => c.id === categoriaEditingId)?.nr_sequencia ?? null) : null}
                  form={categoriaForm}
                  setForm={setCategoriaForm}
                  submitting={categoriaSubmitting}
                  handleSubmit={handleCategoriaSubmit}
                  onSalvarEAdicionar={() => { void salvarEAdicionar(handleCategoriaSubmit, handleCategoriaNewForm); }}
                  goToList={goToCategoriaList}
                  createdAt={categoriaAuditInfo.createdAt}
                  updatedAt={categoriaAuditInfo.updatedAt}
                  createdBy={resolverNomeAutorExibicao(categoriaAuditInfo.createdBy)}
                  updatedBy={resolverNomeAutorExibicao(categoriaAuditInfo.updatedBy)}
                  onPrevRecord={goToPrevCategoriaRecord}
                  onNextRecord={goToNextCategoriaRecord}
                  hasPrevRecord={hasPrevCategoriaRecord}
                  hasNextRecord={hasNextCategoriaRecord}
                  onOpenAudit={openCategoriaAuditModal}
                  manageSelection={ativoManageSelection}
                  onManageSelectionChange={handlePatrimonioManageSelectionChange}
                  allowedSubmodulos={allowedPatrimonioSubmodulos}
                  selectOptions={PATRIMONIO_SELECT_OPTIONS.filter((o) => (o.value !== 'manutencoes' || permissoesPatrimonio.acessarManutencao))}
                  fieldInfos={CATEGORIA_ATIVO_FIELD_INFOS}
                  descFieldKey="ds_categoria"
                  collectionName="pat_categoria"
                  showObservacao
                  campoRegras={campoRegrasDaColecao(campoRegrasAtivas, 'pat_categoria')}
                  campoErros={categoriaCampoErros}
                />
              ) : activeSection === "patrimonio" && ativoManageSelection === 'manutencoes' ? (
                <ManutencaoFormView
                  message={message}
                  editingId={manutencaoEditingId}
                  sequence={manutencaoEditingId ? (manutencoes.find((m) => m.id === manutencaoEditingId)?.nr_sequencia ?? null) : null}
                  form={manutencaoForm}
                  setForm={setManutencaoForm}
                  submitting={manutencaoSubmitting}
                  handleSubmit={handleManutencaoSubmit}
                  onSalvarEAdicionar={() => { void salvarEAdicionar(handleManutencaoSubmit, handleManutencaoNewForm); }}
                  goToList={goToManutencaoList}
                  createdAt={manutencaoAuditInfo.createdAt}
                  updatedAt={manutencaoAuditInfo.updatedAt}
                  createdBy={resolverNomeAutorExibicao(manutencaoAuditInfo.createdBy)}
                  updatedBy={resolverNomeAutorExibicao(manutencaoAuditInfo.updatedBy)}
                  onOpenAudit={openManutencaoAuditModal}
                  onPrevRecord={goToPrevManutencaoRecord}
                  onNextRecord={goToNextManutencaoRecord}
                  hasPrevRecord={hasPrevManutencaoRecord}
                  hasNextRecord={hasNextManutencaoRecord}
                  ativos={ativos.map((a) => ({ nr_sequencia: a.nr_sequencia, ds_ativo: a.ds_ativo ?? `#${a.nr_sequencia}` }))}
                  ativoName={manutencaoAtivoName}
                  onOpenAtivoLookup={openManutencaoAtivoLookup}
                  onViewAtivo={(seq) => { const a = ativos.find((at) => at.nr_sequencia === seq); if (a) setAtivoView(a); }}
                  prestadorName={manutencaoPrestadorName}
                  onOpenPrestadorLookup={() => openEnviarManutPrestadorLookup('form')}
                  onViewPrestador={(seq) => openColaboradorView(seq)}
                  selectOptions={PATRIMONIO_SELECT_OPTIONS.filter((o) => (o.value !== 'manutencoes' || permissoesPatrimonio.acessarManutencao))}
                  manageSelection={ativoManageSelection}
                  onManageSelectionChange={handlePatrimonioManageSelectionChange}
                  allowedSubmodulos={allowedPatrimonioSubmodulos}
                  campoRegras={campoRegrasDaColecao(campoRegrasAtivas, 'pat_manutencao')}
                  campoErros={manutencaoCampoErros}
                />
              ) : activeSection === "patrimonio" ? (
                <AtivoFormView
                  message={message}
                  editingId={ativoEditingId}
                  sequence={ativoEditingId ? (ativos.find((a) => a.id === ativoEditingId)?.nr_sequencia ?? null) : null}
                  form={ativoForm}
                  setForm={setAtivoForm}
                  submitting={ativoSubmitting}
                  handleSubmit={handleAtivoSubmit}
                  onSalvarEAdicionar={() => { void salvarEAdicionar(handleAtivoSubmit, handleAtivoNewForm); }}
                  goToList={goToAtivoList}
                  createdAt={ativoAuditInfo.createdAt}
                  updatedAt={ativoAuditInfo.updatedAt}
                  createdBy={resolverNomeAutorExibicao(ativoAuditInfo.createdBy)}
                  updatedBy={resolverNomeAutorExibicao(ativoAuditInfo.updatedBy)}
                  onOpenAudit={openAtivoAuditModal}
                  onPrevRecord={goToPrevAtivoRecord}
                  onNextRecord={goToNextAtivoRecord}
                  hasPrevRecord={hasPrevAtivoRecord}
                  hasNextRecord={hasNextAtivoRecord}
                  combustiveis={combustiveis.map((c) => ({ nr_sequencia: c.nr_sequencia, descricao: c.ds_combustivel, ie_status: c.ie_status }))}
                  categoriasAtivos={categoriasAtivos.map((c) => ({ nr_sequencia: c.nr_sequencia, descricao: c.ds_categoria, ie_status: c.ie_status }))}
                  localizacoes={localizacoes.map((l) => ({ nr_sequencia: l.nr_sequencia, descricao: l.ds_localizacao, ie_status: l.ie_status }))}
                  marcas={marcas.map((m) => ({ nr_sequencia: m.nr_sequencia, descricao: m.ds_marca, ie_status: m.ie_status }))}
                  sistemasOperacionais={sistemasOperacionais.filter((s) => s.ie_status === 'A').sort((a, b) => (a.ds_sistema_operacional ?? '').localeCompare(b.ds_sistema_operacional ?? '', 'pt-BR')).map((s) => ({ nr_sequencia: s.nr_sequencia, descricao: s.ds_sistema_operacional }))}
                  selectOptions={PATRIMONIO_SELECT_OPTIONS.filter((o) => (o.value !== 'manutencoes' || permissoesPatrimonio.acessarManutencao))}
                  manageSelection={ativoManageSelection}
                  onManageSelectionChange={handlePatrimonioManageSelectionChange}
                  allowedSubmodulos={allowedPatrimonioSubmodulos}
                  campoRegras={campoRegrasDaColecao(campoRegrasAtivas, 'pat_ativo')}
                  campoErros={ativoCampoErros}
                  ultimaManutencaoSeq={ativos.find((a) => a.id === ativoEditingId)?.nr_seq_ultima_manutencao ?? null}
                  onViewManutencao={(seq) => openManutencaoView(seq)}
                  fornecedorName={nomeColaboradorPorSeq(ativoForm.nr_seq_fornecedor)}
                  onOpenFornecedorLookup={() => openEnviarManutPrestadorLookup('ativoFornecedor')}
                  onViewFornecedor={(seq) => openColaboradorView(seq)}
                />
              ) : (
              <CadastroGeralFormView
                key={cgManageSelection}
                editingId={cgEditingId}
                sequence={cgEditingId ? (cgItems.find((a) => a.id === cgEditingId)?.nr_sequencia ?? null) : null}
                form={cgForm}
                setForm={setCgForm}
                submitting={cgSubmitting}
                handleSubmit={handleCgSubmit}
                onSalvarEAdicionar={() => { void salvarEAdicionar(handleCgSubmit, handleCgNewForm); }}
                goToList={goToCgList}
                createdAt={cgAuditInfo.createdAt}
                updatedAt={cgAuditInfo.updatedAt}
                createdBy={resolverNomeAutorExibicao(cgAuditInfo.createdBy)}
                updatedBy={resolverNomeAutorExibicao(cgAuditInfo.updatedBy)}
                onPrevRecord={goToPrevCgRecord}
                onNextRecord={goToNextCgRecord}
                hasPrevRecord={hasPrevCgRecord}
                hasNextRecord={hasNextCgRecord}
                onOpenAudit={openCgAuditModal}
                manageSelection={cgManageSelection}
                onManageSelectionChange={handleCgManageSelectionChange}
                allowedSubmodulos={allowedCgSubmodulos}
                selectOptions={CG_SELECT_OPTIONS}
                fieldInfos={cgFieldInfos}
                descFieldKey={cgDescKey}
                collectionName={cgCollection}
                showCbo={cgKind === 'profissao'}
                showDimensoes={cgKind === 'formatoPapel'}
                showSigla={cgKind === 'orgaoEmissor' || cgKind === 'logradouro'}
                siglaFieldKey={cgKind === 'orgaoEmissor' ? 'sg_orgao_emissor' : cgKind === 'logradouro' ? 'sg_logradouro' : undefined}
                campoRegras={campoRegrasDaColecao(campoRegrasAtivas, cgCollection)}
                campoErros={cgCampoErros}
              />
            )
    );
  }

  return (
    <div className={`relative h-screen overflow-hidden animate-fade-in ${darkMode ? "dark bg-[#18181b] text-slate-200" : "bg-white text-slate-800"}`}>
      {/* Overlay do sidebar */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Menu de contexto */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          state={contextMenu}
          showView={podeVerNoContexto()}
          onView={() => {
            if (contextMenu.section === 'pessoaFisica') {
              if (pjManageSelection === 'pessoasJuridicas') {
                openPjEditForm(contextMenu.item as PessoaJuridica);
              } else {
                openEditForm(contextMenu.item as PessoaFisica);
              }
            } else if (contextMenu.section === 'administracaoSistema') {
              if (adminManageSelection === 'imagens') {
                openImagemEditForm(contextMenu.item as Imagem);
              } else if (adminManageSelection === 'perfis') {
                openPerfilEditForm(contextMenu.item as Perfil);
              } else {
                openAdminEditForm(contextMenu.item as Usuario);
              }
            } else if (contextMenu.section === 'estruturaAcademica') {
              if (alunoManageSelection === 'colaboradores') {
                openColaboradorEditForm(contextMenu.item as unknown as Colaborador);
              } else if (alunoManageSelection === 'periodoLetivo') {
                openPeriodoLetivoEditForm(contextMenu.item as PeriodoLetivo);
              } else if (alunoManageSelection === 'cursos') {
                openCursoEditForm(contextMenu.item as Curso);
              } else if (alunoManageSelection === 'disciplinas') {
                openDisciplinaEditForm(contextMenu.item as unknown as Disciplina);
              } else if (alunoManageSelection === 'turmas') {
                openTurmaEditForm(contextMenu.item as unknown as Turma);
              } else if (alunoManageSelection === 'turmasDisciplinas') {
                openTurmaDisciplinaEditForm(contextMenu.item as unknown as TurmaDisciplina);
              } else {
                openAlunoEditForm(contextMenu.item as Aluno);
              }
            } else if (contextMenu.section === 'patrimonio') {
              if (ativoManageSelection === 'categoria') {
                openCategoriaEditForm(contextMenu.item as CategoriaAtivo);
              } else {
                openAtivoEditForm(contextMenu.item as Ativo);
              }
            } else if (contextMenu.section === 'controleCopias') {
              openCopiaEditForm(contextMenu.item as unknown as Copia);
            } else if (contextMenu.section === 'relatorio') {
              openRelatorioEditForm(contextMenu.item as Relatorio);
            } else {
              openCgEditForm(contextMenu.item as Sexo | EstadoCivil | CorRaca | Profissao | OrgaoEmissor | Logradouro | GrauParentesco | Cargo | VinculoContratual | Localizacao | Marca | CategoriaAtivo);
            }
            setContextMenu(null);
          }}
          showChangePassword={
            contextMenu.section === 'administracaoSistema' &&
            adminManageSelection === 'usuarios' &&
            !isProtectedAdminItem &&
            permissoesAdmin.alterarSenhaUsuario
          }
          onChangePassword={() => {
            if (contextMenu.section === 'administracaoSistema') {
              openChangePasswordModal(contextMenu.item as Usuario);
            }
            setContextMenu(null);
          }}
          showChangeIngresso={contextMenu.section === 'estruturaAcademica' && alunoManageSelection === 'alunos' && permissoesEA.alterarDataIngresso}
          onChangeIngresso={() => {
            if (contextMenu.section === 'estruturaAcademica' && alunoManageSelection === 'alunos') {
              openAlterarIngressoModal(contextMenu.item as Aluno, alunosAlvoDoContexto(contextMenu.item as Aluno));
            }
            setContextMenu(null);
          }}
          showChangeStatus={
            contextMenu.section === 'estruturaAcademica' && alunoManageSelection === 'alunos' && permissoesEA.alterarStatusAluno
          }
          onChangeStatus={() => {
            if (contextMenu.section === 'estruturaAcademica' && alunoManageSelection === 'alunos') {
              openAlterarStatusModal(contextMenu.item as Aluno, alunosAlvoDoContexto(contextMenu.item as Aluno));
            }
            setContextMenu(null);
          }}
          customItems={(() => {
            if (contextMenu.section === 'controleCopias' && ccManageSelection === 'copias') {
              const copiaClicada = contextMenu.item as unknown as Copia;
              const items: { label: string; onClick?: () => void }[] = [];
              if (permissoesCC.alterarStatusCopia) {
                items.push({ label: 'Alterar status', onClick: () => { openAlterarStatusCopiaModal(copiaClicada); setContextMenu(null); } });
              }
              return items.length > 0 ? items : undefined;
            }
            if (contextMenu.section === 'patrimonio' && ativoManageSelection === 'ativos') {
              // Com vários ativos marcados, cada opção só aparece se valer para todos eles.
              const ativoClicado = contextMenu.item as Ativo;
              const alvos = ativosAlvoDoContexto(ativoClicado);
              const statusAlvos = alvos.map((a) => a.ie_status ?? '');
              const todos = (cond: (s: string) => boolean) => statusAlvos.every(cond);
              const items: { label: string; onClick?: () => void; children?: { label: string; onClick: () => void }[] }[] = [];
              const algumDescartado = statusAlvos.includes('D');
              const podeAlterarStatus = !algumDescartado || permissoesPatrimonio.alterarStatusDescartado;
              if (todos((s) => s === 'M') && permissoesPatrimonio.concluirManutencao) {
                items.push({ label: 'Concluir manutenção', onClick: () => { openConcluirManutModalFromAtivo(ativoClicado, alvos); setContextMenu(null); } });
              }
              const statusChildren: { label: string; onClick: () => void }[] = [];
              if (podeAlterarStatus && permissoesPatrimonio.mudarParaOperacional && todos((s) => s !== 'O')) {
                statusChildren.push({ label: 'Operacional', onClick: () => { openAtivoStatusModal(ativoClicado, 'O', alvos); setContextMenu(null); } });
              }
              if (podeAlterarStatus && permissoesPatrimonio.enviarParaManutencao && todos((s) => s !== 'M')) {
                statusChildren.push({ label: 'Enviar para manutenção', onClick: () => { openEnviarManutModal(ativoClicado, alvos); setContextMenu(null); } });
              }
              if (podeAlterarStatus && permissoesPatrimonio.moverParaEstoque && todos((s) => s !== 'E')) {
                statusChildren.push({ label: 'Mover para o estoque', onClick: () => { openAtivoStatusModal(ativoClicado, 'E', alvos); setContextMenu(null); } });
              }
              if (permissoesPatrimonio.descartarAtivo && !algumDescartado) {
                statusChildren.push({ label: 'Descartar', onClick: () => { openAtivoStatusModal(ativoClicado, 'D', alvos); setContextMenu(null); } });
              }
              if (permissoesPatrimonio.transferirAtivo) {
                items.push({ label: 'Transferir', onClick: () => { openAtivoTransferirModal(alvos); setContextMenu(null); } });
              }
              if (statusChildren.length > 0 && todos((s) => s !== 'M')) {
                items.push({ label: 'Status', children: statusChildren });
              }
              return items.length > 0 ? items : undefined;
            }
            if (contextMenu.section === 'patrimonio' && ativoManageSelection === 'manutencoes') {
              // Com várias manutenções marcadas, cada opção só aparece se valer para todas.
              const items: { label: string; onClick: () => void }[] = [];
              const manutItem = contextMenu.item as Manutencao;
              const alvos = manutencoesAlvoDoContexto(manutItem);
              const todasEmAndamento = alvos.every((m) => m.ie_status_manutencao === 'E');
              // "Ver" abre um único formulário: não aparece com várias manutenções selecionadas.
              if (permissoesPatrimonio.verManutencao && alvos.length === 1) {
                items.push({ label: 'Ver', onClick: () => { openManutencaoEditForm(manutItem); setContextMenu(null); } });
              }
              if (todasEmAndamento && permissoesPatrimonio.concluirManutencaoRegistro) {
                items.push({ label: 'Concluir manutenção', onClick: () => { openConcluirManutModalFromManut(manutItem, alvos); setContextMenu(null); } });
              }
              if (todasEmAndamento && permissoesPatrimonio.cancelarManutencao) {
                items.push({ label: 'Cancelar manutenção', onClick: () => { openCancelarManutModal(manutItem, alvos); setContextMenu(null); } });
              }
              if (permissoesPatrimonio.excluirManutencao) {
                items.push({
                  label: 'Excluir',
                  onClick: () => {
                    const ids = alvos.map((m) => m.id).filter((id): id is string => !!id);
                    if (ids.length > 1) {
                      setConfirmDeleteMessage(`Deseja mesmo excluir os ${ids.length} registros selecionados?`);
                      setConfirmDeleteAction(() => () => handleManutencoesDeleteLote(ids));
                      setConfirmDeleteOpen(true);
                    } else {
                      handleManutencaoDelete(manutItem.id!);
                    }
                    setContextMenu(null);
                  },
                });
              }
              return items.length > 0 ? items : undefined;
            }
            if (contextMenu.section === 'estruturaAcademica' && alunoManageSelection === 'alunos') {
              const items: { label: string; onClick: () => void }[] = [];
              // Com vários alunos marcados, "Gerar"/"Regerar" só aparece se valer para todos
              // (todos sem matrícula ou todos com matrícula).
              const alunoGerar = contextMenu.item as Aluno;
              const alvosGerar = alunosAlvoDoContexto(alunoGerar);
              const comMatricula = alvosGerar.filter((a) => !!a.nr_matricula?.trim()).length;
              if (permissoesEA.gerarMatricula && (comMatricula === 0 || comMatricula === alvosGerar.length)) {
                const regerarMatricula = comMatricula > 0;
                const varios = alvosGerar.length > 1;
                items.push({
                  label: regerarMatricula ? 'Regerar matrícula' : 'Gerar matrícula',
                  onClick: () => {
                    setConfirmAcao({
                      titulo: regerarMatricula ? 'Regerar matrícula' : 'Gerar matrícula',
                      mensagem: varios
                        ? `Deseja ${regerarMatricula ? 'regerar' : 'gerar'} a matrícula dos ${alvosGerar.length} alunos selecionados?`
                        : `Deseja ${regerarMatricula ? 'regerar' : 'gerar'} a matrícula?`,
                      acao: () => handleGerarMatricula(alunoGerar, alvosGerar),
                    });
                    setContextMenu(null);
                  },
                });
              }
              return items.length > 0 ? items : undefined;
            }
            if (contextMenu.section === 'estruturaAcademica' && alunoManageSelection === 'periodoLetivo') {
              const items: { label: string; onClick: () => void }[] = [];
              const periodo = contextMenu.item as PeriodoLetivo;
              if (periodo.ie_status !== 'E' && permissoesEA.encerrarPeriodoLetivo) {
                items.push({ label: 'Encerrar', onClick: () => { openStatusPeriodoModal(periodo, 'encerrar'); setContextMenu(null); } });
              }
              if (periodo.ie_status === 'E' && permissoesEA.reativarPeriodoLetivo) {
                items.push({ label: 'Reativar', onClick: () => { openStatusPeriodoModal(periodo, 'reativar'); setContextMenu(null); } });
              }
              return items.length > 0 ? items : undefined;
            }
            if (contextMenu.section === 'estruturaAcademica' && alunoManageSelection === 'colaboradores') {
              const items: { label: string; onClick: () => void }[] = [];
              // Com vários colaboradores marcados, cada opção só aparece se valer para todos.
              const colaboradorClicado = contextMenu.item as unknown as Colaborador;
              const alvosColab = colaboradoresAlvoDoContexto(colaboradorClicado);
              const comMatricula = alvosColab.filter((c) => !!c.nr_matricula?.trim()).length;
              if (permissoesEA.gerarMatriculaColaborador && (comMatricula === 0 || comMatricula === alvosColab.length)) {
                const regerarMatricula = comMatricula > 0;
                const varios = alvosColab.length > 1;
                items.push({
                  label: regerarMatricula ? 'Regerar matrícula' : 'Gerar matrícula',
                  onClick: () => {
                    setConfirmAcao({
                      titulo: regerarMatricula ? 'Regerar matrícula' : 'Gerar matrícula',
                      mensagem: varios
                        ? `Deseja ${regerarMatricula ? 'regerar' : 'gerar'} a matrícula dos ${alvosColab.length} colaboradores selecionados?`
                        : `Deseja ${regerarMatricula ? 'regerar' : 'gerar'} a matrícula?`,
                      acao: () => handleGerarMatriculaColaborador(colaboradorClicado, alvosColab),
                    });
                    setContextMenu(null);
                  },
                });
              }
              if (permissoesEA.alterarDataAdmissao) {
                items.push({ label: 'Alterar data de admissão', onClick: () => { openAlterarAdmissaoModal(colaboradorClicado, alvosColab); setContextMenu(null); } });
              }
              if (permissoesEA.alterarStatusColaborador) {
                items.push({ label: 'Alterar status', onClick: () => { openAlterarStatusColaboradorModal(colaboradorClicado, alvosColab); setContextMenu(null); } });
              }
              // Um colaborador assume os ativos de outro: só com um selecionado e não desligado.
              if (permissoesEA.assumirAtivosColaborador && alvosColab.length === 1 && colaboradorClicado.ie_status !== 'D') {
                items.push({ label: 'Assumir ativos de', onClick: () => { openAssumirAtivosModal(colaboradorClicado); setContextMenu(null); } });
              }
              return items.length > 0 ? items : undefined;
            }
            if (contextMenu.section === 'relatorio') {
              const items: { label: string; onClick: () => void }[] = [];
              const relatorioClicado = contextMenu.item as Relatorio;
              if (permissoesRelatorio.gerar && relatorioClicado.ie_status !== 'I') {
                items.push({ label: 'Gerar relatório', onClick: () => { handleRelatorioGerar(relatorioClicado); setContextMenu(null); } });
              }
              if (permissoesRelatorio.duplicar) {
                items.push({ label: 'Duplicar', onClick: () => { handleRelatorioDuplicate(relatorioClicado); setContextMenu(null); } });
              }
              // Exportar: leva o SQL das bandas, então segue a permissão de configurar as bandas.
              if (permissoesRelatorio.bandas) {
                items.push({ label: 'Exportar relatório', onClick: () => { void handleRelatorioExportar(relatorioClicado); setContextMenu(null); } });
              }
              // Ativar/Inativar: o último antes do Excluir (relatório Quasar não é alterado).
              if (permissoesRelatorio.editar && relatorioClicado.ie_origem !== 'Q') {
                items.push({ label: relatorioClicado.ie_status === 'I' ? 'Ativar' : 'Inativar', onClick: () => { void handleRelatorioStatus(relatorioClicado); setContextMenu(null); } });
              }
              return items.length > 0 ? items : undefined;
            }
            if (contextMenu.section === 'administracaoSistema' && adminManageSelection === 'imagens') {
              const items: { label: string; onClick: () => void }[] = [];
              if (permissoesAdmin.renomearImagem) {
                items.push({ label: 'Renomear imagem', onClick: () => { openRenomearModal(contextMenu.item as Imagem); setContextMenu(null); } });
              }
              return items.length > 0 ? items : undefined;
            }
            return undefined;
          })()}
          onDelegateFunctions={
            contextMenu.section === 'administracaoSistema' &&
            adminManageSelection === 'perfis' &&
            !isProtectedAdminItem &&
            permissoesAdmin.delegarFuncoesPerfil
              ? () => {
                  openDelegateFuncoesModal(contextMenu.item as Perfil);
                  setContextMenu(null);
                }
              : undefined
          }
          onDuplicate={
            contextMenu.section === 'administracaoSistema' &&
            adminManageSelection === 'perfis' &&
            !isProtectedAdminItem &&
            permissoesAdmin.duplicarPerfil
              ? () => {
                  openDuplicatePerfilModal(contextMenu.item as Perfil);
                  setContextMenu(null);
                }
              : undefined
          }
          onDelegatePerfis={
            contextMenu.section === 'administracaoSistema' &&
            adminManageSelection === 'usuarios' &&
            !isProtectedAdminItem &&
            permissoesAdmin.delegarPerfisUsuario
              ? () => {
                  openDelegatePerfisModal(contextMenu.item as Usuario);
                  setContextMenu(null);
                }
              : undefined
          }
          showDelete={podeExcluirNoContexto()}
          onDelete={() => {
            if (contextMenu.section === 'pessoaFisica') {
              if (pjManageSelection === 'pessoasJuridicas') {
                const pj = contextMenu.item as PessoaJuridica;
                if (pj.id) {
                  setConfirmDeleteMessage(`Deseja mesmo excluir o registro ${pj.nr_sequencia}?`);
                  setConfirmDeleteAction(() => () => handlePjDelete(pj.id as string));
                  setConfirmDeleteOpen(true);
                }
              } else {
                const pf = contextMenu.item as PessoaFisica;
                if (pf.id) {
                  setConfirmDeleteMessage(`Deseja mesmo excluir o registro ${pf.nr_sequencia}?`);
                  setConfirmDeleteAction(() => () => handleDelete(pf.id as string));
                  setConfirmDeleteOpen(true);
                }
              }
            } else if (contextMenu.section === 'administracaoSistema') {
              if (adminManageSelection === 'imagens') {
                const imagem = contextMenu.item as Imagem;
                if (imagem.id) {
                  setConfirmDeleteMessage(`Deseja mesmo excluir o registro ${imagem.nr_sequencia}?`);
                  setConfirmDeleteAction(() => () => handleImagemDelete(imagem.id as string));
                  setConfirmDeleteOpen(true);
                }
              } else if (adminManageSelection === 'perfis') {
                const perfil = contextMenu.item as Perfil;
                if (perfil.id) {
                  setConfirmDeleteMessage(`Deseja mesmo excluir o registro ${perfil.nr_sequencia}?`);
                  setConfirmDeleteAction(() => () => handlePerfilDelete(perfil.id as string));
                  setConfirmDeleteOpen(true);
                }
              } else {
                const usuario = contextMenu.item as Usuario;
                if (usuario.id) {
                  setConfirmDeleteMessage(`Deseja mesmo excluir o registro ${usuario.nr_sequencia}?`);
                  setConfirmDeleteAction(() => () => handleAdminDelete(usuario.id as string));
                  setConfirmDeleteOpen(true);
                }
              }
            } else if (contextMenu.section === 'estruturaAcademica') {
              if (alunoManageSelection === 'colaboradores') {
                const colaborador = contextMenu.item as unknown as Colaborador;
                const alvos = colaboradoresAlvoDoContexto(colaborador).filter((c) => c.id);
                if (alvos.length > 1) {
                  setConfirmDeleteMessage(`Deseja mesmo excluir os ${alvos.length} registros selecionados?`);
                  setConfirmDeleteAction(() => () => handleColaboradoresDeleteLote(alvos.map((c) => c.id as string)));
                  setConfirmDeleteOpen(true);
                } else if (colaborador.id) {
                  setConfirmDeleteMessage(`Deseja mesmo excluir o registro ${colaborador.nr_sequencia}?`);
                  setConfirmDeleteAction(() => () => handleColaboradorDelete(colaborador.id as string));
                  setConfirmDeleteOpen(true);
                }
              } else if (alunoManageSelection === 'periodoLetivo') {
                const periodo = contextMenu.item as PeriodoLetivo;
                if (periodo.id) {
                  setConfirmDeleteMessage(`Deseja mesmo excluir o registro ${periodo.nr_sequencia}?`);
                  setConfirmDeleteAction(() => () => handlePeriodoLetivoDelete(periodo.id as string));
                  setConfirmDeleteOpen(true);
                }
              } else if (alunoManageSelection === 'cursos') {
                const curso = contextMenu.item as Curso;
                if (curso.id) {
                  setConfirmDeleteMessage(`Deseja mesmo excluir o registro ${curso.nr_sequencia}?`);
                  setConfirmDeleteAction(() => () => handleCursoDelete(curso.id as string));
                  setConfirmDeleteOpen(true);
                }
              } else if (alunoManageSelection === 'disciplinas') {
                const disciplina = contextMenu.item as unknown as Disciplina;
                if (disciplina.id) {
                  setConfirmDeleteMessage(`Deseja mesmo excluir o registro ${disciplina.nr_sequencia}?`);
                  setConfirmDeleteAction(() => () => handleDisciplinaDelete(disciplina.id as string));
                  setConfirmDeleteOpen(true);
                }
              } else if (alunoManageSelection === 'turmas') {
                const turma = contextMenu.item as unknown as Turma;
                if (turma.id) {
                  setConfirmDeleteMessage(`Deseja mesmo excluir o registro ${turma.nr_sequencia}?`);
                  setConfirmDeleteAction(() => () => handleTurmaDelete(turma.id as string));
                  setConfirmDeleteOpen(true);
                }
              } else if (alunoManageSelection === 'turmasDisciplinas') {
                const td = contextMenu.item as unknown as TurmaDisciplina;
                if (td.id) {
                  setConfirmDeleteMessage(`Deseja mesmo excluir o registro ${td.nr_sequencia}?`);
                  setConfirmDeleteAction(() => () => handleTurmaDisciplinaDelete(td.id as string));
                  setConfirmDeleteOpen(true);
                }
              } else {
                const aluno = contextMenu.item as Aluno;
                const alvos = alunosAlvoDoContexto(aluno).filter((a) => a.id);
                if (alvos.length > 1) {
                  setConfirmDeleteMessage(`Deseja mesmo excluir os ${alvos.length} registros selecionados?`);
                  setConfirmDeleteAction(() => () => handleAlunosDeleteLote(alvos.map((a) => a.id as string)));
                  setConfirmDeleteOpen(true);
                } else if (aluno.id) {
                  setConfirmDeleteMessage(`Deseja mesmo excluir o registro ${aluno.nr_sequencia}?`);
                  setConfirmDeleteAction(() => () => handleAlunoDelete(aluno.id as string));
                  setConfirmDeleteOpen(true);
                }
              }
            } else if (contextMenu.section === 'patrimonio' && ativoManageSelection === 'categoria') {
              const categoria = contextMenu.item as CategoriaAtivo;
              if (categoria.id) {
                setConfirmDeleteMessage(`Deseja mesmo excluir o registro ${categoria.nr_sequencia}?`);
                setConfirmDeleteAction(() => () => handleCategoriaDelete(categoria.id as string));
                setConfirmDeleteOpen(true);
              }
            } else if (contextMenu.section === 'patrimonio') {
              const ativo = contextMenu.item as Ativo;
              const alvos = ativosAlvoDoContexto(ativo).filter((a) => a.id);
              if (alvos.length > 1) {
                setConfirmDeleteMessage(`Deseja mesmo excluir os ${alvos.length} registros selecionados?`);
                setConfirmDeleteAction(() => () => handleAtivosDeleteLote(alvos.map((a) => a.id as string)));
                setConfirmDeleteOpen(true);
              } else if (ativo.id) {
                setConfirmDeleteMessage(`Deseja mesmo excluir o registro ${ativo.nr_sequencia}?`);
                setConfirmDeleteAction(() => () => handleAtivoDelete(ativo.id as string));
                setConfirmDeleteOpen(true);
              }
            } else if (contextMenu.section === 'controleCopias') {
              const copia = contextMenu.item as unknown as Copia;
              if (copia.id) {
                setConfirmDeleteMessage(`Deseja mesmo excluir o registro ${copia.nr_sequencia}?`);
                setConfirmDeleteAction(() => () => handleCopiaDelete(copia.id as string));
                setConfirmDeleteOpen(true);
              }
            } else if (contextMenu.section === 'relatorio') {
              const rel = contextMenu.item as Relatorio;
              if (rel.id) {
                setConfirmDeleteMessage(`Deseja mesmo excluir o relatório ${rel.nr_sequencia}?`);
                setConfirmDeleteAction(() => () => handleRelatorioDelete(rel.id as string));
                setConfirmDeleteOpen(true);
              }
            } else {
              const cg = contextMenu.item as Sexo | EstadoCivil | CorRaca | Profissao | OrgaoEmissor | Logradouro | GrauParentesco | Cargo | VinculoContratual | Localizacao | Marca | CategoriaAtivo;
              if (cg.id) {
                setConfirmDeleteMessage(`Deseja mesmo excluir o registro ${cg.nr_sequencia}?`);
                setConfirmDeleteAction(() => () => handleCgDelete(cg.id as string));
                setConfirmDeleteOpen(true);
              }
            }
            setContextMenu(null);
          }}
        />
      )}

      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        className={`fixed left-0 top-0 bottom-0 z-40 flex flex-col border-r border-[#004a7a] bg-[#003056] shadow-xl shadow-black/20 transition-all duration-300 ease-out ${
          isSidebarOpen ? "" : "w-12"
        }`}
        style={isSidebarOpen ? { width: larguraMenuAberto } : undefined}
      >
        <div
          className="relative flex items-center border-b border-[#004a7a] cursor-pointer select-none outline-none"
          style={{ height: "44px" }}
          onClick={() => setIsSidebarOpen((prev) => !prev)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setIsSidebarOpen((prev) => !prev);
            }
          }}
          aria-label="Alternar menu"
        >
          <div className="absolute left-6 top-1/2 -translate-x-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center">
            {/* Logo negativa (anel branco) para o fundo azul; 30px deixam o anel com o tamanho da logo anterior. */}
            <Image
              src="/images/Logo%20Quasar%202.0%20-%20Negativa.png"
              alt="Quasar"
              width={30}
              height={30}
              className="h-[30px] w-[30px] max-w-none object-contain"
            />
          </div>
          <div
            className={`h-7 flex items-center overflow-hidden transition-all duration-300 ease-out ml-[46px] ${
              isSidebarOpen ? "max-w-[100px] opacity-100" : "max-w-0 opacity-0"
            }`}
          >
            <span className="text-sm font-semibold leading-none text-white whitespace-nowrap">
              Quasar
            </span>
          </div>
        </div>

        <nav className="mt-2 flex flex-col gap-0.5 px-1">
          {menuOrder.filter((section) => allowedSections.includes(section)).map((section) => {
            const def = SECTION_DEFS[section];
            const isActive = activeSection === section;
            const isDragging = dragSection === section;
            const isDropTarget = dragOverSection === section && dragSection !== null && dragSection !== section;
            return (
              <button
                key={section}
                type="button"
                draggable={isSidebarOpen}
                onDragStart={(e) => {
                  e.dataTransfer.effectAllowed = "move";
                  e.dataTransfer.setData("text/plain", section);
                  handleSectionDragStart(section);
                }}
                onDragOver={(e) => {
                  if (!isSidebarOpen || !dragSection) return;
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                  handleSectionDragOver(section);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  draggedRef.current = false;
                  handleSectionDrop(section);
                }}
                onDragEnd={handleSectionDragEnd}
                className={`relative group flex items-center rounded-[3px] px-1.5 py-1.5 text-blue-200 transition hover:bg-[#004a7a] focus:bg-[#004a7a] outline-none ${
                  isSidebarOpen ? "justify-start gap-2.5 cursor-grab active:cursor-grabbing" : "justify-center gap-0 cursor-pointer"
                } ${isActive ? 'bg-[#004a7a]' : ''} ${isDragging ? 'opacity-50' : ''} ${isDropTarget ? 'ring-2 ring-inset ring-[#2cc958]' : ''}`}
                onClick={() => {
                  if (draggedRef.current) return;
                  setContextMenu(null);
                  if (section === activeSection) {
                    // Clique na função já ativa: volta para a listagem.
                    setView('list');
                    return;
                  }
                  setActiveSection(section);
                  // Ao voltar para uma função, restaura a tela em que o usuário
                  // estava (formulário aberto, se houver) em vez de sempre cair
                  // na listagem de registros.
                  setView(sectionViews[section] ?? 'list');
                }}
                aria-label={def.label}
              >
                {secoesAbertas.includes(section) && (
                  <span
                    role="button"
                    tabIndex={0}
                    aria-label={`Fechar ${def.label}`}
                    draggable={false}
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSecaoParaFechar(section);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        e.stopPropagation();
                        setSecaoParaFechar(section);
                      }
                    }}
                    className="fechar-funcao absolute left-0 top-0 z-10 flex h-3.5 w-3.5 items-center justify-center rounded-full cursor-pointer transition"
                  >
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M18 6 6 18" />
                      <path d="M6 6l12 12" />
                    </svg>
                  </span>
                )}
                <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-[3px] bg-white/15 text-white">
                  {def.icon}
                </span>
                <span
                  className={`h-7 flex items-center overflow-hidden whitespace-pre transition-all duration-300 ease-out ${
                    isSidebarOpen ? "opacity-100" : "max-w-0 opacity-0"
                  }`}
                  style={isSidebarOpen ? { maxWidth: larguraMenuAberto - LARGURA_MENU_FIXA_ITEM } : undefined}
                >
                  <span data-rotulo-funcao className="text-sm leading-none text-white">
                    {def.label}
                  </span>
                </span>
                {isSidebarOpen && (
                  <span className="ml-auto flex h-4 w-4 shrink-0 items-center justify-center text-white/40 transition group-hover:text-white/70">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                      <circle cx="9" cy="12" r="1.4" />
                      <circle cx="15" cy="12" r="1.4" />
                      <circle cx="9" cy="6" r="1.4" />
                      <circle cx="15" cy="6" r="1.4" />
                      <circle cx="9" cy="18" r="1.4" />
                      <circle cx="15" cy="18" r="1.4" />
                    </svg>
                  </span>
                )}
                {!isSidebarOpen && (
                  <span className="pointer-events-none absolute left-full top-1/2 z-50 ml-2 hidden -translate-y-1/2 rounded bg-slate-900 px-2 py-1 text-[11px] font-medium text-white shadow-lg shadow-black/25 whitespace-nowrap group-hover:block">
                    {def.label}
                    <span className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 h-2 w-2 rotate-45 bg-slate-900" />
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-[#004a7a] px-1 py-2">
          {/* Regra "Badge de teste": identifica a base de homologação. */}
          {regraSistema?.ie_badge_teste === 'S' && (
            <div
              className={`group relative mb-1 flex w-full items-center px-1.5 py-1.5 ${isSidebarOpen ? "justify-start" : "justify-center"}`}
              aria-label="Homologação"
            >
              <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center text-[#facc15]">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <path d="M12 9v4" />
                  <path d="M12 17h.01" />
                </svg>
              </span>
              <span className="pointer-events-none absolute left-full top-1/2 z-50 ml-2 hidden -translate-y-1/2 rounded bg-slate-900 px-2 py-1 text-[11px] font-medium text-white shadow-lg shadow-black/25 whitespace-nowrap group-hover:block">
                Homologação
                <span className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 h-2 w-2 rotate-45 bg-slate-900" />
              </span>
            </div>
          )}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                if (isUserMenuOpen) {
                  setIsUserMenuClosing(true);
                  window.setTimeout(() => {
                    setIsUserMenuOpen(false);
                    setIsUserMenuClosing(false);
                  }, 220);
                } else {
                  setIsUserMenuClosing(false);
                  setIsUserMenuOpen(true);
                }
              }}
              className={`flex w-full items-center rounded-[3px] px-1.5 py-1.5 text-blue-200 transition hover:bg-[#004a7a] focus:bg-[#004a7a] cursor-pointer outline-none ${
                isSidebarOpen ? "justify-start gap-2.5" : "justify-center gap-0"
              } ${isUserMenuOpen ? "bg-[#004a7a]" : ""}`}
            >
              <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-[3px] bg-white/15 text-white">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </span>
              <span
                className={`ml-0 h-7 flex items-center overflow-hidden whitespace-pre transition-all duration-300 ease-out ${
                  isSidebarOpen ? "opacity-100" : "max-w-0 opacity-0"
                }`}
                style={isSidebarOpen ? { maxWidth: larguraMenuAberto - LARGURA_MENU_FIXA_ITEM + 26 } : undefined}
              >
                <span className="text-sm leading-none text-white">
                  {currentUser?.ds_usuario_alternativo || currentUser?.ds_usuario || "Usuário"}
                </span>
              </span>
            </button>

            {(isUserMenuOpen || isUserMenuClosing) && (
              <>
                <div
                  className="fixed inset-0 z-40 bg-black/40"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    setIsUserMenuClosing(false);
                  }}
                />
                <div
                  className="fixed bottom-4 left-4 z-50 origin-bottom-left max-w-[320px] w-auto inline-block rounded-[2px] bg-[#003056] p-[10px] shadow-[0_8px_24px_rgba(0,0,0,0.16)] overflow-visible"
                  style={{ animation: isUserMenuClosing ? "popupClose 220ms cubic-bezier(0.16, 1, 0.3, 1) both" : "popupOpen 220ms cubic-bezier(0.16, 1, 0.3, 1) both" }}
                >
                  {/* Canto superior: switch à esquerda, sair encostado na borda direita */}
                  <div className="-mr-[10px] flex items-center justify-between">
                    <button
                      type="button"
                      onClick={toggleDarkMode}
                      className="flex cursor-pointer items-center rounded-[2px] bg-transparent text-white transition outline-none"
                      aria-pressed={darkMode}
                    >
                      <span className="flex h-5 w-9 shrink-0 items-center rounded-full bg-[#2cc958] p-[2px] transition-colors duration-300">
                        <span
                          className={`flex h-4 w-4 items-center justify-center rounded-full shadow transition-transform duration-300 ease-out bg-[#27272a] ${
                            darkMode ? "translate-x-4" : "translate-x-0"
                          }`}
                        >
                          {darkMode ? (
                            <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor" className="text-[#003056]">
                              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                            </svg>
                          ) : (
                            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#e4e4e7]">
                              <circle cx="12" cy="12" r="4" />
                              <path d="M12 2v2" />
                              <path d="M12 20v2" />
                              <path d="m4.93 4.93 1.41 1.41" />
                              <path d="m17.66 17.66 1.41 1.41" />
                              <path d="M2 12h2" />
                              <path d="M20 12h2" />
                              <path d="m6.34 17.66-1.41 1.41" />
                              <path d="m19.07 4.93-1.41 1.41" />
                            </svg>
                          )}
                        </span>
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleLogout()}
                      className="flex h-[42px] w-[42px] cursor-pointer items-center justify-center rounded-[2px] bg-transparent text-white hover:text-[#2cc958] outline-none"
                      aria-label="Sair"
                    >
                      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <path d="m16 17 5-5-5-5" />
                        <path d="M21 12H9" />
                      </svg>
                    </button>
                  </div>

                  {/* Avatar e nomes */}
                  <div className="my-3 flex flex-col items-center gap-3">
                    <div className="flex h-[76px] w-[76px] shrink-0 items-center justify-center rounded-full bg-white/10 text-white">
                      <svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    </div>
                    <div className="min-w-0 text-center">
                      <p className="text-[15px] font-semibold text-white">
                        {currentUserPersonName}
                      </p>
                      <p className="text-sm text-white/70">
                        {currentUser?.ds_usuario_alternativo || currentUser?.ds_usuario || "Usuário"}
                      </p>
                    </div>
                  </div>

                  {/* Perfil ativo (alternância entre perfis vinculados) */}
                  {usuarioPerfisVinculados.length > 0 && (
                    <div className="mb-1 w-full">
                      <Select
                        value={String(activePerfilSequencia ?? usuarioPerfisVinculados[0].nr_sequencia)}
                        onChange={(v) => {
                          const nr = Number(v);
                          if (Number.isFinite(nr)) handleActivePerfilChange(nr);
                        }}
                        options={usuarioPerfisVinculados.map((p) => ({
                          value: String(p.nr_sequencia),
                          label: p.ds_perfil ?? '',
                        }))}
                        showPlaceholder={false}
                        theme="sidebar"
                        className="!bg-[#1A4567] !text-white !border-[#1A4567] !rounded-[2px] text-center"
                        dropdownClassName="!bg-[#003056] !border-[#1A4567] !shadow-[0_-4px_12px_rgba(0,0,0,0.25)] !rounded-[2px] !text-white !overflow-hidden"
                        optionClassName="!bg-[#003056] hover:!bg-[#1A4567] !text-white"
                        absolute
                      />
                    </div>
                  )}

                  {/* Alterar senha, Base de Conhecimento, Central de Suporte, Parâmetros da Função e Política de Privacidade */}
                  <div className="mt-8 flex flex-col gap-2">
                    {!isAdministrador && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          setIsUserMenuClosing(false);
                          if (currentUser) openChangePasswordModal(currentUser, true);
                        }}
                        className="flex w-full cursor-pointer items-center justify-center rounded-[2px] bg-[#1A4567] px-[7px] py-[5px] text-[13px] text-white transition hover:bg-[#173d5c] focus:bg-[#173d5c] outline-none"
                      >
                        Alterar senha
                      </button>
                    )}
                    {currentUser?.ie_base_conhecimento === 'S' && (
                      <button
                        type="button"
                        className="flex w-full cursor-pointer items-center justify-center rounded-[2px] bg-[#1A4567] px-[7px] py-[5px] text-[13px] text-white transition hover:bg-[#173d5c] focus:bg-[#173d5c] outline-none"
                      >
                        Base de Conhecimento
                      </button>
                    )}
                    {currentUser?.ie_central_suporte === 'S' && (
                      <button
                        type="button"
                        className="flex w-full cursor-pointer items-center justify-center rounded-[2px] bg-[#1A4567] px-[7px] py-[5px] text-[13px] text-white transition hover:bg-[#173d5c] focus:bg-[#173d5c] outline-none"
                      >
                        Central de Suporte
                      </button>
                    )}
                    {/* Abre Administração do Sistema > Parâmetros com a função atual já selecionada. */}
                    {currentUser?.ie_parametros_funcao === 'S' && allowedSections.includes('administracaoSistema') && allowedAdminSubmodulos.includes('parametros') && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          setIsUserMenuClosing(false);
                          setContextMenu(null);
                          setParametrosFuncaoInicial((p) => ({ funcao: activeSection, vez: p.vez + 1 }));
                          setActiveSection('administracaoSistema');
                          handleAdminManageSelectionChange('parametros');
                        }}
                        className="flex w-full cursor-pointer items-center justify-center rounded-[2px] bg-[#1A4567] px-[7px] py-[5px] text-[13px] text-white transition hover:bg-[#173d5c] focus:bg-[#173d5c] outline-none"
                      >
                        Parâmetros da Função
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        setIsUserMenuClosing(false);
                        setAvisoModalCampo('ds_politica_privacidade');
                      }}
                      className="flex w-full cursor-pointer items-center justify-center rounded-[2px] bg-[#1A4567] px-[7px] py-[5px] text-[13px] text-white transition hover:bg-[#173d5c] focus:bg-[#173d5c] outline-none"
                    >
                      Política de Privacidade
                    </button>
                  </div>

                  {/* Versão do sistema */}
                  <div className="mt-4 flex flex-col items-start gap-1 text-[11px]" style={{ color: '#fff' }}>
                    <span>
                      <span className="font-semibold">Versão:</span> {SYSTEM_VERSION}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </aside>

      {/* Conteúdo principal */}
      <div style={{ marginLeft: '3rem' }} className="h-full flex flex-col overflow-hidden">
        <div
          className="w-full flex-1 flex flex-col min-h-0 px-[15px] py-[15px]"
          onContextMenu={openFormContextMenu}
        >
          {allowedSections.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-sm text-slate-500">Nenhuma função foi liberada para o seu usuário. Contate o administrador.</p>
            </div>
          ) : (
            <>
              {!activeSection && (
                <div className="flex h-full items-center justify-center">
                  <p className="text-sm text-slate-500">Selecione uma função no menu lateral.</p>
                </div>
              )}
              {/* Cada função aberta fica montada (só a ativa aparece): ao voltar para ela,
                  o usuário continua exatamente de onde parou. Fechar (x no menu) desmonta. */}
              {secoesAbertas.filter((secao) => allowedSections.includes(secao)).map((secao) => (
                <div key={secao} className={secao === activeSection ? "flex-1 flex flex-col min-h-0" : "hidden"}>
                  <SecaoPaginacaoContext.Provider value={secao}>
                    {renderConteudoSecao(secao, secao === activeSection ? view : (sectionViews[secao] ?? 'list'))}
                  </SecaoPaginacaoContext.Provider>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {filterModalOpen && view === "list" && activeSection === "pessoaFisica" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="absolute inset-0 bg-black/40" onClick={closeFilterModal} />
          <form onSubmit={handleFilterSubmit} className="relative w-full max-w-[980px] bg-white modal-dark p-0 shadow-xl shadow-black/20">
            <div className="flex items-center justify-between bg-[#ccc] px-[15px]">
              <h2 className="text-base font-semibold" style={{ color: '#000' }}>Filtro</h2>
              <button
                type="button"
                onClick={closeFilterModal}
                className="inline-flex h-9 items-center justify-center rounded-[3px] text-slate-700 transition cursor-pointer p-0 focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#066fc5] focus-visible:outline-offset-2"
                aria-label="Fechar filtro"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18" />
                  <path d="M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid gap-[15px] sm:grid-cols-12 p-[15px]">
              <div className="sm:col-span-2">
                <RotuloCampo texto="Sequência" colecao="pessoa_fisica" campo="nr_sequencia" />
                <input
                  inputMode="numeric"
                  maxLength={10}
                  className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none"
                  value={filterForm.nr_sequencia}
                  onChange={(e) => setFilterForm({ ...filterForm, nr_sequencia: e.target.value })}
                />
              </div>
              <div className="sm:col-span-7">
                <RotuloCampo texto="Nome completo" colecao="pessoa_fisica" campo="ds_nome" />
                <input
                  className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none"
                  value={filterForm.ds_nome}
                  onChange={(e) => setFilterForm({ ...filterForm, ds_nome: e.target.value })}
                />
              </div>

              <div className="sm:col-span-3">
                <RotuloCampo texto="CPF" colecao="pessoa_fisica" campo="nr_cpf" />
                <input
                  inputMode="numeric"
                  maxLength={14}
                  className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none"
                  value={filterForm.nr_cpf}
                  onChange={(e) => setFilterForm({ ...filterForm, nr_cpf: applyCpfMask(e.target.value) })}
                />
              </div>

              <div className="sm:col-span-6">
                <RotuloCampo texto="Nascimento (início)" colecao="pessoa_fisica" campo="dt_nascimento" />
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="DD/MM/AAAA"
                  className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none placeholder:text-[#aaa]"
                  value={filterForm.dt_nascimento_inicio}
                  onChange={(e) => setFilterForm({ ...filterForm, dt_nascimento_inicio: applyDateMask(e.target.value) })}
                />
              </div>

              <div className="sm:col-span-6">
                <RotuloCampo texto="Nascimento (fim)" colecao="pessoa_fisica" campo="dt_nascimento" />
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="DD/MM/AAAA"
                  className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none placeholder:text-[#aaa]"
                  value={filterForm.dt_nascimento_fim}
                  onChange={(e) => setFilterForm({ ...filterForm, dt_nascimento_fim: applyDateMask(e.target.value) })}
                />
              </div>

              <div className="sm:col-span-6">
                <RotuloCampo texto="E-mail" colecao="pessoa_fisica" campo="ds_email" />
                <input
                  className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none"
                  value={filterForm.ds_email}
                  onChange={(e) => setFilterForm({ ...filterForm, ds_email: e.target.value })}
                />
              </div>

              <div className="sm:col-span-6">
                <RotuloCampo texto="Telefone" colecao="pessoa_fisica" campo="nr_telefone" />
                <input
                  inputMode="numeric"
                  maxLength={15}
                  className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none"
                  value={filterForm.nr_telefone}
                  onChange={(e) => setFilterForm({ ...filterForm, nr_telefone: applyPhoneMask(e.target.value) })}
                />
              </div>

              <div className="sm:col-span-3">
                <RotuloCampo texto="Sexo" colecao="pessoa_fisica" campo="nr_seq_sexo" />
                <Select
                  value={filterForm.nr_seq_sexo}
                  onChange={(v) => setFilterForm({ ...filterForm, nr_seq_sexo: v })}
                  options={[...pfCgOptions.sexos].sort((a, b) => a.descricao.localeCompare(b.descricao, 'pt-BR', { sensitivity: 'base' })).map((o) => ({ value: String(o.nr_sequencia), label: o.descricao }))}
                />
              </div>

              <div className="sm:col-span-3">
                <RotuloCampo texto="Estado civil" colecao="pessoa_fisica" campo="nr_seq_estado_civil" />
                <Select
                  value={filterForm.nr_seq_estado_civil}
                  onChange={(v) => setFilterForm({ ...filterForm, nr_seq_estado_civil: v })}
                  options={[...pfCgOptions.estadoCivis].sort((a, b) => a.descricao.localeCompare(b.descricao, 'pt-BR', { sensitivity: 'base' })).map((o) => ({ value: String(o.nr_sequencia), label: o.descricao }))}
                />
              </div>

              <div className="sm:col-span-3">
                <RotuloCampo texto="Cor/Raça" colecao="pessoa_fisica" campo="nr_seq_cor_raca" />
                <Select
                  value={filterForm.nr_seq_cor_raca}
                  onChange={(v) => setFilterForm({ ...filterForm, nr_seq_cor_raca: v })}
                  options={[...pfCgOptions.coresRacas].sort((a, b) => a.descricao.localeCompare(b.descricao, 'pt-BR', { sensitivity: 'base' })).map((o) => ({ value: String(o.nr_sequencia), label: o.descricao }))}
                />
              </div>

              <div className="sm:col-span-3">
                <RotuloCampo texto="Profissão" colecao="pessoa_fisica" campo="nr_seq_profissao" />
                <Select
                  value={filterForm.nr_seq_profissao}
                  onChange={(v) => setFilterForm({ ...filterForm, nr_seq_profissao: v })}
                  options={[...pfCgOptions.profissoes].sort((a, b) => a.descricao.localeCompare(b.descricao, 'pt-BR', { sensitivity: 'base' })).map((o) => ({ value: String(o.nr_sequencia), label: o.descricao }))}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 px-[15px] pb-[15px]">
              <BotaoSalvarFiltro onClick={() => { void salvarFiltroDaTela('pessoa_fisica', { form: filterForm }, () => handleFilterSubmit(EVENTO_SUBMIT)); }} />
              <button
                type="button"
                onClick={clearFilter}
                className="px-4 py-2.5 text-sm text-black transition rounded-[3px] border-b button-cancel cursor-pointer min-w-[96px] justify-center"
                style={{ backgroundColor: '#bdbdbd', borderBottomColor: '#000' } as React.CSSProperties}
              >
                Limpar
              </button>
              <button
                type="submit"
                className="px-4 py-2.5 text-sm text-white transition rounded-[3px] border-b button-save cursor-pointer min-w-[96px] justify-center"
                style={{ backgroundColor: '#003056', borderBottomColor: '#000' } as React.CSSProperties}
              >
                Filtrar
              </button>
            </div>
          </form>
        </div>
      )}

      {alunoFilterModalOpen && view === "list" && activeSection === "estruturaAcademica" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="absolute inset-0 bg-black/40" onClick={closeAlunoFilterModal} />
          <form onSubmit={handleAlunoFilterSubmit} className="relative w-full max-w-[980px] bg-white modal-dark p-0 shadow-xl shadow-black/20">
            <div className="flex items-center justify-between bg-[#ccc] px-[15px]">
              <h2 className="text-base font-semibold" style={{ color: '#000' }}>Filtro</h2>
              <button
                type="button"
                onClick={closeAlunoFilterModal}
                className="inline-flex h-9 items-center justify-center rounded-[3px] text-slate-700 transition cursor-pointer p-0 focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#066fc5] focus-visible:outline-offset-2"
                aria-label="Fechar filtro"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18" />
                  <path d="M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid gap-[15px] sm:grid-cols-12 p-[15px]">
              <div className="sm:col-span-2">
                <RotuloCampo texto="Sequência" colecao="aluno" campo="nr_sequencia" />
                <input
                  inputMode="numeric"
                  maxLength={10}
                  className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none"
                  value={alunoFilterForm.nr_sequencia}
                  onChange={(e) => setAlunoFilterForm({ ...alunoFilterForm, nr_sequencia: e.target.value })}
                />
              </div>
              <div className="sm:col-span-10">
                <RotuloCampo texto="Matrícula" colecao="aluno" campo="nr_matricula" />
                <input
                  className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none"
                  value={alunoFilterForm.nr_matricula}
                  onChange={(e) => setAlunoFilterForm({ ...alunoFilterForm, nr_matricula: e.target.value })}
                />
              </div>

              <div className="sm:col-span-12">
                <RotuloCampo texto="Pessoa física" colecao="aluno" campo="nr_seq_pessoa_fisica" />
                <div className="flex items-center gap-2 flex-nowrap">
                  <div style={{ width: 110 }}>
                    <label className="sr-only">Sequência da pessoa física</label>
                    <input
                      inputMode="numeric"
                      maxLength={10}
                      className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 transition focus:border-[#003056] focus:outline-none"
                      value={alunoFilterForm.nr_seq_pessoa_fisica}
                      onChange={(e) => setAlunoFilterForm({ ...alunoFilterForm, nr_seq_pessoa_fisica: e.target.value.replace(/\D/g, '') })}
                    />
                  </div>
                  <div className="relative flex-1 min-w-0">
                    <label className="sr-only">Nome da pessoa física</label>
                    <input
                      readOnly
                      className="w-full rounded-[3px] border border-slate-300 bg-slate-100 px-2 pr-[62px] py-1.5 text-sm text-slate-700 transition focus:border-[#003056] focus:outline-none"
                      value={pessoasFisicas.find((p) => String(p.nr_sequencia) === alunoFilterForm.nr_seq_pessoa_fisica)?.ds_nome ?? ''}
                    />
                    <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                      {alunoFilterForm.nr_seq_pessoa_fisica && (
                        <button
                          type="button"
                          onClick={() => openPessoaFisicaView(Number(alunoFilterForm.nr_seq_pessoa_fisica))}
                          className="inline-flex h-[30px] w-[28px] items-center justify-center rounded-[3px] cursor-pointer icon-lookup"
                          aria-label="Visualizar pessoa física"
                        >
                          <ViewIcon size={16} />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={openAlunoFilterPessoaFisicaLookup}
                        className="inline-flex h-[30px] w-[28px] items-center justify-center rounded-[3px] cursor-pointer icon-lookup"
                        aria-label="Localizar pessoa física"
                      >
                        <SearchIcon size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="sm:col-span-6">
                <RotuloCampo texto="Data de ingresso (início)" colecao="aluno" campo="dt_ingresso" />
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="DD/MM/AAAA"
                  className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none placeholder:text-[#aaa]"
                  value={alunoFilterForm.dt_ingresso_inicio}
                  onChange={(e) => setAlunoFilterForm({ ...alunoFilterForm, dt_ingresso_inicio: applyDateMask(e.target.value) })}
                />
              </div>

              <div className="sm:col-span-6">
                <RotuloCampo texto="Data de ingresso (fim)" colecao="aluno" campo="dt_ingresso" />
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="DD/MM/AAAA"
                  className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none placeholder:text-[#aaa]"
                  value={alunoFilterForm.dt_ingresso_fim}
                  onChange={(e) => setAlunoFilterForm({ ...alunoFilterForm, dt_ingresso_fim: applyDateMask(e.target.value) })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 px-[15px] pb-[15px]">
              <BotaoSalvarFiltro onClick={() => { void salvarFiltroDaTela('aluno', { form: alunoFilterForm }, () => handleAlunoFilterSubmit(EVENTO_SUBMIT)); }} />
              <button
                type="button"
                onClick={clearAlunoFilter}
                className="px-4 py-2.5 text-sm text-black transition rounded-[3px] border-b button-cancel cursor-pointer min-w-[96px] justify-center"
                style={{ backgroundColor: '#bdbdbd', borderBottomColor: '#000' } as React.CSSProperties}
              >
                Limpar
              </button>
              <button
                type="submit"
                className="px-4 py-2.5 text-sm text-white transition rounded-[3px] border-b button-save cursor-pointer min-w-[96px] justify-center"
                style={{ backgroundColor: '#003056', borderBottomColor: '#000' } as React.CSSProperties}
              >
                Filtrar
              </button>
            </div>
          </form>
        </div>
      )}

      {colaboradorFilterModalOpen && view === "list" && activeSection === "estruturaAcademica" && alunoManageSelection === 'colaboradores' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="absolute inset-0 bg-black/40" onClick={closeColaboradorFilterModal} />
          <form onSubmit={handleColaboradorFilterSubmit} className="relative w-full max-w-[980px] bg-white modal-dark p-0 shadow-xl shadow-black/20">
            <div className="flex items-center justify-between bg-[#ccc] px-[15px]">
              <h2 className="text-base font-semibold" style={{ color: '#000' }}>Filtro</h2>
              <button
                type="button"
                onClick={closeColaboradorFilterModal}
                className="inline-flex h-9 items-center justify-center rounded-[3px] text-slate-700 transition cursor-pointer p-0 focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#066fc5] focus-visible:outline-offset-2"
                aria-label="Fechar filtro"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18" />
                  <path d="M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid gap-[15px] sm:grid-cols-12 p-[15px]">
              <div className="sm:col-span-2">
                <RotuloCampo texto="Sequência" colecao="colaborador" campo="nr_sequencia" />
                <input
                  inputMode="numeric"
                  maxLength={10}
                  className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none"
                  value={colaboradorFilterForm.nr_sequencia}
                  onChange={(e) => setColaboradorFilterForm({ ...colaboradorFilterForm, nr_sequencia: e.target.value })}
                />
              </div>
              <div className="sm:col-span-10">
                <RotuloCampo texto="Matrícula" colecao="colaborador" campo="nr_matricula" />
                <input
                  className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none"
                  value={colaboradorFilterForm.nr_matricula}
                  onChange={(e) => setColaboradorFilterForm({ ...colaboradorFilterForm, nr_matricula: e.target.value })}
                />
              </div>

              <div className="sm:col-span-12">
                <RotuloCampo texto="Pessoa física" colecao="colaborador" campo="nr_seq_pessoa_fisica" />
                <div className="flex items-center gap-2 flex-nowrap">
                  <div style={{ width: 110 }}>
                    <label className="sr-only">Sequência da pessoa física</label>
                    <input
                      inputMode="numeric"
                      maxLength={10}
                      className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 transition focus:border-[#003056] focus:outline-none"
                      value={colaboradorFilterForm.nr_seq_pessoa_fisica}
                      onChange={(e) => setColaboradorFilterForm({ ...colaboradorFilterForm, nr_seq_pessoa_fisica: e.target.value.replace(/\D/g, '') })}
                    />
                  </div>
                  <div className="relative flex-1 min-w-0">
                    <label className="sr-only">Nome da pessoa física</label>
                    <input
                      readOnly
                      className="w-full rounded-[3px] border border-slate-300 bg-slate-100 px-2 pr-[62px] py-1.5 text-sm text-slate-700 transition focus:border-[#003056] focus:outline-none"
                      value={pessoasFisicas.find((p) => String(p.nr_sequencia) === colaboradorFilterForm.nr_seq_pessoa_fisica)?.ds_nome ?? ''}
                    />
                    <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                      {colaboradorFilterForm.nr_seq_pessoa_fisica && (
                        <button
                          type="button"
                          onClick={() => openPessoaFisicaView(Number(colaboradorFilterForm.nr_seq_pessoa_fisica))}
                          className="inline-flex h-[30px] w-[28px] items-center justify-center rounded-[3px] cursor-pointer icon-lookup"
                          aria-label="Visualizar pessoa física"
                        >
                          <ViewIcon size={16} />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={openColaboradorFilterPessoaFisicaLookup}
                        className="inline-flex h-[30px] w-[28px] items-center justify-center rounded-[3px] cursor-pointer icon-lookup"
                        aria-label="Localizar pessoa física"
                      >
                        <SearchIcon size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="sm:col-span-12">
                <RotuloCampo texto="Pessoa jurídica" colecao="colaborador" campo="nr_seq_pessoa_juridica" />
                <div className="flex items-center gap-2 flex-nowrap">
                  <div style={{ width: 110 }}>
                    <label className="sr-only">Sequência da pessoa jurídica</label>
                    <input
                      inputMode="numeric"
                      maxLength={10}
                      className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 transition focus:border-[#003056] focus:outline-none"
                      value={colaboradorFilterForm.nr_seq_pessoa_juridica}
                      onChange={(e) => setColaboradorFilterForm({ ...colaboradorFilterForm, nr_seq_pessoa_juridica: e.target.value.replace(/\D/g, '') })}
                    />
                  </div>
                  <div className="relative flex-1 min-w-0">
                    <label className="sr-only">Razão social da pessoa jurídica</label>
                    <input
                      readOnly
                      className="w-full rounded-[3px] border border-slate-300 bg-slate-100 px-2 pr-[62px] py-1.5 text-sm text-slate-700 transition focus:border-[#003056] focus:outline-none"
                      value={pessoasJuridicas.find((p) => String(p.nr_sequencia) === colaboradorFilterForm.nr_seq_pessoa_juridica)?.ds_razao_social ?? ''}
                    />
                    <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                      {colaboradorFilterForm.nr_seq_pessoa_juridica && (
                        <button
                          type="button"
                          onClick={() => openPessoaJuridicaView(Number(colaboradorFilterForm.nr_seq_pessoa_juridica))}
                          className="inline-flex h-[30px] w-[28px] items-center justify-center rounded-[3px] cursor-pointer icon-lookup"
                          aria-label="Visualizar pessoa jurídica"
                        >
                          <ViewIcon size={16} />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={openColaboradorFilterPessoaJuridicaLookup}
                        className="inline-flex h-[30px] w-[28px] items-center justify-center rounded-[3px] cursor-pointer icon-lookup"
                        aria-label="Localizar pessoa jurídica"
                      >
                        <SearchIcon size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="sm:col-span-6">
                <RotuloCampo texto="Data de admissão (início)" colecao="colaborador" campo="dt_admissao" />
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="DD/MM/AAAA"
                  className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none placeholder:text-[#aaa]"
                  value={colaboradorFilterForm.dt_admissao_inicio}
                  onChange={(e) => setColaboradorFilterForm({ ...colaboradorFilterForm, dt_admissao_inicio: applyDateMask(e.target.value) })}
                />
              </div>

              <div className="sm:col-span-6">
                <RotuloCampo texto="Data de admissão (fim)" colecao="colaborador" campo="dt_admissao" />
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="DD/MM/AAAA"
                  className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none placeholder:text-[#aaa]"
                  value={colaboradorFilterForm.dt_admissao_fim}
                  onChange={(e) => setColaboradorFilterForm({ ...colaboradorFilterForm, dt_admissao_fim: applyDateMask(e.target.value) })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 px-[15px] pb-[15px]">
              <BotaoSalvarFiltro onClick={() => { void salvarFiltroDaTela('colaborador', { form: colaboradorFilterForm }, () => handleColaboradorFilterSubmit(EVENTO_SUBMIT)); }} />
              <button
                type="button"
                onClick={clearColaboradorFilter}
                className="px-4 py-2.5 text-sm text-black transition rounded-[3px] border-b button-cancel cursor-pointer min-w-[96px] justify-center"
                style={{ backgroundColor: '#bdbdbd', borderBottomColor: '#000' } as React.CSSProperties}
              >
                Limpar
              </button>
              <button
                type="submit"
                className="px-4 py-2.5 text-sm text-white transition rounded-[3px] border-b button-save cursor-pointer min-w-[96px] justify-center"
                style={{ backgroundColor: '#003056', borderBottomColor: '#000' } as React.CSSProperties}
              >
                Filtrar
              </button>
            </div>
          </form>
        </div>
      )}

      {periodoLetivoFilterModalOpen && view === "list" && activeSection === "estruturaAcademica" && alunoManageSelection === 'periodoLetivo' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="absolute inset-0 bg-black/40" onClick={closePeriodoLetivoFilterModal} />
          <form onSubmit={handlePeriodoLetivoFilterSubmit} className="relative w-full max-w-[980px] bg-white modal-dark p-0 shadow-xl shadow-black/20">
            <div className="flex items-center justify-between bg-[#ccc] px-[15px]">
              <h2 className="text-base font-semibold" style={{ color: '#000' }}>Filtro</h2>
              <button
                type="button"
                onClick={closePeriodoLetivoFilterModal}
                className="inline-flex h-9 items-center justify-center rounded-[3px] text-slate-700 transition cursor-pointer p-0 focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#066fc5] focus-visible:outline-offset-2"
                aria-label="Fechar filtro"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18" />
                  <path d="M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid gap-[15px] sm:grid-cols-12 p-[15px]">
              <div className="sm:col-span-2">
                <RotuloCampo texto="Sequência" colecao="periodo_letivo" campo="nr_sequencia" />
                <input
                  inputMode="numeric"
                  maxLength={10}
                  className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none"
                  value={periodoLetivoFilterForm.nr_sequencia}
                  onChange={(e) => setPeriodoLetivoFilterForm({ ...periodoLetivoFilterForm, nr_sequencia: e.target.value })}
                />
              </div>
              <div className="sm:col-span-2">
                <RotuloCampo texto="Ano" colecao="periodo_letivo" campo="nr_ano" />
                <input
                  inputMode="numeric"
                  maxLength={4}
                  className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none"
                  value={periodoLetivoFilterForm.nr_ano}
                  onChange={(e) => setPeriodoLetivoFilterForm({ ...periodoLetivoFilterForm, nr_ano: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                />
              </div>
              <div className="sm:col-span-5">
                <RotuloCampo texto="Descrição" colecao="periodo_letivo" campo="ds_periodo_letivo" />
                <input
                  className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none"
                  value={periodoLetivoFilterForm.ds_periodo_letivo}
                  onChange={(e) => setPeriodoLetivoFilterForm({ ...periodoLetivoFilterForm, ds_periodo_letivo: e.target.value })}
                />
              </div>
              <div className="sm:col-span-3">
                <RotuloCampo texto="Status" colecao="periodo_letivo" campo="ie_status" />
                <Select
                  value={periodoLetivoFilterForm.ie_status}
                  onChange={(v) => setPeriodoLetivoFilterForm({ ...periodoLetivoFilterForm, ie_status: v })}
                  options={STATUS_PERIODO_LETIVO_OPTIONS}
                  showPlaceholder
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 px-[15px] pb-[15px]">
              <BotaoSalvarFiltro onClick={() => { void salvarFiltroDaTela('periodo_letivo', { form: periodoLetivoFilterForm }, () => handlePeriodoLetivoFilterSubmit(EVENTO_SUBMIT)); }} />
              <button
                type="button"
                onClick={clearPeriodoLetivoFilter}
                className="px-4 py-2.5 text-sm text-black transition rounded-[3px] border-b button-cancel cursor-pointer min-w-[96px] justify-center"
                style={{ backgroundColor: '#bdbdbd', borderBottomColor: '#000' } as React.CSSProperties}
              >
                Limpar
              </button>
              <button
                type="submit"
                className="px-4 py-2.5 text-sm text-white transition rounded-[3px] border-b button-save cursor-pointer min-w-[96px] justify-center"
                style={{ backgroundColor: '#003056', borderBottomColor: '#000' } as React.CSSProperties}
              >
                Filtrar
              </button>
            </div>
          </form>
        </div>
      )}

      {pjFilterModalOpen && view === "list" && activeSection === "pessoaFisica" && (
        <PessoaJuridicaFilterModal
          open={pjFilterModalOpen}
          onClose={closePjFilterModal}
          filterForm={pjFilterForm}
          setFilterForm={setPjFilterForm}
          onSubmit={handlePjFilterSubmit}
          onSalvarFiltro={() => { void salvarFiltroDaTela('pessoa_juridica', { form: pjFilterForm }, () => handlePjFilterSubmit(EVENTO_SUBMIT)); }}
          onClear={clearPjFilter}
          onOpenCidadeLookup={openPjFilterCidadeLookup}
          estados={estados}
        />
      )}

      {adminFilterModalOpen && view === "list" && activeSection === "administracaoSistema" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="absolute inset-0 bg-black/40" onClick={closeAdminFilterModal} />
          <form onSubmit={handleAdminFilterSubmit} className="relative w-full max-w-[760px] bg-white modal-dark p-0 shadow-xl shadow-black/20">
            <div className="flex items-center justify-between bg-[#ccc] px-[15px]">
              <h2 className="text-base font-semibold" style={{ color: '#000' }}>Filtro</h2>
              <button
                type="button"
                onClick={closeAdminFilterModal}
                className="inline-flex h-9 items-center justify-center rounded-[3px] text-slate-700 transition cursor-pointer p-0 focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#066fc5] focus-visible:outline-offset-2"
                aria-label="Fechar filtro"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18" />
                  <path d="M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid gap-[15px] sm:grid-cols-12 p-[15px]">
              <div className="sm:col-span-12">
                <div className="flex flex-col gap-3 sm:flex-row">
                  <div className="shrink-0" style={{ flex: '0 0 10%' }}>
                    <RotuloCampo texto="Sequência" colecao="usuario" campo="nr_sequencia" />
                    <input
                      inputMode="numeric"
                      maxLength={10}
                      className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none"
                      value={adminFilterForm.nr_sequencia}
                      onChange={(e) => setAdminFilterForm({ ...adminFilterForm, nr_sequencia: e.target.value.replace(/\D/g, '') })}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <RotuloCampo texto="Usuário" colecao="usuario" campo="ds_usuario" />
                    <input
                      className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none"
                      value={adminFilterForm.ds_usuario}
                      onChange={(e) => setAdminFilterForm({ ...adminFilterForm, ds_usuario: e.target.value })}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <RotuloCampo texto="Usuário alternativo" colecao="usuario" campo="ds_usuario_alternativo" />
                    <input
                      className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none"
                      value={adminFilterForm.ds_usuario_alternativo}
                      onChange={(e) => setAdminFilterForm({ ...adminFilterForm, ds_usuario_alternativo: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="sm:col-span-12">
                <RotuloCampo texto="Pessoa física" colecao="usuario" campo="nr_seq_pessoa_fisica" />
                <div className="flex items-center gap-2 flex-nowrap">
                  <div style={{ width: 72 }}>
                    <label className="sr-only">Código da pessoa física</label>
                    <input
                      inputMode="numeric"
                      maxLength={10}
                      className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 transition focus:border-[#003056] focus:outline-none"
                      value={adminFilterForm.nr_seq_pessoa_fisica}
                      onChange={(e) => setAdminFilterForm({ ...adminFilterForm, nr_seq_pessoa_fisica: e.target.value.replace(/\D/g, '') })}
                    />
                  </div>
                  <div className="relative flex-1 min-w-0">
                    <label className="sr-only">Nome da pessoa física</label>
                    <input
                      readOnly
                      className="w-full rounded-[3px] border border-slate-300 bg-slate-100 px-2 pr-10 py-1.5 text-sm text-slate-700 transition focus:border-[#003056] focus:outline-none"
                      value={pessoasFisicas.find((p) => String(p.nr_sequencia) === adminFilterForm.nr_seq_pessoa_fisica)?.ds_nome ?? ''}
                    />
                    <button
                      type="button"
                      onClick={openAdminPessoaFisicaLookup}
                      className="absolute right-1 top-1/2 -translate-y-1/2 inline-flex h-[34px] w-[34px] items-center justify-center rounded-[3px] cursor-pointer text-black"
                      aria-label="Localizar pessoa física"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="7" />
                        <path d="m21 21-4.3-4.3" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              <div className="sm:col-span-12">
                <RotuloCampo texto="Status" colecao="usuario" campo="ie_status" />
                <div className="flex items-center gap-4 mb-3">
                  <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="radio"
                      name="admin_ie_status"
                      value="T"
                      checked={adminFilterForm.ie_status === 'T'}
                      onChange={() => setAdminFilterForm({ ...adminFilterForm, ie_status: 'T' })}
                    />
                    <span>Todos</span>
                  </label>
                  <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="radio"
                      name="admin_ie_status"
                      value="A"
                      checked={adminFilterForm.ie_status === 'A'}
                      onChange={() => setAdminFilterForm({ ...adminFilterForm, ie_status: 'A' })}
                    />
                    <span>Ativo</span>
                  </label>
                  <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="radio"
                      name="admin_ie_status"
                      value="B"
                      checked={adminFilterForm.ie_status === 'B'}
                      onChange={() => setAdminFilterForm({ ...adminFilterForm, ie_status: 'B' })}
                    />
                    <span>Bloqueado</span>
                  </label>
                  <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="radio"
                      name="admin_ie_status"
                      value="I"
                      checked={adminFilterForm.ie_status === 'I'}
                      onChange={() => setAdminFilterForm({ ...adminFilterForm, ie_status: 'I' })}
                    />
                    <span>Inativo</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 px-[15px] pb-[15px]">
              <BotaoSalvarFiltro onClick={() => { void salvarFiltroDaTela('as_usuario', { form: adminFilterForm }, () => handleAdminFilterSubmit(EVENTO_SUBMIT)); }} />
              <button
                type="button"
                onClick={clearAdminFilter}
                className="px-4 py-2.5 text-sm text-black transition rounded-[3px] border-b button-cancel cursor-pointer min-w-[96px] justify-center"
                style={{ backgroundColor: '#bdbdbd', borderBottomColor: '#000' } as React.CSSProperties}
              >
                Limpar
              </button>
              <button
                type="submit"
                className="px-4 py-2.5 text-sm text-white transition rounded-[3px] border-b button-save cursor-pointer min-w-[96px] justify-center"
                style={{ backgroundColor: '#003056', borderBottomColor: '#000' } as React.CSSProperties}
              >
                Filtrar
              </button>
            </div>
          </form>
        </div>
      )}

      {perfilFilterModalOpen && view === "list" && activeSection === "administracaoSistema" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="absolute inset-0 bg-black/40" onClick={closePerfilFilterModal} />
          <form onSubmit={handlePerfilFilterSubmit} className="relative w-full max-w-[760px] bg-white modal-dark p-0 shadow-xl shadow-black/20">
            <div className="flex items-center justify-between bg-[#ccc] px-[15px]">
              <h2 className="text-base font-semibold" style={{ color: '#000' }}>Filtro</h2>
              <button
                type="button"
                onClick={closePerfilFilterModal}
                className="inline-flex h-9 items-center justify-center rounded-[3px] text-slate-700 transition cursor-pointer p-0 focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#066fc5] focus-visible:outline-offset-2"
                aria-label="Fechar filtro"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18" />
                  <path d="M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid gap-[15px] sm:grid-cols-12 p-[15px]">
              <div className="sm:col-span-3">
                <RotuloCampo texto="Sequência" colecao="perfil" campo="nr_sequencia" />
                <input
                  inputMode="numeric"
                  maxLength={10}
                  className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none"
                  value={perfilFilterForm.nr_sequencia}
                  onChange={(e) => setPerfilFilterForm({ ...perfilFilterForm, nr_sequencia: e.target.value.replace(/\D/g, '') })}
                />
              </div>
              <div className="sm:col-span-9">
                <RotuloCampo texto="Perfil" colecao="perfil" campo="ds_perfil" />
                <input
                  className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none"
                  value={perfilFilterForm.ds_perfil}
                  onChange={(e) => setPerfilFilterForm({ ...perfilFilterForm, ds_perfil: e.target.value })}
                />
              </div>

              <div className="sm:col-span-12">
                <RotuloCampo texto="Status" colecao="perfil" campo="ie_status" />
                <div className="flex items-center gap-4 mb-3">
                  <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="radio"
                      name="perfil_ie_status"
                      value="T"
                      checked={perfilFilterForm.ie_status === 'T'}
                      onChange={() => setPerfilFilterForm({ ...perfilFilterForm, ie_status: 'T' })}
                    />
                    <span>Todos</span>
                  </label>
                  <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="radio"
                      name="perfil_ie_status"
                      value="A"
                      checked={perfilFilterForm.ie_status === 'A'}
                      onChange={() => setPerfilFilterForm({ ...perfilFilterForm, ie_status: 'A' })}
                    />
                    <span>Ativo</span>
                  </label>
                  <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="radio"
                      name="perfil_ie_status"
                      value="I"
                      checked={perfilFilterForm.ie_status === 'I'}
                      onChange={() => setPerfilFilterForm({ ...perfilFilterForm, ie_status: 'I' })}
                    />
                    <span>Inativo</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 px-[15px] pb-[15px]">
              <BotaoSalvarFiltro onClick={() => { void salvarFiltroDaTela('as_perfil', { form: perfilFilterForm }, () => handlePerfilFilterSubmit(EVENTO_SUBMIT)); }} />
              <button
                type="button"
                onClick={clearPerfilFilter}
                className="px-4 py-2.5 text-sm text-black transition rounded-[3px] border-b button-cancel cursor-pointer min-w-[96px] justify-center"
                style={{ backgroundColor: '#bdbdbd', borderBottomColor: '#000' } as React.CSSProperties}
              >
                Limpar
              </button>
              <button
                type="submit"
                className="px-4 py-2.5 text-sm text-white transition rounded-[3px] border-b button-save cursor-pointer min-w-[96px] justify-center"
                style={{ backgroundColor: '#003056', borderBottomColor: '#000' } as React.CSSProperties}
              >
                Filtrar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Filtro de Ativos ── */}
      {ativoFilterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="absolute inset-0 bg-black/40" onClick={closeAtivoFilterModal} />
          <form onSubmit={(e) => { e.preventDefault(); applyAtivoFilter(); }} className="relative w-full max-w-[1100px] bg-white modal-dark p-0 shadow-xl shadow-black/20 max-h-[90vh] flex flex-col">
            <div className="flex-shrink-0 flex items-center justify-between bg-[#ccc] px-[15px]">
              <h2 className="text-base font-semibold" style={{ color: '#000' }}>Filtro</h2>
              <button type="button" onClick={closeAtivoFilterModal} className="inline-flex h-9 items-center justify-center rounded-[3px] text-slate-700 transition cursor-pointer p-0 focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#066fc5] focus-visible:outline-offset-2" aria-label="Fechar filtro">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <div className="grid gap-[15px] sm:grid-cols-12 p-[15px]">
                <div className="sm:col-span-3">
                  <RotuloCampo texto="Sequência" colecao="pat_ativo" campo="nr_sequencia" />
                  <input inputMode="numeric" maxLength={10} className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none" value={ativoFilterForm.nr_sequencia} onChange={(e) => setAtivoFilterForm({ ...ativoFilterForm, nr_sequencia: e.target.value })} />
                </div>
                <div className="sm:col-span-3">
                  <RotuloCampo texto="Código externo" colecao="pat_ativo" campo="cd_externo" />
                  <input className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none" value={ativoFilterForm.cd_externo} onChange={(e) => setAtivoFilterForm({ ...ativoFilterForm, cd_externo: e.target.value })} />
                </div>
                <div className="sm:col-span-6">
                  <RotuloCampo texto="Descrição" colecao="pat_ativo" campo="ds_ativo" />
                  <input className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none" value={ativoFilterForm.ds_ativo} onChange={(e) => setAtivoFilterForm({ ...ativoFilterForm, ds_ativo: e.target.value })} />
                </div>
                <div className="sm:col-span-4">
                  <RotuloCampo texto="Modelo" colecao="pat_ativo" campo="ds_modelo" />
                  <input className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none" value={ativoFilterForm.ds_modelo} onChange={(e) => setAtivoFilterForm({ ...ativoFilterForm, ds_modelo: e.target.value })} />
                </div>
                <div className="sm:col-span-4">
                  <RotuloCampo texto="Nº de série" colecao="pat_ativo" campo="nr_serie" />
                  <input className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none" value={ativoFilterForm.nr_serie} onChange={(e) => setAtivoFilterForm({ ...ativoFilterForm, nr_serie: e.target.value })} />
                </div>
                <div className="sm:col-span-4">
                  <RotuloCampo texto="QR Code" colecao="pat_ativo" campo="ds_qr_code" />
                  <input className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none" value={ativoFilterForm.ds_qr_code} onChange={(e) => setAtivoFilterForm({ ...ativoFilterForm, ds_qr_code: e.target.value })} />
                </div>
                <div className="sm:col-span-4">
                  <RotuloCampo texto="Código de barras" colecao="pat_ativo" campo="ds_codigo_barras" />
                  <input className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none" value={ativoFilterForm.ds_codigo_barras} onChange={(e) => setAtivoFilterForm({ ...ativoFilterForm, ds_codigo_barras: e.target.value })} />
                </div>
                <div className="sm:col-span-4">
                  <RotuloCampo texto="Data aquisição (início)" colecao="pat_ativo" campo="dt_aquisicao" />
                  <input type="text" inputMode="numeric" maxLength={10} placeholder="DD/MM/AAAA" className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none" value={ativoFilterForm.dt_aquisicao_inicio} onChange={(e) => setAtivoFilterForm({ ...ativoFilterForm, dt_aquisicao_inicio: applyDateMask(e.target.value) })} />
                </div>
                <div className="sm:col-span-4">
                  <RotuloCampo texto="Data aquisição (fim)" colecao="pat_ativo" campo="dt_aquisicao" />
                  <input type="text" inputMode="numeric" maxLength={10} placeholder="DD/MM/AAAA" className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none" value={ativoFilterForm.dt_aquisicao_fim} onChange={(e) => setAtivoFilterForm({ ...ativoFilterForm, dt_aquisicao_fim: applyDateMask(e.target.value) })} />
                </div>
                <div className="sm:col-span-4">
                  <RotuloCampo texto="Data garantia (início)" colecao="pat_ativo" campo="dt_garantia" />
                  <input type="text" inputMode="numeric" maxLength={10} placeholder="DD/MM/AAAA" className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none" value={ativoFilterForm.dt_garantia_inicio} onChange={(e) => setAtivoFilterForm({ ...ativoFilterForm, dt_garantia_inicio: applyDateMask(e.target.value) })} />
                </div>
                <div className="sm:col-span-4">
                  <RotuloCampo texto="Data garantia (fim)" colecao="pat_ativo" campo="dt_garantia" />
                  <input type="text" inputMode="numeric" maxLength={10} placeholder="DD/MM/AAAA" className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none" value={ativoFilterForm.dt_garantia_fim} onChange={(e) => setAtivoFilterForm({ ...ativoFilterForm, dt_garantia_fim: applyDateMask(e.target.value) })} />
                </div>
                <div className="sm:col-span-4">
                  <RotuloCampo texto="Status" colecao="pat_ativo" campo="ie_status" />
                  <Select value={ativoFilterForm.ie_status} onChange={(v) => setAtivoFilterForm({ ...ativoFilterForm, ie_status: v })} options={[{ value: 'T', label: '---' }, ...ATIVO_STATUS_OPTIONS]} showPlaceholder={false} visibleOptions={6} forceOpenUp />
                </div>
                <div className="sm:col-span-4">
                  <RotuloCampo texto="Categoria" colecao="pat_ativo" campo="nr_seq_categoria" />
                  <Select value={ativoFilterForm.nr_seq_categoria} onChange={(v) => setAtivoFilterForm({ ...ativoFilterForm, nr_seq_categoria: v })} options={cgFilterOptions(categoriasAtivos, (op) => op.ds_categoria)} visibleOptions={6} forceOpenUp />
                </div>
                <div className="sm:col-span-4">
                  <RotuloCampo texto="Localização" colecao="pat_ativo" campo="nr_seq_localizacao" />
                  <Select value={ativoFilterForm.nr_seq_localizacao} onChange={(v) => setAtivoFilterForm({ ...ativoFilterForm, nr_seq_localizacao: v })} options={cgFilterOptions(localizacoes, (op) => op.ds_localizacao)} visibleOptions={6} forceOpenUp />
                </div>
                <div className="sm:col-span-4">
                  <RotuloCampo texto="Marca" colecao="pat_ativo" campo="nr_seq_marca" />
                  <Select value={ativoFilterForm.nr_seq_marca} onChange={(v) => setAtivoFilterForm({ ...ativoFilterForm, nr_seq_marca: v })} options={cgFilterOptions(marcas, (op) => op.ds_marca)} visibleOptions={6} forceOpenUp />
                </div>
                <div className="sm:col-span-12">
                  <RotuloCampo texto="Responsável" colecao="pat_ativo" campo="responsaveis" />
                  <div className="flex items-center gap-2 flex-nowrap">
                    <div style={{ width: 110 }}>
                      <input inputMode="numeric" maxLength={10} className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 transition focus:border-[#003056] focus:outline-none" value={ativoFilterForm.nr_seq_responsavel} onChange={(e) => setAtivoFilterForm({ ...ativoFilterForm, nr_seq_responsavel: e.target.value.replace(/\D/g, '').slice(0, 10) })} />
                    </div>
                    <div className="relative flex-1 min-w-0">
                      <input readOnly className="w-full rounded-[3px] border border-slate-300 bg-slate-100 px-2 pr-[62px] py-1.5 text-sm text-slate-700 transition focus:border-[#003056] focus:outline-none" value={nomeColaboradorPorSeq(Number(ativoFilterForm.nr_seq_responsavel) || undefined)} />
                      <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                        {ativoFilterForm.nr_seq_responsavel && (
                          <button type="button" onClick={() => openColaboradorView(Number(ativoFilterForm.nr_seq_responsavel))} className="inline-flex h-[30px] w-[28px] items-center justify-center rounded-[3px] cursor-pointer icon-lookup" aria-label="Visualizar responsável">
                            <ViewIcon size={16} />
                          </button>
                        )}
                        <button type="button" onClick={openAtivoFilterResponsavelLookup} className="inline-flex h-[30px] w-[28px] items-center justify-center rounded-[3px] cursor-pointer icon-lookup" aria-label="Localizar responsável">
                          <SearchIcon size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="sm:col-span-12">
                  <RotuloCampo texto="Fornecedor" colecao="pat_ativo" campo="nr_seq_fornecedor" />
                  <div className="flex items-center gap-2 flex-nowrap">
                    <div style={{ width: 110 }}>
                      <input inputMode="numeric" maxLength={10} className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 transition focus:border-[#003056] focus:outline-none" value={ativoFilterForm.nr_seq_fornecedor} onChange={(e) => setAtivoFilterForm({ ...ativoFilterForm, nr_seq_fornecedor: e.target.value.replace(/\D/g, '').slice(0, 10) })} />
                    </div>
                    <div className="relative flex-1 min-w-0">
                      <input readOnly className="w-full rounded-[3px] border border-slate-300 bg-slate-100 px-2 pr-[62px] py-1.5 text-sm text-slate-700 transition focus:border-[#003056] focus:outline-none" value={nomeColaboradorPorSeq(Number(ativoFilterForm.nr_seq_fornecedor) || undefined)} />
                      <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                        {ativoFilterForm.nr_seq_fornecedor && (
                          <button type="button" onClick={() => openColaboradorView(Number(ativoFilterForm.nr_seq_fornecedor))} className="inline-flex h-[30px] w-[28px] items-center justify-center rounded-[3px] cursor-pointer icon-lookup" aria-label="Visualizar fornecedor">
                            <ViewIcon size={16} />
                          </button>
                        )}
                        <button type="button" onClick={() => openEnviarManutPrestadorLookup('ativoFilterFornecedor')} className="inline-flex h-[30px] w-[28px] items-center justify-center rounded-[3px] cursor-pointer icon-lookup" aria-label="Localizar fornecedor">
                          <SearchIcon size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="sm:col-span-4">
                  <RotuloCampo texto="Endereço MAC" colecao="pat_ativo" campo="ds_endereco_mac" />
                  <input maxLength={12} className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none" value={ativoFilterForm.ds_endereco_mac} onChange={(e) => setAtivoFilterForm({ ...ativoFilterForm, ds_endereco_mac: e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() })} />
                </div>
                <div className="sm:col-span-4"><RotuloCampo texto="IPv4" colecao="pat_ativo" campo="ds_ip" />
                   <input className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none" value={ativoFilterForm.ds_ip} onChange={(e) => setAtivoFilterForm({ ...ativoFilterForm, ds_ip: applyIPv4Mask(e.target.value) })} />
                </div>
                <div className="sm:col-span-4">
                  <RotuloCampo texto="Sistema operacional" colecao="pat_ativo" campo="nr_seq_sistema_operacional" />
                  <Select value={ativoFilterForm.nr_seq_sistema_operacional} onChange={(v) => setAtivoFilterForm({ ...ativoFilterForm, nr_seq_sistema_operacional: v })} options={sistemasOperacionais.filter((s) => s.ie_status === 'A').sort((a, b) => (a.ds_sistema_operacional ?? '').localeCompare(b.ds_sistema_operacional ?? '', 'pt-BR')).map((s) => ({ value: String(s.nr_sequencia), label: s.ds_sistema_operacional ?? '' }))} visibleOptions={6} forceOpenUp />
                </div>
              </div>
            </div>
            <div className="flex-shrink-0 flex justify-end gap-2 px-[15px] pb-[15px] pt-[15px]">
              <BotaoSalvarFiltro onClick={() => { void salvarFiltroDaTela('pat_ativo', { form: ativoFilterForm }, applyAtivoFilter); }} />
              <button type="button" onClick={clearAtivoFilter} className="px-4 py-2.5 text-sm text-black transition rounded-[3px] border-b button-cancel cursor-pointer min-w-[96px] justify-center" style={{ backgroundColor: '#bdbdbd', borderBottomColor: '#000' }}>Limpar</button>
              <button type="submit" className="px-4 py-2.5 text-sm text-white transition rounded-[3px] border-b button-save cursor-pointer min-w-[96px] justify-center" style={{ backgroundColor: '#003056', borderBottomColor: '#000' }}>Filtrar</button>
            </div>
          </form>
        </div>
      )}

      {/* ── Filtro de Manutenções ── */}
      {manutencaoFilterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="absolute inset-0 bg-black/40" onClick={closeManutencaoFilterModal} />
          <form onSubmit={(e) => { e.preventDefault(); applyManutencaoFilter(); }} className="relative w-full max-w-[920px] bg-white modal-dark p-0 shadow-xl shadow-black/20 max-h-[90vh] flex flex-col">
            <div className="flex-shrink-0 flex items-center justify-between bg-[#ccc] px-[15px]">
              <h2 className="text-base font-semibold" style={{ color: '#000' }}>Filtro</h2>
              <button type="button" onClick={closeManutencaoFilterModal} className="inline-flex h-9 items-center justify-center rounded-[3px] text-slate-700 transition cursor-pointer p-0 focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#066fc5] focus-visible:outline-offset-2" aria-label="Fechar filtro">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <div className="grid gap-[15px] sm:grid-cols-12 p-[15px]">
                <div className="sm:col-span-3">
                  <RotuloCampo texto="Sequência" colecao="pat_manutencao" campo="nr_sequencia" />
                  <input inputMode="numeric" maxLength={10} className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none" value={manutencaoFilterForm.nr_sequencia} onChange={(e) => setManutencaoFilterForm({ ...manutencaoFilterForm, nr_sequencia: e.target.value })} />
                </div>
                <div className="sm:col-span-9">
                  <RotuloCampo texto="Ativo" colecao="pat_manutencao" campo="nr_seq_ativo" />
                  <div className="flex items-center gap-2 flex-nowrap">
                    <div style={{ width: 110 }}>
                      <input inputMode="numeric" maxLength={10} className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 transition focus:border-[#003056] focus:outline-none" value={manutencaoFilterForm.nr_seq_ativo} onChange={(e) => setManutencaoFilterForm({ ...manutencaoFilterForm, nr_seq_ativo: e.target.value.replace(/\D/g, '').slice(0, 10) })} />
                    </div>
                    <div className="relative flex-1 min-w-0">
                      <input readOnly className="w-full rounded-[3px] border border-slate-300 bg-slate-100 px-2 pr-[62px] py-1.5 text-sm text-slate-700 transition focus:border-[#003056] focus:outline-none" value={manutencaoFilterForm.nr_seq_ativo ? (ativos.find((a) => String(a.nr_sequencia) === manutencaoFilterForm.nr_seq_ativo)?.ds_ativo ?? '') : ''} />
                      <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                        {manutencaoFilterForm.nr_seq_ativo && (
                          <button type="button" onClick={() => { const a = ativos.find((at) => String(at.nr_sequencia) === manutencaoFilterForm.nr_seq_ativo); if (a) setAtivoView(a); }} className="inline-flex h-[30px] w-[28px] items-center justify-center rounded-[3px] cursor-pointer icon-lookup" aria-label="Visualizar ativo">
                            <ViewIcon size={16} />
                          </button>
                        )}
                        <button type="button" onClick={openManutencaoFilterAtivoLookup} className="inline-flex h-[30px] w-[28px] items-center justify-center rounded-[3px] cursor-pointer icon-lookup" aria-label="Localizar ativo">
                          <SearchIcon size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="sm:col-span-12">
                  <RotuloCampo texto="Prestador de serviço" colecao="pat_manutencao" campo="nr_seq_prestador_servico" />
                  <div className="flex items-center gap-2 flex-nowrap">
                    <div style={{ width: 110 }}>
                      <input inputMode="numeric" maxLength={10} className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 transition focus:border-[#003056] focus:outline-none" value={manutencaoFilterForm.nr_seq_prestador_servico} onChange={(e) => setManutencaoFilterForm({ ...manutencaoFilterForm, nr_seq_prestador_servico: e.target.value.replace(/\D/g, '').slice(0, 10) })} />
                    </div>
                    <div className="relative flex-1 min-w-0">
                      <input readOnly className="w-full rounded-[3px] border border-slate-300 bg-slate-100 px-2 pr-[62px] py-1.5 text-sm text-slate-700 transition focus:border-[#003056] focus:outline-none" value={manutencaoFilterForm.nr_seq_prestador_servico ? (() => { const seq = Number(manutencaoFilterForm.nr_seq_prestador_servico); const col = colaboradores.find((c) => c.nr_sequencia === seq); if (col) { const pf = pessoasFisicas.find((p) => p.nr_sequencia === col.nr_seq_pessoa_fisica); return pf?.ds_nome ?? ''; } const pf = pessoasFisicas.find((p) => String(p.nr_sequencia) === manutencaoFilterForm.nr_seq_prestador_servico); return pf?.ds_nome ?? ''; })() : ''} />
                      <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                        {manutencaoFilterForm.nr_seq_prestador_servico && (
                          <button type="button" onClick={() => openPessoaFisicaView(Number(manutencaoFilterForm.nr_seq_prestador_servico))} className="inline-flex h-[30px] w-[28px] items-center justify-center rounded-[3px] cursor-pointer icon-lookup" aria-label="Visualizar prestador de serviço">
                            <ViewIcon size={16} />
                          </button>
                        )}
                        <button type="button" onClick={openManutencaoFilterPrestadorLookup} className="inline-flex h-[30px] w-[28px] items-center justify-center rounded-[3px] cursor-pointer icon-lookup" aria-label="Localizar prestador de serviço">
                          <SearchIcon size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="sm:col-span-3">
                  <RotuloCampo texto="Data envio (início)" colecao="pat_manutencao" campo="dt_envio" />
                  <input type="text" inputMode="numeric" maxLength={10} placeholder="DD/MM/AAAA" className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none" value={manutencaoFilterForm.dt_envio_inicio} onChange={(e) => setManutencaoFilterForm({ ...manutencaoFilterForm, dt_envio_inicio: applyDateMask(e.target.value) })} />
                </div>
                <div className="sm:col-span-3">
                  <RotuloCampo texto="Data envio (fim)" colecao="pat_manutencao" campo="dt_envio" />
                  <input type="text" inputMode="numeric" maxLength={10} placeholder="DD/MM/AAAA" className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none" value={manutencaoFilterForm.dt_envio_fim} onChange={(e) => setManutencaoFilterForm({ ...manutencaoFilterForm, dt_envio_fim: applyDateMask(e.target.value) })} />
                </div>
                <div className="sm:col-span-3">
                  <RotuloCampo texto="Data término (início)" colecao="pat_manutencao" campo="dt_termino" />
                  <input type="text" inputMode="numeric" maxLength={10} placeholder="DD/MM/AAAA" className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none" value={manutencaoFilterForm.dt_termino_inicio} onChange={(e) => setManutencaoFilterForm({ ...manutencaoFilterForm, dt_termino_inicio: applyDateMask(e.target.value) })} />
                </div>
                <div className="sm:col-span-3">
                  <RotuloCampo texto="Data término (fim)" colecao="pat_manutencao" campo="dt_termino" />
                  <input type="text" inputMode="numeric" maxLength={10} placeholder="DD/MM/AAAA" className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none" value={manutencaoFilterForm.dt_termino_fim} onChange={(e) => setManutencaoFilterForm({ ...manutencaoFilterForm, dt_termino_fim: applyDateMask(e.target.value) })} />
                </div><div className="sm:col-span-4">
                   <RotuloCampo texto="Valor total (menor)" colecao="pat_manutencao" campo="vl_total" />
                   <input inputMode="decimal" className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none" value={manutencaoFilterForm.vl_total_menor} onChange={(e) => setManutencaoFilterForm({ ...manutencaoFilterForm, vl_total_menor: e.target.value.replace(/[^\d.,]/g, '') })} />
                </div><div className="sm:col-span-4">
                   <RotuloCampo texto="Valor total (maior)" colecao="pat_manutencao" campo="vl_total" />
                   <input inputMode="decimal" className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none" value={manutencaoFilterForm.vl_total_maior} onChange={(e) => setManutencaoFilterForm({ ...manutencaoFilterForm, vl_total_maior: e.target.value.replace(/[^\d.,]/g, '') })} />
                </div><div className="sm:col-span-4">
                   <RotuloCampo texto="Status" colecao="pat_manutencao" campo="ie_status_manutencao" />
                   <Select value={manutencaoFilterForm.ie_status_manutencao} onChange={(v) => setManutencaoFilterForm({ ...manutencaoFilterForm, ie_status_manutencao: v })} options={[{ value: 'T', label: '---' }, ...MANUTENCAO_STATUS_OPTIONS]} showPlaceholder={false} visibleOptions={6} forceOpenUp />
                </div>
              </div>
            </div>
            <div className="flex-shrink-0 flex justify-end gap-2 px-[15px] pb-[15px] pt-[15px]">
              <BotaoSalvarFiltro onClick={() => { void salvarFiltroDaTela('pat_manutencao', { form: manutencaoFilterForm }, applyManutencaoFilter); }} />
              <button type="button" onClick={clearManutencaoFilter} className="px-4 py-2.5 text-sm text-black transition rounded-[3px] border-b button-cancel cursor-pointer min-w-[96px] justify-center" style={{ backgroundColor: '#bdbdbd', borderBottomColor: '#000' }}>Limpar</button>
              <button type="submit" className="px-4 py-2.5 text-sm text-white transition rounded-[3px] border-b button-save cursor-pointer min-w-[96px] justify-center" style={{ backgroundColor: '#003056', borderBottomColor: '#000' }}>Filtrar</button>
            </div>
          </form>
        </div>
      )}

      {delegateFuncoesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="absolute inset-0 bg-black/40" onClick={closeDelegateFuncoesModal} />
          <div className="relative w-full max-w-[560px] bg-white modal-dark p-0 shadow-xl shadow-black/20 max-h-[90vh] flex flex-col">
            <div className="flex-shrink-0 flex items-center justify-between bg-[#ccc] px-[15px]">
              <h2 className="text-base font-semibold" style={{ color: '#000' }}>Delegar funções</h2>
              <button
                type="button"
                onClick={closeDelegateFuncoesModal}
                className="inline-flex h-9 items-center justify-center rounded-[3px] text-slate-700 transition cursor-pointer p-0"
                aria-label="Fechar"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18" />
                  <path d="M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-[15px] overflow-auto">
              <div className="grid gap-3">
                {SECTION_ORDER_ALPHABETICAL.map((section) => {
                  const enabled = delegateFuncoes.includes(section);
                  return (
                    <div
                      key={section}
                      role="button"
                      tabIndex={0}
                      onClick={() => toggleDelegateFuncao(section)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          toggleDelegateFuncao(section);
                        }
                      }}
                      className="flex cursor-pointer border bg-white transition focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#066fc5] focus-visible:outline-offset-2"
                      style={{
                        padding: '10px',
                        borderStyle: 'solid',
                        borderWidth: '1px',
                        borderTopColor: '#ccc',
                        borderLeftColor: '#ccc',
                        borderBottomColor: '#ccc',
                        borderRightColor: '#ccc',
                      }}
                    >
                      <div className="flex w-full items-center justify-between gap-2">
                        <div className="min-w-0 flex-1 text-sm truncate text-[#444]">{SECTION_DEFS[section].label}</div>
                        <button
                          type="button"
                          onClick={(e) => {
                            // O clique no ícone abre o modal de permissões da
                            // função, sem marcar/desmarcar a função.
                            e.stopPropagation();
                            if (delegateFuncoesPerfil) openPermissoesModal(delegateFuncoesPerfil, section);
                          }}
                          className="inline-flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-[3px] text-[#999] hover:text-[#666] focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#066fc5] focus-visible:outline-offset-2"
                          aria-label={`Permissões da função ${SECTION_DEFS[section].label}`}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="21" x2="14" y1="4" y2="4" />
                            <line x1="10" x2="3" y1="4" y2="4" />
                            <line x1="21" x2="12" y1="12" y2="12" />
                            <line x1="8" x2="3" y1="12" y2="12" />
                            <line x1="21" x2="16" y1="20" y2="20" />
                            <line x1="12" x2="3" y1="20" y2="20" />
                            <line x1="14" x2="14" y1="2" y2="6" />
                            <line x1="8" x2="8" y1="10" y2="14" />
                            <line x1="16" x2="16" y1="18" y2="22" />
                          </svg>
                        </button>
                        <label
                          className="flex shrink-0 cursor-pointer items-center"
                          onClick={(e) => {
                            // O clique no checkbox só liga/desliga a função.
                            e.stopPropagation();
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={enabled}
                            onChange={() => toggleDelegateFuncao(section)}
                            className="cg-checkbox"
                          />
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex-shrink-0 flex justify-end gap-2 px-[15px] pb-[15px] pt-[15px]">
              <button
                type="button"
                onClick={closeDelegateFuncoesModal}
                className="px-4 py-2.5 text-sm text-black transition rounded-[3px] border-b button-cancel cursor-pointer min-w-[96px] justify-center"
                style={{ backgroundColor: '#bdbdbd', borderBottomColor: '#000' } as React.CSSProperties}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDelegateFuncoesSave}
                disabled={delegateFuncoesSaving}
                className="px-4 py-2.5 text-sm text-white transition rounded-[3px] border-b button-save cursor-pointer min-w-[96px] justify-center disabled:cursor-default disabled:opacity-40"
                style={{ backgroundColor: '#003056', borderBottomColor: '#000' } as React.CSSProperties}
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {permissoesModalOpen && permissoesPerfil && permissoesFuncao && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="absolute inset-0 bg-black/40" onClick={closePermissoesModal} />
          <div className="relative w-full max-w-[560px] bg-white modal-dark p-0 shadow-xl shadow-black/20 max-h-[90vh] flex flex-col">
            <div className="flex-shrink-0 flex items-center justify-between bg-[#ccc] px-[15px]">
              <h2 className="text-base font-semibold" style={{ color: '#000' }}>Permissões da função</h2>
              <button
                type="button"
                onClick={closePermissoesModal}
                className="inline-flex h-9 items-center justify-center rounded-[3px] text-slate-700 transition cursor-pointer p-0"
                aria-label="Fechar"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18" />
                  <path d="M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-[15px] overflow-auto">
              {(() => {
                const defs = PERMISSOES_POR_FUNCAO[permissoesFuncao] ?? [];
                if (defs.length === 0) {
                  return (
                    <div className="flex min-h-[120px] items-center justify-center text-center text-sm text-slate-500">
                      As permissões desta função serão configuradas em breve.
                    </div>
                  );
                }
                const checkbox = (perm: PermissaoDef) => {
                  const checked = permissoesSelecionadas.includes(perm.key);
                  return (
                    <label
                      key={perm.key}
                      className="flex cursor-pointer select-none items-center gap-3 rounded-[3px] px-[6px] py-[4px] transition focus-within:outline focus-within:outline-2 focus-within:outline-[#066fc5] focus-within:outline-offset-2"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => togglePermissao(perm.key)}
                        className="cg-checkbox"
                      />
                      <span className="text-sm">{perm.label}</span>
                    </label>
                  );
                };
                // Seções em ordem alfabética pelo título (igual ao Detalhe da auditoria).
                const grupos = [...(PERMISSOES_GRUPOS[permissoesFuncao] ?? [])].sort((a, b) =>
                  a.titulo.localeCompare(b.titulo, 'pt-BR')
                );
                if (grupos.length > 0) {
                  return (
                    <div className="grid gap-4">
                      {grupos.map((grupo) => (
                        <div key={grupo.titulo}>
                          <div className="mb-1 text-sm font-medium" style={{ color: '#444' }}>{grupo.titulo}</div>
                          <div className="grid gap-2">
                            {grupo.chaves.map((chave) => {
                              const perm = defs.find((p) => p.key === chave);
                              return perm ? checkbox(perm) : null;
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                }
                return <div className="grid gap-2">{defs.map(checkbox)}</div>;
              })()}
            </div>

            <div className="flex-shrink-0 flex justify-end gap-2 px-[15px] pb-[15px] pt-[15px]">
              <button
                type="button"
                onClick={closePermissoesModal}
                className="px-4 py-2.5 text-sm text-black transition rounded-[3px] border-b button-cancel cursor-pointer min-w-[96px] justify-center"
                style={{ backgroundColor: '#bdbdbd', borderBottomColor: '#000' } as React.CSSProperties}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handlePermissoesSave}
                disabled={permissoesSaving}
                className="px-4 py-2.5 text-sm text-white transition rounded-[3px] border-b button-save cursor-pointer min-w-[96px] justify-center disabled:cursor-default disabled:opacity-40"
                style={{ backgroundColor: '#003056', borderBottomColor: '#000' } as React.CSSProperties}
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {cgFilterModalOpen && view === "list" && activeSection === "cadastrosGerais" && (
        <CadastroGeralFilterModal
          open={cgFilterModalOpen}
          onClose={closeCgFilterModal}
          filterForm={cgFilterForm}
          setFilterForm={setCgFilterForm}
          onSubmit={handleCgFilterSubmit}
          onSalvarFiltro={() => { void salvarFiltroDaTela('cadastros_gerais', { form: cgFilterForm }, () => handleCgFilterSubmit(EVENTO_SUBMIT)); }}
          onClear={clearCgFilter}
          colecao={cgCollection}
          campoDescricao={cgDescKey}
        />
      )}

      {cursoFilterModalOpen && view === "list" && activeSection === "estruturaAcademica" && alunoManageSelection === 'cursos' && (
        <CadastroGeralFilterModal
          open={cursoFilterModalOpen}
          onClose={() => setCursoFilterModalOpen(false)}
          filterForm={cursoFilterForm}
          setFilterForm={setCursoFilterForm}
          onSubmit={handleCursoFilterSubmit}
          onSalvarFiltro={() => { void salvarFiltroDaTela('curso', { form: cursoFilterForm }, () => handleCursoFilterSubmit(EVENTO_SUBMIT)); }}
          onClear={clearCursoFilter}
          colecao="curso"
          campoDescricao="ds_curso"
        />
      )}

      {disciplinaFilterModalOpen && view === "list" && activeSection === "estruturaAcademica" && alunoManageSelection === 'disciplinas' && (
        <CadastroGeralFilterModal
          open={disciplinaFilterModalOpen}
          onClose={() => setDisciplinaFilterModalOpen(false)}
          filterForm={disciplinaFilterForm}
          setFilterForm={setDisciplinaFilterForm}
          onSubmit={handleDisciplinaFilterSubmit}
          onSalvarFiltro={() => { void salvarFiltroDaTela('disciplina', { form: disciplinaFilterForm }, () => handleDisciplinaFilterSubmit(EVENTO_SUBMIT)); }}
          onClear={clearDisciplinaFilter}
          colecao="disciplina"
          campoDescricao="ds_disciplina"
          hideStatus
        />
      )}

      {turmaFilterModalOpen && view === "list" && activeSection === "estruturaAcademica" && alunoManageSelection === 'turmas' && (
        <CadastroGeralFilterModal
          open={turmaFilterModalOpen}
          onClose={() => setTurmaFilterModalOpen(false)}
          filterForm={turmaFilterForm}
          setFilterForm={setTurmaFilterForm}
          onSubmit={handleTurmaFilterSubmit}
          onSalvarFiltro={() => { void salvarFiltroDaTela('turma', { form: turmaFilterForm, extra: turmaFiltroExtra }, () => handleTurmaFilterSubmit(EVENTO_SUBMIT)); }}
          onClear={clearTurmaFilter}
          colecao="turma"
          campoDescricao="ds_turma"
          hideStatus
          extraFields={(
            <>
              <div className="sm:col-span-6">
                <RotuloCampo texto="Curso" colecao="turma" campo="nr_seq_curso" />
                <Select
                  value={turmaFiltroExtra.nr_seq_curso}
                  onChange={(v) => setTurmaFiltroExtra((f) => ({ ...f, nr_seq_curso: v }))}
                  options={opcoesDeReferencia(cursos, (c) => c.ds_curso, turmaFiltroExtra.nr_seq_curso)}
                />
              </div>
              <div className="sm:col-span-6">
                <RotuloCampo texto="Período letivo" colecao="turma" campo="nr_seq_periodo_letivo" />
                <Select
                  value={turmaFiltroExtra.nr_seq_periodo_letivo}
                  onChange={(v) => setTurmaFiltroExtra((f) => ({ ...f, nr_seq_periodo_letivo: v }))}
                  options={opcoesDeReferencia(periodosLetivos, (p) => p.ds_periodo_letivo, turmaFiltroExtra.nr_seq_periodo_letivo)}
                />
              </div>
            </>
          )}
        />
      )}

      {turmaDisciplinaFilterModalOpen && view === "list" && activeSection === "estruturaAcademica" && alunoManageSelection === 'turmasDisciplinas' && (
        <CadastroGeralFilterModal
          open={turmaDisciplinaFilterModalOpen}
          onClose={() => setTurmaDisciplinaFilterModalOpen(false)}
          filterForm={turmaDisciplinaFilterForm}
          setFilterForm={setTurmaDisciplinaFilterForm}
          onSubmit={handleTurmaDisciplinaFilterSubmit}
          onSalvarFiltro={() => { void salvarFiltroDaTela('turma_disciplina', { form: turmaDisciplinaFilterForm, extra: turmaDisciplinaFiltroExtra }, () => handleTurmaDisciplinaFilterSubmit(EVENTO_SUBMIT)); }}
          onClear={clearTurmaDisciplinaFilter}
          colecao="turma_disciplina"
          campoDescricao="nr_seq_turma"
          hideDescricao
          extraFields={(
            <>
              <div className="sm:col-span-9">
                <RotuloCampo texto="Turma" colecao="turma_disciplina" campo="nr_seq_turma" />
                <Select
                  value={turmaDisciplinaFiltroExtra.nr_seq_turma}
                  onChange={(v) => setTurmaDisciplinaFiltroExtra((f) => ({ ...f, nr_seq_turma: v }))}
                  options={opcoesDeReferencia(turmas, (t) => t.ds_turma, turmaDisciplinaFiltroExtra.nr_seq_turma)}
                />
              </div>
              <div className="sm:col-span-12">
                <RotuloCampo texto="Disciplina" colecao="turma_disciplina" campo="nr_seq_disciplina" />
                <Select
                  value={turmaDisciplinaFiltroExtra.nr_seq_disciplina}
                  onChange={(v) => setTurmaDisciplinaFiltroExtra((f) => ({ ...f, nr_seq_disciplina: v }))}
                  options={opcoesDeReferencia(disciplinas, (d) => d.ds_disciplina, turmaDisciplinaFiltroExtra.nr_seq_disciplina)}
                />
              </div>
              <div className="sm:col-span-12">
                <RotuloCampo texto="Período letivo" colecao="turma" campo="nr_seq_periodo_letivo" />
                <Select
                  value={turmaDisciplinaFiltroExtra.nr_seq_periodo_letivo}
                  onChange={(v) => setTurmaDisciplinaFiltroExtra((f) => ({ ...f, nr_seq_periodo_letivo: v }))}
                  options={opcoesDeReferencia(periodosLetivos, (p) => p.ds_periodo_letivo, turmaDisciplinaFiltroExtra.nr_seq_periodo_letivo)}
                />
              </div>
            </>
          )}
        />
      )}

      {copiaFilterModalOpen && view === "list" && activeSection === "controleCopias" && ccManageSelection === 'copias' && (
        <CadastroGeralFilterModal
          open={copiaFilterModalOpen}
          onClose={() => setCopiaFilterModalOpen(false)}
          filterForm={copiaFilterForm}
          setFilterForm={setCopiaFilterForm}
          onSubmit={handleCopiaFilterSubmit}
          onSalvarFiltro={() => { void salvarFiltroDaTela('copia', { form: copiaFilterForm, extra: copiaFiltroExtra }, () => handleCopiaFilterSubmit(EVENTO_SUBMIT)); }}
          onClear={clearCopiaFilter}
          colecao="copia"
          campoDescricao="nr_seq_solicitante"
          hideDescricao
          hideStatus
          extraFields={(
            <>
              <div className="sm:col-span-9">
                <RotuloCampo texto="Status" colecao="copia" campo="ie_status" />
                <Select
                  value={copiaFiltroExtra.ie_status}
                  onChange={(v) => setCopiaFiltroExtra((f) => ({ ...f, ie_status: v }))}
                  options={STATUS_COPIA_OPTIONS}
                />
              </div>
              <div className="sm:col-span-12">
                <RotuloCampo texto="Solicitante" colecao="copia" campo="nr_seq_solicitante" />
                <div className="flex items-center gap-2 flex-nowrap">
                  <div style={{ width: 110 }}>
                    <input inputMode="numeric" maxLength={10} className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 transition focus:border-[#003056] focus:outline-none" value={copiaFiltroExtra.nr_seq_solicitante} onChange={(e) => setCopiaFiltroExtra((f) => ({ ...f, nr_seq_solicitante: e.target.value.replace(/\D/g, '').slice(0, 10) }))} />
                  </div>
                  <div className="relative flex-1 min-w-0">
                    <input readOnly tabIndex={-1} className="w-full rounded-[3px] border border-slate-300 bg-slate-100 px-2 pr-[34px] py-1.5 text-sm text-slate-700 transition focus:outline-none" value={descricaoReferenciaCopia('nr_seq_solicitante', copiaFiltroExtra.nr_seq_solicitante)} />
                    <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                      <button type="button" onClick={() => openEnviarManutPrestadorLookup('copiaFiltroSolicitante')} className="inline-flex h-[30px] w-[28px] items-center justify-center rounded-[3px] cursor-pointer icon-lookup" aria-label="Localizar solicitante">
                        <SearchIcon size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="sm:col-span-12">
                <RotuloCampo texto="Turma x Disciplina" colecao="copia" campo="nr_seq_turma_disciplina" />
                <div className="flex items-center gap-2 flex-nowrap">
                  <div style={{ width: 110 }}>
                    <input inputMode="numeric" maxLength={10} className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 transition focus:border-[#003056] focus:outline-none" value={copiaFiltroExtra.nr_seq_turma_disciplina} onChange={(e) => setCopiaFiltroExtra((f) => ({ ...f, nr_seq_turma_disciplina: e.target.value.replace(/\D/g, '').slice(0, 10) }))} />
                  </div>
                  <div className="relative flex-1 min-w-0">
                    <input readOnly tabIndex={-1} className="w-full rounded-[3px] border border-slate-300 bg-slate-100 px-2 pr-[34px] py-1.5 text-sm text-slate-700 transition focus:outline-none" value={descricaoReferenciaCopia('nr_seq_turma_disciplina', copiaFiltroExtra.nr_seq_turma_disciplina)} />
                    <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                      <button type="button" onClick={() => setCopiaTurmaDisciplinaLookup('filtro')} className="inline-flex h-[30px] w-[28px] items-center justify-center rounded-[3px] cursor-pointer icon-lookup" aria-label="Localizar turma x disciplina">
                        <SearchIcon size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="sm:col-span-6">
                <RotuloCampo texto="Formato do papel" colecao="copia" campo="nr_seq_formato_papel" />
                <Select
                  value={copiaFiltroExtra.nr_seq_formato_papel}
                  onChange={(v) => setCopiaFiltroExtra((f) => ({ ...f, nr_seq_formato_papel: v }))}
                  options={opcoesDeReferencia(formatosPapel, (f) => f.ds_formato_papel, copiaFiltroExtra.nr_seq_formato_papel)}
                />
              </div>
              <div className="sm:col-span-6">
                <RotuloCampo texto="Tipo de papel" colecao="copia" campo="nr_seq_tipo_papel" />
                <Select
                  value={copiaFiltroExtra.nr_seq_tipo_papel}
                  onChange={(v) => setCopiaFiltroExtra((f) => ({ ...f, nr_seq_tipo_papel: v }))}
                  options={opcoesDeReferencia(tiposPapel, (t) => t.ds_tipo_papel, copiaFiltroExtra.nr_seq_tipo_papel)}
                />
              </div>
            </>
          )}
        />
      )}

      {/* Filtro de Gerenciador de Relatórios > Relatórios (na ordem pedida: Sequência, Descrição, Formato,
          Nome do arquivo, Formato do papel, Orientação, Status, Usuário criação e Usuário alteração). */}
      {relatorioFilterModalOpen && activeSection === "relatorio" && relatorioView === 'list' && (
        <CadastroGeralFilterModal
          open={relatorioFilterModalOpen}
          onClose={() => setRelatorioFilterModalOpen(false)}
          filterForm={relatorioFilterForm}
          setFilterForm={setRelatorioFilterForm}
          onSubmit={handleRelatorioFilterSubmit}
          onSalvarFiltro={() => { void salvarFiltroDaTela('relatorio', { form: relatorioFilterForm, extra: relatorioFiltroExtra }, () => handleRelatorioFilterSubmit(EVENTO_SUBMIT)); }}
          onClear={clearRelatorioFilter}
          colecao="relatorio"
          campoDescricao="ds_relatorio"
          hideStatus
          extraFields={(
            <>
              <div className="sm:col-span-3">
                <RotuloCampo texto="Formato" colecao="relatorio" campo="ie_formato" />
                <Select value={relatorioFiltroExtra.ie_formato} onChange={(v) => setRelatorioFiltroExtra((f) => ({ ...f, ie_formato: v }))} options={RELATORIO_FORMATO_FILTRO_OPTIONS} />
              </div>
              <div className="sm:col-span-9">
                <RotuloCampo texto="Nome do arquivo" colecao="relatorio" campo="ds_nome_arquivo" />
                <input className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none" value={relatorioFiltroExtra.ds_nome_arquivo} onChange={(e) => setRelatorioFiltroExtra((f) => ({ ...f, ds_nome_arquivo: e.target.value }))} />
              </div>
              <div className="sm:col-span-6">
                <RotuloCampo texto="Formato do papel" colecao="relatorio" campo="nr_seq_formato_papel" />
                <Select
                  value={relatorioFiltroExtra.nr_seq_formato_papel}
                  onChange={(v) => setRelatorioFiltroExtra((f) => ({ ...f, nr_seq_formato_papel: v }))}
                  options={opcoesDeReferencia(formatosPapel, (p) => p.ds_formato_papel, relatorioFiltroExtra.nr_seq_formato_papel)}
                />
              </div>
              <div className="sm:col-span-3">
                <RotuloCampo texto="Orientação" colecao="relatorio" campo="ie_orientacao" />
                <Select value={relatorioFiltroExtra.ie_orientacao} onChange={(v) => setRelatorioFiltroExtra((f) => ({ ...f, ie_orientacao: v }))} options={RELATORIO_ORIENTACAO_FILTRO_OPTIONS} />
              </div>
              <div className="sm:col-span-3">
                <RotuloCampo texto="Status" colecao="relatorio" campo="ie_status" />
                <Select value={relatorioFiltroExtra.ie_status} onChange={(v) => setRelatorioFiltroExtra((f) => ({ ...f, ie_status: v || 'T' }))} options={RELATORIO_STATUS_FILTRO_OPTIONS} showPlaceholder={false} />
              </div>
              <CampoLookupReferencia
                className="sm:col-span-12"
                rotulo={<RotuloCampo texto="Usuário criação" colecao="relatorio" campo="ds_usuario_criacao" />}
                ariaLocalizar="Localizar usuário criação"
                inputClass="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none"
                valor={relatorioFiltroExtra.nr_seq_usuario_criacao}
                descricao={dsUsuarioPorSeq(relatorioFiltroExtra.nr_seq_usuario_criacao)}
                onChange={(v) => setRelatorioFiltroExtra((f) => ({ ...f, nr_seq_usuario_criacao: v }))}
                onLocalizar={() => setRelatorioUsuarioLookup('nr_seq_usuario_criacao')}
              />
              <CampoLookupReferencia
                className="sm:col-span-12"
                rotulo={<RotuloCampo texto="Usuário alteração" colecao="relatorio" campo="ds_usuario_alteracao" />}
                ariaLocalizar="Localizar usuário alteração"
                inputClass="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none"
                valor={relatorioFiltroExtra.nr_seq_usuario_alteracao}
                descricao={dsUsuarioPorSeq(relatorioFiltroExtra.nr_seq_usuario_alteracao)}
                onChange={(v) => setRelatorioFiltroExtra((f) => ({ ...f, nr_seq_usuario_alteracao: v }))}
                onLocalizar={() => setRelatorioUsuarioLookup('nr_seq_usuario_alteracao')}
              />
            </>
          )}
        />
      )}

      {/* ── Lookup: Usuário (filtro de Relatórios: Usuário criação / Usuário alteração) ── */}
      {relatorioUsuarioLookup && (
        <ReferenciaLookupModal
          titulo="Usuário"
          colecao="usuario"
          campoDescricao="ds_usuario"
          registros={usuarios.map((u) => ({ nr_sequencia: u.nr_sequencia, descricao: u.ds_usuario || `#${u.nr_sequencia}`, ie_status: u.ie_status === 'I' ? 'Inativo' : 'Ativo' }))}
          colunas={[{ key: 'nr_sequencia', label: '#', dataClass: 'text-right' }, { key: 'descricao', label: 'Usuário' }, { key: 'ie_status', label: 'Status' }]}
          filtros={[{ key: 'descricao', rotulo: 'Usuário', campo: 'ds_usuario' }]}
          {...filtroDoReferenciaLookup('usuario')}
          onClose={() => setRelatorioUsuarioLookup(null)}
          onSelect={(item) => {
            setRelatorioFiltroExtra((f) => ({ ...f, [relatorioUsuarioLookup]: String(item.nr_sequencia) }));
            setRelatorioUsuarioLookup(null);
          }}
        />
      )}

      {categoriaFilterModalOpen && view === "list" && activeSection === "patrimonio" && ativoManageSelection === 'categoria' && (
        <CadastroGeralFilterModal
          open={categoriaFilterModalOpen}
          onClose={() => setCategoriaFilterModalOpen(false)}
          filterForm={categoriaFilterForm}
          setFilterForm={setCategoriaFilterForm}
          onSubmit={handleCategoriaFilterSubmit}
          onSalvarFiltro={() => { void salvarFiltroDaTela('pat_categoria', { form: categoriaFilterForm }, () => handleCategoriaFilterSubmit(EVENTO_SUBMIT)); }}
          onClear={clearCategoriaFilter}
          colecao="pat_categoria"
          campoDescricao="ds_categoria"
        />
      )}

      {delegatePerfisModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="absolute inset-0 bg-black/40" onClick={closeDelegatePerfisModal} />
          <div className="relative w-full max-w-[560px] bg-white modal-dark p-0 shadow-xl shadow-black/20 max-h-[90vh] flex flex-col">
            <div className="flex-shrink-0 flex items-center justify-between bg-[#ccc] px-[15px]">
              <h2 className="text-base font-semibold" style={{ color: '#000' }}>Delegar perfis</h2>
              <button
                type="button"
                onClick={closeDelegatePerfisModal}
                className="inline-flex h-9 items-center justify-center rounded-[3px] text-slate-700 transition cursor-pointer p-0"
                aria-label="Fechar"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18" />
                  <path d="M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-[15px] overflow-auto">
              {delegatePerfisDisponiveis.length === 0 ? (
                <div className="py-8 text-center text-sm text-slate-600">Nenhum perfil ativo encontrado.</div>
              ) : (
              <div className="grid gap-3">
                {delegatePerfisDisponiveis.map((perfil) => {
                    const enabled = delegatePerfis.includes(perfil.nr_sequencia);
                    return (
                      <div
                        key={perfil.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => toggleDelegatePerfil(perfil.nr_sequencia)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            toggleDelegatePerfil(perfil.nr_sequencia);
                          }
                        }}
                        className="flex cursor-pointer border bg-white transition focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#066fc5] focus-visible:outline-offset-2"
                        style={{
                          padding: '10px',
                          borderStyle: 'solid',
                          borderWidth: '1px',
                          borderTopColor: '#ccc',
                          borderLeftColor: '#ccc',
                          borderBottomColor: '#ccc',
                          borderRightColor: '#ccc',
                        }}
                      >
                        <div className="flex w-full items-center justify-between">
                          <div className="text-sm truncate text-slate-900">{perfil.ds_perfil}</div>
                          <label
                            className="flex shrink-0 cursor-pointer items-center"
                            onClick={(e) => {
                              // O clique no checkbox só liga/desliga o perfil.
                              e.stopPropagation();
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={enabled}
                              onChange={() => toggleDelegatePerfil(perfil.nr_sequencia)}
                              className="cg-checkbox"
                            />
                          </label>
                        </div>
                      </div>
                    );
                  })}
              </div>
              )}
            </div>

            <div className="flex-shrink-0 flex justify-end gap-2 px-[15px] pb-[15px] pt-[15px]">
              <button
                type="button"
                onClick={closeDelegatePerfisModal}
                className="px-4 py-2.5 text-sm text-black transition rounded-[3px] border-b button-cancel cursor-pointer min-w-[96px] justify-center"
                style={{ backgroundColor: '#bdbdbd', borderBottomColor: '#000' } as React.CSSProperties}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDelegatePerfisSave}
                disabled={delegatePerfisSaving}
                className="px-4 py-2.5 text-sm text-white transition rounded-[3px] border-b button-save cursor-pointer min-w-[96px] justify-center disabled:cursor-default disabled:opacity-40"
                style={{ backgroundColor: '#003056', borderBottomColor: '#000' } as React.CSSProperties}
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {duplicatePerfilModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="absolute inset-0 bg-black/40" onClick={closeDuplicatePerfilModal} />
          <form
            onSubmit={handleDuplicatePerfilSubmit}
            className="relative w-full max-w-[420px] bg-white modal-dark p-0 shadow-xl shadow-black/20"
          >
            <div className="flex items-center justify-between bg-[#ccc] px-[15px]">
              <h2 className="text-base font-semibold" style={{ color: '#000' }}>Duplicar perfil</h2>
              <button
                type="button"
                onClick={closeDuplicatePerfilModal}
                className="inline-flex h-9 items-center justify-center rounded-[3px] text-slate-700 transition cursor-pointer p-0 focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#066fc5] focus-visible:outline-offset-2"
                aria-label="Fechar duplicar perfil"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18" />
                  <path d="M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid gap-[15px] p-[15px]">
              <div>
                <RotuloCampo texto="Perfil" colecao="perfil" campo="ds_perfil" />
                <input
                  className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none"
                  value={duplicatePerfilName}
                  onChange={(e) => setDuplicatePerfilName(e.target.value)}
                  autoFocus
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 px-[15px] pb-[15px]">
              <button
                type="button"
                onClick={closeDuplicatePerfilModal}
                className="px-4 py-2.5 text-sm text-black transition rounded-[3px] border-b button-cancel cursor-pointer min-w-[96px] justify-center"
                style={{ backgroundColor: '#bdbdbd', borderBottomColor: '#000' } as React.CSSProperties}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={duplicatePerfilSaving || !duplicatePerfilName.trim()}
                className="px-4 py-2.5 text-sm text-white transition rounded-[3px] border-b button-save cursor-pointer min-w-[96px] justify-center disabled:cursor-default disabled:opacity-60"
                style={{ backgroundColor: '#003056', borderBottomColor: '#000' } as React.CSSProperties}
              >
                Salvar
              </button>
            </div>
          </form>
        </div>
      )}

      {secaoParaFechar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSecaoParaFechar(null)} />
          <div role="dialog" aria-modal="true" aria-label="Fechar função" className="relative w-full max-w-[420px] bg-white modal-dark p-0 shadow-xl shadow-black/20">
            <div className="flex items-center justify-between bg-[#ccc] px-[15px]">
              <h2 className="text-base font-semibold" style={{ color: '#000' }}>Fechar função</h2>
              <button
                type="button"
                onClick={() => setSecaoParaFechar(null)}
                className="inline-flex h-9 items-center justify-center rounded-[3px] text-slate-700 transition cursor-pointer p-0"
                aria-label="Fechar"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18" />
                  <path d="M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-[15px] pt-[15px]">
              <p className="text-sm text-slate-900">Tem certeza que deseja fechar a função {SECTION_DEFS[secaoParaFechar].label}?</p>
            </div>

            <div className="flex justify-end gap-2 px-[15px] pt-20 pb-[15px]">
              <button
                type="button"
                onClick={() => setSecaoParaFechar(null)}
                className="px-4 py-2.5 text-sm text-black transition rounded-[3px] border-b button-cancel cursor-pointer min-w-[96px] justify-center"
                style={{ backgroundColor: '#bdbdbd', borderBottomColor: '#000' } as React.CSSProperties}
              >
                Não
              </button>
              <button
                type="button"
                onClick={() => {
                  fecharSecao(secaoParaFechar);
                  setSecaoParaFechar(null);
                }}
                className="px-4 py-2.5 text-sm text-white transition rounded-[3px] border-b button-save cursor-pointer min-w-[96px] justify-center"
                style={{ backgroundColor: '#003056', borderBottomColor: '#000' } as React.CSSProperties}
              >
                Sim
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDeleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="absolute inset-0 bg-black/40" onClick={() => setConfirmDeleteOpen(false)} />
          <div className="relative w-full max-w-[420px] bg-white modal-dark p-0 shadow-xl shadow-black/20">
            <div className="flex items-center justify-between bg-[#ccc] px-[15px]">
              <h2 className="text-base font-semibold" style={{ color: '#000' }}>Excluir registro</h2>
              <button
                type="button"
                onClick={() => setConfirmDeleteOpen(false)}
                className="inline-flex h-9 items-center justify-center rounded-[3px] text-slate-700 transition cursor-pointer p-0"
                aria-label="Fechar"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18" />
                  <path d="M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-[15px] pt-[15px]">
              <p className="text-sm text-slate-900">{confirmDeleteMessage}</p>
            </div>

            <div className="flex justify-end gap-2 px-[15px] pt-20 pb-[15px]">
              <button
                type="button"
                onClick={() => setConfirmDeleteOpen(false)}
                className="px-4 py-2.5 text-sm text-black transition rounded-[3px] border-b button-cancel cursor-pointer min-w-[96px] justify-center"
                style={{ backgroundColor: '#bdbdbd', borderBottomColor: '#000' } as React.CSSProperties}
              >
                Não
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirmDeleteOpen(false);
                  if (confirmDeleteAction) {
                    confirmDeleteAction();
                  } else if (confirmDeleteType === 'campo') {
                    const extra = confirmDeleteExtra;
                    // Excluir do banco
                    if (extra?._idRegistro) {
                      import('@/services/relatorioServiceBandas').then(({ excluirElementoComCopias }) => {
                        excluirElementoComCopias(extra._idRegistro, relatorioEditingId).then(() => setMessage('Registro excluído com sucesso!')).catch(() => setMessage('Erro ao excluir registro.'));
                      });
                    }
                    // Remover do array local + state do RelatorioBuilder
                    relatorioStateActionsRef.current?.removeCampo(confirmDeleteItemId);
                    setRelatorioForm((prev) => {
                      if (!prev || !prev.bandas) return prev;
                      return { ...prev, bandas: prev.bandas.map((b: any) => ({ ...b, campos: (b.campos ?? []).filter((c: any) => c.id !== confirmDeleteItemId) })) } as any;
                    });
                  } else if (confirmDeleteType === 'banda') {
                    const extra = confirmDeleteExtra;
                    if (extra?._idRegistro) {
                      import('@/services/relatorioServiceBandas').then(({ excluirBanda }) => {
                        excluirBanda(extra._idRegistro).then(() => setMessage('Banda excluída com sucesso!')).catch(() => setMessage('Erro ao excluir banda.'));
                      });
                    }
                    // Remover do array local + state do RelatorioBuilder
                    relatorioStateActionsRef.current?.removeBanda(confirmDeleteItemId);
                    setRelatorioForm((prev) => {
                      if (!prev || !prev.bandas) return prev;
                      return { ...prev, bandas: prev.bandas.filter((b: any) => b.id !== confirmDeleteItemId) } as any;
                    });
                  } else if (confirmDeleteType === 'filtro') {
                    const extra = confirmDeleteExtra;
                    if (extra?._idRegistro) {
                      import('@/services/relatorioServiceParametros').then(({ excluirParametroComCopia }) => {
                        excluirParametroComCopia(extra._idRegistro, relatorioEditingId).then(() => setMessage('Parâmetro excluído com sucesso!')).catch(() => setMessage('Erro ao excluir parâmetro.'));
                      });
                    }
                    setRelatorioForm((prev) => {
                      if (!prev) return prev;
                      return { ...prev, filtros: (prev.filtros ?? []).filter((f: any) => f.id !== confirmDeleteItemId) } as any;
                    });
                  }
                  setConfirmDeleteType('');
                  setConfirmDeleteItemId('');
                  setConfirmDeleteExtra(null);
                }}
                className="px-4 py-2.5 text-sm text-white transition rounded-[3px] border-b button-save cursor-pointer min-w-[96px] justify-center"
                style={{ backgroundColor: '#003056', borderBottomColor: '#000' } as React.CSSProperties}
              >
                Sim
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Renomear Imagem */}
      {renomearModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="absolute inset-0 bg-black/40" onClick={() => !renomearSubmitting && setRenomearModalOpen(false)} />
          <div className="relative w-full max-w-[420px] bg-white modal-dark p-0 shadow-xl shadow-black/20">
            <div className="flex items-center justify-between bg-[#ccc] px-[15px]">
              <h2 className="text-base font-semibold" style={{ color: '#000' }}>Renomear imagem</h2>
              <button
                type="button"
                onClick={() => !renomearSubmitting && setRenomearModalOpen(false)}
                className="inline-flex h-9 items-center justify-center rounded-[3px] text-slate-700 transition cursor-pointer p-0"
                aria-label="Fechar"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18" />
                  <path d="M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="px-[15px] pt-[15px] pb-[15px]">
              <RotuloCampo texto="Nome do arquivo" colecao="imagem" campo="ie_arquivo" />
              <input
                type="text"
                value={renomearNovoNome}
                onChange={(e) => setRenomearNovoNome(e.target.value)}
                disabled={renomearSubmitting}
                className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none disabled:cursor-default disabled:bg-slate-100"
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleRenomearSubmit(); } }}
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-2 px-[15px] pb-[15px]">
              <button
                type="button"
                onClick={() => setRenomearModalOpen(false)}
                disabled={renomearSubmitting}
                className="px-4 py-2.5 text-sm text-black transition rounded-[3px] border-b button-cancel cursor-pointer min-w-[96px] justify-center disabled:cursor-default disabled:opacity-40"
                style={{ backgroundColor: '#bdbdbd', borderBottomColor: '#000' } as React.CSSProperties}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleRenomearSubmit}
                disabled={renomearSubmitting || !renomearNovoNome.trim()}
                className="px-4 py-2.5 text-sm text-white transition rounded-[3px] border-b button-save cursor-pointer min-w-[96px] justify-center disabled:cursor-default disabled:opacity-40"
                style={{ backgroundColor: '#003056', borderBottomColor: '#000' } as React.CSSProperties}
              >
                {renomearSubmitting ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {auditModalOpen && podeVerAuditoria && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="absolute inset-0 bg-black/40" onClick={closeAuditModal} />
          <div className="relative w-full max-w-[560px] bg-white modal-dark p-0 shadow-xl shadow-black/20 max-h-[90vh] flex flex-col">
            <div className="flex-shrink-0 flex items-center justify-between bg-[#ccc] px-[15px]">
              <h2 className="text-base font-semibold" style={{ color: '#000' }}>Histórico de auditoria</h2>
              <button
                type="button"
                onClick={closeAuditModal}
                className="inline-flex h-9 items-center justify-center rounded-[3px] text-slate-700 transition cursor-pointer p-0"
                aria-label="Fechar auditoria"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18" />
                  <path d="M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-[15px] overflow-auto">
              {auditLoading ? (
                <LoadingModal open message="Carregando..." />
              ) : auditLogs.length === 0 ? (
                <div className="text-sm text-slate-600">Nenhum registro de auditoria encontrado.</div>
              ) : (
                <div className="grid gap-3">
                  {auditLogs.map((log, idx) => {
                    const action = String(log.acao ?? '').toLowerCase();
                    const isPasswordCard = action === 'password';
                    const actionLabel = action === 'create'
                      ? 'Criação'
                      : action === 'password'
                      ? 'Alteração de senha'
                      : 'Alteração';

                    return (
                      <div
                        key={log.id}
                        role={isPasswordCard ? 'presentation' : 'button'}
                        onClick={isPasswordCard ? undefined : () => { setSelectedAuditIndex(idx); setDetailModalOpen(true); }}
                        className={`flex border ${isPasswordCard ? 'cursor-default' : 'cursor-pointer'} bg-white`}
                        style={{
                          padding: '10px',
                          borderStyle: 'solid',
                          borderWidth: '1px',
                          borderTopColor: '#ccc',
                          borderLeftColor: '#ccc',
                          borderBottomColor: '#ccc',
                          borderRightColor: '#ccc',
                        }}
                      >
                        <div className="flex w-full items-center justify-between">
                          <div className="text-sm font-medium truncate" style={{ color: '#444' }}>{log.usuarioNome ?? log.usuarioId ?? ''}</div>
                          <div className="flex items-center gap-[10px] text-xs">
                            <span className="text-slate-600">{actionLabel}</span>
                            <span className="text-slate-600 whitespace-nowrap" style={{ marginLeft: 10 }}>{log.timestamp ? formatDate(String(log.timestamp)) : ''}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {changePasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="absolute inset-0 bg-black/40" onClick={closeChangePasswordModal} />
          <form
            onSubmit={handleChangePasswordSubmit}
            className="relative w-full max-w-[420px] bg-white modal-dark p-0 shadow-xl shadow-black/20"
          >
            <div className="flex items-center justify-between bg-[#ccc] px-[15px]">
              <h2 className="text-base font-semibold" style={{ color: '#000' }}>Alterar senha</h2>
              <button
                type="button"
                onClick={closeChangePasswordModal}
                className="inline-flex h-9 items-center justify-center rounded-[3px] text-slate-700 transition cursor-pointer p-0 focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#066fc5] focus-visible:outline-offset-2"
                aria-label="Fechar alterar senha"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18" />
                  <path d="M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid gap-[15px] p-[15px]">
              <div>
                <RotuloCampo texto="Senha" colecao="usuario" campo="ds_senha" />
                <input
                  type="password"
                  className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none"
                  value={passwordChangeValue}
                  onChange={(e) => setPasswordChangeValue(e.target.value)}
                  autoFocus
                />
              </div>
              {passwordChangeIsSelf && (
                <div>
                  <RotuloCampo texto="Confirmar senha" colecao="usuario" campo="ds_senha" />
                  <input
                    type="password"
                    className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none"
                    value={passwordChangeConfirmValue}
                    onChange={(e) => setPasswordChangeConfirmValue(e.target.value)}
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 px-[15px] pb-[15px]">
              <button
                type="button"
                onClick={closeChangePasswordModal}
                className="px-4 py-2.5 text-sm text-black transition rounded-[3px] border-b button-cancel cursor-pointer min-w-[96px] justify-center"
                style={{ backgroundColor: '#bdbdbd', borderBottomColor: '#000' } as React.CSSProperties}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={adminSubmitting || !passwordChangeValue}
                className="px-4 py-2.5 text-sm text-white transition rounded-[3px] border-b button-save cursor-pointer min-w-[96px] justify-center disabled:cursor-default disabled:opacity-60"
                style={{ backgroundColor: '#003056', borderBottomColor: '#000' } as React.CSSProperties}
              >
                Salvar
              </button>
            </div>
          </form>
        </div>
      )}

      {alterarStatusModalOpen && alterarStatusAluno && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="absolute inset-0 bg-black/40" onClick={closeAlterarStatusModal} />
          <form
            onSubmit={handleAlterarStatusSubmit}
            className="relative w-full max-w-[420px] bg-white modal-dark p-0 shadow-xl shadow-black/20"
          >
            <div className="flex items-center justify-between bg-[#ccc] px-[15px]">
              <h2 className="text-base font-semibold" style={{ color: '#000' }}>Alterar status{alterarStatusAlunoLote.length > 1 ? ` (${alterarStatusAlunoLote.length} alunos)` : ''}</h2>
              <button
                type="button"
                onClick={closeAlterarStatusModal}
                className="inline-flex h-9 items-center justify-center rounded-[3px] text-slate-700 transition cursor-pointer p-0 focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#066fc5] focus-visible:outline-offset-2"
                aria-label="Fechar alterar status"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18" />
                  <path d="M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid gap-[15px] p-[15px]">
              <div>
                <RotuloCampo texto="Status" colecao="aluno" campo="ie_status" />
                <Select
                  value={alterarStatusForm.ie_status}
                  onChange={(v) => setAlterarStatusForm({ ...alterarStatusForm, ie_status: v })}
                  options={[
                    { value: 'P', label: 'Pré-matriculado' },
                    { value: 'A', label: 'Matriculado' },
                    { value: 'I', label: 'Inativo' },
                    { value: 'C', label: 'Cancelado' },
                    { value: 'T', label: 'Transferido' },
                    // O status atual do aluno (de qualquer um dos selecionados) fica fora da lista.
                  ].filter((o) => !(alterarStatusAlunoLote.length > 0 ? alterarStatusAlunoLote : [alterarStatusAluno]).some((a) => (a?.ie_status ?? '') === o.value))}
                />
              </div>
              <div>
                <RotuloCampo texto="Data" colecao="aluno" campo="dt_status" prefixo={asteriscoModal(MODAL_ALUNO_ALTERAR_STATUS, 'dt_status')} />
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="DD/MM/AAAA"
                  disabled={regraModal(MODAL_ALUNO_ALTERAR_STATUS, 'dt_status') === 'D'}
                  className={classeCampoModal(MODAL_ALUNO_ALTERAR_STATUS, 'dt_status', "w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none placeholder:text-[#aaa]")}
                  value={alterarStatusForm.dt_status}
                  onChange={(e) => setAlterarStatusForm({ ...alterarStatusForm, dt_status: applyDateMask(e.target.value) })}
                />
              </div>
              <div>
                <RotuloCampo texto="Motivo" colecao="aluno" campo="ds_status" prefixo={asteriscoModal(MODAL_ALUNO_ALTERAR_STATUS, 'ds_status')} />
                <textarea
                  rows={3}
                  disabled={regraModal(MODAL_ALUNO_ALTERAR_STATUS, 'ds_status') === 'D'}
                  className={classeCampoModal(MODAL_ALUNO_ALTERAR_STATUS, 'ds_status', "w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none resize-none")}
                  value={alterarStatusForm.ds_status}
                  onChange={(e) => setAlterarStatusForm({ ...alterarStatusForm, ds_status: e.target.value })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 px-[15px] pb-[15px]">
              <button
                type="button"
                onClick={closeAlterarStatusModal}
                className="px-4 py-2.5 text-sm text-black transition rounded-[3px] border-b button-cancel cursor-pointer min-w-[96px] justify-center"
                style={{ backgroundColor: '#bdbdbd', borderBottomColor: '#000' } as React.CSSProperties}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={alterarStatusSaving}
                className="px-4 py-2.5 text-sm text-white transition rounded-[3px] border-b button-save cursor-pointer min-w-[96px] justify-center disabled:cursor-default disabled:opacity-60"
                style={{ backgroundColor: '#003056', borderBottomColor: '#000' } as React.CSSProperties}
              >
                Salvar
              </button>
            </div>
          </form>
        </div>
      )}

      {statusPeriodoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="absolute inset-0 bg-black/40" onClick={closeStatusPeriodoModal} />
          <form
            onSubmit={handleStatusPeriodoSubmit}
            className="relative w-full max-w-[420px] bg-white modal-dark p-0 shadow-xl shadow-black/20"
          >
            <div className="flex items-center justify-between bg-[#ccc] px-[15px]">
              <h2 className="text-base font-semibold" style={{ color: '#000' }}>
                {statusPeriodoModal.acao === 'encerrar' ? 'Encerrar período letivo' : 'Reativar período letivo'}
              </h2>
              <button
                type="button"
                onClick={closeStatusPeriodoModal}
                className="inline-flex h-9 items-center justify-center rounded-[3px] text-slate-700 transition cursor-pointer p-0 focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#066fc5] focus-visible:outline-offset-2"
                aria-label="Fechar"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18" />
                  <path d="M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid gap-[15px] p-[15px]">
              <div>
                <RotuloCampo texto={statusPeriodoModal.acao === 'encerrar' ? 'Data de término' : 'Data de reativação'} colecao="periodo_letivo" campo={statusPeriodoModal.acao === 'encerrar' ? 'dt_termino' : 'dt_reativacao'} />
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="DD/MM/AAAA"
                  className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none placeholder:text-[#aaa]"
                  value={statusPeriodoData}
                  onChange={(e) => setStatusPeriodoData(applyDateMask(e.target.value))}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 px-[15px] pb-[15px]">
              <button
                type="button"
                onClick={closeStatusPeriodoModal}
                className="px-4 py-2.5 text-sm text-black transition rounded-[3px] border-b button-cancel cursor-pointer min-w-[96px] justify-center"
                style={{ backgroundColor: '#bdbdbd', borderBottomColor: '#000' } as React.CSSProperties}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={statusPeriodoSaving}
                className="px-4 py-2.5 text-sm text-white transition rounded-[3px] border-b button-save cursor-pointer min-w-[96px] justify-center disabled:cursor-default disabled:opacity-60"
                style={{ backgroundColor: '#003056', borderBottomColor: '#000' } as React.CSSProperties}
              >
                Salvar
              </button>
            </div>
          </form>
        </div>
      )}

      {alterarIngressoModalOpen && alterarIngressoAluno && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="absolute inset-0 bg-black/40" onClick={closeAlterarIngressoModal} />
          <form
            onSubmit={handleAlterarIngressoSubmit}
            className="relative w-full max-w-[420px] bg-white modal-dark p-0 shadow-xl shadow-black/20"
          >
            <div className="flex items-center justify-between bg-[#ccc] px-[15px]">
              <h2 className="text-base font-semibold" style={{ color: '#000' }}>Alterar data de ingresso{alterarIngressoLote.length > 1 ? ` (${alterarIngressoLote.length} alunos)` : ''}</h2>
              <button
                type="button"
                onClick={closeAlterarIngressoModal}
                className="inline-flex h-9 items-center justify-center rounded-[3px] text-slate-700 transition cursor-pointer p-0 focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#066fc5] focus-visible:outline-offset-2"
                aria-label="Fechar alterar data de ingresso"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18" />
                  <path d="M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid gap-[15px] p-[15px]">
              <div>
                <RotuloCampo texto="Data de ingresso" colecao="aluno" campo="dt_ingresso" />
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="DD/MM/AAAA"
                  className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none placeholder:text-[#aaa]"
                  value={alterarIngressoForm.dt_ingresso}
                  onChange={(e) => setAlterarIngressoForm({ ...alterarIngressoForm, dt_ingresso: applyDateMask(e.target.value) })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 px-[15px] pb-[15px]">
              <button
                type="button"
                onClick={closeAlterarIngressoModal}
                className="px-4 py-2.5 text-sm text-black transition rounded-[3px] border-b button-cancel cursor-pointer min-w-[96px] justify-center"
                style={{ backgroundColor: '#bdbdbd', borderBottomColor: '#000' } as React.CSSProperties}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={alterarIngressoSaving}
                className="px-4 py-2.5 text-sm text-white transition rounded-[3px] border-b button-save cursor-pointer min-w-[96px] justify-center disabled:cursor-default disabled:opacity-60"
                style={{ backgroundColor: '#003056', borderBottomColor: '#000' } as React.CSSProperties}
              >
                Salvar
              </button>
            </div>
          </form>
        </div>
      )}

      {alterarAdmissaoModalOpen && alterarAdmissaoColaborador && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="absolute inset-0 bg-black/40" onClick={closeAlterarAdmissaoModal} />
          <form
            onSubmit={handleAlterarAdmissaoSubmit}
            className="relative w-full max-w-[420px] bg-white modal-dark p-0 shadow-xl shadow-black/20"
          >
            <div className="flex items-center justify-between bg-[#ccc] px-[15px]">
              <h2 className="text-base font-semibold" style={{ color: '#000' }}>Alterar data de admissão{alterarAdmissaoLote.length > 1 ? ` (${alterarAdmissaoLote.length} colaboradores)` : ''}</h2>
              <button
                type="button"
                onClick={closeAlterarAdmissaoModal}
                className="inline-flex h-9 items-center justify-center rounded-[3px] text-slate-700 transition cursor-pointer p-0 focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#066fc5] focus-visible:outline-offset-2"
                aria-label="Fechar alterar data de admissão"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18" />
                  <path d="M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid gap-[15px] p-[15px]">
              <div>
                <RotuloCampo texto="Data de admissão" colecao="colaborador" campo="dt_admissao" />
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="DD/MM/AAAA"
                  className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none placeholder:text-[#aaa]"
                  value={alterarAdmissaoForm.dt_admissao}
                  onChange={(e) => setAlterarAdmissaoForm({ ...alterarAdmissaoForm, dt_admissao: applyDateMask(e.target.value) })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 px-[15px] pb-[15px]">
              <button
                type="button"
                onClick={closeAlterarAdmissaoModal}
                className="px-4 py-2.5 text-sm text-black transition rounded-[3px] border-b button-cancel cursor-pointer min-w-[96px] justify-center"
                style={{ backgroundColor: '#bdbdbd', borderBottomColor: '#000' } as React.CSSProperties}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={alterarAdmissaoSaving}
                className="px-4 py-2.5 text-sm text-white transition rounded-[3px] border-b button-save cursor-pointer min-w-[96px] justify-center disabled:cursor-default disabled:opacity-60"
                style={{ backgroundColor: '#003056', borderBottomColor: '#000' } as React.CSSProperties}
              >
                Salvar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Modal: Assumir ativos de (Colaboradores) ── */}
      {assumirAtivosDestino && (() => {
        const nrOrigem = Number(assumirAtivosOrigem) || undefined;
        const nomeOrigem = nomeColaboradorPorSeq(nrOrigem);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
            <div className="absolute inset-0 bg-black/40" onClick={closeAssumirAtivosModal} />
            <form
              onSubmit={handleAssumirAtivosSubmit}
              className="relative w-full max-w-[560px] bg-white modal-dark p-0 shadow-xl shadow-black/20"
            >
              <div className="flex items-center justify-between bg-[#ccc] px-[15px]">
                <h2 className="text-base font-semibold" style={{ color: '#000' }}>Assumir ativos de</h2>
                <button
                  type="button"
                  onClick={closeAssumirAtivosModal}
                  className="inline-flex h-9 items-center justify-center rounded-[3px] text-slate-700 transition cursor-pointer p-0 focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#066fc5] focus-visible:outline-offset-2"
                  aria-label="Fechar"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6 6 18" />
                    <path d="M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="grid gap-[15px] p-[15px]">
                <div>
                  <RotuloCampo texto="Colaborador" colecao="pat_ativo_responsavel" campo="nr_seq_colaborador" prefixo={<RequiredAsterisk />} />
                  <div className="flex items-center gap-2 flex-nowrap">
                    <div style={{ width: 110 }}>
                      <input
                        inputMode="numeric"
                        maxLength={10}
                        className={`w-full rounded-[3px] border ${assumirAtivosErro ? 'border-red-500' : 'border-slate-300'} bg-white px-2 py-1.5 text-sm text-slate-900 transition focus:border-[#003056] focus:outline-none`}
                        value={assumirAtivosOrigem}
                        onChange={(e) => { setAssumirAtivosOrigem(e.target.value.replace(/\D/g, '').slice(0, 10)); setAssumirAtivosErro(false); }}
                      />
                    </div>
                    <div className="relative flex-1 min-w-0">
                      <input readOnly className={`w-full rounded-[3px] border ${assumirAtivosErro ? 'border-red-500' : 'border-slate-300'} bg-slate-100 px-2 pr-[62px] py-1.5 text-sm text-slate-700 transition focus:border-[#003056] focus:outline-none`} value={nomeOrigem} />
                      <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                        {nrOrigem && nomeOrigem && (
                          <button type="button" onClick={() => openColaboradorView(nrOrigem)} className="inline-flex h-[30px] w-[28px] items-center justify-center rounded-[3px] cursor-pointer icon-lookup" aria-label="Visualizar colaborador">
                            <ViewIcon size={16} />
                          </button>
                        )}
                        <button type="button" onClick={() => openEnviarManutPrestadorLookup('assumirAtivos')} className="inline-flex h-[30px] w-[28px] items-center justify-center rounded-[3px] cursor-pointer icon-lookup" aria-label="Localizar colaborador">
                          <SearchIcon size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <RotuloCampo texto="Modo" colecao="pat_ativo_responsavel" campo="ie_modo" tipo="string" prefixo={<RequiredAsterisk />} />
                  <Select
                    value={assumirAtivosModo}
                    onChange={(v) => { setAssumirAtivosModo(v as '' | 'adicionar' | 'substituir'); setAssumirAtivosModoErro(false); }}
                    options={[
                      { value: 'adicionar', label: 'Adicionar' },
                      { value: 'substituir', label: 'Substituir' },
                    ]}
                    error={assumirAtivosModoErro}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 px-[15px] pb-[15px]">
                <button
                  type="button"
                  onClick={closeAssumirAtivosModal}
                  className="px-4 py-2.5 text-sm text-black transition rounded-[3px] border-b button-cancel cursor-pointer min-w-[96px] justify-center"
                  style={{ backgroundColor: '#bdbdbd', borderBottomColor: '#000' } as React.CSSProperties}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={assumirAtivosSaving}
                  className="px-4 py-2.5 text-sm text-white transition rounded-[3px] border-b button-save cursor-pointer min-w-[96px] justify-center disabled:cursor-default disabled:opacity-60"
                  style={{ backgroundColor: '#003056', borderBottomColor: '#000' } as React.CSSProperties}
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        );
      })()}

      {/* ── Controle de Cópias > Cópias: Alterar status (menu de contexto) ── */}
      {alterarStatusCopiaModalOpen && alterarStatusCopia && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="absolute inset-0 bg-black/40" onClick={closeAlterarStatusCopiaModal} />
          <form
            onSubmit={handleAlterarStatusCopiaSubmit}
            className="relative w-full max-w-[420px] bg-white modal-dark p-0 shadow-xl shadow-black/20"
          >
            <div className="flex items-center justify-between bg-[#ccc] px-[15px]">
              <h2 className="text-base font-semibold" style={{ color: '#000' }}>Alterar status</h2>
              <button
                type="button"
                onClick={closeAlterarStatusCopiaModal}
                className="inline-flex h-9 items-center justify-center rounded-[3px] text-slate-700 transition cursor-pointer p-0 focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#066fc5] focus-visible:outline-offset-2"
                aria-label="Fechar alterar status"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18" />
                  <path d="M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid gap-[15px] p-[15px]">
              <div>
                <RotuloCampo texto="Status" colecao="copia" campo="ie_status" />
                <Select
                  value={alterarStatusCopiaForm.ie_status}
                  onChange={(v) => setAlterarStatusCopiaForm({ ...alterarStatusCopiaForm, ie_status: v })}
                  options={STATUS_COPIA_OPTIONS.filter((o) => o.value !== (alterarStatusCopia.ie_status ?? ''))}
                />
              </div>
              <div>
                <RotuloCampo texto="Data" colecao="copia" campo="dt_status" prefixo={asteriscoModal(MODAL_COPIA_ALTERAR_STATUS, 'dt_status')} />
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="DD/MM/AAAA"
                  disabled={regraModal(MODAL_COPIA_ALTERAR_STATUS, 'dt_status') === 'D'}
                  className={classeCampoModal(MODAL_COPIA_ALTERAR_STATUS, 'dt_status', "w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none placeholder:text-[#aaa]")}
                  value={alterarStatusCopiaForm.dt_status}
                  onChange={(e) => setAlterarStatusCopiaForm({ ...alterarStatusCopiaForm, dt_status: applyDateMask(e.target.value) })}
                />
              </div>
              <div>
                <RotuloCampo texto="Motivo" colecao="copia" campo="ds_motivo_status" prefixo={asteriscoModal(MODAL_COPIA_ALTERAR_STATUS, 'ds_motivo_status')} />
                <textarea
                  rows={3}
                  disabled={regraModal(MODAL_COPIA_ALTERAR_STATUS, 'ds_motivo_status') === 'D'}
                  className={classeCampoModal(MODAL_COPIA_ALTERAR_STATUS, 'ds_motivo_status', "w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none resize-none")}
                  value={alterarStatusCopiaForm.ds_motivo_status}
                  onChange={(e) => setAlterarStatusCopiaForm({ ...alterarStatusCopiaForm, ds_motivo_status: e.target.value })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 px-[15px] pb-[15px]">
              <button
                type="button"
                onClick={closeAlterarStatusCopiaModal}
                className="px-4 py-2.5 text-sm text-black transition rounded-[3px] border-b button-cancel cursor-pointer min-w-[96px] justify-center"
                style={{ backgroundColor: '#bdbdbd', borderBottomColor: '#000' } as React.CSSProperties}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={alterarStatusCopiaSaving}
                className="px-4 py-2.5 text-sm text-white transition rounded-[3px] border-b button-save cursor-pointer min-w-[96px] justify-center disabled:cursor-default disabled:opacity-60"
                style={{ backgroundColor: '#003056', borderBottomColor: '#000' } as React.CSSProperties}
              >
                Salvar
              </button>
            </div>
          </form>
        </div>
      )}

      {alterarStatusColaboradorModalOpen && alterarStatusColaborador && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="absolute inset-0 bg-black/40" onClick={closeAlterarStatusColaboradorModal} />
          <form
            onSubmit={handleAlterarStatusColaboradorSubmit}
            className="relative w-full max-w-[420px] bg-white modal-dark p-0 shadow-xl shadow-black/20"
          >
            <div className="flex items-center justify-between bg-[#ccc] px-[15px]">
              <h2 className="text-base font-semibold" style={{ color: '#000' }}>Alterar status{alterarStatusColaboradorLote.length > 1 ? ` (${alterarStatusColaboradorLote.length} colaboradores)` : ''}</h2>
              <button
                type="button"
                onClick={closeAlterarStatusColaboradorModal}
                className="inline-flex h-9 items-center justify-center rounded-[3px] text-slate-700 transition cursor-pointer p-0 focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#066fc5] focus-visible:outline-offset-2"
                aria-label="Fechar alterar status"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18" />
                  <path d="M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid gap-[15px] p-[15px]">
              <div>
                <RotuloCampo texto="Status" colecao="colaborador" campo="ie_status" />
                <Select
                  value={alterarStatusColaboradorForm.ie_status}
                  onChange={(v) => setAlterarStatusColaboradorForm({ ...alterarStatusColaboradorForm, ie_status: v })}
                  options={STATUS_OPTIONS.filter((o) => !(alterarStatusColaboradorLote.length > 0 ? alterarStatusColaboradorLote : [alterarStatusColaborador]).some((c) => (c?.ie_status ?? '') === o.value))}
                />
              </div>
              <div>
                <RotuloCampo texto="Data" colecao="colaborador" campo="dt_status" prefixo={asteriscoModal(MODAL_COLABORADOR_ALTERAR_STATUS, 'dt_status')} />
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="DD/MM/AAAA"
                  disabled={regraModal(MODAL_COLABORADOR_ALTERAR_STATUS, 'dt_status') === 'D'}
                  className={classeCampoModal(MODAL_COLABORADOR_ALTERAR_STATUS, 'dt_status', "w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none placeholder:text-[#aaa]")}
                  value={alterarStatusColaboradorForm.dt_status}
                  onChange={(e) => setAlterarStatusColaboradorForm({ ...alterarStatusColaboradorForm, dt_status: applyDateMask(e.target.value) })}
                />
              </div>
              <div>
                <RotuloCampo texto="Motivo" colecao="colaborador" campo="ds_motivo_status" prefixo={asteriscoModal(MODAL_COLABORADOR_ALTERAR_STATUS, 'ds_motivo_status')} />
                <textarea
                  rows={3}
                  disabled={regraModal(MODAL_COLABORADOR_ALTERAR_STATUS, 'ds_motivo_status') === 'D'}
                  className={classeCampoModal(MODAL_COLABORADOR_ALTERAR_STATUS, 'ds_motivo_status', "w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none resize-none")}
                  value={alterarStatusColaboradorForm.ds_motivo_status}
                  onChange={(e) => setAlterarStatusColaboradorForm({ ...alterarStatusColaboradorForm, ds_motivo_status: e.target.value })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 px-[15px] pb-[15px]">
              <button
                type="button"
                onClick={closeAlterarStatusColaboradorModal}
                className="px-4 py-2.5 text-sm text-black transition rounded-[3px] border-b button-cancel cursor-pointer min-w-[96px] justify-center"
                style={{ backgroundColor: '#bdbdbd', borderBottomColor: '#000' } as React.CSSProperties}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={alterarStatusColaboradorSaving}
                className="px-4 py-2.5 text-sm text-white transition rounded-[3px] border-b button-save cursor-pointer min-w-[96px] justify-center disabled:cursor-default disabled:opacity-60"
                style={{ backgroundColor: '#003056', borderBottomColor: '#000' } as React.CSSProperties}
              >
                Salvar
              </button>
            </div>
          </form>
        </div>
      )}

      {ativoStatusModalOpen && ativoStatusTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="absolute inset-0 bg-black/40" onClick={closeAtivoStatusModal} />
          <form
            onSubmit={handleAtivoStatusSubmit}
            className="relative w-full max-w-[420px] bg-white modal-dark p-0 shadow-xl shadow-black/20"
          >
            <div className="flex items-center justify-between bg-[#ccc] px-[15px]">
              <h2 className="text-base font-semibold" style={{ color: '#000' }}>
                {ativoStatusValue === 'O' ? 'Operacional' : ativoStatusValue === 'M' ? 'Enviar para manutenção' : ativoStatusValue === 'E' ? 'Mover para o estoque' : 'Descartar'}{ativoStatusLote.length > 1 ? ` (${ativoStatusLote.length} ativos)` : ''}
              </h2>
              <button
                type="button"
                onClick={closeAtivoStatusModal}
                className="inline-flex h-9 items-center justify-center rounded-[3px] text-slate-700 transition cursor-pointer p-0 focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#066fc5] focus-visible:outline-offset-2"
                aria-label="Fechar"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18" />
                  <path d="M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid gap-[15px] p-[15px]">
              <div>
                <RotuloCampo texto="Data" colecao="pat_ativo" campo="dt_status" prefixo={asteriscoModal(modalAtivoStatus, 'dt_status')} />
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="DD/MM/AAAA"
                  disabled={regraModal(modalAtivoStatus, 'dt_status') === 'D'}
                  className={classeCampoModal(modalAtivoStatus, 'dt_status', "w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none placeholder:text-[#aaa]")}
                  value={ativoStatusForm.dt_data}
                  onChange={(e) => setAtivoStatusForm({ ...ativoStatusForm, dt_data: applyDateMask(e.target.value) })}
                />
              </div>
              <div>
                  <RotuloCampo texto="Motivo" colecao="pat_ativo" campo="ds_motivo_status" prefixo={asteriscoModal(modalAtivoStatus, 'ds_motivo_status')} />
                  <textarea
                    rows={3}
                    disabled={regraModal(modalAtivoStatus, 'ds_motivo_status') === 'D'}
                    className={classeCampoModal(modalAtivoStatus, 'ds_motivo_status', "w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none resize-none")}
                    value={ativoStatusForm.ds_motivo_status}
                    onChange={(e) => setAtivoStatusForm({ ...ativoStatusForm, ds_motivo_status: e.target.value })}
                  />
                </div>
            </div>

            <div className="flex justify-end gap-2 px-[15px] pb-[15px]">
              <button
                type="button"
                onClick={closeAtivoStatusModal}
                className="px-4 py-2.5 text-sm text-black transition rounded-[3px] border-b button-cancel cursor-pointer min-w-[96px] justify-center"
                style={{ backgroundColor: '#bdbdbd', borderBottomColor: '#000' } as React.CSSProperties}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={ativoStatusSaving}
                className="px-4 py-2.5 text-sm text-white transition rounded-[3px] border-b button-save cursor-pointer min-w-[96px] justify-center disabled:cursor-default disabled:opacity-60"
                style={{ backgroundColor: '#003056', borderBottomColor: '#000' } as React.CSSProperties}
              >
                Salvar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Modal: Transferir (localização do ativo) ── */}
      {ativoTransferirLote.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="absolute inset-0 bg-black/40" onClick={closeAtivoTransferirModal} />
          <form
            onSubmit={handleAtivoTransferirSubmit}
            className="relative w-full max-w-[420px] bg-white modal-dark p-0 shadow-xl shadow-black/20"
          >
            <div className="flex items-center justify-between bg-[#ccc] px-[15px]">
              <h2 className="text-base font-semibold" style={{ color: '#000' }}>
                Transferir{ativoTransferirLote.length > 1 ? ` (${ativoTransferirLote.length} ativos)` : ''}
              </h2>
              <button
                type="button"
                onClick={closeAtivoTransferirModal}
                className="inline-flex h-9 items-center justify-center rounded-[3px] text-slate-700 transition cursor-pointer p-0 focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#066fc5] focus-visible:outline-offset-2"
                aria-label="Fechar"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18" />
                  <path d="M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid gap-[15px] p-[15px]">
              <div>
                <RotuloCampo texto="Localização" colecao="pat_ativo" campo="nr_seq_localizacao" prefixo={<RequiredAsterisk />} />
                <Select
                  value={ativoTransferirLocal}
                  onChange={(v) => { setAtivoTransferirLocal(v); setAtivoTransferirErro(false); }}
                  options={cgFilterOptions(localizacoes, (op) => op.ds_localizacao)}
                  error={ativoTransferirErro}
                  visibleOptions={6}
                />
              </div>
              <div>
                <RotuloCampo texto="Motivo" colecao="pat_ativo" campo="ds_motivo_transferencia" prefixo={asteriscoModal(MODAL_ATIVO_TRANSFERIR, 'ds_motivo_transferencia')} />
                <textarea
                  disabled={regraModal(MODAL_ATIVO_TRANSFERIR, 'ds_motivo_transferencia') === 'D'}
                  className={classeCampoModal(MODAL_ATIVO_TRANSFERIR, 'ds_motivo_transferencia', "w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none resize-none")}
                  rows={3}
                  value={ativoTransferirMotivo}
                  onChange={(e) => setAtivoTransferirMotivo(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 px-[15px] pb-[15px]">
              <button
                type="button"
                onClick={closeAtivoTransferirModal}
                className="px-4 py-2.5 text-sm text-black transition rounded-[3px] border-b button-cancel cursor-pointer min-w-[96px] justify-center"
                style={{ backgroundColor: '#bdbdbd', borderBottomColor: '#000' } as React.CSSProperties}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={ativoTransferirSaving}
                className="px-4 py-2.5 text-sm text-white transition rounded-[3px] border-b button-save cursor-pointer min-w-[96px] justify-center disabled:cursor-default disabled:opacity-60"
                style={{ backgroundColor: '#003056', borderBottomColor: '#000' } as React.CSSProperties}
              >
                Salvar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Modal: Enviar para manutenção ── */}
      {enviarManutModalOpen && enviarManutTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="absolute inset-0 bg-black/40" onClick={closeEnviarManutModal} />
          <form onSubmit={handleEnviarManutSubmit} className="relative w-full max-w-[560px] min-h-[280px] bg-white modal-dark p-0 shadow-xl shadow-black/20 flex flex-col">
            <div className="flex items-center justify-between bg-[#ccc] px-[15px]">
              <h2 className="text-base font-semibold" style={{ color: '#000' }}>Enviar para manutenção{enviarManutLote.length > 1 ? ` (${enviarManutLote.length} ativos)` : ''}</h2>
              <button type="button" onClick={closeEnviarManutModal} className="inline-flex h-9 items-center justify-center rounded-[3px] text-slate-700 transition cursor-pointer p-0 focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#066fc5] focus-visible:outline-offset-2" aria-label="Fechar">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="grid gap-[15px] p-[15px]">
              <div>
                <RotuloCampo texto="Data" colecao="pat_manutencao" campo="dt_envio" prefixo={asteriscoModal(MODAL_ENVIAR_MANUTENCAO, 'dt_envio')} />
                <input type="text" inputMode="numeric" maxLength={10} placeholder="DD/MM/AAAA" disabled={regraModal(MODAL_ENVIAR_MANUTENCAO, 'dt_envio') === 'D'} className={classeCampoModal(MODAL_ENVIAR_MANUTENCAO, 'dt_envio', "w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none placeholder:text-[#aaa]")} value={enviarManutForm.dt_data} onChange={(e) => setEnviarManutForm({ ...enviarManutForm, dt_data: applyDateMask(e.target.value) })} />
              </div>
              <div>
                <RotuloCampo texto="Prestador de serviço" colecao="pat_manutencao" campo="nr_seq_prestador_servico" prefixo={asteriscoModal(MODAL_ENVIAR_MANUTENCAO, 'nr_seq_prestador_servico')} />
                <div className="flex items-center gap-2 flex-nowrap">
                  <div style={{ width: 110 }}>
                    <input inputMode="numeric" maxLength={10} disabled={regraModal(MODAL_ENVIAR_MANUTENCAO, 'nr_seq_prestador_servico') === 'D'} className={classeCampoModal(MODAL_ENVIAR_MANUTENCAO, 'nr_seq_prestador_servico', "w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 transition focus:border-[#003056] focus:outline-none")} value={enviarManutForm.nr_seq_prestador_servico ? String(enviarManutForm.nr_seq_prestador_servico) : ''} onChange={(e) => { const raw = e.target.value.replace(/\D/g, '').slice(0, 10); setEnviarManutForm({ ...enviarManutForm, nr_seq_prestador_servico: raw ? Number(raw) : undefined }); }} />
                  </div>
                  <div className="relative flex-1 min-w-0">
                    <input readOnly className="w-full rounded-[3px] border border-slate-300 bg-slate-100 px-2 pr-[62px] py-1.5 text-sm text-slate-700 transition focus:border-[#003056] focus:outline-none" value={enviarManutPrestadorName} />
                    <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                      {enviarManutForm.nr_seq_prestador_servico && (
                        <button type="button" onClick={() => openColaboradorView(enviarManutForm.nr_seq_prestador_servico)} className="inline-flex h-[30px] w-[28px] items-center justify-center rounded-[3px] cursor-pointer icon-lookup" aria-label="Visualizar prestador de serviço">
                          <ViewIcon size={16} />
                        </button>
                      )}
                      <button type="button" disabled={regraModal(MODAL_ENVIAR_MANUTENCAO, 'nr_seq_prestador_servico') === 'D'} onClick={() => openEnviarManutPrestadorLookup('modal')} className="disabled:cursor-default disabled:opacity-40 inline-flex h-[30px] w-[28px] items-center justify-center rounded-[3px] cursor-pointer icon-lookup" aria-label="Localizar prestador de serviço">
                        <SearchIcon size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <RotuloCampo texto="Motivo" colecao="pat_manutencao" campo="ds_motivo_manutencao" prefixo={asteriscoModal(MODAL_ENVIAR_MANUTENCAO, 'ds_motivo_manutencao')} />
                <textarea
                  disabled={regraModal(MODAL_ENVIAR_MANUTENCAO, 'ds_motivo_manutencao') === 'D'}
                  className={classeCampoModal(MODAL_ENVIAR_MANUTENCAO, 'ds_motivo_manutencao', "w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none resize-none")}
                  rows={3}
                  value={enviarManutForm.ds_motivo_manutencao ?? ''}
                  onChange={(e) => setEnviarManutForm({ ...enviarManutForm, ds_motivo_manutencao: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 px-[15px] pb-[15px] mt-auto">
              <button type="button" onClick={closeEnviarManutModal} className="px-4 py-2.5 text-sm text-black transition rounded-[3px] border-b button-cancel cursor-pointer min-w-[96px] justify-center" style={{ backgroundColor: '#bdbdbd', borderBottomColor: '#000' } as React.CSSProperties}>Cancelar</button>
              <button type="submit" disabled={enviarManutSaving} className="px-4 py-2.5 text-sm text-white transition rounded-[3px] border-b button-save cursor-pointer min-w-[96px] justify-center disabled:cursor-default disabled:opacity-60" style={{ backgroundColor: '#003056', borderBottomColor: '#000' } as React.CSSProperties}>Salvar</button>
            </div>
          </form>
        </div>
      )}

      {/* ── Lookup: Localizar prestador de serviço ── */}
      {enviarManutPrestadorLookupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="absolute inset-0 bg-black/40" onClick={closeEnviarManutPrestadorLookup} />
          <div className="relative w-full max-w-[1200px] bg-white p-0 shadow-xl shadow-black/20 h-[720px] max-h-[90vh] overflow-hidden">
            <div className="flex h-full">
              <div className="w-[360px] lookup-left flex flex-col min-h-0">
                <div className="p-[15px] overflow-auto flex-1 min-h-0">
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <h2 className="text-base font-semibold" style={{ color: '#000' }}>{lookupColaboradorFornecedor ? 'Fornecedor' : lookupColaboradorTodos ? 'Colaborador' : 'Prestador de Serviço'}</h2>
                    <button type="button" onClick={closeEnviarManutPrestadorLookup} className="inline-flex h-9 w-9 items-center justify-center rounded-[3px] text-slate-700 transition cursor-pointer p-0" aria-label="Fechar localizar prestador">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="M6 6l12 12" /></svg>
                    </button>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <RotuloCampo texto="Sequência" colecao="colaborador" campo="nr_sequencia" />
                      <input inputMode="numeric" maxLength={10} className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none" value={enviarManutPrestLookupForm.nr_sequencia} onChange={(e) => setEnviarManutPrestLookupForm({ ...enviarManutPrestLookupForm, nr_sequencia: e.target.value })} />
                    </div>
                    <div>
                      <RotuloCampo texto="Nome" colecao="pessoa_fisica" campo="ds_nome" />
                      <input className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none" value={enviarManutPrestLookupForm.ds_nome} onChange={(e) => setEnviarManutPrestLookupForm({ ...enviarManutPrestLookupForm, ds_nome: e.target.value })} />
                    </div>
                    <div>
                      <RotuloCampo texto="CPF" colecao="pessoa_fisica" campo="nr_cpf" />
                      <input inputMode="numeric" maxLength={14} className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none" value={enviarManutPrestLookupForm.nr_cpf} onChange={(e) => setEnviarManutPrestLookupForm({ ...enviarManutPrestLookupForm, nr_cpf: applyCpfMask(e.target.value) })} />
                    </div>
                    <div>
                      <RotuloCampo texto="CNPJ" colecao="pessoa_juridica" campo="nr_cnpj" />
                      <input inputMode="numeric" maxLength={18} className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none" value={enviarManutPrestLookupForm.nr_cnpj} onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, '').slice(0, 14);
                        let masked = digits;
                        if (digits.length > 2) masked = `${digits.slice(0, 2)}.${digits.slice(2)}`;
                        if (digits.length > 5) masked = `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
                        if (digits.length > 8) masked = `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
                        if (digits.length > 12) masked = `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
                        setEnviarManutPrestLookupForm({ ...enviarManutPrestLookupForm, nr_cnpj: masked });
                      }} />
                    </div>
                  </div>
                </div>
                <div className="flex-shrink-0 flex items-center justify-end gap-2 p-[15px]">
                  <BotaoSalvarFiltro onClick={() => salvarFiltroDoLookup(idLookupColaborador(lookupColaboradorFornecedor, lookupColaboradorTodos), enviarManutPrestLookupForm, applyEnviarManutPrestadorLookup)} />
                  <button type="button" onClick={clearEnviarManutPrestadorLookup} className="px-4 py-2.5 text-sm text-black transition rounded-[3px] border-b button-cancel cursor-pointer min-w-[96px] justify-center" style={{ backgroundColor: '#ddd', borderBottomColor: '#000' } as React.CSSProperties}>Limpar</button>
                  <button type="button" onClick={applyEnviarManutPrestadorLookup} className="px-4 py-2.5 text-sm text-white transition rounded-[3px] border-b button-save cursor-pointer min-w-[96px] justify-center" style={{ backgroundColor: '#003056', borderBottomColor: '#000' } as React.CSSProperties}>Filtrar</button>
                </div>
              </div>
              <div className="flex-1 min-h-0 overflow-hidden flex flex-col lookup-right">
                {!enviarManutPrestLookupApplied || enviarManutFilteredPrestadores.length === 0 ? (
                  <div className="flex h-full items-center justify-center p-[15px] text-sm text-slate-600">Nenhum registro encontrado.</div>
                ) : (                   <PrestadorLookupTable {...colunasPorIndice('config_colunas_lookup_prestador')}
                     prestadores={enviarManutFilteredPrestadores}
                     pessoasFisicas={pessoasFisicas}
                     pessoasJuridicas={pessoasJuridicas}
                     onSelect={handleEnviarManutPrestadorSelect}
                   />
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Lookup: Curso / Período letivo / Localização (formulário de Turmas) ── */}
      {turmaLookupCampo && (() => {
        const ativos = <T extends { nr_sequencia: number; ie_status?: string }>(lista: T[], descricao: (item: T) => string | undefined) =>
          lista
            .filter((item) => String(item.ie_status ?? 'A').toUpperCase() !== 'I')
            .map((item) => ({ nr_sequencia: item.nr_sequencia, descricao: descricao(item) || `#${item.nr_sequencia}` }));
        const config = {
          nr_seq_curso: { titulo: 'Curso', colecao: 'curso', campoDescricao: 'ds_curso', registros: ativos(cursos, (c) => c.ds_curso) },
          nr_seq_periodo_letivo: { titulo: 'Período Letivo', colecao: 'periodo_letivo', campoDescricao: 'ds_periodo_letivo', registros: ativos(periodosLetivos, (p) => p.ds_periodo_letivo) },
          nr_seq_localizacao: { titulo: 'Localização', colecao: 'cg_localizacao', campoDescricao: 'ds_localizacao', registros: ativos(localizacoes, (l) => l.ds_localizacao) },
        }[turmaLookupCampo];
        return (
          <ReferenciaLookupModal
            {...config}
            {...filtroDoReferenciaLookup(config.colecao)}
            onClose={() => setTurmaLookupCampo(null)}
            onSelect={(item) => {
              setTurmaExtra((t) => ({ ...t, [turmaLookupCampo]: String(item.nr_sequencia) }));
              setTurmaLookupCampo(null);
            }}
          />
        );
      })()}

      {/* ── Lookup: Turma / Disciplina (formulário de Turmas x Disciplinas) ── */}
      {turmaDisciplinaLookupCampo && (
        <ReferenciaLookupModal
          {...(turmaDisciplinaLookupCampo === 'nr_seq_turma'
            ? { titulo: 'Turma', colecao: 'turma', campoDescricao: 'ds_turma', registros: turmas.map((t) => ({ nr_sequencia: t.nr_sequencia, descricao: t.ds_turma || `#${t.nr_sequencia}` })) }
            : { titulo: 'Disciplina', colecao: 'disciplina', campoDescricao: 'ds_disciplina', registros: disciplinas.map((d) => ({ nr_sequencia: d.nr_sequencia, descricao: d.ds_disciplina || `#${d.nr_sequencia}` })) })}
          {...filtroDoReferenciaLookup(turmaDisciplinaLookupCampo === 'nr_seq_turma' ? 'turma' : 'disciplina')}
          onClose={() => setTurmaDisciplinaLookupCampo(null)}
          onSelect={(item) => {
            setTurmaDisciplinaExtra((t) => ({ ...t, [turmaDisciplinaLookupCampo]: String(item.nr_sequencia) }));
            setTurmaDisciplinaLookupCampo(null);
          }}
        />
      )}

      {/* ── Lookup: Turma x Disciplina (formulário e filtro de Cópias) ── */}
      {copiaTurmaDisciplinaLookup && (
        <ReferenciaLookupModal
          titulo="Turma x Disciplina"
          colecao="turma_disciplina"
          campoDescricao="nr_seq_turma"
          // Mesmas colunas de Estrutura Acadêmica > Turmas x Disciplinas (só as ativas podem ser escolhidas).
          colunas={TURMA_DISCIPLINA_COLUMNS.map((c) => ({ key: String(c.key), label: c.label, dataClass: c.dataClass }))}
          filtros={[
            // Período letivo da turma: ajuda a achar as turmas x disciplinas do período certo.
            { key: '_nr_seq_periodo_letivo', rotulo: 'Período letivo', campo: 'nr_seq_periodo_letivo', colecao: 'turma', opcoes: opcoesDeReferencia(periodosLetivos, (p) => p.ds_periodo_letivo, '') },
            { key: 'nr_seq_turma', rotulo: 'Turma', campo: 'nr_seq_turma' },
            { key: 'nr_seq_disciplina', rotulo: 'Disciplina', campo: 'nr_seq_disciplina' },
          ]}
          {...colunasPorIndice('config_colunas_lookup_turma_disciplina')}
          {...filtroDoReferenciaLookup('turma_disciplina')}
          registros={turmasDisciplinas
            .filter((td) => (td.ie_status ?? 'A') !== 'I')
            // Período letivo, Curso e Modalidade de ensino vêm da turma.
            .map((td) => ({ ...td, ...camposDaTurmaDisciplina(td.nr_seq_turma) }))
            .map((td) => ({
              ...Object.fromEntries(TURMA_DISCIPLINA_COLUMNS.map((c) => [
                c.key,
                // Datas são formatadas pela própria tabela do lookup.
                String(c.key).startsWith('dt_') ? td[c.key] : formatTurmaDisciplinaCellValue(String(c.key), td[c.key]),
              ])),
              id: td.id,
              nr_sequencia: td.nr_sequencia,
              descricao: descricaoTurmaDisciplinaPorSeq(td.nr_sequencia),
              _nr_seq_periodo_letivo: String(turmas.find((t) => t.nr_sequencia === td.nr_seq_turma)?.nr_seq_periodo_letivo ?? ''),
            }))}
          onClose={() => setCopiaTurmaDisciplinaLookup(null)}
          onSelect={(item) => {
            if (copiaTurmaDisciplinaLookup === 'filtro') {
              setCopiaFiltroExtra((f) => ({ ...f, nr_seq_turma_disciplina: String(item.nr_sequencia) }));
            } else {
              setCopiaExtra((c) => ({ ...c, nr_seq_turma_disciplina: String(item.nr_sequencia) }));
            }
            setCopiaTurmaDisciplinaLookup(null);
          }}
        />
      )}

      {/* ── Lookup: Localizar ativo (manutenções) ── */}
      {manutencaoAtivoLookupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="absolute inset-0 bg-black/40" onClick={closeManutencaoAtivoLookup} />
          <div className="relative w-full max-w-[1200px] bg-white p-0 shadow-xl shadow-black/20 h-[720px] max-h-[90vh] overflow-hidden">
            <div className="flex h-full">
              <div className="w-[360px] lookup-left flex flex-col min-h-0">
                <div className="p-[15px] overflow-auto flex-1 min-h-0">
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <h2 className="text-base font-semibold" style={{ color: '#000' }}>Ativo</h2>
                    <button type="button" onClick={closeManutencaoAtivoLookup} className="inline-flex h-9 w-9 items-center justify-center rounded-[3px] text-slate-700 transition cursor-pointer p-0" aria-label="Fechar localizar ativo">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="M6 6l12 12" /></svg>
                    </button>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <RotuloCampo texto="Sequência" colecao="pat_ativo" campo="nr_sequencia" />
                      <input inputMode="numeric" maxLength={10} className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none" value={manutencaoAtivoLookupForm.nr_sequencia} onChange={(e) => setManutencaoAtivoLookupForm({ ...manutencaoAtivoLookupForm, nr_sequencia: e.target.value })} />
                    </div>
                    <div>
                      <RotuloCampo texto="Descrição" colecao="pat_ativo" campo="ds_ativo" />
                      <input className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none" value={manutencaoAtivoLookupForm.ds_ativo} onChange={(e) => setManutencaoAtivoLookupForm({ ...manutencaoAtivoLookupForm, ds_ativo: e.target.value })} />
                    </div>
                    <div>
                      <RotuloCampo texto="Modelo" colecao="pat_ativo" campo="ds_modelo" />
                      <input className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none" value={manutencaoAtivoLookupForm.ds_modelo} onChange={(e) => setManutencaoAtivoLookupForm({ ...manutencaoAtivoLookupForm, ds_modelo: e.target.value })} />
                    </div>
                    <div>
                      <RotuloCampo texto="Status" colecao="pat_ativo" campo="ie_status" />
                      <Select
                        value={manutencaoAtivoLookupForm.ie_status}
                        onChange={(v) => setManutencaoAtivoLookupForm({ ...manutencaoAtivoLookupForm, ie_status: v })}
                        options={[
                          { value: '', label: '---' },
                          { value: 'E', label: 'Estoque' },
                          { value: 'O', label: 'Operacional' },
                        ]}
                        showPlaceholder={false}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex-shrink-0 flex items-center justify-end gap-2 p-[15px]">
                  <BotaoSalvarFiltro onClick={() => salvarFiltroDoLookup('ativo', manutencaoAtivoLookupForm, applyManutencaoAtivoLookup)} />
                  <button type="button" onClick={clearManutencaoAtivoLookup} className="px-4 py-2.5 text-sm text-black transition rounded-[3px] border-b button-cancel cursor-pointer min-w-[96px] justify-center" style={{ backgroundColor: '#ddd', borderBottomColor: '#000' } as React.CSSProperties}>Limpar</button>
                  <button type="button" onClick={applyManutencaoAtivoLookup} className="px-4 py-2.5 text-sm text-white transition rounded-[3px] border-b button-save cursor-pointer min-w-[96px] justify-center" style={{ backgroundColor: '#003056', borderBottomColor: '#000' } as React.CSSProperties}>Filtrar</button>
                </div>
              </div>
              <div className="flex-1 min-h-0 overflow-hidden flex flex-col lookup-right">
                {!manutencaoAtivoLookupApplied || manutencaoFilteredAtivos.length === 0 ? (
                  <div className="flex h-full items-center justify-center p-[15px] text-sm text-slate-600">Nenhum registro encontrado.</div>
                ) : (                   <AtivoLookupTable {...colunasPorIndice('config_colunas_lookup_ativo')}
                     ativos={manutencaoFilteredAtivos}
                     onSelect={handleManutencaoAtivoSelect}
                     categoriasAtivos={categoriasAtivos}
                     marcas={marcas}
                   />
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {pessoaFisicaLookupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="absolute inset-0 bg-black/40" onClick={closePessoaFisicaLookup} />
          <div className="relative w-full max-w-[1200px] bg-white p-0 shadow-xl shadow-black/20 h-[720px] max-h-[90vh] overflow-hidden">
            <div className="flex h-full">
              <div className="w-[360px] lookup-left flex flex-col min-h-0">
                <div className="p-[15px] overflow-auto flex-1 min-h-0">
                <div className="flex items-center justify-between gap-2 mb-4">
                  <h2 className="text-base font-semibold" style={{ color: '#000' }}>Pessoa Física</h2>
                  <button
                    type="button"
                    onClick={closePessoaFisicaLookup}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-[3px] text-slate-700 transition cursor-pointer p-0"
                    aria-label="Fechar localizar pessoa física"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 6 6 18" />
                      <path d="M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <RotuloCampo texto="Sequência" colecao="pessoa_fisica" campo="nr_sequencia" />
                    <input
                      inputMode="numeric"
                      maxLength={10}
                      className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none"
                      value={lookupForm.nr_sequencia}
                      onChange={(e) => setLookupForm({ ...lookupForm, nr_sequencia: e.target.value })}
                    />
                  </div>
                  <div>
                    <RotuloCampo texto="Nome" colecao="pessoa_fisica" campo="ds_nome" />
                    <input
                      className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none"
                      value={lookupForm.ds_nome}
                      onChange={(e) => setLookupForm({ ...lookupForm, ds_nome: e.target.value })}
                    />
                  </div>
                  <div>
                    <RotuloCampo texto="CPF" colecao="pessoa_fisica" campo="nr_cpf" />
                    <input
                      inputMode="numeric"
                      maxLength={14}
                      className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none"
                      value={lookupForm.nr_cpf}
                      onChange={(e) => setLookupForm({ ...lookupForm, nr_cpf: applyCpfMask(e.target.value) })}
                    />
                  </div>
                </div>
                </div>
                <div className="flex-shrink-0 flex items-center justify-end gap-2 p-[15px]">
                  <BotaoSalvarFiltro onClick={() => salvarFiltroDoLookup('pessoa_fisica', lookupForm, applyLookupFilter)} />
                  <button
                    type="button"
                    onClick={clearLookupFilter}
                    className="px-4 py-2.5 text-sm text-black transition rounded-[3px] border-b button-cancel cursor-pointer min-w-[96px] justify-center"
                    style={{ backgroundColor: '#ddd', borderBottomColor: '#000' } as React.CSSProperties}
                  >
                    Limpar
                  </button>
                  <button
                    type="button"
                    onClick={applyLookupFilter}
                    className="px-4 py-2.5 text-sm text-white transition rounded-[3px] border-b button-save cursor-pointer min-w-[96px] justify-center"
                    style={{ backgroundColor: '#003056', borderBottomColor: '#000' } as React.CSSProperties}
                  >
                    Filtrar
                  </button>
                </div>
              </div>
              <div className="flex-1 min-h-0 overflow-hidden flex flex-col lookup-right">
                {!lookupApplied || filteredLookupPessoasFisicas.length === 0 ? (
                  <div className="flex h-full items-center justify-center p-[15px] text-sm text-slate-600">
                    Nenhum registro encontrado.
                  </div>
                ) : (
                  <PessoaFisicaLookupTable {...colunasPorIndice('config_colunas_lookup_pessoa_fisica')} columnLookups={pfCgLookups}
                    pessoasFisicas={filteredLookupPessoasFisicas}
                    onSelect={handlePessoaFisicaSelect}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {alunoPessoaFisicaLookupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="absolute inset-0 bg-black/40" onClick={closeAlunoPessoaFisicaLookup} />
          <div className="relative w-full max-w-[1200px] bg-white p-0 shadow-xl shadow-black/20 h-[720px] max-h-[90vh] overflow-hidden">
            <div className="flex h-full">
              <div className="w-[360px] lookup-left flex flex-col min-h-0">
                <div className="p-[15px] overflow-auto flex-1 min-h-0">
                <div className="flex items-center justify-between gap-2 mb-4">
                  <h2 className="text-base font-semibold" style={{ color: '#000' }}>Pessoa Física</h2>
                  <button
                    type="button"
                    onClick={closeAlunoPessoaFisicaLookup}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-[3px] text-slate-700 transition cursor-pointer p-0"
                    aria-label="Fechar localizar pessoa física"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 6 6 18" />
                      <path d="M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <RotuloCampo texto="Sequência" colecao="pessoa_fisica" campo="nr_sequencia" />
                    <input
                      inputMode="numeric"
                      maxLength={10}
                      className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none"
                      value={alunoLookupForm.nr_sequencia}
                      onChange={(e) => setAlunoLookupForm({ ...alunoLookupForm, nr_sequencia: e.target.value })}
                    />
                  </div>
                  <div>
                    <RotuloCampo texto="Nome" colecao="pessoa_fisica" campo="ds_nome" />
                    <input
                      className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none"
                      value={alunoLookupForm.ds_nome}
                      onChange={(e) => setAlunoLookupForm({ ...alunoLookupForm, ds_nome: e.target.value })}
                    />
                  </div>
                  <div>
                    <RotuloCampo texto="CPF" colecao="pessoa_fisica" campo="nr_cpf" />
                    <input
                      inputMode="numeric"
                      maxLength={14}
                      className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none"
                      value={alunoLookupForm.nr_cpf}
                      onChange={(e) => setAlunoLookupForm({ ...alunoLookupForm, nr_cpf: applyCpfMask(e.target.value) })}
                    />
                  </div>
                </div>
                </div>
                <div className="flex-shrink-0 flex items-center justify-end gap-2 p-[15px]">
                  <BotaoSalvarFiltro onClick={() => salvarFiltroDoLookup('pessoa_fisica', alunoLookupForm, applyAlunoLookupFilter)} />
                  <button
                    type="button"
                    onClick={clearAlunoLookupFilter}
                    className="px-4 py-2.5 text-sm text-black transition rounded-[3px] border-b button-cancel cursor-pointer min-w-[96px] justify-center"
                    style={{ backgroundColor: '#ddd', borderBottomColor: '#000' } as React.CSSProperties}
                  >
                    Limpar
                  </button>
                  <button
                    type="button"
                    onClick={applyAlunoLookupFilter}
                    className="px-4 py-2.5 text-sm text-white transition rounded-[3px] border-b button-save cursor-pointer min-w-[96px] justify-center"
                    style={{ backgroundColor: '#003056', borderBottomColor: '#000' } as React.CSSProperties}
                  >
                    Filtrar
                  </button>
                </div>
              </div>
              <div className="flex-1 min-h-0 overflow-hidden flex flex-col lookup-right">
                {!alunoLookupApplied || filteredAlunoLookupPessoasFisicas.length === 0 ? (
                  <div className="flex h-full items-center justify-center p-[15px] text-sm text-slate-600">
                    Nenhum registro encontrado.
                  </div>
                ) : (
                  <PessoaFisicaLookupTable {...colunasPorIndice('config_colunas_lookup_pessoa_fisica')} columnLookups={pfCgLookups}
                    pessoasFisicas={filteredAlunoLookupPessoasFisicas}
                    onSelect={handleAlunoPessoaFisicaSelect}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {colaboradorPessoaJuridicaLookupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="absolute inset-0 bg-black/40" onClick={closeColaboradorPessoaJuridicaLookup} />
          <div className="relative w-full max-w-[1200px] bg-white p-0 shadow-xl shadow-black/20 h-[720px] max-h-[90vh] overflow-hidden">
            <div className="flex h-full">
              <div className="w-[360px] lookup-left flex flex-col min-h-0">
                <div className="p-[15px] overflow-auto flex-1 min-h-0">
                <div className="flex items-center justify-between gap-2 mb-4">
                  <h2 className="text-base font-semibold" style={{ color: '#000' }}>Pessoa Jurídica</h2>
                  <button
                    type="button"
                    onClick={closeColaboradorPessoaJuridicaLookup}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-[3px] text-slate-700 transition cursor-pointer p-0"
                    aria-label="Fechar localizar pessoa jurídica"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 6 6 18" />
                      <path d="M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <RotuloCampo texto="Sequência" colecao="pessoa_juridica" campo="nr_sequencia" />
                    <input
                      inputMode="numeric"
                      maxLength={10}
                      className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none"
                      value={colaboradorPjLookupForm.nr_sequencia}
                      onChange={(e) => setColaboradorPjLookupForm({ ...colaboradorPjLookupForm, nr_sequencia: e.target.value.replace(/\D/g, '') })}
                    />
                  </div>
                  <div>
                    <RotuloCampo texto="Razão social" colecao="pessoa_juridica" campo="ds_razao_social" />
                    <input
                      className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none"
                      value={colaboradorPjLookupForm.ds_razao_social}
                      onChange={(e) => setColaboradorPjLookupForm({ ...colaboradorPjLookupForm, ds_razao_social: e.target.value })}
                    />
                  </div>
                  <div>
                    <RotuloCampo texto="CNPJ" colecao="pessoa_juridica" campo="nr_cnpj" />
                    <input
                      inputMode="numeric"
                      maxLength={18}
                      className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none"
                      value={colaboradorPjLookupForm.nr_cnpj}
                      onChange={(e) => setColaboradorPjLookupForm({ ...colaboradorPjLookupForm, nr_cnpj: applyCnpjMask(e.target.value) })}
                    />
                  </div>
                </div>
                </div>
                <div className="flex-shrink-0 flex items-center justify-end gap-2 p-[15px]">
                  <BotaoSalvarFiltro onClick={() => salvarFiltroDoLookup('pessoa_juridica', colaboradorPjLookupForm, applyColaboradorPjLookupFilter)} />
                  <button
                    type="button"
                    onClick={clearColaboradorPjLookupFilter}
                    className="px-4 py-2.5 text-sm text-black transition rounded-[3px] border-b button-cancel cursor-pointer min-w-[96px] justify-center"
                    style={{ backgroundColor: '#ddd', borderBottomColor: '#000' } as React.CSSProperties}
                  >
                    Limpar
                  </button>
                  <button
                    type="button"
                    onClick={applyColaboradorPjLookupFilter}
                    className="px-4 py-2.5 text-sm text-white transition rounded-[3px] border-b button-save cursor-pointer min-w-[96px] justify-center"
                    style={{ backgroundColor: '#003056', borderBottomColor: '#000' } as React.CSSProperties}
                  >
                    Filtrar
                  </button>
                </div>
              </div>
              <div className="flex-1 min-h-0 overflow-hidden flex flex-col lookup-right">
                {!colaboradorPjLookupApplied || filteredColaboradorPjLookupPessoasJuridicas.length === 0 ? (
                  <div className="flex h-full items-center justify-center p-[15px] text-sm text-slate-600">
                    Nenhum registro encontrado.
                  </div>
                ) : (
                  <PessoaJuridicaLookupTable {...colunasPorIndice('config_colunas_lookup_pessoa_juridica')}
                    pessoasJuridicas={filteredColaboradorPjLookupPessoasJuridicas}
                    onSelect={handleColaboradorPessoaJuridicaSelect}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {adminPessoaFisicaLookupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="absolute inset-0 bg-black/40" onClick={closeAdminPessoaFisicaLookup} />
          <div className="relative w-full max-w-[1200px] bg-white p-0 shadow-xl shadow-black/20 h-[720px] max-h-[90vh] overflow-hidden">
            <div className="flex h-full">
              <div className="w-[360px] lookup-left flex flex-col min-h-0">
                <div className="p-[15px] overflow-auto flex-1 min-h-0">
                <div className="flex items-center justify-between gap-2 mb-4">
                  <h2 className="text-base font-semibold" style={{ color: '#000' }}>Pessoa Física</h2>
                  <button
                    type="button"
                    onClick={closeAdminPessoaFisicaLookup}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-[3px] text-slate-700 transition cursor-pointer p-0"
                    aria-label="Fechar localizar pessoa física"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 6 6 18" />
                      <path d="M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <RotuloCampo texto="Sequência" colecao="pessoa_fisica" campo="nr_sequencia" />
                    <input
                      inputMode="numeric"
                      maxLength={10}
                      className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none"
                      value={adminPessoaFisicaLookupForm.nr_sequencia}
                      onChange={(e) => setAdminPessoaFisicaLookupForm({ ...adminPessoaFisicaLookupForm, nr_sequencia: e.target.value })}
                    />
                  </div>
                  <div>
                    <RotuloCampo texto="Nome" colecao="pessoa_fisica" campo="ds_nome" />
                    <input
                      className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none"
                      value={adminPessoaFisicaLookupForm.ds_nome}
                      onChange={(e) => setAdminPessoaFisicaLookupForm({ ...adminPessoaFisicaLookupForm, ds_nome: e.target.value })}
                    />
                  </div>
                  <div>
                    <RotuloCampo texto="CPF" colecao="pessoa_fisica" campo="nr_cpf" />
                    <input
                      inputMode="numeric"
                      maxLength={14}
                      className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none"
                      value={adminPessoaFisicaLookupForm.nr_cpf}
                      onChange={(e) => setAdminPessoaFisicaLookupForm({ ...adminPessoaFisicaLookupForm, nr_cpf: applyCpfMask(e.target.value) })}
                    />
                  </div>
                </div>
                </div>
                <div className="flex-shrink-0 flex items-center justify-end gap-2 p-[15px]">
                  <BotaoSalvarFiltro onClick={() => salvarFiltroDoLookup('pessoa_fisica', adminPessoaFisicaLookupForm, applyAdminPessoaFisicaLookupFilter)} />
                  <button
                    type="button"
                    onClick={clearAdminPessoaFisicaLookupFilter}
                    className="px-4 py-2.5 text-sm text-black transition rounded-[3px] border-b button-cancel cursor-pointer min-w-[96px] justify-center"
                    style={{ backgroundColor: '#ddd', borderBottomColor: '#000' } as React.CSSProperties}
                  >
                    Limpar
                  </button>
                  <button
                    type="button"
                    onClick={applyAdminPessoaFisicaLookupFilter}
                    className="px-4 py-2.5 text-sm text-white transition rounded-[3px] border-b button-save cursor-pointer min-w-[96px] justify-center"
                    style={{ backgroundColor: '#003056', borderBottomColor: '#000' } as React.CSSProperties}
                  >
                    Filtrar
                  </button>
                </div>
              </div>
              <div className="flex-1 min-h-0 overflow-hidden flex flex-col lookup-right">
                {!adminPessoaFisicaLookupApplied || pessoasFisicas.filter((pessoa) => {
                  if (adminPessoaFisicaLookupFilter.nr_sequencia) {
                    if (String(pessoa.nr_sequencia) !== adminPessoaFisicaLookupFilter.nr_sequencia.trim()) return false;
                  }
                  if (adminPessoaFisicaLookupFilter.ds_nome && !pessoa.ds_nome.toLowerCase().includes(adminPessoaFisicaLookupFilter.ds_nome.toLowerCase())) return false;
                  if (adminPessoaFisicaLookupFilter.nr_cpf) {
                    const queryCpf = adminPessoaFisicaLookupFilter.nr_cpf.replace(/\D/g, '');
                    const pessoaCpf = pessoa.nr_cpf.replace(/\D/g, '');
                    if (!pessoaCpf.includes(queryCpf)) return false;
                  }
                  return true;
                }).length === 0 ? (
                  <div className="flex h-full items-center justify-center p-[15px] text-sm text-slate-600">
                    Nenhum registro encontrado.
                  </div>
                ) : (
                  <PessoaFisicaLookupTable {...colunasPorIndice('config_colunas_lookup_pessoa_fisica')} columnLookups={pfCgLookups}
                    pessoasFisicas={pessoasFisicas.filter((pessoa) => {
                      if (adminPessoaFisicaLookupFilter.nr_sequencia) {
                        if (String(pessoa.nr_sequencia) !== adminPessoaFisicaLookupFilter.nr_sequencia.trim()) return false;
                      }
                      if (adminPessoaFisicaLookupFilter.ds_nome && !pessoa.ds_nome.toLowerCase().includes(adminPessoaFisicaLookupFilter.ds_nome.toLowerCase())) return false;
                      if (adminPessoaFisicaLookupFilter.nr_cpf) {
                        const queryCpf = adminPessoaFisicaLookupFilter.nr_cpf.replace(/\D/g, '');
                        const pessoaCpf = pessoa.nr_cpf.replace(/\D/g, '');
                        if (!pessoaCpf.includes(queryCpf)) return false;
                      }
                      return true;
                    })}
                    onSelect={handleAdminPessoaFisicaSelect}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {naturalidadeLookupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="absolute inset-0 bg-black/40" onClick={closeNaturalidadeLookup} />
          <div className="relative w-full max-w-[1200px] bg-white p-0 shadow-xl shadow-black/20 h-[720px] max-h-[90vh] overflow-hidden">
            <div className="flex h-full">
              <div className="w-[360px] lookup-left flex flex-col min-h-0">
                <div className="p-[15px] overflow-auto flex-1 min-h-0">
                <div className="flex items-center justify-between gap-2 mb-4">
                  <h2 className="text-base font-semibold" style={{ color: '#000' }}>Cidade</h2>
                  <button
                    type="button"
                    onClick={closeNaturalidadeLookup}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-[3px] text-slate-700 transition cursor-pointer p-0"
                    aria-label="Fechar localizar cidade"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 6 6 18" />
                      <path d="M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <RotuloCampo texto="Código IBGE" colecao="API do IBGE (municípios)" campo="id" tipo="int64" />
                    <input
                      inputMode="numeric"
                      maxLength={7}
                      className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none"
                      value={cidadeLookupForm.codigo}
                      onChange={(e) => setCidadeLookupForm({ ...cidadeLookupForm, codigo: e.target.value.replace(/\D/g, '') })}
                    />
                  </div>
                  <div>
                    <RotuloCampo texto="Descrição" colecao="API do IBGE (municípios)" campo="nome" />
                    <input
                      className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none"
                      value={cidadeLookupForm.nome}
                      onChange={(e) => setCidadeLookupForm({ ...cidadeLookupForm, nome: e.target.value })}
                    />
                  </div>
                  <div>
                    <RotuloCampo texto="Estado" colecao="API do IBGE (municípios)" campo="microrregiao.mesorregiao.UF.sigla" />
                    <Select
                      value={cidadeLookupForm.uf}
                      onChange={(v) => setCidadeLookupForm({ ...cidadeLookupForm, uf: v })}
                      options={UF_OPTIONS}
                    />
                  </div>
                </div>
                </div>
                <div className="flex-shrink-0 flex items-center justify-end gap-2 p-[15px]">
                  <BotaoSalvarFiltro onClick={() => salvarFiltroDoLookup('cidade', cidadeLookupForm, () => { void handleCidadeSearch(cidadeLookupForm); })} />
                  <button
                    type="button"
                    onClick={clearCidadeLookup}
                    className="px-4 py-2.5 text-sm text-black transition rounded-[3px] border-b button-cancel cursor-pointer min-w-[96px] justify-center"
                    style={{ backgroundColor: '#ddd', borderBottomColor: '#000' } as React.CSSProperties}
                  >
                    Limpar
                  </button>
                  <button
                    type="button"
                    onClick={() => { void handleCidadeSearch(); }}
                    className="px-4 py-2.5 text-sm text-white transition rounded-[3px] border-b button-save cursor-pointer min-w-[96px] justify-center"
                    style={{ backgroundColor: '#003056', borderBottomColor: '#000' } as React.CSSProperties}
                  >
                    Filtrar
                  </button>
                </div>
              </div>
              <div className="flex-1 min-h-0 overflow-hidden flex flex-col lookup-right">
                {cidadeLoading ? (
                  <LoadingModal open message="Carregando..." />
                ) : !cidadeLookupApplied || cidadeResults.length === 0 ? (
                  <div className="flex h-full items-center justify-center p-[15px] text-sm text-slate-600">
                    Nenhum registro encontrado.
                  </div>
                ) : (
                  <CidadeLookupTable {...colunasPorIndice('config_colunas_lookup_cidade')}
                    cidades={cidadeResults}
                    onSelect={handleCidadeSelect}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {pjCidadeLookupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="absolute inset-0 bg-black/40" onClick={closePjCidadeLookup} />
          <div className="relative w-full max-w-[1200px] bg-white p-0 shadow-xl shadow-black/20 h-[720px] max-h-[90vh] overflow-hidden">
            <div className="flex h-full">
              <div className="w-[360px] lookup-left flex flex-col min-h-0">
                <div className="p-[15px] overflow-auto flex-1 min-h-0">
                <div className="flex items-center justify-between gap-2 mb-4">
                  <h2 className="text-base font-semibold" style={{ color: '#000' }}>Cidade</h2>
                  <button
                    type="button"
                    onClick={closePjCidadeLookup}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-[3px] text-slate-700 transition cursor-pointer p-0"
                    aria-label="Fechar localizar cidade"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 6 6 18" />
                      <path d="M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <RotuloCampo texto="Código IBGE" colecao="API do IBGE (municípios)" campo="id" tipo="int64" />
                    <input
                      inputMode="numeric"
                      maxLength={7}
                      className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none"
                      value={pjCidadeLookupForm.codigo}
                      onChange={(e) => setPjCidadeLookupForm({ ...pjCidadeLookupForm, codigo: e.target.value.replace(/\D/g, '') })}
                    />
                  </div>
                  <div>
                    <RotuloCampo texto="Descrição" colecao="API do IBGE (municípios)" campo="nome" />
                    <input
                      className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none"
                      value={pjCidadeLookupForm.nome}
                      onChange={(e) => setPjCidadeLookupForm({ ...pjCidadeLookupForm, nome: e.target.value })}
                    />
                  </div>
                  <div>
                    <RotuloCampo texto="Estado" colecao="API do IBGE (municípios)" campo="microrregiao.mesorregiao.UF.sigla" />
                    <Select
                      value={pjCidadeLookupForm.uf}
                      onChange={(v) => setPjCidadeLookupForm({ ...pjCidadeLookupForm, uf: v })}
                      options={UF_OPTIONS}
                    />
                  </div>
                </div>
                </div>
                <div className="flex-shrink-0 flex items-center justify-end gap-2 p-[15px]">
                  <BotaoSalvarFiltro onClick={() => salvarFiltroDoLookup('cidade', pjCidadeLookupForm, () => { void handlePjCidadeSearch(pjCidadeLookupForm); })} />
                  <button
                    type="button"
                    onClick={clearPjCidadeLookup}
                    className="px-4 py-2.5 text-sm text-black transition rounded-[3px] border-b button-cancel cursor-pointer min-w-[96px] justify-center"
                    style={{ backgroundColor: '#ddd', borderBottomColor: '#000' } as React.CSSProperties}
                  >
                    Limpar
                  </button>
                  <button
                    type="button"
                    onClick={() => { void handlePjCidadeSearch(); }}
                    className="px-4 py-2.5 text-sm text-white transition rounded-[3px] border-b button-save cursor-pointer min-w-[96px] justify-center"
                    style={{ backgroundColor: '#003056', borderBottomColor: '#000' } as React.CSSProperties}
                  >
                    Filtrar
                  </button>
                </div>
              </div>
              <div className="flex-1 min-h-0 overflow-hidden flex flex-col lookup-right">
                {pjCidadeLoading ? (
                  <LoadingModal open message="Carregando..." />
                ) : !pjCidadeLookupApplied || pjCidadeResults.length === 0 ? (
                  <div className="flex h-full items-center justify-center p-[15px] text-sm text-slate-600">
                    Nenhum registro encontrado.
                  </div>
                ) : (
                  <CidadeLookupTable {...colunasPorIndice('config_colunas_lookup_cidade')}
                    cidades={pjCidadeResults}
                    onSelect={handlePjCidadeSelect}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {detailModalOpen && selectedAuditIndex !== null && (() => {
        // Logs antigos de alteração de imagem gravavam o estado em `depois` (sem `detalhes`).
        const estadoDoLog = (log?: AuditEntry) => log?.detalhes ?? (log as { depois?: unknown } | undefined)?.depois;
        const after = estadoDoLog(auditLogs[selectedAuditIndex]) ?? {};
        const before = estadoDoLog(auditLogs[selectedAuditIndex + 1]) ?? null;
        const isPj = auditDocumentType === 'pessoa_juridica';
        const isImagem = auditDocumentType === 'imagem';
        const isAviso = auditDocumentType === 'aviso';
        const isRegra = auditDocumentType === 'regra';
        const isCampo = auditDocumentType === 'campo';
        const isUsuario = auditDocumentType === 'usuario';
        const isPerfil = auditDocumentType === 'perfil';
        const isAluno = auditDocumentType === 'aluno';
        const isColaborador = auditDocumentType === 'colaborador';
        const isPeriodoLetivo = auditDocumentType === 'periodo_letivo';
        const isFeriado = auditDocumentType === 'periodo_letivo_feriado';
        const isAtivo = auditDocumentType === 'pat_ativo';
        const isAtivoResponsavel = auditDocumentType === 'pat_ativo_responsavel';
        const isAlunoResponsavel = auditDocumentType === 'aluno_responsavel';
        const isPfEndereco = auditDocumentType === 'pessoa_fisica_residencial' || auditDocumentType === 'pessoa_fisica_comercial';
        const isPfSaude = auditDocumentType === 'pessoa_fisica_saude';
        const isParametros = auditDocumentType === 'parametro';
        const isManutencao = auditDocumentType === 'pat_manutencao';
        const isRelatorio = auditDocumentType === 'relatorio';
        const isBanda = isRelatorio && relatorioAuditTipo === 'relatorio_banda';
        const isElemento = isRelatorio && relatorioAuditTipo === 'relatorio_banda_elemento';
        const isParametroRel = isRelatorio && relatorioAuditTipo === 'relatorio_parametro';
        // Para bandas, os detalhes já contêm os dados da banda diretamente
        const bandaAfter = isBanda ? after : null;
        const bandaBefore = isBanda ? before : null;
        // Flattening: extrair campos aninhados (configPdf.*) para o relatório
        const flattenRelatorio = (detalhes: any): Record<string, any> => {
          if (!detalhes) return {};
          const flat: Record<string, any> = {};
          flat.nr_sequencia = detalhes.nr_sequencia;
          flat.ds_relatorio = detalhes.ds_relatorio;
          flat.formato = detalhes.ie_formato;
          flat.ie_status = detalhes.ie_status;
          const cfg = detalhes.configPdf || {};
          flat.titulo_arquivo = detalhes.ds_nome_arquivo ?? cfg.titulo ?? '';
          // Campos do PDF (margens em cm).
          flat.pdf_formato_papel = detalhes.nr_seq_formato_papel ?? '';
          flat.pdf_orientacao = detalhes.ie_orientacao ?? '';
          flat.pdf_borda = detalhes.ie_borda ?? '';
          flat.pdf_margem_superior = formatarMedida(detalhes.nr_margem_superior);
          flat.pdf_margem_inferior = formatarMedida(detalhes.nr_margem_inferior);
          flat.pdf_margem_esquerda = formatarMedida(detalhes.nr_margem_esquerda);
          flat.pdf_margem_direita = formatarMedida(detalhes.nr_margem_direita);
          // Bandas (resumo)
          const bandas = detalhes.bandas;
          if (Array.isArray(bandas)) {
            flat.bandas_sequencia = bandas.map((b: any, i: number) =>
              `${i + 1}. ${b.ds_banda || '(sem nome)'} [${b.ie_tipo_banda || '?'}]`
            ).join('\n');
          } else {
            flat.bandas_sequencia = '';
          }
          flat.dt_criacao = detalhes.dt_criacao;
          flat.dt_alteracao = detalhes.dt_alteracao;
          flat.ds_usuario_criacao = detalhes.ds_usuario_criacao;
          flat.ds_usuario_alteracao = detalhes.ds_usuario_alteracao;
          return flat;
        };
        const relatorioFlatAfter = isRelatorio && !isBanda ? flattenRelatorio(after) : null;
        const relatorioFlatBefore = isRelatorio && !isBanda ? flattenRelatorio(before) : null;
        const isCg = auditDocumentType === 'cg_sexo' || auditDocumentType === 'cg_estado_civil' || auditDocumentType === 'cg_cor_raca' || auditDocumentType === 'cg_profissao' || auditDocumentType === 'cg_orgao_emissor' || auditDocumentType === 'cg_logradouro' || auditDocumentType === 'cg_grau_parentesco' || auditDocumentType === 'cg_cargo' || auditDocumentType === 'cg_vinculo_contratual' || auditDocumentType === 'cg_localizacao' || auditDocumentType === 'cg_marca' || auditDocumentType === 'pat_categoria' || auditDocumentType === 'cg_sistema_operacional' || auditDocumentType === 'curso' || auditDocumentType === 'cg_combustivel' || auditDocumentType === 'cg_modalidade_ensino' || auditDocumentType === 'cg_formato_papel' || auditDocumentType === 'cg_tipo_papel';
        const fieldsOrder = isPj
          ? [
              'nr_sequencia',
              'ds_razao_social',
              'ds_nome_fantasia',
              'nr_cnpj',
              'nr_inscricao_estadual',
              'nr_inscricao_municipal',
              'dt_abertura',
              'ds_email',
              'nr_telefone',
              'nr_cep',
              'nr_seq_logradouro',
              'ds_endereco',
              'nr_endereco',
              'ds_bairro',
              'ds_complemento',
              'sg_estado',
              'cd_ibge_cidade',
              'dt_criacao',
              'dt_alteracao',
            ]
          : isUsuario
          ? [
              'nr_sequencia',
              'nr_seq_pessoa_fisica',
              'ds_usuario',
              'ds_usuario_alternativo',
              'ds_email',
              'ie_status',
              'ds_observacao',
              'dt_criacao',
              'dt_alteracao',
            ]
          : isAviso
          ? [avisoAuditCampo]
          : isRegra
          ? [...CAMPOS_REGRA[regraAuditId]]
          : isCampo
          ? ['ds_campo', 'ie_status_campo']
          : isImagem
          ? [
              'nr_sequencia',
              'ds_imagem',
              'ie_arquivo',
              'dt_criacao',
              'dt_alteracao',
            ]
          : isPerfil
          ? [
              'nr_sequencia',
              'ds_perfil',
              'ds_observacao',
              'ie_status',
              'config_funcoes',
              'config_permissoes',
              'dt_criacao',
              'dt_alteracao',
            ]
          : isFeriado
          ? ['nr_sequencia', 'nr_seq_periodo_letivo', 'dt_feriado', 'ds_feriado', 'ie_tipo_feriado', 'dt_criacao', 'dt_alteracao']
          : auditDocumentType === 'disciplina'
          ? ['nr_sequencia', 'ds_disciplina', 'ds_observacao', 'dt_criacao', 'dt_alteracao']
          : auditDocumentType === 'turma_disciplina'
          ? ['nr_sequencia', 'nr_seq_turma', 'nr_seq_disciplina', 'ie_status', 'dt_criacao', 'dt_alteracao']
          : auditDocumentType === 'copia'
          ? ['nr_sequencia', 'dt_recebimento', 'dt_impressao', 'dt_entrega', 'ie_status', 'dt_status', 'ds_motivo_status', 'nr_seq_solicitante', 'nr_seq_turma_disciplina', 'qt_copias', 'qt_folhas', 'ie_frente_verso', 'ie_grampear', 'ie_guilhotinar', 'nr_seq_formato_papel', 'nr_seq_tipo_papel', 'ie_arquivo', 'dt_criacao', 'dt_alteracao']
          : auditDocumentType === 'turma'
          ? ['nr_sequencia', 'ds_turma', 'nr_seq_curso', 'nr_seq_periodo_letivo', 'qt_max_alunos', 'nr_seq_localizacao', 'nr_seq_modalidade_ensino', 'dt_criacao', 'dt_alteracao']
          : isAtivoResponsavel
          ? ['nr_sequencia', 'nr_seq_ativo', 'nr_seq_colaborador', 'dt_criacao', 'dt_alteracao']
          : isPfEndereco
          ? ['nr_sequencia', 'nr_seq_pessoa_fisica', 'nr_cep', 'ds_endereco', 'nr_seq_logradouro', 'nr_endereco', 'ds_bairro', 'ds_complemento', 'dt_criacao', 'dt_alteracao']
          : isPfSaude
          ? ['nr_sequencia', 'nr_seq_pessoa_fisica', 'ds_tipo_sanguineo', 'ds_alergia', 'ds_medicamento_continuo', 'ds_restricao_alimentar', 'ds_necessidade_especial', 'ds_observacao_medica', 'dt_criacao', 'dt_alteracao']
          : isAlunoResponsavel
          ? ['nr_sequencia', 'nr_seq_aluno', 'nr_seq_pessoa_fisica', 'nr_seq_grau_parentesco', 'dt_criacao', 'dt_alteracao']
          : isPeriodoLetivo
          ? [
              'nr_sequencia',
              'nr_ano',
              'ds_periodo_letivo',
              'qt_dias_letivos',
              'dt_inicio',
              'dt_previsao_termino',
              'dt_termino',
              'dt_reativacao',
              'ie_status',
              'dt_criacao',
              'dt_alteracao',
            ]
          : isColaborador
          ? [
              'nr_sequencia',
              'nr_seq_pessoa_fisica',
              'nr_seq_pessoa_juridica',
              'nr_matricula',
              'dt_admissao',
              'nr_seq_vinculo_contratual',
              'ie_status',
              'dt_status',
              'ds_motivo_status',
              'nr_seq_cargo',
              'ie_coordenador',
              'ie_professor',
              'ie_fornecedor',
              'ie_prestador_servico',
              'dt_criacao',
              'dt_alteracao',
            ]
          : isAluno
          ? [
              'nr_sequencia',
              'nr_seq_pessoa_fisica',
              'nr_matricula',
              'dt_ingresso',
              'ie_status',
              'dt_status',
              'ds_status',
              'responsaveis',
              'dt_criacao',
              'dt_alteracao',
            ]
          : isAtivo
          ? [
              'nr_sequencia', 'cd_externo', 'ds_ativo', 'nr_seq_categoria',
              'nr_seq_localizacao', 'nr_seq_marca', 'nr_seq_fornecedor', 'ds_modelo', 'nr_serie',
              'ds_qr_code', 'ds_codigo_barras', 'vl_aquisicao', 'dt_aquisicao', 'dt_garantia',
              'ie_status', 'dt_ultima_manutencao', 'nr_seq_ultima_manutencao', 'dt_status', 'ds_motivo_status', 'ds_motivo_transferencia',
              'ds_processador', 'qt_ram', 'ie_ram', 'qt_armazenamento', 'ie_armazenamento',
              'ds_endereco_mac', 'ds_ip', 'nr_seq_sistema_operacional',
              'cd_placa', 'cd_renavam', 'nr_ano', 'ds_cor', 'nr_seq_combustivel',
              'responsaveis', 'ds_observacao',
              'dt_criacao', 'dt_alteracao',
            ]
          : isParametros
          ? [
              'ds_regra',
              'cd_cor',
              'ie_regra',
              'dt_criacao', 'dt_alteracao',
            ]
          : isManutencao
          ? [
              'nr_sequencia', 'nr_seq_ativo', 'nr_seq_prestador_servico', 'dt_envio', 'dt_termino', 'ie_status_manutencao', 'vl_total', 'ds_motivo_manutencao', 'ds_correcoes', 'ds_observacao',
              'dt_criacao', 'dt_alteracao',
            ]                      : isRelatorio && isBanda
          ? [
              'nr_sequencia', 'ds_banda', 'ie_tipo', 'qt_altura', 'ie_tipo_banda', 'ie_colecao_principal', 'nr_posicao', 'nr_altura',
              'ie_borda_superior', 'ie_borda_inferior', 'ie_borda_esquerda', 'ie_borda_direita',
              'espessuraLabel', 'topoLabel', 'espessuraCampo', 'topoRegistro', 'bgLabel', 'bgCampo',
              'corLabelGlobal', 'corCampoGlobal', 'fonteLabel', 'tamanhoFonteLabel', 'fonteCampo', 'tamanhoFonteCampo',
              'ie_status',
              'dt_criacao', 'dt_alteracao',
            ]
          : isRelatorio && isElemento
          ? [
              'nr_sequencia', 'ds_elemento', 'ie_tipo', 'nr_seq_imagem', 'qt_esquerda', 'qt_topo', 'ie_estilo', 'qt_largura', 'qt_altura',
              'ie_alinhamento', 'cd_background', 'cd_cor', 'ie_fonte', 'qt_fonte', 'ds_label', 'cd_alias', 'ds_conteudo',
              'ie_borda_superior', 'ie_borda_inferior', 'ie_borda_esquerda', 'ie_borda_direita',
              'nr_seq_banda', 'nr_seq_relatorio',
              'ie_status',
              'dt_criacao', 'dt_alteracao',
            ]
          : isRelatorio && isParametroRel
          ? [
              'nr_sequencia', 'nr_seq_relatorio', 'ie_colecao', 'ie_campo', 'operador', 'ie_mascara',
              'vl_padrao', 'valorFinal', 'ie_conector', 'ie_parametro', 'ds_label', 'ie_obrigatorio',
              'ie_status',
              'dt_criacao', 'dt_alteracao',
            ]
          : isRelatorio
          ? [
              'nr_sequencia', 'ds_relatorio', 'formato', 'ie_status', 'titulo_arquivo',
              'pdf_formato_papel', 'pdf_orientacao', 'pdf_borda',
              'pdf_margem_superior', 'pdf_margem_inferior', 'pdf_margem_esquerda', 'pdf_margem_direita',
              'bandas_sequencia',
              'dt_criacao', 'dt_alteracao',
            ]
          : isCg
          ? [
              'nr_sequencia',
              auditDocumentType === 'cg_estado_civil' ? 'ds_estado_civil' : auditDocumentType === 'cg_cor_raca' ? 'ds_cor_raca' : auditDocumentType === 'cg_profissao' ? 'ds_profissao' : auditDocumentType === 'cg_orgao_emissor' ? 'ds_orgao_emissor' : auditDocumentType === 'cg_logradouro' ? 'ds_logradouro' : auditDocumentType === 'cg_grau_parentesco' ? 'ds_grau_parentesco' : auditDocumentType === 'cg_cargo' ? 'ds_cargo' : auditDocumentType === 'cg_vinculo_contratual' ? 'ds_vinculo_contratual' : auditDocumentType === 'cg_localizacao' ? 'ds_localizacao' : auditDocumentType === 'cg_marca' ? 'ds_marca' : auditDocumentType === 'pat_categoria' ? 'ds_categoria' : auditDocumentType === 'cg_sistema_operacional' ? 'ds_sistema_operacional' : auditDocumentType === 'curso' ? 'ds_curso' : auditDocumentType === 'cg_combustivel' ? 'ds_combustivel' : auditDocumentType === 'cg_modalidade_ensino' ? 'ds_modalidade_ensino' : auditDocumentType === 'cg_formato_papel' ? 'ds_formato_papel' : auditDocumentType === 'cg_tipo_papel' ? 'ds_tipo_papel' : 'ds_sexo',
              ...(auditDocumentType === 'cg_orgao_emissor' ? ['sg_orgao_emissor'] : auditDocumentType === 'cg_logradouro' ? ['sg_logradouro'] : []),
              ...(auditDocumentType === 'cg_profissao' ? ['nr_cbo'] : auditDocumentType === 'pat_categoria' || auditDocumentType === 'curso' ? ['ds_observacao'] : auditDocumentType === 'cg_formato_papel' ? ['qt_largura', 'qt_altura'] : []),
              'ie_status',
              'dt_criacao',
              'dt_alteracao',
            ]
          : [
              'nr_sequencia',
              'ds_nome',
              'nr_cpf',
              'dt_nascimento',
              'nr_seq_sexo',
              'nr_seq_estado_civil',
              'nr_seq_cor_raca',
              'nr_seq_profissao',
              'cd_ibge_naturalidade',
              'nr_rg',
              'dt_emissao',
              'nr_seq_orgao_emissor',
              'sg_estado',
              'ds_email',
              'nr_telefone',
              'nr_cep',
              'nr_seq_logradouro',
              'ds_endereco',
              'nr_endereco',
              'ds_bairro',
              'ds_complemento',
              'ds_tipo_sanguineo',
              'ds_alergia',
              'ds_medicamento_continuo',
              'ds_restricao_alimentar',
              'ds_necessidade_especial',
              'ds_observacao_medica',
              'dt_criacao',
              'dt_alteracao',
            ];
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6">
            <div className="absolute inset-0" onClick={() => setDetailModalOpen(false)} />
            <div className="relative w-full max-w-[1250px] bg-white modal-dark p-0 shadow-xl shadow-black/20 max-h-[90vh] flex flex-col">
              <div className="flex-shrink-0 flex items-center justify-between bg-[#ccc] px-[15px]">
                <h3 className="text-base font-semibold" style={{ color: '#000' }}>Detalhe da auditoria</h3>
                <button
                  type="button"
                  onClick={() => setDetailModalOpen(false)}
                  className="inline-flex h-9 items-center justify-center rounded-[3px] text-slate-700 transition cursor-pointer p-0 focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#066fc5] focus-visible:outline-offset-2"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6 6 18" />
                    <path d="M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-[15px] overflow-auto">
                <div>
                  {(() => {
                    const FIELD_LABELS: Record<string, string> = {
                      nr_sequencia: 'Sequência',
                      nr_seq_pessoa_fisica: 'Pessoa física',
                      nr_seq_pessoa_juridica: 'Pessoa jurídica',
                      dt_admissao: 'Data de admissão',
                      nr_ano: 'Ano',
                      ds_periodo_letivo: 'Descrição',
                      qt_dias_letivos: 'Dias letivos',
                      dt_inicio: 'Data de início',
                      dt_previsao_termino: 'Previsão de término',
                      dt_reativacao: 'Data de reativação',
                      nr_seq_periodo_letivo: 'Período letivo',
                      dt_feriado: 'Data',
                      ds_feriado: 'Descrição',
                      ie_tipo_feriado: 'Tipo',
                      ds_usuario: 'Usuário',
                      ds_usuario_alternativo: 'Usuário alternativo',
                      ie_status: 'Status',
                      ds_observacao: 'Observação',
                      ds_motivo_manutencao: 'Motivo da manutenção',
                      ds_correcoes: 'Correções',
                      ds_perfil: 'Perfil',
                      config_funcoes: 'Funções',
                      config_permissoes: 'Permissões',

                      ds_nome: 'Nome completo',
                      nr_cpf: 'CPF',
                      dt_nascimento: 'Nascimento',
                      ds_email: 'E-mail',
                      nr_telefone: 'Telefone',
                      cd_ibge_naturalidade: 'Naturalidade',
                      nr_seq_sexo: 'Sexo',
                      nr_seq_estado_civil: 'Estado civil',
                      nr_seq_cor_raca: 'Cor/Raça',
                      nr_seq_profissao: 'Profissão',
                      nr_rg: 'RG',
                      dt_emissao: 'Data de emissão',
                      nr_seq_orgao_emissor: 'Órgão emissor',
                      sg_estado: 'UF',
                      nr_cep: 'CEP',
                      nr_seq_logradouro: 'Logradouro',
                      ds_endereco: 'Rua',
                      nr_endereco: 'Número',
                      ds_bairro: 'Bairro',
                      ds_complemento: 'Complemento',
                      nr_cbo: 'CBO',
                      qt_altura: 'Altura',
                      ds_imagem: 'Descrição',
                      ds_esqueceu_senha: 'Conteúdo',
                      ds_politica_privacidade: 'Conteúdo',
                      ie_arquivo: 'Arquivo',
                      nr_seq_vinculo_contratual: 'Vínculo contratual',
                      nr_seq_cargo: 'Cargo',
                      ie_coordenador: 'Coordenador',
                      ie_professor: 'Professor',
                      ie_fornecedor: 'Fornecedor',
                      ie_prestador_servico: 'Prestador de serviço',

                      ds_razao_social: 'Razão social',
                      ds_nome_fantasia: 'Nome fantasia',
                      nr_cnpj: 'CNPJ',
                      nr_inscricao_estadual: 'Inscrição estadual',
                      nr_inscricao_municipal: 'Inscrição municipal',
                      dt_abertura: 'Data de abertura',
                      cd_ibge_cidade: 'Cidade',
                      nr_matricula: 'Matrícula',
                      dt_ingresso: 'Data de ingresso',
                      dt_status: 'Data do status',
                      ds_status: 'Motivo do status',
                      dt_ultima_manutencao: 'Última manutenção',
                      nr_seq_ultima_manutencao: 'Última manutenção (seq.)',
                      ds_motivo_status: 'Motivo do status',
                      ds_motivo_transferencia: 'Motivo da transferência',
                      responsaveis: 'Responsáveis',
                      ds_tipo_sanguineo: 'Tipo sanguíneo',
                      ds_alergia: 'Alergia',
                      ds_medicamento_continuo: 'Medicamento de uso contínuo',
                      ds_restricao_alimentar: 'Restrição alimentar',
                      ds_necessidade_especial: 'Necessidade especial',
                      ds_observacao_medica: 'Observações médicas',
                      ds_sexo: 'Descrição',
                      ds_estado_civil: 'Descrição',
                      ds_cor_raca: 'Descrição',
                      ds_profissao: 'Descrição',
                      ds_orgao_emissor: 'Descrição',
                      sg_orgao_emissor: 'Sigla',
                      ds_logradouro: 'Descrição',
                      sg_logradouro: 'Sigla',
                      ds_cargo: 'Descrição',
                      ds_vinculo_contratual: 'Descrição',
                      ds_sistema_operacional: 'Descrição',
                      ds_grau_parentesco: 'Descrição',
                      ds_localizacao: 'Descrição',
                      ds_marca: 'Descrição',
                      ds_categoria: 'Descrição',
                      ds_curso: 'Descrição',
                      ds_disciplina: 'Descrição',
                      ds_turma: 'Descrição',
                      ds_modalidade_ensino: 'Descrição',
                      nr_seq_curso: 'Curso',
                      nr_seq_modalidade_ensino: 'Modalidade de ensino',
                      nr_seq_turma: 'Turma',
                      nr_seq_disciplina: 'Disciplina',
                      qt_max_alunos: 'Máximo de alunos',
                      ds_formato_papel: 'Descrição',
                      ds_tipo_papel: 'Descrição',
                      nr_seq_solicitante: 'Solicitante',
                      dt_recebimento: 'Data do recebimento',
                      dt_impressao: 'Data da impressão',
                      dt_entrega: 'Data da entrega',
                      nr_seq_turma_disciplina: 'Turma x Disciplina',
                      qt_copias: 'Cópias',
                      qt_folhas: 'Folhas',
                      ie_frente_verso: 'Frente e verso',
                      ie_grampear: 'Grampear',
                      ie_guilhotinar: 'Guilhotinar',
                      nr_seq_formato_papel: 'Formato do papel',
                      nr_seq_tipo_papel: 'Tipo de papel',
                      ds_regra: 'Regra',
                      ie_regra: 'Regra',
                      ds_campo: 'Campo',
                      ie_status_campo: 'Status',
                      ie_logout_dia: 'Dia',
                      hr_logout: 'Horário',
                      ie_badge_teste: 'Badge de teste',
                      nr_seq_ativo: 'Ativo',
                      nr_seq_colaborador: 'Colaborador',
                      nr_seq_aluno: 'Aluno',
                      nr_seq_grau_parentesco: 'Grau de parentesco',
                      dt_envio: 'Data de envio',
                      dt_termino: 'Data de término',
                      ie_status_manutencao: 'Status',
                      vl_total: 'Valor total',
                      ds_relatorio: 'Descrição',
                      formato: 'Formato',
                      titulo_arquivo: 'Nome do arquivo',
                      pdf_formato_papel: 'Formato do papel',
                      pdf_orientacao: 'Orientação',
                      pdf_borda: 'Borda',
                      pdf_margem_superior: 'Margem superior',
                      pdf_margem_inferior: 'Margem inferior',
                      pdf_margem_esquerda: 'Margem esquerda',
                      pdf_margem_direita: 'Margem direita',
                      bandas_sequencia: 'Bandas',
                      ds_banda: 'Descrição',
                      ie_tipo_banda: 'Tipo',
                      ie_tipo: 'Tipo',
                      ie_colecao_principal: 'Coleção principal',
                      nr_posicao: 'Posição',
                      nr_altura: 'Altura',
                      ie_borda_superior: 'Borda superior',
                      ie_borda_inferior: 'Borda inferior',
                      ie_borda_esquerda: 'Borda esquerda',
                      ie_borda_direita: 'Borda direita',
                      espessuraLabel: 'Espessura label',
                      topoLabel: 'Topo label',
                      espessuraCampo: 'Espessura registro',
                      topoRegistro: 'Topo registro',
                      bgLabel: 'Background label',
                      bgCampo: 'Background registro',
                      corLabelGlobal: 'Cor label',
                      corCampoGlobal: 'Cor registro',
                      fonteLabel: 'Fonte label',
                      tamanhoFonteLabel: 'Tamanho fonte label',
                      fonteCampo: 'Fonte registro',
                      tamanhoFonteCampo: 'Tamanho fonte registro',
                      soma: 'Soma',
                      cd_cor: 'Cor',
                      ie_campo: 'Campo',
                      ds_elemento: 'Descrição',
                      ie_tipo_elemento: 'Tipo',
                      ie_primeira_pagina: 'Primeira página',
                      conteudo: 'Conteúdo',
                      label: 'Label',
                      backgroundLabel: 'Background label',
                      corLabel: 'Cor label',
                      qt_largura: 'Largura',
                      qt_esquerda: 'Esquerda',
                      qt_topo: 'Topo',
                      ie_alinhamento: 'Alinhamento',
                      ie_estilo_label: 'Estilo label',
                      ie_estilo: 'Estilo',
                      ie_estilo_soma: 'Estilo soma',
                      formatacao: 'Formatação',
                      cd_background: 'Background',
                      transparentCampo: 'Background transparente',
                      statusSistema: 'Status do sistema',
                      qt_padding_superior: 'Padding superior',
                      qt_padding_direita: 'Padding direito',
                      qt_padding_inferior: 'Padding inferior',
                      qt_padding_esquerda: 'Padding esquerdo',
                      ie_fonte: 'Fonte',
                      qt_fonte: 'Tamanho da fonte',
                      nr_seq_imagem: 'Imagem',
                      qt_tamanho_imagem: 'Tamanho da imagem',
                      nr_seq_banda: 'Banda',
                      nr_seq_relatorio: 'Relatório',
                      operador: 'Operador',
                      ie_mascara: 'Máscara',
                      vl_padrao: 'Valor padrão',
                      valorFinal: 'Valor final',
                      ie_conector: 'Conector',
                      ie_parametro: 'Parâmetro',
                      ds_label: 'Label',
                      cd_alias: 'Alias',
                      ds_conteudo: 'Conteúdo',
                      ie_obrigatorio: 'Obrigatório',
                      ds_usuario_criacao: 'Usuário criação',
                      ds_usuario_alteracao: 'Usuário alteração',
                      cd_externo: 'Código externo',
                      ds_ativo: 'Descrição',
                      nr_seq_categoria: 'Categoria',
                      nr_seq_localizacao: 'Localização',
                      nr_seq_marca: 'Marca',
                      nr_seq_fornecedor: 'Fornecedor',
                      ds_modelo: 'Modelo',
                      nr_serie: 'Número de série',
                      ds_qr_code: 'QR Code',
                      ds_codigo_barras: 'Código de barras',
                      vl_aquisicao: 'Valor de aquisição',
                      dt_aquisicao: 'Data de aquisição',
                      dt_garantia: 'Data de garantia',
                      ds_processador: 'Processador',
                      qt_ram: 'Memória RAM',
                      ie_ram: 'Unidade (RAM)',
                      qt_armazenamento: 'Armazenamento',
                      ie_armazenamento: 'Unidade',
                      ds_endereco_mac: 'Endereço MAC',
                      ds_ip: 'IPv4',
                      nr_seq_sistema_operacional: 'Sistema operacional',
                      cd_placa: 'Placa',
                      cd_renavam: 'Renavam',
                      ds_cor: 'Cor',
                      nr_seq_combustivel: 'Combustível',
                      dt_criacao: 'Criação',
                      dt_alteracao: 'Alteração',
                    };
                    // Em Manutenções, o campo nr_seq_prestador_servico é o Prestador.
                    if (isManutencao) FIELD_LABELS['nr_seq_prestador_servico'] = 'Prestador de serviço';

                    const normalizeAuditValue = (val: any): string | number | null => {
                      if (val === null || val === undefined || val === '') return null;
                      if (typeof val === 'object') {
                        if (typeof val.toDate === 'function') {
                          return val.toDate().toISOString();
                        }
                        if (typeof val.seconds === 'number' && typeof val.nanoseconds === 'number') {
                          const ms = val.seconds * 1000 + Math.floor(val.nanoseconds / 1000000);
                          return new Date(ms).toISOString();
                        }
                      }
                      return val;
                    };

                    const getDisplay = (field: string, val: any) => {
                      const normalized = normalizeAuditValue(val);
                      if (normalized === null || normalized === undefined || normalized === '') return '';
                      if (field.startsWith('dt_')) return formatDate(String(normalized));
                      // Formato do papel: medidas como no formulário ("210", "215,9").
                      if (auditDocumentType === 'cg_formato_papel' && (field === 'qt_largura' || field === 'qt_altura')) return formatarMedida(normalized);
                      // Referências (nr_seq_*) exibidas pela descrição do registro vinculado.
                      const seq = Number(normalized);
                      const descricaoPorSeq: Record<string, () => string | undefined> = {
                        nr_seq_sexo: () => pfCgLookups.nr_seq_sexo[seq],
                        nr_seq_estado_civil: () => pfCgLookups.nr_seq_estado_civil[seq],
                        nr_seq_cor_raca: () => pfCgLookups.nr_seq_cor_raca[seq],
                        nr_seq_profissao: () => pfCgLookups.nr_seq_profissao[seq],
                        nr_seq_orgao_emissor: () => pfCgLookups.nr_seq_orgao_emissor[seq],
                        nr_seq_logradouro: () => pfCgLookups.nr_seq_logradouro[seq],
                        nr_seq_pessoa_fisica: () => pessoasFisicas.find((p) => p.nr_sequencia === seq)?.ds_nome,
                        nr_seq_pessoa_juridica: () => pessoasJuridicas.find((p) => p.nr_sequencia === seq)?.ds_razao_social,
                        nr_seq_cargo: () => cargos.find((c) => c.nr_sequencia === seq)?.ds_cargo,
                        nr_seq_vinculo_contratual: () => vinculosContratuais.find((v) => v.nr_sequencia === seq)?.ds_vinculo_contratual,
                        nr_seq_categoria: () => categoriasAtivos.find((c) => c.nr_sequencia === seq)?.ds_categoria,
                        nr_seq_localizacao: () => localizacoes.find((l) => l.nr_sequencia === seq)?.ds_localizacao,
                        nr_seq_marca: () => marcas.find((m) => m.nr_sequencia === seq)?.ds_marca,
                        nr_seq_sistema_operacional: () => sistemasOperacionais.find((s) => s.nr_sequencia === seq)?.ds_sistema_operacional,
                        nr_seq_combustivel: () => combustiveis.find((c) => c.nr_sequencia === seq)?.ds_combustivel,
                        nr_seq_curso: () => cursos.find((c) => c.nr_sequencia === seq)?.ds_curso,
                        nr_seq_periodo_letivo: () => periodosLetivos.find((p) => p.nr_sequencia === seq)?.ds_periodo_letivo,
                        nr_seq_modalidade_ensino: () => modalidadesEnsino.find((m) => m.nr_sequencia === seq)?.ds_modalidade_ensino,
                        nr_seq_turma: () => turmas.find((t) => t.nr_sequencia === seq)?.ds_turma,
                        nr_seq_disciplina: () => disciplinas.find((d) => d.nr_sequencia === seq)?.ds_disciplina,
                        nr_seq_solicitante: () => nomeColaboradorPorSeq(seq),
                        nr_seq_turma_disciplina: () => descricaoTurmaDisciplinaPorSeq(seq),
                        nr_seq_formato_papel: () => formatosPapel.find((f) => f.nr_sequencia === seq)?.ds_formato_papel,
                        nr_seq_tipo_papel: () => tiposPapel.find((t) => t.nr_sequencia === seq)?.ds_tipo_papel,
                        nr_seq_ativo: () => ativos.find((a) => a.nr_sequencia === seq)?.ds_ativo,
                        nr_seq_colaborador: () => nomeColaboradorPorSeq(seq),
                        nr_seq_fornecedor: () => nomeColaboradorPorSeq(seq),
                        nr_seq_grau_parentesco: () => grausParentesco.find((g) => g.nr_sequencia === seq)?.ds_grau_parentesco,
                        nr_seq_aluno: () => {
                          const aluno = alunos.find((a) => a.nr_sequencia === seq);
                          return aluno ? pessoasFisicas.find((p) => p.nr_sequencia === aluno.nr_seq_pessoa_fisica)?.ds_nome : undefined;
                        },
                        nr_seq_prestador_servico: () => {
                          // O campo guarda a sequência do colaborador (prestador).
                          const col = colaboradores.find((c) => c.nr_sequencia === seq);
                          if (col?.nr_seq_pessoa_juridica) {
                            const pj = pessoasJuridicas.find((p) => p.nr_sequencia === col.nr_seq_pessoa_juridica);
                            if (pj) return pj.ds_razao_social;
                          }
                          if (col) return pessoasFisicas.find((p) => p.nr_sequencia === col.nr_seq_pessoa_fisica)?.ds_nome;
                          return pessoasFisicas.find((p) => p.nr_sequencia === seq)?.ds_nome;
                        },
                      };
                      if (descricaoPorSeq[field] && !Array.isArray(normalized)) {
                        const descricao = Number.isFinite(seq) ? descricaoPorSeq[field]() : undefined;
                        return descricao ? `${seq} - ${descricao}` : String(normalized);
                      }
                      if (field === 'ie_coordenador' || field === 'ie_professor' || field === 'ie_fornecedor' || field === 'ie_prestador_servico' || field === 'ie_badge_teste' || field === 'ie_frente_verso' || field === 'ie_grampear' || field === 'ie_guilhotinar') {
                        return String(normalized) === 'S' ? 'Sim' : String(normalized) === 'N' ? 'Não' : String(normalized);
                      }
                      if (field === 'ie_logout_dia') {
                        return rotuloDiaLogout(String(normalized)) || String(normalized);
                      }
                      if (field === 'ie_status_manutencao') {
                        return MANUTENCAO_STATUS_OPTIONS.find((o) => o.value === String(normalized))?.label ?? String(normalized);
                      }
                      if (field === 'ie_status' && isAtivo) {
                        return ATIVO_STATUS_OPTIONS.find((o) => o.value === String(normalized))?.label ?? String(normalized);
                      }
                      // Relatório, banda, elemento e parâmetro: A = Ativo, I = Inativo.
                      if (field === 'ie_status' && isRelatorio) return String(normalized) === 'I' ? 'Inativo' : String(normalized) === 'A' ? 'Ativo' : String(normalized);
                      if (field === 'ie_status' && auditDocumentType === 'copia') return rotuloStatusCopia(normalized) || String(normalized);
                      if (field === 'ie_status') {
                        if (isColaborador) return formatColaboradorCellValue('ie_status', normalized);
                        if (isPeriodoLetivo) return formatPeriodoLetivoCellValue('ie_status', normalized);
                        return isAluno ? formatAlunoCellValue('ie_status', normalized) : formatAdminCellValue('ie_status', normalized);
                      }
                      if (field === 'ie_status_campo') {
                        return CAMPO_STATUS_LABELS[String(normalized) as CampoStatus] ?? String(normalized);
                      }
                      if (field === 'ie_regra') {
                        return String(normalized) === 'S' ? 'Sim' : String(normalized) === 'N' ? 'Não' : '---';
                      }
                      if (field === 'formato') {
                        return String(normalized) === 'pdf' ? 'PDF' : 'XLS';
                      }
                      if (field === 'pdf_formato_papel') {
                        return formatosPapel.find((f) => String(f.nr_sequencia) === String(normalized))?.ds_formato_papel ?? String(normalized);
                      }
                      if (field === 'pdf_borda') {
                        const map: Record<string, string> = { 'solid_fina': 'Sólida fina', 'solid_grossa': 'Sólida grossa', 'dupla': 'Dupla', 'tracejada': 'Tracejada', 'pontilhada': 'Pontilhada' };
                        return map[String(normalized)] ?? (String(normalized) === '' ? '---' : String(normalized));
                      }
                      if (field === 'pdf_orientacao') {
                        return String(normalized) === 'P' ? 'Padrão' : String(normalized) === 'I' ? 'Invertido' : String(normalized);
                      }
                      if (field === 'ie_tipo_feriado') {
                        return rotuloTipoFeriado(String(normalized)) || String(normalized);
                      }
                      if (field === 'ie_tipo_banda' || (field === 'ie_tipo' && isBanda)) {
                        const map: Record<string, string> = { 'lista': 'Lista', 'texto_valor': 'Texto/Valor', 'cabecalho': 'Cabeçalho', 'conteudo': 'Conteúdo', 'rodape': 'Rodapé' };
                        return map[String(normalized)] ?? String(normalized);
                      }
                      if (field === 'ie_borda_superior' || field === 'ie_borda_inferior' || field === 'ie_borda_esquerda' || field === 'ie_borda_direita') {
                        const s = String(normalized);
                        if (s === 'true') return 'Sim';
                        if (s === 'false') return 'Não';
                        if (s === 'S') return 'Sim';
                        if (s === 'N') return 'Não';
                        return '---';
                      }
                      if (field === 'ie_colecao_principal' || field === 'ie_colecao') {
                        return String(normalized) === '' ? '---' : String(normalized);
                      }
                      if (field === 'ie_parametro' || field === 'ie_obrigatorio' || field === 'transparentCampo' || field === 'soma' || field === 'statusSistema' || field === 'ie_primeira_pagina') {
                        const s = String(normalized);
                        if (s === 'true') return 'Sim';
                        if (s === 'false') return 'Não';
                        return s === 'S' ? 'Sim' : s === 'N' ? 'Não' : '---';
                      }
                      if (field === 'ie_tipo' && isElemento) {
                        return String(normalized) === 'sql' ? 'SQL' : String(normalized) === 'conteudo' ? 'Conteúdo' : String(normalized) === 'imagem' ? 'Imagem' : (String(normalized) === '' ? '---' : String(normalized));
                      }
                      if (field === 'nr_seq_imagem' && isElemento) {
                        return imagens.find((i) => String(i.nr_sequencia) === String(normalized))?.ds_imagem ?? String(normalized);
                      }
                      if (field === 'ie_fonte' && isElemento) {
                        const map: Record<string, string> = { 'arial': 'Arial', 'calibri': 'Calibri', 'courier_new': 'Courier New', 'times_new_roman': 'Times New Roman', 'verdana': 'Verdana' };
                        return map[String(normalized)] ?? (String(normalized) === '' ? '---' : String(normalized));
                      }
                      if (field === 'ie_tipo_elemento') {
                        const map: Record<string, string> = { 'valor': 'Valor', 'conteudo': 'Conteúdo', 'data_geracao': 'Data de geração', 'horario_geracao': 'Horário de geração', 'data_horario_geracao': 'Data e horário de geração', 'usuario_geracao': 'Usuário da geração', 'imagem': 'Imagem', 'numero_pagina': 'Número da página' };
                        return map[String(normalized)] ?? (String(normalized) === '' ? '---' : String(normalized));
                      }
                      if (field === 'ie_alinhamento') {
                        const map: Record<string, string> = { 'esquerda': 'Esquerda', 'centro': 'Centro', 'direita': 'Direita' };
                        return map[String(normalized)] ?? (String(normalized) === '' ? '---' : String(normalized));
                      }
                      if (field === 'ie_estilo_label' || field === 'ie_estilo' || field === 'ie_estilo_soma') {
                        const map: Record<string, string> = { 'normal': 'Normal', 'negrito': 'Negrito', 'italico': 'Itálico', 'sublinhado': 'Sublinhado', 'negrito_italico': 'Negrito e itálico', 'negrito_sublinhado': 'Negrito e sublinhado', 'italico_sublinhado': 'Itálico e sublinhado', 'negrito_italico_sublinhado': isElemento ? 'Todos' : 'Negrito, itálico e sublinhado' };
                        return map[String(normalized)] ?? (String(normalized) === '' ? '---' : String(normalized));
                      }
                      if (field === 'formatacao') {
                        const map: Record<string, string> = { 'texto': 'Texto', 'numero': 'Número', 'moeda': 'Moeda', 'data': 'Data', 'data_hora': 'Data e hora', 'porcentagem': 'Porcentagem' };
                        return map[String(normalized)] ?? (String(normalized) === '' ? '---' : String(normalized));
                      }
                      if (field === 'operador') {
                        const map: Record<string, string> = { 'igual': 'Igual a', 'diferente': 'Diferente de', 'maior': 'Maior que', 'menor': 'Menor que', 'maior_igual': 'Maior ou igual a', 'menor_igual': 'Menor ou igual a', 'contem': 'Contém', 'nao_contem': 'Não contém', 'inicia_com': 'Inicia com', 'termina_com': 'Termina com', 'entre': 'Entre', 'vazio': 'Vazio', 'nao_vazio': 'Não vazio' };
                        return map[String(normalized)] ?? (String(normalized) === '' ? '---' : String(normalized));
                      }
                      if (field === 'ie_mascara') {
                        const map: Record<string, string> = { 'texto': 'Texto', 'inteiro': 'Inteiro', 'decimal': 'Decimal', 'data': 'Data', 'cpf': 'CPF', 'telefone': 'Telefone' };
                        return map[String(normalized)] ?? (String(normalized) === '' ? '---' : String(normalized));
                      }
                      // Responsáveis: array de { nr_seq_responsavel, nr_seq_grau_parentesco }.
                      if (field === 'responsaveis' && Array.isArray(normalized)) {
                        const nomePessoa = Object.fromEntries(pessoasFisicas.map((p) => [p.nr_sequencia, p.ds_nome]));
                        const nomeGrau = Object.fromEntries(grausParentesco.map((g) => [g.nr_sequencia, g.ds_grau_parentesco]));
                        const respArr = normalized as AlunoResponsavelLegado[];
                        return respArr
                          .filter((r) => r && r.nr_seq_responsavel)
                          .map((r) => {
                            const nome = nomePessoa[r.nr_seq_responsavel!] ?? String(r.nr_seq_responsavel);
                            const grau = r.nr_seq_grau_parentesco ? (nomeGrau[r.nr_seq_grau_parentesco] ?? '') : '';
                            return grau ? `${nome} (${grau})` : nome;
                          })
                          .join('\n');
                      }
                      // Informações médicas e demais arrays de strings: um valor por linha.
                      if (Array.isArray(normalized)) {
                        return (normalized as unknown[])
                          .filter((v) => v !== null && v !== undefined && String(v).trim() !== '')
                          .map((v) => String(v))
                          .join('\n');
                      }
                      return String(normalized);
                    };

                    const getFuncoesDisplay = (val: any): string => {
                      const normalized = normalizeAuditValue(val);
                      if (normalized === null || normalized === undefined || normalized === '') return '';
                      const funcoes = parseFuncoesConfig(String(normalized));
                      return funcoes.map((s) => SECTION_DEFS[s]?.label ?? s).join('\n');
                    };

                    const getFuncoesRows = (val: any): number => {
                      const display = getFuncoesDisplay(val);
                      const lines = display.split('\n').filter((l) => l !== '');
                      return Math.max(1, lines.length);
                    };

                    const getPermissoesDisplay = (val: any): string => {
                      const normalized = normalizeAuditValue(val);
                      if (normalized === null || normalized === undefined || normalized === '') return '';
                      const config = parsePermissoesConfig(String(normalized));
                      const lines: string[] = [];
                      // Funções presentes na configuração, em ordem alfabética pelo rótulo.
                      const funcoes = Object.keys(config)
                        .filter((f) => (PERMISSOES_POR_FUNCAO[f] ?? []).length > 0)
                        .sort((a, b) => {
                          const la = SECTION_DEFS[a as SectionType]?.label ?? a;
                          const lb = SECTION_DEFS[b as SectionType]?.label ?? b;
                          return la.localeCompare(lb, 'pt-BR');
                        });
                      for (const funcao of funcoes) {
                        const perms = config[funcao];
                        if (!perms) continue;
                        const funcaoLabel = SECTION_DEFS[funcao as SectionType]?.label ?? funcao;
                        const defs = PERMISSOES_POR_FUNCAO[funcao] ?? [];
                        // Seções do modal, em ordem alfabética pelo título.
                        const grupos = [...(PERMISSOES_GRUPOS[funcao] ?? [])].sort((a, b) =>
                          a.titulo.localeCompare(b.titulo, 'pt-BR')
                        );
                        if (grupos.length === 0) {
                          // Função sem seções: permissões na ordem do modal (defs).
                          for (const def of defs) {
                            lines.push(`${funcaoLabel} > ${def.label} [${perms.includes(def.key) ? 'SIM' : 'NÃO'}]`);
                          }
                          continue;
                        }
                        for (const grupo of grupos) {
                          // Permissões na mesma ordem do modal (ordem das chaves do grupo).
                          for (const chave of grupo.chaves) {
                            const def = defs.find((d) => d.key === chave);
                            if (!def) continue;
                            lines.push(`${funcaoLabel} > ${grupo.titulo} > ${def.label} [${perms.includes(def.key) ? 'SIM' : 'NÃO'}]`);
                          }
                        }
                      }
                      return lines.join('\n');
                    };

                    const getPermissoesRows = (val: any): number => {
                      const display = getPermissoesDisplay(val);
                      const lines = display.split('\n').filter((l) => l !== '');
                      return Math.max(1, lines.length);
                    };

                    // O campo Funções do "Antes" e do "Depois" deve ter a mesma
                    // altura: usa sempre o maior número de linhas entre os dois.
                    const maxFuncoesRows = Math.max(
                      getFuncoesRows(before ? (before as any).config_funcoes : undefined),
                      getFuncoesRows((after as any).config_funcoes)
                    );

                    // O campo Permissões do "Antes" e do "Depois" deve ter a mesma
                    // altura: usa sempre o maior número de linhas entre os dois.
                    const maxPermissoesRows = Math.max(
                      getPermissoesRows(before ? (before as any).config_permissoes : undefined),
                      getPermissoesRows((after as any).config_permissoes)
                    );

                    // Campos com múltiplos valores (responsáveis, alergias, etc.):
                    // um valor por linha, com a mesma altura nas colunas Antes/Depois.
                    const maxArrayRows = (field: string): number => {
                      const linhas = (v: any) =>
                        getDisplay(field, v)
                          .split('\n')
                          .filter((l) => l !== '').length;
                      return Math.max(
                        linhas(before ? (before as any)[field] : undefined),
                        linhas((after as any)[field]),
                        1
                      );
                    };

                    const renderFieldValue = (field: string, val: any) => {
                      if (field === 'config_funcoes') {
                        return (
                          <textarea
                            disabled
                            rows={maxFuncoesRows}
                            value={getFuncoesDisplay(val)}
                            className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm resize-none"
                          />
                        );
                      }
                      if (field === 'config_permissoes') {
                        return (
                          <textarea
                            disabled
                            rows={maxPermissoesRows}
                            value={getPermissoesDisplay(val)}
                            className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm resize-none"
                          />
                        );
                      }
                      // Conteúdo dos avisos: texto longo (HTML), exibido em várias linhas.
                      if (field === 'ds_esqueceu_senha' || field === 'ds_politica_privacidade') {
                        return (
                          <textarea
                            disabled
                            rows={6}
                            value={getDisplay(field, val)}
                            className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm font-mono resize-none"
                          />
                        );
                      }
                      if (field === 'bandas_sequencia') {
                        const displayVal = getDisplay(field, val);
                        const lines = displayVal.split('\n').filter((l: string) => l);
                        return (
                          <textarea
                            disabled
                            rows={Math.max(1, lines.length)}
                            value={displayVal}
                            className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm resize-none"
                          />
                        );
                      }
                      // Valores múltiplos (arrays) são exibidos um em cima do outro.
                      if (Array.isArray(normalizeAuditValue(val))) {
                        return (
                          <textarea
                            disabled
                            rows={maxArrayRows(field)}
                            value={getDisplay(field, val)}
                            className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm resize-none"
                          />
                        );
                      }
                      return (
                        <input
                          disabled
                          value={getDisplay(field, val)}
                          className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm"
                        />
                      );
                    };

                    // Campos de controle no fim de todo detalhe: Criação, Alteração, Usuário criação e Usuário alteração.
                    const CAMPOS_CONTROLE = ['dt_criacao', 'dt_alteracao', 'ds_usuario_criacao', 'ds_usuario_alteracao'];
                    const camposDetalhe = [...fieldsOrder.filter((c) => !CAMPOS_CONTROLE.includes(c)), ...CAMPOS_CONTROLE];
                    // Logs antigos (ou que gravam só parte do registro) podem não ter esses campos:
                    // completa com a data/usuário do próprio log e do log de criação.
                    const logMaisAntigo = auditLogs[auditLogs.length - 1];
                    // Avisos e regras: cada um tem a própria criação (primeiro log dele).
                    const criacaoPorItem = isAviso || isRegra || isCampo;
                    const logCriacao = criacaoPorItem ? logMaisAntigo : auditLogs.find((l) => String(l.acao ?? '').toLowerCase() === 'create');
                    const comControle = (dados: Record<string, unknown> | null | undefined, log: AuditEntry | undefined) => {
                      if (!dados || !log) return dados;
                      return {
                        ...dados,
                        // Avisos: cada aviso tem a própria criação (primeiro log dele).
                        dt_criacao: criacaoPorItem ? logCriacao?.timestamp : (dados.dt_criacao ?? logCriacao?.timestamp),
                        ds_usuario_criacao: criacaoPorItem ? logCriacao?.usuarioNome : (dados.ds_usuario_criacao ?? logCriacao?.usuarioNome),
                        dt_alteracao: dados.dt_alteracao ?? log.timestamp,
                        ds_usuario_alteracao: dados.ds_usuario_alteracao ?? log.usuarioNome,
                      };
                    };
                    const baseBefore = isBanda ? bandaBefore : (isElemento || isParametroRel) ? before : isRelatorio ? relatorioFlatBefore : before;
                    const baseAfter = isBanda ? bandaAfter : (isElemento || isParametroRel) ? after : isRelatorio ? relatorioFlatAfter : after;
                    const effectiveBefore = comControle(baseBefore, auditLogs[selectedAuditIndex + 1]);
                    const effectiveAfter = comControle(baseAfter, auditLogs[selectedAuditIndex]);

                    // Funções com formulário: o próprio formulário (antes e depois), com os mesmos
                    // campos, controles, ordem e infobuttons, desabilitado e um campo em cima do outro.
                    const colecaoDoFormulario = isRelatorio ? relatorioAuditTipo : auditDocumentType;
                    const temFormulario = COLECOES_COM_FORMULARIO.has(colecaoDoFormulario)
                      || !!FORMULARIOS_GENERICOS[colecaoDoFormulario]
                      || Object.values(CG_DEFS).some((d) => d.collection === colecaoDoFormulario);
                    if (temFormulario) {
                      const generico = !!FORMULARIOS_GENERICOS[colecaoDoFormulario];
                      const comoExclusao = (dados: Record<string, unknown>) => ({ ds_colecao: colecaoDoFormulario, dados: dadosDoHistoricoParaFormulario(colecaoDoFormulario, dados), id_registro: relatorioAuditItemId ?? '' }) as unknown as Exclusao;
                      const cidadeDe = (dados: Record<string, unknown> | null) => cidadesAuditoria[String(dados?.cd_ibge_naturalidade ?? dados?.cd_ibge_cidade ?? '').trim()] ?? '';
                      const dadosAntes = before ? comControle(before as Record<string, unknown>, auditLogs[selectedAuditIndex + 1]) : null;
                      const dadosDepois = comControle(after as Record<string, unknown>, auditLogs[selectedAuditIndex]) ?? {};
                      return (
                        <div className="grid grid-cols-2 gap-x-6 w-full">
                          <div className="text-sm font-medium mb-1" style={{ color: '#000' }}>Antes</div>
                          <div className="text-sm font-medium mb-1" style={{ color: '#000' }}>Depois</div>
                          <div className="min-w-0">
                            {/* Criação: sem registro anterior, o "Antes" fica vazio. */}
                            {dadosAntes && (
                              <FormularioSomenteLeitura ocultarBarra={!generico}>{renderFormularioExcluido(comoExclusao(dadosAntes), cidadeDe(dadosAntes))}</FormularioSomenteLeitura>
                            )}
                          </div>
                          <div className="min-w-0">
                            <FormularioSomenteLeitura ocultarBarra={!generico}>{renderFormularioExcluido(comoExclusao(dadosDepois), cidadeDe(dadosDepois))}</FormularioSomenteLeitura>
                          </div>
                        </div>
                      );
                    }

                    // Demais (avisos, regras, Campos x Formulários, parâmetros das funções e abas da
                    // pessoa física): os campos do histórico, com o rótulo e o infobutton do campo.
                    return (
                      <div className="grid grid-cols-2 gap-x-6 gap-y-[15px] w-full">
                        <div className="text-sm font-medium -mb-[11px]" style={{ color: '#000' }}>Antes</div>
                        <div className="text-sm font-medium -mb-[11px]" style={{ color: '#000' }}>Depois</div>
                        {camposDetalhe.map((field) => {
                          return (
                          <React.Fragment key={field}>
                            <div className="w-full min-w-0">
                              <RotuloCampo texto={FIELD_LABELS[field] ?? field} colecao={colecaoDoFormulario} campo={field} />
                              {renderFieldValue(field, effectiveBefore ? (effectiveBefore as any)[field] : undefined)}
                            </div>
                            <div className="w-full min-w-0">
                              <RotuloCampo texto={FIELD_LABELS[field] ?? field} colecao={colecaoDoFormulario} campo={field} />
                              {renderFieldValue(field, (effectiveAfter as any)[field])}
                            </div>
                          </React.Fragment>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modal de visualização de Pessoa Física (leitura) */}
      <PessoaFisicaViewModal
        pessoa={comAutorExibicao(pessoaFisicaView)}
        cgLookups={pfCgLookups}
        onClose={() => setPessoaFisicaView(null)}
      />

      {/* Modal de visualização de Ativo (leitura) */}
      {ativoView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6">
          <div className="absolute inset-0" onClick={() => setAtivoView(null)} />
          <div className="relative w-full max-w-[1000px] bg-white modal-dark p-0 shadow-xl shadow-black/20 max-h-[90vh] flex flex-col">
            <div className="flex-shrink-0 flex items-center justify-between bg-[#ccc] px-[15px]">
              <h3 className="text-base font-semibold" style={{ color: '#000' }}>Ativo</h3>
              <button
                type="button"
                onClick={() => setAtivoView(null)}
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
                {/* ── Identificação ── */}
                <section>
                  <h2 className="mb-3 border-b border-slate-200 pb-1 text-sm font-semibold text-slate-900">Identificação</h2>
                  <div className="grid gap-[15px] sm:grid-cols-12 pt-1">
                    <div className="sm:col-span-1 group">
                      <RotuloCampo texto="Sequência" colecao="pat_ativo" campo="nr_sequencia" />
                      <input disabled readOnly className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm" value={String(ativoView.nr_sequencia ?? '')} />
                    </div>
                    <div className="sm:col-span-4 group">
                      <RotuloCampo texto="Código externo" colecao="pat_ativo" campo="cd_externo" />
                      <input disabled readOnly className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm" value={ativoView.cd_externo ?? ''} />
                    </div>
                    <div className="sm:col-span-7 group">
                      <RotuloCampo texto="Descrição" colecao="pat_ativo" campo="ds_ativo" />
                      <input disabled readOnly className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm" value={ativoView.ds_ativo ?? ''} />
                    </div>
                    <div className="sm:col-span-3 group">
                      <RotuloCampo texto="Modelo" colecao="pat_ativo" campo="ds_modelo" />
                      <input disabled readOnly className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm" value={ativoView.ds_modelo ?? ''} />
                    </div>
                    <div className="sm:col-span-3 group">
                      <RotuloCampo texto="Número de série" colecao="pat_ativo" campo="nr_serie" />
                      <input disabled readOnly className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm" value={ativoView.nr_serie ?? ''} />
                    </div>
                    <div className="sm:col-span-3 group">
                      <RotuloCampo texto="QR Code" colecao="pat_ativo" campo="ds_qr_code" />
                      <input disabled readOnly className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm" value={ativoView.ds_qr_code ?? ''} />
                    </div>
                    <div className="sm:col-span-3 group">
                      <RotuloCampo texto="Código de barras" colecao="pat_ativo" campo="ds_codigo_barras" />
                      <input disabled readOnly className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm" value={ativoView.ds_codigo_barras ?? ''} />
                    </div>
                    <div className="sm:col-span-3 group">
                      <RotuloCampo texto="Valor de aquisição" colecao="pat_ativo" campo="vl_aquisicao" />
                      <input disabled readOnly className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm" value={ativoView.vl_aquisicao ?? ''} />
                    </div>
                    <div className="sm:col-span-3 group">
                      <RotuloCampo texto="Data de aquisição" colecao="pat_ativo" campo="dt_aquisicao" />
                      <input disabled readOnly className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm" value={ativoView.dt_aquisicao ?? ''} />
                    </div>
                    <div className="sm:col-span-3 group">
                      <RotuloCampo texto="Data de garantia" colecao="pat_ativo" campo="dt_garantia" />
                      <input disabled readOnly className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm" value={ativoView.dt_garantia ?? ''} />
                    </div>
                    <div className="sm:col-span-3 group">
                      <RotuloCampo texto="Status" colecao="pat_ativo" campo="ie_status" />
                      <input disabled readOnly className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm" value={ATIVO_STATUS_OPTIONS.find((s) => s.value === ativoView.ie_status)?.label ?? ativoView.ie_status ?? ''} />
                    </div>
                    <div className="sm:col-span-3 group">
                      <RotuloCampo texto="Data do status" colecao="pat_ativo" campo="dt_status" />
                      <input disabled readOnly className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm" value={ativoView.dt_status ?? ''} />
                    </div>
                    <div className="sm:col-span-6 group">
                      <RotuloCampo texto="Última manutenção" colecao="pat_ativo" campo="nr_seq_ultima_manutencao" />
                      <input disabled readOnly className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm" value={ativoView.nr_seq_ultima_manutencao != null ? String(ativoView.nr_seq_ultima_manutencao) : ''} />
                    </div>
                    <div className="sm:col-span-12 group">
                      <RotuloCampo texto="Motivo do status" colecao="pat_ativo" campo="ds_motivo_status" />
                      <textarea disabled readOnly rows={2} className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm resize-none" value={ativoView.ds_motivo_status ?? ''} />
                    </div>
                  </div>
                </section>
                {/* ── Classificação ── */}
                <section>
                  <h2 className="mb-3 border-b border-slate-200 pb-1 text-sm font-semibold text-slate-900">Classificação</h2>
                  <div className="grid gap-[15px] sm:grid-cols-12 pt-1">
                    <div className="sm:col-span-4 group">
                      <RotuloCampo texto="Categoria" colecao="pat_ativo" campo="nr_seq_categoria" />
                      <input disabled readOnly className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm" value={ativoView.nr_seq_categoria ? (categoriasAtivos.find((c) => c.nr_sequencia === ativoView.nr_seq_categoria)?.ds_categoria ?? String(ativoView.nr_seq_categoria)) : ''} />
                    </div>
                    <div className="sm:col-span-4 group">
                      <RotuloCampo texto="Localização" colecao="pat_ativo" campo="nr_seq_localizacao" />
                      <input disabled readOnly className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm" value={ativoView.nr_seq_localizacao ? (localizacoes.find((l) => l.nr_sequencia === ativoView.nr_seq_localizacao)?.ds_localizacao ?? String(ativoView.nr_seq_localizacao)) : ''} />
                    </div>
                    <div className="sm:col-span-4 group">
                      <RotuloCampo texto="Marca" colecao="pat_ativo" campo="nr_seq_marca" />
                      <input disabled readOnly className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm" value={ativoView.nr_seq_marca ? (marcas.find((m) => m.nr_sequencia === ativoView.nr_seq_marca)?.ds_marca ?? String(ativoView.nr_seq_marca)) : ''} />
                    </div>
                    <div className="sm:col-span-12 group">
                      <RotuloCampo texto="Fornecedor" colecao="pat_ativo" campo="nr_seq_fornecedor" />
                      <input disabled readOnly className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm" value={ativoView.nr_seq_fornecedor ? (nomeColaboradorPorSeq(ativoView.nr_seq_fornecedor) || String(ativoView.nr_seq_fornecedor)) : ''} />
                    </div>
                    {responsaveisAtivos.some((r) => r.nr_seq_ativo === ativoView.nr_sequencia) && (
                      <div className="sm:col-span-12 group">
                        <RotuloCampo texto="Responsável" colecao="pat_ativo_responsavel" campo="nr_seq_colaborador" />
                        {responsaveisAtivos.filter((r) => r.nr_seq_ativo === ativoView.nr_sequencia).sort((a, b) => b.nr_sequencia - a.nr_sequencia).map((resp) => (
                          <input key={resp.id ?? resp.nr_sequencia} disabled readOnly className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm mb-1 last:mb-0" value={nomeColaboradorPorSeq(resp.nr_seq_colaborador) || (resp.nr_seq_colaborador ? String(resp.nr_seq_colaborador) : '')} />
                        ))}
                      </div>
                    )}
                  </div>
                </section>
                {/* ── Dispositivo ── */}
                <section>
                  <h2 className="mb-3 border-b border-slate-200 pb-1 text-sm font-semibold text-slate-900">Dispositivo</h2>
                  <div className="grid gap-[15px] sm:grid-cols-12 pt-1">
                    <div className="sm:col-span-4 group">
                      <RotuloCampo texto="Processador" colecao="pat_ativo" campo="ds_processador" />
                      <input disabled readOnly className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm" value={ativoView.ds_processador ?? ''} />
                    </div>
                    <div className="sm:col-span-4 group">
                      <RotuloCampo texto="Memória RAM" colecao="pat_ativo" campo="qt_ram" />
                      <input disabled readOnly className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm" value={ativoView.qt_ram != null ? `${ativoView.qt_ram} ${ativoView.ie_ram ?? ''}` : ''} />
                    </div>
                    <div className="sm:col-span-4 group">
                      <RotuloCampo texto="Armazenamento" colecao="pat_ativo" campo="qt_armazenamento" />
                      <input disabled readOnly className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm" value={ativoView.qt_armazenamento != null ? `${ativoView.qt_armazenamento} ${ativoView.ie_armazenamento ?? ''}` : ''} />
                    </div>
                    <div className="sm:col-span-4 group">
                      <RotuloCampo texto="Endereço MAC" colecao="pat_ativo" campo="ds_endereco_mac" />
                      <input disabled readOnly className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm" value={ativoView.ds_endereco_mac ?? ''} />
                    </div>
                    <div className="sm:col-span-4 group"><RotuloCampo texto="IPv4" colecao="pat_ativo" campo="ds_ip" />
                       <input disabled readOnly className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm" value={ativoView.ds_ip ?? ''} />
                    </div>
                    <div className="sm:col-span-4 group">
                      <RotuloCampo texto="Sistema operacional" colecao="pat_ativo" campo="nr_seq_sistema_operacional" />
                      <input disabled readOnly className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm" value={ativoView.nr_seq_sistema_operacional ? (sistemasOperacionais.find((s) => s.nr_sequencia === ativoView.nr_seq_sistema_operacional)?.ds_sistema_operacional ?? String(ativoView.nr_seq_sistema_operacional)) : ''} />
                    </div>
                  </div>
                </section>
                {/* ── Veículo ── */}
                <section>
                  <h2 className="mb-3 border-b border-slate-200 pb-1 text-sm font-semibold text-slate-900">Veículo</h2>
                  <div className="grid gap-[15px] sm:grid-cols-12 pt-1">
                    <div className="sm:col-span-3 group">
                      <RotuloCampo texto="Placa" colecao="pat_ativo" campo="cd_placa" />
                      <input disabled readOnly className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm" value={ativoView.cd_placa ?? ''} />
                    </div>
                    <div className="sm:col-span-3 group">
                      <RotuloCampo texto="Renavam" colecao="pat_ativo" campo="cd_renavam" />
                      <input disabled readOnly className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm" value={ativoView.cd_renavam ?? ''} />
                    </div>
                    <div className="sm:col-span-2 group">
                      <RotuloCampo texto="Ano" colecao="pat_ativo" campo="nr_ano" />
                      <input disabled readOnly className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm" value={ativoView.nr_ano ?? ''} />
                    </div>
                    <div className="sm:col-span-2 group">
                      <RotuloCampo texto="Cor" colecao="pat_ativo" campo="ds_cor" />
                      <input disabled readOnly className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm" value={ativoView.ds_cor ?? ''} />
                    </div>
                    <div className="sm:col-span-2 group">
                      <RotuloCampo texto="Combustível" colecao="pat_ativo" campo="nr_seq_combustivel" />
                      <input disabled readOnly className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm" value={ativoView.nr_seq_combustivel ? (combustiveis.find((c) => c.nr_sequencia === ativoView.nr_seq_combustivel)?.ds_combustivel ?? String(ativoView.nr_seq_combustivel)) : ''} />
                    </div>
                  </div>
                </section>
                {/* ── Observações ── */}
                <section>
                  <h2 className="mb-3 border-b border-slate-200 pb-1 text-sm font-semibold text-slate-900">Observações</h2>
                  <div className="grid gap-[15px] sm:grid-cols-12 pt-1">
                    <div className="sm:col-span-12 group">
                      <RotuloCampo texto="Observação" colecao="pat_ativo" campo="ds_observacao" />
                      <textarea disabled readOnly rows={4} className="w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm resize-none" value={ativoView.ds_observacao ?? ''} />
                    </div>
                  </div>
                </section>
                <div className="text-[13px] text-slate-500">
                  <div>Criado por {resolverNomeAutorExibicao(ativoView.ds_usuario_criacao ?? '') || '-'} em {ativoView.dt_criacao ? formatDate(ativoView.dt_criacao) : '-'}</div>
                  <div className="mt-1">Alterado por {resolverNomeAutorExibicao(ativoView.ds_usuario_alteracao ?? '') || '-'} em {ativoView.dt_alteracao ? formatDate(ativoView.dt_alteracao) : '-'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de visualização de Pessoa Jurídica (leitura) */}
      <PessoaJuridicaViewModal
        pessoa={comAutorExibicao(pessoaJuridicaView)}
        cgLookups={pjCgLookups}
        cidadeNome={pessoaJuridicaViewCidade}
        onClose={() => setPessoaJuridicaView(null)}
      />

      {/* Modal de visualização de Manutenção (leitura) */}
      <ManutencaoViewModal
        manutencao={comAutorExibicao(manutencaoView)}
        ativoName={manutencaoView?.nr_seq_ativo ? (ativos.find((a) => a.nr_sequencia === manutencaoView.nr_seq_ativo)?.ds_ativo ?? '') : ''}
        prestadorName={(() => {
          if (!manutencaoView?.nr_seq_prestador_servico) return '';
          const seq = manutencaoView.nr_seq_prestador_servico;
          const col = colaboradores.find((c) => c.nr_sequencia === seq);
          if (col) {
            if (col.nr_seq_pessoa_juridica) {
              const pj = pessoasJuridicas.find((p) => p.nr_sequencia === col.nr_seq_pessoa_juridica);
              if (pj) return pj.ds_razao_social ?? '';
            }
            const pf = pessoasFisicas.find((p) => p.nr_sequencia === col.nr_seq_pessoa_fisica);
            if (pf) return pf.ds_nome ?? '';
          }
          return pessoasFisicas.find((p) => p.nr_sequencia === seq)?.ds_nome ?? '';
        })()}
        onClose={() => setManutencaoView(null)}
      />

      {/* ── Modal: Concluir manutenção ── */}
      {concluirManutModalOpen && concluirManutTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="absolute inset-0 bg-black/40" onClick={closeConcluirManutModal} />
          <form onSubmit={handleConcluirManutSubmit} className="relative w-full max-w-[560px] min-h-[280px] bg-white modal-dark p-0 shadow-xl shadow-black/20 flex flex-col">
            <div className="flex items-center justify-between bg-[#ccc] px-[15px]">
              <h2 className="text-base font-semibold" style={{ color: '#000' }}>Concluir manutenção{concluirManutLote.length > 1 ? ` (${concluirManutLote.length} ativos)` : ''}</h2>
              <button type="button" onClick={closeConcluirManutModal} className="inline-flex h-9 items-center justify-center rounded-[3px] text-slate-700 transition cursor-pointer p-0 focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#066fc5] focus-visible:outline-offset-2" aria-label="Fechar">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="grid gap-[15px] p-[15px]">
              <div>
                <RotuloCampo texto="Data de término" colecao="pat_manutencao" campo="dt_termino" prefixo={asteriscoModal(MODAL_CONCLUIR_MANUTENCAO, 'dt_termino')} />
                <input type="text" inputMode="numeric" maxLength={10} placeholder="DD/MM/AAAA" disabled={regraModal(MODAL_CONCLUIR_MANUTENCAO, 'dt_termino') === 'D'} className={classeCampoModal(MODAL_CONCLUIR_MANUTENCAO, 'dt_termino', "w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none placeholder:text-[#aaa]")} value={concluirManutForm.dt_termino} onChange={(e) => setConcluirManutForm({ ...concluirManutForm, dt_termino: applyDateMask(e.target.value) })} />
              </div>
              <div>
                <RotuloCampo texto="Status" colecao="pat_ativo" campo="ie_status" />
                <Select
                  value={concluirManutForm.ie_status_ativo}
                  onChange={(v) => setConcluirManutForm({ ...concluirManutForm, ie_status_ativo: v })}
                  options={ATIVO_STATUS_OPTIONS.filter((o) => o.value !== 'M')}
                  showPlaceholder={false}
                />
              </div>
              {/* Isento à esquerda do Valor total, na mesma linha. */}
              <div className="flex items-start gap-[15px]">
              <div className="shrink-0">
                <RotuloCampo texto="Isento" colecao="pat_manutencao" campo="ie_isento" />
                <label className="inline-flex h-[34px] items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    className="cg-checkbox"
                    disabled={regraModal(MODAL_CONCLUIR_MANUTENCAO, 'ie_isento') === 'D'}
                    checked={concluirManutForm.ie_isento}
                    onChange={(e) => setConcluirManutForm({ ...concluirManutForm, ie_isento: e.target.checked, vl_total: '' })}
                  />
                  <span>Sim</span>
                </label>
              </div>
              <div className="flex-1 min-w-0">
                <RotuloCampo texto="Valor total" colecao="pat_manutencao" campo="vl_total" prefixo={asteriscoModal(MODAL_CONCLUIR_MANUTENCAO, 'vl_total')} />
                <input type="text" disabled={concluirManutForm.ie_isento || regraModal(MODAL_CONCLUIR_MANUTENCAO, 'vl_total') === 'D'} className={classeCampoModal(MODAL_CONCLUIR_MANUTENCAO, 'vl_total', "w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-default")} value={concluirManutForm.vl_total} onChange={(e) => { const digits = e.target.value.replace(/\D/g, ''); if (!digits) { setConcluirManutForm({ ...concluirManutForm, vl_total: '' }); return; } const num = Number(digits) / 100; setConcluirManutForm({ ...concluirManutForm, vl_total: num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }); }} />
              </div>
              </div>
              <div>
                <RotuloCampo texto="Correções" colecao="pat_manutencao" campo="ds_correcoes" prefixo={asteriscoModal(MODAL_CONCLUIR_MANUTENCAO, 'ds_correcoes')} />
                <textarea
                  disabled={regraModal(MODAL_CONCLUIR_MANUTENCAO, 'ds_correcoes') === 'D'}
                  className={classeCampoModal(MODAL_CONCLUIR_MANUTENCAO, 'ds_correcoes', "w-full rounded-[3px] border border-slate-300 bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none resize-none")}
                  rows={3}
                  value={concluirManutForm.ds_correcoes}
                  onChange={(e) => setConcluirManutForm({ ...concluirManutForm, ds_correcoes: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 px-[15px] pb-[15px] mt-auto">
              <button type="button" onClick={closeConcluirManutModal} className="px-4 py-2.5 text-sm text-black transition rounded-[3px] border-b button-cancel cursor-pointer min-w-[96px] justify-center" style={{ backgroundColor: '#bdbdbd', borderBottomColor: '#000' } as React.CSSProperties}>Cancelar</button>
              <button type="submit" disabled={concluirManutSaving} className="px-4 py-2.5 text-sm text-white transition rounded-[3px] border-b button-save cursor-pointer min-w-[96px] justify-center disabled:cursor-default disabled:opacity-60" style={{ backgroundColor: '#003056', borderBottomColor: '#000' } as React.CSSProperties}>Salvar</button>
            </div>
          </form>
        </div>
      )}

      {/* ── Modal: Cancelar manutenção ── */}
      {cancelarManutOpen && cancelarManutTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="absolute inset-0 bg-black/40" onClick={() => { setCancelarManutOpen(false); setCancelarManutTarget(null); setCancelarManutLote([]); }} />
          <div className="relative w-full max-w-[420px] bg-white modal-dark p-0 shadow-xl shadow-black/20">
            <div className="flex items-center justify-between bg-[#ccc] px-[15px]">
              <h2 className="text-base font-semibold" style={{ color: '#000' }}>Cancelar manutenção{cancelarManutLote.length > 1 ? ` (${cancelarManutLote.length} manutenções)` : ''}</h2>
              <button type="button" onClick={() => { setCancelarManutOpen(false); setCancelarManutTarget(null); setCancelarManutLote([]); }} className="inline-flex h-9 items-center justify-center rounded-[3px] text-slate-700 transition cursor-pointer p-0" aria-label="Fechar">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="px-[15px] pt-[15px]">
              <p className="text-sm text-slate-900">{cancelarManutLote.length > 1 ? `Deseja mesmo cancelar as ${cancelarManutLote.length} manutenções selecionadas?` : `Deseja mesmo cancelar a manutenção ${cancelarManutTarget.nr_sequencia}?`}</p>
            </div>
            <div className="flex justify-end gap-2 px-[15px] pt-20 pb-[15px]">
              <button type="button" onClick={() => { setCancelarManutOpen(false); setCancelarManutTarget(null); setCancelarManutLote([]); }} className="px-4 py-2.5 text-sm text-black transition rounded-[3px] border-b button-cancel cursor-pointer min-w-[96px] justify-center" style={{ backgroundColor: '#bdbdbd', borderBottomColor: '#000' }}>Não</button>
              <button type="button" onClick={handleCancelarManutSubmit} disabled={cancelarManutSaving} className="px-4 py-2.5 text-sm text-white transition rounded-[3px] border-b button-save cursor-pointer min-w-[96px] justify-center" style={{ backgroundColor: '#003056', borderBottomColor: '#000' }}>Sim</button>
            </div>
          </div>
        </div>
      )}

      {confirmAcao && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="absolute inset-0 bg-black/40" onClick={() => setConfirmAcao(null)} />
          <div className="relative w-full max-w-[420px] bg-white modal-dark p-0 shadow-xl shadow-black/20">
            <div className="flex items-center justify-between bg-[#ccc] px-[15px]">
              <h2 className="text-base font-semibold" style={{ color: '#000' }}>{confirmAcao.titulo}</h2>
              <button type="button" onClick={() => setConfirmAcao(null)} className="inline-flex h-9 items-center justify-center rounded-[3px] text-slate-700 transition cursor-pointer p-0" aria-label="Fechar">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="px-[15px] pt-[15px]">
              <p className="text-sm text-slate-900">{confirmAcao.mensagem}</p>
            </div>
            <div className="flex justify-end gap-2 px-[15px] pt-20 pb-[15px]">
              <button type="button" onClick={() => setConfirmAcao(null)} className="px-4 py-2.5 text-sm text-black transition rounded-[3px] border-b button-cancel cursor-pointer min-w-[96px] justify-center" style={{ backgroundColor: '#bdbdbd', borderBottomColor: '#000' }}>Não</button>
              <button type="button" onClick={() => { const acao = confirmAcao.acao; setConfirmAcao(null); acao(); }} className="px-4 py-2.5 text-sm text-white transition rounded-[3px] border-b button-save cursor-pointer min-w-[96px] justify-center" style={{ backgroundColor: '#003056', borderBottomColor: '#000' }}>Sim</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de visualização de Colaborador (leitura) */}
      <ColaboradorViewModal
        colaborador={comAutorExibicao(colaboradorView)}
        pessoaFisicaName={colaboradorView?.nr_seq_pessoa_fisica ? (pessoasFisicas.find((p) => p.nr_sequencia === colaboradorView.nr_seq_pessoa_fisica)?.ds_nome ?? '') : ''}
        pessoaJuridicaName={colaboradorView?.nr_seq_pessoa_juridica ? (pessoasJuridicas.find((p) => p.nr_sequencia === colaboradorView.nr_seq_pessoa_juridica)?.ds_razao_social ?? '') : ''}
        vinculoContratualName={colaboradorView?.nr_seq_vinculo_contratual ? (vinculosContratuais.find((v) => v.nr_sequencia === colaboradorView!.nr_seq_vinculo_contratual)?.ds_vinculo_contratual ?? '') : ''}
        cargoName={colaboradorView?.nr_seq_cargo ? (cargos.find((c) => c.nr_sequencia === colaboradorView!.nr_seq_cargo)?.ds_cargo ?? '') : ''}
        onClose={() => setColaboradorView(null)}
      />

      {/* ── Modal: Parâmetros do relatório ── */}
      {relatorioParamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="absolute inset-0 bg-black/40" onClick={() => setRelatorioParamModal(null)} />
          <form
            onSubmit={(e) => { e.preventDefault(); handleRelatorioParamConfirm(); }}
            className="relative w-full max-w-[520px] bg-white modal-dark p-0 shadow-xl shadow-black/20"
          >
            <div className="flex items-center justify-between bg-[#ccc] px-[15px]">
              <h2 className="text-base font-semibold" style={{ color: '#000' }}>Parâmetros</h2>
              <button
                type="button"
                onClick={() => setRelatorioParamModal(null)}
                className="inline-flex h-9 items-center justify-center rounded-[3px] text-slate-700 transition cursor-pointer p-0 focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#066fc5] focus-visible:outline-offset-2"
                aria-label="Fechar"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18" />
                  <path d="M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Um campo por parâmetro com Perguntar, na ordem (Ordem; empate pela Sequência). */}
            <div className="grid gap-[15px] p-[15px] max-h-[60vh] overflow-y-auto">
              {relatorioParamModal.parametros.map((parametro, i) => {
                const nome = nomeDoParametro(parametro.cd_atributo);
                const texto = (parametro.ds_label ?? '').trim() || (parametro.ds_parametro ?? '').trim() || nome;
                return (
                  <div key={parametro.id ?? nome}>
                    <RotuloCampo
                      texto={texto}
                      prefixo={parametro.ie_obrigatorio === 'S' ? <RequiredAsterisk /> : undefined}
                      colecao="relatorio_parametro"
                      campo="vl_padrao"
                    />
                    <input
                      type="text"
                      aria-label={texto}
                      autoFocus={i === 0}
                      value={relatorioParamValues[nome] ?? ''}
                      onChange={(e) => {
                        setParamGerarFaltantes((prev) => prev.filter((n) => n !== nome));
                        setRelatorioParamValues((prev) => ({ ...prev, [nome]: e.target.value }));
                      }}
                      className={`w-full rounded-[3px] border bg-white px-2 py-1.5 text-sm transition focus:border-[#003056] focus:outline-none ${paramGerarFaltantes.includes(nome) ? 'border-red-500' : 'border-slate-300'}`}
                    />
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end gap-2 px-[15px] pb-[15px]">
              <button
                type="button"
                onClick={() => setRelatorioParamModal(null)}
                className="px-4 py-2.5 text-sm text-black transition rounded-[3px] border-b button-cancel cursor-pointer min-w-[96px] justify-center"
                style={{ backgroundColor: '#bdbdbd', borderBottomColor: '#000' } as React.CSSProperties}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2.5 text-sm text-white transition rounded-[3px] border-b button-save cursor-pointer min-w-[96px] justify-center"
                style={{ backgroundColor: '#003056', borderBottomColor: '#000' } as React.CSSProperties}
              >
                Gerar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal "Carregando..." exibido durante qualquer gravação. Ativo e Manutenção exibem o próprio modal no FormView. */}
      {(
        gerandoMatricula || parametrosSaving || relatorioGerando ||
        submitting || pjSubmitting || adminSubmitting || cgSubmitting ||
        perfilSubmitting || imagemSubmitting || renomearSubmitting || categoriaSubmitting || cursoSubmitting || disciplinaSubmitting || turmaSubmitting || turmaDisciplinaSubmitting || copiaSubmitting || alterarStatusCopiaSaving ||
        alunoSubmitting || colaboradorSubmitting || periodoLetivoSubmitting || statusPeriodoSaving ||
        alterarStatusSaving || alterarIngressoSaving || alterarAdmissaoSaving || alterarStatusColaboradorSaving ||
        ativoStatusSaving || enviarManutSaving || concluirManutSaving || cancelarManutSaving || periodoLetivoFeriadoSaving || ativoResponsavelSaving || alunoResponsavelSaving || pfDetalheSaving || ativoTransferirSaving || assumirAtivosSaving ||
        delegateFuncoesSaving || permissoesSaving || duplicatePerfilSaving || delegatePerfisSaving || camposStatusSaving || salvandoFiltro
      ) && <LoadingModal open message="Carregando..." />}

      <AvisoModal campo={avisoModalCampo} onClose={() => setAvisoModalCampo(null)} />

      {toastMounted && (
        <Toast
          visible={toastVisible}
          message={message}
          status={messageStatus}
          onClose={() => setToastVisible(false)}
        />
      )}
    </div>
  );
}
