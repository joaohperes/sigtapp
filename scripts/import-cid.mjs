/**
 * Importa a tabela de CIDs (tb_cid.txt) para o Supabase.
 *
 * Uso:
 *   SUPABASE_URL=https://xxx.supabase.co \
 *   SUPABASE_SERVICE_KEY=eyJ... \
 *   node scripts/import-cid.mjs ./dados
 *
 * ANTES de rodar, execute no SQL Editor do Supabase:
 *
 *   create table if not exists cid (
 *     co_cid    text primary key,
 *     no_cid    text,
 *     tp_sexo   char(1),
 *     tp_agravo char(1)
 *   );
 *   alter table cid enable row level security;
 *   create policy "public read" on cid for select using (true);
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
if (!dadosDir) {
  console.error('❌  Uso: node scripts/import-cid.mjs <diretório-dados>')
  console.error('    Ex:  node scripts/import-cid.mjs ./dados')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// Layout tb_cid.txt (posições 0-indexadas):
// CO_CID    [0:4]     ex: "A00 ", "A000"
// NO_CID    [4:104]   nome da condição
// TP_AGRAVO [104:105] 0=não agravo, 1=agravo, 2=agravo de notif. compulsória
// TP_SEXO   [105:106] I=Indiferente, M=Masculino, F=Feminino

console.log('📂  Lendo tb_cid.txt...')

const lines = readFileSync(path.join(dadosDir, 'tb_cid.txt'), 'latin1')
  .split('\n')
  .filter(Boolean)

const rows = lines.map((line) => ({
  co_cid:    line.slice(0, 4).trim(),
  no_cid:    line.slice(4, 104).trim(),
  tp_agravo: line.slice(104, 105).trim() || null,
  tp_sexo:   line.slice(105, 106).trim() || null,
})).filter(r => r.co_cid.length > 0 && r.no_cid.length > 0)

console.log(`✅  ${rows.length} CIDs parseados`)
console.log('🚀  Importando para o Supabase...\n')

const BATCH_SIZE = 500
let inserted = 0

for (let i = 0; i < rows.length; i += BATCH_SIZE) {
  const batch = rows.slice(i, i + BATCH_SIZE)

  const { error } = await supabase
    .from('cid')
    .upsert(batch, { onConflict: 'co_cid' })

  if (error) {
    console.error(`\n❌  Erro no lote ${i}–${i + batch.length}:`, error.message)
    if (error.message.includes('schema cache') || error.message.includes('not find')) {
      console.error('\n💡  A tabela "cid" não existe. Rode no SQL Editor do Supabase:')
      console.error(`
  create table if not exists cid (
    co_cid    text primary key,
    no_cid    text,
    tp_sexo   char(1),
    tp_agravo char(1)
  );
  alter table cid enable row level security;
  create policy "public read" on cid for select using (true);
`)
    }
    process.exit(1)
  }

  inserted += batch.length
  const pct = Math.round((inserted / rows.length) * 100)
  process.stdout.write(`\r   ${inserted}/${rows.length} (${pct}%)`)
}

console.log('\n\n✅  Importação de CIDs concluída!')
