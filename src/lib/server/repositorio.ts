import "server-only";
import type { PoolClient } from "pg";
import { query, transacao } from "@/lib/db";
import {
  colunasDe, ident, mesmoValor, paraBanco, paraHistorico, paraTela, parametro,
  TABELAS_REGISTRO_UNICO, ErroValidacao, type Colunas, type Registro,
} from "@/lib/server/esquema";
import { hashSenha } from "@/lib/server/senha";
import { caminhoDoStorage, infoArquivo } from "@/lib/server/storage";
import type { Sessao } from "@/lib/server/sessao";

/**
 * Leitura e gravação genéricas das tabelas:
 *   - criar/atualizar preenchem dt_criacao/dt_alteracao/ds_usuario_*;
 *   - atualizar sem mudança real não grava nada;
 *   - toda gravação registra auditoria, e toda exclusão guarda a cópia do
 *     registro em `exclusao` — agora na MESMA transação da gravação;
 *   - o autor vem da sessão (nunca do navegador).
 */

/** Dados extras da auditoria que a tela informa (qual aviso/regra mudou, detalhe do parâmetro). */
export interface OpcoesAuditoria {
  campo?: string;
  regra?: string;
  detalhes?: Registro;
  /** Autor "Sistema" (encerramento automático do período letivo). */
  sistema?: boolean;
}

/** Lê do corpo do pedido só o que a tela pode informar sobre a auditoria (nunca o autor). */
export function opcoesDeAuditoria(bruto: unknown): OpcoesAuditoria | undefined {
  if (!bruto || typeof bruto !== "object") return undefined;
  const a = bruto as Registro;
  return {
    campo: typeof a.campo === "string" ? a.campo : undefined,
    regra: typeof a.regra === "string" ? a.regra : undefined,
    detalhes: a.detalhes && typeof a.detalhes === "object" && !Array.isArray(a.detalhes) ? (a.detalhes as Registro) : undefined,
  };
}

export interface PerfilEmUso {
  nr_sequencia?: number;
  ds_perfil?: string;
}

type Executor = Pick<PoolClient, "query">;

function avisarDesconhecidas(tabela: string, chaves: string[]) {
  if (chaves.length > 0) console.warn(`[api] ${tabela}: campos ignorados (não são colunas): ${chaves.join(", ")}`);
}

/** Senha do usuário: chega em texto e é guardada como hash; vazia = mantém a atual. */
function tratarSenha(tabela: string, valores: Map<string, unknown>) {
  if (tabela !== "usuario" || !valores.has("ds_senha")) return;
  const senha = valores.get("ds_senha");
  if (typeof senha === "string" && senha !== "") valores.set("ds_senha", hashSenha(senha));
  else valores.delete("ds_senha");
}

/** Parâmetro "Alterar senha no próximo login" (Administração do Sistema > Parâmetros) está em Sim? */
async function alterarSenhaNoProximoLogin(db: Executor): Promise<boolean> {
  // Sem registro (nunca configurado) ou "---"/Não: equivale a Não.
  const { rows } = await db.query<Registro>(
    "select ie_regra from as_param_alterar_senha_proximo_login where nr_sequencia = 1"
  );
  return String(rows[0]?.ie_regra ?? "").toUpperCase() === "S";
}

/**
 * usuario.ie_alterar_senha é gravada só pelo servidor:
 *   - senha alterada pelo menu de contexto "Alterar senha" (Usuários), inclusive
 *     a do próprio usuário → 'S' se o parâmetro estiver em Sim (senão a marca sai);
 *   - senha definida pelo próprio usuário para si (menu do usuário ou modal do
 *     login, `trocaPropriaSenha`) → a marca sai.
 */
async function tratarMarcaAlterarSenha(
  db: Executor, tabela: string, nr: number, colunas: Colunas, valores: Map<string, unknown>, sessao: Sessao,
  trocaPropriaSenha: boolean
) {
  if (tabela !== "usuario") return;
  valores.delete("ie_alterar_senha");
  // A coluna e a tabela do parâmetro nascem juntas (migração 0008): sem a coluna, nada a fazer.
  if (!colunas.has("ie_alterar_senha") || !valores.has("ds_senha")) return;
  // Só vale para a própria senha: ninguém tira a marca de outro usuário por aqui.
  const propria = trocaPropriaSenha && nr === sessao.nrUsuario;
  valores.set("ie_alterar_senha", !propria && (await alterarSenhaNoProximoLogin(db)) ? "S" : null);
}

