/**
 * Guia de Códigos PS-HRO — dados estruturados para uso no webapp.
 * Versão 2.1 — Abril 2026
 *
 * priority: 3=diário ★★★ | 2=semanal ★★☆ | 1=mensal ★☆☆
 * grupo: "03"=clínico (verde) | "04"=cirúrgico (amarelo)
 * alert: string de alerta crítico (habilitação/FPO) | null
 */

export const categorias = [
  {
    id: "choque",
    nome: "Choque & Emergências Metabólicas",
    icone: "⚡",
    cor: "red",
    procedimentos: [
      { code: "0303060050", name: "Tratamento de Choque Anafilático", cid_text: "T78.2 (Choque anafilático NE)", grupo: "03", priority: 2, keywords: ["choque anafilatico", "anafilaxia", "reacao alergica grave"] },
      { code: "0303060077", name: "Tratamento de Choque Hipovolêmico", cid_text: "R57.1 / R57.9 (Choque NE)", grupo: "03", priority: 3, keywords: ["choque hipovolemico", "hemorragia", "desidratacao grave", "hipovolemia"] },
      { code: "0303060069", name: "Tratamento de Choque Cardiogênico", cid_text: "R57.0 (Choque cardiogênico)", grupo: "03", priority: 2, keywords: ["choque cardiogenico", "falencia cardiaca aguda"] },
      { code: "0303030046", name: "Tratamento de Distúrbios Metabólicos", cid_text: "E87.2 (Acidose) / E87.4 (Dist. misto)", obs: "Inclui DHE graves", grupo: "03", priority: 3, keywords: ["disturbio metabolico", "acidose", "alcalose", "dhe", "desequilibrio hidroeletrolitico", "hipernatremia", "hiponatremia", "hipercalemia"] },
    ],
  },
  {
    id: "cardiologia",
    nome: "Cardiologia",
    icone: "🫀",
    cor: "rose",
    procedimentos: [
      { code: "0303060190", name: "Tratamento de IAM", cid_text: "I21.9 (IAM NE) / R57.0 (se choque)", grupo: "03", priority: 3, keywords: ["infarto", "iam", "infarto agudo miocardio", "elevacao st", "stemi", "nstemi"] },
      { code: "0303060280", name: "Tratamento de SCA", cid_text: "I20.0 (Angina instável)", grupo: "03", priority: 3, keywords: ["sca", "sindrome coronariana aguda", "angina instavel", "dor toracica cardiaca"] },
      { code: "0303060026", name: "Tratamento de Arritmias", cid_text: "I44.0-2 (BAV) / I48 (FA) / I47.1 (TSV) / I47.2 (TV)", grupo: "03", priority: 3, keywords: ["arritmia", "fibrilacao atrial", "fa", "flutter", "tsv", "taquicardia supraventricular", "taquicardia ventricular", "bav", "bloqueio av"] },
      { code: "0303060212", name: "Tratamento de IC", cid_text: "I50.0 (ICC)", grupo: "03", priority: 3, keywords: ["insuficiencia cardiaca", "ic", "icc", "descompensacao cardiaca"] },
      { code: "0303060131", name: "Tratamento de Edema Agudo de Pulmão", cid_text: "J81 (EAP) / I50.1 (IC esquerda)", grupo: "03", priority: 3, keywords: ["eap", "edema agudo pulmao", "congestao pulmonar", "dispneia aguda cardiaca"] },
      { code: "0303060140", name: "Tratamento de Embolia Pulmonar", cid_text: "I26.0 (c/ cor pulmonale) / I26.9 (s/)", grupo: "03", priority: 2, keywords: ["embolia pulmonar", "tep", "tromboembolismo pulmonar"] },
      { code: "0303060107", name: "Tratamento de Crise Hipertensiva", cid_text: "I10 (HAS) / I11.9 (Cardiopatia hipertensiva)", grupo: "03", priority: 3, keywords: ["crise hipertensiva", "urgencia hipertensiva", "emergencia hipertensiva", "has descompensada", "pressao alta grave"] },
      { code: "0303060255", name: "Trat. de Parada Cardíaca c/ Ressuscitação", cid_text: "I46.0 (PCR com RCE) / I46.9 (PCR NE)", grupo: "03", priority: 2, keywords: ["pcr", "parada cardiaca", "rce", "reanimacao", "ressuscitacao cardiopulmonar", "rcr"] },
      { code: "0303060298", name: "Tratamento de TVP", cid_text: "I80.2 (TVP MMII) / I80.9 (NE)", grupo: "03", priority: 2, keywords: ["tvp", "trombose venosa profunda", "trombo venoso", "flebite"] },
      { code: "0303060204", name: "Trat. de Insuf. Arterial c/ Isquemia Crítica", cid_text: "I74.3 (Embolia MMII) / I74.9 (NE)", grupo: "03", priority: 1, keywords: ["isquemia arterial", "isquemia critica", "embolia arterial", "oclusao arterial aguda"] },
      { code: "0303060239", name: "Tratamento de Miocardiopatias", cid_text: "I42.9 (NE) / I40.9 (Miocardite NE)", obs: "Takotsubo, miocardite", grupo: "03", priority: 1, keywords: ["miocardiopatia", "miocardite", "takotsubo", "cardiomiopatia"] },
      { code: "0303060166", name: "Trat. de Endocardite em Válvula Nativa", cid_text: "I39.8 (Endocardite)", grupo: "03", priority: 1, keywords: ["endocardite", "endocardite infecciosa", "valvulopatia infecciosa"] },
      { code: "0303060271", name: "Tratamento de Pericardite", cid_text: "I32.8 (Pericardite especificada)", grupo: "03", priority: 1, keywords: ["pericardite", "derrame pericardico", "tamponamento cardiaco"] },
      { code: "0303060263", name: "Trat. de Pé Diabético Complicado", cid_text: "E10.5/E11.5 (DM c/ compl. vasculares)", grupo: "03", priority: 2, keywords: ["pe diabetico", "diabetes complicado", "ulcera diabetica", "gangrena diabetica"] },
    ],
  },
  {
    id: "pneumologia",
    nome: "Pneumologia & Vias Aéreas",
    icone: "🫁",
    cor: "blue",
    procedimentos: [
      { code: "0303140151", name: "Tratamento de Pneumonias ou Influenza", cid_text: "J18.9 (Pneumonia NE) / J09-J11 (Influenza)", grupo: "03", priority: 3, keywords: ["pneumonia", "influenza", "gripe", "pac", "pneumonia adquirida comunidade", "infiltrado pulmonar"] },
      { code: "0303140135", name: "Trat. de Outras Doenças do Ap. Respiratório", cid_text: "J96.0 (IRpA) / J80 (SDRA)", obs: "Usar para IRpA de qualquer causa", grupo: "03", priority: 3, keywords: ["irpa", "insuficiencia respiratoria aguda", "sdra", "ards", "insuficiencia respiratoria", "hipoxemia grave", "ventilacao mecanica"] },
      { code: "0303140143", name: "Trat. de Outras Infecções Agudas de VAI", cid_text: "J21.0 (Bronquiolite VSR) / J21.8-9", grupo: "03", priority: 2, keywords: ["bronquiolite", "vsr", "bronquite aguda", "infeccao vias aereas inferiores"] },
      { code: "0303140046", name: "Trat. de Doenças Crônicas das VAI (DPOC)", cid_text: "J44.1 (DPOC exacerbada)", grupo: "03", priority: 3, keywords: ["dpoc", "doenca pulmonar obstrutiva cronica", "exacerbacao dpoc", "enfisema", "bronquite cronica exacerbada"] },
      { code: "0303140127", name: "Trat. de Outras Doenças das VAS", cid_text: "J36 (Absc. periamigdaliano) / J39.0", grupo: "03", priority: 1, keywords: ["abscesso periamigdaliano", "epiglotite", "laringite grave", "obstrucao via aerea superior"] },
      { code: "0303140097", name: "Trat. de Hemorragias das Vias Respiratórias", cid_text: "R04.2 (Hemoptise) / R04.9 (NE)", grupo: "03", priority: 1, keywords: ["hemoptise", "hemoptoe", "sangramento pulmonar", "hemorragia pulmonar"] },
      { code: "0303140119", name: "Trat. de Outras Doenças da Pleura", cid_text: "J90 (Derrame pleural) / J91", obs: "Derrame sem indicação de drenagem", grupo: "03", priority: 2, keywords: ["derrame pleural", "pleurite", "pleurisia", "empiema pleural sem drenagem"] },
      { code: "0303140038", name: "Trat. de Afecções Necróticas/Supurativas VAI", cid_text: "J85.1 (Absc. pulmonar) / J86.9 (Empiema)", grupo: "03", priority: 1, keywords: ["abscesso pulmonar", "empiema", "necrose pulmonar"] },
    ],
  },
  {
    id: "neurologia",
    nome: "Neurologia Clínica",
    icone: "🧠",
    cor: "purple",
    procedimentos: [
      { code: "0303040149", name: "Tratamento de AVC (Isquêmico ou Hemorrágico)", cid_text: "I64 (NE) / I63.9 (Isq.) / I61.9 (Hem.)", obs: "HRO hab. AVC Tipo III (1617)", grupo: "03", priority: 3, keywords: ["avc", "acidente vascular cerebral", "avc isquemico", "avc hemorragico", "stroke", "hemiplegia", "afasia", "deficit neurologico focal"] },
      { code: "0303040076", name: "Trat. Conservador da Hemorragia Cerebral", cid_text: "I61.9 (Hemorragia intracerebral NE)", obs: "Usar quando não há indicação cirúrgica", grupo: "03", priority: 2, keywords: ["hemorragia cerebral", "hematoma cerebral", "sangramento intracerebral", "icth"] },
      { code: "0303040165", name: "Trat. de Crises Epilépticas não Controladas", cid_text: "G41.9 (Status epilepticus) / G40.9", grupo: "03", priority: 2, keywords: ["status epilepticus", "epilepsia", "convulsao", "crise epileptica", "crise convulsiva"] },
      { code: "0303040211", name: "Trat. de Encefalopatia Hipertensiva", cid_text: "I67.4 (Encefalopatia hipertensiva)", grupo: "03", priority: 2, keywords: ["encefalopatia hipertensiva", "emergencia hipertensiva neurologica", "alteracao consciencia hipertensao"] },
      { code: "0303040262", name: "Tratamento de Polineuropatias", cid_text: "G61.0 (Guillain-Barré) / G63.8", grupo: "03", priority: 1, keywords: ["guillain barre", "polineuropatia", "polineurite", "paralisia ascendente"] },
      { code: "0303040254", name: "Tratamento de Miastenia Grave", cid_text: "G70.0 (Miastenia grave)", grupo: "03", priority: 1, keywords: ["miastenia gravis", "miastenia grave", "crise miastenica"] },
      { code: "0303010142", name: "Trat. de Meningites Virais/Bacterianas", cid_text: "G00.9 (Bacteriana NE) / G03.9 (Viral)", grupo: "03", priority: 2, keywords: ["meningite", "meningite bacteriana", "meningite viral", "meningismo", "rigidez nuca", "kernig", "brudzinski"] },
      { code: "0303040297", name: "Trat. de Processo Toxi-infeccioso Cérebro/Medula", cid_text: "G04.9 (Encefalite NE) / G05.8", grupo: "03", priority: 1, keywords: ["encefalite", "encefalomielite", "infeccao sistema nervoso central", "encefalite viral"] },
      { code: "0303040041", name: "Tratamento Clínico de Abscesso Cerebral", cid_text: "G06.0 (Abscesso intracraniano)", grupo: "03", priority: 1, keywords: ["abscesso cerebral", "abscesso intracraniano", "infeccao cerebral"] },
    ],
  },
  {
    id: "neurotrauma",
    nome: "Neurotrauma",
    icone: "🪖",
    cor: "slate",
    procedimentos: [
      { code: "0303040084", name: "Trat. Conservador de TCE (Leve)", cid_text: "S06.0 (Concussão)", grupo: "03", priority: 3, keywords: ["tce leve", "traumatismo cranioencefalico leve", "concussao", "glasgow 14 15", "tce sem alteracao"] },
      { code: "0303040092", name: "Trat. Conservador de TCE (Médio)", cid_text: "S06.2 / S06.5 / S06.6 (HSA)", grupo: "03", priority: 2, keywords: ["tce medio", "traumatismo cranioencefalico moderado", "glasgow 9 13", "hsa", "hemorragia subaracnoidea"] },
      { code: "0303040106", name: "Trat. Conservador de TCE (Grave)", cid_text: "S06.9 (NE) / S06.7 (Coma prolongado)", obs: "Exige hab. 1602+2502 — confirmar FPO", grupo: "03", priority: 2, alert: "Exige habilitação 1602+2502 — confirmar com faturamento antes de usar", keywords: ["tce grave", "traumatismo cranioencefalico grave", "glasgow abaixo de 8", "coma traumatico"] },
      { code: "0303040114", name: "Trat. Conservador de TRM", cid_text: "S14.1 / S24.1 / S34.1", obs: "Exige hab. 1602+2502 — confirmar FPO", grupo: "03", priority: 2, alert: "Exige habilitação 1602+2502 — confirmar com faturamento antes de usar", keywords: ["trm", "traumatismo raquimedular", "lesao medular", "paraplesia traumatica", "tetraplesia traumatica"] },
      { code: "0303040238", name: "Trat. de Fratura da Coluna c/ Lesão Medular", cid_text: "S12/S22.0/S32 + S14/S24/S34", grupo: "03", priority: 1, keywords: ["fratura coluna", "fratura vertebral lesao medular", "fratura cervical", "fratura toracica", "fratura lombar medular"] },
      { code: "0403010306", name: "Trat. Cx de Hematoma Subdural Agudo", cid_text: "I62.0 / S06.5", obs: "Grupo 04 — HRO tem hab. 1601", grupo: "04", priority: 2, keywords: ["hematoma subdural agudo", "hsdа", "hsd", "neurocirurgia urgencia"] },
      { code: "0403010276", name: "Trat. Cx de Hematoma Extradural", cid_text: "I62.1 / S06.4", obs: "Grupo 04 — HRO tem hab. 1601", grupo: "04", priority: 2, keywords: ["hematoma extradural", "hematoma epidural", "hed"] },
      { code: "0403010284", name: "Trat. Cx de Hematoma Intracerebral", cid_text: "I61.2 / I61.6 / I61.8", obs: "Grupo 04 — HRO tem hab. 1601", grupo: "04", priority: 1, keywords: ["hematoma intracerebral", "hematoma cerebral cirurgia", "drenagem hematoma"] },
    ],
  },
  {
    id: "politrauma",
    nome: "Politrauma & Tórax",
    icone: "🚑",
    cor: "amber",
    procedimentos: [
      { code: "0308010043", name: "Trat. de Traumatismos Múltiplas Regiões", cid_text: "T07 (Traumatismos múltiplos NE)", obs: "Código coringa para politrauma", grupo: "03", priority: 3, keywords: ["politrauma", "multiplos traumas", "trauma multiplo", "acidente grave", "tce mais outros traumas"] },
      { code: "0308010035", name: "Trat. de Traumatismos c/ Lesão Órgão Intratorácico/Intra-abdominal", cid_text: "S27 (Tórax) / S36 (Abdome)", grupo: "03", priority: 2, keywords: ["trauma toracico", "trauma abdominal", "lesao orgao interno", "trauma torax abdome"] },
      { code: "0308010019", name: "Trat. Clínico/Conservador de Traumatismos", cid_text: "T14.1 (Ferimento NE) / T13.1 (MI)", obs: "Genérico — preferir específicos quando disponível", grupo: "03", priority: 2, keywords: ["trauma generico", "ferimento", "trauma conservador", "observacao trauma"] },
      { code: "0412050170", name: "Toracocentese / Drenagem de Pleura", cid_text: "S27.0 (Pneumotórax) / S27.1 (Hemotórax) / J93.1", obs: "Grupo 04 — verificar FPO", grupo: "04", priority: 2, keywords: ["pneumotorax", "hemotorax", "drenagem torax", "toracocentese", "dreno pleural"] },
    ],
  },
  {
    id: "ortopedia",
    nome: "Ortopedia & Fraturas",
    icone: "🦴",
    cor: "yellow",
    procedimentos: [
      { code: "0303090200", name: "Trat. Conservador de Fratura MMII c/ Imob.", cid_text: "S72.3 (Fêmur) / S82.2 (Tíbia)", grupo: "03", priority: 3, keywords: ["fratura femur", "fratura tibia", "fratura mmii", "fratura membro inferior", "fratura perna"] },
      { code: "0303090227", name: "Trat. Conservador de Fratura MMSS c/ Imob.", cid_text: "S42/S52/S62", grupo: "03", priority: 3, keywords: ["fratura umero", "fratura radio", "fratura ulna", "fratura mmss", "fratura membro superior", "fratura braco", "fratura antebraco"] },
      { code: "0303090120", name: "Trat. Conservador de Fratura Cintura Escapular", cid_text: "S42.0 (Clavícula) / S42.1 (Escápula)", grupo: "03", priority: 2, keywords: ["fratura clavicula", "fratura escapula", "fratura ombro", "cintura escapular"] },
      { code: "0303090146", name: "Trat. Conservador de Fratura de Costelas", cid_text: "S22.3 / S22.4 (Múltiplas)", grupo: "03", priority: 2, keywords: ["fratura costelas", "fratura arcos costais", "volet costal"] },
      { code: "0303090189", name: "Trat. Conservador de Fratura do Esterno", cid_text: "S22.2 (Esterno)", grupo: "03", priority: 1, keywords: ["fratura esterno", "trauma esternal"] },
      { code: "0303090197", name: "Trat. Conservador de Fratura Anéis Pélvicos", cid_text: "S32.8 (Pelve)", grupo: "03", priority: 2, keywords: ["fratura pelve", "fratura pelvica", "anel pelvico", "acetabulo"] },
      { code: "0303090138", name: "Trat. Conservador Fratura/Lesão Ligamentar Pelve", cid_text: "S33 (Luxação/entorse pelve)", grupo: "03", priority: 1, keywords: ["luxacao pelve", "entorse pelve", "lesao ligamentar pelve"] },
      { code: "0303090170", name: "Trat. Conservador de Fratura Ossos da Face", cid_text: "S02.2-S02.9", grupo: "03", priority: 1, keywords: ["fratura face", "fratura orbital", "fratura malar", "fratura mandibula", "trauma facial"] },
    ],
  },
  {
    id: "gastro",
    nome: "Gastroenterologia",
    icone: "🫃",
    cor: "green",
    procedimentos: [
      { code: "0303070110", name: "Trat. de Outras Doenças do Intestino", cid_text: "K55.0 (Isquemia) / K56.6 (Obstrução) / K57.9", grupo: "03", priority: 3, keywords: ["obstrucao intestinal", "isquemia intestinal", "diverticulite", "oclusao intestinal", "suboclusao"] },
      { code: "0303070064", name: "Trat. de Doenças do Esôfago/Estômago/Duodeno", cid_text: "K92.2 (HDA NE) / K25.0 (Úlcera c/ hemorragia)", obs: "HDA", grupo: "03", priority: 3, keywords: ["hda", "hemorragia digestiva alta", "hematemese", "melena", "ulcera peptica sangrante", "varizes esofagicas"] },
      { code: "0303070072", name: "Tratamento de Doenças do Fígado", cid_text: "K77.8 (Hepatopatia) / R18 (Ascite)", grupo: "03", priority: 2, keywords: ["hepatopatia descompensada", "ascite", "cirrose descompensada", "encefalopatia hepatica", "insuficiencia hepatica"] },
      { code: "0303070129", name: "Trat. de Transtornos Pâncreas/Vias Biliares", cid_text: "K85.9 (Pancreatite) / K81.0 (Colecistite)", grupo: "03", priority: 3, keywords: ["pancreatite aguda", "colecistite aguda", "coledocolitiase", "colangite", "dor epigastrica pancreatica"] },
      { code: "0303070080", name: "Trat. de Doenças do Peritônio", cid_text: "K65.0 (Peritonite aguda) / K65.9 (NE)", grupo: "03", priority: 2, keywords: ["peritonite", "abdome agudo inflamatorio", "perfuracao viscera"] },
      { code: "0303070099", name: "Trat. de Enterites e Colites não Infecciosas", cid_text: "K50.9 (Crohn) / K51.9 (RCU) / K55.0", grupo: "03", priority: 1, keywords: ["doenca crohn", "rcu", "retocolite", "dii", "doenca inflamatoria intestinal"] },
      { code: "0303100036", name: "Trat. de Complicações de Proc. Cx/Clínicos", cid_text: "T81.4 (Infecção) / T81.3 (Deiscência) / T81.8", grupo: "03", priority: 2, keywords: ["complicacao cirurgica", "infeccao ferida operatoria", "deiscencia", "fistula pos operatoria"] },
    ],
  },
  {
    id: "queimaduras",
    nome: "Queimaduras",
    icone: "🔥",
    cor: "orange",
    procedimentos: [
      { code: "0308030036", name: "Trat. de Queimaduras, Corrosões e Geladuras", cid_text: "T20-T25 (por região) / T30 (NE) / T31.x", obs: "PREFERIR ESTE — Grupo 03, sem habilitação", grupo: "03", priority: 3, keywords: ["queimadura", "queimado", "corrosao", "geladura", "escaldamento"] },
      { code: "0413010090", name: "Tratamento de Pequeno Queimado", cid_text: "T30", obs: "Grupo 04 — preferir 0308030036", grupo: "04", priority: 2, keywords: ["pequeno queimado", "queimadura pequena extensao"] },
      { code: "0413010082", name: "Tratamento de Médio Queimado", cid_text: "T31.1 / T31.2", obs: "Grupo 04 — preferir 0308030036", grupo: "04", priority: 1, keywords: ["medio queimado", "queimadura media extensao"] },
      { code: "0413010066", name: "Tratamento de Grande Queimado", cid_text: "T31.3+ (>30% SC)", obs: "Grupo 04 — preferir 0308030036", grupo: "04", priority: 1, keywords: ["grande queimado", "queimadura extensa", "queimadura grave"] },
    ],
  },
  {
    id: "infectologia",
    nome: "Infectologia & Sepse",
    icone: "🦠",
    cor: "teal",
    procedimentos: [
      { code: "0303010070", name: "Trat. de Doenças Infecciosas e Parasitárias", cid_text: "A41.9 (Sepse NE) / A49.9 (Inf. bacteriana NE)", obs: "Código amplo para sepse", grupo: "03", priority: 3, keywords: ["sepse", "sepsis", "choque septico", "bacteremia", "infeccao bacteriana grave", "foco infeccioso sistemico"] },
      { code: "0303010010", name: "Tratamento de Dengue Clássica", cid_text: "A90 (Dengue clássica)", grupo: "03", priority: 2, keywords: ["dengue", "dengue classica", "febre dengue"] },
      { code: "0303010029", name: "Tratamento de Dengue Hemorrágica", cid_text: "A91 (Dengue hemorrágica)", grupo: "03", priority: 2, keywords: ["dengue hemorragica", "dengue grave", "dengue com sinais alarme", "fhd"] },
      { code: "0303010061", name: "Trat. de Doenças Infecciosas Intestinais", cid_text: "A09 (GEA NE) / A08.4 (Rotavírus)", grupo: "03", priority: 2, keywords: ["gea", "gastroenterite aguda", "diarreia infecciosa", "diarreia aguda", "rotavirus"] },
      { code: "0303010118", name: "Tratamento de Hepatites Virais", cid_text: "B15.9 (Hep A) / B16.9 (Hep B) / B17.1 (Hep C)", grupo: "03", priority: 1, keywords: ["hepatite viral", "hepatite a", "hepatite b", "hepatite c", "ictus infeccioso"] },
      { code: "0303010215", name: "Tratamento de Tuberculose", cid_text: "A15-A19 (TB)", grupo: "03", priority: 1, keywords: ["tuberculose", "tb", "tuberculose pulmonar", "baar positivo"] },
      { code: "0303020024", name: "Trat. de Doenças pelo HIV", cid_text: "B20-B24 (HIV)", obs: "HRO tem hab. 1101", grupo: "03", priority: 1, keywords: ["hiv", "aids", "sida", "imunodeficiencia adquirida"] },
    ],
  },
  {
    id: "saude_mental",
    nome: "Saúde Mental & Intoxicações",
    icone: "🧩",
    cor: "violet",
    procedimentos: [
      { code: "0303170131", name: "Trat. em Saúde Mental — Risco Elevado de Suicídio", cid_text: "R45.8 (Ideação) / F32.2 / F60.3", grupo: "03", priority: 2, keywords: ["suicidio", "tentativa suicidio", "ideacao suicida", "risco suicidio", "saude mental urgencia"] },
      { code: "0308020030", name: "Trat. de Intoxicação/Envenenamento", cid_text: "T40-T50 (Intox. drogas/medicamentos)", grupo: "03", priority: 3, keywords: ["intoxicacao", "envenenamento", "overdose", "intoxicacao medicamentosa", "intoxicacao alcool", "ingestao substancia"] },
    ],
  },
  {
    id: "endocrinologia",
    nome: "Endocrinologia",
    icone: "💉",
    cor: "cyan",
    procedimentos: [
      { code: "0303030038", name: "Tratamento de Diabetes Mellitus", cid_text: "E10.1 (CAD DM1) / E11.0 (Coma DM2) / E14.1", obs: "CAD, EHH", grupo: "03", priority: 3, keywords: ["cad", "cetoacidose diabetica", "ehh", "coma diabetico", "hiperglicemia grave", "diabetes descompensado"] },
      { code: "0303030054", name: "Trat. de Transtornos da Tireoide", cid_text: "E05.5 (Crise tireotóxica) / E06.0", grupo: "03", priority: 1, keywords: ["crise tireotoxica", "tempestade tireoidiana", "tireotoxicose", "hipotireoidismo grave"] },
      { code: "0303030020", name: "Tratamento de Desnutrição", cid_text: "E43 (Grave NE) / E44.0 (Moderada)", grupo: "03", priority: 1, keywords: ["desnutricao", "desnutricao grave", "kwashiorkor", "marasmo"] },
    ],
  },
  {
    id: "nefrologia",
    nome: "Nefrologia & Urologia",
    icone: "💧",
    cor: "sky",
    procedimentos: [
      { code: "0305020048", name: "Tratamento de Insuficiência Renal Aguda", cid_text: "N17.0-N17.9 (IRA) / N10 (Pielonefrite c/ IRA)", grupo: "03", priority: 3, keywords: ["ira", "insuficiencia renal aguda", "lesao renal aguda", "lra", "aki", "creatinina elevada aguda", "oliguria"] },
      { code: "0305020013", name: "Tratamento da Pielonefrite", cid_text: "N10 (Pielonefrite) / N11.x / N39.0 (ITU NE)", grupo: "03", priority: 3, keywords: ["pielonefrite", "itu alta", "infeccao urinaria alta", "itu complicada", "urosepse"] },
    ],
  },
  {
    id: "hematologia",
    nome: "Hematologia",
    icone: "🩸",
    cor: "red",
    procedimentos: [
      { code: "0303020067", name: "Trat. de Defeitos da Coagulação/Púrpura", cid_text: "D65 (CIVD) / D69.6 (Plaquetopenia) / D68.9", grupo: "03", priority: 2, keywords: ["civd", "coagulacao intravascular disseminada", "plaquetopenia grave", "trombocitopenia", "coagulopatia"] },
      { code: "0303020040", name: "Tratamento de Anemia Hemolítica", cid_text: "D59.9 (NE) / D62 (Aguda pós-hemorrágica)", grupo: "03", priority: 1, keywords: ["anemia hemolitica", "hemolise", "anemia aguda grave"] },
    ],
  },
  {
    id: "obstetricia",
    nome: "Obstetrícia — Emergências",
    icone: "🤰",
    cor: "pink",
    procedimentos: [
      { code: "0303100028", name: "Tratamento de Eclâmpsia", cid_text: "O15.0 (Eclâmpsia na gravidez)", grupo: "03", priority: 2, keywords: ["eclampsia", "pre eclampsia grave", "convulsao gestante", "hellp"] },
      { code: "0303100044", name: "Trat. de Intercorrências Clínicas na Gravidez", cid_text: "O99.x (conforme complicação)", grupo: "03", priority: 2, keywords: ["intercorrencia gravidez", "complicacao obstetrica", "gestante doente", "patologia gravidez"] },
      { code: "0303100010", name: "Trat. de Complicações do Puerpério", cid_text: "O85 (Sepse puerperal) / O72.1 (HPP)", grupo: "03", priority: 2, keywords: ["puerperio", "sepse puerperal", "hemorragia pos parto", "hpp", "complicacao puerperal"] },
    ],
  },
  {
    id: "pele",
    nome: "Pele & Partes Moles",
    icone: "🩹",
    cor: "lime",
    procedimentos: [
      { code: "0303080094", name: "Trat. de Outras Afecções da Pele/Tec. Subcutâneo", cid_text: "L02.x (Abscesso) / L03.1 (Celulite) / M72.6 (Fasciite)", obs: "Alternativa ao 0401010104 — usar este", grupo: "03", priority: 3, keywords: ["abscesso cutaneo", "celulite", "fasciite necrotizante", "abscesso partes moles", "infeccao pele"] },
      { code: "0303080060", name: "Tratamento de Estafilococcias", cid_text: "L02.x / L03.x (Celulite estafilocócica)", grupo: "03", priority: 2, keywords: ["estafilococia", "staphylococcus", "staph aureus", "celulite estafilococica"] },
      { code: "0303080078", name: "Tratamento de Estreptococcias", cid_text: "A46 (Erisipela) / L03.x", grupo: "03", priority: 2, keywords: ["erisipela", "estreptococia", "streptococcus", "celulite estreptococica"] },
      { code: "0303080086", name: "Tratamento de Farmacodermias", cid_text: "L51.1 (Stevens-Johnson) / L51.2 (NET) / L27.0", grupo: "03", priority: 1, keywords: ["stevens johnson", "sjs", "necrolise epidermica toxica", "net", "farmacodermia", "reacao cutanea medicamentosa grave"] },
      { code: "0308040015", name: "Trat. de Complicações de Proc. Cx ou Clínicos", cid_text: "T81.4 (Infecção pós-proc) / T81.3 (Deiscência)", obs: "FO infectada", grupo: "03", priority: 2, keywords: ["ferida operatoria infectada", "fo infectada", "deiscencia cirurgica", "infeccao pos operatoria"] },
    ],
  },
]

