#!/usr/bin/env node
/**
 * Guarda as credenciais dos ambientes num arquivo criptografado (credenciais.enc) que pode ir para o Git,
 * e recria os .env a partir dele depois de um git clone.
 *
 * Criptografia: AES-256-GCM com chave derivada da frase-senha por scrypt. Sem a frase, o arquivo não abre.
 *
 * Uso:
 *   node scripts/credenciais.mjs salvar        → lê db-homologacao.txt e db-producao.txt (ou .env.local e .env.producao)
 *                                                e grava credenciais.enc
 *   node scripts/credenciais.mjs restaurar     → lê credenciais.enc e grava .env.local e .env.producao
 *   node scripts/credenciais.mjs restaurar --forcar   → sobrescreve .env existentes
 *
 * A frase-senha é pedida no terminal (sem eco). Para uso sem terminal: variável QUASAR_FRASE_CREDENCIAIS.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";
import readline from "node:readline";

const RAIZ = process.cwd();
const ARQUIVO = path.join(RAIZ, "credenciais.enc");
const AMBIENTES = [
  { env: ".env.local", txt: "db-homologacao.txt", nome: "homologação" },
  { env: ".env.producao", txt: "db-producao.txt", nome: "produção" },
];
const SCRYPT = { N: 2 ** 17, r: 8, p: 1, maxmem: 256 * 1024 * 1024 };
const TAMANHO_MINIMO_FRASE = 12;

function falhar(mensagem) {
  console.error(`❌ ${mensagem}`);
  process.exit(1);
}

function perguntarOculto(pergunta) {
  if (process.env.QUASAR_FRASE_CREDENCIAIS) return Promise.resolve(process.env.QUASAR_FRASE_CREDENCIAIS);
  if (!process.stdin.isTTY) falhar("Sem terminal interativo. Defina QUASAR_FRASE_CREDENCIAIS.");
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    let mudo = false;
    rl._writeToOutput = (texto) => {
      if (!mudo) rl.output.write(texto);
    };
    rl.question(pergunta, (resposta) => {
      rl.close();
      process.stdout.write("\n");
      resolve(resposta);
    });
    mudo = true;
  });
}

function derivarChave(frase, sal) {
  return scryptSync(frase.normalize("NFC"), sal, 32, SCRYPT);
}

async function salvar() {
  const conteudo = {};
  for (const { env, txt, nome } of AMBIENTES) {
    const origem = [txt, env].map((n) => path.join(RAIZ, n)).find((c) => existsSync(c));
    if (!origem) falhar(`Não encontrei ${txt} nem ${env} (${nome}).`);
    const texto = readFileSync(origem, "utf8");
    if (/:SENHA@/.test(texto)) falhar(`${path.basename(origem)} ainda tem o marcador SENHA no lugar da senha do banco.`);
    if (/=CHAVE\s*$/m.test(texto)) falhar(`${path.basename(origem)} ainda tem o marcador CHAVE no lugar da chave secreta.`);
    conteudo[env] = texto;
    console.log(`• ${nome}: ${path.basename(origem)}`);
  }

  const frase = await perguntarOculto("Frase-senha (mínimo 12 caracteres): ");
  if (frase.length < TAMANHO_MINIMO_FRASE) falhar(`A frase-senha precisa de pelo menos ${TAMANHO_MINIMO_FRASE} caracteres.`);
  if (!process.env.QUASAR_FRASE_CREDENCIAIS) {
    const confirmacao = await perguntarOculto("Repita a frase-senha: ");
    if (confirmacao !== frase) falhar("As frases não conferem. Nada foi gravado.");
  }

  const sal = randomBytes(16);
  const iv = randomBytes(12);
  const cifra = createCipheriv("aes-256-gcm", derivarChave(frase, sal), iv);
  const dados = Buffer.concat([cifra.update(JSON.stringify(conteudo), "utf8"), cifra.final()]);
  const pacote = {
    versao: 1,
    algoritmo: "aes-256-gcm+scrypt",
    sal: sal.toString("base64"),
    iv: iv.toString("base64"),
    tag: cifra.getAuthTag().toString("base64"),
    dados: dados.toString("base64"),
  };
  writeFileSync(ARQUIVO, JSON.stringify(pacote, null, 2) + "\n");
  console.log("✅ credenciais.enc gravado. Faça commit dele; sem a frase-senha ninguém consegue abri-lo.");
}

async function restaurar() {
  if (!existsSync(ARQUIVO)) falhar("credenciais.enc não existe na raiz do projeto.");
  const forcar = process.argv.includes("--forcar");
  const existentes = AMBIENTES.filter(({ env }) => existsSync(path.join(RAIZ, env))).map(({ env }) => env);
  if (existentes.length && !forcar) falhar(`${existentes.join(" e ")} já existe(m). Use --forcar para sobrescrever.`);

  const pacote = JSON.parse(readFileSync(ARQUIVO, "utf8"));
  if (pacote.versao !== 1) falhar(`Versão de credenciais.enc desconhecida: ${pacote.versao}.`);
  const frase = await perguntarOculto("Frase-senha: ");

  let conteudo;
  try {
    const decifra = createDecipheriv("aes-256-gcm", derivarChave(frase, Buffer.from(pacote.sal, "base64")), Buffer.from(pacote.iv, "base64"));
    decifra.setAuthTag(Buffer.from(pacote.tag, "base64"));
    const texto = Buffer.concat([decifra.update(Buffer.from(pacote.dados, "base64")), decifra.final()]).toString("utf8");
    conteudo = JSON.parse(texto);
  } catch {
    falhar("Frase-senha errada (ou arquivo corrompido). Nada foi gravado.");
  }

  for (const { env, nome } of AMBIENTES) {
    if (typeof conteudo[env] !== "string") falhar(`credenciais.enc não tem ${env}.`);
    writeFileSync(path.join(RAIZ, env), conteudo[env]);
    console.log(`✅ ${env} (${nome}) gravado.`);
  }
}

const comando = process.argv[2];
if (comando === "salvar") await salvar();
else if (comando === "restaurar") await restaurar();
else falhar("Use: node scripts/credenciais.mjs salvar | restaurar [--forcar]");
