-- Quasar: Administração do Sistema > Parâmetros > Administração do Sistema —
-- "Redefinir senha no primeiro login após alterar senha".
--
-- A tabela do parâmetro passa a ter o nome dele:
--   as_param_alterar_senha_proximo_login → as_param_redefinir_senha_primeiro_login
-- (com a sequência, a chave primária e a restrição de registro único). A auditoria,
-- as exclusões e as imagens guardam o nome da tabela em ds_colecao/ds_colecao_dono
-- e passam a usar o nome novo, para o histórico continuar aparecendo.

alter table as_param_alterar_senha_proximo_login rename to as_param_redefinir_senha_primeiro_login;
alter sequence as_param_alterar_senha_proximo_login_nr_sequencia_seq rename to as_param_redefinir_senha_primeiro_login_nr_sequencia_seq;
alter table as_param_redefinir_senha_primeiro_login rename constraint as_param_alterar_senha_proximo_login_pkey to as_param_redefinir_senha_primeiro_login_pkey;
alter table as_param_redefinir_senha_primeiro_login rename constraint as_param_alterar_senha_proximo_login_nr_sequencia_check to as_param_redefinir_senha_primeiro_login_nr_sequencia_check;

update auditoria set ds_colecao = 'as_param_redefinir_senha_primeiro_login' where ds_colecao = 'as_param_alterar_senha_proximo_login';
update exclusao  set ds_colecao = 'as_param_redefinir_senha_primeiro_login' where ds_colecao = 'as_param_alterar_senha_proximo_login';
update imagem    set ds_colecao_dono = 'as_param_redefinir_senha_primeiro_login' where ds_colecao_dono = 'as_param_alterar_senha_proximo_login';
