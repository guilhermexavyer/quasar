# Quasar

O Quasar é uma plataforma web de gestão empresarial/acadêmica. A ideia central do projeto é oferecer um sistema modular e orientado a dados: cada área do sistema é representada por coleções independentes no banco de dados, que se conectam entre si para compor a operação como um todo.

O sistema é pensado para ser altamente configurável pelo próprio usuário:

- **Configuração por perfil** — cada perfil de acesso define quais campos de cada formulário ficam habilitados, desabilitados ou obrigatórios, com permissões granulares por módulo e funcionalidade.
- **Trilha de auditoria** — criação e alteração de registros são registradas com data, hora e usuário, com histórico consultável.
- **Geração de relatórios** — o sistema inclui um construtor de relatórios que monta documentos a partir de coleções do banco, com estrutura definida por bandas, elementos e parâmetros, exportados em PDF.

O Quasar roda em ambiente local, com todo o estado gerenciado de forma centralizada.

## Como instalar

```bash
npm.cmd install                 # instala as dependências
cp db-homologacao.txt .env.local   # credenciais Firebase da homologação (base usada no dia a dia)
cp db-producao.txt .env.producao   # credenciais Firebase da produção (usadas só nos scripts)
npm.cmd run dev                 # inicia o servidor em http://localhost:3000
```

Para cadastrar imagens localmente, adicione no `.env.local` a linha `BLOB_READ_WRITE_TOKEN=...` (Vercel → projeto `quasar` → Storage → `quasar-blob` → aba `.env.local`).

Outro gerenciador de pacotes: troque `npm install` / `npm run dev` por `yarn` ou `pnpm`.

## Como publicar em produção

`homologacao` é a branch de trabalho; cada push em `producao` dispara o deploy na Vercel. Antes, deixe `git status` limpo e teste na homologação.

```bash
git checkout producao      # vai para a branch de produção
git pull                   # atualiza com o GitHub
git merge homologacao      # traz as mudanças da homologação
git push                   # envia e dispara o deploy
git checkout homologacao   # volta para a branch de trabalho
```

Em caso de conflito no merge: resolva os arquivos, rode `git add <arquivo>` e `git commit` antes do `git push`.

O merge publica só o código. Os dados e as imagens de cada base não são copiados.

## Copiar produção para homologação

Deixa a homologação idêntica à produção (Firestore e imagens). **Apaga tudo da homologação antes de copiar**; a produção só é lida. Requer `.env.producao` e `.env.local` (com `BLOB_READ_WRITE_TOKEN`) preenchidos.

```bash
npm.cmd run db:copiar-producao -- --dry-run                  # simula: mostra o que seria copiado e apagado
npm.cmd run db:copiar-producao -- --confirmar                # copia de verdade
npm.cmd run db:copiar-producao -- --confirmar --sem-imagens  # copia só o Firestore, sem mexer no Blob
```

- Antes de apagar, grava um backup dos dados em `backups/` (fora do Git). As imagens não entram no backup.
- As imagens ficam no Vercel Blob em `producao/images/` e `homologacao/images/`. O script apaga a segunda, copia a primeira para ela e atualiza `ie_arquivo` nos registros.
- Plano gratuito do Firebase: 50 mil leituras e 20 mil gravações por dia. Evite repetir a cópia várias vezes no mesmo dia.

## Migração: Categoria para Patrimônio

A Categoria saiu de Cadastros Gerais e foi para Patrimônio, e a coleção mudou de `cg_categoria_ativo` para `pat_categoria`. Rode a migração uma vez em cada base, **antes de publicar o código nela**. Sem a migração, a lista de categorias e os nomes de categoria nos ativos ficam vazios.

```bash
node --env-file=.env.producao scripts/migrar-categoria-patrimonio.mjs               # simula
node --env-file=.env.producao scripts/migrar-categoria-patrimonio.mjs --confirmar   # copia para pat_categoria
```

- Copia os documentos com os mesmos IDs, a auditoria, o contador, as colunas salvas dos usuários e o status dos campos nos perfis. Rodar de novo não duplica.
- As permissões dos perfis migram sozinhas quando o sistema abre: quem tinha acesso a "Categoria (ativo)" em Cadastros Gerais passa a ter a Categoria em Patrimônio, e quem não tinha continua sem.
- A coleção antiga continua no banco. Depois de conferir o sistema, apague-a com `--apagar-antiga --confirmar`.
- Para a homologação, use `--env-file=.env.local`. Ela já foi migrada (só a cópia).

## Começar do zero (apagar a base e recriar o básico)

**Apaga todos os dados do Firestore** da base escolhida e recria o mínimo para usar o sistema: o perfil `Administrador`, o usuário `administrador` (senha definida em `scripts/seed.mjs`) e os Cadastros Gerais de `scripts/dados/cadastros-gerais.json`. Rode na ordem.

Homologação (`.env.local`):

```bash
npm.cmd run db:limpar                     # simula: mostra o que seria apagado
npm.cmd run db:limpar -- --confirmar      # faz backup em backups/ e APAGA tudo
npm.cmd run seed                          # cria o perfil e o usuário administrador
npm.cmd run seed:cg                       # recria os Cadastros Gerais
```

Produção (`.env.producao`):

```bash
npm.cmd run db:limpar:producao                  # simula: mostra o que seria apagado
npm.cmd run db:limpar:producao -- --confirmar   # faz backup em backups/ e APAGA tudo
npm.cmd run seed:producao                       # cria o perfil e o usuário administrador
npm.cmd run seed:cg:producao                    # recria os Cadastros Gerais
```

- Os seeders aceitam `-- --dry-run` para simular. São idempotentes: não duplicam o administrador e pulam a coleção de Cadastros Gerais que já tiver registros.
- Os Cadastros Gerais mantêm o `nr_sequencia` original, e o contador de cada um continua a partir do maior.
- As imagens do Vercel Blob não são apagadas pelo `db:limpar`.
- Para atualizar `scripts/dados/cadastros-gerais.json` com os Cadastros Gerais atuais da produção: `npm.cmd run seed:cg:exportar`.
