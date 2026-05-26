'use strict';

const fs = require('fs');
const path = require('path');

const JOURNAL_PATH = path.join(__dirname, '../data/journal.json');

function loadJournal() {
  if (!fs.existsSync(JOURNAL_PATH)) {
    return { exercice: new Date().getFullYear().toString(), entreprise: '', ecritures: [] };
  }
  try {
    return JSON.parse(fs.readFileSync(JOURNAL_PATH, 'utf8'));
  } catch (e) {
    process.stderr.write(`❌ Erreur lecture journal: ${e.message}\n`);
    process.exit(1);
  }
}

function saveJournal(journal) {
  try {
    fs.writeFileSync(JOURNAL_PATH, JSON.stringify(journal, null, 2), 'utf8');
  } catch (e) {
    process.stderr.write(`❌ Erreur sauvegarde journal: ${e.message}\n`);
    process.exit(1);
  }
}

function nextId(journal) {
  const year = journal.exercice;
  let maxN = 0;
  for (const e of journal.ecritures) {
    const m = e.id && e.id.match(/^ECR-\d{4}-(\d+)$/);
    if (m) maxN = Math.max(maxN, parseInt(m[1], 10));
  }
  return `ECR-${year}-${String(maxN + 1).padStart(4, '0')}`;
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
