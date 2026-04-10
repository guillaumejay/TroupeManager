---
## Spec — Gestionnaire de Squad Marines (Aliens RPG)

### Contexte

Outil de campagne pour tracker l'état d'une squad de Marines coloniaux au fil des scénarios. Deux besoins principaux: une **liste vivante** des marines avec leurs stats et états, et une **timeline narrative** des événements de campagne.
---

### Partie 1 — Roster des Marines

**Colonnes :**

- Nom / Grade
- Spécialisation (Fusilier, Comtech, Medic, SmartGun, Recon, Sniper, NRBC, Heavy)
- Condition physique (RAS / Blessure légère / Blessure grave / Convalescence / MORT)
- État psychologique (RAS / Léger trouble / Anxieux / Instable / MORT)
- Date de début d'indisponibilité
- Durée / Statut (X jours / Définitive)
- Scénario du décès (si applicable)

**Comportements :**

- Ligne rouge barrée pour les morts, grisée pour les convalescents
- Calcul dynamique : si on entre une date de début + durée en jours → affichage du nombre de jours restants par rapport à la "date courante" de campagne
- Badge coloré par état (vert = RAS, orange = blessé/trouble, rouge = mort)
- Bouton "avancer d'un jour" sur la date de campagne → recalcul automatique de toutes les convalescences

---

### Partie 2 — Timeline de Campagne

**Structure :**

- Axe horizontal chronologique (type "grosse flèche" comme dans le livre de base)
- Chaque scénario = un marqueur vertical sur la timeline avec son nom
- En dessous de chaque marqueur : liste des morts (icône crâne + nom)
- Au-dessus : liste des blessés graves / convalescents à l'issue du scénario
- Navigation : clic sur un scénario → highlight des marines concernés dans le roster

**Données initiales (à intégrer) :**

| Date        | Événement        | Morts                     | Blessés graves       |
| ----------- | ---------------- | ------------------------- | -------------------- |
| 3 mars 2186 | Pionneer Station | Julia (Caporale), Dembele | Mike, Marina, Phoebe |
| 4 mars 2186 | Dead Hills       | Boris                     | Crash Test           |
| 5 mars 2186 | Berkeley's Docks | Mule                      | Eric                 |

---

### Données initiales du roster

| Nom        | Grade    | Spé      | Physique       | Psycho        | Début indispo | Durée      |
| ---------- | -------- | -------- | -------------- | ------------- | ------------- | ---------- |
| Windtalker | Caporal  | Comtech  | RAS            | Léger trouble | —             | —          |
| Badaboum   | 2nd      | Fusilier | RAS            | Anxieux       | —             | —          |
| Quickie    | 2nd      | Recon    | Blessure jambe | RAS           | —             | X jours    |
| Scrabble   | 2nd      | Medic    | RAS            | Léger trouble | —             | —          |
| Crash Test | 2nd      | Fusilier | Convalescence  | Instable      | 4 mars 2186   | 5 jours    |
| Papi       | 2nd      | SmartGun | RAS            | RAS           | —             | —          |
| Mule       | 2nd      | SmartGun | **MORT**       | —             | 5 mars 2186   | Définitive |
| Phoebe     | 2nd      | SmartGun | Convalescence  | RAS           | 3 mars 2186   | 5 jours    |
| Mike       | 2nd      | NRBC     | Convalescence  | RAS           | 3 mars 2186   | 6jours     |
| Marina     | 2nd      | Comtech  | Convalescence  | RAS           | 3 mars 2186   | 5 jours    |
| Vet        | 2nd      | Medic    | RAS            | RAS           | —             | —          |
| Shinji     | 2nd      | Sniper   | RAS            | RAS           | —             | —          |
| Eric       | 2nd      | Fusilier | RAS            | RAS           | 5 mars 2186   | 1 jour     |
| Boris      | 2nd      | Heavy    | **MORT**       | —             | 4 mars 2186   | Définitive |
| Dembele    | 2nd      | SmartGun | **MORT**       | —             | 3 mars 2186   | Définitive |
| Julia      | Caporale | Comtech  | **MORTE**      | —             | 3 mars 2186   | Définitive |

---

### Comportements clés de l'interface

**Date de campagne courante** : affichée en haut, réglable manuellement ou via bouton "+1 jour". Toutes les durées de convalescence se recalculent en temps réel.

**Compteur de jours restants** = (date début + durée) − date courante. Si ≤ 0 → "Opérationnel".

**Ajout de scénario** : formulaire simple (nom du scénario, date, morts, blessés) → ajoute un marqueur sur la timeline + met à jour le roster.

**Export** : bouton pour copier le roster en texte formaté (pour compte-rendu de session).

---

### Stack suggérée

Application React (`.jsx`) avec stockage en mémoire. Pas de backend. Deux onglets : **Roster** et **Timeline**. Persistance optionnelle via `window.storage` si disponible.
