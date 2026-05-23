# wach-ohada — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Créer le skill comptable SYSCOHADA pour le Tchad — un fichier SKILL.md opérationnel avec son écosystème de données (profil fiscal, plan comptable, références), distribuable en freemium open-source.

**Architecture:** Structure modulaire où le SKILL.md charge dynamiquement un profil pays (chad.json), rendant le skill extensible à tout pays OHADA sans modifier le core. Les données fiscales et le plan comptable sont externalisées en JSON pour faciliter les mises à jour.

**Tech Stack:** Markdown (skills), JSON (données), Bash (validation JSON), Node.js optionnel (scripts futurs)

---

## Carte des fichiers

| Fichier | Rôle |
|---|---|
| `package.json` | Métadonnées projet npm |
| `.gitignore` | Exclusions git |
| `comptable/SKILL.md` | **Core — skill principal** |
| `comptable/company.example.json` | Modèle profil entreprise tchadienne |
| `comptable/profiles/chad.json` | Taux fiscaux + calendrier DGI Tchad |
| `comptable/references/tva.md` | Fiche de référence TVA |
| `comptable/references/is.md` | Fiche de référence IS |
| `comptable/references/irpp-salaires.md` | Fiche de référence IRPP |
| `comptable/references/cnps.md` | Fiche de référence CNPS |
| `comptable/references/syscohada-etats-financiers.md` | Fiche états financiers |
| `data/syscohada/plan-comptable.json` | Plan comptable SYSCOHADA (9 classes) |
| `marketplace.json` | Métadonnées distribution agentskill |
| `README.md` | Documentation bilingue FR/EN |

---

## Task 1 : Scaffolding du projet

**Files:**
- Create: `package.json`
- Create: `.gitignore`
- Create: répertoires `comptable/profiles/`, `comptable/references/`, `data/syscohada/`

- [ ] **Step 1 : Créer les répertoires**

```bash
mkdir -p comptable/profiles comptable/references comptable/evals data/syscohada scripts templates
```

Expected: aucune erreur, répertoires créés.

- [ ] **Step 2 : Créer `package.json`**

```json
{
  "name": "wach-ohada",
  "version": "1.0.0",
  "description": "Skills IA pour la comptabilité SYSCOHADA et la fiscalité OHADA — Tchad et zone CEMAC",
  "keywords": ["ohada", "syscohada", "comptabilité", "fiscalité", "tchad", "cemac", "ai-skill"],
  "author": "wach",
  "license": "MIT",
  "homepage": "https://github.com/wach/wach-ohada",
  "repository": {
    "type": "git",
    "url": "https://github.com/wach/wach-ohada.git"
  }
}
```

- [ ] **Step 3 : Créer `.gitignore`**

```
node_modules/
.env
*.local
.DS_Store
company.json
```

- [ ] **Step 4 : Commit**

```bash
git add package.json .gitignore comptable/ data/ scripts/ templates/
git commit -m "feat: scaffold wach-ohada project structure"
```

---

## Task 2 : Profil fiscal Tchad (`profiles/chad.json`)

**Files:**
- Create: `comptable/profiles/chad.json`

- [ ] **Step 1 : Créer `comptable/profiles/chad.json`**

```json
{
  "pays": "Tchad",
  "iso": "TD",
  "autorite_fiscale": "DGI",
  "monnaie": "XAF",
  "zone": "CEMAC",
  "referentiel_comptable": "SYSCOHADA-2017",
  "taux": {
    "is": 0.35,
    "tva_standard": 0.18,
    "tva_reduit": 0.09,
    "tva_export": 0.00,
    "irpp": 0.30,
    "plus_values": 0.20,
    "patente": 0.0035,
    "cnps_employeur_retraite": 0.165,
    "cnps_salarie": 0.035,
    "taxe_salaires_employeur": 0.075,
    "foncier_bati_ndjamena": 0.10,
    "foncier_bati_autres": 0.08,
    "foncier_non_bati_ndjamena": 0.21,
    "foncier_non_bati_autres": 0.20,
    "retenue_dividendes_residents": 0.20,
    "retenue_dividendes_cemac": 0.05,
    "retenue_dividendes_hors_cemac": 0.20,
    "retenue_interets_cemac": 0.05,
    "retenue_interets_hors_cemac": 0.25,
    "retenue_redevances_cemac": 0.075,
    "retenue_redevances_hors_cemac": 0.25
  },
  "echeances": {
    "tva": { "frequence": "mensuelle", "jour": 15, "description": "15 du mois suivant la période" },
    "irpp_salaires": { "frequence": "mensuelle", "jour": 15, "description": "15 du mois suivant le paiement des salaires" },
    "is_declaration": { "frequence": "annuelle", "mois": 4, "jour": 30, "description": "30 avril de l'année suivante" },
    "is_acompte_1": { "frequence": "annuelle", "mois": 5, "jour": 15, "description": "15 mai — 1/3 de l'IS estimé" },
    "is_acompte_2": { "frequence": "annuelle", "mois": 8, "jour": 15, "description": "15 août — 1/3 de l'IS estimé" },
    "is_acompte_3": { "frequence": "annuelle", "mois": 11, "jour": 15, "description": "15 novembre — 1/3 de l'IS estimé" },
    "patente": { "frequence": "annuelle", "mois": 12, "jour": 31, "description": "31 décembre — 0,35% du CA N-1" },
    "cnps": { "frequence": "mensuelle", "description": "Fin du mois courant" }
  },
  "seuils_syscohada": {
    "systeme_normal_min_ca": 100000000,
    "systeme_allege_min_ca": 30000000,
    "systeme_minimal_tresorerie_max_ca": 30000000
  },
  "droits_enregistrement": {
    "cession_fonds_commerce": 0.05,
    "apport_en_societe": 0.03,
    "mutation_immobiliere": 0.10
  }
}
```

