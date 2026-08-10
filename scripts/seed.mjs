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
 *   - cg_orgao_emissor → órgãos emissores de documentos de identificação
 *   - cg_logradouro    → tipos de logradouro com as siglas oficiais (Correios)
 *   - cg_grau_parentesco → graus de parentesco (escolar: responsáveis)
 *   - cg_cargo          → cargos (escolar: colaboradores)
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

const SEXOS = ["Masculino", "Feminino", "Outro"];

const ESTADOS_CIVIS = [
  "Solteiro",
  "Casado",
  "Separado judicialmente",
  "Divorciado",
  "Viúvo",
  "União estável",
  "Outro",
];

const CORES_RACAS = ["Branca", "Preta", "Parda", "Amarela", "Indígena"];

const GRAUS_PARENTESCO = [
  "Avó",
  "Avô",
  "Companheira",
  "Companheiro",
  "Curadora",
  "Curador",
  "Enteada",
  "Enteado",
  "Guardiã",
  "Guardião",
  "Irmã",
  "Irmão",
  "Madrasta",
  "Mãe",
  "Mãe adotiva",
  "Pai",
  "Pai adotivo",
  "Padrasto",
  "Prima",
  "Primo",
  "Responsável legal",
  "Tia",
  "Tio",
  "Tutora",
  "Tutor",
  "Outro",
];

/* Cargos (funções exercidas por colaboradores/alunos no ambiente escolar).
   Lista inicial de cargos comuns — o usuário pode cadastrar novos pela tela. */
const CARGOS = [
  "Administrador(a)",
  "Analista Administrativo",
  "Analista de Recursos Humanos",
  "Analista de TI",
  "Analista Financeiro",
  "Aprendiz",
  "Assessor(a)",
  "Assistente Administrativo",
  "Assistente de Recursos Humanos",
  "Assistente de TI",
  "Assistente Financeiro",
  "Auxiliar Administrativo",
  "Auxiliar de Manutenção",
  "Auxiliar de Recursos Humanos",
  "Auxiliar de Serviços Gerais",
  "Auxiliar de TI",
  "Auxiliar Financeiro",
  "Bibliotecário(a)",
  "Consultor(a)",
  "Coordenador(a)",
  "Cozinheiro(a)",
  "Diretor(a)",
  "Estagiário(a)",
  "Monitor(a)",
  "Motorista",
  "Nutricionista",
  "Porteiro(a)",
  "Professor(a)",
  "Psicólogo(a)",
  "Recepcionista",
  "Secretário(a)",
  "Técnico(a) de Manutenção",
  "Vigia",
  "Zelador(a)",
];

/* Vínculos contratuais (forma de contratação de colaboradores). */
const VINCULOS_CONTRATUAIS = [
  "CLT",
  "Estágio",
  "Prestador de Serviço",
];

/* Órgãos emissores de documentos de identificação no Brasil
   (RG, CTPS, CNH, passaporte, registros profissionais etc.).
   Cada item é { sg_orgao_emissor, ds_orgao_emissor } — a sigla fica em
   campo próprio e a descrição contém apenas o nome do órgão. */
