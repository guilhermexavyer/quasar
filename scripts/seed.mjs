#!/usr/bin/env node
/**
 * Seeder — Cadastros Gerais e Usuário Inicial
 *
 * Popula as coleções de cadastros gerais do sistema com dados padrão
 * baseados nas classificações oficiais brasileiras:
 *   - cg_sexo          → Masculino / Feminino (registro civil)
 *   - cg_estado_civil  → todos os estados civis (Código Civil / IBGE)
 *   - cg_cor_raca      → as 5 categorias do IBGE (cor ou raça)
 *   - cg_profissao     → lista ampla de profissões (inspirada na CBO)
 *   - usuario          → usuário administrador inicial (nr_sequencia 1,
 *                        senha em SHA-256, criado por 'implantacao')
 *
 * O script é IDEMPOTENTE: registros cuja descrição já existe são ignorados.
 * Após inserir, sincroniza o contador da coleção (_counters) para que os
 * próximos cadastros feitos pela tela continuem a numeração corretamente.
 *
 * Uso:
 *   node --env-file=.env.local scripts/seed.mjs
 *
 * Para limpar antes de rodar (apaga as coleções de cadastros gerais e seus
 * contadores — a coleção usuario NÃO é apagada, preservando contas existentes):
 *   node --env-file=.env.local scripts/seed.mjs --reset
 *
 * Para apenas mostrar o que seria inserido (sem escrever nada):
 *   node --env-file=.env.local scripts/seed.mjs --dry-run
 */

import { createHash } from "node:crypto";
import { initializeApp, getApps } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  setDoc,
  writeBatch,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

