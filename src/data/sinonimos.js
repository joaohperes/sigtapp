/**
 * Mapeamento de termos populares/coloquiais → terminologia oficial CID-10.
 * Permite que usuários busquem "câncer de ovário" e encontrem "neoplasia maligna do ovário".
 *
 * Formato: [termo_coloquial, termo_formal]
 * Aplicado antes da busca — substitui o termo coloquial pelo formal na query.
 */
export const SINONIMOS = [
  // Oncologia
  ['câncer',           'neoplasia maligna'],
  ['cancer',           'neoplasia maligna'],
  ['tumor maligno',    'neoplasia maligna'],
  ['carcinoma',        'neoplasia maligna'],  // carcinoma já é termo formal, mas reforça
  ['leucemia',         'leucemia'],
  ['linfoma',          'linfoma'],
  ['melanoma',         'melanoma'],
  ['sarcoma',          'sarcoma'],

  // Cardiovascular
  // Motor aditivo (OR): múltiplas linhas com o mesmo coloquial somam alternativas.
  // AVC engloba clinicamente isquêmico (infarto cerebral), hemorrágico (hemorragia
  // intracerebral) e o genérico — todos entram para a sigla achar os 3.
  ['infarto',          'infarto agudo do miocárdio'],
  ['infarto',          'infarto do miocárdio'],
  ['iam',              'infarto agudo do miocárdio'],
  ['iam',              'infarto do miocárdio'],
  ['avc',              'acidente vascular cerebral'],
  ['avc',              'infarto cerebral'],
  ['avc',              'hemorragia intracerebral'],
  ['avc',              'hemorragia subaracnóide'],
  ['avc isquêmico',    'infarto cerebral'],
  ['avc hemorrágico',  'hemorragia intracerebral'],
  ['avc hemorrágico',  'hemorragia cerebral'],
  ['avci',             'infarto cerebral'],
  ['avch',             'hemorragia intracerebral'],
  ['pressão alta',     'hipertensão essencial'],
  ['hipertensão',      'hipertensão essencial'],
  ['angina',           'angina pectoris'],
  ['arritmia',         'transtornos do ritmo cardíaco'],
  ['icc',              'insuficiência cardíaca'],
  ['tep',              'embolia pulmonar'],
  ['tvp',              'trombose venosa profunda'],
  ['dac',              'doença isquêmica do coração'],
  ['fa',               'fibrilação atrial'],
  ['fa',               'fibrilação e flutter atrial'],
  ['tv',               'taquicardia ventricular'],
  ['daop',             'aterosclerose das artérias das extremidades'],
  ['daop',             'doença vascular periférica'],
  ['dap',              'aterosclerose das artérias das extremidades'],

  // Siglas técnicas de plantão/emergência (redações validadas no banco)
  ['hsa',              'hemorragia subaracnóide'],
  ['hic',              'hemorragia intracerebral'],
  ['hsd',              'hemorragia subdural'],
  ['hed',              'hemorragia extradural'],
  ['hda',              'hemorragia gastrointestinal'],
  ['hdb',              'hemorragia gastrointestinal'],
  ['tce',              'traumatismo intracraniano'],
  ['tce',              'lesão cerebral traumática'],
  ['eap',              'edema pulmonar'],
  ['irpa',             'insuficiência respiratória aguda'],
  ['ira',              'insuficiência renal aguda'],
  ['lra',              'insuficiência renal aguda'],
  ['drc',              'insuficiência renal crônica'],
  ['cad',              'cetoacidose'],
  // EHH (estado hiperglicêmico hiperosmolar) não tem código próprio no CID-10/SIGTAP.
  // É codificado como "diabetes ... com coma" (E_00) ou hiperglicemia (R739).
  ['ehh',              'diabetes mellitus insulino-dependente - com coma'],
  ['ehh',              'diabetes mellitus não-insulino-dependente - com coma'],
  ['ehh',              'diabetes mellitus não especificado - com coma'],
  ['ehh',              'hiperglicemia não especificada'],
  ['dip',              'doença inflamatória pélvica'],
  ['dip',              'salpingite'],
  ['nia',              'nefrite intersticial'],

  // Endocrinologia / Metabólico
  ['diabetes tipo 1',  'diabetes mellitus insulino-dependente'],
  ['diabetes tipo 2',  'diabetes mellitus não-insulino-dependente'],
  ['diabetes',         'diabetes mellitus'],
  ['obesidade mórbida','obesidade'],
  ['tireoide',         'tireoide'],

  // Distúrbios eletrolíticos — nomenclatura dupla (kalemia/potassemia, etc.)
  // Potássio (kalium → kalemia | potassium → potassemia)
  ['hipocalemia',      'hipopotassemia'],   // ↓K+ — CID usa "hipopotassemia" (E876)
  ['hipercalemia',     'hiperpotassemia'],  // ↑K+ — CID usa "hiperpotassemia" (E875)
  ['hipokaliemia',     'hipopotassemia'],
  ['hiperkaliemia',    'hiperpotassemia'],
  ['kaliemia',         'potassemia'],
  ['potassio',         'potassemia'],       // busca genérica por potássio
  ['potássio',         'potassemia'],

  // Sódio (natrium → natremia)
  ['sodio',            'natremia'],
  ['sódio',            'natremia'],
  ['hipersodiemia',    'hipernatremia'],
  ['hiposodiemia',     'hiponatremia'],

  // Cálcio
  ['calcio',           'calcemia'],
  ['cálcio',           'calcemia'],

  // Magnésio
  ['magnesio',         'magnesemia'],
  ['magnésio',         'magnesemia'],

  // Fósforo
  ['fosforo',          'fosfatemia'],
  ['fósforo',          'fosfatemia'],

  // Neurológico
  ['alzheimer',        'doença de alzheimer'],
  ['parkinson',        'doença de parkinson'],
  ['epilepsia',        'epilepsia'],
  ['convulsão',        'epilepsia'],
  ['demência',         'demência'],
  ['desmaio',          'síncope'],
  ['ait',              'ataque isquêmico transitório'],
  ['isquemia transitória', 'ataque isquêmico transitório'],
  ['labirintite',      'labirintite'],       // H83.0 — CID usa este termo
  ['tontura',          'vertigem'],
  ['esclerose múltipla', 'esclerose múltipla'],
  ['ela',              'esclerose lateral amiotrófica'],
  ['hidrocefalia',     'hidrocefalia'],
  ['paralisia de bell','paralisia de bell'],
  ['guillain-barré',   'guillain-barré'],
  ['miastenia',        'miastenia gravis'],
  ['neuropatia',       'neuropatia'],

  // Psiquiátrico
  ['depressão',        'transtorno depressivo'],
  ['ansiedade',        'transtornos de ansiedade'],
  ['esquizofrenia',    'esquizofrenia'],
  ['bipolar',          'transtorno afetivo bipolar'],
  ['maníaco-depressivo','transtorno afetivo bipolar'],
  ['toc',              'transtorno obsessivo-compulsivo'],
  ['tdah',             'transtornos hipercinéticos'],
  ['déficit de atenção','transtorno hipercinético'],
  ['autismo',          'autismo'],
  ['tea',              'autismo'],
  ['asperger',         'síndrome de asperger'],
  ['pânico',           'transtorno do pânico'],
  ['ataque de pânico', 'transtorno do pânico'],
  ['tept',             'transtorno de estresse pós-traumático'],
  ['estresse pós-trauma','transtorno de estresse pós-traumático'],
  ['alcoolismo',       'dependência de álcool'],
  ['dependência de álcool', 'dependência de álcool'],
  ['anorexia nervosa', 'anorexia nervosa'],
  ['bulimia',          'bulimia nervosa'],
  ['fobia social',     'fobia social'],
  ['insônia',          'insônia'],
  ['apneia do sono',   'apneia do sono'],
  ['burnout',          'síndrome de burnout'],

  // Respiratório
  ['gripe',            'influenza'],
  ['resfriado',        'nasofaringite'],
  ['amigdalite',       'amigdalite aguda'],
  ['faringite',        'faringite aguda'],
  ['sinusite',         'sinusite'],
  ['rinite',           'rinite alérgica'],
  ['pneumonia',        'pneumonia'],
  ['tuberculose',      'tuberculose'],
  ['tb pulmonar',      'tuberculose pulmonar'],
  ['bronquite',        'bronquite'],
  ['asma',             'asma'],
  ['enfisema',         'enfisema'],
  ['dpoc',             'doença pulmonar obstrutiva crônica'],
  ['derrame pleural',  'derrame pleural'],
  ['pneumotórax',      'pneumotórax'],
  ['covid',            'covid-19'],
  ['fibrose pulmonar', 'fibrose pulmonar'],
  ['insuficiência respiratória', 'insuficiência respiratória'],

  // Digestivo / Hepático
  ['refluxo',          'doença de refluxo gastroesofágico'],
  ['azia',             'doença de refluxo gastroesofágico'],
  ['drge',             'doença de refluxo gastroesofágico'],
  ['gastrite',         'gastrite'],
  ['constipação',      'constipação intestinal'],
  ['esteatose hepática','degeneração gordurosa do fígado'],
  ['nash',             'degeneração gordurosa do fígado'],
  ['intestino irritável','síndrome do intestino irritável'],
  ['sii',              'síndrome do intestino irritável'],
  ['doença de crohn',  'doença de crohn'],
  ['colite ulcerativa','colite ulcerativa'],
  ['retocolite',       'colite ulcerativa'],
  ['hemorroidas',      'hemorróidas'],
  ['cirrose',          'cirrose hepática'],
  ['hepatite',         'hepatite'],
  ['úlcera',           'úlcera'],
  ['apendicite',       'apendicite'],
  ['pancreatite',      'pancreatite'],
  ['cálculo biliar',   'colelitíase'],
  ['icterícia',        'icterícia'],
  ['disfagia',         'disfagia'],
  ['diverticulite',    'diverticulite'],
  ['hérnia inguinal',  'hérnia inguinal'],
  ['hérnia de hiato',  'hérnia diafragmática'],
  ['peritonite',       'peritonite'],

  // Renal / Urológico
  ['cálculo renal',    'cálculo do rim e do ureter'],
  ['insuficiência renal', 'insuficiência renal'],
  ['infecção urinária','cistite'],
  ['itu',              'infecção do trato urinário'],
  ['cistite',          'cistite'],
  ['pielonefrite',     'pielonefrite'],
  ['hiperplasia prostática','hiperplasia benigna da próstata'],
  ['hpb',              'hiperplasia benigna da próstata'],
  ['incontinência urinária','incontinência urinária'],
  ['retenção urinária','retenção urinária'],
  ['glomerulonefrite', 'glomerulonefrite'],
  ['síndrome nefrótica','síndrome nefrótica'],
  ['disfunção erétil', 'disfunção erétil'],
  ['impotência sexual','disfunção erétil'],

  // Ginecológico / Obstétrico
  ['endometriose',     'endometriose'],
  ['mioma',            'leiomioma do útero'],
  ['ovário policístico','síndrome dos ovários policísticos'],
  ['sop',              'síndrome dos ovários policísticos'],
  ['cólica menstrual', 'dismenorreia'],
  ['tpm',              'tensão pré-menstrual'],
  ['menopausa',        'menopausa'],
  ['climatério',       'climatério'],
  ['amenorreia',       'amenorreia'],
  ['eclampsia',        'eclampsia'],
  ['pré-eclampsia',    'pré-eclampsia'],
  ['gravidez ectópica','gravidez ectópica'],
  ['aborto espontâneo','aborto espontâneo'],
  ['placenta prévia',  'placenta prévia'],
  ['descolamento de placenta','descolamento prematuro da placenta'],
  ['dpp',              'descolamento prematuro da placenta'],
  ['depressão pós-parto','transtorno mental puerpério'],
  ['vaginose',         'vaginose bacteriana'],
  ['corrimento',       'vaginite'],
  ['prolapso uterino', 'prolapso genital'],

  // Cardiovascular
  ['parada cardíaca',  'parada cardíaca'],
  ['pcr',              'parada cardíaca'],
  ['parada cardiorrespiratória','parada cardíaca'],
  ['morte súbita cardíaca','morte súbita cardíaca'],
  ['tvp',              'trombose venosa profunda'],
  ['trombose na perna','trombose venosa profunda'],
  ['trombose venosa',  'trombose venosa profunda'],
  ['embolia pulmonar', 'embolia pulmonar'],
  ['varizes',          'varizes dos membros inferiores'],
  ['aneurisma',        'aneurisma'],
  ['dissecção de aorta','dissecção de aorta'],
  ['aterosclerose',    'aterosclerose'],
  ['fibrilação atrial','fibrilação e flutter atrial'],
  ['arritmia',         'transtornos do ritmo cardíaco'],
  ['taquicardia',      'taquicardia'],
  ['bradicardia',      'bradicardia'],
  ['endocardite',      'endocardite'],
  ['miocardite',       'miocardite'],
  ['pericardite',      'pericardite'],
  ['cardiomiopatia',   'cardiomiopatia'],
  ['valva mitral',     'valva mitral'],
  ['prolapso mitral',  'prolapso da valva mitral'],
  ['hipertensão pulmonar','hipertensão pulmonar'],
  ['gangrena',         'gangrena'],

  // Infecciosas
  ['catapora',         'varicela'],
  ['cobreiro',         'herpes zóster'],
  ['herpes zóster',    'herpes zóster'],
  ['caxumba',          'caxumba'],
  ['papeira',          'caxumba'],
  ['sarampo',          'sarampo'],
  ['rubéola',          'rubéola'],
  ['candidiase',       'candidíase'],
  ['candidíase',       'candidíase'],
  ['chagas',           'doença de chagas'],
  ['doença de chagas', 'doença de chagas'],
  ['toxoplasmose',     'toxoplasmose'],
  ['mononucleose',     'mononucleose infecciosa'],
  ['febre tifoide',    'febre tifoide'],
  ['febre amarela',    'febre amarela'],
  ['zika',             'vírus zika'],
  ['chikungunya',      'chikungunya'],
  ['leishmaniose',     'leishmaniose'],
  ['calazar',          'leishmaniose visceral'],
  ['esquistossomose',  'esquistossomose'],
  ['barriga d\'água',  'esquistossomose'],
  ['lombriga',         'ascaridíase'],
  ['oxiúros',          'enterobíase'],
  ['solitária',        'teníase'],
  ['tétano',           'tétano'],
  ['raiva',            'raiva'],
  ['febre reumática',  'febre reumática'],
  ['sífilis',          'sífilis'],
  ['gonorreia',        'gonorreia'],
  ['blenorragia',      'gonorreia'],
  ['clamídia',         'infecção por clamídia'],
  ['hpv',              'papilomavírus humano'],
  ['condiloma',        'condiloma acuminado'],
  ['meningococo',      'infecção meningocócica'],
  ['febre maculosa',   'febre maculosa'],
  ['sepse',            'septicemia'],
  ['aids',             'doença pelo vírus da imunodeficiência humana'],
  ['hiv',              'doença pelo vírus da imunodeficiência humana'],
  ['dengue',           'dengue'],
  ['malária',          'malária'],
  ['leptospirose',     'leptospirose'],

  // Hematológico
  ['anemia falciforme','anemia falciforme'],
  ['anemia ferropriva','anemia por deficiência de ferro'],
  ['anemia por falta de ferro','anemia por deficiência de ferro'],
  ['plaqueta baixa',   'trombocitopenia'],
  ['hemofilia',        'hemofilia'],
  ['talassemia',       'talassemia'],
  ['policitemia vera', 'policitemia vera'],
  ['neutropenia',      'neutropenia'],
  ['linfadenopatia',   'linfadenopatia'],

  // Músculo-esquelético
  ['fratura',          'fratura'],
  ['artrite',          'artrite'],
  ['artrose',          'artrose'],
  ['osteoporose',      'osteoporose'],
  ['lombalgia',        'dor lombar'],
  ['hérnia de disco',  'transtornos de disco intervertebral'],
  ['fibromialgia',     'fibromialgia'],
  ['tendinite',        'tendinite'],
  ['bursite',          'bursite'],
  ['gota',             'gota'],
  ['lúpus',            'lúpus eritematoso sistêmico'],
  ['les',              'lúpus eritematoso sistêmico'],
  ['esclerodermia',    'esclerose sistêmica'],
  ['espondilite',      'espondilite anquilosante'],
  ['miopatia',         'miopatia'],
  ['distrofia muscular','distrofia muscular'],

  // Pele
  ['sarna',            'escabiose'],
  ['piolho',           'pediculose'],
  ['micose',           'dermatofitose'],
  ['tinha',            'dermatofitose'],
  ['pé de atleta',     'tinha do pé'],
  ['pano branco',      'pitiríase versicolor'],
  ['psoríase',         'psoríase'],
  ['eczema',           'dermatite'],
  ['dermatite',        'dermatite'],
  ['urticária',        'urticária'],
  ['acne',             'acne'],
  ['vitiligo',         'vitiligo'],
  ['erisipela',        'erisipela'],
  ['impetigo',         'impetigo'],
  ['furúnculo',        'furúnculo'],
  ['alopecia',         'alopecia'],
  ['herpes labial',    'herpes simples'],

  // Neonatologia / Pediátrico
  ['síndrome de down', 'síndrome de down'],
  ['trissomia 21',     'síndrome de down'],
  ['fibrose cística',  'fibrose cística'],
  ['mucoviscidose',    'fibrose cística'],
  ['fenilcetonúria',   'fenilcetonúria'],
  ['pku',              'fenilcetonúria'],
  ['morte súbita do lactente','síndrome da morte súbita'],
  ['morte súbita infantil',   'síndrome da morte súbita'],
  ['prematuridade',    'nascimento prematuro'],
  ['prematuro',        'nascimento prematuro'],
  ['icterícia neonatal','icterícia neonatal'],
  ['hidrocefalia congênita','hidrocefalia congênita'],
  ['espinha bífida',   'espinha bífida'],
  ['bronquiolite',     'bronquiolite aguda'],
  ['otite',            'otite média'],
  ['convulsão febril', 'convulsões febris'],
  ['doença de kawasaki','síndrome dos linfonodos mucocutâneos'],

  // Causas externas (relevantes para D.O.)
  ['afogamento',       'afogamento'],
  ['submersão',        'afogamento'],
  ['envenenamento',    'envenenamento'],
  ['intoxicação',      'intoxicação'],
  ['overdose',         'intoxicação por narcóticos'],
  ['intoxicação por agrotóxico','intoxicação por pesticidas'],
  ['atropelamento',    'acidente de trânsito'],
  ['acidente de carro','acidente de trânsito'],
  ['acidente de moto', 'acidente motociclístico'],
  ['queda de altura',  'queda de um nível a outro'],
  ['suicídio',         'lesão autoprovocada'],
  ['enforcamento',     'lesão autoprovocada por enforcamento'],
  ['homicídio',        'agressão'],
  ['esfaqueamento',    'agressão por objeto cortante'],
  ['tiro',             'agressão por arma de fogo'],
  ['queda',            'queda'],
  ['queimadura',       'queimadura'],
  ['eletrocução',      'exposição a corrente elétrica'],
  ['choque elétrico',  'exposição a corrente elétrica'],
  ['complicação cirúrgica','complicações de procedimentos cirúrgicos'],
]

