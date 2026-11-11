---
title: Associer les apps externes à leur clé API
lead: Une app externe qui lit des données de We.Publish peut désormais être associée à sa clé API. Vous voyez ainsi à temps quand cette clé expire ou ne fonctionne plus.
---

Sous **Tableau de bord → Apps**, les paramètres d’une app comportent désormais le champ **Clé API**. Choisissez-y la clé avec laquelle l’app lit les données de We.Publish. La clé elle-même reste enregistrée dans l’app ; We.Publish retient seulement de laquelle il s’agit.

Une fois l’association faite :

- La tuile de l’app sur le tableau de bord et sa page de paramètres avertissent 30 jours avant l’expiration de la clé, puis à nouveau dès qu’elle a expiré ou a été révoquée. À partir de là, l’app ne peut plus lire de données.
- Pour la renouveler, créez une nouvelle clé sous **Paramètres → Clés API**, enregistrez-la dans l’app et associez-la ici. Révoquez ensuite l’ancienne.

Seules les clés visibles dans la liste des clés API peuvent être associées, et seulement tant qu’elles sont valables.
