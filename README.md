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

### Manuel (Claude Code, Cursor, Windsurf)

```bash
git clone https://github.com/wach/wach-ohada.git
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

---

## Avertissement

Ce skill est un outil d'assistance. Il ne remplace pas un expert-comptable inscrit à l'**ONECCA-T**.

---

*MIT License — wach*
