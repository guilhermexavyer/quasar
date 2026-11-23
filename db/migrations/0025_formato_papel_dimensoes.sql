-- Quasar: Cadastros Gerais > Formato do papel ganha Largura e Altura, para os
-- relatórios em PDF (tamanho da página). Valores em milímetros, com até 2 casas
-- decimais (ex.: A4 = 210 x 297; Carta = 215,9 x 279,4). Opcionais: os formatos já
-- cadastrados ficam sem medidas até serem editados.

alter table cg_formato_papel add column qt_largura numeric(10, 2) check (qt_largura > 0);
alter table cg_formato_papel add column qt_altura  numeric(10, 2) check (qt_altura > 0);

comment on column cg_formato_papel.qt_largura is 'Largura do papel, em milímetros.';
comment on column cg_formato_papel.qt_altura  is 'Altura do papel, em milímetros.';
