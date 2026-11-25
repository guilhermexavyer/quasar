-- Quasar: Gerenciador de Relatórios — cores de fundo na banda Detalhe.
--
-- Banda (relatorio_banda):
--   * cd_background_registro  Cor de fundo de todos os registros, na largura da banda.
--                             Com cor, o Alternar background deixa de valer (fica 'N').
--   * cd_background_label     Cor de fundo da linha dos labels (Exibir labels), na
--                             largura da banda. Antes vinha do Background do elemento de
--                             menor Sequência: o valor passa para a banda e sai do elemento
--                             (o Background do elemento volta a valer só para o label dele).

alter table relatorio_banda
  add column cd_background_registro text,
  add column cd_background_label text;
comment on column relatorio_banda.cd_background_registro is 'Cor de fundo dos registros da banda Detalhe (vazio = transparente ou Alternar background).';
comment on column relatorio_banda.cd_background_label is 'Cor de fundo da linha dos labels da banda Detalhe (vazio = transparente).';

-- Banda Detalhe com Exibir labels: o Background do elemento de menor Sequência passa a ser
-- o da linha dos labels.
with primeiro as (
  select distinct on (e.nr_seq_banda) e.nr_seq_banda, e.nr_sequencia, e.cd_background
  from relatorio_banda_elemento e
  order by e.nr_seq_banda, e.nr_sequencia
)
update relatorio_banda b
set cd_background_label = p.cd_background
from primeiro p
where p.nr_seq_banda = b.nr_sequencia
  and coalesce(b.ie_tipo, 'detalhe') = 'detalhe'
  and b.ie_exibir_label = 'S'
  and nullif(trim(p.cd_background), '') is not null;

update relatorio_banda_elemento e
set cd_background = null
from relatorio_banda b
where e.nr_seq_banda = b.nr_sequencia
  and b.cd_background_label is not null
  and e.nr_sequencia = (select min(x.nr_sequencia) from relatorio_banda_elemento x where x.nr_seq_banda = e.nr_seq_banda);
