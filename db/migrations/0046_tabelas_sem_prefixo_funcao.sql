-- Quasar: as tabelas deixam de ter o prefixo da função no nome.
--
--   as_  Administração do Sistema   (as_param_redefinir_senha_primeiro_login → usuario_param_redefinir_senha_primeiro_login)
--   cc_  Controle de Cópias         (cc_param_cor_copia_aguardando → copia_param_cor_aguardando, ...)
--   cg_  Cadastros Gerais           (cg_sexo → sexo, cg_cargo → cargo, ...)
--   ea_  Estrutura Acadêmica        (ea_param_cor_periodo_letivo_andamento → periodo_letivo_param_cor_andamento, ...)
--   pat_ Patrimônio                 (pat_ativo → ativo, pat_manutencao → manutencao, ...)
--   pr_  Pessoas e Relacionamentos  (pr_param_matricula_aluno → aluno_param_matricula, ...)
--
-- Tabelas de parâmetros: <tabela>_param_<descrição resumida do parâmetro>, pela tabela a que o
-- parâmetro se refere (copia, periodo_letivo, ativo, manutencao, aluno, colaborador, usuario).
--
-- Administração do Sistema (no fim do arquivo):
--   regra     → regra_sistema   (tela "Regras do Sistema", antes "Sistema")
--   auditoria → log_auditoria
--   exclusao  → log_exclusao    (coluna ds_colecao → ds_tabela)
--
-- Nenhum nome novo coincide com uma tabela existente (conferido antes da migração e de novo
-- abaixo: se coincidir, a migração para sem alterar nada).
--
-- Renomear não mexe nos registros: dados, chaves estrangeiras, índices, permissões e RLS
-- acompanham a tabela. Também são renomeados, para seguir o nome novo:
--   - a sequência do nr_sequencia (<tabela>_nr_sequencia_seq);
--   - as restrições (pkey, fkey, check) e os índices que começam com o nome antigo.
--
-- Os dados que guardam o nome da tabela passam a usar o nome novo, para o histórico e as
-- configurações continuarem valendo: auditoria (ds_colecao e os detalhes), exclusões, imagens
-- (ds_colecao_dono), Campos x Formulários do perfil (chaves "tabela.coluna"), SQL dos
-- relatórios, colunas das listas do usuário, filtros salvos (inclusive os dos lookups,
-- lookup_<tabela>) etc. A troca é feita em todas as
-- colunas de texto/JSON, só no nome inteiro (cg_sexo vira sexo, mas cg_sexo_x não é tocado),
-- exceto migracao_esquema (nomes dos arquivos já aplicados), sessao e caminhos do Storage.

create temp table renomear_tabela (
  ds_antigo text primary key,
  ds_novo   text not null unique
) on commit drop;

insert into renomear_tabela (ds_antigo, ds_novo) values
  ('as_param_redefinir_senha_primeiro_login',        'usuario_param_redefinir_senha_primeiro_login'),
  ('cc_param_cor_copia_aguardando',                  'copia_param_cor_aguardando'),
  ('cc_param_cor_copia_cancelado',                   'copia_param_cor_cancelado'),
  ('cc_param_cor_copia_entregue',                    'copia_param_cor_entregue'),
  ('cc_param_cor_copia_impresso',                    'copia_param_cor_impresso'),
  ('cc_param_data_recebimento_automatica',           'copia_param_data_recebimento_automatica'),
  ('cc_param_formato_papel_padrao',                  'copia_param_formato_papel_padrao'),
  ('cc_param_tipo_papel_padrao',                     'copia_param_tipo_papel_padrao'),
  ('cc_param_tipos_arquivo_copia',                   'copia_param_tipos_arquivo'),
  ('cg_cargo',                                       'cargo'),
  ('cg_combustivel',                                 'combustivel'),
  ('cg_cor_raca',                                    'cor_raca'),
  ('cg_estado_civil',                                'estado_civil'),
  ('cg_formato_papel',                               'formato_papel'),
  ('cg_grau_parentesco',                             'grau_parentesco'),
  ('cg_localizacao',                                 'localizacao'),
  ('cg_logradouro',                                  'logradouro'),
  ('cg_marca',                                       'marca'),
  ('cg_modalidade_ensino',                           'modalidade_ensino'),
  ('cg_orgao_emissor',                               'orgao_emissor'),
  ('cg_profissao',                                   'profissao'),
  ('cg_sexo',                                        'sexo'),
  ('cg_sistema_operacional',                         'sistema_operacional'),
  ('cg_tipo_papel',                                  'tipo_papel'),
  ('cg_vinculo_contratual',                          'vinculo_contratual'),
  ('ea_param_cor_periodo_letivo_andamento',          'periodo_letivo_param_cor_andamento'),
  ('ea_param_cor_periodo_letivo_encerrado',          'periodo_letivo_param_cor_encerrado'),
  ('ea_param_encerramento_automatico_periodo_letivo','periodo_letivo_param_encerramento_automatico'),
  ('pat_ativo',                                      'ativo'),
  ('pat_ativo_responsavel',                          'ativo_responsavel'),
  ('pat_categoria',                                  'categoria'),
  ('pat_manutencao',                                 'manutencao'),
  ('pat_param_codigo_patrimonio',                    'ativo_param_codigo_patrimonio'),
  ('pat_param_cor_ativo_descartado',                 'ativo_param_cor_descartado'),
  ('pat_param_cor_ativo_estoque',                    'ativo_param_cor_estoque'),
  ('pat_param_cor_ativo_manutencao',                 'ativo_param_cor_manutencao'),
  ('pat_param_cor_ativo_operacional',                'ativo_param_cor_operacional'),
  ('pat_param_cor_manutencao_andamento',             'manutencao_param_cor_andamento'),
  ('pat_param_cor_manutencao_cancelada',             'manutencao_param_cor_cancelada'),
  ('pat_param_cor_manutencao_concluida',             'manutencao_param_cor_concluida'),
  ('pr_param_matricula_aluno',                       'aluno_param_matricula'),
  ('pr_param_matricula_colaborador',                 'colaborador_param_matricula');