/**
 * Imagem: ie_arquivo chega como o caminho da rota (/api/imagens/arquivo/images/x.png).
 * No banco ficam o caminho no Storage e os metadados do arquivo (nome, tipo, tamanho).
 */
async function completarImagem(tabela: string, valores: Map<string, unknown>) {
  if (tabela !== "imagem" || !valores.has("ie_arquivo")) return;
  for (const c of ["ds_arquivo", "ds_mime", "nr_tamanho", "ds_caminho_storage"]) valores.delete(c);
  const bruto = String(valores.get("ie_arquivo") ?? "");
  const caminho = caminhoDoStorage(bruto);
  if (!caminho) {
    // Imagens antigas do repositório (/images/...) ou campo vazio: só o nome.
    valores.set("ds_arquivo", bruto.split("/").pop() || null);
    valores.set("ds_caminho_storage", null);
    valores.set("ds_mime", null);
    valores.set("nr_tamanho", null);
    return;
  }
  const info = await infoArquivo(caminho);
  if (!info) throw new ErroValidacao("Arquivo da imagem não encontrado. Envie a imagem novamente.");
  valores.set("ie_arquivo", caminho);
  valores.set("ds_caminho_storage", caminho);
  valores.set("ds_arquivo", caminho.split("/").pop());
  valores.set("ds_mime", info.mime);
  valores.set("nr_tamanho", info.tamanho);
}

async function registrarAuditoria(
  db: Executor, tabela: string, nr: number, acao: "create" | "update" | "password",
  agora: string, sessao: Sessao, detalhes: Registro, opcoes?: OpcoesAuditoria
) {
  await db.query(
    `insert into auditoria (ds_colecao, nr_seq_registro, nr_seq_usuario, usuario_nome, acao, "timestamp", detalhes, campo, regra)
     values ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9)`,
    [
      tabela, nr, opcoes?.sistema ? null : sessao.nrUsuario, opcoes?.sistema ? "Sistema" : sessao.nomeUsuario,
      acao, agora, JSON.stringify(opcoes?.detalhes ?? detalhes), opcoes?.campo ?? null, opcoes?.regra ?? null,
    ]
  );
}

/* ── Leitura ── */

export async function listar(tabela: string, filtros: Record<string, string> = {}): Promise<Registro[]> {
  const colunas = await colunasDe(tabela);
  const { valores, desconhecidas } = paraBanco(colunas, filtros);
  if (desconhecidas.length > 0) throw new ErroValidacao(`Filtro desconhecido: ${desconhecidas.join(", ")}`);
  const condicoes: string[] = [];
  const params: unknown[] = [];
  // nr_sequencia é coluna de controle (não passa por paraBanco), mas pode ser filtro.
  if (filtros.nr_sequencia !== undefined) {
    params.push(Number(filtros.nr_sequencia));
    condicoes.push(`nr_sequencia = $${params.length}`);
  }
  for (const [coluna, valor] of valores) {
    params.push(valor);
    condicoes.push(`${ident(coluna)} = ${parametro(colunas.get(coluna)!, params.length)}`);
  }
  const { rows } = await query<Registro>(
    `select * from ${ident(tabela)}${condicoes.length ? ` where ${condicoes.join(" and ")}` : ""} order by nr_sequencia`,
    params
  );
  return rows.map((linha) => paraTela(tabela, colunas, linha));
}

export async function obter(tabela: string, nr: number): Promise<Registro | null> {
  const colunas = await colunasDe(tabela);
  const { rows } = await query<Registro>(`select * from ${ident(tabela)} where nr_sequencia = $1`, [nr]);
  return rows[0] ? paraTela(tabela, colunas, rows[0]) : null;
}

/** Linha no formato do banco (para regras de acesso). */
export async function obterLinha(tabela: string, nr: number): Promise<Registro | null> {
  await colunasDe(tabela);
  const { rows } = await query<Registro>(`select * from ${ident(tabela)} where nr_sequencia = $1`, [nr]);
  return rows[0] ?? null;
}

/* ── Criação ── */

