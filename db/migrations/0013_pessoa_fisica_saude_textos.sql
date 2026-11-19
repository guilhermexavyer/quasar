-- Aba Saúde (duplo clique em Pessoas Físicas): Alergia, Medicamento de uso contínuo,
-- Restrição alimentar e Necessidade especial deixam de ser listas e passam a ser um
-- texto livre (textarea). Os valores já gravados viram uma linha cada.

alter table public.pessoa_fisica_saude
  alter column ds_alergia type text
    using nullif(array_to_string(array_remove(ds_alergia, ''), E'\n'), ''),
  alter column ds_medicamento_continuo type text
    using nullif(array_to_string(array_remove(ds_medicamento_continuo, ''), E'\n'), ''),
  alter column ds_restricao_alimentar type text
    using nullif(array_to_string(array_remove(ds_restricao_alimentar, ''), E'\n'), ''),
  alter column ds_necessidade_especial type text
    using nullif(array_to_string(array_remove(ds_necessidade_especial, ''), E'\n'), '');
