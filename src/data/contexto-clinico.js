// Contexto clínico curado por CID — exibido na aba "Contexto" do painel de regulação
// Estrutura: { nota, cids_alt, dica_regulacao }
// nota: string curta descrevendo o contexto clínico
// cids_alt: [{ co_cid, label, motivo }] — CIDs alternativos úteis para regulação
// dica_regulacao: string com dica específica de como usar o SIGTAP para esse diagnóstico

export const CONTEXTO_CLINICO = {
  // ── Cardiovascular ──────────────────────────────────────────────────────────
  I219: {
    nota: 'IAM com ou sem supra de ST. Internação clínica prioritária.',
    cids_alt: [
      { co_cid: 'I200', label: 'Angina instável', motivo: 'Se IAM não confirmado na entrada' },
      { co_cid: 'I248', label: 'Outras SCA', motivo: 'Se diagnóstico ainda incerto' },
    ],
    dica_regulacao: 'Use I219 para IAM confirmado. Proc. principal: Tratamento de Infarto Agudo do Miocárdio (0303.06.019). Caso bloqueado, Tratamento de Cardiopatia Isquêmica Crônica (0303.06.004) também aceita I219.',
  },
  I200: {
    nota: 'Angina instável — síndrome coronariana aguda sem elevação de marcadores.',
    cids_alt: [
      { co_cid: 'I219', label: 'IAM', motivo: 'Se marcadores elevaram durante internação' },
      { co_cid: 'I248', label: 'Outra SCA', motivo: 'Alternativo genérico' },
    ],
    dica_regulacao: 'Sem proc. específico para angina instável. Use Tratamento de Cardiopatia Isquêmica Crônica (0303.06.004) ou Tratamento de Infarto Agudo do Miocárdio se evolução para IAM.',
  },
  I500: {
    nota: 'ICC descompensada — insuficiência cardíaca com fração de ejeção reduzida ou preservada.',
    cids_alt: [
      { co_cid: 'I509', label: 'IC inespecífica', motivo: 'Se subtipo não determinado' },
      { co_cid: 'J81', label: 'EAP', motivo: 'Se apresentação predominante for edema agudo de pulmão' },
    ],
    dica_regulacao: 'Proc. clínico disponível: Tratamento de Insuficiência Cardíaca (0303.06.008). Considere J81 se o quadro for predominantemente respiratório.',
  },
  I48: {
    nota: 'Fibrilação / flutter atrial — aguda ou crônica descompensada.',
    cids_alt: [
      { co_cid: 'I472', label: 'Taquicardia ventricular', motivo: 'Se ritmo de difícil diferenciação' },
      { co_cid: 'I490', label: 'FV', motivo: 'Se degenerou para FV' },
    ],
    dica_regulacao: 'Proc.: Tratamento de Arritmias Cardíacas (0303.06.014). FA e flutter compartilham o mesmo código de procedimento.',
  },
  I472: {
    nota: 'Taquicardia ventricular sustentada — emergência arrítmica.',
    cids_alt: [
      { co_cid: 'I490', label: 'FV', motivo: 'Se degenerou para fibrilação ventricular' },
      { co_cid: 'I460', label: 'PCR ressuscitada', motivo: 'Se houve parada antes do diagnóstico' },
    ],
    dica_regulacao: 'Use Tratamento de Arritmias Cardíacas (0303.06.014). TV e FV compartilham o mesmo procedimento clínico no SIGTAP.',
  },
  I460: {
    nota: 'PCR com retorno da circulação espontânea (ROSC). Cuidados pós-PCR.',
    cids_alt: [
      { co_cid: 'I490', label: 'FV', motivo: 'Se ritmo inicial foi FV' },
      { co_cid: 'I472', label: 'TV', motivo: 'Se ritmo inicial foi TV sem pulso' },
    ],
    dica_regulacao: 'Proc.: Tratamento de Arritmias Cardíacas (0303.06.014) ou Tratamento de Parada Cardiorrespiratória (0303.06.017).',
  },
  I490: {
    nota: 'Fibrilação ventricular — arritmia letal revertida.',
    cids_alt: [
      { co_cid: 'I460', label: 'PCR ressuscitada', motivo: 'Complementar ao diagnóstico de FV' },
      { co_cid: 'I472', label: 'TV', motivo: 'Se ritmo inicial foi TV sem pulso' },
    ],
    dica_regulacao: 'Proc.: Tratamento de Arritmias Cardíacas (0303.06.014).',
  },
  I330: {
    nota: 'Endocardite infecciosa aguda — necessita ecocardiograma e hemoculturas.',
    cids_alt: [
      { co_cid: 'I38', label: 'Endocardite NE', motivo: 'Se agente não identificado' },
      { co_cid: 'I099', label: 'Cardite reumática', motivo: 'Se etiologia reumática' },
    ],
    dica_regulacao: 'Proc.: Tratamento de Endocardite (0303.06.006). Pode precisar de cirurgia (grupo 04).',
  },
  I710: {
    nota: 'Dissecção / aneurisma dissecante da aorta — emergência cirúrgica vascular.',
    cids_alt: [
      { co_cid: 'I711', label: 'Dissecção torácica', motivo: 'Tipo A (Stanford)' },
      { co_cid: 'I713', label: 'Dissecção abdominal', motivo: 'Tipo B (Stanford)' },
    ],
    dica_regulacao: 'Proc. clínico: Tratamento de Aneurisma da Aorta (0303.06.001). Tipo A geralmente requer cirurgia (grupo 04 — cirurgia cardíaca).',
  },
  I702: {
    nota: 'DAOP — doença arterial obstrutiva periférica. Claudicação ou isquemia crítica.',
    cids_alt: [
      { co_cid: 'I739', label: 'Doença vasc. periférica', motivo: 'Se não especificado como aterosclerose' },
      { co_cid: 'I748', label: 'Embolia arterial', motivo: 'Se oclusão aguda por êmbolo' },
    ],
    dica_regulacao: 'Proc.: Tratamento de Insuficiência Arterial c/ Isquemia Crítica (0303.06.020). Para claudicação sem isquemia crítica, use Tratamento de Outras Doenças Vasculares Periféricas.',
  },
  I739: {
    nota: 'Doença vascular periférica inespecífica — inclui Raynaud, acrocianose, outras.',
    cids_alt: [
      { co_cid: 'I702', label: 'DAOP', motivo: 'Se etiologia aterosclerótica confirmada' },
    ],
    dica_regulacao: 'Use Tratamento de Outras Doenças das Artérias, Arteríolas e Capilares (0303.06).',
  },

  // ── Respiratório ─────────────────────────────────────────────────────────────
  J960: {
    nota: 'Insuficiência respiratória aguda — pode requerer suporte ventilatório.',
    cids_alt: [
      { co_cid: 'J189', label: 'Pneumonia', motivo: 'Se foco infeccioso pulmonar' },
      { co_cid: 'J441', label: 'DPOC exacerbado', motivo: 'Se exacerbação de DPOC' },
    ],
    dica_regulacao: 'Proc.: Tratamento de Insuficiência Respiratória (0303.14.012). Se em UTI, use proc. de terapia intensiva (grupo 03.05).',
  },
  J189: {
    nota: 'Pneumonia inespecificada — causa mais comum de internação por pneumonia comunitária.',
    cids_alt: [
      { co_cid: 'J180', label: 'Broncopneumonia', motivo: 'Padrão radiológico difuso' },
      { co_cid: 'J690', label: 'Pneumonia aspirativa', motivo: 'Se contexto de disfagia/rebaixamento' },
    ],
    dica_regulacao: 'Proc.: Tratamento de Pneumonias (0303.14.009). Alternativa: Tratamento de Doenças Respiratórias — Infecções Pulmonares.',
  },
  J441: {
    nota: 'DPOC exacerbado — agudização de bronquite crônica obstrutiva.',
    cids_alt: [
      { co_cid: 'J960', label: 'IRpA', motivo: 'Se insuficiência respiratória predominante' },
      { co_cid: 'J459', label: 'Asma grave', motivo: 'Se difícil diferenciação clínica' },
    ],
    dica_regulacao: 'Proc.: Tratamento das Doenças Crônicas das Vias Aéreas Inferiores (0303.14.004). Único proc. clínico disponível para J441 no SIGTAP.',
  },
  J459: {
    nota: 'Asma aguda grave / estado de mal asmático.',
    cids_alt: [
      { co_cid: 'J441', label: 'DPOC exacerbado', motivo: 'Se componente obstrutivo crônico' },
      { co_cid: 'J960', label: 'IRpA', motivo: 'Se falência respiratória' },
    ],
    dica_regulacao: 'Proc.: Tratamento das Doenças Crônicas das Vias Aéreas Inferiores (0303.14.004) — mesmo proc. do DPOC. É o único código clínico disponível.',
  },
  J81: {
    nota: 'Edema agudo de pulmão — pode ser cardiogênico (ICC) ou não cardiogênico (SARA).',
    cids_alt: [
      { co_cid: 'I500', label: 'ICC', motivo: 'Se origem cardiogênica' },
      { co_cid: 'J960', label: 'IRpA', motivo: 'Se componente respiratório predomina' },
    ],
    dica_regulacao: 'Proc.: Tratamento de Doenças Respiratórias que Afetam o Interstício Pulmonar (0303.14.011).',
  },
  J852: {
    nota: 'Abscesso pulmonar — coleção purulenta intrapulmonar.',
    cids_alt: [
      { co_cid: 'J869', label: 'Piotórax', motivo: 'Se empiema pleural associado' },
      { co_cid: 'J189', label: 'Pneumonia', motivo: 'Se abscesso ainda em formação' },
    ],
    dica_regulacao: 'Proc.: Tratamento de Pneumonias (0303.14.009). Pode requerer drenagem cirúrgica (grupo 04).',
  },

  // ── Infeccioso ───────────────────────────────────────────────────────────────
  A419: {
    nota: 'Sepse — síndrome de resposta inflamatória sistêmica a infecção. Use o CID do foco quando possível.',
    cids_alt: [
      { co_cid: 'J189', label: 'Pneumonia (foco pulm.)', motivo: 'Foco pulmonar — melhor alternativo' },
      { co_cid: 'N390', label: 'ITU (foco urinário)', motivo: 'Foco urinário — mais específico' },
      { co_cid: 'K659', label: 'Peritonite (foco abd.)', motivo: 'Foco abdominal' },
    ],
    dica_regulacao: 'Estratégia: use o CID do foco infeccioso com o proc. correspondente. A419 tem proc. próprio (0303.01.007), mas os focais são mais aceitos pelo regulador.',
  },
  N390: {
    nota: 'ITU / pielonefrite — infecção do trato urinário com repercussão sistêmica.',
    cids_alt: [
      { co_cid: 'N10', label: 'Nefrite tubuloint. aguda', motivo: 'Se atingimento renal parenquimatoso' },
      { co_cid: 'A419', label: 'Sepse', motivo: 'Se critérios de sepse presentes' },
    ],
    dica_regulacao: 'Proc.: Tratamento de Outras Doenças do Aparelho Urinário (0303.15.005). Alternativa: Tratamento de Doenças Renais Túbulo-Intersticiais.',
  },
  L031: {
    nota: 'Celulite / erisipela — infecção bacteriana do tecido subcutâneo.',
    cids_alt: [
      { co_cid: 'L089', label: 'Infecção local pele', motivo: 'Alternativo inespecífico' },
      { co_cid: 'A410', label: 'Sepse Staph', motivo: 'Se bacteremia associada' },
    ],
    dica_regulacao: 'Proc.: Tratamento de Estafilococcias (0303.08.006) ou Tratamento de Estreptococcias (0303.08.007). Escolha conforme o agente suspeito.',
  },
  G009: {
    nota: 'Meningite bacteriana inespecificada — emergência neurológica.',
    cids_alt: [
      { co_cid: 'G039', label: 'Meningite NE', motivo: 'Se etiologia indeterminada' },
      { co_cid: 'A394', label: 'Meningococcemia c/ meningite', motivo: 'Se meningococo suspeito' },
    ],
    dica_regulacao: 'Proc.: Tratamento de Meningites Bacterianas (0303.04.015). Único proc. clínico disponível — não há alternativo no SIGTAP para G009.',
  },

  // ── Neurológico ──────────────────────────────────────────────────────────────
  I639: {
    nota: 'AVC isquêmico — oclusão arterial cerebral. Janela terapêutica para trombólise: 4,5h.',
    cids_alt: [
      { co_cid: 'I619', label: 'AVC hemorrágico', motivo: 'Diferenciar antes da trombólise' },
      { co_cid: 'G450', label: 'AIT', motivo: 'Se resolução em < 24h' },
    ],
    dica_regulacao: 'Proc.: Tratamento de AVC Isquêmico (0303.04.030) ou Tratamento de AVC em Geral (0303.04.014). Múltiplos procs. disponíveis — use o mais específico.',
  },
  I619: {
    nota: 'AVC hemorrágico — hemorragia intraparenquimatosa cerebral.',
    cids_alt: [
      { co_cid: 'I609', label: 'HSA', motivo: 'Se hemorragia subaracnóide' },
      { co_cid: 'I639', label: 'AVC isquêmico', motivo: 'Se TC não disponível e isquêmico suspeito' },
    ],
    dica_regulacao: 'Proc.: Tratamento Conservador da Hemorragia Cerebral (0303.04.007). Cirúrgico se indicado (grupo 04).',
  },
  I609: {
    nota: 'HSA — hemorragia subaracnóide, classicamente por rotura de aneurisma.',
    cids_alt: [
      { co_cid: 'I619', label: 'AVC hemorrágico', motivo: 'Se hemorragia parenquimatosa associada' },
      { co_cid: 'G934', label: 'Encefalopatia', motivo: 'Se alteração de consciência predomina' },
    ],
    dica_regulacao: 'Proc.: Tratamento de AVC (0303.04.014) ou Tratamento Conservador da Hemorragia (0303.04.007). Cirurgia endovascular ou neurocirurgia pelo grupo 04.',
  },
  G419: {
    nota: 'Estado de mal epiléptico — crises > 5 min ou duas crises sem recuperação entre elas.',
    cids_alt: [
      { co_cid: 'G409', label: 'Epilepsia NE', motivo: 'Se crise única sem EME' },
      { co_cid: 'G934', label: 'Encefalopatia', motivo: 'Se causa metabólica/tóxica' },
    ],
    dica_regulacao: 'Proc.: Tratamento de Crises Epiléticas Não Controladas (0303.04.022) e outros procs. neurológicos. Boa cobertura no SIGTAP.',
  },
  G934: {
    nota: 'Encefalopatia — disfunção cerebral difusa de causa metabólica, tóxica ou anóxica.',
    cids_alt: [
      { co_cid: 'G419', label: 'EME', motivo: 'Se crises convulsivas presentes' },
      { co_cid: 'F059', label: 'Delirium', motivo: 'Se agitação/confusão predomina' },
    ],
    dica_regulacao: 'Proc.: Tratamento de Processo Tóxico-Infeccioso do SNC (0303.04.024). Vários procs. neurológicos disponíveis para G934.',
  },

  // ── Renal / Metabólico ───────────────────────────────────────────────────────
  N179: {
    nota: 'IRA — insuficiência renal aguda, qualquer etiologia.',
    cids_alt: [
      { co_cid: 'N189', label: 'DRC agudizada', motivo: 'Se DRC prévia conhecida' },
      { co_cid: 'N10', label: 'Nefrite tubuloint.', motivo: 'Se causa tubulointersticial' },
    ],
    dica_regulacao: 'Proc.: Tratamento de Doenças Renais Túbulo-Intersticiais (0303.15.004). Alternativas: Doenças Glomerulares, Outras Doenças Urinárias — ampla cobertura no SIGTAP.',
  },
  E101: {
    nota: 'DM1 com cetoacidose diabética — emergência endocrinológica.',
    cids_alt: [
      { co_cid: 'E111', label: 'DM2 c/ CAD', motivo: 'Se tipo incerto ou LADA' },
      { co_cid: 'E875', label: 'Hipercalemia', motivo: 'Se hipercalemia proeminente na CAD' },
    ],
    dica_regulacao: 'Proc.: Tratamento de Diabetes Mellitus (0303.03.003). Alternativo disponível: Tratamento de Distúrbios Metabólicos.',
  },
  E111: {
    nota: 'DM2 com cetoacidose diabética — menos comum que em DM1, geralmente por fator precipitante.',
    cids_alt: [
      { co_cid: 'E101', label: 'DM1 c/ CAD', motivo: 'Se tipo incerto' },
      { co_cid: 'E876', label: 'Hipocalemia', motivo: 'Hipocalemia é complicação comum da CAD tratada' },
    ],
    dica_regulacao: 'Proc.: Tratamento de Diabetes Mellitus (0303.03.003). Apenas 1 alternativo disponível no SIGTAP para E111.',
  },
  E875: {
    nota: 'Hipercalemia — K+ sérico > 5,5 mEq/L com repercussão clínica.',
    cids_alt: [
      { co_cid: 'E876', label: 'Hipocalemia', motivo: 'Verificar ao tratar — pode inverter' },
      { co_cid: 'N179', label: 'IRA', motivo: 'Causa mais comum de hipercalemia grave' },
    ],
    dica_regulacao: 'Proc.: Tratamento de Distúrbios Metabólicos (0303.03.004). Único proc. disponível — mesmo código para hiper e hipocalemia.',
  },
  E876: {
    nota: 'Hipocalemia — K+ sérico < 3,5 mEq/L com repercussão clínica.',
    cids_alt: [
      { co_cid: 'E875', label: 'Hipercalemia', motivo: 'Pode inverter durante tratamento' },
      { co_cid: 'E871', label: 'Hiponatremia', motivo: 'Distúrbios eletrolíticos coexistentes' },
    ],
    dica_regulacao: 'Proc.: Tratamento de Distúrbios Metabólicos (0303.03.004). Único proc. disponível para distúrbios de K+.',
  },

  // ── Abdominal ────────────────────────────────────────────────────────────────
  K920: {
    nota: 'HDA — hemorragia digestiva alta. Vômito de sangue ou sangue em SNG.',
    cids_alt: [
      { co_cid: 'K921', label: 'Melena', motivo: 'Se sangramento distal ao ligamento de Treitz' },
      { co_cid: 'K250', label: 'Úlcera gástrica', motivo: 'Se úlcera como causa da HDA' },
    ],
    dica_regulacao: 'Proc.: Tratamento de Outras Doenças do Aparelho Digestivo (0303.07.010). Ampla cobertura com correlatos — Doenças do Fígado, Vias Biliares, Peritônio.',
  },
  K859: {
    nota: 'Pancreatite aguda — inflamação pancreática, avaliar gravidade pelo critério de Ranson/APACHE.',
    cids_alt: [
      { co_cid: 'K850', label: 'Colangite (pancreatite biliar)', motivo: 'Se etiologia biliar com colangite' },
      { co_cid: 'K659', label: 'Peritonite', motivo: 'Se necrose infectada com peritonite' },
    ],
    dica_regulacao: 'Proc.: Tratamento de Doenças do Fígado (0303.07.004). Correlatos disponíveis: Vias Biliares, Peritônio, Doenças Intestinais.',
  },
  K659: {
    nota: 'Peritonite — inflamação do peritônio, geralmente bacteriana.',
    cids_alt: [
      { co_cid: 'K359', label: 'Apendicite', motivo: 'Se causa apendicular' },
      { co_cid: 'K859', label: 'Pancreatite', motivo: 'Se causa pancreática' },
    ],
    dica_regulacao: 'Proc.: Tratamento de Doenças do Fígado (0303.07.004) ou correlatos digestivos. Frequentemente requer cirurgia (grupo 04).',
  },

  // ── Obstétrico ───────────────────────────────────────────────────────────────
  O149: {
    nota: 'Pré-eclâmpsia — HAS + proteinúria após 20 semanas.',
    cids_alt: [
      { co_cid: 'O150', label: 'Eclâmpsia', motivo: 'Se convulsão presente' },
      { co_cid: 'O169', label: 'HAS na gravidez', motivo: 'Se HAS sem proteinúria' },
    ],
    dica_regulacao: 'Proc.: Tratamento de Edema, Proteinúria e Transtornos Hipertensivos (0303.10.003). Alternativas: Eclâmpsia, Intercorrências Clínicas na Gravidez.',
  },
  O85: {
    nota: 'Sepse puerperal — infecção sistêmica pós-parto ou pós-abortamento.',
    cids_alt: [
      { co_cid: 'O860', label: 'Infecção de ferida cirúrgica', motivo: 'Se foco pós-cesárea' },
      { co_cid: 'O159', label: 'Eclâmpsia NE', motivo: 'Se encefalopatia pós-parto' },
    ],
    dica_regulacao: 'Proc.: Tratamento de Complicações do Puerpério (0303.10.001). Alternativas disponíveis: Eclâmpsia, Edema/Proteinúria, Intercorrências na Gravidez.',
  },

  // ── Trauma / Intoxicação ─────────────────────────────────────────────────────
  T07: {
    nota: 'Politrauma — múltiplas lesões, pelo menos uma com risco de vida.',
    cids_alt: [
      { co_cid: 'S062', label: 'TCE grave', motivo: 'Se TCE é a lesão principal' },
      { co_cid: 'S327', label: 'Fratura de pelve', motivo: 'Se pelve instável é a lesão dominante' },
    ],
    dica_regulacao: 'Proc.: Tratamento Conservador de Traumatismo Raquimedular (0303.04.011) ou procs. de trauma específicos. Boa cobertura com correlatos.',
  },
  T399: {
    nota: 'Intoxicação por analgésicos / antipiréticos — inclui paracetamol, AAS.',
    cids_alt: [
      { co_cid: 'T650', label: 'Intox. por outras substâncias', motivo: 'Se substância não classificada' },
      { co_cid: 'K720', label: 'Insuf. hepática aguda', motivo: 'Se hepatotoxicidade por paracetamol' },
    ],
    dica_regulacao: 'Proc.: Tratamento de Intoxicação por Medicamentos (0308.02.003). Alternativa: Hemodiafiltração Contínua se necessário.',
  },
  T650: {
    nota: 'Intoxicação por cianetos / outras substâncias não medicamentosas.',
    cids_alt: [
      { co_cid: 'T399', label: 'Intox. por fármacos', motivo: 'Se mistura de substâncias' },
      { co_cid: 'T579', label: 'Intox. por outros agentes', motivo: 'Alternativo genérico' },
    ],
    dica_regulacao: 'Proc.: Tratamento de Intoxicação por Medicamentos e Substâncias (0308.02.003). Alternativa: Hemodiafiltração Contínua (0308.02.001) se hemodiálise indicada.',
  },

  // ── Psiquiátrico ─────────────────────────────────────────────────────────────
  F200: {
    nota: 'Esquizofrenia — psicose crônica com surto agudo.',
    cids_alt: [
      { co_cid: 'F319', label: 'Transtorno bipolar', motivo: 'Se episódio maníaco com psicose' },
      { co_cid: 'F239', label: 'Psicose aguda', motivo: 'Se primeiro episódio sem diagnóstico' },
    ],
    dica_regulacao: 'Proc.: Tratamento em Psiquiatria (grupo 0303.17). Vários procs. disponíveis — lista principal já mostra as opções. Internação psiquiátrica segue fluxo específico.',
  },
  F329: {
    nota: 'Depressão grave — episódio depressivo com risco de autolesão ou catatonia.',
    cids_alt: [
      { co_cid: 'F319', label: 'Transtorno bipolar', motivo: 'Se episódio depressivo em bipolar' },
      { co_cid: 'F412', label: 'Depressão ansiosa', motivo: 'Se componente ansioso proeminente' },
    ],
    dica_regulacao: 'Proc.: Tratamento Clínico em Saúde Mental em Situação de Risco Elevado de Suicídio (0303.17.013) — mais específico para internação por risco.',
  },
}
