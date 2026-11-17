/**
 * Substitui o "tempo real" do Firestore (onSnapshot): busca na hora, de novo
 * sempre que este navegador grava algo no mesmo assunto (notificarMudanca) e a
 * cada 15 segundos, para refletir o que outros usuários alteraram.
 */
const INTERVALO_MS = 15_000;
const ouvintes = new Map<string, Set<() => void>>();

/** Avisa os observadores de um assunto (ex.: "periodo_letivo") que os dados mudaram. */
export function notificarMudanca(assunto: string) {
  ouvintes.get(assunto)?.forEach((atualizar) => atualizar());
}

/** Avisa os observadores de todos os assuntos que começam com o prefixo (ex.: "pat_ativo_responsavel:"). */
export function notificarPrefixo(prefixo: string) {
  for (const [assunto, lista] of ouvintes) {
    if (assunto.startsWith(prefixo)) lista.forEach((atualizar) => atualizar());
  }
}

/** Observa um assunto; devolve a função que cancela a observação. */
export function observar<T>(
  assunto: string,
  buscar: () => Promise<T>,
  aoMudar: (dados: T) => void,
  aoFalhar?: (erro: unknown) => void
): () => void {
  let ativo = true;
  let pedido = 0;
  let ultimo: string | undefined;
  const atualizar = () => {
    const meuPedido = ++pedido;
    buscar()
      .then((dados) => {
        // Ignora respostas atrasadas de pedidos anteriores.
        if (!ativo || meuPedido !== pedido) return;
        // Só avisa a tela quando algo mudou de fato (evita redesenhar a cada consulta).
        const texto = JSON.stringify(dados);
        if (texto === ultimo) return;
        ultimo = texto;
        aoMudar(dados);
      })
      .catch((erro) => {
        if (ativo && meuPedido === pedido) aoFalhar?.(erro);
      });
  };
  if (!ouvintes.has(assunto)) ouvintes.set(assunto, new Set());
  ouvintes.get(assunto)!.add(atualizar);
  atualizar();
  const timer = setInterval(() => {
    if (typeof document === "undefined" || document.visibilityState === "visible") atualizar();
  }, INTERVALO_MS);
  return () => {
    ativo = false;
    clearInterval(timer);
    ouvintes.get(assunto)?.delete(atualizar);
  };
}
