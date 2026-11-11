---
title: Le statut de distribution de Mandrill et Mailgun est désormais correctement vérifié
lead: Les mises à jour de statut de votre fournisseur de messagerie (distribué, rejeté, rebond) ne sont acceptées que si elles portent la bonne signature de webhook. Veuillez vérifier une fois que le secret du webhook dans l'éditeur correspond à celui de votre fournisseur.
---

Jusqu'à présent, les mises à jour de statut envoyées par Mandrill ou Mailgun étaient acceptées même lorsque leur signature ne correspondait pas. Désormais, les mises à jour avec une signature incorrecte sont refusées.

**Que faire :** ouvrez **Intégrations → Fournisseur de messagerie** et comparez le **Secret du point de terminaison du webhook** avec la clé de webhook affichée chez votre fournisseur (Mandrill : *Settings → Webhooks*, Mailgun : *Sending → Webhooks → HTTP webhook signing key*). S'ils diffèrent, copiez la clé de votre fournisseur dans l'éditeur.

S'ils ne correspondent pas, les statuts des e-mails restent sur « submitted ». Vous pouvez toujours les récupérer manuellement avec « Actualiser les statuts » dans le journal des e-mails.

Par ailleurs, un e-mail rejeté ou ayant rebondi ne peut plus repasser à « distribué » à la suite d'une mise à jour de statut tardive.
