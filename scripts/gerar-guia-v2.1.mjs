/**
 * Gerador do Guia de Códigos PS-HRO v2.1
 *
 * Uso: node scripts/gerar-guia-v2.1.mjs
 * Saída: /tmp/guia_ps_hro_v2.1.docx
 *
 * Correções em relação à v2.0:
 *  - Nefrologia: 0303080097→0305020048 (IRA), 0303080054→0305020013 (Pielonefrite)
 *  - TCE Grave e TRM: alertas de habilitação (exigem 1602+2502, HRO só tem 1601+2501)
 *  - Novo: abscesso de mama 0410010014 (grupo 04) + alternativa 0303080094
 *  - Parte 2: adicionada linha abscesso de mama
 */

import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType,
  ShadingType, PageNumber, PageBreak, LevelFormat,
} from 'docx'
import { writeFileSync } from 'fs'

// ── Paleta ───────────────────────────────────────────────────────────────────
const BLUE_DARK   = "1B4F72"
const BLUE_MED    = "2E86C1"
const BLUE_HEADER = "2874A6"
const RED_ALERT   = "922B21"
const GREEN_OK    = "1E8449"
const WHITE       = "FFFFFF"
const YELLOW_WARN = "FFF3CD"
const GRAY_LIGHT  = "F8F9F9"

// ── Dimensões (landscape Letter) ─────────────────────────────────────────────
const PAGE_W   = 15840
const PAGE_H   = 12240
const MARGIN   = 900
const TBL_W    = PAGE_W - 2 * MARGIN // 14040

// ── Bordas / margens ─────────────────────────────────────────────────────────
const B = { style: BorderStyle.SINGLE, size: 1, color: "BDC3C7" }
const BORDERS  = { top: B, bottom: B, left: B, right: B }
const CELL_MAR = { top: 50, bottom: 50, left: 80, right: 80 }

// ── Helpers ──────────────────────────────────────────────────────────────────
function hdrCell(text, width, colSpan) {
  const opts = {
    borders: BORDERS,
    width: { size: width, type: WidthType.DXA },
    shading: { fill: BLUE_HEADER, type: ShadingType.CLEAR },
    margins: CELL_MAR,
    verticalAlign: "center",
    children: [new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text, bold: true, color: WHITE, font: "Arial", size: 17 })],
    })],
  }
  if (colSpan) opts.columnSpan = colSpan
  return new TableCell(opts)
}

function catRow(text, cols) {
  return new TableRow({ children: [
    new TableCell({
      borders: BORDERS,
      columnSpan: cols,
      width: { size: TBL_W, type: WidthType.DXA },
      shading: { fill: BLUE_DARK, type: ShadingType.CLEAR },
      margins: CELL_MAR,
      children: [new Paragraph({ children: [
        new TextRun({ text: text.toUpperCase(), bold: true, color: WHITE, font: "Arial", size: 18 }),
      ]})],
    }),
  ]})
}

// ── Tabela 1 ─────────────────────────────────────────────────────────────────
const COL1 = [1500, 4400, 3800, 4340]

function dataRow(code, name, cids, obs, highlight) {
  const fill = highlight ? YELLOW_WARN : WHITE

  const obsRuns = []
  if (obs && obs.startsWith("⚠")) {
    obsRuns.push(new TextRun({ text: obs, font: "Arial", size: 16, color: RED_ALERT, bold: true }))
  } else if (obs) {
    obsRuns.push(new TextRun({ text: obs, font: "Arial", size: 16 }))
  } else {
    obsRuns.push(new TextRun({ text: "", font: "Arial", size: 16 }))
  }

  const mkCell = (t, w, bold) => new TableCell({
    borders: BORDERS,
    width: { size: w, type: WidthType.DXA },
    shading: { fill, type: ShadingType.CLEAR },
    margins: CELL_MAR,
    children: [new Paragraph({
      spacing: { before: 15, after: 15 },
      children: [new TextRun({ text: t, font: "Arial", size: 16, bold: bold || false })],
    })],
  })

  return new TableRow({ children: [
    mkCell(code, COL1[0], true),
    mkCell(name, COL1[1]),
    mkCell(cids, COL1[2]),
    new TableCell({
      borders: BORDERS,
      width: { size: COL1[3], type: WidthType.DXA },
      shading: { fill, type: ShadingType.CLEAR },
      margins: CELL_MAR,
      children: [new Paragraph({ spacing: { before: 15, after: 15 }, children: obsRuns })],
    }),
  ]})
}