const ORGAOS_EMISSORES = [
  // Órgãos de segurança pública e identificação
  { sg_orgao_emissor: "SSP",    ds_orgao_emissor: "Secretaria de Segurança Pública" },
  { sg_orgao_emissor: "SSI",    ds_orgao_emissor: "Secretaria de Segurança Interna" },
  { sg_orgao_emissor: "SDS",    ds_orgao_emissor: "Secretaria de Defesa Social" },
  { sg_orgao_emissor: "SESP",   ds_orgao_emissor: "Secretaria de Estado de Segurança Pública" },
  { sg_orgao_emissor: "SEGUP",  ds_orgao_emissor: "Secretaria de Estado de Segurança Pública e Defesa Social" },
  { sg_orgao_emissor: "SSPDS",  ds_orgao_emissor: "Secretaria de Segurança Pública e Defesa Social" },
  { sg_orgao_emissor: "SESDEC", ds_orgao_emissor: "Secretaria de Estado de Segurança e Defesa Civil" },
  { sg_orgao_emissor: "SJCDH",  ds_orgao_emissor: "Secretaria de Justiça, Cidadania e Direitos Humanos" },
  { sg_orgao_emissor: "PC",     ds_orgao_emissor: "Polícia Civil" },
  { sg_orgao_emissor: "PM",     ds_orgao_emissor: "Polícia Militar" },
  { sg_orgao_emissor: "PF",     ds_orgao_emissor: "Polícia Federal" },
  { sg_orgao_emissor: "PRF",    ds_orgao_emissor: "Polícia Rodoviária Federal" },
  { sg_orgao_emissor: "DPF",    ds_orgao_emissor: "Departamento de Polícia Federal" },
  { sg_orgao_emissor: "DETRAN", ds_orgao_emissor: "Departamento Estadual de Trânsito" },
  { sg_orgao_emissor: "IFP",    ds_orgao_emissor: "Instituto Félix Pacheco" },
  { sg_orgao_emissor: "IPF",    ds_orgao_emissor: "Instituto de Polícia Federal" },
  { sg_orgao_emissor: "DIC",    ds_orgao_emissor: "Divisão de Identificação Civil" },
  { sg_orgao_emissor: "",      ds_orgao_emissor: "Instituto de Identificação do Estado" },
  { sg_orgao_emissor: "CART",   ds_orgao_emissor: "Cartório" },
  { sg_orgao_emissor: "",      ds_orgao_emissor: "Cartório de Registro Civil" },
  { sg_orgao_emissor: "",      ds_orgao_emissor: "Vara de Registros Públicos" },
  { sg_orgao_emissor: "",      ds_orgao_emissor: "Corregedoria Geral da Justiça" },

  // Órgãos federais
  { sg_orgao_emissor: "MTE", ds_orgao_emissor: "Ministério do Trabalho e Emprego" },
  { sg_orgao_emissor: "MJ",  ds_orgao_emissor: "Ministério da Justiça" },
  { sg_orgao_emissor: "SRF", ds_orgao_emissor: "Secretaria da Receita Federal" },
  { sg_orgao_emissor: "MRE", ds_orgao_emissor: "Ministério das Relações Exteriores" },

  // Forças armadas
  { sg_orgao_emissor: "EB",  ds_orgao_emissor: "Exército Brasileiro" },
  { sg_orgao_emissor: "MB",  ds_orgao_emissor: "Marinha do Brasil" },
  { sg_orgao_emissor: "FAB", ds_orgao_emissor: "Força Aérea Brasileira" },

  // Conselhos profissionais
  { sg_orgao_emissor: "OAB",     ds_orgao_emissor: "Ordem dos Advogados do Brasil" },
  { sg_orgao_emissor: "CRM",     ds_orgao_emissor: "Conselho Regional de Medicina" },
  { sg_orgao_emissor: "COREN",   ds_orgao_emissor: "Conselho Regional de Enfermagem" },
  { sg_orgao_emissor: "CRO",     ds_orgao_emissor: "Conselho Regional de Odontologia" },
  { sg_orgao_emissor: "CRF",     ds_orgao_emissor: "Conselho Regional de Farmácia" },
  { sg_orgao_emissor: "CRP",     ds_orgao_emissor: "Conselho Regional de Psicologia" },
  { sg_orgao_emissor: "CREFITO", ds_orgao_emissor: "Conselho Regional de Fisioterapia e Terapia Ocupacional" },
  { sg_orgao_emissor: "CREF",    ds_orgao_emissor: "Conselho Regional de Educação Física" },
  { sg_orgao_emissor: "CREA",    ds_orgao_emissor: "Conselho Regional de Engenharia e Agronomia" },
  { sg_orgao_emissor: "CRC",     ds_orgao_emissor: "Conselho Regional de Contabilidade" },
  { sg_orgao_emissor: "CRA",     ds_orgao_emissor: "Conselho Regional de Administração" },
  { sg_orgao_emissor: "CRECI",   ds_orgao_emissor: "Conselho Regional de Corretores de Imóveis" },
  { sg_orgao_emissor: "CRMV",    ds_orgao_emissor: "Conselho Regional de Medicina Veterinária" },
  { sg_orgao_emissor: "CRQ",     ds_orgao_emissor: "Conselho Regional de Química" },
  { sg_orgao_emissor: "CRB",     ds_orgao_emissor: "Conselho Regional de Biblioteconomia" },
  { sg_orgao_emissor: "CRE",     ds_orgao_emissor: "Conselho Regional de Economia" },
  { sg_orgao_emissor: "CRESS",   ds_orgao_emissor: "Conselho Regional de Serviço Social" },
  { sg_orgao_emissor: "CRN",     ds_orgao_emissor: "Conselho Regional de Nutrição" },
  { sg_orgao_emissor: "CRBio",   ds_orgao_emissor: "Conselho Regional de Biologia" },
];