- [ ] **Step 2 : Valider le JSON**

```bash
python3 -m json.tool comptable/profiles/chad.json > /dev/null && echo "✅ chad.json valide" || echo "❌ Erreur JSON"
```

Expected: `✅ chad.json valide`

- [ ] **Step 3 : Commit**

```bash
git add comptable/profiles/chad.json
git commit -m "feat: add Chad fiscal profile (DGI rates, deadlines, CEMAC zone)"
```

---

## Task 3 : Plan comptable SYSCOHADA (`data/syscohada/plan-comptable.json`)

**Files:**
- Create: `data/syscohada/plan-comptable.json`

- [ ] **Step 1 : Créer `data/syscohada/plan-comptable.json`**

```json
{
  "version": "SYSCOHADA-2017",
  "acte_uniforme": "26 janvier 2017",
  "classes": [
    {
      "numero": 1,
      "nom": "Comptes de ressources durables",
      "description": "Capitaux propres, dettes financières et ressources assimilées",
      "comptes": [
        { "numero": "101", "nom": "Capital social" },
        { "numero": "111", "nom": "Réserve légale" },
        { "numero": "118", "nom": "Autres réserves" },
        { "numero": "129", "nom": "Report à nouveau (solde débiteur)" },
        { "numero": "131", "nom": "Résultat net : bénéfice" },
        { "numero": "139", "nom": "Résultat net : perte" },
        { "numero": "161", "nom": "Emprunts auprès des établissements de crédit" },
        { "numero": "162", "nom": "Emprunts obligataires" },
        { "numero": "181", "nom": "Dettes de location-acquisition" }
      ]
    },
    {
      "numero": 2,
      "nom": "Comptes d'actif immobilisé",
      "description": "Immobilisations incorporelles, corporelles et financières",
      "comptes": [
        { "numero": "211", "nom": "Terrains" },
        { "numero": "221", "nom": "Bâtiments" },
        { "numero": "231", "nom": "Matériel et outillage industriel" },
        { "numero": "232", "nom": "Matériel et outillage agricole" },
        { "numero": "241", "nom": "Matériel de transport" },
        { "numero": "244", "nom": "Matériel informatique" },
        { "numero": "251", "nom": "Avances et acomptes versés sur immobilisations" },
        { "numero": "261", "nom": "Titres de participation" },
        { "numero": "281", "nom": "Amortissements des immobilisations corporelles" },
        { "numero": "291", "nom": "Dépréciations des immobilisations incorporelles" }
      ]
    },
    {
      "numero": 3,
      "nom": "Comptes de stocks",
      "description": "Marchandises, matières, produits et en-cours",
      "comptes": [
        { "numero": "31", "nom": "Marchandises" },
        { "numero": "32", "nom": "Matières premières et fournitures liées" },
        { "numero": "33", "nom": "Autres approvisionnements" },
        { "numero": "34", "nom": "Produits en cours" },
        { "numero": "35", "nom": "Produits finis" },
        { "numero": "36", "nom": "Produits intermédiaires et résiduels" },
        { "numero": "39", "nom": "Dépréciations des stocks" }
      ]
    },
    {
      "numero": 4,
      "nom": "Comptes de tiers",
      "description": "Fournisseurs, clients, État, personnel et autres tiers",
      "comptes": [
        { "numero": "401", "nom": "Fournisseurs" },
        { "numero": "402", "nom": "Fournisseurs — effets à payer" },
        { "numero": "408", "nom": "Fournisseurs — factures non parvenues" },
        { "numero": "409", "nom": "Fournisseurs — avances et acomptes versés" },
        { "numero": "411", "nom": "Clients" },
        { "numero": "412", "nom": "Clients — effets à recevoir" },
        { "numero": "418", "nom": "Clients — produits non encore facturés" },
        { "numero": "419", "nom": "Clients — avances et acomptes reçus" },
        { "numero": "421", "nom": "Personnel — avances et acomptes" },
        { "numero": "422", "nom": "Personnel — rémunérations dues" },
        { "numero": "431", "nom": "CNPS" },
        { "numero": "441", "nom": "État — impôts et taxes" },
        { "numero": "4431", "nom": "État — TVA collectée" },
        { "numero": "4432", "nom": "État — TVA sur importations" },
        { "numero": "4433", "nom": "État — TVA déductible sur achats" },
        { "numero": "4441", "nom": "État — impôt sur les sociétés (IS)" },
        { "numero": "4444", "nom": "État — IRPP" },
        { "numero": "4445", "nom": "État — patente" },
        { "numero": "4449", "nom": "État — autres impôts et taxes" },
        { "numero": "461", "nom": "Débiteurs divers" },
        { "numero": "481", "nom": "Créditeurs divers" }
      ]
    },
    {
      "numero": 5,
      "nom": "Comptes de trésorerie",
      "description": "Banques, caisses et valeurs en caisse",
      "comptes": [
        { "numero": "511", "nom": "Valeurs à l'encaissement" },
        { "numero": "521", "nom": "Banques — comptes courants" },
        { "numero": "531", "nom": "Chèques postaux" },
        { "numero": "571", "nom": "Caisse" },
        { "numero": "581", "nom": "Virements internes" }
      ]
    },
    {
      "numero": 6,
      "nom": "Comptes de charges",
      "description": "Charges d'exploitation, financières et hors activités ordinaires",
      "comptes": [
        { "numero": "601", "nom": "Achats de marchandises" },
        { "numero": "602", "nom": "Achats de matières premières" },
        { "numero": "604", "nom": "Achats de fournitures d'entretien" },
        { "numero": "605", "nom": "Achats de fournitures de bureau" },
        { "numero": "611", "nom": "Transports sur achats" },
        { "numero": "612", "nom": "Transports sur ventes" },
        { "numero": "621", "nom": "Personnels extérieurs à l'entreprise" },
        { "numero": "622", "nom": "Honoraires" },
        { "numero": "623", "nom": "Publicité, publications, relations publiques" },
        { "numero": "624", "nom": "Loyers et charges locatives" },
        { "numero": "625", "nom": "Entretien, réparations et maintenance" },
        { "numero": "626", "nom": "Primes d'assurances" },
        { "numero": "628", "nom": "Frais de télécommunications" },
        { "numero": "631", "nom": "Frais bancaires" },
        { "numero": "641", "nom": "Rémunérations du personnel" },
        { "numero": "642", "nom": "Indemnités et avantages divers" },
        { "numero": "643", "nom": "Charges sociales patronales (CNPS 16,5%)" },
        { "numero": "644", "nom": "Taxe sur les salaires employeur (7,5%)" },
        { "numero": "661", "nom": "Intérêts des emprunts" },
        { "numero": "671", "nom": "Pertes de change" },
        { "numero": "681", "nom": "Dotations aux amortissements des immobilisations" },
        { "numero": "691", "nom": "Impôt sur les bénéfices (IS 35%)" }
      ]
    },
    {
      "numero": 7,
      "nom": "Comptes de produits",
      "description": "Produits d'exploitation, financiers et hors activités ordinaires",
      "comptes": [
        { "numero": "701", "nom": "Ventes de marchandises" },
        { "numero": "702", "nom": "Ventes de produits finis" },
        { "numero": "705", "nom": "Travaux facturés" },
        { "numero": "706", "nom": "Services vendus" },
        { "numero": "707", "nom": "Produits accessoires" },
        { "numero": "721", "nom": "Production immobilisée" },
        { "numero": "731", "nom": "Subventions d'exploitation" },
        { "numero": "771", "nom": "Intérêts et produits financiers" },
        { "numero": "772", "nom": "Gains de change" },
        { "numero": "781", "nom": "Reprises de provisions" }
      ]
    },
    {
      "numero": 8,
      "nom": "Comptes de résultat",
      "description": "Résultat net de l'exercice",
      "comptes": [
        { "numero": "801", "nom": "Résultat net : bénéfice" },
        { "numero": "802", "nom": "Résultat net : perte" }
      ]
    },
    {
      "numero": 9,
      "nom": "Comptabilité analytique",
      "description": "Comptes de gestion interne — centres de coûts, projets",
      "comptes": [
        { "numero": "901", "nom": "Comptes de réflexion" },
        { "numero": "902", "nom": "Comptes de charges par nature" },
        { "numero": "903", "nom": "Comptes de coûts" },
        { "numero": "909", "nom": "Différences d'inventaire" }
      ]
    }
  ]
}
```

