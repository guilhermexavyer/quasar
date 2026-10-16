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