// ── Tabela 2 ─────────────────────────────────────────────────────────────────
const COL2 = [3200, 3200, 3800, 3840]

function altRow(situation, dontUse, useInstead, cids, idx) {
  const fill = idx % 2 === 0 ? WHITE : GRAY_LIGHT
  return new TableRow({ children: [
    new TableCell({
      borders: BORDERS, width: { size: COL2[0], type: WidthType.DXA },
      shading: { fill, type: ShadingType.CLEAR }, margins: CELL_MAR,
      children: [new Paragraph({ spacing: { before: 15, after: 15 },
        children: [new TextRun({ text: situation, font: "Arial", size: 16 })] })],
    }),
    new TableCell({
      borders: BORDERS, width: { size: COL2[1], type: WidthType.DXA },
      shading: { fill, type: ShadingType.CLEAR }, margins: CELL_MAR,
      children: [new Paragraph({ spacing: { before: 15, after: 15 },
        children: [new TextRun({ text: dontUse, font: "Arial", size: 16,
          color: dontUse === "—" ? "999999" : RED_ALERT, bold: dontUse !== "—" })] })],
    }),
    new TableCell({
      borders: BORDERS, width: { size: COL2[2], type: WidthType.DXA },
      shading: { fill, type: ShadingType.CLEAR }, margins: CELL_MAR,
      children: [new Paragraph({ spacing: { before: 15, after: 15 },
        children: [new TextRun({ text: useInstead, font: "Arial", size: 16, color: GREEN_OK, bold: true })] })],
    }),
    new TableCell({
      borders: BORDERS, width: { size: COL2[3], type: WidthType.DXA },
      shading: { fill, type: ShadingType.CLEAR }, margins: CELL_MAR,
      children: [new Paragraph({ spacing: { before: 15, after: 15 },
        children: [new TextRun({ text: cids, font: "Arial", size: 16 })] })],
    }),
  ]})
}