export async function criar(tabela: string, dados: Registro, sessao: Sessao, opcoes?: OpcoesAuditoria): Promise<Registro> {
  const colunas = await colunasDe(tabela);
  const { valores, desconhecidas } = paraBanco(colunas, dados);
  avisarDesconhecidas(tabela, desconhecidas);
  tratarSenha(tabela, valores);
  await completarImagem(tabela, valores);
  // Usuário novo nasce sem senha (o formulário de cadastro não tem esse campo, como
  // antes da migração): a senha é definida depois em "Alterar senha". Senha vazia
  // nunca confere no login (senhaConfere), então ninguém entra até ela ser definida.
  if (tabela === "usuario" && !valores.get("ds_senha")) valores.set("ds_senha", "");
  if (tabela === "usuario") {
    valores.delete("ie_alterar_senha"); // gravada só pelo servidor
    valores.delete("dt_ultimo_login"); // gravada só no login
  }

  const agora = new Date().toISOString();
  const autor = opcoes?.sistema ? "Sistema" : sessao.nomeUsuario;
  valores.set("dt_criacao", agora);
  valores.set("dt_alteracao", agora);
  valores.set("ds_usuario_criacao", autor);
  valores.set("ds_usuario_alteracao", autor);
  if (TABELAS_REGISTRO_UNICO.has(tabela)) valores.set("nr_sequencia", 1);

  const nomes = [...valores.keys()];
  return transacao(async (db) => {
    const { rows } = await db.query<Registro>(
      `insert into ${ident(tabela)} (${nomes.map(ident).join(", ")})
       values (${nomes.map((n, i) => parametro(colunas.get(n)!, i + 1)).join(", ")}) returning *`,
      nomes.map((n) => valores.get(n))
    );
    const linha = rows[0];
    await registrarAuditoria(db, tabela, Number(linha.nr_sequencia), "create", agora, sessao, paraHistorico(tabela, colunas, linha), opcoes);
    return paraTela(tabela, colunas, linha);
  });
}

/* ── Atualização ── */

export interface ResultadoAtualizacao {
  /** null quando o registro não existe (a tela trata como "nada a fazer"). */
  registro: Registro | null;
  alterado: boolean;
}

export async function atualizar(
  tabela: string, nr: number, dados: Registro, sessao: Sessao,
  opcoes?: OpcoesAuditoria & {
    semAuditoria?: boolean;
    condicao?: (atual: Registro) => boolean;
    /** Senha definida pelo próprio usuário para si (menu do usuário ou modal do login): tira a marca de troca. */
    trocaPropriaSenha?: boolean;
  }
): Promise<ResultadoAtualizacao> {
  const colunas = await colunasDe(tabela);
  const { valores, desconhecidas } = paraBanco(colunas, dados);
  avisarDesconhecidas(tabela, desconhecidas);
  tratarSenha(tabela, valores);
  await completarImagem(tabela, valores);
  if (tabela === "usuario") valores.delete("dt_ultimo_login"); // gravada só no login

  return transacao(async (db) => {
    const { rows } = await db.query<Registro>(`select * from ${ident(tabela)} where nr_sequencia = $1 for update`, [nr]);
    const atual = rows[0];
    if (!atual) return { registro: null, alterado: false };
    if (opcoes?.condicao && !opcoes.condicao(atual)) return { registro: paraTela(tabela, colunas, atual), alterado: false };
    await tratarMarcaAlterarSenha(db, tabela, nr, colunas, valores, sessao, opcoes?.trocaPropriaSenha === true);

    const mudancas = [...valores].filter(([coluna, valor]) => !mesmoValor(colunas.get(coluna)!, atual[coluna], valor));
    if (mudancas.length === 0) return { registro: paraTela(tabela, colunas, atual), alterado: false };

    const params: unknown[] = [nr];
    const sets = mudancas.map(([coluna, valor]) => {
      params.push(valor);
      return `${ident(coluna)} = ${parametro(colunas.get(coluna)!, params.length)}`;
    });
    const agora = new Date().toISOString();
    if (!opcoes?.semAuditoria) {
      params.push(agora, opcoes?.sistema ? "Sistema" : sessao.nomeUsuario);
      sets.push(`dt_alteracao = $${params.length - 1}`, `ds_usuario_alteracao = $${params.length}`);
    }
    const { rows: novas } = await db.query<Registro>(
      `update ${ident(tabela)} set ${sets.join(", ")} where nr_sequencia = $1 returning *`,
      params
    );
    const linha = novas[0];
    if (!opcoes?.semAuditoria) {
      // A marca "alterar senha no próximo login" acompanha a troca de senha: não muda o tipo do log.
      const semMarca = mudancas.filter(([coluna]) => coluna !== "ie_alterar_senha");
      const soSenha = tabela === "usuario" && semMarca.length === 1 && semMarca[0][0] === "ds_senha";
      await registrarAuditoria(db, tabela, nr, soSenha ? "password" : "update", agora, sessao, paraHistorico(tabela, colunas, linha), opcoes);
    }
    return { registro: paraTela(tabela, colunas, linha), alterado: true };
  });
}

