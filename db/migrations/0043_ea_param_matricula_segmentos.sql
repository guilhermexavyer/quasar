-- Quasar: Estrutura Acadêmica > Parâmetros — "Geração da matrícula de alunos" e
-- "Geração da matrícula de colaboradores".
--
-- A regra deixa de ser uma string única (ds_regra, ex.: "ano_atual-hifen-sequencial")
-- e passa a ter 10 segmentos fixos, cada um em duas colunas:
--   * ie_regra_N  tipo do segmento (N = 1 a 10; vazio = segmento ignorado);
--   * ds_regra_N  o texto (tipo Texto) ou a quantidade de dígitos, com zeros à esquerda
--                 (Sequência do cadastro e Sequencial; vazio = sem zeros).
--
-- Opções do tipo, revistas (as que o Texto já cobre saíram):
--   ano_atual, ano_atual_2, mes_atual, dia_atual, sequencia, sequencial,
--   sequencial_ano, sequencial_mes, texto.
-- A regra salva é convertida sem mudar a matrícula gerada:
--   * símbolos (hífen, ponto, dois pontos, parênteses, colchetes, chaves) → Texto com o símbolo;
--   * Sequência (dígitos) / Sequencial (dígitos) → Sequência / Sequencial com os dígitos em ds_regra_N;
--   * Data atual (com ou sem ano de 2 dígitos e máscara) → Dia atual + Mês atual + Ano atual
--     (com Texto "/" entre eles na máscara);
--   * Textos seguidos viram um Texto só.
-- As colunas ds_regra, ie_regra e cd_cor (sem uso nessas duas tabelas) saem.

do $$
declare
  tabela text;
  i int;
  regra text;
  parte text;
  p text;
  tipos text[];
  textos text[];
  novo_tipo text[];
  novo_texto text[];
  n int;
  sql_set text;
begin
  foreach tabela in array array['ea_param_matricula_aluno', 'ea_param_matricula_colaborador'] loop
    for i in 1..10 loop
      execute format(
        'alter table %I add column ie_regra_%s text check (ie_regra_%s in (''ano_atual'', ''ano_atual_2'', ''mes_atual'', ''dia_atual'', ''sequencia'', ''sequencial'', ''sequencial_ano'', ''sequencial_mes'', ''texto'')), add column ds_regra_%s text',
        tabela, i, i, i);
      execute format('comment on column %I.ie_regra_%s is %L', tabela, i, 'Tipo do segmento ' || i || ' da regra de geração da matrícula (vazio = ignorado).');
      execute format('comment on column %I.ds_regra_%s is %L', tabela, i, 'Texto do segmento ' || i || ' (tipo Texto) ou quantidade de dígitos (Sequência/Sequencial).');
    end loop;

    execute format('select ds_regra from %I where nr_sequencia = 1', tabela) into regra;
    if regra is not null and btrim(regra) <> '' then
      tipos := array[]::text[];
      textos := array[]::text[];
      foreach parte in array string_to_array(regra, '-') loop
        if btrim(parte) = '' then continue; end if;
        p := lower(parte);
        if p like 'texto:%' then
          tipos := tipos || 'texto'::text; textos := textos || substr(parte, 7);
        elsif p in ('hifen', 'ponto', 'dois_pontos', 'parentese_esquerdo', 'parentese_direito',
                    'colchete_esquerdo', 'colchete_direito', 'chave_esquerda', 'chave_direita') then
          tipos := tipos || 'texto'::text;
          textos := textos || (case p when 'hifen' then '-' when 'ponto' then '.' when 'dois_pontos' then ':'
            when 'parentese_esquerdo' then '(' when 'parentese_direito' then ')'
            when 'colchete_esquerdo' then '[' when 'colchete_direito' then ']'
            when 'chave_esquerda' then '{' else '}' end);
        elsif p like 'sequencial_digitos%' then
          tipos := tipos || 'sequencial'::text; textos := textos || nullif(split_part(parte, ':', 2), '');
        elsif p like 'sequencia_digitos%' then
          tipos := tipos || 'sequencia'::text; textos := textos || nullif(split_part(parte, ':', 2), '');
        elsif p in ('data_atual', 'data_atual_2digitos') then
          tipos := tipos || array['dia_atual', 'mes_atual', case p when 'data_atual' then 'ano_atual' else 'ano_atual_2' end];
          textos := textos || array[null, null, null]::text[];
        elsif p in ('data_atual_mascara', 'data_atual_2digitos_mascara') then
          tipos := tipos || array['dia_atual', 'texto', 'mes_atual', 'texto', case p when 'data_atual_mascara' then 'ano_atual' else 'ano_atual_2' end];
          textos := textos || array[null, '/', null, '/', null]::text[];
        elsif p in ('ano_atual', 'ano_atual_2', 'mes_atual', 'dia_atual', 'sequencia', 'sequencial', 'sequencial_ano', 'sequencial_mes') then
          tipos := tipos || p; textos := textos || null::text;
        else
          -- Valor desconhecido: a geração antiga o inseria como texto.
          tipos := tipos || 'texto'::text; textos := textos || parte;
        end if;
      end loop;

      -- Textos seguidos viram um só.
      novo_tipo := array[]::text[];
      novo_texto := array[]::text[];
      for i in 1..coalesce(array_length(tipos, 1), 0) loop
        n := coalesce(array_length(novo_tipo, 1), 0);
        if tipos[i] = 'texto' and n > 0 and novo_tipo[n] = 'texto' then
          novo_texto[n] := novo_texto[n] || textos[i];
        else
          novo_tipo := novo_tipo || tipos[i];
          novo_texto := novo_texto || textos[i];
        end if;
      end loop;

      n := coalesce(array_length(novo_tipo, 1), 0);
      if n > 10 then
        raise exception 'A regra de % tem % segmentos depois da conversão (máximo 10): %', tabela, n, regra;
      end if;
      for i in 1..n loop
        sql_set := format('update %I set ie_regra_%s = %L, ds_regra_%s = %L where nr_sequencia = 1',
          tabela, i, novo_tipo[i], i, novo_texto[i]);
        execute sql_set;
      end loop;
    end if;

    execute format('alter table %I drop column ds_regra, drop column ie_regra, drop column cd_cor', tabela);
  end loop;
end $$;
