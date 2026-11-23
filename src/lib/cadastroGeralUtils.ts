import { formatDate } from "@/lib/pessoaFisicaUtils";

export function formatCadastroGeralCellValue(key: string, value: unknown): string {
  if (value === null || value === undefined) return '';
  const stringValue = String(value);
  if (!stringValue) return '';

  switch (key) {
    case 'dt_criacao':
    case 'dt_alteracao':
      return formatDate(stringValue);
    case 'ie_status':
      switch (stringValue) {
        case 'A':
          return 'Ativo';
        case 'I':
          return 'Inativo';
        default:
          return '';
      }
    case 'qt_largura':
    case 'qt_altura':
      return formatarMedida(value);
    default:
      return stringValue;
  }
}

/* ── Medidas (Formato do papel: Largura e Altura, em milímetros, até 2 casas decimais) ── */

/** Medida do banco (número ou texto "210.00") para a tela: "210", "215,9". */
export function formatarMedida(valor: unknown): string {
  if (valor === null || valor === undefined || String(valor).trim() === '') return '';
  const n = Number(String(valor).replace(',', '.'));
  if (!Number.isFinite(n)) return String(valor);
  return n.toLocaleString('pt-BR', { maximumFractionDigits: 2, useGrouping: false });
}

/** Máscara da digitação: só dígitos e uma vírgula, com até 2 casas decimais (e `maxInteiros` dígitos antes da vírgula). */
export function mascararMedida(texto: string, maxInteiros = 8): string {
  const limpo = texto.replace(/\./g, ',').replace(/[^0-9,]/g, '');
  const [inteiro, ...resto] = limpo.split(',');
  const parteInteira = inteiro.slice(0, maxInteiros);
  return resto.length > 0 ? `${parteInteira},${resto.join('').slice(0, 2)}` : parteInteira;
}

/** Medida digitada ("215,9") para gravar: número, ou null se vazia/inválida. */
export function medidaParaBanco(texto: string | undefined | null): number | null {
  const t = String(texto ?? '').trim().replace(',', '.');
  if (t === '' || t === '.') return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}
