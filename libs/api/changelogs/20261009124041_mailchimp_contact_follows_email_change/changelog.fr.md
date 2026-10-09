---
title: Le contact Mailchimp suit désormais la nouvelle adresse e-mail d'un membre
lead: Lorsque l'adresse e-mail d'un membre change pour une adresse que Mailchimp connaît déjà, son contact Mailchimp passe désormais à la nouvelle adresse. Auparavant, le membre sortait de la synchronisation Mailchimp.
---

**Modifier l'adresse e-mail d'un membre**

Cela vaut que vous modifiiez l'adresse dans l'éditeur ou que le membre la modifie lui-même.

- **Le contact du membre suit.** Il conserve son historique, ses tags et ses groupes de newsletter et continue sous la nouvelle adresse e-mail. La synchronisation Mailchimp nocturne le met à jour comme d'habitude.
- **L'autre contact est archivé.** Le contact que Mailchimp avait déjà pour la nouvelle adresse est archivé sous `moved-…@wepublish.ch`. Vous pouvez le restaurer dans Mailchimp si nécessaire.
- **Seulement si les deux contacts sont abonnés.** Si le contact de la nouvelle adresse est désabonné, nettoyé ou en attente, rien n'est déplacé et le membre apparaît sous « Erreurs de synchronisation ». Vous décidez ainsi quel contact garder.
- **Les membres dont le changement d'adresse a échoué avant cette mise à jour** restent listés sous « Erreurs de synchronisation ». Corrigez leurs contacts une fois dans Mailchimp, puis supprimez l'entrée.

**Des erreurs de synchronisation plus claires**

- Sous Intégrations → Mailchimp Sync → « Erreurs de synchronisation », une erreur indique désormais la raison donnée par Mailchimp, là où il n'était écrit que « see the 'errors' array » – par exemple quel champ a été refusé, ou que Mailchimp ne modifie l'adresse e-mail que des contacts abonnés.
- Chaque synchronisation ignore un membre qui y figure, jusqu'à ce que vous ayez corrigé la cause et supprimé l'entrée.
