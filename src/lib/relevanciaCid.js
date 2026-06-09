/**
 * Classificação de relevância clínica de CIDs para a busca de diagnóstico.
 *
 * Objetivo: numa busca ampla ("pneumonia" = 55, "hemorragia" = 153), separar os
 * diagnósticos que o plantonista realmente codifica no PS do RUÍDO — variantes por
 * agente etiológico ("pneumonia devida a clamídias"), causas externas, perinatal,
 * "em doenças classificadas em outra parte". O ruído é recolhido; o resto fica visível.
 *
 * Filosofia (decidida com dados reais): "recolher só o lixo". O score afunda bem o
 * ruído óbvio, mas é fraco pra promover diagnósticos de nome burocrático e longo
 * (ex: "Úlcera gástrica - crônica ou não especificada com hemorragia" = HDA, pão de
 * plantão). Esconder isso seria erro clínico. Então o corte é BAIXO: só vira "variante"
 * o que é claramente irrelevante. Na dúvida, mostra.
 *
 * Roda no front sobre os resultados que a busca já retorna (<200 itens) — sem migration,
 * sem tocar na RPC, ajustável a cada deploy. Lê só co_cid + no_cid.
 */

// Normaliza para casar com acentos/caixa (mesma ideia do unaccent no banco).
// ̀-ͯ = faixa de diacríticos combinantes (NFD separa a letra do acento).
function norm(s) {
  return (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
}

// ── Filosofia: "comum = só o essencial" ──────────────────────────────────────
// A vista inicial mostra só (1) coringas curados e (2) formas GENÉRICAS do
// diagnóstico ("não especificada", "SOE"). Toda especificidade — por agente,
// topografia anatômica, seqüela, perinatal, causa externa, cascata de úlcera —
// vai pras "variantes", que NUNCA somem: ficam a um clique. Quem digita uma
// busca-guarda-chuva ("hemorragia", "infecção") vê primeiro o que codifica.

// RUÍDO ESTRUTURAL — avaliado ANTES de "é genérico?", porque o CID-10 enfia
// "não especificada" em nomes que não têm nada de genérico (ex: "Úlcera gástrica
// não especificada como aguda ou crônica, sem hemorragia"). A precedência importa.
const RE_ETIOLOGICO  = /\bdevid[ao]s?\s+[aà]\b|\bpor\s+[a-z]{4}/        // "devida a clamídias", "por adenovírus"
const RE_OUTRA_PARTE = /classificad[ao]s?\s+em\s+outr[ao]/             // "em outra parte", "em outros capítulos"
const RE_PERINATAL   = /congenit|neonatal|recem-nascido|feto|perinatal|traumatismo de parto/
const RE_SEQUELA     = /\bsequela/                                     // "seqüelas de hemorragia..."
// Granularidade anatômica/topográfica e cascatas — sem marcador sintático único,
// então listamos os padrões que enchem listas mas não são codificação de PS.
const RE_GRANULAR = new RegExp([
  'ulcera (gastrica|duodenal|peptica|gastrojejunal)',           // toda a cascata de úlcera (fica K922 HDA)
  'proveniente d[aeo]',                                          // HSA "proveniente da artéria X"
  'deficiencia de coagulacao',                                  // obstétrico detalhado
  'tardias? e secundarias?|tardia ou excessiva',                // hemorragia pós-parto tardia
  'hemisferica (cortical|subcortical)|tronco cerebral|intraventricular|cerebelar|multiplas localizacoes', // HIC por topografia (fica I619)
  '\\bgonococica d[oae]\\b',                                     // gonocócica do olho/ânus/reto...
  'complicad[ao]',                                               // "...complicado por hemorragia"
].join('|'))

// Capítulos que nunca são diagnóstico principal de plantão clínico/cirúrgico.
function ehCapituloRuido(co) {
  const c = (co || '').trim().toUpperCase()
  if (/^[PVWXYZ]/.test(c)) return true   // perinatal, causas externas, fatores de contato
  if (/^B9[567]/.test(c)) return true    // "bactéria/vírus como causa de doenças em outra parte"
  return false
}

// É genérico o bastante pra ser a forma que o plantonista codifica?
// (só consultado DEPOIS de descartar o ruído estrutural acima)
const RE_GENERICO = /nao especificad|sem outra especificacao|\bsoe\b|nao classificad/

/**
 * É variante? (vai pro grupo recolhido — NUNCA some, só sai da vista inicial)
 * Ordem das regras é deliberada: coringa vence tudo; depois ruído estrutural;
 * só então "genérico fica, específico vira variante".
 */
export function ehVariante(cid, coringasSet) {
  const co = (cid.co_cid || '').trim()
  if (coringasSet?.has(co)) return false        // 1. coringa = sempre comum

  if (ehCapituloRuido(co)) return true          // 2. ruído estrutural
  const nome = norm(cid.no_cid)
  if (RE_ETIOLOGICO.test(nome)) return true
  if (RE_OUTRA_PARTE.test(nome)) return true
  if (RE_PERINATAL.test(nome)) return true
  if (RE_SEQUELA.test(nome)) return true
  if (RE_GRANULAR.test(nome)) return true

  return !RE_GENERICO.test(nome)                // 3. genérico fica; específico → variante
}

// Ordenação dos comuns: coringas primeiro, depois genéricos. Sort estável (V8)
// preserva a ordem da RPC nos empates.
function pesoComum(cid, coringasSet) {
  return coringasSet?.has((cid.co_cid || '').trim()) ? 0 : 1
}

/**
 * Divide os resultados em { comuns, variantes }. Coringas sobem ao topo dos comuns;
 * o resto mantém a ordem de relevância da RPC.
 */
export function agruparPorRelevancia(results, coringasSet) {
  const comuns = []
  const variantes = []
  for (const cid of results) {
    if (ehVariante(cid, coringasSet)) variantes.push(cid)
    else comuns.push(cid)
  }
  comuns.sort((a, b) => pesoComum(a, coringasSet) - pesoComum(b, coringasSet))
  return { comuns, variantes }
}

// ── Pills de filtro por sistema (capítulo CID-10) ────────────────────────────
// Mapeia a letra/categoria do código ao sistema clínico. Permite ao usuário
// filtrar uma busca ampla ("hemorragia") por órgão sem que nada seja escondido.
// Agnóstico de curadoria: deriva da estrutura do CID-10.
const SISTEMAS = [
  // neuro ANTES de cardio: I60–I69 (AVC/hemorragia cerebral) são neurológicos, não cardíacos.
  { id: 'neuro',     label: 'Neurológico',    test: c => /^(G|I6)/.test(c) },
  { id: 'cardio',    label: 'Cardiovascular', test: c => /^I/.test(c) },
  { id: 'resp',      label: 'Respiratório',   test: c => /^(J|R04|R05|R06|R09)/.test(c) },
  { id: 'digest',    label: 'Digestivo',      test: c => /^K/.test(c) },
  { id: 'geniturin', label: 'Geniturinário',  test: c => /^N/.test(c) },
  { id: 'obstetr',   label: 'Obstétrico',     test: c => /^O/.test(c) },
  { id: 'infecto',   label: 'Infeccioso',     test: c => /^(A|B)/.test(c) },
  { id: 'trauma',    label: 'Trauma',         test: c => /^(S|T0|T1)/.test(c) },
  { id: 'osteomusc', label: 'Osteomuscular',  test: c => /^M/.test(c) },
  { id: 'metabol',   label: 'Endócrino/Metab.', test: c => /^E/.test(c) },
  { id: 'pele',      label: 'Pele',           test: c => /^L/.test(c) },
  { id: 'hemato',    label: 'Hematológico',   test: c => /^D[5-7]/.test(c) },
  { id: 'neoplasia', label: 'Neoplasias',     test: c => /^(C|D[0-4])/.test(c) },
  { id: 'olho',      label: 'Oftalmo',        test: c => /^H[0-5]/.test(c) },
  { id: 'ouvido',    label: 'Otorrino',       test: c => /^H[6-9]/.test(c) },
  { id: 'psiq',      label: 'Psiquiátrico',   test: c => /^F/.test(c) },
  { id: 'perinatal', label: 'Perinatal',      test: c => /^P/.test(c) },
  { id: 'externa',   label: 'Causa externa',  test: c => /^[VWXY]/.test(c) },
  { id: 'outros',    label: 'Outros',         test: () => true }, // fallback — sempre por último
]

// Retorna o sistema de um CID (primeiro que casar; 'outros' é o catch-all final).
export function sistemaDoCid(cid) {
  const c = (cid.co_cid || '').trim().toUpperCase()
  return SISTEMAS.find(s => s.test(c)) || SISTEMAS[SISTEMAS.length - 1]
}

/**
 * Conta resultados por sistema e devolve as pills ordenadas por contagem (desc).
 * Só inclui sistemas com ≥1 resultado. Usado pra renderizar os filtros.
 */
export function pillsDeSistema(results) {
  const cont = new Map()
  for (const cid of results) {
    const s = sistemaDoCid(cid)
    cont.set(s.id, (cont.get(s.id) || 0) + 1)
  }
  return SISTEMAS
    .filter(s => cont.has(s.id))
    .map(s => ({ id: s.id, label: s.label, count: cont.get(s.id) }))
    .sort((a, b) => b.count - a.count)
}
