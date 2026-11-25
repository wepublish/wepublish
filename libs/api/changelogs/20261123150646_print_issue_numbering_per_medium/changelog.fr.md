---
title: Numéros imprimés : une numérotation à votre façon
lead: Sous Paramètres › Numéros imprimés, vous définissez désormais comment vos numéros imprimés sont numérotés, en recommençant chaque année («6.26») ou en continu («#117»), et comment un numéro s’écrit.
---

Disponible pour les médias dont l’export imprimé est activé. Tant que vous ne modifiez pas ces paramètres, rien ne change.

- **Numérotation** :
  - **Par an** (comme jusqu’ici) : la numérotation recommence à 1 chaque année, p. ex. 6.26.
  - **Continue** : les numéros se suivent d’une année à l’autre, p. ex. #117, #118. Un nouveau numéro et «Dupliquer» proposent le numéro suivant le plus élevé de toutes les années. Le formulaire ne demande plus l’année, car elle découle de la date de parution.
- **Écriture du numéro** : un modèle avec les espaces réservés `{range}` (le numéro, «3/4» pour un numéro double), `{number}` (le premier numéro seulement), `{yy}` et `{yyyy}` (l’année).
  - Trois exemples à reprendre : «6.26» (`{range}.{yy}`), «#117» (`#{range}`), «Nr. 6/2026» (`Nr. {range}/{yyyy}`).
  - Un aperçu montre un numéro simple et un numéro double.
  - Avec une numérotation par an, le modèle doit contenir l’année.
- L’écriture s’applique partout : dans la liste des numéros, dans les noms de fichiers des listes d’impression (`druckliste-117-….csv`) et pour les commandes de numéros isolés dans bexio, qui doivent nommer le numéro de la même façon (p. ex. «Einzelheft #117»).