do $$
declare
  r        record;
  o        record;
  col      record;
  v_prefixo text;
  v_seq     text;
  v_nome    text;
  v_padrao  text;
  v_n       bigint;
begin
  /* ── Conferências: toda tabela antiga existe e nenhum nome novo está ocupado ── */
  for r in select * from renomear_tabela loop
    if to_regclass(format('public.%I', r.ds_antigo)) is null then
      raise exception 'Tabela % não encontrada.', r.ds_antigo;
    end if;
    if exists (select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
                where n.nspname = 'public' and c.relname = r.ds_novo) then
      raise exception 'Já existe um objeto chamado % (destino de %).', r.ds_novo, r.ds_antigo;
    end if;
  end loop;

  /* ── Tabelas, sequências, restrições e índices ── */
  for r in select * from renomear_tabela order by ds_antigo loop
    v_prefixo := split_part(r.ds_antigo, '_', 1) || '_';
    v_seq := pg_get_serial_sequence(format('public.%I', r.ds_antigo), 'nr_sequencia');

    execute format('alter table public.%I rename to %I', r.ds_antigo, r.ds_novo);

    if v_seq is not null then
      execute format('alter sequence %s rename to %I', v_seq, r.ds_novo || '_nr_sequencia_seq');
    end if;

    -- Restrições (renomear a pkey renomeia também o índice dela).
    for o in select conname from pg_constraint
              where conrelid = format('public.%I', r.ds_novo)::regclass loop
      if left(o.conname, length(r.ds_antigo) + 1) = r.ds_antigo || '_' then
        v_nome := r.ds_novo || substr(o.conname, length(r.ds_antigo) + 1);
      elsif o.conname like '%\_nr\_sequencia\_check' then
        -- Nome truncado ou copiado de outra tabela (ex.: as cores de Cópias).
        v_nome := r.ds_novo || '_nr_sequencia_check';
      elsif left(o.conname, length(v_prefixo)) = v_prefixo then
        v_nome := substr(o.conname, length(v_prefixo) + 1);
      else
        continue;
      end if;
      if length(v_nome) > 63 then
        v_nome := substr(o.conname, length(v_prefixo) + 1);
      end if;
      execute format('alter table public.%I rename constraint %I to %I', r.ds_novo, o.conname, v_nome);
    end loop;

    -- Índices que não pertencem a uma restrição.
    for o in select ci.relname from pg_index i join pg_class ci on ci.oid = i.indexrelid
              where i.indrelid = format('public.%I', r.ds_novo)::regclass
                and not exists (select 1 from pg_constraint k where k.conindid = i.indexrelid) loop
      if left(o.relname, length(r.ds_antigo) + 1) = r.ds_antigo || '_' then
        v_nome := r.ds_novo || substr(o.relname, length(r.ds_antigo) + 1);
      elsif left(o.relname, length(v_prefixo)) = v_prefixo then
        v_nome := substr(o.relname, length(v_prefixo) + 1);
      else
        continue;
      end if;
      execute format('alter index public.%I rename to %I', o.relname, v_nome);
    end loop;
  end loop;

  /* ── Dados que guardam o nome da tabela ── */
  select '\m(' || string_agg(ds_antigo, '|') || ')\M' into v_padrao from renomear_tabela;

  for col in
    select c.table_name, c.column_name, c.data_type
      from information_schema.columns c
      join information_schema.tables t on t.table_schema = c.table_schema and t.table_name = c.table_name
     where c.table_schema = 'public'
       and t.table_type = 'BASE TABLE'
       and c.data_type in ('text', 'character varying', 'json', 'jsonb')
       and c.table_name not in ('migracao_esquema', 'sessao')
       and c.column_name <> 'ds_caminho_storage'
  loop
    execute format('select count(*) from public.%I where %I::text ~ %L', col.table_name, col.column_name, v_padrao) into v_n;
    continue when v_n = 0;
    for r in select * from renomear_tabela loop
      execute format(
        'update public.%1$I set %2$I = regexp_replace(%2$I::text, %3$L, %4$L, ''g'')::%5$s where %2$I::text ~ %3$L',
        col.table_name, col.column_name, '\m' || r.ds_antigo || '\M', r.ds_novo,
        case col.data_type when 'character varying' then 'varchar' else col.data_type end
      );
    end loop;
  end loop;

  -- Filtro salvo dos lookups (ie_tela lookup_<tabela>): o nome vem colado em "lookup_".
  update usuario_filtro f set ie_tela = 'lookup_' || r2.ds_novo
    from renomear_tabela r2 where f.ie_tela = 'lookup_' || r2.ds_antigo;
