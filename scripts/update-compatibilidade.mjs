/**
 * Gera SQL para criar a tabela procedimento_compatibilidades e popular com os dados do SIGTAP.
 *
 * Uso:
 *   node scripts/update-compatibilidade.mjs ./dados
 *
 * Gera arquivos menores para colar no SQL Editor do Supabase:
 *   scripts/update-compatibilidade-1-setup.sql
 *   scripts/update-compatibilidade-02-data.sql, 03, ...
 */

import { readFileSync, writeFileSync } from 'fs'
import path from 'path'

const dadosDir = process.argv[2]
if (!dadosDir) {
  console.error('Uso: node scripts/update-compatibilidade.mjs <diretório-dados>')
  process.exit(1)
}

const CHUNK_SIZE = 500

console.log('📄  Lendo tb_procedimento.txt...')
// CO_PROCEDIMENTO[0:10] | NO_PROCEDIMENTO[10:260]
const procMap = new Map()
for (const line of readFileSync(path.resolve(dadosDir, 'tb_procedimento.txt'), 'latin1').split('\n').filter(Boolean)) {
  const co = line.slice(0, 10).trim()
  const no = line.slice(10, 260).trim()
  if (co) procMap.set(co, no)
}
console.log(`   ${procMap.size} procedimentos`)

console.log('📄  Lendo rl_procedimento_compativel.txt...')
// CO_PROCEDIMENTO_PRINCIPAL[0:10] | CO_REGISTRO_PRINCIPAL[10:12] | CO_PROCEDIMENTO_COMPATIVEL[12:22]
// CO_REGISTRO_COMPATIVEL[22:24] | TP_COMPATIBILIDADE[24:25] | QT_PERMITIDA[25:29] | DT[29:35]
const rows = []
for (const line of readFileSync(path.resolve(dadosDir, 'rl_procedimento_compativel.txt'), 'latin1').split('\n').filter(Boolean)) {
  const co_proc      = line.slice(0, 10).trim()
  const co_compat    = line.slice(12, 22).trim()
  const qt_permitida = parseInt(line.slice(25, 29).trim(), 10) || null
  const no_compat    = procMap.get(co_compat)
  if (!co_proc || !co_compat || !no_compat) continue
  rows.push({ co_proc, co_compat, no_compat, qt_permitida })
}
console.log(`✅  ${rows.length} vínculos de compatibilidade`)

const escape = s => s.replace(/'/g, "''")

// Arquivo 1: setup
const setupSql = `-- Cria a tabela procedimento_compatibilidades
-- Gerado em ${new Date().toISOString()}

CREATE TABLE IF NOT EXISTS procedimento_compatibilidades (
  co_procedimento            text    NOT NULL,
  co_procedimento_compativel text    NOT NULL,
  no_procedimento_compativel text    NOT NULL,
  qt_permitida               integer,
  PRIMARY KEY (co_procedimento, co_procedimento_compativel)
);

TRUNCATE TABLE procedimento_compatibilidades;

CREATE INDEX IF NOT EXISTS idx_proc_compat_co ON procedimento_compatibilidades (co_procedimento);
`
const setupPath = path.resolve('scripts/update-compatibilidade-1-setup.sql')
writeFileSync(setupPath, setupSql, 'utf8')
console.log(`\n📝  ${setupPath}`)

// Arquivos de dados em chunks
const chunks = []
for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
  chunks.push(rows.slice(i, i + CHUNK_SIZE))
}

chunks.forEach((chunk, idx) => {
  const values = chunk
    .map(({ co_proc, co_compat, no_compat, qt_permitida }) =>
      `('${co_proc}', '${co_compat}', '${escape(no_compat)}', ${qt_permitida ?? 'NULL'})`
    )
    .join(',\n  ')

  const sql = `-- Dados procedimento_compatibilidades — parte ${idx + 1}/${chunks.length}
INSERT INTO procedimento_compatibilidades (co_procedimento, co_procedimento_compativel, no_procedimento_compativel, qt_permitida) VALUES
  ${values}
ON CONFLICT DO NOTHING;
`
  const num = String(idx + 2).padStart(2, '0')
  const outPath = path.resolve(`scripts/update-compatibilidade-${num}-data.sql`)
  writeFileSync(outPath, sql, 'utf8')
  console.log(`📝  ${outPath}  (${chunk.length} linhas)`)
})

console.log(`\n✅  Cole os arquivos no SQL Editor do Supabase na ordem numérica.`)
