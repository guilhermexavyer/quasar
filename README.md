# Quasar

O Quasar é uma plataforma web de gestão empresarial/acadêmica. A ideia central do projeto é oferecer um sistema modular e orientado a dados: cada área do sistema é representada por coleções independentes no banco de dados, que se conectam entre si para compor a operação como um todo.

O sistema é pensado para ser altamente configurável pelo próprio usuário:

- **Configuração por perfil** — cada perfil de acesso define quais campos de cada formulário ficam habilitados, desabilitados ou obrigatórios, com permissões granulares por módulo e funcionalidade.
- **Trilha de auditoria** — criação e alteração de registros são registradas com data, hora e usuário, com histórico consultável.
- **Geração de relatórios** — o sistema inclui um construtor de relatórios que monta documentos a partir de coleções do banco, com estrutura definida por bandas, elementos e parâmetros, exportados em PDF.

O Quasar roda em ambiente local, com todo o estado gerenciado de forma centralizada.

## Como instalar

1. Clone o repositório ou baixe os arquivos do projeto.
2. Abra o terminal na pasta do projeto.
3. Instale as dependências:

```bash
npm.cmd install
```

4. Configure as credenciais do Firebase com os seguintes comandos:

```
cp db-homologacao.txt .env.local
```
```
cp db-producao.txt .env.producao
```

5. Inicie o servidor de desenvolvimento:

```bash
npm.cmd run dev
```

6. Abra o navegador em:

```bash
http://localhost:3000
```

## Observação

Se você usar outro gerenciador de pacotes, substitua `npm install` por `yarn install` ou `pnpm install`, e `npm run dev` por `yarn dev` ou `pnpm dev`.

## Como publicar em produção (merge de `homologacao` para `producao`)

O desenvolvimento é feito na branch `homologacao`. A branch `producao` é a que vai para o ambiente de produção: cada `push` nela dispara o deploy na Vercel.

Antes de começar, confira se todas as alterações de `homologacao` já foram commitadas e enviadas (`git status` deve mostrar a árvore limpa) e se foram testadas em homologação.

```bash
git checkout producao          # vai para a branch de produção
git pull                       # garante que está igual ao GitHub
git merge homologacao          # traz as mudanças de homologação
git push                       # envia para o GitHub e dispara o deploy na Vercel
git checkout homologacao       # volta para a branch de trabalho do dia a dia
```

Se `producao` tiver commits que `homologacao` não tem (por exemplo, uma correção urgente feita direto em produção), o `git merge` cria um commit de merge e pode apontar conflitos. Nesse caso, resolva os arquivos indicados, marque-os como resolvidos com `git add <arquivo>` e conclua com `git commit` antes do `git push`.

> **Atenção:** o banco de produção é separado do de homologação. O merge publica apenas o código; os dados não são copiados.

## Copiar produção para homologação

Use quando quiser testar na homologação com os mesmos dados da produção (por exemplo, para reproduzir um problema relatado por um usuário). O script copia todas as coleções do sistema, incluindo `_counters`, os cadastros gerais (`cg_*`) e o histórico de auditoria de cada registro, mantendo os mesmos IDs.

> **Atenção:**
> - **Todos os dados da homologação são apagados** e substituídos pelos da produção. Ao final, a homologação fica idêntica à produção: nada do que existia só na homologação é mantido. Antes de apagar, o script grava um backup da homologação em `backups/` (pasta fora do Git).
> - São copiados dados pessoais reais (inclusive de alunos) e os hashes de senha dos usuários: as senhas da produção passam a valer na homologação.
> - A produção nunca é alterada. O script só grava se o destino for o projeto de homologação (`quasar-c3c81`).

### Pré-requisitos

