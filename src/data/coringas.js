// Procedimentos "coringa" — aparecem em quase toda internação de urgência/emergência
// Clique redireciona para busca no SIGTAP
export const CORINGAS = [
  { label: 'Hemograma',         query: 'hemograma completo',              grupo: 'diagnóstico' },
  { label: 'Gasometria',        query: 'gasometria arterial',             grupo: 'diagnóstico' },
  { label: 'Lactato',           query: 'dosagem acido lactico',           grupo: 'diagnóstico' },
  { label: 'PCR',               query: 'proteina c reativa',              grupo: 'diagnóstico' },
  { label: 'Hemocultura',       query: 'hemocultura',                     grupo: 'diagnóstico' },
  { label: 'Raio-X Tórax',      query: 'radiografia torax',               grupo: 'diagnóstico' },
  { label: 'ECG',               query: 'eletrocardiograma',               grupo: 'diagnóstico' },
  { label: 'Troponina',         query: 'troponina',                       grupo: 'diagnóstico' },
  { label: 'Hidratação EV',     query: 'hidratacao venosa',               grupo: 'terapêutico' },
  { label: 'ATB EV',            query: 'antibiotico endovenoso',          grupo: 'terapêutico' },
  { label: 'Oxigenoterapia',    query: 'oxigenoterapia',                  grupo: 'terapêutico' },
  { label: 'Urina I + Urocultura', query: 'urina rotina',                grupo: 'diagnóstico' },
]