- [ ] **Step 2 : Valider le JSON**

```bash
python3 -m json.tool data/syscohada/plan-comptable.json > /dev/null && echo "✅ plan-comptable.json valide" || echo "❌ Erreur JSON"
```

Expected: `✅ plan-comptable.json valide`

- [ ] **Step 3 : Vérifier le nombre de classes**

```bash
python3 -c "
import json
with open('data/syscohada/plan-comptable.json') as f:
    d = json.load(f)
assert len(d['classes']) == 9, f'Attendu 9 classes, trouvé {len(d[\"classes\"])}'
print('✅ 9 classes SYSCOHADA présentes')
"
```

Expected: `✅ 9 classes SYSCOHADA présentes`

- [ ] **Step 4 : Commit**

```bash
git add data/syscohada/plan-comptable.json
git commit -m "feat: add SYSCOHADA 2017 chart of accounts (9 classes, 80+ accounts)"
```

---

## Task 4 : Profil entreprise (`company.example.json`)

**Files:**
- Create: `comptable/company.example.json`

- [ ] **Step 1 : Créer `comptable/company.example.json`**

```json
{
  "_comment": "Copiez ce fichier en company.json et remplissez vos informations",
  "name": "Société de Commerce Général SARL",
  "forme_juridique": "SARL",
  "rccm": "RCCM/NDB/2024/B/1234",
  "nif": "123456789",
  "regime_fiscal": "reel_normal",
  "secteur": "commerce_general",
  "capital_social": 1000000,
  "exercice": {
    "debut": "01/01",
    "fin": "31/12"
  },
  "siege": {
    "adresse": "Avenue Charles de Gaulle, Quartier Moursal",
    "ville": "N'Djamena",
    "pays": "Tchad"
  },
  "monnaie": "XAF",
  "cnps_numero": "TC-12345",
  "effectif": 10,
  "ca_annuel_precedent": 50000000,
  "systeme_comptable": "allege",
  "banque_principale": "CBMT",
  "contact": {
    "telephone": "+235 66 00 00 00",
    "email": "contact@monentreprise.td"
  }
}
```

