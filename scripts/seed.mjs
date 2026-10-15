#!/usr/bin/env node
/**
 * Seeder — Implantação inicial
 *
 * Cria o necessário para começar a usar o sistema:
 *   - perfil  → 'Administrador', com todas as funções liberadas. Sem
 *               config_permissoes: o sistema trata a ausência como "tudo
 *               liberado", inclusive permissões criadas no futuro.
 *   - usuario → 'administrador' (senha em SHA-256, mesmo formato do login),
 *               vinculado ao perfil 'Administrador' (também como perfil ativo).
 *   - Cadastros Gerais → Cargo, Cor/Raça, Estado civil, Grau de parentesco,
 *               Logradouro, Marca, Órgão emissor, Profissão, Sexo, Sistema
 *               operacional e Vínculo contratual (contexto escolar).
 *
 * Todos os registros são criados por 'implantacao.quasar' em 01/01/2026 00:00:00.
 *
 * O script é IDEMPOTENTE: registros já existentes (mesma descrição) não são
 * recriados; o vínculo do usuário com o perfil é garantido.
 *
 * Uso:
 *   node --env-file=.env.local scripts/seed.mjs
 *   node --env-file=.env.local scripts/seed.mjs --dry-run   → só mostra o que seria feito
 */

import { createHash } from "node:crypto";
import { initializeApp, getApps } from "firebase/app";
import { getFirestore, collection, getDocs, doc, setDoc, addDoc, writeBatch } from "firebase/firestore";

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

const DRY_RUN = process.argv.includes("--dry-run");

/* Implantação: usuário e data de criação dos registros do seeder.
   Data sem fuso (hora local), exibida como 01/01/2026 00:00:00. */
const USUARIO_IMPLANTACAO = "implantacao.quasar";
const DATA_IMPLANTACAO = "2026-01-01T00:00:00";

const USUARIO_ADMIN = {
  ds_usuario: "administrador",
  ds_usuario_alternativo: "administrador",
  senha: "quasar@1105",
};

/* Funções do sistema (mesmas chaves de FuncaoId em src/lib/perfilUtils.ts) */
const TODAS_FUNCOES = [
  "pessoaFisica",
  "estruturaAcademica",
  "patrimonio",
  "relatorio",
  "administracaoSistema",
  "cadastrosGerais",
];

