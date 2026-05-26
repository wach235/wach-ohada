# wach-ohada v1.1 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter un journal comptable persistant (`data/journal.json`) et des scripts Node.js pour tenir le livre des écritures, importer des relevés CSV, générer le bilan/compte de résultat/TAFIRE en Markdown et les exporter en PDF — le tout piloté par l'agent IA via `SKILL.md`.

**Architecture:** `scripts/journal.js` lit/écrit `data/journal.json` (source de vérité). `scripts/etats.js` agrège les soldes par compte pour générer les états en Markdown dans `data/etats/`. `scripts/pdf.js` convertit ces Markdown en PDF via Puppeteer (HTML inline). `SKILL.md` est mis à jour avec deux nouveaux blocs pour orchestrer tout ça.

**Tech Stack:** Node.js (stdlib uniquement sauf Puppeteer pour le PDF), JSON pour le stockage, Markdown pour les états intermédiaires.

---

## Carte des fichiers

| Fichier | Rôle | Action |
|---|---|---|
| `data/journal.json` | Livre des écritures persistant | Créer |
| `data/etats/` | Répertoire des états générés | Créer |
| `scripts/journal.js` | add / list / delete écritures | Créer |
| `scripts/import-csv.js` | Import relevé bancaire CSV | Créer |
| `scripts/etats.js` | Générer bilan + compte résultat + TAFIRE | Créer |
| `templates/base.html` | Template HTML/CSS pour PDF | Créer |
| `scripts/pdf.js` | Markdown → PDF via Puppeteer | Créer |
| `comptable/SKILL.md` | Ajouter blocs Journal + États | Modifier |
| `package.json` | Ajouter puppeteer + scripts npm | Modifier |

---

## Task 1 : Setup — journal.json + package.json

**Files:**
- Create: `data/journal.json`
- Create: `data/etats/.gitkeep`
- Modify: `package.json`

- [ ] **Step 1 : Créer `data/journal.json`**

```json
{
  "exercice": "2026",
  "entreprise": "",
  "ecritures": []
}
```

- [ ] **Step 2 : Créer `data/etats/.gitkeep`**

```bash
touch data/etats/.gitkeep
```

- [ ] **Step 3 : Valider le JSON**

```bash
python3 -m json.tool data/journal.json > /dev/null && echo "✅ journal.json valide"
```

Expected: `✅ journal.json valide`

- [ ] **Step 4 : Mettre à jour `package.json`**

Remplacer le contenu complet par :

```json
{
  "name": "wach-ohada",
  "version": "1.1.0",
  "description": "Skills IA pour la comptabilité SYSCOHADA et la fiscalité OHADA — Tchad et zone CEMAC",
  "keywords": ["ohada", "syscohada", "comptabilité", "fiscalité", "tchad", "cemac", "ai-skill"],
  "author": "wach",
  "license": "MIT",
  "homepage": "https://github.com/wach235/wach-ohada",
  "repository": {
    "type": "git",
    "url": "https://github.com/wach235/wach-ohada.git"
  },
  "scripts": {
    "journal": "node scripts/journal.js",
    "import": "node scripts/import-csv.js",
    "etats": "node scripts/etats.js",
    "pdf": "node scripts/pdf.js",
    "validate": "for f in comptable/profiles/chad.json data/syscohada/plan-comptable.json comptable/company.example.json marketplace.json data/journal.json; do python3 -m json.tool $f > /dev/null && echo OK: $f || echo FAIL: $f; done",
    "test": "node scripts/test-journal.js"
  },
  "dependencies": {
    "puppeteer": "^22.0.0"
  }
}
```

- [ ] **Step 5 : Vérifier que package.json est valide**

```bash
python3 -m json.tool package.json > /dev/null && echo "✅ package.json valide"
```

Expected: `✅ package.json valide`

- [ ] **Step 6 : Commit**

```bash
git add data/journal.json data/etats/.gitkeep package.json
git commit -m "feat(v1.1): add journal.json schema and update package.json to v1.1.0"
```

---

## Task 2 : `scripts/journal.js` — add / list / delete

**Files:**
- Create: `scripts/journal.js`
- Create: `scripts/test-journal.js`

- [ ] **Step 1 : Créer `scripts/test-journal.js`** (tests à faire passer)

```javascript
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
```

- [ ] **Step 2 : Lancer les tests — vérifier qu'ils échouent**

```bash
node scripts/test-journal.js
```

