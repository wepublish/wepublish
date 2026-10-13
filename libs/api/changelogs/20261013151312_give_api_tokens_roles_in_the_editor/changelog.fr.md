---
title: Les tokens d'API reçoivent leurs rôles dans l'éditeur
lead: En créant un token d'API, vous choisissez désormais les rôles dont il reçoit les autorisations, et vous pouvez modifier les rôles des tokens existants. Jusqu'ici, un token n'avait aucune autorisation, sauf si quelqu'un les inscrivait directement dans la base de données.
---

**Tokens d'API** (Peering → Tokens)

- **Rôles à la création.** Le panneau «Générer un token» propose un choix de rôles. Les programmes utilisant ce token reçoivent exactement les autorisations de ces rôles, les mêmes rôles que ceux des utilisateur·trice·s. Sans rôle, le token ne peut rien faire; le panneau le signale.
- **Colonne «Rôles».** La liste des tokens affiche les rôles de chaque token, ou «Aucun rôle – aucune autorisation».
- **Modifier les rôles.** Le crayon à côté d'un token modifie ses rôles. Les changements s'appliquent immédiatement, y compris aux programmes déjà connectés avec ce token.
- **Conseil:** créez pour un programme un rôle avec uniquement les autorisations nécessaires (p. ex. lire les abonnements pour un export) plutôt que de lui donner le rôle «Admin».