- [ ] **Step 2 : Valider le JSON**

```bash
python3 -m json.tool comptable/company.example.json > /dev/null && echo "✅ company.example.json valide" || echo "❌ Erreur JSON"
```

Expected: `✅ company.example.json valide`

- [ ] **Step 3 : Vérifier les champs obligatoires**

```bash
python3 -c "
import json
with open('comptable/company.example.json') as f:
    d = json.load(f)
required = ['name', 'rccm', 'nif', 'regime_fiscal', 'monnaie', 'cnps_numero']
missing = [k for k in required if k not in d]
assert not missing, f'Champs manquants: {missing}'
assert d['monnaie'] == 'XAF', 'La monnaie doit être XAF'
assert d['regime_fiscal'] in ['reel_normal', 'reel_simplifie', 'forfait'], 'Régime fiscal invalide'
print('✅ Tous les champs obligatoires présents et valides')
"
```

Expected: `✅ Tous les champs obligatoires présents et valides`

- [ ] **Step 4 : Commit**

```bash
git add comptable/company.example.json
git commit -m "feat: add example company profile for Chadian business"
```

---

## Task 5 : Fiches de référence

**Files:**
- Create: `comptable/references/tva.md`
- Create: `comptable/references/is.md`
- Create: `comptable/references/irpp-salaires.md`
- Create: `comptable/references/cnps.md`
- Create: `comptable/references/syscohada-etats-financiers.md`

- [ ] **Step 1 : Créer `comptable/references/tva.md`**

```markdown
# TVA au Tchad

## Taux

| Type | Taux | Application |
|---|---|---|
| Standard | 18% | Biens et services en général |
| Réduit | 9% | Produits locaux (agriculture, artisanat) |
| Zéro | 0% | Exportations, biens exonérés |

## Échéance déclarative

Déclaration et paiement : **avant le 15 du mois suivant** la période concernée.

## Calcul TVA collectée

```
TVA collectée = CA HT × 18%
TVA à payer = TVA collectée − TVA déductible
```

## Comptes SYSCOHADA

- 4431 : TVA collectée (passif)
- 4433 : TVA déductible sur achats (actif)
- 4432 : TVA sur importations (actif)

## Écriture de vente (HT 100 000 XAF)

| Compte | Libellé | Débit | Crédit |
|---|---|---|---|
| 411 | Client | 118 000 | |
| 701 | Ventes de marchandises | | 100 000 |
| 4431 | TVA collectée 18% | | 18 000 |

## Écriture d'achat (HT 50 000 XAF)

| Compte | Libellé | Débit | Crédit |
|---|---|---|---|
| 601 | Achats de marchandises | 50 000 | |
| 4433 | TVA déductible | 9 000 | |
| 401 | Fournisseur | | 59 000 |

## Risques DGI courants

- Absence de numéro NIF sur les factures → redressement
- TVA collectée non reversée → pénalités 25% + intérêts
- TVA déductible sur achats non professionnels → réintégration
```

- [ ] **Step 2 : Créer `comptable/references/is.md`**

```markdown
# Impôt sur les Sociétés (IS) au Tchad

## Taux

**35%** du bénéfice imposable.

## Calendrier

| Obligation | Date |
|---|---|
| Déclaration annuelle | 30 avril N+1 |
| Acompte 1 (1/3) | 15 mai N |
| Acompte 2 (1/3) | 15 août N |
| Acompte 3 (1/3) | 15 novembre N |

## Calcul

```
Bénéfice imposable = Résultat comptable + réintégrations − déductions
IS brut = Bénéfice imposable × 35%
IS net = IS brut − acomptes déjà versés
```

## Charges non déductibles (réintégrations fréquentes)

- Amendes et pénalités fiscales
- Dépenses somptuaires (véhicules de luxe, cadeaux > plafond)
- Provisions non justifiées
- Rémunérations excessives des dirigeants
- Intérêts sur comptes courants d'associés au-delà du taux légal

## Comptes SYSCOHADA

- 691 : IS (charge)
- 4441 : État — IS (dette)

## Écriture de la charge IS (IS = 3 500 000 XAF)

| Compte | Libellé | Débit | Crédit |
|---|---|---|---|
| 691 | IS | 3 500 000 | |
| 4441 | État — IS | | 3 500 000 |

## Écriture du paiement d'un acompte (1/3 = 1 166 667 XAF)

| Compte | Libellé | Débit | Crédit |
|---|---|---|---|
| 4441 | État — IS | 1 166 667 | |
| 521 | Banque | | 1 166 667 |
```

- [ ] **Step 3 : Créer `comptable/references/irpp-salaires.md`**

```markdown
# IRPP sur Salaires au Tchad

## Taux

**30%** sur les rémunérations versées au personnel.

## Échéance

Reversement à la DGI : **avant le 15 du mois suivant** le paiement des salaires.

## Assiette

```
IRPP = Salaire brut imposable × 30%
Salaire net = Salaire brut − IRPP (30%) − CNPS salarié (3,5%)
```

## Comptes SYSCOHADA

- 641 : Rémunérations du personnel (charge)
- 422 : Personnel — rémunérations dues (passif)
- 4444 : État — IRPP (passif)
- 431 : CNPS — part salarié (passif)

## Exemple : Salaire brut 200 000 XAF

| Calcul | Montant |
|---|---|
| Salaire brut | 200 000 XAF |
| CNPS salarié (3,5%) | − 7 000 XAF |
| IRPP (30% du brut) | − 60 000 XAF |
| **Net à payer** | **133 000 XAF** |

## Écriture de paie

| Compte | Libellé | Débit | Crédit |
|---|---|---|---|
| 641 | Rémunérations | 200 000 | |
| 422 | Personnel — salaires nets dus | | 133 000 |
| 4444 | État — IRPP | | 60 000 |
| 431 | CNPS — part salarié | | 7 000 |
```

