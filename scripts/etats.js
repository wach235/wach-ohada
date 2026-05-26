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
  try {
    return JSON.parse(fs.readFileSync(JOURNAL_PATH, 'utf8'));
  } catch (e) {
    process.stderr.write(`❌ Erreur lecture journal: ${e.message}\n`);
    process.exit(1);
  }
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function calcSoldes(ecritures, periode) {
  const soldes = {};
  for (const e of ecritures) {
    if (!e.equilibre) continue;
    if (periode) {
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

  // Résultat de l'exercice calculé dynamiquement depuis les comptes 6 et 7
  const chargesEx = sumDebit(soldes, ['601','602','604','605','611','612','621','622','623','624','625','626','628','631','641','642','643','644','661','671','681','691']);
  const produitsEx = sumCredit(soldes, ['701','702','703','704','705','706','707','731','741','771','772','781']);
  const resultatEx = produitsEx - chargesEx;

  const capital     = sumCredit(soldes, ['101']);
  const reserves    = sumCredit(soldes, ['111','118']);
  const report      = sumCredit(soldes, ['12']) - sumDebit(soldes, ['129']);
  const cpropres    = capital + reserves + report + resultatEx;
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
| Résultat de l'exercice | ${fmtXAF(resultatEx)} |
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
try {
  fs.writeFileSync(outPath, content, 'utf8');
} catch (e) {
  process.stderr.write(`❌ Erreur écriture fichier: ${e.message}\n`);
  process.exit(1);
}
process.stdout.write(`✅ État généré : ${outPath}\n\n`);
process.stdout.write(content);