function normalizar(valor) {
  return String(valor ?? "")
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

function parseArray(raw) {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function maiorSequencia(snap) {
  return snap.docs.reduce((max, d) => Math.max(max, Number(d.data().nr_sequencia) || 0), 0);
}

/** Cria o documento, registra a auditoria de criação e sincroniza o contador. */
async function criarComAuditoria(nomeColecao, contador, dados) {
  const ref = doc(collection(db, nomeColecao));
  await setDoc(ref, dados);
  await addDoc(collection(db, nomeColecao, ref.id, "auditoria"), {
    usuarioId: null,
    usuarioNome: USUARIO_IMPLANTACAO,
    acao: "create",
    timestamp: DATA_IMPLANTACAO,
    detalhes: dados,
  });
  await setDoc(doc(db, "_counters", contador), { current: dados.nr_sequencia }, { merge: true });
  return ref.id;
}

async function semearPerfilAdministrador() {
  const snap = await getDocs(collection(db, "perfil"));
  const existente = snap.docs.find((d) => normalizar(d.data().ds_perfil) === "administrador");
  if (existente) {
    console.log(`ℹ️  perfil: Administrador já existe (${existente.data().nr_sequencia})`);
    return Number(existente.data().nr_sequencia);
  }

  const nr_sequencia = maiorSequencia(snap) + 1;
  if (DRY_RUN) {
    console.log(`👀 perfil: Administrador seria inserido (${nr_sequencia})`);
    return nr_sequencia;
  }

  await criarComAuditoria("perfil", "perfil_sequence", {
    nr_sequencia,
    ds_perfil: "Administrador",
    ds_observacao: "Perfil padrão do sistema com acesso a todas as funções.",
    ie_status: "A",
    config_funcoes: JSON.stringify(TODAS_FUNCOES),
    dt_criacao: DATA_IMPLANTACAO,
    dt_alteracao: DATA_IMPLANTACAO,
    ds_usuario_criacao: USUARIO_IMPLANTACAO,
    ds_usuario_alteracao: USUARIO_IMPLANTACAO,
  });
  console.log(`✅ perfil: Administrador inserido (${nr_sequencia})`);
  return nr_sequencia;
}

async function semearUsuarioAdministrador(perfilSeq) {
  const snap = await getDocs(collection(db, "usuario"));
  const existente = snap.docs.find((d) => normalizar(d.data().ds_usuario) === USUARIO_ADMIN.ds_usuario);

  if (existente) {
    const perfis = parseArray(existente.data().config_perfis);
    if (perfis.includes(perfilSeq)) {
      console.log(`ℹ️  usuario: administrador já existe e já possui o perfil (${perfilSeq})`);
      return;
    }
    if (DRY_RUN) {
      console.log(`👀 usuario: administrador existente receberia o perfil (${perfilSeq})`);
      return;
    }
    await setDoc(
      doc(db, "usuario", existente.id),
      { config_perfis: JSON.stringify([...perfis, perfilSeq]), config_perfil_ativo: String(perfilSeq) },
      { merge: true }
    );
    console.log(`✅ usuario: administrador existente vinculado ao perfil (${perfilSeq})`);
    return;
  }

  const nr_sequencia = maiorSequencia(snap) + 1;
  if (DRY_RUN) {
    console.log(`👀 usuario: administrador seria inserido (${nr_sequencia}) com o perfil (${perfilSeq})`);
    return;
  }

  await criarComAuditoria("usuario", "usuario_sequence", {
    nr_sequencia,
    ds_usuario: USUARIO_ADMIN.ds_usuario,
    ds_usuario_alternativo: USUARIO_ADMIN.ds_usuario_alternativo,
    // SHA-256 em hexadecimal — mesmo formato que o hashPassword do login
    ds_senha: createHash("sha256").update(USUARIO_ADMIN.senha).digest("hex"),
    ds_observacao: "",
    ie_status: "A",
    config_perfis: JSON.stringify([perfilSeq]),
    config_perfil_ativo: String(perfilSeq),
    dt_criacao: DATA_IMPLANTACAO,
    dt_alteracao: DATA_IMPLANTACAO,
    ds_usuario_criacao: USUARIO_IMPLANTACAO,
    ds_usuario_alteracao: USUARIO_IMPLANTACAO,
  });
  console.log(`✅ usuario: administrador inserido (${nr_sequencia}) com o perfil (${perfilSeq})`);
}

/* ------------------------------------------------------------------ */
/*  Cadastros Gerais                                                  */
/* ------------------------------------------------------------------ */

/* Listas em ordem alfabética ("Outro"/"Não declarada" por último): a ordem
   define o nr_sequencia de cada registro. */
const CARGOS = [
  "Administrador(a)", "Agente de Organização Escolar", "Analista Administrativo",
  "Analista de Recursos Humanos", "Analista de TI", "Analista Financeiro",
  "Aprendiz", "Assessor(a)", "Assistente Administrativo",
  "Assistente de Recursos Humanos", "Assistente de TI", "Assistente Financeiro",
  "Auxiliar Administrativo", "Auxiliar de Biblioteca", "Auxiliar de Classe",
  "Auxiliar de Manutenção", "Auxiliar de Recursos Humanos", "Auxiliar de Serviços Gerais",
  "Auxiliar de TI", "Auxiliar Financeiro", "Bibliotecário(a)",
  "Consultor(a)", "Coordenador(a)", "Coordenador(a) Pedagógico(a)",
  "Cozinheiro(a)", "Cuidador(a)", "Diretor(a)",
  "Estagiário(a)", "Inspetor(a) de Alunos", "Intérprete de Libras",
  "Merendeiro(a)", "Monitor(a)", "Motorista",
  "Nutricionista", "Orientador(a) Educacional", "Porteiro(a)",
  "Professor(a)", "Professor(a) Auxiliar", "Psicólogo(a)",
  "Psicopedagogo(a)", "Recepcionista", "Secretário(a)",
  "Supervisor(a) Escolar", "Técnico(a) de Enfermagem", "Técnico(a) de Manutenção",
  "Vice-diretor(a)", "Vigia", "Zelador(a)",
];

const CORES_RACAS = [
  "Amarela", "Branca", "Indígena", "Parda", "Preta", "Não declarada",
];

const ESTADOS_CIVIS = [
  "Casado", "Divorciado", "Separado judicialmente", "Solteiro",
  "União estável", "Viúvo", "Outro",
];

const GRAUS_PARENTESCO = [
  "Avó", "Avô", "Companheira", "Companheiro", "Curador", "Curadora",
  "Enteada", "Enteado", "Guardiã", "Guardião", "Irmã", "Irmão",
  "Madrasta", "Mãe", "Mãe adotiva", "Padrasto", "Pai", "Pai adotivo",
  "Prima", "Primo", "Responsável legal", "Tia", "Tio", "Tutor",
  "Tutora", "Outro",
];

/* [sigla, descrição] */
const LOGRADOUROS = [
  ["AL", "Alameda"],
  ["AV", "Avenida"],
  ["BC", "Beco"],
  ["BLV", "Boulevard"],
  ["CAM", "Caminho"],
  ["CH", "Chácara"],
  ["COL", "Colônia"],
  ["COND", "Condomínio"],
  ["CJ", "Conjunto"],
  ["DT", "Distrito"],
  ["ESPL", "Esplanada"],
  ["ET", "Estação"],
  ["EST", "Estrada"],
  ["FAZ", "Fazenda"],
  ["FLR", "Floresta"],
  ["GAL", "Galeria"],
  ["JD", "Jardim"],
  ["LD", "Ladeira"],
  ["LGO", "Largo"],
  ["LOT", "Loteamento"],
  ["MOR", "Morro"],
  ["NCL", "Núcleo"],
  ["PQ", "Parque"],
  ["PSG", "Passagem"],
  ["PS", "Passarela"],
  ["PTO", "Pátio"],
  ["PC", "Praça"],
  ["PR", "Praia"],
  ["PROL", "Prolongamento"],
  ["QD", "Quadra"],
  ["QT", "Quinta"],
  ["RCN", "Recanto"],
  ["ROD", "Rodovia"],
  ["R", "Rua"],
  ["SVD", "Servidão"],
  ["ST", "Sítio"],
  ["TV", "Travessa"],
  ["TR", "Trecho"],
  ["TRV", "Trevo"],
  ["VLE", "Vale"],
  ["VR", "Vereda"],
  ["VIA", "Via"],
  ["VLA", "Viela"],
  ["VL", "Vila"],
  ["ZZ", "Zigue-zague"],
];

const MARCAS = [
  "Acer", "AOC", "Apple", "Arno", "Asus", "BenQ", "Brastemp", "Britânia",
  "Brother", "Canon", "Cisco", "Consul", "Dell", "Electrolux", "Elgin", "Epson",
  "Hikvision", "HP", "Intelbras", "JBL", "Lenovo", "LG", "Logitech", "Microsoft",
  "Mondial", "Motorola", "Multilaser", "Optoma", "Panasonic", "Philips", "Positivo", "Samsung",
  "Sony", "TP-Link", "Ubiquiti", "ViewSonic", "Xerox",
];

/* [sigla, descrição] */
const ORGAOS_EMISSORES = [
  ["CART", "Cartório"],
  ["RCPN", "Cartório de Registro Civil"],
  ["CRA", "Conselho Regional de Administração"],
  ["CRB", "Conselho Regional de Biblioteconomia"],
  ["CRBio", "Conselho Regional de Biologia"],
  ["CRC", "Conselho Regional de Contabilidade"],
  ["CRECI", "Conselho Regional de Corretores de Imóveis"],
  ["CRE", "Conselho Regional de Economia"],
  ["CREF", "Conselho Regional de Educação Física"],
  ["COREN", "Conselho Regional de Enfermagem"],
  ["CREA", "Conselho Regional de Engenharia e Agronomia"],
  ["CRF", "Conselho Regional de Farmácia"],
  ["CREFITO", "Conselho Regional de Fisioterapia e Terapia Ocupacional"],
  ["CRM", "Conselho Regional de Medicina"],
  ["CRMV", "Conselho Regional de Medicina Veterinária"],
  ["CRN", "Conselho Regional de Nutrição"],
  ["CRO", "Conselho Regional de Odontologia"],
  ["CRP", "Conselho Regional de Psicologia"],
  ["CRQ", "Conselho Regional de Química"],
  ["CRESS", "Conselho Regional de Serviço Social"],
  ["CGJ", "Corregedoria Geral da Justiça"],
  ["DPF", "Departamento de Polícia Federal"],
  ["DETRAN", "Departamento Estadual de Trânsito"],
  ["DIC", "Divisão de Identificação Civil"],
  ["EB", "Exército Brasileiro"],
  ["FAB", "Força Aérea Brasileira"],
  ["II", "Instituto de Identificação do Estado"],
  ["IPF", "Instituto de Polícia Federal"],
  ["IFP", "Instituto Félix Pacheco"],
  ["MB", "Marinha do Brasil"],
  ["MJ", "Ministério da Justiça"],
  ["MRE", "Ministério das Relações Exteriores"],
  ["MTE", "Ministério do Trabalho e Emprego"],
  ["OAB", "Ordem dos Advogados do Brasil"],
  ["PC", "Polícia Civil"],
  ["PF", "Polícia Federal"],
  ["PM", "Polícia Militar"],
  ["PRF", "Polícia Rodoviária Federal"],
  ["SRF", "Secretaria da Receita Federal"],
  ["SDS", "Secretaria de Defesa Social"],
  ["SESDEC", "Secretaria de Estado de Segurança e Defesa Civil"],
  ["SESP", "Secretaria de Estado de Segurança Pública"],
  ["SEGUP", "Secretaria de Estado de Segurança Pública e Defesa Social"],
  ["SJCDH", "Secretaria de Justiça, Cidadania e Direitos Humanos"],
  ["SSI", "Secretaria de Segurança Interna"],
  ["SSP", "Secretaria de Segurança Pública"],
  ["SSPDS", "Secretaria de Segurança Pública e Defesa Social"],
  ["VRP", "Vara de Registros Públicos"],
];

/* [código CBO (sem máscara), descrição] */
const PROFISSOES = [
  ["516305", "Açougueiro"],
  ["223910", "Acupunturista"],
  ["252105", "Administrador"],
  ["212305", "Administrador de Banco de Dados"],
  ["212310", "Administrador de Redes"],
  ["241005", "Advogado"],
  ["515105", "Agente Comunitário de Saúde"],
  ["517220", "Agente de Trânsito"],
  ["621005", "Agricultor"],
  ["611005", "Agropecuarista"],
  ["414105", "Almoxarife"],
  ["354205", "Analista de Compras"],
  ["252525", "Analista de Crédito"],
  ["317210", "Analista de Infraestrutura"],
  ["342125", "Analista de Logística"],
  ["253115", "Analista de Marketing"],
  ["351105", "Analista de Qualidade"],
  ["252405", "Analista de Recursos Humanos"],
  ["212405", "Analista de Sistemas"],
  ["252545", "Analista Financeiro"],
  ["251315", "Antropólogo"],
  ["261310", "Apresentador"],
  ["251305", "Arqueólogo"],
  ["214105", "Arquiteto"],
  ["261210", "Arquivista"],
  ["376105", "Artesão"],
  ["262205", "Artista Plástico"],
  ["411005", "Assistente Administrativo"],
  ["516705", "Astrólogo"],
  ["211105", "Astrônomo"],
  ["422125", "Atendente"],
  ["262805", "Ator"],
  ["262805", "Atriz"],
  ["253105", "Atuário"],
  ["252210", "Auditor"],
  ["411010", "Auxiliar Administrativo"],
  ["513210", "Auxiliar de Cozinha"],
  ["322225", "Auxiliar de Enfermagem"],
  ["715505", "Azulejista"],
  ["516110", "Barbeiro"],
  ["513425", "Barista"],
  ["513405", "Barman"],
  ["261205", "Bibliotecário"],
  ["221105", "Biólogo"],
  ["221205", "Biomédica"],
  ["221205", "Biomédico"],
  ["517110", "Bombeiro Civil"],
  ["715210", "Bombeiro Hidráulico"],
  ["516105", "Cabeleireiro"],
  ["421105", "Caixa"],
  ["421125", "Caixa Bancário"],
  ["513315", "Camareira"],
  ["262610", "Cantor"],
  ["771110", "Carpinteiro"],
  ["783225", "Carregador"],
  ["262415", "Cartunista"],
  ["262805", "Cenógrafo"],
  ["752105", "Ceramista"],
  ["354825", "Cerimonialista"],
  ["513435", "Chapeiro"],
  ["513215", "Churrasqueiro"],
  ["271110", "Cinegrafista"],
  ["141410", "Comerciante"],
  ["312210", "Comissário de Bordo"],
  ["261510", "Compositor"],
  ["354210", "Comprador"],
  ["848310", "Confeiteiro"],
  ["414205", "Conferente"],
  ["354145", "Consultor de Vendas"],
  ["241040", "Consultor Jurídico"],
  ["252205", "Contador"],
  ["252220", "Controlador Interno"],
  ["239405", "Coordenador Pedagógico"],
  ["513405", "Copeiro"],
  ["262110", "Coreógrafo"],
  ["354105", "Corretor de Imóveis"],
  ["351720", "Corretor de Seguros"],
  ["513205", "Cozinheiro"],
  ["516210", "Cuidador de Idosos"],
  ["262105", "Dançarino"],
  ["241230", "Defensor Público"],
  ["242205", "Delegado"],
  ["223205", "Dentista"],
  ["516805", "Depiladora"],
  ["318010", "Desenhista Técnico"],
  ["212405", "Desenvolvedor de Software"],
  ["317110", "Desenvolvedor Mobile"],
  ["317105", "Desenvolvedor Web"],
  ["262405", "Designer Gráfico"],
  ["342205", "Despachante"],
  ["351805", "Detetive"],
  ["516220", "Diarista"],
  ["262405", "Diretor de Arte"],
  ["131205", "Diretor de Escola"],
  ["376405", "Disc Jockey"],
  ["251105", "Economista"],
  ["261620", "Editor de Vídeo"],
  ["224140", "Educador Físico"],
  ["715205", "Eletricista"],
  ["731105", "Eletricista Industrial"],
  ["715615", "Eletricista Predial"],
  ["724105", "Encanador"],
  ["223505", "Enfermeiro"],
  ["222205", "Engenheiro Agrônomo"],
  ["222115", "Engenheiro Ambiental"],
  ["214205", "Engenheiro Civil"],
  ["214605", "Engenheiro de Alimentos"],
  ["213105", "Engenheiro de Minas"],
  ["214305", "Engenheiro de Produção"],
  ["212405", "Engenheiro de Software"],
  ["215105", "Engenheiro Elétrico"],
  ["215205", "Engenheiro Eletrônico"],
  ["214405", "Engenheiro Mecânico"],
  ["214605", "Engenheiro Químico"],
  ["519105", "Entregador"],
  ["262105", "Escritor"],
  ["262420", "Escultor"],
  ["763310", "Estampador"],
  ["253205", "Estatístico"],
  ["322130", "Esteticista"],
  ["414115", "Estoquista"],
  ["414215", "Expedidor"],
  ["223405", "Farmacêutico"],
  ["223415", "Farmacêutico Industrial"],
  ["514305", "Faxineiro"],
  ["724205", "Ferramenteiro"],
  ["262810", "Figurinista"],
  ["251405", "Filósofo"],
  ["213105", "Físico"],
  ["223605", "Fisioterapeuta"],
  ["613205", "Floricultor"],
  ["223805", "Fonoaudiólogo"],
  ["271105", "Fotógrafo"],
  ["721220", "Fresador"],
  ["724315", "Funileiro"],
  ["513415", "Garçom"],
  ["221105", "Geneticista"],
  ["251310", "Geógrafo"],
  ["216105", "Geólogo"],
  ["142315", "Gerente Comercial"],
  ["142110", "Gerente de Banco"],
  ["142120", "Gerente de Loja"],
  ["142320", "Gerente de Vendas"],
  ["716510", "Gesseiro"],
  ["252405", "Gestor de Pessoas"],
  ["142520", "Gestor de Projetos"],
  ["513305", "Governanta"],
  ["517215", "Guarda Municipal"],
  ["511105", "Guias de Turismo"],
  ["251125", "Historiador"],
  ["122505", "Hoteleiro"],
  ["374125", "Iluminador"],
  ["262410", "Ilustrador"],
  ["333115", "Instrutor de Cursos"],
  ["261410", "Intérprete"],
  ["517225", "Investigador"],
  ["622005", "Jardinheiro"],
  ["261305", "Jornalista"],
  ["241205", "Juiz"],
  ["516310", "Lavadeiro"],
  ["142205", "Leiloeiro"],
  ["391125", "Locutor"],
  ["513410", "Maître"],
  ["514315", "Manicure"],
  ["377130", "Maquiador"],
  ["771105", "Marceneiro"],
  ["322115", "Massoterapeuta"],
  ["213205", "Matemático"],
  ["913115", "Mecânico"],
  ["914110", "Mecânico de Automóveis"],
  ["223105", "Médico"],
  ["710105", "Mestre de Obras"],
  ["721215", "Metalúrgico"],
  ["211115", "Meteorologista"],
  ["513215", "Mordomo"],
  ["519110", "Motoboy"],
  ["782305", "Motorista"],
  ["782510", "Motorista de Caminhão"],
  ["782315", "Motorista de Ônibus"],
  ["261215", "Museólogo"],
  ["262605", "Músico"],
  ["142135", "Notário"],
  ["223710", "Nutricionista"],
  ["223115", "Obstetra"],
  ["223224", "Oceanógrafo"],
  ["242225", "Oficial de Justiça"],
  ["421105", "Operador de Caixa"],
  ["862120", "Operador de Caldeira"],
  ["632125", "Operador de Colheitadeira"],
  ["782210", "Operador de Empilhadeira"],
  ["841420", "Operador de Máquinas"],
  ["784205", "Operador de Produção"],
  ["715140", "Operador de Retroescavadeira"],
  ["354820", "Organizador de Eventos"],
  ["239410", "Orientador Educacional"],
  ["848305", "Padeiro"],
  ["211210", "Paleontólogo"],
  ["516325", "Passadeira"],
  ["239405", "Pedagogo"],
  ["514315", "Pedicure"],
  ["715105", "Pedreiro"],
  ["276320", "Percussionista"],
  ["212430", "Perito Criminal"],
  ["224140", "Personal Trainer"],
  ["632105", "Pescador"],
  ["203005", "Pesquisador"],
  ["312205", "Piloto de Aeronaves"],
  ["723105", "Pintor"],
  ["716610", "Pintor Predial"],
  ["261425", "Poeta"],
  ["517205", "Porteiro"],
  ["241115", "Procurador"],
  ["354820", "Produtor de Eventos"],
  ["376315", "Produtor Musical"],
  ["231205", "Professor"],
  ["224105", "Professor de Educação Física"],
  ["232125", "Professor de Idiomas"],
  ["233225", "Professor de Música"],
  ["231305", "Professor Universitário"],
  ["212420", "Programador"],
  ["241305", "Promotor de Justiça"],
  ["521130", "Promotor de Vendas"],
  ["251505", "Psicólogo"],
  ["252305", "Publicitário"],
  ["213405", "Químico"],
  ["213215", "Químico Industrial"],
  ["223915", "Quiropraxista"],
  ["324110", "Radiologista"],
  ["422105", "Recepcionista"],
  ["422110", "Recepcionista de Hotel"],
  ["261130", "Redator"],
  ["142135", "Registrador"],
  ["261125", "Repórter"],
  ["354205", "Representante Comercial"],
  ["261425", "Revisor de Textos"],
  ["252320", "Secretário Executivo"],
  ["517330", "Segurança Particular"],
  ["724440", "Serralheiro"],
  ["717005", "Servente de Obras"],
  ["251120", "Sociólogo"],
  ["723305", "Soldador"],
  ["513440", "Sommelier"],
  ["374140", "Sonoplasta"],
  ["239415", "Supervisor de Ensino"],
  ["317105", "Suporte Técnico"],
  ["142130", "Tabelião"],
  ["516810", "Tatuador"],
  ["782310", "Taxista"],
  ["322230", "Técnico de Enfermagem"],
  ["317110", "Técnico de Informática"],
  ["911105", "Técnico de Manutenção"],
  ["911305", "Técnico de Refrigeração"],
  ["351115", "Técnico em Logística"],
  ["351605", "Técnico em Segurança do Trabalho"],
  ["422305", "Teleoperador"],
  ["715525", "Telhadista"],
  ["223905", "Terapeuta Ocupacional"],
  ["413115", "Tesoureiro"],
  ["317110", "Testador de Software"],
  ["312405", "Topógrafo"],
  ["721105", "Torneiro Mecânico"],
  ["261405", "Tradutor"],
  ["632125", "Tratorista"],
  ["122520", "Turismólogo"],
  ["214105", "Urbanista"],
  ["262410", "UX Designer"],
  ["521105", "Vendedor"],
  ["521110", "Vendedor Externo"],
  ["521105", "Vendedor Interno"],
  ["223305", "Veterinário"],
  ["715535", "Vidraceiro"],
  ["517305", "Vigilante"],
  ["317120", "Web Designer"],
  ["514105", "Zelador"],
];

const SEXOS = [
  "Feminino", "Masculino", "Outro",
];

const SISTEMAS_OPERACIONAIS = [
  "AlmaLinux", "Android", "ChromeOS", "Debian", "Fedora",
  "iOS", "iPadOS", "Linux Educacional", "macOS", "Mint",
  "Ubuntu", "Windows 10", "Windows 11", "Windows 7", "Windows Server",
];

const VINCULOS_CONTRATUAIS = [
  "Autônomo", "CLT", "Contrato Temporário", "Estágio", "Estatutário",
  "Intermitente", "Jovem Aprendiz", "Prestador de Serviço", "Voluntário",
];

const CADASTROS_GERAIS = [
  { colecao: "cg_cargo", campo: "ds_cargo", registros: CARGOS.map((ds) => ({ ds_cargo: ds })) },
  { colecao: "cg_cor_raca", campo: "ds_cor_raca", registros: CORES_RACAS.map((ds) => ({ ds_cor_raca: ds })) },
  { colecao: "cg_estado_civil", campo: "ds_estado_civil", registros: ESTADOS_CIVIS.map((ds) => ({ ds_estado_civil: ds })) },
  { colecao: "cg_grau_parentesco", campo: "ds_grau_parentesco", registros: GRAUS_PARENTESCO.map((ds) => ({ ds_grau_parentesco: ds })) },
  { colecao: "cg_logradouro", campo: "ds_logradouro", registros: LOGRADOUROS.map(([sg, ds]) => ({ sg_logradouro: sg, ds_logradouro: ds })) },
  { colecao: "cg_marca", campo: "ds_marca", registros: MARCAS.map((ds) => ({ ds_marca: ds })) },
  { colecao: "cg_orgao_emissor", campo: "ds_orgao_emissor", registros: ORGAOS_EMISSORES.map(([sg, ds]) => ({ sg_orgao_emissor: sg, ds_orgao_emissor: ds })) },
  { colecao: "cg_profissao", campo: "ds_profissao", registros: PROFISSOES.map(([cbo, ds]) => ({ ds_profissao: ds, nr_cbo: cbo })) },
  { colecao: "cg_sexo", campo: "ds_sexo", registros: SEXOS.map((ds) => ({ ds_sexo: ds })) },
  { colecao: "cg_sistema_operacional", campo: "ds_sistema_operacional", registros: SISTEMAS_OPERACIONAIS.map((ds) => ({ ds_sistema_operacional: ds })) },
  { colecao: "cg_vinculo_contratual", campo: "ds_vinculo_contratual", registros: VINCULOS_CONTRATUAIS.map((ds) => ({ ds_vinculo_contratual: ds })) },
];

/** Insere os registros que ainda não existem (comparação pela descrição) e sincroniza o contador. */
async function semearCadastroGeral({ colecao, campo, registros }) {
  const snap = await getDocs(collection(db, colecao));
  const existentes = new Set(snap.docs.map((d) => normalizar(d.data()[campo])));
  const novos = registros.filter((r) => !existentes.has(normalizar(r[campo])));
  let seq = maiorSequencia(snap);

  if (novos.length === 0) {
    console.log(`ℹ️  ${colecao}: nada a inserir (${snap.size} já existem)`);
    return;
  }
  if (DRY_RUN) {
    console.log(`👀 ${colecao}: ${novos.length} seriam inseridos`);
    return;
  }

  // 2 operações por registro (documento + auditoria): lotes de 200 ficam abaixo do limite de 500.
  for (let i = 0; i < novos.length; i += 200) {
    const batch = writeBatch(db);
    for (const registro of novos.slice(i, i + 200)) {
      seq += 1;
      const ref = doc(collection(db, colecao));
      const dados = {
        ...registro,
        nr_sequencia: seq,
        ie_status: "A",
        dt_criacao: DATA_IMPLANTACAO,
        dt_alteracao: DATA_IMPLANTACAO,
        ds_usuario_criacao: USUARIO_IMPLANTACAO,
        ds_usuario_alteracao: USUARIO_IMPLANTACAO,
      };
      batch.set(ref, dados);
      batch.set(doc(collection(db, colecao, ref.id, "auditoria")), {
        usuarioId: null,
        usuarioNome: USUARIO_IMPLANTACAO,
        acao: "create",
        timestamp: DATA_IMPLANTACAO,
        detalhes: dados,
      });
    }
    await batch.commit();
  }
  await setDoc(doc(db, "_counters", `${colecao}_sequence`), { current: seq }, { merge: true });
  console.log(`✅ ${colecao}: ${novos.length} inseridos`);
}

async function main() {
  console.log(`🌱 Seeder — Implantação inicial${DRY_RUN ? " (dry-run)" : ""}\n`);
  const perfilSeq = await semearPerfilAdministrador();
  await semearUsuarioAdministrador(perfilSeq);
  for (const cadastro of CADASTROS_GERAIS) await semearCadastroGeral(cadastro);
  console.log(DRY_RUN ? "\n👀 Dry-run concluído. Nada foi escrito." : "\n🎉 Concluído!");
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
