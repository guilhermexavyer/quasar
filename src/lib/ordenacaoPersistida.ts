"use client";

import { useCallback, useContext, useState, useSyncExternalStore, type Dispatch, type SetStateAction } from "react";
import { SecaoPaginacaoContext } from "@/lib/paginacaoPersistida";

/** Chave do estado de ordenação no sessionStorage (por aba do navegador). */
const STORAGE_KEY = "quasar_ordenacao";

/**
 * Ordenação das colunas (clique no título) de cada tabela de registros, guardada fora dos
 * componentes: sobrevive à desmontagem da tabela (abrir as Bandas de um relatório, voltar
 * para Relatórios e abrir as Bandas de novo) e ao F5. Não vai para o banco nem para a
 * configuração do usuário: volta ao padrão quando a função é fechada (X no menu lateral) ou
 * no Sair/novo login — ver limparOrdenacaoDaSecao. Chave: `${função}::${tabela}`.
 */
let store: Map<string, unknown> | null = null;
const ouvintes = new Set<() => void>();

function lerDoNavegador(): Map<string, unknown> {
  const mapa = new Map<string, unknown>();
  if (typeof window === "undefined") return mapa;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return mapa;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    for (const [chave, valor] of Object.entries(parsed ?? {})) mapa.set(chave, valor);
  } catch {
    /* storage indisponível ou conteúdo corrompido — usa o padrão */
  }
  return mapa;
}

function obterStore(): Map<string, unknown> {
  if (!store) store = lerDoNavegador();
  return store;
}

function gravarEAvisar(): void {
  if (typeof window !== "undefined") {
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(Object.fromEntries(obterStore())));
    } catch {
      /* storage indisponível */
    }
  }
  ouvintes.forEach((ouvinte) => ouvinte());
}

function inscrever(ouvinte: () => void): () => void {
  ouvintes.add(ouvinte);
  return () => {
    ouvintes.delete(ouvinte);
  };
}

/** Volta ao padrão a ordenação de todas as tabelas de uma função (ou de todas, sem argumento). */
export function limparOrdenacaoDaSecao(secao?: string): void {
  const mapa = obterStore();
  if (secao === undefined) {
    mapa.clear();
  } else {
    for (const chave of [...mapa.keys()]) {
      if (chave.startsWith(`${secao}::`)) mapa.delete(chave);
    }
  }
  gravarEAvisar();
}

/**
 * Como o useState, para o estado de ordenação de uma tabela, mas guardado por função + tabela
 * (ver o comentário do store). `id` identifica a tabela dentro da função; `secao` só é preciso
 * fora do SecaoPaginacaoContext (as listas montadas na própria página).
 */
export function useOrdenacaoPersistida<T>(id: string, padrao: T, secao?: string): [T, Dispatch<SetStateAction<T>>] {
  const secaoDoContexto = useContext(SecaoPaginacaoContext);
  const chave = `${secao ?? secaoDoContexto}::${id}`;
  // Mesma referência em todas as renderizações (o padrão pode ser um objeto literal).
  const [padraoFixo] = useState(padrao);

  const valor = useSyncExternalStore(
    inscrever,
    () => {
      const mapa = obterStore();
      return (mapa.has(chave) ? mapa.get(chave) : padraoFixo) as T;
    },
    () => padraoFixo
  );

  const definir = useCallback<Dispatch<SetStateAction<T>>>(
    (acao) => {
      const mapa = obterStore();
      const atual = (mapa.has(chave) ? mapa.get(chave) : padraoFixo) as T;
      const proximo = typeof acao === "function" ? (acao as (anterior: T) => T)(atual) : acao;
      if (Object.is(proximo, atual)) return;
      mapa.set(chave, proximo);
      gravarEAvisar();
    },
    [chave, padraoFixo]
  );

  return [valor, definir];
}
