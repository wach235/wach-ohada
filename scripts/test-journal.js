'use strict';
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const JOURNAL = path.join(__dirname, '../data/journal.json');
const BACKUP = JOURNAL + '.bak';

// Backup journal
if (fs.existsSync(JOURNAL)) fs.copyFileSync(JOURNAL, BACKUP);
fs.writeFileSync(JOURNAL, JSON.stringify({ exercice: '2026', entreprise: 'Test SARL', ecritures: [] }, null, 2));

let passed = 0;
let failed = 0;

function assert(condition, msg) {
  if (condition) { console.log(`  ✅ ${msg}`); passed++; }
  else { console.error(`  ❌ ${msg}`); failed++; }
}

function run(cmd) {
  return execSync(`node scripts/journal.js ${cmd}`, { cwd: path.join(__dirname, '..') }).toString().trim();
}

console.log('\n=== TEST journal.js ===\n');

// Test 1: add écriture équilibrée
console.log('Test 1: add écriture équilibrée');
const ecriture = JSON.stringify({
  date: '2026-05-23',
  libelle: 'Vente test',
  piece: 'F001',
  type: 'vente',
  lignes: [
    { compte: '521', libelle: 'Banque', debit: 118000, credit: 0 },
    { compte: '701', libelle: 'Ventes', debit: 0, credit: 100000 },
    { compte: '4431', libelle: 'TVA', debit: 0, credit: 18000 }
  ]
});
const addResult = JSON.parse(run(`add '${ecriture}'`));
assert(addResult.id === 'ECR-2026-0001', `ID = ECR-2026-0001 (got ${addResult.id})`);
assert(addResult.status === 'ok', 'status = ok');

// Test 2: list retourne 1 écriture
console.log('\nTest 2: list retourne les écritures');
const listResult = JSON.parse(run('list'));
assert(listResult.length === 1, 'length = 1');
assert(listResult[0].equilibre === true, 'équilibre = true');
assert(listResult[0].total_debit === 118000, 'total_debit = 118000');

// Test 3: list avec filtre --type
console.log('\nTest 3: list avec filtre --type vente');
const listVente = JSON.parse(run('list --type vente'));
assert(listVente.length === 1, 'vente count = 1');
const listAchat = JSON.parse(run('list --type achat'));
assert(listAchat.length === 0, 'achat count = 0');

// Test 4: add écriture déséquilibrée → erreur
console.log('\nTest 4: add écriture déséquilibrée → erreur');
const desequilibre = JSON.stringify({
  date: '2026-05-23', libelle: 'Erreur', type: 'divers',
  lignes: [{ compte: '521', libelle: 'Banque', debit: 100, credit: 0 }]
});
try {
  execSync(`node scripts/journal.js add '${desequilibre}'`, { cwd: path.join(__dirname, '..'), stdio: 'pipe' });
  assert(false, 'doit rejeter écriture déséquilibrée');
} catch (e) {
  assert(true, 'écriture déséquilibrée rejetée avec erreur');
}

// Test 5: delete
console.log('\nTest 5: delete écriture');
const delResult = JSON.parse(run('delete ECR-2026-0001'));
assert(delResult.status === 'deleted', 'status = deleted');
const afterDel = JSON.parse(run('list'));
assert(afterDel.length === 0, 'liste vide après delete');

// Test 6: delete ID inexistant → erreur
console.log('\nTest 6: delete ID inexistant → erreur');
try {
  execSync(`node scripts/journal.js delete ECR-2026-9999`, { cwd: path.join(__dirname, '..'), stdio: 'pipe' });
  assert(false, 'doit rejeter ID inexistant');
} catch (e) {
  assert(true, 'ID inexistant rejeté avec erreur');
}

// Restore
if (fs.existsSync(BACKUP)) { fs.copyFileSync(BACKUP, JOURNAL); fs.unlinkSync(BACKUP); }
else fs.writeFileSync(JOURNAL, JSON.stringify({ exercice: '2026', entreprise: '', ecritures: [] }, null, 2));

console.log(`\n=== ${passed} passed, ${failed} failed ===\n`);
if (failed > 0) process.exit(1);
