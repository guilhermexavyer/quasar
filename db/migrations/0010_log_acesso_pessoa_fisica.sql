-- Quasar: Logs > Acessos filtra pela pessoa física escolhida no lookup.
-- log_acesso passa a guardar também a sequência da pessoa física do usuário no
-- login (sem FK: é histórico). Os registros já gravados recebem a do usuário.

alter table log_acesso add column nr_seq_pessoa_fisica bigint;

update log_acesso l
   set nr_seq_pessoa_fisica = u.nr_seq_pessoa_fisica
  from usuario u
 where u.nr_sequencia = l.nr_seq_usuario
   and l.nr_seq_pessoa_fisica is null;

create index log_acesso_nr_seq_pessoa_fisica_idx on log_acesso (nr_seq_pessoa_fisica);
