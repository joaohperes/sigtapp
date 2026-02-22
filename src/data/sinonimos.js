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
  ['infarto',          'infarto agudo do miocárdio'],
  ['ataque cardíaco',  'infarto agudo do miocárdio'],
  ['derrame cerebral', 'acidente vascular cerebral'],
  ['derrame',          'acidente vascular cerebral'],
  ['avc',              'acidente vascular cerebral'],
  ['avc isquêmico',    'infarto cerebral'],
  ['avc hemorrágico',  'hemorragia cerebral'],
  ['pressão alta',     'hipertensão essencial'],
  ['hipertensão',      'hipertensão essencial'],
  ['angina',           'angina pectoris'],
  ['insuficiência cardíaca', 'insuficiência cardíaca'],
  ['arritmia',         'transtornos do ritmo cardíaco'],

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

  // Neurológico / Psiquiátrico
  ['alzheimer',        'doença de alzheimer'],
  ['parkinson',        'doença de parkinson'],
  ['epilepsia',        'epilepsia'],
  ['convulsão',        'epilepsia'],
  ['depressão',        'transtorno depressivo'],
  ['ansiedade',        'transtornos de ansiedade'],
  ['esquizofrenia',    'esquizofrenia'],
  ['demência',         'demência'],

  // Respiratório
  ['pneumonia',        'pneumonia'],
  ['tuberculose',      'tuberculose'],
  ['tb pulmonar',      'tuberculose pulmonar'],
  ['bronquite',        'bronquite'],
  ['asma',             'asma'],
  ['enfisema',         'enfisema'],
  ['dpoc',             'doença pulmonar obstrutiva crônica'],
  ['covid',            'covid-19'],

  // Digestivo / Hepático
  ['cirrose',          'cirrose hepática'],
  ['hepatite',         'hepatite'],
  ['úlcera',           'úlcera'],
  ['apendicite',       'apendicite'],
  ['pancreatite',      'pancreatite'],
  ['pedra na vesícula','colelitíase'],
  ['cálculo biliar',   'colelitíase'],

  // Renal / Urológico
  ['pedra no rim',     'cálculo do rim'],
  ['cálculo renal',    'cálculo do rim e do ureter'],
  ['insuficiência renal', 'insuficiência renal'],

  // Ginecológico / Obstétrico
  ['endometriose',     'endometriose'],
  ['mioma',            'leiomioma do útero'],
  ['ovário policístico','síndrome dos ovários policísticos'],
  ['eclampsia',        'eclampsia'],
  ['pré-eclampsia',    'pré-eclampsia'],

  // Infecciosas
  ['sepse',            'septicemia'],
  ['septicemia',       'septicemia'],
  ['aids',             'doença pelo vírus da imunodeficiência humana'],
  ['hiv',              'doença pelo vírus da imunodeficiência humana'],
  ['dengue',           'dengue'],
  ['malária',          'malária'],
  ['leptospirose',     'leptospirose'],

  // Músculo-esquelético
  ['fratura',          'fratura'],
  ['artrite',          'artrite'],
  ['artrose',          'artrose'],
  ['osteoporose',      'osteoporose'],
  ['lombalgia',        'dor lombar'],
  ['hérnia de disco',  'transtornos de disco intervertebral'],

  // Causas externas (relevantes para D.O.)
  ['afogamento',       'afogamento'],
  ['envenenamento',    'envenenamento'],
  ['intoxicação',      'intoxicação'],
  ['atropelamento',    'acidente de trânsito'],
  ['suicídio',         'lesão autoprovocada'],
  ['homicídio',        'agressão'],
  ['queda',            'queda'],
  ['queimadura',       'queimadura'],
]

/**
 * Expande um termo de busca substituindo sinônimos coloquiais pelos termos formais.
 * Retorna { expanded, substituições } para exibir feedback ao usuário.
 */
export function expandirSinonimos(query) {
  let expanded = query.toLowerCase().trim()
  const substituicoes = []

  for (const [coloquial, formal] of SINONIMOS) {
    if (expanded.includes(coloquial) && coloquial !== formal) {
      expanded = expanded.replace(coloquial, formal)
      substituicoes.push({ de: coloquial, para: formal })
    }
  }

  return { expanded, substituicoes }
}
