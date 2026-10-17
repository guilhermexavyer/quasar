/**
 * Limpa o HTML dos avisos (Administração do Sistema > Avisos) antes de exibir.
 *
 * O conteúdo é digitado por usuários do sistema e mostrado a todos — inclusive
 * na tela de login, sem autenticação. Por isso só ficam tags e atributos de
 * formatação: scripts, eventos (onclick, onerror…), iframes, formulários e
 * links "javascript:" são removidos.
 */

/** Tags de formatação permitidas. */
const TAGS_PERMITIDAS = new Set([
  "a", "b", "strong", "i", "em", "u", "s", "strike", "del", "ins", "mark", "small", "sub", "sup", "code", "pre",
  "p", "br", "hr", "div", "span", "blockquote", "center", "font",
  "h1", "h2", "h3", "h4", "h5", "h6",
  "ul", "ol", "li",
  "table", "thead", "tbody", "tfoot", "tr", "th", "td", "caption",
  "img",
]);

/** Tags removidas junto com o conteúdo (o resto das tags desconhecidas some, mas o texto fica). */
const TAGS_REMOVIDAS = new Set([
  "script", "style", "iframe", "frame", "frameset", "object", "embed", "applet", "link", "meta", "base",
  "form", "input", "button", "textarea", "select", "option", "svg", "math", "template", "noscript",
]);

/** Atributos permitidos (qualquer on* é sempre removido). */
const ATRIBUTOS_PERMITIDOS = new Set([
  "style", "class", "title", "align", "color", "size", "face",
  "href", "target", "src", "alt", "width", "height", "colspan", "rowspan",
]);

/** Endereços aceitos em href/src: http(s), e-mail, telefone, âncoras e caminhos do próprio sistema. */
const URL_SEGURA = /^(https?:|mailto:|tel:|#|\/(?!\/))/i;
const ESTILO_PERIGOSO = /expression\s*\(|url\s*\(|javascript:|@import|behavior\s*:/i;

function limparElemento(elemento: Element) {
  for (const filho of Array.from(elemento.children)) {
    const tag = filho.tagName.toLowerCase();
    if (TAGS_REMOVIDAS.has(tag)) {
      filho.remove();
      continue;
    }
    if (!TAGS_PERMITIDAS.has(tag)) {
      // Tag desconhecida: mantém só o conteúdo (já limpo).
      limparElemento(filho);
      filho.replaceWith(...Array.from(filho.childNodes));
      continue;
    }
    for (const atributo of Array.from(filho.attributes)) {
      const nome = atributo.name.toLowerCase();
      const valor = atributo.value.trim();
      const proibido =
        nome.startsWith("on") ||
        !ATRIBUTOS_PERMITIDOS.has(nome) ||
        ((nome === "href" || nome === "src") && !URL_SEGURA.test(valor)) ||
        (nome === "style" && ESTILO_PERIGOSO.test(valor));
      if (proibido) filho.removeAttribute(atributo.name);
    }
    if (tag === "a") {
      // Links externos abrem em nova aba sem acesso à página de origem.
      if (filho.getAttribute("target") !== "_blank") filho.removeAttribute("target");
      filho.setAttribute("rel", "noopener noreferrer");
    }
    limparElemento(filho);
  }
}

/** Retorna o HTML apenas com formatação segura. Fora do navegador (SSR) retorna vazio. */
export function sanitizarHtml(html: string): string {
  if (!html || typeof window === "undefined" || typeof DOMParser === "undefined") return "";
  const documento = new DOMParser().parseFromString(`<!doctype html><body>${html}</body>`, "text/html");
  limparElemento(documento.body);
  return documento.body.innerHTML;
}
