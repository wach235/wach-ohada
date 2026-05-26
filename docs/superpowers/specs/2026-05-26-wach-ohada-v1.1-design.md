# wach-ohada v1.1 — Design Spec
**Date :** 2026-05-26
**Statut :** Approuvé

---

## 1. Objectif

Ajouter une couche de **données persistantes et de génération d'états financiers** à wach-ohada. L'agent IA devient autonome : il tient le journal comptable, génère le bilan, le compte de résultat et le TAFIRE, et exporte en PDF — sans que l'utilisateur quitte la conversation.

---

## 2. Architecture

Fichiers ajoutés ou modifiés :

```
wach-ohada/
├── comptable/
│   └── SKILL.md              ← mis à jour (blocs Journal + États financiers)
├── data/
│   └── journal.json          ← NOUVEAU — livre des écritures persistant
├── scripts/
│   ├── journal.js            ← NOUVEAU — add / list / delete écritures
│   ├── import-csv.js         ← NOUVEAU — import relevé bancaire CSV
│   ├── etats.js              ← NOUVEAU — bilan + compte résultat + TAFIRE → Markdown
│   └── pdf.js                ← NOUVEAU — Markdown → PDF via template HTML
├── templates/
│   ├── bilan.html            ← NOUVEAU — template HTML bilan SYSCOHADA
│   └── compte-resultat.html  ← NOUVEAU — template HTML compte de résultat
└── package.json              ← mis à jour (puppeteer + scripts npm)
```

**Flux utilisateur :**
1. L'utilisateur parle à l'agent : *"enregistre la vente de 500 000 XAF TTC"*
2. L'agent génère l'écriture SYSCOHADA → appelle `node scripts/journal.js add <json>`
3. L'agent confirme l'enregistrement + affiche l'ID de l'écriture
4. *"génère le bilan de mai 2026"* → `node scripts/etats.js bilan 2026-05` → Markdown affiché
5. *"exporte en PDF"* → `node scripts/pdf.js bilan-2026-05.md` → `bilan-2026-05.pdf`

---

## 3. Schéma `data/journal.json`

```json
{
  "exercice": "2026",
  "entreprise": "Société de Commerce Général SARL",
  "ecritures": [
    {
      "id": "ECR-2026-0001",
      "date": "2026-05-23",
      "libelle": "Vente de marchandises — Facture F2026-001",
      "piece": "F2026-001",
      "type": "vente",
      "lignes": [
        { "compte": "521", "libelle": "Banques", "debit": 500000, "credit": 0 },
        { "compte": "701", "libelle": "Ventes de marchandises", "debit": 0, "credit": 423729 },
        { "compte": "4431", "libelle": "TVA collectée 18%", "debit": 0, "credit": 76271 }
      ],
      "total_debit": 500000,
      "total_credit": 500000,
      "equilibre": true,
      "source": "agent"
    }
  ]
}
```

**Règles :**
- `id` : auto-incrémenté `ECR-YYYY-NNNN`
- `equilibre` : vérifié avant toute sauvegarde — une écriture déséquilibrée est rejetée
- `source` : `"agent"` (saisie IA) | `"import"` (CSV bancaire)
- `type` : `vente` | `achat` | `salaire` | `tresorerie` | `immobilisation` | `fiscalite` | `divers`

---

## 4. Scripts

### `scripts/journal.js`

Trois sous-commandes :

```bash
# Ajouter une écriture (JSON passé en argument ou stdin)
node scripts/journal.js add '{"date":"2026-05-23","libelle":"...","lignes":[...]}'

# Lister les écritures (options: --from, --to, --compte, --type)
node scripts/journal.js list --from 2026-05-01 --to 2026-05-31
node scripts/journal.js list --compte 521
node scripts/journal.js list --type vente

# Supprimer une écriture par ID
node scripts/journal.js delete ECR-2026-0001
```

Sorties :
- `add` → `{ "id": "ECR-2026-0001", "status": "ok" }`
- `list` → tableau JSON des écritures filtrées
- `delete` → `{ "id": "ECR-2026-0001", "status": "deleted" }`

### `scripts/import-csv.js`

```bash
node scripts/import-csv.js releve-mai.csv [--banque cbmt|boa|sgb]
```

- Détecte les colonnes date / libellé / débit / crédit
- Génère des écritures avec `compte: "521"` (banque) et `compte: "?????"` (à confirmer)
- `source: "import"`, `equilibre: false` tant que le contre-compte n'est pas renseigné
- Affiche un résumé : N écritures importées, M à compléter

### `scripts/etats.js`

```bash
node scripts/etats.js bilan 2026           # bilan annuel
node scripts/etats.js bilan 2026-05        # bilan arrêté au 31/05/2026
node scripts/etats.js resultat 2026        # compte de résultat annuel
node scripts/etats.js resultat 2026-05     # compte de résultat mai 2026
node scripts/etats.js tafire 2026          # TAFIRE annuel
```

Logique :
- Agrège les soldes par compte depuis `data/journal.json`
- Structure SYSCOHADA : actif (cl. 2+3+4+5) / passif (cl. 1+4) pour le bilan
- Charges (cl. 6) / produits (cl. 7) pour le compte de résultat
- Écrit le fichier Markdown dans `data/etats/`

### `scripts/pdf.js`

```bash
node scripts/pdf.js data/etats/bilan-2026.md
# → data/etats/bilan-2026.pdf
```

- Utilise **Puppeteer** (Chromium headless) pour convertir HTML → PDF
- Applique le template `templates/bilan.html` ou `templates/compte-resultat.html`
- En-tête : nom entreprise, NIF, RCCM, exercice, date de génération
- Format A4, marges standards

---

## 5. Mise à jour `SKILL.md`

Deux nouveaux blocs insérés après le bloc "Fiches de Référence" :

**Bloc "Journal Comptable" :**
- Au début de chaque session, vérifier si `data/journal.json` existe
- Après chaque écriture validée, appeler `journal.js add`
- Confirmer à l'utilisateur : ID de l'écriture + solde du compte principal
- Pour corriger une erreur : `journal.js delete <id>` puis re-saisie

**Bloc "États Financiers" :**
- Sur demande de bilan/compte de résultat : exécuter `etats.js`
- Afficher le Markdown directement dans la conversation
- Sur demande PDF : exécuter `pdf.js` et indiquer le chemin du fichier généré
- Avertir si des écritures `equilibre: false` existent (imports CSV non complétés)

---

## 6. Dépendances

```json
"dependencies": {
  "puppeteer": "^22.0.0"
}
```

Puppeteer télécharge Chromium (~170 MB) lors du premier `npm install`. C'est la seule dépendance externe ajoutée.

---

## 7. Périmètre v1.1

**Dans le scope :**
- [ ] `data/journal.json` (schéma + fichier initial vide)
- [ ] `scripts/journal.js` (add / list / delete)
- [ ] `scripts/import-csv.js` (import relevé bancaire)
- [ ] `scripts/etats.js` (bilan + compte de résultat + TAFIRE simplifié)
- [ ] `scripts/pdf.js` (Markdown → PDF via Puppeteer)
- [ ] `templates/bilan.html`
- [ ] `templates/compte-resultat.html`
- [ ] Mise à jour `comptable/SKILL.md`
- [ ] Mise à jour `package.json`

**Hors scope v1.1 :**
- Interface web
- Synchronisation bancaire automatique (API)
- Déclarations DGI pré-remplies (v2.0)
- Multi-exercices (le journal est mono-année)