end
$$;

/* ── Administração do Sistema: Regras do Sistema e logs ──
   "regra", "auditoria" e "exclusao" são palavras comuns (ie_regra_N, a coluna regra da
   auditoria, textos), então os dados não passam pela troca geral acima: só as colunas que
   guardam o nome da tabela e o SQL dos relatórios (depois de from/join/into/update). */

alter table regra rename to regra_sistema;
alter table regra_sistema rename constraint regra_pkey to regra_sistema_pkey;
alter table regra_sistema rename constraint regra_nr_sequencia_check to regra_sistema_nr_sequencia_check;

alter table auditoria rename to log_auditoria;
alter table log_auditoria rename constraint auditoria_pkey to log_auditoria_pkey;
alter table log_auditoria rename constraint auditoria_acao_check to log_auditoria_acao_check;
alter index auditoria_registro_idx rename to log_auditoria_registro_idx;

alter table exclusao rename to log_exclusao;
alter table log_exclusao rename column ds_colecao to ds_tabela;
alter table log_exclusao rename constraint exclusao_pkey to log_exclusao_pkey;
alter index exclusao_ds_colecao_idx rename to log_exclusao_ds_tabela_idx;

do $$
declare
  t text;
  v_seq text;
begin
  foreach t in array array['regra_sistema', 'log_auditoria', 'log_exclusao'] loop
    v_seq := pg_get_serial_sequence(format('public.%I', t), 'nr_sequencia');
    if v_seq is not null then
      execute format('alter sequence %s rename to %I', v_seq, t || '_nr_sequencia_seq');
    end if;
  end loop;
end
$$;

create temp table renomear_tabela_sistema (
  ds_antigo text primary key,
  ds_novo   text not null
) on commit drop;
insert into renomear_tabela_sistema values
  ('regra', 'regra_sistema'), ('auditoria', 'log_auditoria'), ('exclusao', 'log_exclusao');

update log_auditoria a set ds_colecao = r.ds_novo from renomear_tabela_sistema r where a.ds_colecao = r.ds_antigo;
update log_exclusao e set ds_tabela = r.ds_novo from renomear_tabela_sistema r where e.ds_tabela = r.ds_antigo;
update imagem i set ds_colecao_dono = r.ds_novo from renomear_tabela_sistema r where i.ds_colecao_dono = r.ds_antigo;

do $$
declare
  r record;
  v_padrao text;
begin
  for r in select * from renomear_tabela_sistema loop
    v_padrao := '\m(from|join|into|update)(\s+)' || r.ds_antigo || '\M';
    update relatorio set ds_sql = regexp_replace(ds_sql, v_padrao, '\1\2' || r.ds_novo, 'gi') where ds_sql ~* v_padrao;
    update relatorio_banda set ds_sql = regexp_replace(ds_sql, v_padrao, '\1\2' || r.ds_novo, 'gi') where ds_sql ~* v_padrao;
  end loop;
end
$$;
