---
title: Clés API
lead: Vous pouvez désormais créer des clés API pour qu’un script ou un autre système appelle l’API sans se connecter en tant que personne. Une clé ne porte que les autorisations que vous lui donnez et expire à une date de votre choix.
---

**Paramètres → Clés API**

- **Créer une clé API** demande un nom, les autorisations que la clé doit porter et une date d’expiration. Vous ne pouvez accorder que les autorisations que vous détenez vous-même.
- **Toute clé expire.** La durée maximale est de trois ans, et tout ce qui dépasse un an est signalé comme déconseillé — plus une clé existe longtemps, plus elle reste utilisable en cas de fuite.
- La clé n’est affichée qu’**une seule fois**, juste après sa création. Copiez-la à ce moment-là — elle ne peut plus être récupérée. Si vous la perdez, créez-en une nouvelle.
- La vue d’ensemble commence par le statut — active, expirée ou révoquée — puis le début de la clé, le nombre d’autorisations, sa date d’expiration et sa dernière utilisation. Elle se filtre par statut, et par propriétaire si vous pouvez voir toutes les clés.
- **Révoquer** désactive une clé immédiatement. Tout ce qui l’utilise encore sera refusé.