- `.env.producao` preenchido com as credenciais da produção (origem).
- `.env.local` preenchido com as credenciais da homologação (destino).
- `BLOB_READ_WRITE_TOKEN` no `.env.local`, para copiar as imagens (veja "Imagens no Vercel Blob" abaixo). Copie o valor em Vercel → projeto `quasar` → **Storage** → `quasar-blob` → aba **.env.local** (ou rode `vercel env pull .env.local`). Sem o token, use `--sem-imagens`.

Os dois arquivos ficam na raiz do projeto e não vão para o Git.

### Passo 1 — Simular

```bash
npm.cmd run db:copiar-producao -- --dry-run
```

Mostra a quantidade de documentos por coleção que será copiada da produção e quantos documentos existem hoje na homologação (e serão apagados), além da quantidade de imagens em cada pasta do Blob, sem apagar nem gravar nada.

### Passo 2 — Copiar

```bash
npm.cmd run db:copiar-producao -- --confirmar
```

O script faz, nesta ordem: backup da homologação em `backups/`, limpeza de toda a homologação, conferência de que ela ficou vazia, cópia das imagens (veja abaixo) e cópia dos dados da produção. Se a limpeza não deixar a homologação vazia, a cópia não é feita.

Sem `--confirmar`, o script nunca apaga nem grava. Passar `--dry-run` e `--confirmar` juntos é recusado.

Se der erro depois da limpeza, rode o passo 2 novamente; os dados anteriores da homologação continuam no backup.

### Imagens no Vercel Blob

As imagens cadastradas em **Administração do Sistema > Imagens** ficam no Vercel Blob (loja `quasar-blob`), em uma pasta para cada base:

- `producao/images/` → site de produção (branch `producao`);
- `homologacao/images/` → homologação, previews e desenvolvimento local.

Cada base só altera a própria pasta, então a mesma imagem pode existir nas duas sem conflito. O nome da pasta vem do ambiente da Vercel (`VERCEL_ENV`); para forçar outra, defina `BLOB_AMBIENTE=producao` ou `BLOB_AMBIENTE=homologacao`. Para usar o Blob no desenvolvimento local, coloque o `BLOB_READ_WRITE_TOKEN` no `.env.local`.

No script de cópia, as imagens seguem o mesmo princípio de espelho: as imagens de `homologacao/images/` são apagadas (**sem backup**: o backup JSON guarda só as URLs) e as de `producao/images/` são copiadas para lá. O campo `ie_arquivo` da coleção `imagem` na homologação é reescrito para apontar para as cópias. A pasta da produção só é lida. Imagens antigas, com caminho `/images/...` (arquivos do repositório), continuam como estão.

Para copiar apenas o Firestore, sem tocar no Blob:

```bash
npm.cmd run db:copiar-producao -- --confirmar --sem-imagens
```

Nesse caso os registros de imagem da homologação continuam apontando para os arquivos da produção. A homologação não consegue apagar nem renomear esses arquivos (o sistema ignora a exclusão e a renomeação copia o arquivo para a pasta da homologação).

### Passo 3 — Conferir

No console do Firebase, abra o projeto `quasar-c3c81` em **Firestore Database** e confira:

- `usuario`: só os usuários da produção, com os mesmos IDs e sem `nr_sequencia` repetido;
- `aluno`: a mesma quantidade de registros mostrada na simulação;
- `_counters`: os contadores com os mesmos valores da produção (os próximos cadastros na homologação continuam a numeração da produção);
- `imagem`: o campo `ie_arquivo` apontando para `.../homologacao/images/...`; no Vercel (Storage → `quasar-blob` → **Manage Blobs**) a pasta `homologacao/images/` com as mesmas imagens de `producao/images/`.

### Observação

No plano gratuito do Firebase (Spark), o limite diário é de 50 mil leituras e 20 mil gravações. Cada execução lê todos os documentos da produção e da homologação (a simulação também conta). A cópia ainda apaga os documentos da homologação e grava os da produção, e as exclusões também entram na cota de gravações. Com bancos grandes, evite repetir a cópia várias vezes no mesmo dia.
