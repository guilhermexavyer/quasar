# Quasar

Plataforma web de **gestão escolar**, modular e configurável, construída com Next.js e Firebase.

---

## Sumário

- [Sobre o projeto](#sobre-o-projeto)
- [Tecnologias](#tecnologias)
- [Pré-requisitos](#pré-requisitos)
- [Instalação local](#instalação-local)
- [Scripts disponíveis](#scripts-disponíveis)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Banco de dados](#banco-de-dados)
- [Acesso pela rede local](#acesso-pela-rede-local)
- [Observações importantes](#observações-importantes)
- [Desenvolvimento](#desenvolvimento)
- [Solução de problemas](#solução-de-problemas)

---

## Sobre o projeto

O Quasar nasceu da ideia de reunir, em um único sistema, a rotina administrativa de uma instituição de ensino — pessoas, estrutura acadêmica, patrimônio e relatórios — de forma **modular**: cada área é independente, mas todas compartilham os mesmos cadastros e se conectam entre si.

Três princípios orientam o projeto:

- **Configurável pelo próprio usuário** — o comportamento do sistema se adapta ao perfil de quem o utiliza, sem necessidade de alterar código.
- **Rastreável** — toda informação registrada no sistema mantém o histórico de quem a criou e alterou.
- **Orientado a dados** — as informações cadastradas servem de base para documentos e relatórios montados pelo próprio usuário.

---

## Tecnologias

| Camada | Tecnologia |
| --- | --- |
| Framework | [Next.js 16](https://nextjs.org) (App Router, Turbopack) |
| Interface | [React 19](https://react.dev) e [Tailwind CSS 4](https://tailwindcss.com) |
| Linguagem | [TypeScript 5](https://www.typescriptlang.org) |
| Banco de dados | [Cloud Firestore](https://firebase.google.com/docs/firestore) (Firebase) |
| Documentos | [jsPDF](https://github.com/parallax/jsPDF) |
| Qualidade | [ESLint 9](https://eslint.org) |

---

## Pré-requisitos

- **Node.js 20.9 ou superior** (exigência do Next.js 16) — verifique com `node -v`.
- **npm** (instalado junto com o Node.js).
- **Git**, para clonar o repositório.
- Uma **conta Google** para criar o projeto no [Firebase](https://console.firebase.google.com).

---

## Instalação local

### 1. Clonar o repositório

```bash
git clone https://github.com/guilhermexavyer/quasar.git
cd quasar
```

### 2. Instalar as dependências

```bash
npm install
```

> **Windows (PowerShell):** se aparecer o erro *"a execução de scripts foi desabilitada neste sistema"*, use `npm.cmd` no lugar de `npm` (ex.: `npm.cmd install`) ou execute os comandos pelo Prompt de Comando (cmd).

### 3. Criar o projeto no Firebase

1. Acesse o [console do Firebase](https://console.firebase.google.com) e crie um novo projeto.
2. No menu **Build › Firestore Database**, clique em **Criar banco de dados**.
3. Em **Configurações do projeto › Seus apps**, adicione um **app da Web** (ícone `</>`). O Firebase exibirá um objeto `firebaseConfig` com as credenciais — elas serão usadas no próximo passo.
4. Ajuste as **regras do Firestore** para permitir a leitura e a gravação pelo aplicativo (veja [Observações importantes](#observações-importantes)).

### 4. Configurar as variáveis de ambiente

Crie um arquivo chamado `.env.local` na raiz do projeto com as credenciais do app da Web:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

> O `.env.local` já está no `.gitignore` e **não deve ser versionado**.

### 5. Popular o banco com os dados iniciais

```bash
npm run seed
```

O seeder cria o **perfil Administrador** (com acesso a todas as funções), o **usuário `administrador`** vinculado a ele e os **cadastros gerais** básicos para o contexto escolar. Ele pode ser executado mais de uma vez: registros já existentes não são duplicados.

> A senha inicial do usuário `administrador` está definida em `scripts/seed.mjs`. **Altere-a após o primeiro acesso.**

### 6. Iniciar o servidor de desenvolvimento

```bash
npm run dev
```

### 7. Acessar o sistema

Abra [http://localhost:3000](http://localhost:3000) no navegador e entre com o usuário `administrador`.

---

## Scripts disponíveis

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Inicia o servidor de desenvolvimento em `http://localhost:3000`. |
| `npm run dev:lan` | Inicia o servidor de desenvolvimento acessível por outros dispositivos da rede local. |
| `npm run build` | Gera a versão de produção. |
| `npm run start` | Executa a versão de produção (requer `npm run build` antes). |
| `npm run lint` | Analisa o código com o ESLint. |
| `npm run seed` | Popula o banco com os dados iniciais (perfil, usuário administrador e cadastros gerais). |
| `npm run db:limpar` | Simula a limpeza completa do banco, listando o que seria apagado. Para apagar de fato, use `npm run db:limpar -- --confirmar` (um backup em JSON é gerado antes em `backups/`). |
| `npm run migrate:usuario-config` | Migração legada das preferências de usuário para o formato atual. |

---

## Estrutura do projeto

```
quasar/
├── public/                 # Arquivos estáticos (logotipos e imagens enviadas pelo sistema)
├── scripts/                # Scripts de manutenção do banco (seeder, limpeza, migrações)
├── src/
│   ├── app/                # Rotas do Next.js (App Router)
│   │   ├── api/            # Rotas de API (upload, renomeação e exclusão de imagens)
│   │   ├── layout.tsx
│   │   └── page.tsx        # Aplicação principal
│   ├── components/         # Componentes de interface, organizados por módulo
│   │   └── ui/             # Componentes reutilizáveis (tabelas, dropdowns, pop-ups etc.)
│   ├── lib/                # Utilitários, regras de formatação e geração de documentos
│   ├── services/           # Acesso ao Firestore (uma camada por coleção)
│   └── types/              # Tipos TypeScript das entidades
├── .env.local              # Credenciais do Firebase (não versionado)
└── package.json
```

---

## Banco de dados

O Quasar utiliza o **Cloud Firestore**. Cada entidade do sistema corresponde a uma coleção, e cada registro mantém uma subcoleção `auditoria` com o seu histórico de alterações. A numeração sequencial dos registros é controlada pela coleção `_counters`.

Para recomeçar com um banco limpo:

```bash
npm run db:limpar -- --confirmar   # gera um backup em backups/ e apaga todos os dados
npm run seed                       # recria os dados iniciais
```

> ⚠️ A limpeza é **irreversível** (exceto pelo backup gerado). Confira o projeto Firebase configurado no `.env.local` antes de executá-la.

---

## Acesso pela rede local

Para acessar o sistema a partir de outro computador ou celular da mesma rede:

```bash
npm run dev:lan
```

Em seguida, acesse `http://<IP-do-computador>:3000` no outro dispositivo. O IP pode ser consultado com `ipconfig` (Windows) ou `ip addr` (Linux/macOS). Se a página não abrir, verifique se o firewall permite conexões na porta `3000`.

---

## Observações importantes

- **Segurança:** a autenticação dos usuários é feita pela própria aplicação, sem o Firebase Authentication. Por isso, as regras do Firestore precisam permitir o acesso do aplicativo, e as credenciais do `.env.local` dão acesso ao banco. **Utilize o sistema apenas em ambiente controlado (rede interna)** e não publique as credenciais.
- **Imagens:** as imagens enviadas são gravadas na pasta `public/images` do servidor. O recurso exige um servidor com disco gravável e **não funciona em hospedagens serverless** (como a Vercel).
- **Cotas do Firebase:** no plano gratuito (Spark), o Firestore tem limites diários de leituras e gravações. Como o sistema carrega os cadastros ao iniciar, recarregar a página muitas vezes em pouco tempo pode esgotar a cota do dia, que é renovada diariamente. Para uso contínuo, considere o plano pago (Blaze).

---

## Desenvolvimento

- O projeto usa o **Next.js 16**, que traz mudanças em relação às versões anteriores. Consulte a documentação em `node_modules/next/dist/docs/` antes de alterar convenções do framework (veja também o `AGENTS.md`).
- Antes de enviar alterações, garanta que o projeto compila:

```bash
npm run lint
npm run build
```

- Convenções de nomes adotadas:
  - **componentes** em `PascalCase`;
  - **funções e variáveis** em `camelCase`;
  - **constantes de módulo** em `UPPER_SNAKE_CASE`;
  - **campos e coleções do Firestore** em `snake_case` — não renomeie, pois os dados existentes dependem desses nomes.

---

## Solução de problemas

| Problema | Solução |
| --- | --- |
| `Variáveis NEXT_PUBLIC_FIREBASE_* não encontradas` ao rodar um script | Confirme que o `.env.local` existe na raiz do projeto e que os scripts são executados pelo `npm run` (eles leem o arquivo com `--env-file`). |
| Erro de versão do Node.js ou `--env-file` não reconhecido | Atualize o Node.js para a versão 20.9 ou superior. |
| Não é possível entrar no sistema | Verifique se o `npm run seed` foi executado no projeto Firebase configurado no `.env.local`. |
| Erros `permission-denied` no console | Revise as regras do Firestore (passo 3 da instalação). |
| Erros `resource-exhausted` / `Quota exceeded` | A cota diária do plano gratuito do Firebase foi atingida. Aguarde a renovação ou altere o plano do projeto. |
| `npm` bloqueado no PowerShell | Use `npm.cmd` ou o Prompt de Comando (cmd). |
