# Quasar — Sistema de Gestão Acadêmica

Sistema de gestão acadêmica desenvolvido em Next.js com Firebase Firestore. Gerencia pessoas, estrutura acadêmica, patrimônio e administração do sistema em uma única aplicação.

## Como instalar

1. Clone o repositório ou baixe os arquivos do projeto.
2. Abra o terminal na pasta do projeto.
3. Instale as dependências:

```bash
npm.cmd install
```

4. Inicie o servidor de desenvolvimento:

```bash
npm.cmd run dev
```

5. Abra o navegador em:

```bash
http://localhost:3000
```

6. Comece a usar o projeto e edite `src/app/page.tsx` para ajustar a aplicação.

## Observação

Se você usar outro gerenciador de pacotes, substitua `npm install` por `yarn install` ou `pnpm install`, e `npm run dev` por `yarn dev` ou `pnpm dev`.

---

## Módulos

### 👤 Pessoas Físicas e Jurídicas
Cadastro de pessoas com dados pessoais, documentos, endereço e contato. Pessoas jurídicas possuem razão social, CNPJ e dados institucionais.

### 🎓 Estrutura Acadêmica
Gestão de **Alunos** (ingresso, matrícula, status) e **Colaboradores** (admissão, vínculo contratual, fornecedor, prestador de serviço). Cada entidade permite alteração de status com data e motivo.

### 🖥️ Patrimônio

**Ativos** — Cadastro completo com dados técnicos (processador, RAM, IPv4, MAC, SO), classificação (categoria, localização, marca), controle de status (Operacional, Manutenção, Estoque, Descartado) e gestão de responsáveis.

**Manutenções** — Registro de manutenções vinculadas a ativos, com prestador de serviço, datas de envio e término, valor total, motivo e correções. Status: Em andamento, Concluída, Cancelada.

### ⚙️ Administração do Sistema
Gestão de **Usuários**, **Perfis** e **Permissões**. As permissões são granulares por módulo (ver, incluir, alterar, excluir) e por funcionalidade específica (ex: alterar status, concluir manutenção). Cada perfil define quais campos estão habilitados, desabilitados ou obrigatórios em cada formulário.

### 📋 Cadastro Geral
Interface unificada para gerenciar listas de opções ( Sexo, Cor/Raça, Estado Civil, Logradouro, Categoria de Ativo, etc.) utilizadas em todo o sistema.

## Funcionalidades Gerais

- **Modo escuro** com alternância pelo cabeçalho
- **Tabelas com colunas redimensionáveis** e reordenáveis por arrasto
- **Filtros avançados** com campos de busca, dropdowns e lookup
- **Menus de contexto** com submenus e ações específicas por módulo
- **Auditoria** — data, hora e usuário de cada operação
- **Configuração de colunas salva por usuário** no banco de dados
- **Campos configuráveis por função** — habilitar, desabilitar ou tornar obrigatório

## Stack Tecnológica

| Camada | Tecnologia |
|--------|-----------|
| Framework | Next.js (App Router) |
| Linguagem | TypeScript |
| Estilo | Tailwind CSS |
| Banco de dados | Firebase Firestore |
| Autenticação | Firebase Auth |

## Estrutura do Projeto

```
src/
├── app/
│   └── page.tsx              # Página principal (toda a lógica de estado)
├── components/
│   ├── ui/                   # Componentes reutilizáveis
│   ├── pessoaFisica/         # Pessoas físicas
│   ├── pessoaJuridica/       # Pessoas jurídicas
│   ├── estruturaAcademica/   # Alunos, Colaboradores, Cargos, etc.
│   ├── cadastrosGerais/      # Cadastro Geral unificado
│   ├── patrimonio/           # Ativos e Manutenções
│   └── administracaoSistema/ # Usuários, Perfis, Permissões
├── lib/
│   ├── firebase.ts           # Configuração do Firebase
│   ├── firestoreUtils.ts     # Operações CRUD genéricas
│   ├── permissoesUtils.ts    # Definição de permissões
│   └── *Utils.ts             # Utilitários por módulo
└── types/
    └── *.ts                  # Definições de tipos por entidade
```
