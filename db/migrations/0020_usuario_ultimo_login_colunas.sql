-- Quasar: ajustes nas telas de registros.
--
--   * Administração do Sistema > Usuários: nova coluna "Último login" (usuario.dt_ultimo_login),
--     gravada só pelo servidor a cada login. Os usuários que já entraram recebem a data do
--     último login registrado em Logs > Acessos (log_acesso).
--   * A coluna Observação sai das telas de registros de Cursos, Disciplinas e Categoria
--     (Patrimônio): a informação continua no formulário (Ver).
--   * Turmas x Disciplinas: novas colunas Período letivo, Curso e Modalidade de ensino
--     (vindas da turma; não são colunas de turma_disciplina).
--
-- A ordem e a largura das colunas salvas por usuário (usuario_coluna) são guardadas por
-- posição: as configurações dessas listas são remapeadas para a personalização continuar
-- valendo. Configurações que não têm o tamanho esperado ficam como estão (a tela as ignora).

alter table usuario add column dt_ultimo_login timestamptz;

update usuario u
   set dt_ultimo_login = l.dt_login
  from (select nr_seq_usuario, max(dt_login) as dt_login from log_acesso group by nr_seq_usuario) l
 where l.nr_seq_usuario = u.nr_sequencia;

/* Remove a coluna lógica k (base 0) de uma configuração com total colunas. */
create function pg_temp.remover_coluna(cfg jsonb, k int, total int) returns jsonb
language plpgsql as $$
declare
  ordem int[];
  larguras jsonb;
begin
  if jsonb_typeof(cfg -> 'order') is distinct from 'array' then return cfg; end if;
  if jsonb_array_length(cfg -> 'order') <> total then return cfg; end if;
  select array_agg(case when x > k then x - 1 else x end order by i)
    into ordem
    from jsonb_array_elements_text(cfg -> 'order') with ordinality as o(v, i), lateral (select v::int as x) c
   where x <> k;
  if jsonb_typeof(cfg -> 'widths') = 'array' and (case when jsonb_typeof(cfg -> 'widths') = 'array' then jsonb_array_length(cfg -> 'widths') end) = total then
    larguras := (cfg -> 'widths') - k;
  else
    larguras := '[]'::jsonb;
  end if;
  return cfg || jsonb_build_object('order', to_jsonb(coalesce(ordem, '{}'::int[])), 'widths', larguras);
end $$;

/* Insere a coluna lógica k (base 0) logo depois da coluna k - 1 na ordem exibida. */
create function pg_temp.inserir_coluna(cfg jsonb, k int, total int) returns jsonb
language plpgsql as $$
declare
  ordem int[] := '{}';
  larguras jsonb;
  x int;
begin
  if jsonb_typeof(cfg -> 'order') is distinct from 'array' then return cfg; end if;
  if jsonb_array_length(cfg -> 'order') <> total then return cfg; end if;
  for x in select v::int from jsonb_array_elements_text(cfg -> 'order') with ordinality as o(v, i) order by i loop
    ordem := ordem || case when x >= k then x + 1 else x end;
    if x = k - 1 then ordem := ordem || k; end if;
  end loop;
  if jsonb_typeof(cfg -> 'widths') = 'array' and (case when jsonb_typeof(cfg -> 'widths') = 'array' then jsonb_array_length(cfg -> 'widths') end) = total then
    larguras := jsonb_insert(cfg -> 'widths', array[k::text], '0'::jsonb);
  else
    larguras := '[]'::jsonb;
  end if;
  return cfg || jsonb_build_object('order', to_jsonb(ordem), 'widths', larguras);
end $$;

-- Usuários: "Último login" entra depois de Status (posição 6 de 11).
update usuario_coluna set config_colunas = pg_temp.inserir_coluna(config_colunas, 6, 10)
 where ie_tabela = 'as_usuario';

-- Observação (posição 2) sai de Cursos (8 colunas), Disciplinas (7) e Categoria (8).
update usuario_coluna set config_colunas = pg_temp.remover_coluna(config_colunas, 2, 8)
 where ie_tabela = 'curso';
update usuario_coluna set config_colunas = pg_temp.remover_coluna(config_colunas, 2, 7)
 where ie_tabela = 'disciplina';
update usuario_coluna set config_colunas = pg_temp.remover_coluna(config_colunas, 2, 8)
 where ie_tabela = 'pat_categoria';

-- Turmas x Disciplinas: Período letivo, Curso e Modalidade de ensino depois de Disciplina.
update usuario_coluna set config_colunas = pg_temp.inserir_coluna(pg_temp.inserir_coluna(pg_temp.inserir_coluna(config_colunas, 3, 8), 4, 9), 5, 10)
 where ie_tabela = 'turma_disciplina';