/* Tipos de logradouro usados em endereços no Brasil, com as siglas
   oficiais da tabela de logradouros (Correios / Febraban). Cada item é
   { sg_logradouro, ds_logradouro } — a sigla fica em campo próprio e a
   descrição contém o nome completo do tipo de logradouro. */
const LOGRADOUROS = [
  { sg_logradouro: "AL",    ds_logradouro: "Alameda" },
  { sg_logradouro: "AV",    ds_logradouro: "Avenida" },
  { sg_logradouro: "BC",    ds_logradouro: "Beco" },
  { sg_logradouro: "BLV",   ds_logradouro: "Boulevard" },
  { sg_logradouro: "CAM",   ds_logradouro: "Caminho" },
  { sg_logradouro: "CH",    ds_logradouro: "Chácara" },
  { sg_logradouro: "COL",   ds_logradouro: "Colônia" },
  { sg_logradouro: "COND",  ds_logradouro: "Condomínio" },
  { sg_logradouro: "CJ",    ds_logradouro: "Conjunto" },
  { sg_logradouro: "DT",    ds_logradouro: "Distrito" },
  { sg_logradouro: "ESPL",  ds_logradouro: "Esplanada" },
  { sg_logradouro: "ET",    ds_logradouro: "Estação" },
  { sg_logradouro: "EST",   ds_logradouro: "Estrada" },
  { sg_logradouro: "FAZ",   ds_logradouro: "Fazenda" },
  { sg_logradouro: "FLR",   ds_logradouro: "Floresta" },
  { sg_logradouro: "GAL",   ds_logradouro: "Galeria" },
  { sg_logradouro: "JD",    ds_logradouro: "Jardim" },
  { sg_logradouro: "LD",    ds_logradouro: "Ladeira" },
  { sg_logradouro: "LGO",   ds_logradouro: "Largo" },
  { sg_logradouro: "LOT",   ds_logradouro: "Loteamento" },
  { sg_logradouro: "MOR",   ds_logradouro: "Morro" },
  { sg_logradouro: "NCL",   ds_logradouro: "Núcleo" },
  { sg_logradouro: "PQ",    ds_logradouro: "Parque" },
  { sg_logradouro: "PS",    ds_logradouro: "Passarela" },
  { sg_logradouro: "PSG",   ds_logradouro: "Passagem" },
  { sg_logradouro: "PTO",   ds_logradouro: "Pátio" },
  { sg_logradouro: "PC",    ds_logradouro: "Praça" },
  { sg_logradouro: "PR",    ds_logradouro: "Praia" },
  { sg_logradouro: "PROL",  ds_logradouro: "Prolongamento" },
  { sg_logradouro: "QD",    ds_logradouro: "Quadra" },
  { sg_logradouro: "QT",    ds_logradouro: "Quinta" },
  { sg_logradouro: "RCN",   ds_logradouro: "Recanto" },
  { sg_logradouro: "ROD",   ds_logradouro: "Rodovia" },
  { sg_logradouro: "R",     ds_logradouro: "Rua" },
  { sg_logradouro: "SVD",   ds_logradouro: "Servidão" },
  { sg_logradouro: "ST",    ds_logradouro: "Sítio" },
  { sg_logradouro: "TV",    ds_logradouro: "Travessa" },
  { sg_logradouro: "TR",    ds_logradouro: "Trecho" },
  { sg_logradouro: "TRV",   ds_logradouro: "Trevo" },
  { sg_logradouro: "VL",    ds_logradouro: "Vale" },
  { sg_logradouro: "VR",    ds_logradouro: "Vereda" },
  { sg_logradouro: "VIA",   ds_logradouro: "Via" },
  { sg_logradouro: "VLA",   ds_logradouro: "Viela" },
  { sg_logradouro: "VL",    ds_logradouro: "Vila" },
  { sg_logradouro: "ZZ",    ds_logradouro: "Zigue-zague" },
];

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

