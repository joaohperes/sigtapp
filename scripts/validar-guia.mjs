/**
 * Validação dos códigos do Guia PS-HRO contra os arquivos SIGTAP locais.
 *
 * Uso:
 *   node scripts/validar-guia.mjs ./dados
 *
 * Saída: relatório no console + JSON em scripts/guia_validado.json
 */

import { readFileSync, writeFileSync } from 'fs'
import path from 'path'

const dadosDir = process.argv[2] || './dados'

// ── Parsers ──────────────────────────────────────────────────────────────────

function readFixed(filePath) {
  return readFileSync(path.resolve(filePath), 'latin1').split('\n').filter(Boolean)
}

function parseProcedimentos(lines, filter) {
  const map = {}
  for (const line of lines) {
    const code = line.substring(0, 10).trim()
    if (!filter.has(code)) continue
    map[code] = line.substring(10, 260).trim()
  }
  return map
}

function parseCids(lines, filter) {
  // CO_PROCEDIMENTO [0..9], CO_CID [10..13], ST_PRINCIPAL [14]
  const map = {}
  for (const line of lines) {
    const code = line.substring(0, 10).trim()
    if (!filter.has(code)) continue
    const cid = line.substring(10, 14).trim()
    const principal = line.substring(14, 15).trim()
    if (!map[code]) map[code] = { principal: [], secundario: [] }
    if (principal === 'S') map[code].principal.push(cid)
    else map[code].secundario.push(cid)
  }
  return map
}

function parseHabilitacoes(lines, filter) {
  // CO_PROCEDIMENTO [0..9], CO_HABILITACAO [10..13]
  const map = {}
  for (const line of lines) {
    const code = line.substring(0, 10).trim()
    if (!filter.has(code)) continue
    const hab = line.substring(10, 14).trim()
    if (!map[code]) map[code] = []
    if (hab) map[code].push(hab)
  }
  return map
}

// ── Dados do Guia v2.0 ───────────────────────────────────────────────────────

const CODIGOS_GUIA = [
  // CHOQUE
  "0303060050","0303060077","0303060069","0303030046",
  // CARDIOLOGIA
  "0303060190","0303060280","0303060026","0303060212","0303060140",
  "0303060131","0303060107","0303060255","0303060298","0303060204",
  "0303060239","0303060166","0303060271","0303140062","0303060263",
  // PNEUMOLOGIA
  "0303140151","0303140135","0303140143","0303140046","0303140127",
  "0303140097","0303140119","0303140038",
  // NEUROLOGIA CLINICA
  "0303040149","0303040076","0303040165","0303040211","0303040262",
  "0303040254","0303010142","0303040297","0303040041",
  // NEUROTRAUMA
  "0303040084","0303040092","0303040106","0303040114","0303040238",
  "0403010306","0403010276","0403010284",
  // POLITRAUMA
  "0308010043","0308010035","0308010019","0412050170",
  // ORTOPEDIA
  "0303090200","0303090227","0303090120","0303090146","0303090189",
  "0303090197","0303090138","0303090170",
  // GASTRO
  "0303070110","0303070064","0303070072","0303070129","0303070080",
  "0303070099","0303100036",
  // QUEIMADURAS
  "0308030036","0413010090","0413010082","0413010066","0413010074",
  // INFECTOLOGIA
  "0303010070","0303010010","0303010029","0303010061","0303010118",
  "0303010215","0303020024",
  // SAUDE MENTAL
  "0303170131","0308020030",
  // ENDOCRINOLOGIA
  "0303030038","0303030054","0303030020",
  // NEFROLOGIA
  "0305020048","0305020013",
  // HEMATOLOGIA
  "0303020067","0303020040",
  // OBSTETRICIA
  "0303100028","0303100044","0303100010",
  // PELE
  "0303080094","0303080060","0303080078","0303080086","0308040015",
  // NOVO v2.1: abscesso de mama
  "0410010014",
]

// Habilitações ativas no HRO (para cruzamento)
const HAB_HRO = new Set(["1601","1617","2501","2601","2603","2610","2702","2902","1101","1707","1708"])

// ── Main ─────────────────────────────────────────────────────────────────────

const codigosSet = new Set(CODIGOS_GUIA)
const procs = parseProcedimentos(readFixed(path.join(dadosDir, 'tb_procedimento.txt')), codigosSet)
const cids  = parseCids(readFixed(path.join(dadosDir, 'rl_procedimento_cid.txt')), codigosSet)
const habs  = parseHabilitacoes(readFixed(path.join(dadosDir, 'rl_procedimento_habilitacao.txt')), codigosSet)

const results = []
const missing = []
const habRequired = []

for (const code of CODIGOS_GUIA) {
  const name = procs[code]
  if (!name) {
    missing.push(code)
    console.log(`❌ NÃO ENCONTRADO: ${code}`)
    continue
  }

  const cidData = cids[code] || { principal: [], secundario: [] }
  const habData = habs[code] || []
  const habFaltando = habData.filter(h => !HAB_HRO.has(h))

  const entry = {
    code,
    name,
    cids_principal: cidData.principal,
    cids_secundario: cidData.secundario,
    habilitacoes_exigidas: habData,
    hab_hro_cobre: habData.every(h => HAB_HRO.has(h)),
    hab_faltando: habFaltando,
    grupo: code.substring(0, 2),
    subgrupo: code.substring(0, 4),
  }
  results.push(entry)

  if (habFaltando.length > 0) {
    habRequired.push({ code, name, hab_faltando: habFaltando })
  }
}

// ── Relatório ────────────────────────────────────────────────────────────────

console.log('\n' + '='.repeat(70))
console.log(`VALIDAÇÃO GUIA PS-HRO — SIGTAP ${path.basename(dadosDir)}`)
console.log('='.repeat(70))
console.log(`Total verificado: ${CODIGOS_GUIA.length}`)
console.log(`✅ Encontrados:   ${results.length}`)
console.log(`❌ Não encontrados: ${missing.length} → ${missing.join(', ') || 'nenhum'}`)
console.log()

if (habRequired.length > 0) {
  console.log('⚠️  PROCEDIMENTOS COM HABILITAÇÃO EXIGIDA QUE HRO NÃO TEM:')
  for (const h of habRequired) {
    console.log(`   ${h.code} ${h.name}`)
    console.log(`   → Hab. faltando: ${h.hab_faltando.join(', ')}`)
  }
  console.log()
}

// Mostrar CIDs principais do abscesso de mama se presente
const mama = results.find(r => r.code === '0410010014')
if (mama) {
  console.log(`📋 Abscesso de mama (${mama.code}):`)
  console.log(`   Nome: ${mama.name}`)
  console.log(`   CIDs principais (${mama.cids_principal.length}): ${mama.cids_principal.slice(0,20).join(' ')}`)
  console.log(`   Hab. exigidas: ${mama.habilitacoes_exigidas.join(', ') || 'nenhuma'}`)
  console.log()
}

// Salvar JSON para uso no gerador do docx
const out = path.resolve('./scripts/guia_validado.json')
writeFileSync(out, JSON.stringify({ results, missing, hab_faltando: habRequired }, null, 2))
console.log(`JSON salvo em: ${out}`)
