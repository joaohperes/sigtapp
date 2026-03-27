/**
 * Gera SQL para criar a tabela procedimento_habilitacoes e popular com os dados do SIGTAP.
 *
 * Uso:
 *   node scripts/update-habilitacao.mjs ./dados
 *
 * Gera arquivos menores para colar no SQL Editor do Supabase:
 *   scripts/update-habilitacao-1-setup.sql  — CREATE TABLE + TRUNCATE
 *   scripts/update-habilitacao-2-data.sql   — INSERTs (dividido em partes se necessário)
 */

import { readFileSync, writeFileSync } from 'fs'
import path from 'path'

const dadosDir = process.argv[2]
if (!dadosDir) {
  console.error('Uso: node scripts/update-habilitacao.mjs <diretório-dados>')
  process.exit(1)
}

const CHUNK_SIZE = 500 // linhas por INSERT batch

console.log('📄  Lendo tb_habilitacao.txt...')

// tb_habilitacao: CO_HABILITACAO[0:4] | NO_HABILITACAO[4:154] | DT[154:160]
const habMap = new Map()
for (const line of readFileSync(path.resolve(dadosDir, 'tb_habilitacao.txt'), 'latin1').split('\n').filter(Boolean)) {
  const co = line.slice(0, 4).trim()
  const no = line.slice(4, 154).trim()
  if (co) habMap.set(co, no)
}
console.log(`   ${habMap.size} habilitações`)

console.log('📄  Lendo rl_procedimento_habilitacao.txt...')

// rl_procedimento_habilitacao: CO_PROC[0:10] | CO_HAB[10:14] | NU_GRUPO[14:18] | DT[18:24]
const rows = []
for (const line of readFileSync(path.resolve(dadosDir, 'rl_procedimento_habilitacao.txt'), 'latin1').split('\n').filter(Boolean)) {
  const co_proc = line.slice(0, 10).trim()
  const co_hab  = line.slice(10, 14).trim()
  const no_hab  = habMap.get(co_hab)
  if (!co_proc || !co_hab || !no_hab) continue
  rows.push({ co_proc, co_hab, no_hab })
}
console.log(`✅  ${rows.length} vínculos procedimento→habilitação`)

const escape = s => s.replace(/'/g, "''")

// Arquivo 1: setup
const setupSql = `-- Cria a tabela procedimento_habilitacoes
-- Gerado em ${new Date().toISOString()}

CREATE TABLE IF NOT EXISTS procedimento_habilitacoes (
  co_procedimento text NOT NULL,
  co_habilitacao  text NOT NULL,
  no_habilitacao  text NOT NULL,
  PRIMARY KEY (co_procedimento, co_habilitacao)
);

TRUNCATE TABLE procedimento_habilitacoes;

CREATE INDEX IF NOT EXISTS idx_proc_hab_co ON procedimento_habilitacoes (co_procedimento);
`
const setupPath = path.resolve('scripts/update-habilitacao-1-setup.sql')
writeFileSync(setupPath, setupSql, 'utf8')
console.log(`\n📝  ${setupPath}`)

// Arquivo(s) de dados: chunks de CHUNK_SIZE linhas
const chunks = []
for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
  chunks.push(rows.slice(i, i + CHUNK_SIZE))
}

chunks.forEach((chunk, idx) => {
  const values = chunk
    .map(({ co_proc, co_hab, no_hab }) =>
      `('${co_proc}', '${co_hab}', '${escape(no_hab)}')`
    )
    .join(',\n  ')

  const sql = `-- Dados procedimento_habilitacoes — parte ${idx + 1}/${chunks.length}
INSERT INTO procedimento_habilitacoes (co_procedimento, co_habilitacao, no_habilitacao) VALUES
  ${values}
ON CONFLICT DO NOTHING;
`
  const num = String(idx + 2).padStart(2, '0')
  const outPath = path.resolve(`scripts/update-habilitacao-${num}-data.sql`)
  writeFileSync(outPath, sql, 'utf8')
  console.log(`📝  ${outPath}  (${chunk.length} linhas)`)
})

console.log(`\n✅  Cole os arquivos no SQL Editor do Supabase na ordem numérica.`)