const BOUNDARY_ANTES = '(?<![a-záéíóúãõâêôàüç])'
const BOUNDARY_DEPOIS = '(?![a-záéíóúãõâêôàüç])'

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Sinônimos ADITIVOS (não substitutivos): a busca procura "termo OU sinônimo",
 * nunca troca o termo do usuário. Retorna grupos de alternativas a serem unidos
 * por OR na RPC; grupos entre si são AND.
 *
 * Ex: "avc" → [["avc", "acidente vascular cerebral", "infarto cerebral"]]
 *     "pneumonia grave" → [["pneumonia"], ["grave"]]
 *
 * Vantagens sobre a substituição antiga: nunca esconde o termo literal, nunca
 * restringe demais (AND de 4 palavras), e dispensa o banner "busquei por X".
 */
// Siglas curtas que NÃO devem casar como literal: 'ira' casaria em "vIRAl",
// 'fa' em "FAsciolíase". Quando uma destas dispara, a busca usa SÓ os formais
// (substitui o literal), não o adiciona. Derivado: todo coloquial ≤4 chars
// alfanumérico puro é tratado como sigla.
function ehSigla(termo) {
  return /^[a-z]{2,4}$/.test(termo)
}

export function gruposDeSinonimos(query) {
  const q = query.toLowerCase().trim()

  // Tokeniza a query em palavras.
  const palavras = q.split(/\s+/).filter(Boolean)

  // Para cada coloquial que casa na query, guarda as formas formais por palavra-chave.
  const alternativasPorTermo = new Map() // chave = primeira palavra do coloquial

  for (const [coloquial, formal] of SINONIMOS) {
    if (coloquial === formal) continue // passivas: o termo já se busca a si mesmo
    const re = new RegExp(`${BOUNDARY_ANTES}${escapeRegex(coloquial)}${BOUNDARY_DEPOIS}`, 'i')
    if (re.test(q)) {
      const chave = coloquial.split(/\s+/)[0]
      if (!alternativasPorTermo.has(chave)) alternativasPorTermo.set(chave, new Set())
      alternativasPorTermo.get(chave).add(formal)
    }
  }

  // Monta um grupo por palavra:
  //   - palavra normal com sinônimos → [palavra, ...formais]  (aditivo, OR)
  //   - SIGLA com sinônimos → [...formais]  (substitui: não inclui a sigla literal,
  //     que casaria substring de qualquer palavra)
  //   - palavra sem sinônimo → [palavra]  (busca literal)
  const grupos = palavras.map(p => {
    const formais = alternativasPorTermo.get(p)
    if (formais && ehSigla(p)) return [...formais]      // sigla: só os formais
    if (formais) return [p, ...formais]                 // termo normal: aditivo
    return [p]                                          // sem sinônimo
  })

  return grupos.length > 0 ? grupos : [[q]]
}

/**
 * COMPAT: expansão substitutiva antiga, usada por Home.jsx e CalculadoraPage.jsx,
 * que têm fluxo de busca próprio com a RPC search_cid_unaccent. A busca principal
 * (DiagnosticoPage) usa gruposDeSinonimos (aditivo). Mantido pra não quebrá-las.
 */
export function expandirSinonimos(query) {
  let expanded = query.toLowerCase().trim()
  const substituicoes = []
  for (const [coloquial, formal] of SINONIMOS) {
    if (coloquial === formal) continue
    const regex = new RegExp(`${BOUNDARY_ANTES}${escapeRegex(coloquial)}${BOUNDARY_DEPOIS}`, 'i')
    if (regex.test(expanded)) {
      expanded = expanded.replace(regex, formal)
      substituicoes.push({ de: coloquial, para: formal })
    }
  }
  return { expanded, substituicoes }
}
