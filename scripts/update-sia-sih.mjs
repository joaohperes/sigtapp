/**
 * Gera SQL para atualizar in_sia e in_sih na tabela procedimentos.
 *
 * Uso:
 *   node scripts/update-sia-sih.mjs ./dados
 *
 * Rode o SQL gerado no SQL Editor do Supabase.
 * Antes, execute no Supabase:
 *   ALTER TABLE procedimentos
 *     ADD COLUMN IF NOT EXISTS in_sia boolean DEFAULT false,
 *     ADD COLUMN IF NOT EXISTS in_sih boolean DEFAULT false;
 */

import { readFileSync, writeFileSync } from 'fs'
import path from 'path'

const dadosDir = process.argv[2]
if (!dadosDir) {
  console.error('Uso: node scripts/update-sia-sih.mjs <diretório-dados>')
  process.exit(1)
}

console.log('📄  Lendo rl_procedimento_sia_sih.txt...')

const lines = readFileSync(path.resolve(dadosDir, 'rl_procedimento_sia_sih.txt'), 'latin1')
  .split('\n').filter(Boolean)

// Agrega por co_procedimento: quais tipos (A / H) cada um tem
const map = new Map()
for (const line of lines) {
  const co   = line.slice(0, 10).trim()
  const tipo = line.slice(20, 21).trim()
  if (!co) continue
  if (!map.has(co)) map.set(co, { sia: false, sih: false })
  if (tipo === 'A') map.get(co).sia = true
  if (tipo === 'H') map.get(co).sih = true
}

const rows = [...map.entries()]
const comSia = rows.filter(([, v]) => v.sia).length
const comSih = rows.filter(([, v]) => v.sih).length
const comAmbos = rows.filter(([, v]) => v.sia && v.sih).length

console.log(`✅  ${rows.length} procedimentos`)
console.log(`   SIA: ${comSia} | SIH: ${comSih} | Ambos: ${comAmbos}`)

// Gera um único UPDATE com VALUES list
const values = rows
  .map(([co, { sia, sih }]) => `('${co}', ${sia}, ${sih})`)
  .join(',\n  ')

const sql = `-- Atualiza in_sia e in_sih a partir do SIGTAP
-- Gerado em ${new Date().toISOString()}

UPDATE procedimentos AS p
SET
  in_sia = v.sia,
  in_sih = v.sih
FROM (VALUES
  ${values}
) AS v(co_procedimento, sia, sih)
WHERE p.co_procedimento = v.co_procedimento;
`

const outPath = path.resolve('scripts/update-sia-sih.sql')
writeFileSync(outPath, sql, 'utf8')
console.log(`\n📝  SQL gerado em: scripts/update-sia-sih.sql`)
console.log('    1) Adicione as colunas no Supabase:')
console.log('       ALTER TABLE procedimentos')
console.log("         ADD COLUMN IF NOT EXISTS in_sia boolean DEFAULT false,")
console.log("         ADD COLUMN IF NOT EXISTS in_sih boolean DEFAULT false;")
console.log('    2) Cole o SQL gerado e execute.')