Expected: erreur `Cannot find module './journal.js'` ou similaire (le script n'existe pas encore)

- [ ] **Step 3 : Créer `scripts/journal.js`**

```javascript
'use strict';

const fs = require('fs');
const path = require('path');

const JOURNAL_PATH = path.join(__dirname, '../data/journal.json');

function loadJournal() {
  if (!fs.existsSync(JOURNAL_PATH)) {
    return { exercice: new Date().getFullYear().toString(), entreprise: '', ecritures: [] };
  }
  return JSON.parse(fs.readFileSync(JOURNAL_PATH, 'utf8'));
}

function saveJournal(journal) {
  fs.writeFileSync(JOURNAL_PATH, JSON.stringify(journal, null, 2), 'utf8');
}

function nextId(journal) {
  const year = journal.exercice;
  const n = journal.ecritures.length + 1;
  return `ECR-${year}-${String(n).padStart(4, '0')}`;
}

function cmdAdd(args) {
  const journal = loadJournal();
  const data = JSON.parse(args[0]);

  const totalDebit = data.lignes.reduce((sum, l) => sum + (l.debit || 0), 0);
  const totalCredit = data.lignes.reduce((sum, l) => sum + (l.credit || 0), 0);
  const equilibre = Math.abs(totalDebit - totalCredit) < 0.01;

  if (!equilibre && data.source !== 'import') {
    process.stderr.write(JSON.stringify({
      status: 'error',
      message: `Écriture déséquilibrée: débit=${totalDebit} crédit=${totalCredit}`
    }) + '\n');
    process.exit(1);
  }

  const ecriture = {
    id: nextId(journal),
    date: data.date,
    libelle: data.libelle,
    piece: data.piece || '',
    type: data.type || 'divers',
    lignes: data.lignes,
    total_debit: totalDebit,
    total_credit: totalCredit,
    equilibre,
    source: data.source || 'agent'
  };

  journal.ecritures.push(ecriture);
  saveJournal(journal);
  process.stdout.write(JSON.stringify({ id: ecriture.id, status: 'ok' }) + '\n');
}

function cmdList(args) {
  const journal = loadJournal();
  let ecritures = journal.ecritures;

  const fromIdx = args.indexOf('--from');
  const toIdx = args.indexOf('--to');
  const compteIdx = args.indexOf('--compte');
  const typeIdx = args.indexOf('--type');

  if (fromIdx !== -1) ecritures = ecritures.filter(e => e.date >= args[fromIdx + 1]);
  if (toIdx !== -1) ecritures = ecritures.filter(e => e.date <= args[toIdx + 1]);
  if (compteIdx !== -1) {
    const c = args[compteIdx + 1];
    ecritures = ecritures.filter(e => e.lignes.some(l => l.compte === c));
  }
  if (typeIdx !== -1) ecritures = ecritures.filter(e => e.type === args[typeIdx + 1]);

  process.stdout.write(JSON.stringify(ecritures, null, 2) + '\n');
}

function cmdDelete(args) {
  const id = args[0];
  const journal = loadJournal();
  const before = journal.ecritures.length;
  journal.ecritures = journal.ecritures.filter(e => e.id !== id);

  if (journal.ecritures.length === before) {
    process.stderr.write(JSON.stringify({
      status: 'error',
      message: `Écriture ${id} non trouvée`
    }) + '\n');
    process.exit(1);
  }

  saveJournal(journal);
  process.stdout.write(JSON.stringify({ id, status: 'deleted' }) + '\n');
}

const [,, cmd, ...rest] = process.argv;

switch (cmd) {
  case 'add': cmdAdd(rest); break;
  case 'list': cmdList(rest); break;
  case 'delete': cmdDelete(rest); break;
  default:
    process.stderr.write('Usage: node scripts/journal.js <add|list|delete> [args]\n');
    process.exit(1);
}
```

- [ ] **Step 4 : Lancer les tests — vérifier qu'ils passent**

```bash
node scripts/test-journal.js
```

Expected:
```
=== TEST journal.js ===
Test 1: add écriture équilibrée
  ✅ ID = ECR-2026-0001
  ✅ status = ok
Test 2: list retourne les écritures
  ✅ length = 1
  ✅ équilibre = true
  ✅ total_debit = 118000
Test 3: list avec filtre --type vente
  ✅ vente count = 1
  ✅ achat count = 0
Test 4: add écriture déséquilibrée → erreur
  ✅ écriture déséquilibrée rejetée avec erreur
Test 5: delete écriture
  ✅ status = deleted
  ✅ liste vide après delete
Test 6: delete ID inexistant → erreur
  ✅ ID inexistant rejeté avec erreur

=== 10 passed, 0 failed ===
```

- [ ] **Step 5 : Commit**

```bash
git add scripts/journal.js scripts/test-journal.js
git commit -m "feat(v1.1): add journal.js (add/list/delete) with tests"
```

---

## Task 3 : `scripts/import-csv.js`

**Files:**
- Create: `scripts/import-csv.js`
- Create: `scripts/test-import.csv` (fichier CSV de test)

- [ ] **Step 1 : Créer `scripts/test-import.csv`**

```
Date;Libellé;Débit;Crédit
23/05/2026;Virement client ALPHA;"";500000
24/05/2026;Achat fournitures LIBRAIRIE DU LAC;45000;""
25/05/2026;Loyer bureau mai 2026;150000;""
```

- [ ] **Step 2 : Créer `scripts/import-csv.js`**

```javascript
'use strict';

const fs = require('fs');
const path = require('path');

const JOURNAL_PATH = path.join(__dirname, '../data/journal.json');

function loadJournal() {
  if (!fs.existsSync(JOURNAL_PATH)) {
    return { exercice: new Date().getFullYear().toString(), entreprise: '', ecritures: [] };
  }
  return JSON.parse(fs.readFileSync(JOURNAL_PATH, 'utf8'));
}

function saveJournal(journal) {
  fs.writeFileSync(JOURNAL_PATH, JSON.stringify(journal, null, 2), 'utf8');
}

function nextId(journal) {
  const year = journal.exercice;
  const n = journal.ecritures.length + 1;
  return `ECR-${year}-${String(n).padStart(4, '0')}`;
}

function parseCSV(content) {
  const sep = content.includes(';') ? ';' : ',';
  const lines = content.trim().split('\n').map(l => l.replace(/\r/g, ''));
  const header = lines[0].split(sep).map(h => h.trim().replace(/"/g, '').toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, ''));
  return lines.slice(1)
    .map(line => {
      const values = line.split(sep).map(v => v.trim().replace(/"/g, ''));
      const row = {};
      header.forEach((h, i) => { row[h] = values[i] || ''; });
      return row;
    })
    .filter(row => Object.values(row).some(v => v.trim()));
}

function detectColumns(header) {
  const find = (keys) => header.find(h => keys.some(k => h.includes(k)));
  return {
    dateCol: find(['date']),
    libelleCol: find(['libel', 'label', 'operat', 'description']),
    debitCol: find(['debit', 'sortie', 'retrait']),
    creditCol: find(['credit', 'entree', 'depot', 'versement']),
    montantCol: find(['montant', 'amount'])
  };
}

function parseAmount(str) {
  if (!str || str.trim() === '') return 0;
  return parseFloat(str.replace(/\s/g, '').replace(',', '.')) || 0;
}

function normalizeDate(str) {
  if (!str) return new Date().toISOString().split('T')[0];
  const ddmm = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (ddmm) return `${ddmm[3]}-${ddmm[2].padStart(2,'0')}-${ddmm[1].padStart(2,'0')}`;
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  return str;
}

const [,, csvFile] = process.argv;

if (!csvFile || !fs.existsSync(csvFile)) {
  process.stderr.write(`Usage: node scripts/import-csv.js <fichier.csv>\n`);
  process.exit(1);
}

const content = fs.readFileSync(csvFile, 'utf8');
const rows = parseCSV(content);

if (rows.length === 0) {
  process.stderr.write('❌ Aucune ligne trouvée dans le CSV\n');
  process.exit(1);
}

const header = Object.keys(rows[0]);
const cols = detectColumns(header);

if (!cols.dateCol || !cols.libelleCol) {
  process.stderr.write(`❌ Colonnes date/libellé non détectées.\nColonnes trouvées: ${header.join(', ')}\n`);
  process.exit(1);
}

const journal = loadJournal();
let imported = 0;
let incomplete = 0;

for (const row of rows) {
  const date = normalizeDate(row[cols.dateCol]);
  const libelle = row[cols.libelleCol];
  if (!libelle) continue;

  let sortie = 0, entree = 0;
  if (cols.debitCol && cols.creditCol) {
    sortie = parseAmount(row[cols.debitCol]);
    entree = parseAmount(row[cols.creditCol]);
  } else if (cols.montantCol) {
    const m = parseAmount(row[cols.montantCol]);
    if (m < 0) sortie = Math.abs(m); else entree = m;
  }
  if (sortie === 0 && entree === 0) continue;

  // 521 = banque. Entrée = crédit banque (actif +), Sortie = débit banque (actif -)
  const montant = entree > 0 ? entree : sortie;
  const lignes = entree > 0
    ? [
        { compte: '521', libelle: 'Banques — comptes courants', debit: montant, credit: 0 },
        { compte: '?????', libelle: 'À compléter', debit: 0, credit: montant }
      ]
    : [
        { compte: '?????', libelle: 'À compléter', debit: montant, credit: 0 },
        { compte: '521', libelle: 'Banques — comptes courants', debit: 0, credit: montant }
      ];

  const ecriture = {
    id: nextId(journal),
    date,
    libelle,
    piece: '',
    type: 'tresorerie',
    lignes,
    total_debit: montant,
    total_credit: montant,
    equilibre: false,
    source: 'import'
  };

  journal.ecritures.push(ecriture);
  imported++;
  incomplete++;
}

saveJournal(journal);
process.stdout.write(`✅ ${imported} écriture(s) importée(s)\n`);
process.stdout.write(`⚠️  ${incomplete} écriture(s) à compléter (compte "?????" à renseigner par l'agent)\n`);
```

- [ ] **Step 3 : Tester l'import**

```bash
# Sauvegarde le journal actuel
cp data/journal.json data/journal.json.bak

# Lance l'import
node scripts/import-csv.js scripts/test-import.csv
```

Expected:
```
✅ 3 écriture(s) importée(s)
⚠️  3 écriture(s) à compléter (compte "?????" à renseigner par l'agent)
```

- [ ] **Step 4 : Vérifier les écritures importées**

```bash
node scripts/journal.js list --type tresorerie
```

Expected: 3 écritures avec `"source": "import"`, `"equilibre": false`, compte `"?????"` présent dans les lignes.

- [ ] **Step 5 : Restaurer le journal**

```bash
cp data/journal.json.bak data/journal.json && rm data/journal.json.bak
```

- [ ] **Step 6 : Commit**

```bash
git add scripts/import-csv.js scripts/test-import.csv
git commit -m "feat(v1.1): add import-csv.js for bank statement import"
```

---

## Task 4 : `scripts/etats.js` — bilan + compte de résultat + TAFIRE

**Files:**
- Create: `scripts/etats.js`

- [ ] **Step 1 : Peupler le journal avec des données de test**

```bash
node scripts/journal.js add '{"date":"2026-05-01","libelle":"Apport en capital","piece":"ACTE-001","type":"tresorerie","lignes":[{"compte":"521","libelle":"Banques","debit":5000000,"credit":0},{"compte":"101","libelle":"Capital social","debit":0,"credit":5000000}]}'

node scripts/journal.js add '{"date":"2026-05-05","libelle":"Achat marchandises — Fournisseur ALPHA","piece":"FA-001","type":"achat","lignes":[{"compte":"601","libelle":"Achats marchandises","debit":200000,"credit":0},{"compte":"4433","libelle":"TVA déductible 18%","debit":36000,"credit":0},{"compte":"401","libelle":"Fournisseur ALPHA","debit":0,"credit":236000}]}'

node scripts/journal.js add '{"date":"2026-05-10","libelle":"Vente marchandises — Client BETA — F2026-001","piece":"F2026-001","type":"vente","lignes":[{"compte":"411","libelle":"Client BETA","debit":590000,"credit":0},{"compte":"701","libelle":"Ventes marchandises","debit":0,"credit":500000},{"compte":"4431","libelle":"TVA collectée 18%","debit":0,"credit":90000}]}'

node scripts/journal.js add '{"date":"2026-05-15","libelle":"Paie mai 2026","piece":"PAIE-2026-05","type":"salaire","lignes":[{"compte":"641","libelle":"Rémunérations","debit":300000,"credit":0},{"compte":"422","libelle":"Salaires nets dus","debit":0,"credit":233000},{"compte":"4444","libelle":"IRPP","debit":0,"credit":90000},{"compte":"431","libelle":"CNPS salarié","debit":0,"credit":-23000}]}'
```

Wait, that last one won't balance. Let me fix:

Salaire brut: 300 000
IRPP (30%): 90 000
CNPS salarié (3,5%): 10 500
Net: 199 500

```bash
node scripts/journal.js add '{"date":"2026-05-15","libelle":"Paie mai 2026","piece":"PAIE-2026-05","type":"salaire","lignes":[{"compte":"641","libelle":"Rémunérations","debit":300000,"credit":0},{"compte":"422","libelle":"Salaires nets dus","debit":0,"credit":199500},{"compte":"4444","libelle":"IRPP","debit":0,"credit":90000},{"compte":"431","libelle":"CNPS salarié 3.5%","debit":0,"credit":10500}]}'
```

- [ ] **Step 2 : Créer `scripts/etats.js`**

```javascript
'use strict';

const fs = require('fs');
const path = require('path');

const JOURNAL_PATH = path.join(__dirname, '../data/journal.json');
const ETATS_DIR = path.join(__dirname, '../data/etats');

function loadJournal() {
  if (!fs.existsSync(JOURNAL_PATH)) {
    process.stderr.write('❌ data/journal.json introuvable\n');
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(JOURNAL_PATH, 'utf8'));
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function calcSoldes(ecritures, periode) {
  const soldes = {};
  for (const e of ecritures) {
    if (!e.equilibre) continue;
    if (periode) {
      // periode peut être "2026" (année) ou "2026-05" (mois)
      if (!e.date.startsWith(periode)) continue;
    }
    for (const l of e.lignes) {
      if (!soldes[l.compte]) soldes[l.compte] = { debit: 0, credit: 0, libelle: l.libelle };
      soldes[l.compte].debit += l.debit || 0;
      soldes[l.compte].credit += l.credit || 0;
    }
  }
  return soldes;
}

function fmtXAF(n) {
  const rounded = Math.round(n);
  return rounded.toLocaleString('fr-FR') + ' XAF';
}

function sumDebit(soldes, prefixes) {
  return Object.entries(soldes)
    .filter(([k]) => prefixes.some(p => k.startsWith(p)))
    .reduce((sum, [, s]) => sum + Math.max(0, s.debit - s.credit), 0);
}

function sumCredit(soldes, prefixes) {
  return Object.entries(soldes)
    .filter(([k]) => prefixes.some(p => k.startsWith(p)))
    .reduce((sum, [, s]) => sum + Math.max(0, s.credit - s.debit), 0);
}

function generateBilan(journal, periode) {
  const label = periode || journal.exercice;
  const soldes = calcSoldes(journal.ecritures, periode);

  const immoBrut    = sumDebit(soldes,  ['21','22','23','24','25','26','27']);
  const amortis     = sumCredit(soldes, ['28','29']);
  const immoNet     = immoBrut - amortis;
  const stocks      = sumDebit(soldes,  ['31','32','33','34','35','36']);
  const clients     = sumDebit(soldes,  ['411','412','418']);
  const etatDeb     = sumDebit(soldes,  ['4432','4433']);
  const autresDeb   = sumDebit(soldes,  ['461']);
  const tresorerie  = sumDebit(soldes,  ['511','521','531','571']);
  const totalActif  = immoNet + stocks + clients + etatDeb + autresDeb + tresorerie;

  const capital     = sumCredit(soldes, ['101']);
  const reserves    = sumCredit(soldes, ['111','118']);
  const rnBen       = sumCredit(soldes, ['131']);
  const rnPerte     = sumDebit(soldes,  ['139']);
  const report      = sumCredit(soldes, ['12']) - sumDebit(soldes, ['129']);
  const cpropres    = capital + reserves + rnBen - rnPerte + report;
  const dettesFin   = sumCredit(soldes, ['161','162','181']);
  const fournisseur = sumCredit(soldes, ['401','402','408']);
  const etatCred    = sumCredit(soldes, ['4431','4441','4444','4445','4449']);
  const social      = sumCredit(soldes, ['422','431']);
  const totalPassif = cpropres + dettesFin + fournisseur + etatCred + social;
  const equilibre   = Math.abs(totalActif - totalPassif) < 1;

  return `# Bilan — ${label}
*Référentiel SYSCOHADA 2017 | Généré le ${new Date().toLocaleDateString('fr-FR')}*

---

## ACTIF

| Poste | Montant |
|---|---|
| Actif immobilisé brut (21-27) | ${fmtXAF(immoBrut)} |
| — Amortissements (28-29) | (${fmtXAF(amortis)}) |
| **Actif immobilisé net** | **${fmtXAF(immoNet)}** |
| Stocks (31-36) | ${fmtXAF(stocks)} |
| Créances clients (411-418) | ${fmtXAF(clients)} |
| État débiteur (TVA déductible) | ${fmtXAF(etatDeb)} |
| Autres créances (461) | ${fmtXAF(autresDeb)} |
| Trésorerie (521, 571) | ${fmtXAF(tresorerie)} |
| **TOTAL ACTIF** | **${fmtXAF(totalActif)}** |

---

## PASSIF

| Poste | Montant |
|---|---|
| Capital social (101) | ${fmtXAF(capital)} |
| Réserves (111, 118) | ${fmtXAF(reserves)} |
| Report à nouveau | ${fmtXAF(report)} |
| Résultat de l'exercice | ${fmtXAF(rnBen - rnPerte)} |
| **Capitaux propres** | **${fmtXAF(cpropres)}** |
| Dettes financières (161, 162) | ${fmtXAF(dettesFin)} |
| Fournisseurs (401-408) | ${fmtXAF(fournisseur)} |
| État créancier (TVA, IS, IRPP) | ${fmtXAF(etatCred)} |
| Dettes sociales (422, 431) | ${fmtXAF(social)} |
| **TOTAL PASSIF** | **${fmtXAF(totalPassif)}** |

---

${equilibre ? '✅ Bilan équilibré' : `⚠️ Écart : ${fmtXAF(Math.abs(totalActif - totalPassif))}`}
`;
}

function generateResultat(journal, periode) {
  const label = periode || journal.exercice;
  const soldes = calcSoldes(journal.ecritures, periode);

  const achats    = sumDebit(soldes, ['601','602','604','605']);
  const services  = sumDebit(soldes, ['611','612','621','622','623','624','625','626','628','631']);
  const personnel = sumDebit(soldes, ['641','642','643','644']);
  const amortis   = sumDebit(soldes, ['681']);
  const chargesFin= sumDebit(soldes, ['661','671']);
  const is        = sumDebit(soldes, ['691']);
  const totalCh   = achats + services + personnel + amortis + chargesFin + is;

  const ventes    = sumCredit(soldes, ['701','702','703','704','705','706','707']);
  const subv      = sumCredit(soldes, ['731','741']);
  const prodFin   = sumCredit(soldes, ['771','772']);
  const reprises  = sumCredit(soldes, ['781']);
  const totalProd = ventes + subv + prodFin + reprises;

  const resultat  = totalProd - totalCh;

  return `# Compte de Résultat — ${label}
*Référentiel SYSCOHADA 2017 | Généré le ${new Date().toLocaleDateString('fr-FR')}*

---

## CHARGES

| Poste | Montant |
|---|---|
| Achats marchandises/matières (601-605) | ${fmtXAF(achats)} |
| Services extérieurs (611-631) | ${fmtXAF(services)} |
| Charges de personnel (641-644) | ${fmtXAF(personnel)} |
| Dotations aux amortissements (681) | ${fmtXAF(amortis)} |
| Charges financières (661, 671) | ${fmtXAF(chargesFin)} |
| IS (691) | ${fmtXAF(is)} |
| **TOTAL CHARGES** | **${fmtXAF(totalCh)}** |

---

## PRODUITS

| Poste | Montant |
|---|---|
| Ventes (701-707) | ${fmtXAF(ventes)} |
| Subventions (731, 741) | ${fmtXAF(subv)} |
| Produits financiers (771, 772) | ${fmtXAF(prodFin)} |
| Reprises de provisions (781) | ${fmtXAF(reprises)} |
| **TOTAL PRODUITS** | **${fmtXAF(totalProd)}** |

---

| | Montant |
|---|---|
| **${resultat >= 0 ? 'BÉNÉFICE NET' : 'PERTE NETTE'}** | **${fmtXAF(Math.abs(resultat))}** |
`;
}

function generateTAFIRE(journal, periode) {
  const label = periode || journal.exercice;
  const soldes = calcSoldes(journal.ecritures, periode);

  const prodEncaisses  = sumCredit(soldes, ['701','702','706']);
  const achatsDecais   = sumDebit(soldes,  ['601','602']);
  const personnelDecais= sumDebit(soldes,  ['641','642','643','644']);
  const impotsDec      = sumCredit(soldes, ['4431','4441','4444','4445']);
  const fluxOp         = prodEncaisses - achatsDecais - personnelDecais;

  const acquisImmo     = sumDebit(soldes,  ['21','22','23','24','25','26']);
  const fluxInvest     = -acquisImmo;

  const emprunts       = sumCredit(soldes, ['161','162']);
  const rembours       = sumDebit(soldes,  ['161','162']);
  const fluxFin        = emprunts - rembours;

  const varTresorerie  = fluxOp + fluxInvest + fluxFin;

  return `# TAFIRE — ${label}
*Tableau Financier des Ressources et des Emplois | SYSCOHADA 2017*
*Généré le ${new Date().toLocaleDateString('fr-FR')}*

> ⚠️ TAFIRE simplifié — basé sur les flux du journal de l'exercice. Pour un TAFIRE certifié, compléter avec les soldes d'ouverture.

---

## I. FLUX DES ACTIVITÉS OPÉRATIONNELLES

| Flux | Montant |
|---|---|
| Produits encaissés — ventes (701-706) | ${fmtXAF(prodEncaisses)} |
| Achats décaissés (601-602) | (${fmtXAF(achatsDecais)}) |
| Charges de personnel décaissées (641-644) | (${fmtXAF(personnelDecais)}) |
| **Flux net opérationnel** | **${fmtXAF(fluxOp)}** |

---

## II. FLUX DES ACTIVITÉS D'INVESTISSEMENT

| Flux | Montant |
|---|---|
| Acquisitions d'immobilisations (21-26) | (${fmtXAF(acquisImmo)}) |
| **Flux net investissement** | **${fmtXAF(fluxInvest)}** |

---

## III. FLUX DES ACTIVITÉS DE FINANCEMENT

| Flux | Montant |
|---|---|
| Nouveaux emprunts (161-162) | ${fmtXAF(emprunts)} |
| Remboursements d'emprunts (161-162) | (${fmtXAF(rembours)}) |
| **Flux net financement** | **${fmtXAF(fluxFin)}** |

---

| | Montant |
|---|---|
| **VARIATION NETTE DE TRÉSORERIE** | **${fmtXAF(varTresorerie)}** |
`;
}

const [,, cmd, arg] = process.argv;

if (!cmd || !['bilan','resultat','tafire'].includes(cmd)) {
  process.stderr.write('Usage: node scripts/etats.js <bilan|resultat|tafire> [periode]\n');
  process.stderr.write('  periode: 2026 (annuel) | 2026-05 (mensuel)\n');
  process.exit(1);
}

ensureDir(ETATS_DIR);
const journal = loadJournal();
const periode = arg || null;
const label = (periode || journal.exercice).replace('/', '-');

let content, filename;
switch (cmd) {
  case 'bilan':
    content = generateBilan(journal, periode);
    filename = `bilan-${label}.md`;
    break;
  case 'resultat':
    content = generateResultat(journal, periode);
    filename = `resultat-${label}.md`;
    break;
  case 'tafire':
    content = generateTAFIRE(journal, periode);
    filename = `tafire-${label}.md`;
    break;
}

const outPath = path.join(ETATS_DIR, filename);
fs.writeFileSync(outPath, content, 'utf8');
process.stdout.write(`✅ État généré : ${outPath}\n\n`);
process.stdout.write(content);
```

- [ ] **Step 3 : Générer le bilan de test**

```bash
node scripts/etats.js bilan 2026-05
```

Expected : bilan affiché en Markdown avec TOTAL ACTIF = TOTAL PASSIF (ou écart signalé), fichier créé dans `data/etats/bilan-2026-05.md`

- [ ] **Step 4 : Générer le compte de résultat**

```bash
node scripts/etats.js resultat 2026-05
```

Expected : compte de résultat avec les ventes, achats et charges de personnel visibles.

- [ ] **Step 5 : Générer le TAFIRE**

```bash
node scripts/etats.js tafire 2026-05
```

Expected : TAFIRE avec flux opérationnel positif (ventes > achats + salaires dans notre test).

- [ ] **Step 6 : Vérifier que les fichiers sont créés**

```bash
ls data/etats/
```

Expected : `bilan-2026-05.md  resultat-2026-05.md  tafire-2026-05.md`

- [ ] **Step 7 : Commit**

```bash
git add scripts/etats.js data/etats/
git commit -m "feat(v1.1): add etats.js (bilan, compte de résultat, TAFIRE)"
```

---

## Task 5 : `templates/base.html` + `scripts/pdf.js`

**Files:**
- Create: `templates/base.html`
- Create: `scripts/pdf.js`

- [ ] **Step 1 : Installer Puppeteer**

```bash
npm install
```

Expected : `node_modules/puppeteer/` créé, Chromium téléchargé (~170 MB, peut prendre 2-3 minutes)

- [ ] **Step 2 : Créer `templates/base.html`**

```html
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<style>
  body {
    font-family: Arial, sans-serif;
    font-size: 11px;
    margin: 0;
    color: #222;
    line-height: 1.5;
  }
  h1 {
    font-size: 18px;
    border-bottom: 2px solid #1a1a2e;
    padding-bottom: 8px;
    color: #1a1a2e;
  }
  h2 {
    font-size: 13px;
    background: #1a1a2e;
    color: white;
    padding: 6px 12px;
    margin-top: 20px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  h3 { font-size: 12px; color: #444; }
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 10px 0;
  }
  th {
    background: #f0f0f0;
    padding: 6px 10px;
    text-align: left;
    border: 1px solid #ccc;
    font-weight: bold;
  }
  td {
    padding: 5px 10px;
    border-bottom: 1px solid #e0e0e0;
  }
  tr:last-child td { font-weight: bold; background: #f9f9f9; }
  em { color: #777; font-size: 10px; }
  blockquote {
    background: #fff8e1;
    border-left: 4px solid #f9a825;
    padding: 8px 14px;
    margin: 12px 0;
    font-size: 10px;
    color: #555;
  }
  hr { border: none; border-top: 1px solid #ddd; margin: 14px 0; }
  p { margin: 6px 0; }
</style>
</head>
<body>
{{CONTENT}}
</body>
</html>
```

- [ ] **Step 3 : Créer `scripts/pdf.js`**

```javascript
'use strict';

const fs = require('fs');
const path = require('path');

function mdToHtml(md) {
  let html = md
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
    .replace(/^---$/gm, '<hr>');

  // Tables markdown → HTML
  const lines = html.split('\n');
  const result = [];
  let inTable = false;
  let isFirstRow = true;

  for (const line of lines) {
    if (line.startsWith('|')) {
      if (line.match(/^\|[-:| ]+\|$/)) {
        isFirstRow = false;
        continue;
      }
      if (!inTable) { result.push('<table>'); inTable = true; isFirstRow = true; }
      const cells = line.split('|').filter(c => c.trim());
      const tag = isFirstRow ? 'th' : 'td';
      result.push(`<tr>${cells.map(c => `<${tag}>${c.trim()}</${tag}>`).join('')}</tr>`);
      if (isFirstRow) isFirstRow = false;
    } else {
      if (inTable) { result.push('</table>'); inTable = false; isFirstRow = true; }
      result.push(line ? `<p>${line}</p>` : '');
    }
  }
  if (inTable) result.push('</table>');

  return result.join('\n');
}

async function generatePDF(mdFile) {
  const puppeteer = require('puppeteer');
  const templatePath = path.join(__dirname, '../templates/base.html');

  if (!fs.existsSync(mdFile)) {
    process.stderr.write(`❌ Fichier introuvable : ${mdFile}\n`);
    process.exit(1);
  }
  if (!fs.existsSync(templatePath)) {
    process.stderr.write(`❌ Template introuvable : ${templatePath}\n`);
    process.exit(1);
  }

  const mdContent = fs.readFileSync(mdFile, 'utf8');
  const template = fs.readFileSync(templatePath, 'utf8');
  const bodyHtml = mdToHtml(mdContent);
  const fullHtml = template.replace('{{CONTENT}}', bodyHtml);

  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setContent(fullHtml, { waitUntil: 'networkidle0' });

  const pdfPath = mdFile.replace(/\.md$/, '.pdf');
  await page.pdf({
    path: pdfPath,
    format: 'A4',
    margin: { top: '1.5cm', bottom: '1.5cm', left: '1.5cm', right: '1.5cm' },
    printBackground: true
  });
  await browser.close();

  process.stdout.write(`✅ PDF généré : ${pdfPath}\n`);
}

const [,, mdFile] = process.argv;
if (!mdFile) {
  process.stderr.write('Usage: node scripts/pdf.js <fichier.md>\n');
  process.exit(1);
}

generatePDF(mdFile).catch(err => {
  process.stderr.write(`❌ Erreur PDF : ${err.message}\n`);
  process.exit(1);
});
```

- [ ] **Step 4 : Tester la génération PDF**

```bash
node scripts/pdf.js data/etats/bilan-2026-05.md
```

Expected:
```
✅ PDF généré : data/etats/bilan-2026-05.pdf
```

Vérifier que le fichier existe :
```bash
ls -lh data/etats/bilan-2026-05.pdf
```

Expected : fichier PDF > 10 KB

- [ ] **Step 5 : Ajouter node_modules au .gitignore**

Vérifier que `.gitignore` contient `node_modules/` (il le contient déjà depuis la Task 1 de v1.0). Si non, l'ajouter.

```bash
grep "node_modules" .gitignore && echo "✅ déjà ignoré" || echo "node_modules/" >> .gitignore
```

- [ ] **Step 6 : Commit**

```bash
git add templates/base.html scripts/pdf.js package-lock.json
git commit -m "feat(v1.1): add pdf.js (Markdown to PDF via Puppeteer) and base.html template"
```

---

## Task 6 : Mise à jour `comptable/SKILL.md`

**Files:**
- Modify: `comptable/SKILL.md`

- [ ] **Step 1 : Lire le fichier SKILL.md actuel**

Lire `comptable/SKILL.md` et identifier la section `## Fiches de Référence Disponibles`.

- [ ] **Step 2 : Insérer le bloc "Journal Comptable" après la section "Fiches de Référence"**

Ajouter ce bloc immédiatement après la liste des références :

```markdown

---

## Journal Comptable

Le journal comptable persistant est stocké dans `data/journal.json`. Il contient toutes les écritures de l'exercice.

### Avant de répondre à toute question comptable
Vérifie si `data/journal.json` existe. Si oui, lis son contenu pour connaître l'état comptable actuel de l'entreprise.

### Après chaque écriture validée
Dès qu'une écriture est confirmée par l'utilisateur, enregistre-la immédiatement :

```bash
node scripts/journal.js add '<json_ecriture>'
```

Le JSON à passer doit respecter ce format :
```json
{
  "date": "YYYY-MM-DD",
  "libelle": "Description de l'opération",
  "piece": "Référence pièce justificative",
  "type": "vente|achat|salaire|tresorerie|immobilisation|fiscalite|divers",
  "lignes": [
    { "compte": "521", "libelle": "Banques", "debit": 500000, "credit": 0 },
    { "compte": "701", "libelle": "Ventes", "debit": 0, "credit": 500000 }
  ]
}
```

Après `add`, confirme à l'utilisateur : **ID de l'écriture** + solde du compte principal concerné.

### Pour corriger une erreur
```bash
node scripts/journal.js delete <ID>
```
Puis re-saisir l'écriture corrigée.

### Pour consulter les écritures
```bash
node scripts/journal.js list                        # toutes
node scripts/journal.js list --from 2026-05-01 --to 2026-05-31  # par période
node scripts/journal.js list --type vente           # par type
node scripts/journal.js list --compte 411           # par compte
```

### Import de relevé bancaire
```bash
node scripts/import-csv.js releve-mai.csv
```
Les écritures importées ont `equilibre: false` et un compte `"?????"` à compléter. Demande à l'utilisateur le contre-compte pour chaque ligne, puis mets à jour via delete + add.

### Avertissement écritures incomplètes
Si des écritures `equilibre: false` existent dans le journal, signale-le avant de générer des états financiers.
```

- [ ] **Step 3 : Insérer le bloc "États Financiers" après le bloc "Journal Comptable"**

```markdown

---

## Génération des États Financiers

### Sur demande de bilan ou compte de résultat

Exécuter selon la demande :

```bash
# Bilan annuel
node scripts/etats.js bilan 2026

# Bilan d'une période
node scripts/etats.js bilan 2026-05

# Compte de résultat
node scripts/etats.js resultat 2026-05

# TAFIRE annuel
node scripts/etats.js tafire 2026
```

Le Markdown généré est affiché directement dans la conversation. Les fichiers sont aussi sauvegardés dans `data/etats/`.

### Sur demande d'export PDF

```bash
node scripts/pdf.js data/etats/bilan-2026-05.md
# → data/etats/bilan-2026-05.pdf
```

Indique à l'utilisateur le chemin du PDF généré.

### Avant toute génération d'état
Vérifier les écritures incomplètes :
```bash
node scripts/journal.js list | python3 -c "import json,sys; e=[x for x in json.load(sys.stdin) if not x['equilibre']]; print(f'⚠️ {len(e)} écriture(s) incomplète(s)') if e else print('✅ Toutes les écritures sont équilibrées')"
```
```

- [ ] **Step 4 : Vérifier que les deux blocs sont présents**

```bash
grep -c "Journal Comptable\|États Financiers" comptable/SKILL.md
```

Expected: `2`

- [ ] **Step 5 : Commit**

```bash
git add comptable/SKILL.md
git commit -m "feat(v1.1): update SKILL.md with journal and financial statements blocks"
```

---

## Task 7 : Test d'intégration end-to-end + push

**Files:** aucun nouveau fichier

- [ ] **Step 1 : Réinitialiser le journal pour le test**

```bash
echo '{"exercice":"2026","entreprise":"Société Test SARL","ecritures":[]}' > data/journal.json
```

- [ ] **Step 2 : Saisir 3 écritures via l'agent (simulation)**

```bash
node scripts/journal.js add '{"date":"2026-05-01","libelle":"Apport capital","piece":"ACTE-001","type":"tresorerie","lignes":[{"compte":"521","libelle":"Banques","debit":2000000,"credit":0},{"compte":"101","libelle":"Capital social","debit":0,"credit":2000000}]}'

node scripts/journal.js add '{"date":"2026-05-10","libelle":"Vente marchandises F2026-001","piece":"F2026-001","type":"vente","lignes":[{"compte":"411","libelle":"Client","debit":236000,"credit":0},{"compte":"701","libelle":"Ventes","debit":0,"credit":200000},{"compte":"4431","libelle":"TVA 18%","debit":0,"credit":36000}]}'

node scripts/journal.js add '{"date":"2026-05-15","libelle":"Achat fournitures","piece":"FA-001","type":"achat","lignes":[{"compte":"605","libelle":"Fournitures bureau","debit":50000,"credit":0},{"compte":"4433","libelle":"TVA déductible","debit":9000,"credit":0},{"compte":"401","libelle":"Fournisseur","debit":0,"credit":59000}]}'
```

- [ ] **Step 3 : Vérifier le journal**

```bash
node scripts/journal.js list | python3 -c "import json,sys; e=json.load(sys.stdin); print(f'{len(e)} écritures'); [print(f'  {x[\"id\"]} | {x[\"date\"]} | {x[\"libelle\"]} | équilibre={x[\"equilibre\"]}') for x in e]"
```

Expected: 3 écritures, toutes `equilibre=True`

- [ ] **Step 4 : Générer le bilan**

```bash
node scripts/etats.js bilan 2026-05
```

Expected : bilan équilibré affiché, fichier `data/etats/bilan-2026-05.md` créé

- [ ] **Step 5 : Générer le compte de résultat**

```bash
node scripts/etats.js resultat 2026-05
```

Expected : ventes = 200 000 XAF, achats fournitures = 50 000 XAF

- [ ] **Step 6 : Générer le PDF**

```bash
node scripts/pdf.js data/etats/bilan-2026-05.md
```

Expected : `✅ PDF généré : data/etats/bilan-2026-05.pdf`

```bash
ls -lh data/etats/bilan-2026-05.pdf
```

Expected : fichier > 15 KB

- [ ] **Step 7 : Réinitialiser le journal (remettre vide pour production)**

```bash
echo '{"exercice":"2026","entreprise":"","ecritures":[]}' > data/journal.json
```

- [ ] **Step 8 : Ajouter data/etats/*.md et *.pdf au .gitignore**

Les états générés ne doivent pas être versionnés (données comptables privées) :

Lire `.gitignore` puis ajouter :

```
data/etats/*.md
data/etats/*.pdf
node_modules/
```

- [ ] **Step 9 : Tag v1.1.0 et push**

```bash
git add .gitignore data/journal.json
git commit -m "feat(v1.1): integration test complete, reset journal, ignore generated states"
git tag -a v1.1.0 -m "wach-ohada v1.1.0 — journal comptable + états financiers + PDF"
git push && git push --tags
```

Expected: push réussi sur `github.com/wach235/wach-ohada`
