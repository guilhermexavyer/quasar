# Quasar

O Quasar é uma plataforma web de gestão empresarial/acadêmica. A ideia central do projeto é oferecer um sistema modular e orientado a dados: cada área do sistema é representada por tabelas independentes no banco de dados, que se conectam entre si para compor a operação como um todo.

O sistema é pensado para ser altamente configurável pelo próprio usuário:

- **Configuração por perfil** — cada perfil de acesso define quais campos de cada formulário ficam habilitados, desabilitados ou obrigatórios, com permissões granulares por módulo e funcionalidade.
- **Trilha de auditoria** — criação e alteração de registros são registradas com data, hora e usuário, com histórico consultável.
- **Geração de relatórios** — o sistema inclui um construtor de relatórios que monta documentos a partir das tabelas do banco, com estrutura definida por bandas, elementos e parâmetros, exportados em PDF.

## Arquitetura

- **Next.js** (tela e rotas `/api`). O navegador nunca acessa o banco: tudo passa pelas rotas `/api`, que exigem login.
- **PostgreSQL na Supabase**, acessado só pelo servidor com o driver `pg` (Transaction Pooler, SSL verificado com `db/supabase-ca.crt`). O Data API da Supabase fica sem acesso às tabelas.
- **Supabase Storage** (bucket privado `imagens`) para as imagens, entregues pela rota `/api/imagens/arquivo/...`.
- Cada ambiente é um projeto Supabase: **homologação** (`quasar-homologacao`) e **produção**.
- Esquema em `db/migrations/*.sql`, aplicado em ordem pelo `db:migrar`.

## Como instalar

```bash
npm.cmd install                       # instala as dependências
copy db-homologacao.txt .env.local   # credenciais da homologação (veja abaixo)
copy db-producao.txt .env.producao   # credenciais da produção (veja abaixo)
npm.cmd run db:testar                 # confere a conexão com o banco
npm.cmd run dev                       # inicia o servidor em http://localhost:3000
```

**Credenciais (`db-homologacao.txt` e `db-producao.txt`).** Esses dois arquivos têm as senhas e as chaves secretas, por isso **não vêm com o repositório** (o `.gitignore` bloqueia `db*.txt`). Guarde uma cópia deles fora do Git (gerenciador de senhas, pendrive, pasta pessoal) e, depois de clonar, coloque-os na raiz do projeto antes de rodar os `copy` acima. Se não tiver os arquivos, use os modelos: `copy .env.local.example .env.local` e `copy .env.producao.example .env.producao`, e preencha pelo Supabase.

Variáveis (Supabase → projeto → **Connect** e **Project Settings → API Keys**):

| Variável | Uso |
|---|---|
| `DATABASE_URL` | Transaction Pooler (porta 6543), terminando em `?sslmode=require`. Usada pelo sistema. |
| `DATABASE_URL_MIGRACAO` | Session Pooler (porta 5432), terminando em `?sslmode=require`. Só para os scripts. |
| `SUPABASE_URL` | URL do projeto. |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave `service_role` (só servidor; acesso ao Storage). |

Nenhuma delas pode ter o prefixo `NEXT_PUBLIC_`. Os arquivos `.env*` e `db*.txt` nunca vão para o Git (só os modelos `.env.local.example` e `.env.producao.example`, sempre sem valores).

| Arquivo | Projeto Supabase | Usado por |
|---|---|---|
| `.env.local` | homologação (`quasar-homologacao`) | o sistema local e os comandos sem `:producao` |
| `.env.producao` | produção | os comandos `:producao` e `db:copiar-producao` (é a origem da cópia) |

Sem o `.env.producao` preenchido, os comandos de produção e a cópia produção → homologação não encontram a conexão.

## Banco de dados

```bash
npm.cmd run db:migrar                       # mostra as migrações pendentes
npm.cmd run db:migrar -- --simular          # executa e desfaz (valida o SQL no banco)
npm.cmd run db:migrar -- --confirmar        # aplica as migrações pendentes
npm.cmd run db:auditar-rodapes              # confere rodapés x auditoria (só leitura)
```

- Mudança de esquema = novo arquivo `db/migrations/000N_descricao.sql`. Nunca altere uma migração já aplicada.
- Aplique a migração **antes** de publicar o código que depende dela.
- Use `:producao` no fim do comando para rodar na produção (ex.: `db:migrar:producao`).

## Como publicar

