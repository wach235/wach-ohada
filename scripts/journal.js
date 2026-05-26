'use strict';

const fs = require('fs');
const path = require('path');

const JOURNAL_PATH = path.join(__dirname, '../data/journal.json');

function loadJournal() {
  if (!fs.existsSync(JOURNAL_PATH)) {
    return { exercice: new Date().getFullYear().toString(), entreprise: '', ecritures: [] };
  }
  let raw;
  try {
    raw = fs.readFileSync(JOURNAL_PATH, 'utf8');
  } catch (err) {
    process.stderr.write(JSON.stringify({ status: 'error', message: `Impossible de lire le journal: ${err.message}` }) + '\n');
    process.exit(1);
  }
  try {
    return JSON.parse(raw);
  } catch (err) {
    process.stderr.write(JSON.stringify({ status: 'error', message: `Journal corrompu (JSON invalide): ${err.message}` }) + '\n');
    process.exit(1);
  }
}

function saveJournal(journal) {
  try {
    fs.writeFileSync(JOURNAL_PATH, JSON.stringify(journal, null, 2), 'utf8');
  } catch (err) {
    process.stderr.write(JSON.stringify({ status: 'error', message: `Impossible d'écrire le journal: ${err.message}` }) + '\n');
    process.exit(1);
  }
}

function nextId(journal) {
  const year = journal.exercice;
  const re = /^ECR-\d{4}-(\d+)$/;
  let maxN = 0;
  for (const e of journal.ecritures) {
    const m = re.exec(e.id);
    if (m) {
      const n = parseInt(m[1], 10);
      if (n > maxN) maxN = n;
    }
  }
  return `ECR-${year}-${String(maxN + 1).padStart(4, '0')}`;
}

function cmdAdd(args) {
  const journal = loadJournal();
  let data;
  try {
    data = JSON.parse(args[0]);
  } catch (err) {
    process.stderr.write(JSON.stringify({ status: 'error', message: `JSON invalide en entrée: ${err.message}` }) + '\n');
    process.exit(1);
  }

  // Validate required fields
  if (!data.date || typeof data.date !== 'string') {
    process.stderr.write(JSON.stringify({ status: 'error', message: 'Champ requis manquant ou invalide: date (string attendue)' }) + '\n');
    process.exit(1);
  }
  if (!data.libelle || typeof data.libelle !== 'string') {
    process.stderr.write(JSON.stringify({ status: 'error', message: 'Champ requis manquant ou invalide: libelle (string attendue)' }) + '\n');
    process.exit(1);
  }
  if (!Array.isArray(data.lignes) || data.lignes.length === 0) {
    process.stderr.write(JSON.stringify({ status: 'error', message: 'Champ requis manquant ou invalide: lignes (tableau non vide attendu)' }) + '\n');
    process.exit(1);
  }
  for (let i = 0; i < data.lignes.length; i++) {
    const l = data.lignes[i];
    if (l.debit !== undefined && typeof l.debit !== 'number') {
      process.stderr.write(JSON.stringify({ status: 'error', message: `lignes[${i}].debit doit être un nombre` }) + '\n');
      process.exit(1);
    }
    if (l.credit !== undefined && typeof l.credit !== 'number') {
      process.stderr.write(JSON.stringify({ status: 'error', message: `lignes[${i}].credit doit être un nombre` }) + '\n');
      process.exit(1);
    }
  }

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

  if (fromIdx !== -1) {
    if (fromIdx + 1 >= args.length) {
      process.stderr.write(JSON.stringify({ status: 'error', message: 'Option --from requiert une valeur' }) + '\n');
      process.exit(1);
    }
    ecritures = ecritures.filter(e => e.date >= args[fromIdx + 1]);
  }
  if (toIdx !== -1) {
    if (toIdx + 1 >= args.length) {
      process.stderr.write(JSON.stringify({ status: 'error', message: 'Option --to requiert une valeur' }) + '\n');
      process.exit(1);
    }
    ecritures = ecritures.filter(e => e.date <= args[toIdx + 1]);
  }
  if (compteIdx !== -1) {
    if (compteIdx + 1 >= args.length) {
      process.stderr.write(JSON.stringify({ status: 'error', message: 'Option --compte requiert une valeur' }) + '\n');
      process.exit(1);
    }
    const c = args[compteIdx + 1];
    ecritures = ecritures.filter(e => e.lignes.some(l => l.compte === c));
  }
  if (typeIdx !== -1) {
    if (typeIdx + 1 >= args.length) {
      process.stderr.write(JSON.stringify({ status: 'error', message: 'Option --type requiert une valeur' }) + '\n');
      process.exit(1);
    }
    ecritures = ecritures.filter(e => e.type === args[typeIdx + 1]);
  }

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
