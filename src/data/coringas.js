// Procedimentos "coringa" — procedimentos terapêuticos/invasivos frequentes no PS/UTI
// Foco: o que aparece na AIH, não exames de rotina ou medicamentos
export const CORINGAS = [
  { label: 'Tratamento clínico geral',       query: 'tratamento clinico',                    grupo: 'clínico' },
  { label: 'Tratamento sepse/choque séptico', query: 'tratamento septicemia',                 grupo: 'clínico' },
  { label: 'Tratamento pneumonia',            query: 'tratamento pneumonia',                  grupo: 'clínico' },
  { label: 'Tratamento AVC isquêmico',        query: 'tratamento avc isquemico',              grupo: 'clínico' },
  { label: 'Tratamento IAM',                  query: 'tratamento infarto agudo miocardio',    grupo: 'clínico' },
  { label: 'Tratamento insuf. cardíaca',      query: 'tratamento insuficiencia cardiaca',     grupo: 'clínico' },
  { label: 'Ventilação mecânica',             query: 'ventilacao mecanica',                   grupo: 'terapêutico' },
  { label: 'Cateterismo vesical',             query: 'cateterismo vesical',                   grupo: 'terapêutico' },
  { label: 'Acesso venoso central',           query: 'cateter venoso central',                grupo: 'terapêutico' },
  { label: 'Transfusão hemácias',             query: 'transfusao concentrado hemacias',       grupo: 'terapêutico' },
  { label: 'Endoscopia digestiva alta',       query: 'endoscopia digestiva alta',             grupo: 'terapêutico' },
  { label: 'Drenagem torácica',               query: 'drenagem torax',                        grupo: 'terapêutico' },
]