Branches: `desenvolvimento` → `homologacao` → `producao`. Trabalhe só em `desenvolvimento`; as outras duas recebem as mudanças apenas por merge.

| Branch | Publica em |
|---|---|
| `desenvolvimento` | nada fixo (só um deploy de teste da Vercel) |
| `homologacao` | **quasar-cbc-homol.vercel.app** (Vercel, ambiente Preview) |
| `producao` | **quasar-cbc.vercel.app** (Production) |

O desenvolvimento local (`.env.local`) usa o **mesmo banco da homologação**.

Antes de publicar, deixe `git status` limpo (tudo commitado em `desenvolvimento`).

**1. Homologação**

```bash
npm.cmd run db:migrar -- --confirmar            # migrações pendentes na homologação (se houver)
git checkout homologacao                        # vai para a branch de homologação
git pull                                        # atualiza com o GitHub
git merge desenvolvimento                       # traz as mudanças do desenvolvimento
git push                                        # envia e dispara o deploy
git checkout desenvolvimento                    # volta para a branch de trabalho
```

**2. Produção** (depois de testar na homologação)

```bash
npm.cmd run db:migrar:producao -- --confirmar   # migrações pendentes na produção (se houver)
git checkout producao                           # vai para a branch de produção
git pull                                        # atualiza com o GitHub
git merge homologacao                           # traz as mudanças da homologação
git push                                        # envia e dispara o deploy
git checkout desenvolvimento                    # volta para a branch de trabalho
```

Em caso de conflito no merge: resolva os arquivos, rode `git add <arquivo>` e `git commit` antes do `git push`.

O merge publica só o código. Os dados e as imagens de cada base não são copiados.

**Primeira publicação em produção** (uma vez): criar o projeto Supabase de produção; criar o bucket privado `imagens`; preencher `.env.producao`; rodar `db:migrar:producao -- --confirmar`, `seed:producao` e `seed:cg:producao`; cadastrar no Vercel, ambiente **Production**, as variáveis `DATABASE_URL`, `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` da produção (as de homologação ficam só em **Preview**).

## Copiar produção para homologação

Deixa a homologação idêntica à produção (banco e imagens). **Apaga tudo da homologação antes de copiar**; a produção só é lida. Requer `.env.producao` e `.env.local` preenchidos.

```bash
npm.cmd run db:copiar-producao                                 # simula: mostra o que seria copiado
npm.cmd run db:copiar-producao -- --confirmar                  # copia de verdade
npm.cmd run db:copiar-producao -- --confirmar --sem-imagens    # copia só o banco
```

- A cópia das imagens usa a `SUPABASE_SERVICE_ROLE_KEY` dos dois arquivos (chave secreta: `sb_secret_...` ou `service_role`). O comando confere as chaves antes de começar; com `--sem-imagens` elas não são usadas.
- Antes de apagar, grava um backup da homologação em `backups/` (fora do Git).
- Copia tabela por tabela numa transação e confere as contagens; qualquer diferença desfaz a cópia.
- As sessões de login da homologação são encerradas (é preciso entrar de novo).

## Começar do zero (apagar a base e recriar o básico)

**Apaga todos os registros** da base escolhida (o esquema fica) e recria o mínimo para usar o sistema: o perfil `Administrador`, o usuário `administrador` (senha definida em `scripts/seed.mjs`; troque no primeiro acesso) e os Cadastros Gerais de `scripts/dados/cadastros-gerais.json`. Rode na ordem.

Homologação (`.env.local`):

```bash
npm.cmd run db:limpar                     # simula: mostra o que seria apagado
npm.cmd run db:limpar -- --confirmar      # faz backup em backups/ e APAGA tudo
npm.cmd run seed                          # cria o perfil e o usuário administrador
npm.cmd run seed:cg                       # recria os Cadastros Gerais
```

Produção (`.env.producao`): os mesmos comandos com `:producao` (`db:limpar:producao`, `seed:producao`, `seed:cg:producao`).

- Os seeders aceitam `-- --dry-run` para simular. São idempotentes: não duplicam o administrador e pulam a tabela de Cadastros Gerais que já tiver registros.
- As imagens do Storage só são apagadas com `db:limpar -- --confirmar --com-imagens`.
- O usuário `administrador` e o perfil `Administrador` são o acesso padrão: ninguém pode alterá-los nem excluí-los pela tela (só "Ver"). O administrador troca a própria senha pelo menu do usuário.
