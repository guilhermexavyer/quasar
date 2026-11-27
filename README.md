# Quasar

Sistema web de gestão empresarial/acadêmica, modular e orientada a dados. Configurável pelo usuário, permissões por perfil, trilha de auditoria e gerador de relatórios.

**Arquitetura**

- **Framework:** Next.js 16 (React 19), com telas e API no mesmo projeto
- **Linguagens:** TypeScript, SQL e CSS (Tailwind)
- **Banco de dados:** PostgreSQL (Supabase)
- **Storage:** Supabase Storage
- **Hospedagem:** Vercel

**Ambientes**

| Branch | Publicação | Banco | Arquivo `.env` |
|---|---|---|---|
| `homologacao` | quasar-cbc-homol.vercel.app (Preview) | homologação | `.env.local` |
| `producao` | quasar-cbc.vercel.app (Production) | produção | `.env.producao` |

---

## 1. Instalação

Após o `git clone`:

```bash
git checkout desenvolvimento          # alternar para a branch desenvolvimento
npm.cmd install                       # dependências
npm.cmd run credenciais:restaurar     # pede a frase-senha e para conectar ao banco de dados
npm.cmd run db:testar                 # testa a conexão 
npm.cmd run dev                       # http://localhost:3000  
```

## 2. Credenciais

As chaves dos dois ambientes ficam em `credenciais.enc`. Sem a frase-senha o arquivo é inútil.

```bash
npm.cmd run credenciais:restaurar               # recria os .env
npm.cmd run credenciais:restaurar -- --forcar   # sobrescreve os .env
npm.cmd run credenciais:salvar                  # regrava credenciais.enc
```

## 3. Banco de dados (migrações)

**Homologação**

```bash
npm.cmd run db:migrar                          # lista as migrações pendentes
npm.cmd run db:migrar -- --simular             # executa e desfaz (valida o SQL)
npm.cmd run db:migrar -- --confirmar           # aplica
npm.cmd run db:auditar-rodapes                 # confere rodapés x auditoria
```

**Produção**

```bash
npm.cmd run db:migrar:producao                 # lista as migrações pendentes
npm.cmd run db:migrar:producao -- --simular    # executa e desfaz (valida o SQL)
npm.cmd run db:migrar:producao -- --confirmar  # aplica
```

## 4. Publicação

**Homologação**

```bash
npm.cmd run db:migrar -- --confirmar   # se houver migração
git checkout homologacao
git pull
git merge desenvolvimento
git push                               # dispara o deploy
git checkout desenvolvimento
```

**Produção**

```bash
npm.cmd run db:migrar:producao -- --confirmar   # se houver migração
git checkout producao
git pull
git merge homologacao
git push                                        # dispara o deploy
git checkout desenvolvimento
```

## 5. Dump produção → homologação

```bash
npm.cmd run db:copiar-producao                                # simula
npm.cmd run db:copiar-producao -- --confirmar                 # copia banco e imagens
npm.cmd run db:copiar-producao -- --confirmar --sem-imagens   # só o banco
```

## 6. Começar do zero

Apaga todos os registros** e recria o mínimo..

**Homologação**

```bash
npm.cmd run db:limpar                     # simula
npm.cmd run db:limpar -- --confirmar      # backup em backups/ e APAGA tudo (--com-imagens apaga também o Storage)
npm.cmd run seed                          # perfil e usuário administrador
npm.cmd run seed:cg                       # Cadastros Gerais
```

**Produção**

```bash
npm.cmd run db:limpar:producao                     # simula
npm.cmd run db:limpar:producao -- --confirmar      # backup em backups/ e APAGA tudo (--com-imagens apaga também o Storage)
npm.cmd run seed:producao                          # perfil e usuário administrador
npm.cmd run seed:cg:producao                       # Cadastros Gerais
```

## 7. Outros comandos

```bash
npm.cmd run build    # build de produção (o mesmo que a Vercel roda)
npm.cmd run start    # serve o build localmente
npm.cmd run lint     # ESLint
```