/* ── Exclusão ── */

/**
 * Exclui o registro, guardando antes a cópia em `exclusao` (Administração do
 * Sistema > Exclusões). Se outro registro depender deste, o banco recusa
 * (chave estrangeira) e nada é gravado — nem a cópia.
 */
export async function excluir(tabela: string, nr: number, sessao: Sessao, perfil?: PerfilEmUso): Promise<boolean> {
  const colunas = await colunasDe(tabela);
  return transacao(async (db) => {
    const { rows } = await db.query<Registro>(`select * from ${ident(tabela)} where nr_sequencia = $1 for update`, [nr]);
    const atual = rows[0];
    if (!atual) return false;
    await db.query(
      `insert into exclusao (ds_colecao, nr_seq_registro, dados, dt_exclusao, ds_usuario_exclusao, nr_seq_usuario, nr_seq_perfil_exclusao, ds_perfil_exclusao)
       values ($1, $2, $3::jsonb, $4, $5, $6, $7, $8)`,
      [
        tabela, nr, JSON.stringify(paraHistorico(tabela, colunas, atual)), new Date().toISOString(),
        sessao.nomeUsuario, sessao.nrUsuario, perfil?.nr_sequencia ?? null, perfil?.ds_perfil ?? "",
      ]
    );
    await db.query(`delete from ${ident(tabela)} where nr_sequencia = $1`, [nr]);
    return true;
  });
}

/* ── Auditoria e exclusões (leitura) ── */

/** Hash de senha que possa existir em históricos antigos nunca vai para a tela. */
function semSenha(tabela: string, dados: unknown): unknown {
  if (tabela !== "usuario" || !dados || typeof dados !== "object") return dados;
  const { ds_senha: _s, ...resto } = dados as Registro;
  void _s;
  return resto;
}

export async function listarAuditoria(tabela: string, nr: number): Promise<Registro[]> {
  const { rows } = await query<Registro>(
    `select * from auditoria where ds_colecao = $1 and nr_seq_registro = $2 order by "timestamp" desc, nr_sequencia desc`,
    [tabela, nr]
  );
  return rows.map((r) => ({
    id: String(r.nr_sequencia),
    usuarioId: r.nr_seq_usuario != null ? String(r.nr_seq_usuario) : null,
    usuarioNome: r.usuario_nome ?? "-",
    acao: r.acao,
    timestamp: r.timestamp,
    detalhes: semSenha(tabela, r.detalhes),
    ...(r.campo ? { campo: r.campo } : {}),
    ...(r.regra ? { regra: r.regra } : {}),
  }));
}

export async function listarExclusoes(tabela: string): Promise<Registro[]> {
  const { rows } = await query<Registro>(`select * from exclusao where ds_colecao = $1 order by dt_exclusao desc`, [tabela]);
  return rows.map((r) => ({
    id: String(r.nr_sequencia),
    ds_colecao: r.ds_colecao,
    id_registro: r.nr_seq_registro != null ? String(r.nr_seq_registro) : "",
    ...(r.nr_seq_registro != null ? { nr_sequencia: r.nr_seq_registro } : {}),
    dados: semSenha(tabela, r.dados),
    dt_exclusao: r.dt_exclusao,
    ds_usuario_exclusao: r.ds_usuario_exclusao ?? "-",
    usuario_id_exclusao: r.nr_seq_usuario != null ? String(r.nr_seq_usuario) : null,
    ...(r.nr_seq_perfil_exclusao != null ? { nr_seq_perfil_exclusao: r.nr_seq_perfil_exclusao } : {}),
    ds_perfil_exclusao: r.ds_perfil_exclusao ?? "",
  }));
}

export type { Colunas };
