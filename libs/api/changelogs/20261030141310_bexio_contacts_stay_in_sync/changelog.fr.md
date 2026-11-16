---
title: Les contacts Bexio restent synchronisés
lead: Activez la synchronisation nocturne des contacts dans l’intégration Bexio, et chaque changement de nom, d’entreprise, d’e-mail ou d’adresse d’une personne atteint son contact Bexio la nuit suivante. Les personnes qui paient via Bexio sans contact en obtiennent un.
---

**Ce qui change** (Bexio comme prestataire de paiement ; désactivé jusqu’à ce que vous l’activiez)

- **Transfert nocturne :** dans Intégrations → Prestataires de paiement → Bexio, cochez « Synchroniser les contacts vers Bexio chaque nuit ». Dès lors, les personnes dont les données ont changé depuis le dernier transfert sont mises à jour dans Bexio chaque nuit, et les abonnements payés via Bexio sans contact en reçoivent un. La première nuit transfère une fois toutes les personnes que Bexio connaît déjà.
- **Ce qui est transmis :** nom ou entreprise, prénom, e-mail, rue, numéro, complément d’adresse, code postal, localité et pays. Le pays est associé par son code ; une adresse allemande reçoit donc l’Allemagne au lieu du pays par défaut de l’intégration.
- **Ce qui reste tel quel dans Bexio :** les groupes de contacts, les numéros de téléphone, le second e-mail et tout le reste du contact. Il en va de même pour la mise à jour du contact que Bexio reçoit avec chaque facture.
- **État :** l’info-bulle de l’interrupteur indique la dernière exécution et la première erreur de cette exécution, le cas échéant. Un contact que Bexio ne connaît plus est ignoré et consigné plutôt que créé en double.