if (!firebaseConfig.projectId) {
  console.error(
    "❌ Variáveis NEXT_PUBLIC_FIREBASE_* não encontradas.\n" +
      "   Rode com: node --env-file=.env.local scripts/seed.mjs"
  );
  process.exit(1);
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

/* ------------------------------------------------------------------ */
/*  Dados dos cadastros gerais                                        */
/* ------------------------------------------------------------------ */

const SEXOS = ["Masculino", "Feminino"];

const ESTADOS_CIVIS = [
  "Solteiro",
  "Casado",
  "Separado judicialmente",
  "Divorciado",
  "Viúvo",
  "União estável",
];

const CORES_RACAS = ["Branca", "Preta", "Parda", "Amarela", "Indígena"];

const PROFISSOES = [
  // Saúde
  "Médico", "Enfermeiro", "Técnico de Enfermagem", "Auxiliar de Enfermagem",
  "Dentista", "Farmacêutico", "Fisioterapeuta", "Psicólogo", "Nutricionista",
  "Fonoaudiólogo", "Terapeuta Ocupacional", "Biomédico", "Biomédica",
  "Veterinário", "Radiologista", "Massoterapeuta", "Acupunturista",
  "Fisiculturista", "Personal Trainer", "Educador Físico", "Quiropraxista",
  "Agente Comunitário de Saúde", "Cuidador de Idosos", "Doula", "Obstetra",

  // Engenharia e arquitetura
  "Engenheiro Civil", "Engenheiro Mecânico", "Engenheiro Elétrico",
  "Engenheiro Eletrônico", "Engenheiro Químico", "Engenheiro de Produção",
  "Engenheiro Agrônomo", "Engenheiro de Software", "Engenheiro de Alimentos",
  "Engenheiro Ambiental", "Engenheiro de Minas", "Arquiteto", "Urbanista",
  "Topógrafo", "Desenhista Técnico",

  // Tecnologia da informação
  "Programador", "Desenvolvedor de Software", "Desenvolvedor Web",
  "Desenvolvedor Mobile", "Analista de Sistemas", "Analista de Dados",
  "Cientista de Dados", "Administrador de Banco de Dados", "Administrador de Redes",
  "Analista de Segurança da Informação", "Especialista em Inteligência Artificial",
  "Especialista em Cloud Computing", "Testador de Software", "Suporte Técnico",
  "Técnico de Informática", "Web Designer", "UX Designer", "Product Manager",
  "Analista de Infraestrutura", "DevOps Engineer",

  // Educação
  "Professor", "Professor Universitário", "Pedagogo", "Coordenador Pedagógico",
  "Orientador Educacional", "Instrutor de Cursos", "Professor de Idiomas",
  "Professor de Música", "Professor de Educação Física", "Bibliotecário",
  "Supervisor de Ensino", "Diretor de Escola",

  // Direito
  "Advogado", "Juiz", "Promotor de Justiça", "Defensor Público", "Procurador",
  "Delegado", "Oficial de Justiça", "Tabelião", "Notário", "Registrador",
  "Conciliador", "Mediador", "Perito Judicial", "Consultor Jurídico",

  // Administração e finanças
  "Administrador", "Contador", "Economista", "Analista Financeiro",
  "Analista de Crédito", "Analista de Recursos Humanos", "Analista de Marketing",
  "Analista de Logística", "Analista de Compras", "Analista de Qualidade",
  "Gestor de Projetos", "Gestor de Pessoas", "Auditor", "Controlador Interno",
  "Atuário", "Estatístico", "Tesoureiro", "Secretário Executivo",
  "Assistente Administrativo", "Auxiliar Administrativo", "Recepcionista",
  "Caixa", "Operador de Caixa", "Atendente", "Teleoperador", "Almoxarife",
  "Arquivista", "Digitalizador",

  // Vendas e comércio
  "Vendedor", "Vendedor Interno", "Vendedor Externo", "Representante Comercial",
  "Corretor de Imóveis", "Corretor de Seguros", "Comerciante", "Empresário",
  "Gerente de Vendas", "Gerente Comercial", "Comprador", "Promotor de Vendas",
  "Leiloeiro", "Consultor de Vendas", "Gerente de Loja",

  // Indústria e ofícios
  "Operador de Produção", "Operador de Máquinas", "Operador de Empilhadeira",
  "Operador de Retroescavadeira", "Mecânico", "Mecânico de Automóveis",
  "Eletricista", "Eletricista Industrial", "Eletricista Predial",
  "Soldador", "Torneiro Mecânico", "Fresador", "Ferramenteiro",
  "Marceneiro", "Carpinteiro", "Pedreiro", "Servente de Obras", "Mestre de Obras",
  "Pintor", "Pintor Predial", "Encanador", "Bombeiro Hidráulico", "Serralheiro",
  "Vidraceiro", "Gesseiro", "Azulejista", "Pisoteiro", "Telhadista",
  "Funileiro", "Chapeiro", "Estampador", "Operador de Caldeira",
  "Metalúrgico", "Químico Industrial", "Farmacêutico Industrial",
  "Padeiro", "Confeiteiro", "Cozinheiro", "Auxiliar de Cozinha", "Copeiro",
  "Churrasqueiro", "Açougueiro", "Pescador", "Agricultor", "Agropecuarista",
  "Tratorista", "Operador de Colheitadeira", "Jardinheiro", "Floricultor",

  // Transporte e logística
  "Motorista", "Motorista de Ônibus", "Motorista de Caminhão", "Taxista",
  "Motorista de Aplicativo", "Entregador", "Motoboy", "Carregador",
  "Estoquista", "Conferente", "Despachante", "Expedidor", "Piloto de Aeronaves",
  "Comissário de Bordo", "Marinheiro", "Técnico em Logística",

  // Comunicação e artes
  "Jornalista", "Repórter", "Redator", "Revisor de Textos", "Tradutor",
  "Intérprete", "Publicitário", "Diretor de Arte", "Designer Gráfico",
  "Fotógrafo", "Cinegrafista", "Editor de Vídeo", "Locutor", "Radialista",
  "Apresentador", "Ator", "Atriz", "Músico", "Cantor", "Compositor",
  "Produtor Musical", "Dançarino", "Coreógrafo", "Escritor", "Poeta",
  "Ilustrador", "Cartunista", "Artista Plástico", "Escultor", "Ceramista",
  "Artesão", "Curador de Arte", "Museólogo",

  // Serviços gerais
  "Porteiro", "Vigilante", "Segurança Particular", "Zelador", "Faxineiro",
  "Diarista", "Lavadeiro", "Passadeira", "Manicure", "Pedicure",
  "Cabeleireiro", "Barbeiro", "Esteticista", "Maquiador", "Depiladora",
  "Tatuador", "Percussionista", "Técnico de Manutenção", "Técnico de Refrigeração",
  "Técnico em Segurança do Trabalho", "Bombeiro Civil", "Guarda Municipal",
  "Agente de Trânsito", "Policial Militar", "Policial Civil", "Bombeiro Militar",
  "Militar", "Detetive", "Investigador", "Perito Criminal", "Piloto de Drone",

  // Ciências e pesquisa
  "Pesquisador", "Cientista", "Físico", "Químico", "Matemático", "Biólogo",
  "Geólogo", "Meteorologista", "Astrônomo", "Oceanógrafo", "Historiador",
  "Sociólogo", "Antropólogo", "Filósofo", "Geógrafo", "Arqueólogo",
  "Paleontólogo", "Geneticista",

  // Outros
  "Bancário", "Caixa Bancário", "Gerente de Banco", "Contador de Histórias",
  "Astrólogo", "Guias de Turismo", "Turismólogo", "Hoteleiro", "Recepcionista de Hotel",
  "Camareira", "Governanta", "Mordomo", "Sommelier", "Barman", "Barista",
  "Garçom", "Maître", "Cerimonialista", "Organizador de Eventos", "Produtor de Eventos",
  "Disc Jockey", "Iluminador", "Sonoplasta", "Cenógrafo", "Figurinista",
];

/* Normalização para comparação: minúsculas, sem espaços e sem acentos */
function normalizar(valor) {
  return String(valor ?? "")
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/* Configurações das coleções */
const COLECOES = [
  { nome: "cg_sexo",           contador: "cg_sexo_sequence",           campo: "ds_sexo",           valores: SEXOS },
  { nome: "cg_estado_civil",   contador: "cg_estado_civil_sequence",   campo: "ds_estado_civil",   valores: ESTADOS_CIVIS },
  { nome: "cg_cor_raca",       contador: "cg_cor_raca_sequence",       campo: "ds_cor_raca",       valores: CORES_RACAS },
  { nome: "cg_profissao",      contador: "cg_profissao_sequence",      campo: "ds_profissao",      valores: PROFISSOES },
];

const RESET = process.argv.includes("--reset");
const DRY_RUN = process.argv.includes("--dry-run");

/* Implantação: usuário e data fixos para todos os registros do seeder */
const USUARIO_IMPLANTACAO = "implantacao";
const DATA_IMPLANTACAO = "2026-01-01T00:00:00";

/* Usuário administrador inicial do sistema */
const USUARIO_ADMIN = {
  ds_usuario: "administrador",
  ds_usuario_alternativo: "administrador",
  senha: "quasar.123456",
  ie_status: "A",
};

/* ------------------------------------------------------------------ */
/*  Reset (opcional)                                                  */
/* ------------------------------------------------------------------ */

async function resetar() {
  console.log("♻️  Modo --reset: apagando coleções e contadores...\n");
  for (const cfg of COLECOES) {
    const colRef = collection(db, cfg.nome);
    const snap = await getDocs(colRef);
    const batch = writeBatch(db);
    for (const d of snap.docs) {
      batch.delete(doc(db, cfg.nome, d.id));
      // também apaga a subcoleção de auditoria se existir
      try {
        const audRef = collection(db, cfg.nome, d.id, "auditoria");
        const audSnap = await getDocs(audRef);
        for (const a of audSnap.docs) {
          batch.delete(doc(db, cfg.nome, d.id, "auditoria", a.id));
        }
      } catch {
        /* subcoleção não existe */
      }
    }
    if (snap.size > 0) await batch.commit();
    await setDoc(doc(db, "_counters", cfg.contador), { current: 0 }, { merge: true });
    console.log(`🗑️  ${cfg.nome}: ${snap.size} registros apagados`);
  }
  console.log("");
}

/* ------------------------------------------------------------------ */
/*  Seed de uma coleção (idempotente)                                 */
/* ------------------------------------------------------------------ */

async function semearColecao(cfg) {
  const colRef = collection(db, cfg.nome);
  const snap = await getDocs(colRef);

  // Descrições já existentes (comparação insensível a maiúsculas, espaços e acentos)
  const existentes = new Set(
    snap.docs.map((d) => normalizar(d.data()[cfg.campo]))
  );

  // Maior nr_sequencia atual (para continuar a numeração)
  let proximaSeq = 1;
  if (snap.size > 0) {
    const maxSeq = Math.max(...snap.docs.map((d) => Number(d.data().nr_sequencia) || 0));
    proximaSeq = maxSeq + 1;
  }

  // Deduplica a lista-fonte e ignora o que já existe no banco
  const novos = [...new Set(cfg.valores)].filter(
    (v) => !existentes.has(normalizar(v))
  );

  if (novos.length === 0) {
    // Mesmo sem inserir, corrige o contador se estiver atrasado
    await setDoc(
      doc(db, "_counters", cfg.contador),
      { current: proximaSeq - 1 },
      { merge: true }
    );
    console.log(`ℹ️  ${cfg.nome}: nada a inserir (${snap.size} já existem)`);
    return { nome: cfg.nome, inseridos: 0, existentes: snap.size };
  }

  if (DRY_RUN) {
    console.log(
      `👀 ${cfg.nome}: ${novos.length} seriam inseridos (próxima sequência: ${proximaSeq})`
    );
    return { nome: cfg.nome, inseridos: novos.length, existentes: snap.size };
  }

  const batch = writeBatch(db);
  let ultimaSeq = proximaSeq - 1;
  for (const valor of novos) {
    const ref = doc(colRef);
    batch.set(ref, {
      [cfg.campo]: valor,
      nr_sequencia: proximaSeq,
      ie_status: "A",
      dt_criacao: DATA_IMPLANTACAO,
      dt_alteracao: DATA_IMPLANTACAO,
      ds_usuario_criacao: USUARIO_IMPLANTACAO,
      ds_usuario_alteracao: USUARIO_IMPLANTACAO,
    });
    ultimaSeq = proximaSeq;
    proximaSeq += 1;
  }
  await batch.commit();

  // Sincroniza o contador para o próximo cadastro pela tela continuar correto
  await setDoc(doc(db, "_counters", cfg.contador), { current: ultimaSeq }, { merge: true });

  console.log(
    `✅ ${cfg.nome}: ${novos.length} inseridos (${snap.size} já existiam)`
  );
  return { nome: cfg.nome, inseridos: novos.length, existentes: snap.size };
}

/* ------------------------------------------------------------------ */
/*  Seed do usuário administrador inicial                             */
/* ------------------------------------------------------------------ */

async function semearUsuario() {
  const colRef = collection(db, "usuario");
  const snap = await getDocs(colRef);

  // Já existe (comparação insensível a maiúsculas, espaços e acentos)
  const jaExiste = snap.docs.some((d) =>
    normalizar(d.data().ds_usuario) === normalizar(USUARIO_ADMIN.ds_usuario)
  );

  // Maior nr_sequencia atual (para manter a numeração e o contador corretos)
  let maxSeq = 0;
  if (snap.size > 0) {
    maxSeq = Math.max(...snap.docs.map((d) => Number(d.data().nr_sequencia) || 0));
  }

  // Sequência 1 é a ideal, mas se outro usuário já a ocupa, usa a próxima livre
  const seqAdmin = snap.docs.some((d) => Number(d.data().nr_sequencia) === 1)
    ? maxSeq + 1
    : 1;

  if (jaExiste) {
    // Mesmo sem inserir, corrige o contador se estiver atrasado
    await setDoc(
      doc(db, "_counters", "usuario_sequence"),
      { current: Math.max(maxSeq, 1) },
      { merge: true }
    );
    console.log(`ℹ️  usuario: administrador já existe (${snap.size} usuário(s) no total)`);
    return { nome: "usuario", inseridos: 0, existentes: snap.size };
  }

  if (DRY_RUN) {
    console.log(`👀 usuario: administrador seria inserido (nr_sequencia: ${seqAdmin})`);
    return { nome: "usuario", inseridos: 1, existentes: snap.size };
  }

  // SHA-256 em hexadecimal — mesmo formato que o hashPassword do login
  const senhaHash = createHash("sha256").update(USUARIO_ADMIN.senha).digest("hex");

  await setDoc(doc(colRef), {
    nr_sequencia: seqAdmin,
    ds_usuario: USUARIO_ADMIN.ds_usuario,
    ds_usuario_alternativo: USUARIO_ADMIN.ds_usuario_alternativo,
    ds_senha: senhaHash,
    ie_status: USUARIO_ADMIN.ie_status,
    ds_observacao: "",
    dt_criacao: DATA_IMPLANTACAO,
    dt_alteracao: DATA_IMPLANTACAO,
    ds_usuario_criacao: USUARIO_IMPLANTACAO,
    ds_usuario_alteracao: USUARIO_IMPLANTACAO,
  });

  // Sincroniza o contador para o próximo cadastro pela tela continuar correto
  await setDoc(
    doc(db, "_counters", "usuario_sequence"),
    { current: Math.max(maxSeq, 1) },
    { merge: true }
  );

  console.log(`✅ usuario: administrador inserido (nr_sequencia: 1)`);
  return { nome: "usuario", inseridos: 1, existentes: snap.size };
}

/* ------------------------------------------------------------------ */
/*  Execução                                                          */
/* ------------------------------------------------------------------ */

async function main() {
  console.log("🌱 Seeder — Cadastros Gerais e Usuário Inicial\n");
  if (RESET && !DRY_RUN) await resetar();

  const total = { inseridos: 0 };
  for (const cfg of COLECOES) {
    const r = await semearColecao(cfg);
    total.inseridos += r.inseridos;
  }
  const rUsuario = await semearUsuario();
  total.inseridos += rUsuario.inseridos;

  if (DRY_RUN) {
    console.log(
      `\n👀 Dry-run concluído: ${total.inseridos} registros seriam inseridos. Nada foi escrito.`
    );
  } else {
    console.log(
      `\n🎉 Concluído! ${total.inseridos} novos registros em ${COLECOES.length + 1} coleções.`
    );
    console.log(
      "   Lembre-se: para os registros aparecerem, a tela precisa estar na seção Cadastros Gerais."
    );
  }
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Erro ao executar o seeder:", err?.message ?? err);
  console.error(
    "   Verifique se as regras de segurança do Firestore permitem escrita " +
      "e se as credenciais estão corretas."
  );
  process.exit(1);
});