// ── Dados Parte 1 ─────────────────────────────────────────────────────────────
const procedures = [
  { cat: "CHOQUE & EMERGÊNCIAS METABÓLICAS" },
  { code: "0303060050", name: "Tratamento de Choque Anafilático", cids: "T78.2 (Choque anafilático NE)", obs: "" },
  { code: "0303060077", name: "Tratamento de Choque Hipovolêmico", cids: "R57.1 (Hipovolêmico) / R57.9 (Choque NE)", obs: "" },
  { code: "0303060069", name: "Tratamento de Choque Cardiogênico", cids: "R57.0 (Choque cardiogênico)", obs: "" },
  { code: "0303030046", name: "Tratamento de Distúrbios Metabólicos", cids: "E87.2 (Acidose) / E87.4 (Dist. misto)", obs: "Inclui DHE graves" },

  { cat: "CARDIOLOGIA" },
  { code: "0303060190", name: "Tratamento de IAM", cids: "I21.9 (IAM NE) / R57.0 (se choque)", obs: "" },
  { code: "0303060280", name: "Tratamento de SCA", cids: "I20.0 (Angina instável)", obs: "" },
  { code: "0303060026", name: "Tratamento de Arritmias", cids: "I44.0-2 (BAV) / I48 (FA) / I47.1 (TSV) / I47.2 (TV)", obs: "" },
  { code: "0303060212", name: "Tratamento de IC", cids: "I50.0 (ICC)", obs: "" },
  { code: "0303060140", name: "Tratamento de Embolia Pulmonar", cids: "I26.0 (c/ cor pulmonale) / I26.9 (s/)", obs: "" },
  { code: "0303060131", name: "Tratamento de Edema Agudo de Pulmão", cids: "J81 (EAP) / I50.1 (IC esquerda)", obs: "" },
  { code: "0303060107", name: "Tratamento de Crise Hipertensiva", cids: "I10 (HAS) / I11.9 (Cardiopatia hipertensiva)", obs: "" },
  { code: "0303060255", name: "Trat. de Parada Cardíaca c/ Ressuscitação", cids: "I46.0 (PCR com RCE) / I46.9 (PCR NE)", obs: "" },
  { code: "0303060298", name: "Tratamento de TVP", cids: "I80.2 (TVP MMII) / I80.9 (NE)", obs: "" },
  { code: "0303060204", name: "Trat. de Insuf. Arterial c/ Isquemia Crítica", cids: "I74.3 (Embolia MMII) / I74.9 (NE)", obs: "" },
  { code: "0303060239", name: "Tratamento de Miocardiopatias", cids: "I42.9 (NE) / I40.9 (Miocardite NE)", obs: "Takotsubo, miocardite" },
  { code: "0303060166", name: "Trat. de Endocardite em Válvula Nativa", cids: "I39.8 (Endocardite)", obs: "" },
  { code: "0303060271", name: "Tratamento de Pericardite", cids: "I32.8 (Pericardite especificada)", obs: "" },
  { code: "0303140062", name: "Trat. de Cardiopatia Pulmonar", cids: "I26.0 / I27.9", obs: "" },
  { code: "0303060263", name: "Trat. de Pé Diabético Complicado", cids: "E10.5/E11.5 (DM c/ compl. vasculares)", obs: "" },

  { cat: "PNEUMOLOGIA & VIAS AÉREAS" },
  { code: "0303140151", name: "Tratamento de Pneumonias ou Influenza", cids: "J18.9 (Pneumonia NE) / J09-J11 (Influenza)", obs: "" },
  { code: "0303140135", name: "Trat. de Outras Doenças do Ap. Respiratório", cids: "J96.0 (IRpA) / J80 (SDRA)", obs: "Usar para IRpA de qualquer causa" },
  { code: "0303140143", name: "Trat. de Outras Infecções Agudas de VAI", cids: "J21.0 (Bronquiolite VSR) / J21.8-9", obs: "" },
  { code: "0303140046", name: "Trat. de Doenças Crônicas das VAI (DPOC)", cids: "J44.1 (DPOC exacerbada)", obs: "" },
  { code: "0303140127", name: "Trat. de Outras Doenças das VAS", cids: "J36 (Absc. periamigdaliano) / J39.0", obs: "" },
  { code: "0303140097", name: "Trat. de Hemorragias das Vias Respiratórias", cids: "R04.2 (Hemoptise) / R04.9 (NE)", obs: "" },
  { code: "0303140119", name: "Trat. de Outras Doenças da Pleura", cids: "J90 (Derrame pleural) / J91", obs: "Derrame sem indicação de drenagem" },
  { code: "0303140038", name: "Trat. de Afecções Necróticas/Supurativas VAI", cids: "J85.1 (Absc. pulmonar) / J86.9 (Empiema)", obs: "" },

  { cat: "NEUROLOGIA CLÍNICA" },
  { code: "0303040149", name: "Tratamento de AVC (Isquêmico ou Hemorrágico)", cids: "I64 (NE) / I63.9 (Isq.) / I61.9 (Hem.)", obs: "HRO hab. AVC Tipo III (1617)" },
  { code: "0303040076", name: "Trat. Conservador da Hemorragia Cerebral", cids: "I61.9 (Hemorragia intracerebral NE)", obs: "Usar quando não há indicação cx" },
  { code: "0303040165", name: "Trat. de Crises Epilépticas não Controladas", cids: "G41.9 (Status epilepticus) / G40.9", obs: "" },
  { code: "0303040211", name: "Trat. de Encefalopatia Hipertensiva", cids: "I67.4 (Encefalopatia hipertensiva)", obs: "" },
  { code: "0303040262", name: "Tratamento de Polineuropatias", cids: "G61.0 (Guillain-Barré) / G63.8", obs: "" },
  { code: "0303040254", name: "Tratamento de Miastenia Grave", cids: "G70.0 (Miastenia grave)", obs: "" },
  { code: "0303010142", name: "Trat. de Meningites Virais/Bacterianas", cids: "G00.9 (Bacteriana NE) / G03.9 (Viral)", obs: "" },
  { code: "0303040297", name: "Trat. de Processo Toxi-infeccioso Cérebro/Medula", cids: "G04.9 (Encefalite NE) / G05.8", obs: "" },
  { code: "0303040041", name: "Tratamento Clínico de Abscesso Cerebral", cids: "G06.0 (Abscesso intracraniano)", obs: "" },

  { cat: "NEUROTRAUMA" },
  { code: "0303040084", name: "Trat. Conservador de TCE (Leve)", cids: "S06.0 (Concussão)", obs: "" },
  { code: "0303040092", name: "Trat. Conservador de TCE (Médio)", cids: "S06.2 / S06.5 / S06.6 (HSA)", obs: "" },
  { code: "0303040106", name: "Trat. Conservador de TCE (Grave)", cids: "S06.9 (NE) / S06.7 (Coma prolongado)", obs: "⚠ Exige hab. 1602+2502 — verificar FPO", highlight: true },
  { code: "0303040114", name: "Trat. Conservador de TRM", cids: "S14.1 / S24.1 / S34.1", obs: "⚠ Exige hab. 1602+2502 — verificar FPO", highlight: true },
  { code: "0303040238", name: "Trat. de Fratura da Coluna c/ Lesão Medular", cids: "S12/S22.0/S32 + S14/S24/S34", obs: "" },
  { code: "0403010306", name: "Trat. Cx de Hematoma Subdural Agudo", cids: "I62.0 / S06.5", obs: "Grupo 04 — HRO hab. 1601", highlight: true },
  { code: "0403010276", name: "Trat. Cx de Hematoma Extradural", cids: "I62.1 / S06.4", obs: "Grupo 04 — HRO hab. 1601", highlight: true },
  { code: "0403010284", name: "Trat. Cx de Hematoma Intracerebral", cids: "I61.2 / I61.6 / I61.8", obs: "Grupo 04 — HRO hab. 1601", highlight: true },

  { cat: "POLITRAUMA & TÓRAX" },
  { code: "0308010043", name: "Trat. de Traumatismos Múltiplas Regiões", cids: "T07 (Traumatismos múltiplos NE)", obs: "Código coringa para politrauma" },
  { code: "0308010035", name: "Trat. de Traumatismos c/ Lesão Órgão Intratorácico/Intra-abdominal", cids: "S27 (Tórax) / S36 (Abdome)", obs: "" },
  { code: "0308010019", name: "Trat. Clínico/Conservador de Traumatismos", cids: "T14.1 (Ferimento NE) / T13.1 (MI)", obs: "Genérico — preferir específicos" },
  { code: "0412050170", name: "Toracocentese / Drenagem de Pleura", cids: "S27.0 (Pneumotórax) / S27.1 (Hemotórax) / J93.1", obs: "Grupo 04 — verificar FPO", highlight: true },

  { cat: "ORTOPEDIA & FRATURAS" },
  { code: "0303090200", name: "Trat. Conservador de Fratura MMII c/ Imob.", cids: "S72.3 (Fêmur) / S82.2 (Tíbia)", obs: "" },
  { code: "0303090227", name: "Trat. Conservador de Fratura MMSS c/ Imob.", cids: "S42/S52/S62", obs: "" },
  { code: "0303090120", name: "Trat. Conservador de Fratura Cintura Escapular", cids: "S42.0 (Clavícula) / S42.1 (Escápula)", obs: "" },
  { code: "0303090146", name: "Trat. Conservador de Fratura de Costelas", cids: "S22.3 / S22.4 (Múltiplas)", obs: "" },
  { code: "0303090189", name: "Trat. Conservador de Fratura do Esterno", cids: "S22.2 (Esterno)", obs: "" },
  { code: "0303090197", name: "Trat. Conservador de Fratura Anéis Pélvicos", cids: "S32.8 (Pelve)", obs: "" },
  { code: "0303090138", name: "Trat. Conservador Fratura/Lesão Ligamentar Pelve", cids: "S33 (Luxação/entorse pelve)", obs: "" },
  { code: "0303090170", name: "Trat. Conservador de Fratura Ossos da Face", cids: "S02.2-S02.9", obs: "" },

  { cat: "GASTROENTEROLOGIA" },
  { code: "0303070110", name: "Trat. de Outras Doenças do Intestino", cids: "K55.0 (Isquemia) / K56.6 (Obstrução) / K57.9", obs: "" },
  { code: "0303070064", name: "Trat. de Doenças do Esôfago/Estômago/Duodeno", cids: "K92.2 (HDA NE) / K25.0 (Úlcera c/ hemorragia)", obs: "HDA" },
  { code: "0303070072", name: "Tratamento de Doenças do Fígado", cids: "K77.8 (Hepatopatia) / R18 (Ascite)", obs: "" },
  { code: "0303070129", name: "Trat. de Transtornos Pâncreas/Vias Biliares", cids: "K85.9 (Pancreatite) / K81.0 (Colecistite)", obs: "" },
  { code: "0303070080", name: "Trat. de Doenças do Peritônio", cids: "K65.0 (Peritonite aguda) / K65.9 (NE)", obs: "" },
  { code: "0303070099", name: "Trat. de Enterites e Colites não Infecciosas", cids: "K50.9 (Crohn) / K51.9 (RCU) / K55.0 (Isquêmica)", obs: "" },
  { code: "0303100036", name: "Trat. de Complicações de Proc. Cx/Clínicos", cids: "T81.4 (Infecção) / T81.3 (Deiscência) / T81.8", obs: "" },

  { cat: "QUEIMADURAS" },
  { code: "0308030036", name: "Trat. de Queimaduras, Corrosões e Geladuras", cids: "T20-T25 (por região) / T30 (NE) / T31.x", obs: "PREFERIR ESTE — Grupo 03, sem habilitação" },
  { code: "0413010090", name: "Tratamento de Pequeno Queimado", cids: "T30", obs: "Grupo 04 — preferir 0308030036", highlight: true },
  { code: "0413010082", name: "Tratamento de Médio Queimado", cids: "T31.1 / T31.2", obs: "Grupo 04 — preferir 0308030036", highlight: true },
  { code: "0413010066", name: "Tratamento de Grande Queimado", cids: "T31.3+ (>30% SC)", obs: "Grupo 04 — preferir 0308030036", highlight: true },
  { code: "0413010074", name: "Trat. de Intercorrência em Queimado", cids: "Complicações associadas", obs: "Grupo 04 — preferir 0308030036", highlight: true },

  { cat: "INFECTOLOGIA & SEPSE" },
  { code: "0303010070", name: "Trat. de Doenças Infecciosas e Parasitárias", cids: "A41.9 (Sepse NE) / A49.9 (Inf. bacteriana NE)", obs: "Código amplo para sepse" },
  { code: "0303010010", name: "Tratamento de Dengue Clássica", cids: "A90 (Dengue clássica)", obs: "" },
  { code: "0303010029", name: "Tratamento de Dengue Hemorrágica", cids: "A91 (Dengue hemorrágica)", obs: "" },
  { code: "0303010061", name: "Trat. de Doenças Infecciosas Intestinais", cids: "A09 (GEA NE) / A08.4 (Rotavírus)", obs: "" },
  { code: "0303010118", name: "Tratamento de Hepatites Virais", cids: "B15.9 (Hep A) / B16.9 (Hep B) / B17.1 (Hep C)", obs: "" },
  { code: "0303010215", name: "Tratamento de Tuberculose", cids: "A15-A19 (TB)", obs: "" },
  { code: "0303020024", name: "Trat. de Doenças pelo HIV", cids: "B20-B24 (HIV)", obs: "HRO hab. 1101" },

  { cat: "SAÚDE MENTAL & INTOXICAÇÕES" },
  { code: "0303170131", name: "Trat. em Saúde Mental — Risco Elevado de Suicídio", cids: "R45.8 (Ideação) / F32.2 / F60.3", obs: "" },
  { code: "0308020030", name: "Trat. de Intoxicação/Envenenamento", cids: "T40-T50 (Intox. drogas/medicamentos)", obs: "" },

  { cat: "ENDOCRINOLOGIA" },
  { code: "0303030038", name: "Tratamento de Diabetes Mellitus", cids: "E10.1 (CAD DM1) / E11.0 (Coma DM2) / E14.1", obs: "CAD, EHH" },
  { code: "0303030054", name: "Trat. de Transtornos da Tireoide", cids: "E05.5 (Crise tireotóxica) / E06.0", obs: "" },
  { code: "0303030020", name: "Tratamento de Desnutrição", cids: "E43 (Grave NE) / E44.0 (Moderada)", obs: "" },

  { cat: "NEFROLOGIA & UROLOGIA" },
  { code: "0305020048", name: "Tratamento de Insuficiência Renal Aguda", cids: "N17.0-N17.9 (IRA) / N10 (Pielonefrite c/ IRA)", obs: "CORRIGIDO v2.1" },
  { code: "0305020013", name: "Tratamento da Pielonefrite", cids: "N10 (Pielonefrite) / N11.x / N39.0 (ITU NE)", obs: "CORRIGIDO v2.1" },

  { cat: "HEMATOLOGIA" },
  { code: "0303020067", name: "Trat. de Defeitos da Coagulação/Púrpura", cids: "D65 (CIVD) / D69.6 (Plaquetopenia) / D68.9", obs: "" },
  { code: "0303020040", name: "Tratamento de Anemia Hemolítica", cids: "D59.9 (NE) / D62 (Aguda pós-hemorrágica)", obs: "" },

  { cat: "OBSTETRÍCIA — EMERGÊNCIAS" },
  { code: "0303100028", name: "Tratamento de Eclâmpsia", cids: "O15.0 (Eclâmpsia na gravidez)", obs: "" },
  { code: "0303100044", name: "Trat. de Intercorrências Clínicas na Gravidez", cids: "O99.x (conforme complicação)", obs: "" },
  { code: "0303100010", name: "Trat. de Complicações do Puerpério", cids: "O85 (Sepse puerperal) / O72.1 (HPP)", obs: "" },

  { cat: "PELE & PARTES MOLES" },
  { code: "0303080094", name: "Trat. de Outras Afecções da Pele/Tec. Subcutâneo", cids: "L02.x (Abscesso) / L03.1 (Celulite) / M72.6 (Fasciite)", obs: "Alternativa ao 0401010104" },
  { code: "0303080060", name: "Tratamento de Estafilococcias", cids: "L02.x / L03.x (Celulite estafilocócica)", obs: "" },
  { code: "0303080078", name: "Tratamento de Estreptococcias", cids: "A46 (Erisipela) / L03.x", obs: "" },
  { code: "0303080086", name: "Tratamento de Farmacodermias", cids: "L51.1 (Stevens-Johnson) / L51.2 (NET) / L27.0", obs: "" },
  { code: "0308040015", name: "Trat. de Complicações de Proc. Cx ou Clínicos", cids: "T81.4 (Infecção pós-proc) / T81.3 (Deiscência)", obs: "FO infectada" },

  { cat: "MAMA" },
  { code: "0410010014", name: "Drenagem de Abscesso de Mama", cids: "N61 (Inflamação mama) / O91.0 (Abscesso puerperal) / O91.1 (Abscesso mama puerperal)", obs: "⚠ Grupo 04 — preferir 0303080094 + N61", highlight: true },
]

