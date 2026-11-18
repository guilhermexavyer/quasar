-- Quasar: CPF e telefone gravados só com números; DDD em coluna própria.
--
--   pessoa_fisica.nr_cpf        → 11 dígitos (sem pontos e hífen);
--   pessoa_fisica.nr_ddd        → nova: 2 dígitos do DDD;
--   pessoa_fisica.nr_telefone   → 8 ou 9 dígitos, sem o DDD (sem parênteses, espaço e hífen);
--   pessoa_juridica.nr_ddd / nr_telefone → igual à pessoa física.
--
-- A tela continua com um único campo "Telefone" ((11) 98765-4321) e com a
-- máscara do CPF: o servidor separa o DDD ao gravar e junta de novo ao ler.
--
-- Nenhuma informação se perde: os valores atuais são convertidos (só os
-- números ficam). Se algum valor não tiver um formato reconhecível — CPF que
-- não tenha 11 dígitos, telefone que não tenha 10 ou 11 dígitos (DDD + número)
-- —, a migração PARA com erro, a transação é desfeita e nada muda.

do $$
declare
  cpf_invalido integer;
  tel_pf_invalido integer;
  tel_pj_invalido integer;
begin
  select count(*) into cpf_invalido from pessoa_fisica
   where nullif(btrim(nr_cpf), '') is not null and length(regexp_replace(nr_cpf, '\D', '', 'g')) <> 11;
  select count(*) into tel_pf_invalido from pessoa_fisica
   where nullif(btrim(nr_telefone), '') is not null and length(regexp_replace(nr_telefone, '\D', '', 'g')) not in (10, 11);
  select count(*) into tel_pj_invalido from pessoa_juridica
   where nullif(btrim(nr_telefone), '') is not null and length(regexp_replace(nr_telefone, '\D', '', 'g')) not in (10, 11);
  if cpf_invalido + tel_pf_invalido + tel_pj_invalido > 0 then
    raise exception 'Valores fora do formato: % CPF(s) sem 11 dígitos, % telefone(s) de pessoa física e % de pessoa jurídica sem DDD + número (10 ou 11 dígitos). Corrija antes de migrar.',
      cpf_invalido, tel_pf_invalido, tel_pj_invalido;
  end if;
end $$;

-- CPF: só os números (vazio vira nulo).
update pessoa_fisica set nr_cpf = nullif(regexp_replace(coalesce(nr_cpf, ''), '\D', '', 'g'), '')
 where nr_cpf is distinct from nullif(regexp_replace(coalesce(nr_cpf, ''), '\D', '', 'g'), '');

-- Telefone: DDD (2 primeiros dígitos) na coluna nova, o restante em nr_telefone.
alter table pessoa_fisica add column nr_ddd text;
alter table pessoa_juridica add column nr_ddd text;

update pessoa_fisica
   set nr_ddd = left(regexp_replace(nr_telefone, '\D', '', 'g'), 2),
       nr_telefone = substr(regexp_replace(nr_telefone, '\D', '', 'g'), 3)
 where nullif(btrim(nr_telefone), '') is not null;
update pessoa_fisica set nr_telefone = null where nr_telefone is not null and btrim(nr_telefone) = '';

update pessoa_juridica
   set nr_ddd = left(regexp_replace(nr_telefone, '\D', '', 'g'), 2),
       nr_telefone = substr(regexp_replace(nr_telefone, '\D', '', 'g'), 3)
 where nullif(btrim(nr_telefone), '') is not null;
update pessoa_juridica set nr_telefone = null where nr_telefone is not null and btrim(nr_telefone) = '';

-- Daqui em diante o banco só aceita números nesses campos.
alter table pessoa_fisica
  add constraint pessoa_fisica_nr_cpf_digitos check (nr_cpf ~ '^\d{11}$'),
  add constraint pessoa_fisica_nr_ddd_digitos check (nr_ddd ~ '^\d{2}$'),
  add constraint pessoa_fisica_nr_telefone_digitos check (nr_telefone ~ '^\d{8,9}$'),
  add constraint pessoa_fisica_telefone_com_ddd check ((nr_ddd is null) = (nr_telefone is null));

alter table pessoa_juridica
  add constraint pessoa_juridica_nr_ddd_digitos check (nr_ddd ~ '^\d{2}$'),
  add constraint pessoa_juridica_nr_telefone_digitos check (nr_telefone ~ '^\d{8,9}$'),
  add constraint pessoa_juridica_telefone_com_ddd check ((nr_ddd is null) = (nr_telefone is null));
