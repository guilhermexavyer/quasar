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

4. Configure as credenciais do Firebase criando um arquivo `.env.local` na raiz do projeto, seguindo o padrão esperado em `src/lib/firebase.ts`:

```
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
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