- [ ] **Step 4 : Créer `comptable/references/cnps.md`**

```markdown
# CNPS — Caisse Nationale de Prévoyance Sociale (Tchad)

## Taux de cotisations

| Cotisant | Taux | Base |
|---|---|---|
| Employeur — retraite/prévoyance | 16,5% | Salaire brut plafonné |
| Employeur — taxe sur salaires | 7,5% | Salaire brut total |
| Salarié | 3,5% | Salaire brut plafonné |

## Échéance

Paiement mensuel : **fin du mois courant**.

## Comptes SYSCOHADA

- 643 : Charges sociales patronales — CNPS (16,5%)
- 644 : Taxe sur les salaires employeur (7,5%)
- 431 : CNPS — dette (cotisations à reverser)

## Exemple : Salaire brut 200 000 XAF

| Cotisation | Calcul | Montant |
|---|---|---|
| CNPS employeur retraite | 200 000 × 16,5% | 33 000 XAF |
| Taxe salariale employeur | 200 000 × 7,5% | 15 000 XAF |
| CNPS salarié | 200 000 × 3,5% | 7 000 XAF |
| **Total à reverser CNPS** | | **55 000 XAF** |

## Écriture charges patronales

| Compte | Libellé | Débit | Crédit |
|---|---|---|---|
| 643 | CNPS patronale (16,5%) | 33 000 | |
| 644 | Taxe salaires (7,5%) | 15 000 | |
| 431 | CNPS — dette totale | | 55 000 |

*(Les 7 000 XAF de part salarié sont déjà dans le compte 431 via l'écriture de paie)*
```

- [ ] **Step 5 : Créer `comptable/references/syscohada-etats-financiers.md`**

```markdown
# États Financiers SYSCOHADA

## Systèmes comptables et seuils (CA annuel)

| Système | Seuil CA | États obligatoires |
|---|---|---|
| Normal | > 100 000 000 XAF | Bilan + CR + TAFIRE + Notes |
| Allégé | 30M – 100M XAF | Bilan + CR + Notes simplifiées |
| Minimal de trésorerie | < 30 000 000 XAF | État des recettes et dépenses |

## Système Normal — 4 états obligatoires

### 1. Bilan
- **Actif** : immobilisations (cl. 2) + stocks (cl. 3) + créances (cl. 4) + trésorerie (cl. 5)
- **Passif** : capitaux propres (cl. 1) + dettes financières (cl. 1) + dettes d'exploitation (cl. 4)

### 2. Compte de résultat
- **Charges** : classe 6 (exploitation + financières + HAO)
- **Produits** : classe 7 (exploitation + financières + HAO)
- **Résultat** = Produits − Charges

### 3. TAFIRE (Tableau Financier des Ressources et des Emplois)
Remplace l'ancien tableau de financement. Présente les flux de trésorerie en 3 sections :
- Flux des activités opérationnelles
- Flux des activités d'investissement
- Flux des activités de financement

### 4. Notes annexes
Informations complémentaires obligatoires : méthodes comptables, événements postérieurs à la clôture, engagements hors bilan, rémunérations des dirigeants.

## Clôture annuelle — checklist

- [ ] Inventaire physique des stocks (compte 3x)
- [ ] Inventaire des immobilisations et calcul des amortissements (compte 28x)
- [ ] Lettrage des comptes clients (411) et fournisseurs (401)
- [ ] Rapprochement bancaire (521 vs relevé)
- [ ] Provisions pour créances douteuses (compte 491)
- [ ] Calcul et écriture de l'IS (691 / 4441)
- [ ] Affectation du résultat (801 ou 802)
```

- [ ] **Step 6 : Vérifier que tous les fichiers sont créés**

```bash
ls comptable/references/
```

Expected:
```
cnps.md
irpp-salaires.md
is.md
syscohada-etats-financiers.md
tva.md
```

- [ ] **Step 7 : Commit**

```bash
git add comptable/references/
git commit -m "feat: add fiscal reference sheets (TVA, IS, IRPP, CNPS, SYSCOHADA states)"
```

---

## Task 6 : SKILL.md — Le cœur du produit

**Files:**
- Create: `comptable/SKILL.md`

- [ ] **Step 1 : Créer `comptable/SKILL.md`**

