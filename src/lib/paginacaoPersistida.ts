"use client";

import { createContext, useCallback, useContext, useState } from "react";

export type TamanhoPagina = number | "all";

interface EstadoPaginacao {
  pageSize: TamanhoPagina;
  currentPage: number;
}

const PADRAO: EstadoPaginacao = { pageSize: 30, currentPage: 1 };

/**
 * Estado do rodapé de paginação (página atual e registros por página) de cada
 * tela de registros, guardado fora dos componentes: sobrevive à desmontagem da
 * lista (ex.: abrir o formulário, salvar e voltar). Só volta ao padrão quando a
 * função é fechada (X no menu lateral) ou no Sair — ver limparPaginacaoDaSecao.
 */
const store = new Map<string, EstadoPaginacao>();

/** Função do menu lateral (seção) a que a tela de registros pertence. */
export const SecaoPaginacaoContext = createContext<string>("");

/** Volta ao padrão a paginação de todas as telas de uma função (ou de todas, sem argumento). */
export function limparPaginacaoDaSecao(secao?: string): void {
  if (secao === undefined) {
    store.clear();
    return;
  }
  for (const chave of [...store.keys()]) {
    if (chave.startsWith(`${secao}::`)) store.delete(chave);
  }
}

/**
 * Página atual e registros por página persistidos por função + tela.
 * `id` identifica a tela dentro da função (ex.: o valor do dropdown PAI).
 * Trocar a quantidade por página volta para a página 1.
 */
export function usePaginacaoPersistida(id: string) {
  const secao = useContext(SecaoPaginacaoContext);
  const chave = `${secao}::${id}`;
  const [estado, setEstado] = useState<EstadoPaginacao>(() => store.get(chave) ?? PADRAO);
  const [chaveAtual, setChaveAtual] = useState(chave);

  // A mesma instância pode passar a exibir outra tela (outro id): carrega o estado dela.
  let atual = estado;
  if (chaveAtual !== chave) {
    atual = store.get(chave) ?? PADRAO;
    setChaveAtual(chave);
    setEstado(atual);
  }

  const atualizar = useCallback(
    (patch: Partial<EstadoPaginacao>) => {
      setEstado((prev) => {
        const next = { ...prev, ...patch };
        store.set(chave, next);
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
