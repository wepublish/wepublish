---
title: Le rôle Editor ne gère plus que ses propres clés API
lead: Les utilisateurs ayant le rôle Editor ne voient et ne révoquent plus que les clés API qu’ils ont créées eux-mêmes. Les administrateurs voient et révoquent toujours toutes les clés.
---

Jusqu’à présent, le rôle **Editor** pouvait voir et révoquer les clés API de tous les utilisateurs sous **Paramètres → Clés API**. Une personne qui n’a que ce rôle n’y voit désormais plus que ses propres clés et ne peut révoquer que celles-ci.

Pour permettre à quelqu’un de gérer les clés d’autres personnes, attribuez-lui un rôle avec les autorisations *Allows to get the api tokens of every user* et *Allows to revoke the api tokens of every user*.
