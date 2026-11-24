---
title: Les clés API agissent au nom de la personne qui les a créées
lead: Une clé API ne peut désormais faire que ce que la personne qui l'a créée a le droit de faire à ce moment-là, et tout ce qu'elle fait mentionne la clé et cette personne. Vérifiez vos clés API une fois après cette mise à jour.
---

Une clé API est utilisée par des programmes qui travaillent avec votre instance, par exemple un import, une caisse ou une application externe. Désormais, la personne qui a créé une clé en répond :

- **Vérifiée à chaque utilisation.** Une clé ne peut faire que ce que sa créatrice ou son créateur a encore le droit de faire. Si cette personne perd un droit, la clé le perd aussi ; si elle est désactivée, supprimée ou ne peut plus créer de clés API, la clé ne fonctionne plus.
- **Enregistrée avec la clé et la personne.** Le **Journal d'audit** affiche les actions faites avec une clé sous la forme « Clé API : nom · e-mail de la personne ». Là où l'éditeur indique qui a fait quelque chose, par exemple dans l'historique du mode d'envoi et dans les **Numéros imprimés**, il ajoute désormais « via la clé API « nom » ».

La liste **Clés API** montre ce que cela signifie pour chaque clé :

- **Bloquée** : la personne n'existe plus, est désactivée ou ne peut plus créer de clés API. Survolez l'étiquette pour en voir la raison. Les programmes qui utilisent cette clé sont refusés.
- **n droits manquants** : la personne n'a plus certains droits de la clé. Survolez l'étiquette pour voir lesquels ; la clé fonctionne toujours pour le reste.

La liste peut désormais aussi être triée par statut, nombre de droits, propriétaire, dernière utilisation et expiration. Pour une clé dont la personne a été supprimée, le propriétaire affiché est « Utilisateur supprimé ».

**Ce qu'il faut faire :** ouvrez une fois **Clés API** et cherchez les clés marquées **Bloquée** ou auxquelles il manque des droits. Si un programme a encore besoin d'une telle clé, faites créer une nouvelle clé par une personne qui a les droits nécessaires et saisissez-la dans le programme.