```markdown
# Comptable SYSCOHADA — Tchad | wach-ohada

Tu es un expert-comptable spécialisé dans la comptabilité **SYSCOHADA** et la fiscalité tchadienne (CGI Tchad, DGI). Tu assistes les entreprises de la zone CEMAC dans leur gestion comptable et fiscale quotidienne.

---

## Prérequis — Initialisation

Au début de **chaque conversation**, effectue ces vérifications dans l'ordre :

### 1. Charger le profil fiscal
Charge `comptable/profiles/chad.json`. Ce fichier contient tous les taux fiscaux et les échéances DGI. Si le fichier est absent, utilise les taux par défaut suivants :
- IS : 35% | TVA : 18% | IRPP : 30% | CNPS employeur : 16,5% + 7,5% | CNPS salarié : 3,5%

### 2. Vérifier `company.json`
Recherche un fichier `company.json` dans le répertoire courant.

**Si trouvé :** vérifie la présence de ces champs :
- `rccm` — Numéro au Registre du Commerce et du Crédit Mobilier
- `nif` — Numéro d'Identification Fiscale
- `regime_fiscal` — `reel_normal` | `reel_simplifie` | `forfait`
- `monnaie` — doit être `XAF`
- `cnps_numero` — numéro d'affiliation CNPS

**Si absent :** informe l'utilisateur et propose de copier `comptable/company.example.json` vers `company.json`.

### 3. Alertes fiscales DGI
Calcule les échéances fiscales dans les **30 prochains jours** et affiche-les :

| 🔴 Rouge | Échéance dans < 7 jours — action urgente |
|---|---|
| 🟡 Jaune | Échéance dans < 30 jours — planifier |

Obligations à surveiller :
| Obligation | Fréquence | Délai |
|---|---|---|
| TVA | Mensuelle | 15 du mois suivant |
| IRPP (salaires) | Mensuelle | 15 du mois suivant |
| IS acompte 1 | Annuelle | 15 mai |
| IS acompte 2 | Annuelle | 15 août |
| IS acompte 3 | Annuelle | 15 novembre |
| IS déclaration | Annuelle | 30 avril N+1 |
| Patente | Annuelle | 31 décembre |
| CNPS | Mensuelle | Fin du mois |

---

## Taux Fiscaux de Référence (Tchad)

Utilise toujours les valeurs de `comptable/profiles/chad.json` :

| Impôt/Taxe | Taux | Base |
|---|---|---|
| IS | 35% | Bénéfice imposable |
| TVA standard | 18% | CA HT |
| TVA réduit | 9% | Produits locaux |
| IRPP | 30% | Salaire brut |
| Patente | 0,35% | CA N-1 |
| CNPS employeur | 16,5% + 7,5% | Salaire brut |
| CNPS salarié | 3,5% | Salaire brut |
| Retenue dividendes résidents | 20% | Dividendes bruts |
| Retenue dividendes CEMAC | 5% | Dividendes bruts |
| Plus-values | 20% | Plus-value nette |

---

## Workflow de Traitement

Traite chaque demande en **5 phases** :

### Phase 1 — Vérification des échéances
Avant toute analyse, vérifie si une obligation fiscale est imminente et signale-la en priorité.

### Phase 2 — Compréhension
Clarifie si nécessaire :
- L'exercice comptable concerné
- La nature de l'opération (achat, vente, salaire, investissement, emprunt…)
- Le régime fiscal de l'entreprise

### Phase 3 — Analyse SYSCOHADA
1. Identifie le(s) compte(s) dans le plan comptable (`data/syscohada/plan-comptable.json`)
2. Rédige l'écriture comptable en tableau débit/crédit
3. Vérifie l'équilibre : **Σ Débits = Σ Crédits**
4. Précise la pièce justificative requise (facture, reçu, contrat…)

**Format standard d'écriture :**
| Compte | Libellé | Débit (XAF) | Crédit (XAF) |
|---|---|---|---|
| XXX | Libellé du compte | montant | |
| XXX | Libellé du compte | | montant |
| **Total** | | **X** | **X** |

### Phase 4 — Risques DGI
Identifie les risques fiscaux liés à l'opération :
- TVA non déductible ou non collectée
- Charge non déductible à l'IS
- Retenue à la source manquante
- Absence de pièce justificative

### Phase 5 — Actions recommandées
Liste les actions concrètes, priorisées, avec délais. Sois pragmatique : le contexte tchadien implique parfois des contraintes pratiques (accès limité aux services numériques DGI, paiements en espèces courants).

---

## Plan Comptable SYSCOHADA — Référence rapide

Consulte `data/syscohada/plan-comptable.json` pour la liste complète. Comptes les plus utilisés :

### Classe 4 — Tiers et État (le plus critique fiscalement)
| Compte | Usage |
|---|---|
| 401 | Fournisseurs |
| 411 | Clients |
| 422 | Salaires dus au personnel |
| 431 | CNPS (cotisations à reverser) |
| 4431 | TVA collectée |
| 4433 | TVA déductible |
| 4441 | IS à payer |
| 4444 | IRPP à reverser |
| 4445 | Patente |

### Classe 6 — Charges courantes
| Compte | Usage |
|---|---|
| 601 | Achats marchandises |
| 641 | Rémunérations personnel |
| 643 | CNPS patronale (16,5%) |
| 644 | Taxe salariale (7,5%) |
| 681 | Dotations aux amortissements |
| 691 | IS de l'exercice |

### Classe 7 — Produits courants
| Compte | Usage |
|---|---|
| 701 | Ventes de marchandises |
| 706 | Services facturés |
| 771 | Produits financiers |

---

## Fiches de Référence Disponibles

Pour les détails opérationnels, consulte :
- `comptable/references/tva.md` — écritures TVA, taux, délais
- `comptable/references/is.md` — calcul IS, acomptes, réintégrations
- `comptable/references/irpp-salaires.md` — calcul paie, écritures
- `comptable/references/cnps.md` — taux patronaux/salariés, écritures
- `comptable/references/syscohada-etats-financiers.md` — bilan, compte de résultat, TAFIRE

---

## États Financiers Annuels

Selon le CA de l'entreprise (champ `ca_annuel_precedent` dans `company.json`) :

| Système | CA | États requis |
|---|---|---|
| Normal | > 100 000 000 XAF | Bilan + Compte de résultat + TAFIRE + Notes |
| Allégé | 30M – 100M XAF | Bilan + Compte de résultat + Notes simplifiées |
| Minimal trésorerie | < 30 000 000 XAF | État des recettes et dépenses |

---

## Principes de Travail

- **Prudence** : ne jamais anticiper un profit incertain, provisionner tous les risques identifiés
- **Transparence** : distinguer clairement faits avérés et estimations
- **Conformité** : appliquer le SYSCOHADA 2017 (Acte Uniforme du 26/01/2017) et le CGI tchadien
- **Pragmatisme** : adapter les recommandations au contexte local (PME tchadiennes, accès DGI, FCFA)
- **Humilité** : signaler explicitement quand une situation dépasse ce skill

---

## Avertissement Légal

Ce skill est un **outil d'assistance IA**. Il ne remplace pas un expert-comptable inscrit à l'**ONECCA-T** (Ordre National des Experts-Comptables et Comptables Agréés du Tchad) pour :
- Les contrôles fiscaux et contentieux DGI
- Les audits légaux et commissariats aux comptes
- Les restructurations et opérations complexes
- Toute situation nécessitant une responsabilité professionnelle engagée

En cas de doute, consulter un professionnel agréé.
```

