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
> - A homologação é **sobrescrita**: registros com o mesmo ID são substituídos pelos da produção. Registros que existem só na homologação não são apagados; para uma cópia exata, limpe a homologação antes com `npm run db:limpar -- --confirmar` (ele grava um backup em `backups/`).
> - São copiados dados pessoais reais (inclusive de alunos) e os hashes de senha dos usuários: as senhas da produção passam a valer na homologação.
> - A produção nunca é alterada. O script só grava se o destino for o projeto de homologação (`quasar-c3c81`).

### Pré-requisitos

- `.env.producao` preenchido com as credenciais da produção (origem).
- `.env.local` preenchido com as credenciais da homologação (destino).

Os dois arquivos ficam na raiz do projeto e não vão para o Git.

### Passo 1 — Simular

```bash
npm.cmd run db:copiar-producao -- --dry-run
```

Mostra a quantidade de documentos por coleção e o total, sem gravar nada.

### Passo 2 — Copiar

```bash
npm.cmd run db:copiar-producao -- --confirmar
```

Sem `--confirmar`, o script nunca grava. Passar `--dry-run` e `--confirmar` juntos é recusado.

### Passo 3 — Conferir

No console do Firebase, abra o projeto `quasar-c3c81` em **Firestore Database** e confira:

- `usuario`: os usuários da produção, com o mesmo ID;
- `aluno`: a mesma quantidade de registros mostrada na simulação;
- `_counters`: os contadores com os mesmos valores da produção (os próximos cadastros na homologação continuam a numeração da produção).

### Observação

No plano gratuito do Firebase (Spark), o limite diário é de 50 mil leituras e 20 mil gravações. Cada execução lê todos os documentos da produção (a simulação também conta) e a cópia grava a mesma quantidade na homologação. Com bancos grandes, evite repetir a cópia várias vezes no mesmo dia.
