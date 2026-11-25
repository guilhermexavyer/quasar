-- Quasar: Administração do Sistema > Usuários ganha o checkbox "Parâmetros da Função"
-- (usuario.ie_parametros_funcao: 'S' marcado / 'N' desmarcado). Marcado, a pop-up do
-- usuário (menu lateral) mostra a opção "Parâmetros da Função", que abre
-- Administração do Sistema > Parâmetros já com a função em que o usuário estava.
--
-- Os usuários já cadastrados ficam com 'N' (a opção é nova).

alter table usuario add column ie_parametros_funcao text check (ie_parametros_funcao in ('S', 'N'));
update usuario set ie_parametros_funcao = 'N' where ie_parametros_funcao is null;
comment on column usuario.ie_parametros_funcao is 'S = opção "Parâmetros da Função" na pop-up do usuário.';