// ── Dados Parte 2 ─────────────────────────────────────────────────────────────
const alternatives = [
  { cat: "PELE, PARTES MOLES & INFECÇÕES" },
  { sit: "Abscesso cutâneo (sem necessidade cx formal)", bad: "0401010104 (Incisão e drenagem de abscesso)", good: "0303080094 (Afecções pele/subcutâneo)", cids: "L02.2/L02.4/L02.9" },
  { sit: "Celulite / erisipela", bad: "0401010031 (Drenagem de abscesso)", good: "0303080060 (Estafilococcias) ou 0303080078 (Estreptococcias)", cids: "L03.1 / A46" },
  { sit: "Infecção de ferida operatória", bad: "Códigos 0401", good: "0308040015 (Complicações de proc. cx/clínicos)", cids: "T81.4 / T81.3" },
  { sit: "Fasciite necrotizante", bad: "Códigos 0401", good: "0303080094 (Afecções pele/subcutâneo)", cids: "M72.6" },
  { sit: "Abscesso de mama (trat. clínico/conservador)", bad: "0410010014 (Drenagem de abscesso de mama)", good: "0303080094 (Afecções pele/subcutâneo)", cids: "N61 / O91.0 / O91.1" },

  { cat: "ABDOME & GASTRO" },
  { sit: "Paracentese de alívio / ascite", bad: "0407040196 (Paracentese abdominal)", good: "0303070072 (Doenças do fígado) ou 0303070080 (Doenças do peritônio)", cids: "R18 / K77.8 / K65.0" },
  { sit: "HDA / HDB", bad: "Códigos cirúrgicos 04", good: "0303070064 (Doenças esôfago/estômago/duodeno)", cids: "K92.2 / K92.1 / K25.0" },
  { sit: "Abdome agudo obstrutivo", bad: "Códigos cirúrgicos 04", good: "0303070110 (Outras doenças do intestino)", cids: "K56.6 / K56.5" },
  { sit: "Pancreatite aguda", bad: "Códigos cirúrgicos 04", good: "0303070129 (Transtornos pâncreas/vias biliares)", cids: "K85.9 / K85.0 / K85.1" },
  { sit: "Colecistite aguda (trat. conservador)", bad: "Códigos cirúrgicos 04", good: "0303070129 (Transtornos pâncreas/vias biliares)", cids: "K81.0 / K80.0" },

  { cat: "QUEIMADURAS" },
  { sit: "Qualquer queimadura (peq/médio/grande)", bad: "0413010090/82/66/74 (Grupo 04 queimados)", good: "0308030036 (Queimaduras, corrosões e geladuras)", cids: "T20-T25 / T30 / T31.x" },

  { cat: "NEUROLOGIA / NEUROTRAUMA" },
  { sit: "Hemorragia cerebral SEM indicação cx", bad: "0403010284 (Trat. cx hematoma intracerebral)", good: "0303040076 (Trat. conservador hemorragia cerebral)", cids: "I61.9" },
  { sit: "Derrame pleural SEM indicação de drenagem", bad: "0412050170 (Toracocentese/drenagem)", good: "0303140119 (Outras doenças da pleura)", cids: "J90 / J91" },
  { sit: "TCE Grave / TRM (se FPO não liberar 0303040106/114)", bad: "0303040106 / 0303040114 (exigem hab. 1602+2502)", good: "0308010043 (Traumatismos múltiplas regiões)", cids: "T07 / S06.9 / S14.1" },
]

