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
