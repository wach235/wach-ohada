# wach-ohada — Design Spec
**Date :** 2026-05-23  
**Auteur :** wach + Claude  
**Statut :** Approuvé

---

## 1. Contexte et objectif

**wach-ohada** est une collection de skills IA spécialisés dans la comptabilité et la fiscalité des pays membres de l'OHADA, à commencer par le Tchad.

Inspiré de [paperasse](https://github.com/romainsimon/paperasse) (skills comptables français), wach-ohada adapte le concept au référentiel SYSCOHADA et aux cadres fiscaux d'Afrique centrale et de l'Ouest.

**Objectif phase 1 :** un skill `comptable` opérationnel pour le Tchad, commercialisable, extensible aux 17 pays OHADA.

---

## 2. Architecture générale

```
wach-ohada/
├── comptable/
│   ├── SKILL.md                  # skill principal
│   ├── company.example.json      # profil entreprise tchadienne
│   ├── profiles/
│   │   └── chad.json             # taux fiscaux + calendrier DGI Tchad
│   ├── references/               # fiches de référence (TVA, IS, IRPP, SYSCOHADA)
│   └── evals/                    # tests automatisés
├── data/
│   └── syscohada/
│       └── plan-comptable.json   # 9 classes SYSCOHADA
├── scripts/                      # calculs IS, TVA, états financiers
├── templates/                    # bilan, compte de résultat, TAFIRE
├── README.md
├── marketplace.json
└── package.json
```

**Principe de modularité pays :** le `SKILL.md` charge dynamiquement le profil pays en début de conversation. Ajouter un nouveau pays = créer un nouveau fichier `profiles/<country>.json`.

---

## 3. SKILL.md — Structure détaillée

Le fichier `comptable/SKILL.md` est organisé en 6 blocs :

### Bloc 1 — Prérequis
- Vérifier l'existence de `company.json` avec les champs : `rccm`, `nif`, `regime_fiscal`, `secteur`, `cnps_numero`
- Charger le profil pays `profiles/chad.json`
- Alerter si des champs obligatoires manquent

### Bloc 2 — Calendrier fiscal DGI
Alertes visuelles automatiques sur les échéances selon le profil pays chargé :

| Obligation | Échéance |
|---|---|
| TVA | 15 du mois suivant |
| IRPP salaires | 15 du mois suivant |
| IS — déclaration | 30 avril |
| IS — acompte 1 | 15 mai |
| IS — acompte 2 | 15 août |
| IS — acompte 3 | 15 novembre |
| Patente | 31 décembre |
| CNPS | Mensuel |

### Bloc 3 — Workflow en 5 phases
1. Vérifier échéances à venir (< 30 jours)
2. Comprendre la demande utilisateur
3. Analyser et appliquer le référentiel SYSCOHADA
4. Identifier les risques DGI
5. Proposer des actions concrètes

### Bloc 4 — Plan comptable SYSCOHADA
Les 9 classes avec comptes principaux :
- **Classe 1** : Ressources durables (capital, dettes financières)
- **Classe 2** : Actif immobilisé (immobilisations corporelles/incorporelles)
- **Classe 3** : Stocks
- **Classe 4** : Comptes de tiers (clients, fournisseurs, État)
- **Classe 5** : Trésorerie (banque, caisse)
- **Classe 6** : Charges (achats, services, personnel)
- **Classe 7** : Produits (ventes, subventions)
- **Classe 8** : Comptes de résultat (résultat net)
- **Classe 9** : Comptabilité analytique

### Bloc 5 — États financiers SYSCOHADA (système normal)
- Bilan
- Compte de résultat
- TAFIRE (Tableau Financier des Ressources et des Emplois)
- Notes annexes

### Bloc 6 — Avertissement légal
Ce skill ne remplace pas un expert-comptable inscrit à l'**ONECCA-T** (Ordre National des Experts-Comptables et Comptables Agréés du Tchad) pour les situations complexes ou litigieuses.

---

## 4. Fichiers de données

### `company.example.json`
```json
{
  "name": "Mon Entreprise SARL",
  "forme_juridique": "SARL",
  "rccm": "RCCM/NDB/2024/B/1234",
  "nif": "123456789",
  "regime_fiscal": "reel_normal",  // valeurs : reel_normal | reel_simplifie | forfait
  "secteur": "commerce_general",
  "capital_social": 1000000,
  "exercice": { "debut": "01/01", "fin": "31/12" },
  "siege": "N'Djamena, Tchad",
  "monnaie": "XAF",
  "cnps_numero": "TC-12345"
}
```

### `profiles/chad.json`
```json
{
  "pays": "Tchad",
  "autorite_fiscale": "DGI",
  "monnaie": "XAF",
  "zone": "CEMAC",
  "taux": {
    "is": 0.35,
    "tva_standard": 0.18,
    "tva_reduit": 0.09,
    "irpp": 0.30,
    "plus_values": 0.20,
    "patente": 0.0035,
    "cnps_employeur": 0.165,
    "cnps_salarie": 0.035,
    "taxe_salaires_employeur": 0.075,
    "retenue_dividendes_residents": 0.20,
    "retenue_dividendes_non_residents_cemac": 0.05,
    "retenue_dividendes_hors_cemac": 0.20
  },
  "echeances": {
    "tva": "15 du mois suivant",
    "irpp_salaires": "15 du mois suivant",
    "is_declaration": "30 avril",
    "is_acompte_1": "15 mai",
    "is_acompte_2": "15 août",
    "is_acompte_3": "15 novembre",
    "patente": "31 décembre",
    "cnps": "mensuel"
  },
  "foncier": {
    "bati_ndjamena": 0.10,
    "bati_autres": 0.08,
    "non_bati_ndjamena": 0.21,
    "non_bati_autres": 0.20
  }
}
```

---

## 5. Modèle de commercialisation

### Freemium open-source

**Gratuit (GitHub public) :**
- `SKILL.md` complet
- Profil `chad.json`
- Plan comptable SYSCOHADA basique
- `company.example.json`
- README bilingue FR/EN

**Premium (payant) :**
- Profils multi-pays (Cameroun, Côte d'Ivoire, Sénégal, etc.)
- Scripts de génération automatique d'états financiers
- Templates de déclarations DGI pré-remplies
- Mises à jour automatiques des taux fiscaux
- Support prioritaire

### Distribution
- GitHub public : `wach-ohada`
- Compatible `marketplace.json` agentskill.sh
- README bilingue pour couvrir toute la zone OHADA (17 pays)

---

## 6. Phase 1 — Périmètre

Ce qui est dans le scope de la phase 1 :
- [ ] `comptable/SKILL.md` complet pour le Tchad
- [ ] `profiles/chad.json` avec tous les taux DGI
- [ ] `data/syscohada/plan-comptable.json` (9 classes)
- [ ] `company.example.json` adapté au Tchad
- [ ] `README.md` bilingue
- [ ] `marketplace.json`
- [ ] Structure de repo prête pour extension multi-pays

Ce qui est hors scope phase 1 :
- Scripts de génération d'états financiers
- Profils autres pays
- Système d'évaluation automatisé
- Interface web

---

## 7. Extension future (phases 2+)

- Skill `fiscaliste` — IRPP détaillé, optimisation fiscale OHADA
- Skill `controleur-fiscal` — simulation contrôle DGI Tchad
- Skill `gestionnaire-ohada` — droit des sociétés OHADA, RCCM, actes
- Profils pays : Cameroun, Côte d'Ivoire, Sénégal, Mali, Burkina...