/** Todos os procedimentos em lista plana (para busca global) */
export const todosOsProcedimentos = categorias.flatMap(cat =>
  cat.procedimentos.map(p => ({ ...p, categoria: cat.nome, categoriaId: cat.id, categoriaIcone: cat.icone }))
)

/**
 * Tabela de alternativas: quando um código é rejeitado, qual usar no lugar.
 */
export const alternativas = [
  // PELE
  { situacao: "Abscesso cutâneo / drenagem", naoUsar: "0401010104", usarEm: "0303080094", motivo: "0401 não está na FPO do HRO", cids: "L02.2 / L02.4 / L02.9" },
  { situacao: "Celulite / erisipela", naoUsar: "0401010031", usarEm: "0303080060 ou 0303080078", motivo: "0401 não está na FPO do HRO", cids: "L03.1 / A46" },
  { situacao: "Infecção de ferida operatória", naoUsar: "0401 (qualquer)", usarEm: "0308040015", motivo: "0401 não está na FPO do HRO", cids: "T81.4 / T81.3" },
  { situacao: "Fasciite necrotizante (clínico)", naoUsar: "0401 (qualquer)", usarEm: "0303080094", motivo: "0401 não está na FPO do HRO", cids: "M72.6" },
  // ABDOME
  { situacao: "Paracentese / ascite (diagnóstico ou alívio)", naoUsar: "0407040196", motivo: "Código não habilitado no HRO", usarEm: "0303070072 ou 0303070080", cids: "R18 / K77.8 / K65.0" },
  { situacao: "HDA / HDB (sem cirurgia)", naoUsar: "Códigos 04", motivo: "Preferir clínico no PS", usarEm: "0303070064", cids: "K92.2 / K92.1 / K25.0" },
  { situacao: "Abdome agudo obstrutivo (conservador)", naoUsar: "Códigos 04", motivo: "Preferir clínico no PS", usarEm: "0303070110", cids: "K56.6 / K56.5" },
  { situacao: "Pancreatite aguda (conservador)", naoUsar: "Códigos 04", motivo: "Preferir clínico no PS", usarEm: "0303070129", cids: "K85.9 / K85.0" },
  { situacao: "Colecistite aguda (conservador)", naoUsar: "Códigos 04", motivo: "Preferir clínico no PS", usarEm: "0303070129", cids: "K81.0 / K80.0" },
  // QUEIMADURAS
  { situacao: "Qualquer queimadura", naoUsar: "0413010090 / 0413010082 / 0413010066", motivo: "Grupo 04, risco de rejeição", usarEm: "0308030036", cids: "T20-T25 / T30 / T31.x" },
  // NEUROLOGIA
  { situacao: "Hemorragia cerebral sem indicação cirúrgica", naoUsar: "0403010284", motivo: "Grupo 04 desnecessário se conservador", usarEm: "0303040076", cids: "I61.9" },
  { situacao: "Derrame pleural sem drenagem", naoUsar: "0412050170", motivo: "Grupo 04 desnecessário se conservador", usarEm: "0303140119", cids: "J90 / J91" },
  { situacao: "TCE Grave / TRM (FPO não liberar 0303040106/114)", naoUsar: "0303040106 / 0303040114", motivo: "Podem exigir hab. 1602+2502", usarEm: "0308010043", cids: "T07 / S06.9 / S14.1" },
]

