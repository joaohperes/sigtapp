/**
 * Script de importação do SIGTAP para o Supabase
 *
 * Uso:
 *   SUPABASE_URL=https://xxx.supabase.co \
 *   SUPABASE_SERVICE_KEY=eyJ... \
 *   node scripts/import-sigtap.mjs ./dados 202602
 *
 * O diretório deve conter os arquivos do SIGTAP descompactados.
 * Baixe em: http://sigtap.datasus.gov.br/tabela-unificada/app/sec/inicio.jsp
 *
 * ATENÇÃO: use a service_role key, nunca a anon key.
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import path from 'path'

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌  Defina SUPABASE_URL e SUPABASE_SERVICE_KEY como variáveis de ambiente.')
  process.exit(1)
}

const dadosDir = process.argv[2]
const competencia = process.argv[3]

if (!dadosDir || !competencia) {
  console.error('❌  Uso: node scripts/import-sigtap.mjs <diretório-dados> <competencia>')
  console.error('    Ex:  node scripts/import-sigtap.mjs ./dados 202602')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

function readFixed(filePath) {
  return readFileSync(path.resolve(filePath), 'latin1').split('\n').filter(Boolean)
}

// --- Tabelas de lookup ---

function loadGrupos(dir) {
  // CO_GRUPO[0:2] | NO_GRUPO[2:102] | DT[102:108]
  const map = {}
  for (const line of readFixed(path.join(dir, 'tb_grupo.txt'))) {
    map[line.slice(0, 2)] = line.slice(2, 102).trim()
  }
  return map
}

function loadSubGrupos(dir) {
  // CO_GRUPO[0:2] | CO_SUB_GRUPO[2:4] | NO_SUB_GRUPO[4:104] | DT[104:110]
  const map = {}
  for (const line of readFixed(path.join(dir, 'tb_sub_grupo.txt'))) {
    const key = line.slice(0, 4) // chave composta: grupo + subgrupo
    map[key] = line.slice(4, 104).trim()
  }
  return map
}

function loadFormasOrg(dir) {
  // CO_GRUPO[0:2] | CO_SUB_GRUPO[2:4] | CO_FORMA[4:6] | NO_FORMA[6:106] | DT[106:112]
  const map = {}
  for (const line of readFixed(path.join(dir, 'tb_forma_organizacao.txt'))) {
    const key = line.slice(0, 6) // chave composta: grupo + subgrupo + forma
    map[key] = line.slice(6, 106).trim()
  }
  return map
}

function loadFinanciamentos(dir) {
  // CO_FINANCIAMENTO[0:2] | NO_FINANCIAMENTO[2:102] | DT[102:108]
  const map = {}
  for (const line of readFixed(path.join(dir, 'tb_financiamento.txt'))) {
    map[line.slice(0, 2)] = line.slice(2, 102).trim()
  }
  return map
}

function loadDescricoes(dir) {
  // CO_PROCEDIMENTO[0:10] | DS_PROCEDIMENTO[10:4010] | DT[4010:4016]
  const map = {}
  for (const line of readFixed(path.join(dir, 'tb_descricao.txt'))) {
    map[line.slice(0, 10)] = line.slice(10, 4010).trim()
  }
  return map
}

// --- Main ---

console.log('📂  Carregando tabelas de lookup...')
const grupos         = loadGrupos(dadosDir)
const subGrupos      = loadSubGrupos(dadosDir)
const formasOrg      = loadFormasOrg(dadosDir)
const financiamentos = loadFinanciamentos(dadosDir)
const descricoes     = loadDescricoes(dadosDir)

console.log(`   ${Object.keys(grupos).length} grupos`)
console.log(`   ${Object.keys(subGrupos).length} subgrupos`)
console.log(`   ${Object.keys(formasOrg).length} formas de organização`)
console.log(`   ${Object.keys(financiamentos).length} financiamentos`)
console.log(`   ${Object.keys(descricoes).length} descrições`)

console.log('\n📄  Lendo tb_procedimento.txt...')

// Layout tb_procedimento (posições 0-indexadas):
// CO_PROCEDIMENTO  [0:10]
// NO_PROCEDIMENTO  [10:260]
// TP_COMPLEXIDADE  [260:261]
// TP_SEXO          [261:262]
// QT_MAXIMA_EXEC   [262:266]
// QT_DIAS_PERM     [266:270]
// QT_PONTOS        [270:274]
// VL_IDADE_MINIMA  [274:278]
// VL_IDADE_MAXIMA  [278:282]
// VL_SH            [282:294]  → inteiro em centavos, dividir por 100
// VL_SA            [294:306]  → inteiro em centavos, dividir por 100
// VL_SP            [306:318]  → inteiro em centavos, dividir por 100
// CO_FINANCIAMENTO [318:320]
// CO_RUBRICA       [320:326]
// QT_TEMPO_PERM    [326:330]
// DT_COMPETENCIA   [330:336]

const parseCents = (s) => {
  const n = parseInt(s.trim(), 10)
  return isNaN(n) ? 0 : n / 100
}

const rows = readFixed(path.join(dadosDir, 'tb_procedimento.txt'))
  .map((line) => {
    const co = line.slice(0, 10).trim()
    if (co.length !== 10) return null

    const co_grupo     = co.slice(0, 2)
    const co_subgrupo  = co.slice(0, 4) // chave composta grupo+subgrupo
    const co_forma_org = co.slice(0, 6) // chave composta grupo+subgrupo+forma
    const co_fin       = line.slice(318, 320).trim()

    const qtDias = parseInt(line.slice(266, 270).trim(), 10)

    return {
      co_procedimento:  co,
      no_procedimento:  line.slice(10, 260).trim(),
      qt_dias_perman:   isNaN(qtDias) ? 0 : qtDias,
      vl_sh:            parseCents(line.slice(282, 294)),
      vl_sa:            parseCents(line.slice(294, 306)),
      vl_sp:            parseCents(line.slice(306, 318)),
      tp_financiamento: co_fin,
      no_financiamento: financiamentos[co_fin] ?? null,
      co_grupo,
      no_grupo:         grupos[co_grupo] ?? null,
      co_subgrupo,
      no_subgrupo:      subGrupos[co_subgrupo] ?? null,
      co_forma_org,
      no_forma_org:     formasOrg[co_forma_org] ?? null,
      ds_procedimento:  descricoes[co] ?? null,
      dt_competencia:   competencia,
    }
  })
  .filter(Boolean)

console.log(`✅  ${rows.length} procedimentos parseados`)

// Amostra para verificação
const sample = rows.find((r) => r.vl_sa > 0 || r.vl_sh > 0)
if (sample) {
  console.log('\n🔍  Amostra:')
  console.log(`   Código:  ${sample.co_procedimento}`)
  console.log(`   Nome:    ${sample.no_procedimento}`)
  console.log(`   VL_SA:   R$ ${sample.vl_sa.toFixed(2)}  |  VL_SH: R$ ${sample.vl_sh.toFixed(2)}`)
  console.log(`   Grupo:   ${sample.co_grupo} — ${sample.no_grupo}`)
  console.log(`   Fin.:    ${sample.tp_financiamento} — ${sample.no_financiamento}`)
  console.log(`   Desc.:   ${sample.ds_procedimento?.slice(0, 80) ?? '(sem descrição)'}...`)
}

console.log('\n🚀  Iniciando upsert no Supabase...\n')

const BATCH_SIZE = 500
let inserted = 0

for (let i = 0; i < rows.length; i += BATCH_SIZE) {
  const batch = rows.slice(i, i + BATCH_SIZE)

  const { error } = await supabase
    .from('procedimentos')
    .upsert(batch, { onConflict: 'co_procedimento' })

  if (error) {
    console.error(`\n❌  Erro no lote ${i}–${i + batch.length}:`, error.message)
    if (error.message.includes('column')) {
      console.error('\n💡  Faltam colunas na tabela. Rode no SQL Editor do Supabase:')
      console.error('    alter table procedimentos')
      console.error('      add column if not exists no_financiamento text,')
      console.error('      add column if not exists ds_procedimento  text;')
    }
    process.exit(1)
  }

  inserted += batch.length
  const pct = Math.round((inserted / rows.length) * 100)
  process.stdout.write(`\r   ${inserted}/${rows.length} (${pct}%)`)
}

console.log('\n\n✅  Importação concluída!')