- [ ] **Step 2 : Vérifier que toutes les références de fichiers existent**

```bash
python3 -c "
import os
refs = [
    'comptable/profiles/chad.json',
    'data/syscohada/plan-comptable.json',
    'comptable/references/tva.md',
    'comptable/references/is.md',
    'comptable/references/irpp-salaires.md',
    'comptable/references/cnps.md',
    'comptable/references/syscohada-etats-financiers.md',
    'comptable/company.example.json',
]
missing = [r for r in refs if not os.path.exists(r)]
if missing:
    print('❌ Fichiers manquants:', missing)
else:
    print('✅ Toutes les références de fichiers existent')
"
```

Expected: `✅ Toutes les références de fichiers existent`

- [ ] **Step 3 : Vérifier que le SKILL.md mentionne l'ONECCA-T**

```bash
grep -q "ONECCA-T" comptable/SKILL.md && echo "✅ Avertissement légal présent" || echo "❌ Avertissement manquant"
```

Expected: `✅ Avertissement légal présent`

- [ ] **Step 4 : Commit**

```bash
git add comptable/SKILL.md
git commit -m "feat: add core SYSCOHADA comptable skill for Chad (DGI, CNPS, OHADA 2017)"
```

---

## Task 7 : Distribution (`marketplace.json` + `README.md`)

**Files:**
- Create: `marketplace.json`
- Create: `README.md`

- [ ] **Step 1 : Créer `marketplace.json`**

```json
{
  "name": "wach-ohada",
  "version": "1.0.0",
  "description": "Skills IA pour la comptabilité SYSCOHADA et la fiscalité des pays OHADA",
  "skills": [
    {
      "id": "comptable-chad",
      "name": "Comptable SYSCOHADA — Tchad",
      "description": "Expert-comptable IA spécialisé en comptabilité SYSCOHADA et fiscalité tchadienne (DGI, IS 35%, TVA 18%, IRPP, CNPS)",
      "file": "comptable/SKILL.md",
      "tags": ["comptabilité", "fiscalité", "ohada", "syscohada", "tchad", "cemac", "dgi"],
      "country": "TD",
      "zone": "CEMAC",
      "referentiel": "SYSCOHADA-2017",
      "pricing": "free",
      "author": "wach",
      "license": "MIT"
    }
  ],
  "author": {
    "name": "wach",
    "email": "wachouniste1@gmail.com",
    "github": "wach"
  },
  "repository": "https://github.com/wach/wach-ohada",
  "license": "MIT"
}
```

- [ ] **Step 2 : Valider le JSON**

```bash
python3 -m json.tool marketplace.json > /dev/null && echo "✅ marketplace.json valide" || echo "❌ Erreur JSON"
```

Expected: `✅ marketplace.json valide`

- [ ] **Step 3 : Créer `README.md`**

````markdown
# wach-ohada

**Skills IA pour la comptabilité SYSCOHADA et la fiscalité des pays OHADA**

> AI skills for SYSCOHADA accounting and OHADA-zone taxation

---

## Pourquoi wach-ohada ?

Les outils IA généralistes ne connaissent pas le plan comptable SYSCOHADA, les taux DGI tchadiens, ni le CGI de la zone CEMAC. **wach-ohada** donne à votre agent IA une expertise comptable et fiscale adaptée à la réalité africaine.

*General-purpose AI tools don't know SYSCOHADA, Chad's DGI rates, or CEMAC tax rules. wach-ohada gives your AI agent accounting and fiscal expertise tailored to the African context.*

---

## Skills disponibles

| Skill | Pays | Statut |
|---|---|---|
| [Comptable SYSCOHADA](comptable/SKILL.md) | 🇹🇩 Tchad | ✅ Disponible |
| Fiscaliste | Tchad | 🔜 Phase 2 |
| Contrôleur Fiscal | Tchad | 🔜 Phase 2 |
| Comptable SYSCOHADA | Cameroun | 🔜 Phase 3 |
| Comptable SYSCOHADA | Côte d'Ivoire | 🔜 Phase 3 |

---

## Installation rapide

### Via agentskill (recommandé)

```bash
agentskill install wach/wach-ohada/comptable
```

