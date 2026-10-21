---
title: Brevo comme service d’e-mail
lead: Brevo (anciennement Sendinblue) peut désormais envoyer les e-mails transactionnels de We.Publish. Les rapports de distribution, l’interrogation nocturne et la liste de blocage de Brevo alimentent le statut e-mail comme pour Mandrill et Mailgun.
---

- Choisissez le type BREVO dans l’intégration e-mail et saisissez votre clé API Brevo. Les modèles enregistrés dans Brevo peuvent être importés comme ceux de Mandrill.
- Pour les rapports de distribution, créez dans Brevo un webhook transactionnel vers `/mail-webhooks/<identifiant de l’intégration>?key=<secret>` de votre API, avec le secret saisi comme secret du point de terminaison du webhook. Sans webhook, l’interrogation nocturne récupère les statuts.
