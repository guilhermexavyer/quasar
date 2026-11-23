/** Formato do papel (Cadastros Gerais > Formato do papel), usado em Controle de Cópias > Cópias. */
export interface FormatoPapel {
  id?: string;
  nr_sequencia: number;
  ds_formato_papel: string;
  /** Largura do papel, em milímetros (o banco devolve numeric como texto). */
  qt_largura?: number | string | null;
  /** Altura do papel, em milímetros. */
  qt_altura?: number | string | null;
  /** Status: 'A' (Ativo) / 'I' (Inativo). */
  ie_status?: string;
  dt_criacao: string;
  dt_alteracao: string;
  ds_usuario_criacao?: string;
  ds_usuario_alteracao?: string;
}
