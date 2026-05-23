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
