"use client";

import { createContext, useCallback, useContext, useState } from "react";

export type TamanhoPagina = number | "all";

interface EstadoPaginacao {
  pageSize: TamanhoPagina;
  currentPage: number;
}

const PADRAO: EstadoPaginacao = { pageSize: 30, currentPage: 1 };

/** Chave do estado de paginação no sessionStorage (por aba) e no localStorage (ponto de partida de abas novas). */
const STORAGE_KEY = "quasar_paginacao";

/**
 * Estado do rodapé de paginação (página atual e registros por página) de cada
 * tela de registros, guardado fora dos componentes e gravado no navegador:
 * sobrevive à desmontagem da lista (abrir o formulário, salvar e voltar) e ao
 * F5. Só volta ao padrão quando a função é fechada (X no menu lateral) ou no
 * Sair/novo login — ver limparPaginacaoDaSecao. Como a navegação (função ativa),
 * cada aba usa o próprio sessionStorage; o localStorage só serve para abas novas.
 */
let store: Map<string, EstadoPaginacao> | null = null;

function estadoValido(v: unknown): v is EstadoPaginacao {
  if (!v || typeof v !== "object") return false;
  const { pageSize, currentPage } = v as Partial<EstadoPaginacao>;
  const tamanhoOk = pageSize === "all" || (typeof pageSize === "number" && Number.isInteger(pageSize) && pageSize > 0);
  return tamanhoOk && typeof currentPage === "number" && Number.isInteger(currentPage) && currentPage >= 1;
}

function lerDoNavegador(): Map<string, EstadoPaginacao> {
  const mapa = new Map<string, EstadoPaginacao>();
  if (typeof window === "undefined") return mapa;
  let raw: string | null = null;
  try {
    raw = window.sessionStorage.getItem(STORAGE_KEY) ?? window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return mapa;
  }
  if (!raw) return mapa;
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    for (const [chave, valor] of Object.entries(parsed ?? {})) {
      if (estadoValido(valor)) mapa.set(chave, { pageSize: valor.pageSize, currentPage: valor.currentPage });
    }
  } catch {
    /* conteúdo corrompido — usa o padrão */
  }
  return mapa;
}

function obterStore(): Map<string, EstadoPaginacao> {
  if (!store) store = lerDoNavegador();
  return store;
}

function gravarNoNavegador(): void {
  if (typeof window === "undefined") return;
  const raw = JSON.stringify(Object.fromEntries(obterStore()));
  try {
    window.sessionStorage.setItem(STORAGE_KEY, raw);
  } catch {
    /* storage indisponível */
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, raw);
  } catch {
    /* storage indisponível */
  }
}

/** Função do menu lateral (seção) a que a tela de registros pertence. */
export const SecaoPaginacaoContext = createContext<string>("");

/** Volta ao padrão a paginação de todas as telas de uma função (ou de todas, sem argumento). */
export function limparPaginacaoDaSecao(secao?: string): void {
  const mapa = obterStore();
  if (secao === undefined) {
    mapa.clear();
  } else {
    for (const chave of [...mapa.keys()]) {
      if (chave.startsWith(`${secao}::`)) mapa.delete(chave);
    }
  }
  gravarNoNavegador();
}

/**
 * Página atual e registros por página persistidos por função + tela.
 * `id` identifica a tela dentro da função (ex.: o valor do dropdown PAI).
 * Trocar a quantidade por página volta para a página 1.
 */
export function usePaginacaoPersistida(id: string) {
  const secao = useContext(SecaoPaginacaoContext);
  const chave = `${secao}::${id}`;
  const [estado, setEstado] = useState<EstadoPaginacao>(() => obterStore().get(chave) ?? PADRAO);
  const [chaveAtual, setChaveAtual] = useState(chave);

  // A mesma instância pode passar a exibir outra tela (outro id): carrega o estado dela.
  let atual = estado;
  if (chaveAtual !== chave) {
    atual = obterStore().get(chave) ?? PADRAO;
    setChaveAtual(chave);
    setEstado(atual);
  }

  const atualizar = useCallback(
    (patch: Partial<EstadoPaginacao>) => {
      setEstado((prev) => {
        const next = { ...prev, ...patch };
        obterStore().set(chave, next);
        gravarNoNavegador();
        return next;
      });
    },
    [chave]
  );

  const setPageSize = useCallback(
    (pageSize: TamanhoPagina) => atualizar({ pageSize, currentPage: 1 }),
    [atualizar]
  );
  const setCurrentPage = useCallback(
    (currentPage: number) => atualizar({ currentPage }),
    [atualizar]
  );

  return { pageSize: atual.pageSize, currentPage: atual.currentPage, setPageSize, setCurrentPage };
}