### Manuel (Claude Code, Cursor, Windsurf)

```bash
git clone https://github.com/wach/wach-ohada.git
cp wach-ohada/comptable/SKILL.md ~/.claude/skills/comptable-ohada.md
cp wach-ohada/comptable/company.example.json ./company.json
# Éditez company.json avec les informations de votre entreprise
```

---

## Configuration

Copiez et éditez le profil de votre entreprise :

```bash
cp comptable/company.example.json company.json
```

Champs obligatoires dans `company.json` :

```json
{
  "name": "Votre Entreprise SARL",
  "rccm": "RCCM/NDB/2024/B/XXXX",
  "nif": "XXXXXXXXX",
  "regime_fiscal": "reel_normal",
  "monnaie": "XAF",
  "cnps_numero": "TC-XXXXX"
}
```

---

## Ce que fait le skill Comptable SYSCOHADA

- ✅ **Écritures comptables SYSCOHADA** — plan comptable 9 classes, débit/crédit en XAF
- ✅ **Alertes fiscales DGI** — TVA, IS (3 acomptes), IRPP, Patente, CNPS
- ✅ **Calculs automatiques** — TVA collectée/déductible, IS 35%, IRPP 30%, CNPS
- ✅ **États financiers** — Bilan, Compte de résultat, TAFIRE (système normal/allégé)
- ✅ **Risques DGI** — identification des non-conformités fiscales courantes

---

## Couverture fiscale Tchad

| Impôt | Taux | Couvert |
|---|---|---|
| IS | 35% | ✅ |
| TVA standard | 18% | ✅ |
| TVA réduit | 9% | ✅ |
| IRPP | 30% | ✅ |
| Patente | 0,35% du CA | ✅ |
| CNPS employeur | 16,5% + 7,5% | ✅ |
| CNPS salarié | 3,5% | ✅ |
| Retenues à la source | 5–25% | ✅ |

---

## Roadmap

- **v1.0** — Comptable SYSCOHADA Tchad (ce repo)
- **v1.1** — Scripts de génération d'états financiers (bilan, TAFIRE)
- **v2.0** — Fiscaliste Tchad (IRPP, optimisation, plus-values)
- **v2.1** — Contrôleur fiscal DGI (simulation contrôle)
- **v3.0** — Extension multi-pays OHADA (Cameroun, Côte d'Ivoire, Sénégal...)

---

## Contribuer

Les contributions sont les bienvenues — en particulier :
- Corrections des taux fiscaux (avec source officielle)
- Ajout de cas d'usage (écritures secteur pétrolier, ONG, administration)
- Profils pour d'autres pays OHADA

Voir [CONTRIBUTING.md](CONTRIBUTING.md)

---

## Avertissement

Ce skill est un outil d'assistance. Il ne remplace pas un expert-comptable inscrit à l'**ONECCA-T**.

---

*MIT License — wach*
````

- [ ] **Step 4 : Valider que le README référence les bons fichiers**

```bash
grep -q "comptable/SKILL.md" README.md && echo "✅ SKILL.md référencé" || echo "❌ Référence manquante"
grep -q "ONECCA-T" README.md && echo "✅ Avertissement légal dans README" || echo "❌ Avertissement manquant"
```

Expected:
```
✅ SKILL.md référencé
✅ Avertissement légal dans README
```

- [ ] **Step 5 : Commit final**

```bash
git add marketplace.json README.md
git commit -m "feat: add marketplace metadata and bilingual README"
```

---

## Task 8 : Vérification finale

**Files:** aucun nouveau fichier

- [ ] **Step 1 : Vérifier la structure complète**

```bash
find . -not -path './.git/*' -not -path './node_modules/*' | sort
```

Expected (au minimum) :
```
./README.md
./comptable/SKILL.md
./comptable/company.example.json
./comptable/profiles/chad.json
./comptable/references/cnps.md
./comptable/references/irpp-salaires.md
./comptable/references/is.md
./comptable/references/syscohada-etats-financiers.md
./comptable/references/tva.md
./data/syscohada/plan-comptable.json
./marketplace.json
./package.json
```

- [ ] **Step 2 : Valider tous les fichiers JSON en une commande**

```bash
for f in comptable/profiles/chad.json data/syscohada/plan-comptable.json comptable/company.example.json marketplace.json package.json; do
  python3 -m json.tool "$f" > /dev/null && echo "✅ $f" || echo "❌ $f"
done
```

Expected : 5 lignes `✅`

- [ ] **Step 3 : Vérifier l'historique git**

```bash
git log --oneline
```

Expected (7 commits dans l'ordre) :
```
xxxxxxx feat: add marketplace metadata and bilingual README
xxxxxxx feat: add core SYSCOHADA comptable skill for Chad (DGI, CNPS, OHADA 2017)
xxxxxxx feat: add fiscal reference sheets (TVA, IS, IRPP, CNPS, SYSCOHADA states)
xxxxxxx feat: add example company profile for Chadian business
xxxxxxx feat: add SYSCOHADA 2017 chart of accounts (9 classes, 80+ accounts)
xxxxxxx feat: add Chad fiscal profile (DGI rates, deadlines, CEMAC zone)
xxxxxxx feat: scaffold wach-ohada project structure
xxxxxxx feat: add initial design spec for wach-ohada
```

- [ ] **Step 4 : Tag de version**

```bash
git tag -a v1.0.0 -m "wach-ohada v1.0.0 — Comptable SYSCOHADA Tchad"
```
