/**
 * Gera um arquivo SQL para atualizar qt_dias_perman no Supabase.
 *
 * Uso:
 *   node scripts/update-dias-perman.mjs ./dados
 *
 * Depois rode o arquivo gerado (update-dias-perman.sql) no SQL Editor do Supabase.
 */

import { readFileSync, writeFileSync } from 'fs'
import path from 'path'

const dadosDir = process.argv[2]
if (!dadosDir) {
  console.error('❌  Uso: node scripts/update-dias-perman.mjs <diretório-dados>')
  console.error('    Ex:  node scripts/update-dias-perman.mjs ./dados')
  process.exit(1)
}

console.log('📄  Lendo tb_procedimento.txt...')

const rows = readFileSync(path.resolve(dadosDir, 'tb_procedimento.txt'), 'latin1')
  .split('\n')
  .filter(Boolean)
  .map((line) => {
    const co = line.slice(0, 10).trim()
    if (co.length !== 10) return null
    const dias = parseInt(line.slice(266, 270).trim(), 10)
    if (!dias || dias === 0) return null
    return { co, dias }
  })
  .filter(Boolean)

console.log(`✅  ${rows.length} procedimentos com dias de permanência > 0`)

// Gera um único UPDATE com VALUES list — eficiente e sem dependências externas
const values = rows.map(({ co, dias }) => `('${co}', ${dias})`).join(',\n  ')

const sql = `-- Atualiza qt_dias_perman a partir do SIGTAP
-- Gerado em ${new Date().toISOString()}

UPDATE procedimentos AS p
SET qt_dias_perman = v.dias
FROM (VALUES
  ${values}
) AS v(co_procedimento, dias)
WHERE p.co_procedimento = v.co_procedimento;
`

const outPath = path.resolve('scripts/update-dias-perman.sql')
writeFileSync(outPath, sql, 'utf8')
console.log(`\n📝  SQL gerado em: scripts/update-dias-perman.sql`)
console.log('    Cole o conteúdo no SQL Editor do Supabase e execute.')