/* CBO (Classificação Brasileira de Ocupações — CBO 2002) por profissão.
   Apenas as profissões que possuem código oficial recebem nr_cbo; as demais
   (ocupações modernas sem código na CBO 2002) ficam sem o campo. */
const PROFISSOES_CBO = {
  // Saúde
  "Médico": "223105",
  "Enfermeiro": "223505",
  "Técnico de Enfermagem": "322230",
  "Auxiliar de Enfermagem": "322225",
  "Dentista": "223205",
  "Farmacêutico": "223405",
  "Fisioterapeuta": "223605",
  "Psicólogo": "251505",
  "Nutricionista": "223710",
  "Fonoaudiólogo": "223805",
  "Terapeuta Ocupacional": "223905",
  "Biomédico": "221205",
  "Biomédica": "221205",
  "Veterinário": "223305",
  "Radiologista": "324110",
  "Massoterapeuta": "322115",
  "Acupunturista": "223910",
  "Quiropraxista": "223915",
  "Agente Comunitário de Saúde": "515105",
  "Cuidador de Idosos": "516210",
  "Obstetra": "223115",

  // Engenharia e arquitetura
  "Engenheiro Civil": "214205",
  "Engenheiro Mecânico": "214405",
  "Engenheiro Elétrico": "215105",
  "Engenheiro Eletrônico": "215205",
  "Engenheiro Químico": "214605",
  "Engenheiro de Produção": "214305",
  "Engenheiro Agrônomo": "222205",
  "Arquiteto": "214105",
  "Urbanista": "214105",

  // Tecnologia da informação
  "Programador": "212420",
  "Desenvolvedor de Software": "212405",
  "Analista de Sistemas": "212405",
  "Administrador de Banco de Dados": "212305",
  "Administrador de Redes": "212310",
  "Suporte Técnico": "317105",

  // Educação
  "Professor": "231205",
  "Professor Universitário": "231305",
  "Pedagogo": "239405",
  "Professor de Educação Física": "224105",
  "Bibliotecário": "261205",

  // Direito
  "Advogado": "241005",
  "Juiz": "241205",
  "Promotor de Justiça": "241305",
  "Delegado": "242205",

  // Administração e finanças
  "Administrador": "252105",
  "Contador": "252205",
  "Economista": "251105",
  "Analista de Recursos Humanos": "252405",
  "Auditor": "252210",
  "Atuário": "253105",
  "Estatístico": "253205",
  "Assistente Administrativo": "411005",
  "Recepcionista": "422105",
  "Caixa": "421105",
  "Operador de Caixa": "421105",
  "Teleoperador": "422305",
  "Almoxarife": "414105",

  // Vendas e comércio
  "Vendedor": "521105",
  "Vendedor Interno": "521105",
  "Vendedor Externo": "521110",
  "Representante Comercial": "354205",
  "Comprador": "354210",
  "Corretor de Imóveis": "354105",

  // Indústria e ofícios
  "Operador de Empilhadeira": "782210",
  "Mecânico de Automóveis": "914110",
  "Eletricista": "715205",
  "Eletricista Industrial": "731105",
  "Soldador": "723305",
  "Torneiro Mecânico": "721105",
  "Marceneiro": "771105",
  "Carpinteiro": "771110",
  "Pedreiro": "715105",
  "Servente de Obras": "717005",
  "Mestre de Obras": "710105",
  "Pintor": "723105",
  "Encanador": "724105",
  "Padeiro": "848305",
  "Confeiteiro": "848310",
  "Cozinheiro": "513205",
  "Auxiliar de Cozinha": "513210",
  "Copeiro": "513405",
  "Garçom": "513415",
  "Açougueiro": "516305",
  "Agricultor": "621005",
  "Jardinheiro": "622005",

  // Transporte e logística
  "Motorista": "782305",
  "Motorista de Ônibus": "782315",
  "Motorista de Caminhão": "782305",
  "Taxista": "782310",
  "Entregador": "519105",
  "Conferente": "414205",
  "Piloto de Aeronaves": "312205",
  "Comissário de Bordo": "312210",

  // Comunicação e artes
  "Jornalista": "261305",
  "Tradutor": "261405",
  "Intérprete": "261410",
  "Publicitário": "252305",
  "Designer Gráfico": "262405",
  "Fotógrafo": "271105",
  "Ator": "262805",
  "Atriz": "262805",
  "Músico": "262605",
  "Cantor": "262610",
  "Escritor": "262105",

  // Serviços gerais
  "Porteiro": "517205",
  "Vigilante": "517305",
  "Zelador": "514105",
  "Faxineiro": "514305",
  "Manicure": "514315",
  "Pedicure": "514315",
  "Cabeleireiro": "516105",
  "Barbeiro": "516110",
  "Técnico em Segurança do Trabalho": "351605",

  // Ciências e pesquisa
  "Físico": "213105",
  "Químico": "213405",
  "Matemático": "213205",
  "Biólogo": "221105",

  // Outros
  "Guias de Turismo": "511105",
  "Hoteleiro": "122505",
  "Turismólogo": "122520",
  "Recepcionista de Hotel": "422110",
  "Camareira": "513315",
  "Governanta": "513305",
  "Mordomo": "513215",
  "Sommelier": "513440",
  "Barman": "513405",
  "Maître": "513410",
  "Barista": "513425",
  "Astrólogo": "516705",
  "Tatuador": "516810",
  "Depiladora": "516805",

  // Administração — cargos e finanças
  "Analista de Marketing": "253115",
  "Gerente de Vendas": "142320",
  "Gerente Comercial": "142315",
  "Gerente de Loja": "142120",
  "Gerente de Banco": "142110",
  "Leiloeiro": "142205",
  "Consultor de Vendas": "354145",
  "Promotor de Vendas": "521130",
  "Auxiliar Administrativo": "411010",
  "Caixa Bancário": "421125",
  "Secretário Executivo": "252320",
  "Estoquista": "414115",
  "Expedidor": "414215",
  "Carregador": "783225",
  "Técnico em Logística": "351115",

  // Direito e segurança
  "Defensor Público": "241230",
  "Oficial de Justiça": "242225",
  "Tabelião": "142130",
  "Notário": "142135",
  "Registrador": "142135",
  "Detetive": "351805",
  "Investigador": "517225",
  "Perito Criminal": "212430",
  "Agente de Trânsito": "517220",
  "Guarda Municipal": "517215",
  "Segurança Particular": "517330",

  // Educação
  "Coordenador Pedagógico": "239405",
  "Orientador Educacional": "239410",
  "Supervisor de Ensino": "239415",
  "Diretor de Escola": "131205",
  "Instrutor de Cursos": "333115",
  "Professor de Idiomas": "232125",
  "Professor de Música": "233225",
  "Educador Físico": "224140",
  "Personal Trainer": "224140",

  // Engenharia e ciências
  "Engenheiro Ambiental": "222115",
  "Geólogo": "216105",
  "Astrônomo": "211105",
  "Meteorologista": "211115",
  "Oceanógrafo": "223224",
  "Paleontólogo": "211210",
  "Antropólogo": "251315",
  "Arqueólogo": "251305",
  "Filósofo": "251405",
  "Geógrafo": "251310",
  "Sociólogo": "251120",
  "Historiador": "251125",
  "Químico Industrial": "213215",
  "Farmacêutico Industrial": "223415",
  "Pesquisador": "203005",

  // Indústria e ofícios
  "Operador de Produção": "784205",
  "Operador de Máquinas": "841420",
  "Operador de Caldeira": "862120",
  "Operador de Retroescavadeira": "715140",
  "Operador de Colheitadeira": "632125",
  "Tratorista": "632125",
  "Ferramenteiro": "724205",
  "Fresador": "721220",
  "Funileiro": "724315",
  "Serralheiro": "724440",
  "Gesseiro": "716510",
  "Azulejista": "715505",
  "Telhadista": "715525",
  "Vidraceiro": "715535",
  "Estampador": "763310",
  "Chapeiro": "513435",
  "Lavadeiro": "516310",
  "Passadeira": "516325",
  "Diarista": "516220",
  "Metalúrgico": "721215",
  "Mecânico": "913115",
  "Técnico de Manutenção": "911105",
  "Técnico de Refrigeração": "911305",
  "Esteticista": "322130",
  "Maquiador": "377130",
  "Pescador": "632105",
  "Agropecuarista": "611005",
  "Floricultor": "613205",

  // Comunicação e artes
  "Arquivista": "261210",
  "Museólogo": "261215",
  "Redator": "261130",
  "Repórter": "261125",
  "Locutor": "391125",
  "Cinegrafista": "271110",
  "Compositor": "261510",
  "Produtor Musical": "376315",
  "Produtor de Eventos": "354820",
  "Organizador de Eventos": "354820",
  "Cerimonialista": "354825",
  "Disc Jockey": "376405",
  "Poeta": "261425",
  "Percussionista": "276320",
  "Ilustrador": "262410",
  "Cartunista": "262415",
  "Escultor": "262420",
  "Ceramista": "752105",
  "Artesão": "376105",
  "Iluminador": "374125",
  "Sonoplasta": "374140",
  "Figurinista": "262810",
  "Artista Plástico": "262205",
  "Desenhista Técnico": "318010",
  "Topógrafo": "312405",
  "Web Designer": "317120",
  "Técnico de Informática": "317110",
  "Atendente": "422125",
  "Despachante": "342205",
  "Corretor de Seguros": "351720",

  // CBOs adicionados no levantamento completo
  "Gestor de Pessoas": "252405",
  "Consultor Jurídico": "241040",
  "Comerciante": "141410",
  "Analista Financeiro": "252545",
  "Desenvolvedor Mobile": "317110",
  "UX Designer": "262410",
  "Controlador Interno": "252220",
  "Engenheiro de Software": "212405",
  "Analista de Compras": "354205",
  "Procurador": "241115",
  "Engenheiro de Minas": "213105",
  "Desenvolvedor Web": "317105",
  "Coreógrafo": "262110",
  "Editor de Vídeo": "261620",
  "Analista de Infraestrutura": "317210",
  "Diretor de Arte": "262405",
  "Engenheiro de Alimentos": "214605",
  "Dançarino": "262105",
  "Revisor de Textos": "261425",
  "Apresentador": "261310",
  "Motoboy": "519110",
  "Eletricista Predial": "715615",
  "Bombeiro Hidráulico": "715210",
  "Churrasqueiro": "513215",
  "Tesoureiro": "413115",
  "Gestor de Projetos": "142520",
  "Testador de Software": "317110",
  "Analista de Crédito": "252525",
  "Pintor Predial": "716610",
  "Geneticista": "221105",
  "Analista de Qualidade": "351105",
  "Bombeiro Civil": "517110",
  "Cenógrafo": "262805",
  "Analista de Logística": "342125",
};

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
  { nome: "cg_grau_parentesco", contador: "cg_grau_parentesco_sequence", campo: "ds_grau_parentesco", valores: GRAUS_PARENTESCO },
  { nome: "cg_cargo",          contador: "cg_cargo_sequence",           campo: "ds_cargo",          valores: CARGOS },
  { nome: "cg_vinculo_contratual", contador: "cg_vinculo_contratual_sequence", campo: "ds_vinculo_contratual", valores: VINCULOS_CONTRATUAIS },
  // O CBO é gravado sem máscara (apenas dígitos). O replace abaixo é uma
  // salvaguarda extra caso o mapa venha a receber um valor com formatação.
  { nome: "cg_profissao",      contador: "cg_profissao_sequence",      campo: "ds_profissao",      valores: PROFISSOES.map((p) => ({ ds_profissao: p, ...(PROFISSOES_CBO[p] ? { nr_cbo: PROFISSOES_CBO[p].replace(/\D/g, '') } : {}) })) },
  { nome: "cg_orgao_emissor",  contador: "cg_orgao_emissor_sequence",  campo: "ds_orgao_emissor",  valores: ORGAOS_EMISSORES },
  { nome: "cg_logradouro",     contador: "cg_logradouro_sequence",     campo: "ds_logradouro",     valores: LOGRADOUROS },
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

  // Normaliza cada valor-fonte: pode ser uma string simples ou um objeto
  // { [cfg.campo]: "descrição", ...camposExtras } (ex.: nr_cbo na profissão)
  function nomeDe(valor) {
    return typeof valor === "string" ? valor : valor[cfg.campo];
  }

  // Chave de deduplicação: insensível a maiúsculas/espaços, mas preserva o
  // acento como desempate (ex.: "Avó" ≠ "Avô" — palavras que só diferem
  // pela vogal acentuada não podem ser tratadas como duplicadas).
  function chaveDe(texto) {
    const t = String(texto ?? "");
    return `${normalizar(texto)}|${t.toLowerCase()}`;
  }

  // Descrições já existentes (comparação insensível a maiúsculas/espaços,
  // preservando o acento para distinguir palavras como "Avó" e "Avô")
  const existentes = new Set(
    snap.docs.map((d) => chaveDe(d.data()[cfg.campo]))
  );

  // Campos extras da fonte (ex.: nr_cbo), por chave de deduplicação — para backfill
  const extrasPorNome = new Map();
  for (const valor of cfg.valores) {
    if (typeof valor === "object" && valor !== null) {
      const extras = Object.fromEntries(
        Object.entries(valor).filter(([k]) => k !== cfg.campo && k !== "id")
      );
      if (Object.keys(extras).length > 0) {
        extrasPorNome.set(chaveDe(nomeDe(valor)), extras);
      }
    }
  }

  // Backfill: preenche campos extras ausentes em registros já existentes
  // (ex.: profissões antigas sem nr_cbo passam a receber o código do seeder).
  // Apenas os campos extras são gravados — dt_alteracao/ds_usuario_alteracao de
  // registros existentes NÃO são sobrescritos (preserva edições feitas pela tela).
  const backfill = writeBatch(db);
  let backfillCount = 0;
  for (const d of snap.docs) {
    const extras = extrasPorNome.get(chaveDe(d.data()[cfg.campo]));
    if (!extras) continue;
    const precisaAtualizar = Object.entries(extras).some(([k, v]) => {
      const atual = d.data()[k];
      return String(atual ?? "") !== String(v ?? "");
    });
    if (precisaAtualizar) {
      backfill.update(doc(db, cfg.nome, d.id), extras);
      backfillCount += 1;
    }
  }
  if (backfillCount > 0 && !DRY_RUN) {
    await backfill.commit();
    console.log(
      `🔁 ${cfg.nome}: ${backfillCount} registro(s) existente(s) atualizados com campos extras`
    );
  }

  // Maior nr_sequencia atual (para continuar a numeração)
  let proximaSeq = 1;
  if (snap.size > 0) {
    const maxSeq = Math.max(...snap.docs.map((d) => Number(d.data().nr_sequencia) || 0));
    proximaSeq = maxSeq + 1;
  }

  // Deduplica a lista-fonte (por chave de deduplicação) e ignora o que já existe
  const vistos = new Set();
  const novos = [];
  for (const valor of cfg.valores) {
    const chave = chaveDe(nomeDe(valor));
    if (existentes.has(chave) || vistos.has(chave)) continue;
    vistos.add(chave);
    novos.push(valor);
  }

  const backfillInfo =
    DRY_RUN && backfillCount > 0
      ? `; 🔁 ${backfillCount} existente(s) seriam atualizados`
      : "";

  if (novos.length === 0) {
    // Mesmo sem inserir, corrige o contador se estiver atrasado
    await setDoc(
      doc(db, "_counters", cfg.contador),
      { current: proximaSeq - 1 },
      { merge: true }
    );
    console.log(`ℹ️  ${cfg.nome}: nada a inserir (${snap.size} já existem)${backfillInfo}`);
    return { nome: cfg.nome, inseridos: 0, existentes: snap.size, atualizados: backfillCount };
  }

  if (DRY_RUN) {
    let msg = `👀 ${cfg.nome}: ${novos.length} seriam inseridos (próxima sequência: ${proximaSeq})${backfillInfo}`;
    console.log(msg);
    return { nome: cfg.nome, inseridos: novos.length, existentes: snap.size, atualizados: backfillCount };
  }

  const batch = writeBatch(db);
  let ultimaSeq = proximaSeq - 1;
  for (const valor of novos) {
    const ref = doc(colRef);
    const extras =
      typeof valor === "object" && valor !== null
        ? Object.fromEntries(
            Object.entries(valor).filter(([k]) => k !== cfg.campo && k !== "id")
          )
        : {};
    batch.set(ref, {
      [cfg.campo]: nomeDe(valor),
      ...extras,
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
/*  Seed do perfil administrador e vínculo com o usuário admin        */
/* ------------------------------------------------------------------ */

/* Funções do sistema (mesmas chaves usadas pelo menu lateral) */
const TODAS_FUNCOES = [
  "pessoaFisica",
  "administracaoSistema",
  "cadastrosGerais",
];

async function semearPerfilAdministrador() {
  const colRef = collection(db, "perfil");
  const snap = await getDocs(colRef);

  // Perfil já existente (por descrição, insensível a maiúsculas/espaços/acentos)
  const existente = snap.docs.find(
    (d) => normalizar(d.data().ds_perfil) === "administrador"
  );

  let perfilId = null;
  let perfilSeq = null;

  if (existente) {
    perfilId = existente.id;
    perfilSeq = Number(existente.data().nr_sequencia) || null;

    // Garante que o perfil existente tenha todas as funções liberadas
    const funcoesAtuais = existente.data().config_funcoes ?? "";
    if (normalizar(funcoesAtuais) !== normalizar(JSON.stringify(TODAS_FUNCOES))) {
      if (DRY_RUN) {
        console.log(`👀 perfil: administrador existente seria atualizado com todas as funções`);
      } else {
        await setDoc(
          doc(db, "perfil", perfilId),
          { config_funcoes: JSON.stringify(TODAS_FUNCOES) },
          { merge: true }
        );
        console.log(`🔁 perfil: administrador atualizado com todas as funções (${perfilSeq})`);
      }
    } else {
      console.log(`ℹ️  perfil: administrador já existe com todas as funções (${perfilSeq})`);
    }
  } else {
    // Maior nr_sequencia atual para continuar a numeração
    let maxSeq = 0;
    if (snap.size > 0) {
      maxSeq = Math.max(...snap.docs.map((d) => Number(d.data().nr_sequencia) || 0));
    }
    const novaSeq = maxSeq + 1;

    if (DRY_RUN) {
      console.log(`👀 perfil: administrador seria inserido (nr_sequencia: ${novaSeq})`);
      perfilSeq = novaSeq;
    } else {
      const ref = doc(colRef);
      await setDoc(ref, {
        nr_sequencia: novaSeq,
        ds_perfil: "Administrador",
        ds_observacao: "Perfil padrão do sistema com acesso a todas as funções.",
        ie_status: "A",
        config_funcoes: JSON.stringify(TODAS_FUNCOES),
        dt_criacao: DATA_IMPLANTACAO,
        dt_alteracao: DATA_IMPLANTACAO,
        ds_usuario_criacao: USUARIO_IMPLANTACAO,
        ds_usuario_alteracao: USUARIO_IMPLANTACAO,
      });
      perfilId = ref.id;
      perfilSeq = novaSeq;
      console.log(`✅ perfil: administrador inserido (nr_sequencia: ${novaSeq})`);

      // Sincroniza o contador para o próximo cadastro pela tela continuar correto
      await setDoc(
        doc(db, "_counters", "perfil_sequence"),
        { current: novaSeq },
        { merge: true }
      );
    }
  }

  if (!perfilSeq) return;

  // Vincula o perfil ao usuário administrador (nr_sequencia 1)
  const usuarioRef = collection(db, "usuario");
  const usuariosSnap = await getDocs(usuarioRef);
  const admin = usuariosSnap.docs.find((d) => Number(d.data().nr_sequencia) === 1);

  if (!admin) {
    console.log(`⚠️  usuario: administrador (nr_sequencia 1) não encontrado — vínculo não feito`);
    return;
  }

  const perfisAtuais = parseArray(admin.data().config_perfis);
  if (perfisAtuais.includes(perfilSeq)) {
    console.log(`ℹ️  usuario: administrador já possui o perfil (${perfilSeq}) vinculado`);
    return;
  }

  if (DRY_RUN) {
    console.log(`👀 usuario: administrador (1) receberia o vínculo do perfil (${perfilSeq})`);
    return;
  }

  await setDoc(
    doc(db, "usuario", admin.id),
    { config_perfis: JSON.stringify([...perfisAtuais, perfilSeq]) },
    { merge: true }
  );
  console.log(`✅ usuario: administrador (1) vinculado ao perfil (${perfilSeq})`);
}

/* Parse de array serializado (JSON) com fallback para vazio */
function parseArray(raw) {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
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
  await semearPerfilAdministrador();

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