// ── Build tabelas ─────────────────────────────────────────────────────────────

const rows1 = []
rows1.push(new TableRow({ tableHeader: true, children: [
  hdrCell("CÓDIGO", COL1[0]), hdrCell("PROCEDIMENTO", COL1[1]),
  hdrCell("CIDs RECOMENDADOS", COL1[2]), hdrCell("OBSERVAÇÕES", COL1[3]),
]}))
for (const item of procedures) {
  if (item.cat) rows1.push(catRow(item.cat, 4))
  else rows1.push(dataRow(item.code, item.name, item.cids, item.obs, item.highlight))
}

const rows2 = []
rows2.push(new TableRow({ tableHeader: true, children: [
  hdrCell("SITUAÇÃO CLÍNICA", COL2[0]), hdrCell("NÃO USAR", COL2[1]),
  hdrCell("USAR NO LUGAR", COL2[2]), hdrCell("CIDs", COL2[3]),
]}))
let idx = 0
for (const item of alternatives) {
  if (item.cat) { rows2.push(catRow(item.cat, 4)); idx = 0 }
  else { rows2.push(altRow(item.sit, item.bad, item.good, item.cids, idx)); idx++ }
}

// ── Documento ─────────────────────────────────────────────────────────────────

const doc = new Document({
  styles: {
    default: { document: { run: { font: "Arial", size: 22 } } },
    paragraphStyles: [{
      id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
      run: { size: 36, bold: true, font: "Arial", color: BLUE_DARK },
      paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 0 },
    }],
  },
  numbering: { config: [{ reference: "bullets", levels: [{ level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] }] },
  sections: [{
    properties: {
      page: {
        size: { width: PAGE_W, height: PAGE_H, orientation: "landscape" },
        margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN },
      },
    },
    headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT,
      children: [new TextRun({ text: "Hospital Regional do Oeste — CNES 2537788", font: "Arial", size: 15, color: "999999" })] })] }) },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [
      new TextRun({ text: "Guia de Procedimentos e CIDs — PS HRO | Abril 2026 | Pág. ", font: "Arial", size: 15, color: "999999" }),
      new TextRun({ children: [PageNumber.CURRENT], font: "Arial", size: 15, color: "999999" }),
    ]})] }) },
    children: [
      // Título
      new Paragraph({ spacing: { before: 400, after: 150 }, alignment: AlignmentType.CENTER, children: [
        new TextRun({ text: "GUIA DE CÓDIGOS DE PROCEDIMENTOS E CIDs", font: "Arial", size: 40, bold: true, color: BLUE_DARK }),
      ]}),
      new Paragraph({ spacing: { after: 80 }, alignment: AlignmentType.CENTER, children: [
        new TextRun({ text: "PRONTO-SOCORRO — HOSPITAL REGIONAL DO OESTE", font: "Arial", size: 28, bold: true, color: BLUE_MED }),
      ]}),
      new Paragraph({ spacing: { after: 300 }, alignment: AlignmentType.CENTER, children: [
        new TextRun({ text: "Versão 2.1 — Abril 2026", font: "Arial", size: 20, color: "666666" }),
      ]}),

      // Orientações
      new Paragraph({ spacing: { before: 100, after: 50 }, children: [
        new TextRun({ text: "Orientações gerais:", font: "Arial", size: 19, bold: true }),
      ]}),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [
        new TextRun({ text: "Preferir códigos do grupo 03 (clínicos) — passam sem restrição no HRO.", font: "Arial", size: 18 }),
      ]}),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [
        new TextRun({ text: "Códigos do grupo 04 (cirúrgicos) em amarelo: verificar com faturamento. Subgrupo 0401 NÃO usar em AIH do PS.", font: "Arial", size: 18 }),
      ]}),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [
        new TextRun({ text: "Para queimaduras, preferir 0308030036 (grupo 03). Para abscesso/partes moles, usar 0303080094.", font: "Arial", size: 18 }),
      ]}),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [
        new TextRun({ text: "TCE Grave (0303040106) e TRM (0303040114): exigem hab. 1602+2502 (Centro de Referência). HRO tem apenas 1601+2501 — verificar FPO antes de usar.", font: "Arial", size: 18, color: RED_ALERT, bold: true }),
      ]}),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 80 }, children: [
        new TextRun({ text: "Abscesso de mama: preferir 0303080094 (grupo 03) com CID N61; código 0410010014 é grupo 04.", font: "Arial", size: 18 }),
      ]}),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 200 }, children: [
        new TextRun({ text: "Habilitações HRO: Neurocirurgia (1601), AVC III (1617), Traumato-Ortopedia (2501), Urgência II (2702), UTIs, PMAE Cx (2902), HIV (1101).", font: "Arial", size: 18 }),
      ]}),

      // Parte 1
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [
        new TextRun({ text: "PARTE 1 — GUIA PRINCIPAL DE CÓDIGOS", font: "Arial" }),
      ]}),
      new Table({ width: { size: TBL_W, type: WidthType.DXA }, columnWidths: COL1, rows: rows1 }),

      new Paragraph({ spacing: { before: 200, after: 60 }, children: [
        new TextRun({ text: "Amarelo", font: "Arial", size: 16, bold: true }),
        new TextRun({ text: " = grupo 04 ou exige habilitação extra — confirmar com faturamento | ", font: "Arial", size: 16 }),
        new TextRun({ text: "⚠", font: "Arial", size: 16, color: RED_ALERT, bold: true }),
        new TextRun({ text: " = alerta crítico de habilitação | ", font: "Arial", size: 16 }),
        new TextRun({ text: "CORRIGIDO v2.1", font: "Arial", size: 16, bold: true }),
        new TextRun({ text: " = código atualizado nesta versão", font: "Arial", size: 16 }),
      ]}),

      new Paragraph({ children: [new PageBreak()] }),

      // Parte 2
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [
        new TextRun({ text: "PARTE 2 — CÓDIGOS ALTERNATIVOS (QUANDO O ORIGINAL NÃO PASSA)", font: "Arial" }),
      ]}),
      new Paragraph({ spacing: { after: 150 }, children: [
        new TextRun({ text: "Consulte esta tabela quando um código for rejeitado na AIH.", font: "Arial", size: 19 }),
      ]}),
      new Table({ width: { size: TBL_W, type: WidthType.DXA }, columnWidths: COL2, rows: rows2 }),

      // Rodapé final
      new Paragraph({ spacing: { before: 300 }, children: [
        new TextRun({ text: "Elaboração: Núcleo Interno de Regulação / PS — HRO", font: "Arial", size: 17, color: "666666" }),
      ]}),
      new Paragraph({ children: [
        new TextRun({ text: "Base: SIGTAP/DataSUS competência 202602 | CNES consultado em 06/04/2026 | Versão 2.1 — correções nefrologia, alertas hab. TCE/TRM, mama", font: "Arial", size: 15, color: "999999" }),
      ]}),
    ],
  }],
})

const out = "/tmp/guia_ps_hro_v2.1.docx"
Packer.toBuffer(doc).then(buf => {
  writeFileSync(out, buf)
  console.log(`✅ Documento gerado: ${out}`)
})
