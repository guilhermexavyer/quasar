-- Quasar: Patrimônio > Ativos > Responsáveis — o responsável pode ser um colaborador OU uma
-- equipe (Pessoas e Relacionamentos > Equipes).
--
--   ativo_responsavel.nr_seq_equipe: a equipe responsável (o Colaborador fica vazio).
--
-- Cada responsável tem exatamente um dos dois. A regra vale para os registros novos e
-- alterados (NOT VALID: os existentes, todos com colaborador, não são reconferidos).
-- Equipe usada como responsável não pode ser excluída (on delete restrict), como o colaborador.

alter table ativo_responsavel
  add column nr_seq_equipe bigint references equipe (nr_sequencia) on delete restrict;

create index ativo_responsavel_nr_seq_equipe_idx on ativo_responsavel (nr_seq_equipe);

alter table ativo_responsavel
  add constraint ativo_responsavel_colaborador_ou_equipe_check
  check (num_nonnulls(nr_seq_colaborador, nr_seq_equipe) = 1) not valid;

comment on column ativo_responsavel.nr_seq_equipe is 'Equipe responsável pelo ativo (ou o colaborador: só um dos dois).';
