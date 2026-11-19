-- Quasar: Estrutura Acadêmica.
--
-- O campo Máximo de alunos volta para Turmas (turma.qt_max_alunos) e sai de
-- Turmas x Disciplinas (turma_disciplina.qt_maxima_alunos), desfazendo a troca
-- feita na 0014. A regra de campo de Turmas x Disciplinas também sai dos perfis.

alter table turma
  add column if not exists qt_max_alunos integer check (qt_max_alunos is null or qt_max_alunos >= 0);

alter table turma_disciplina drop column if exists qt_maxima_alunos;

update perfil
   set config_campos = config_campos - 'turma_disciplina.qt_maxima_alunos'
 where jsonb_typeof(config_campos) = 'object' and config_campos ? 'turma_disciplina.qt_maxima_alunos';
