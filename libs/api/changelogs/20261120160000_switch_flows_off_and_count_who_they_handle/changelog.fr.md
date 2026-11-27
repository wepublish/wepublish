---
title: Les flux de communication peuvent être désactivés et montrent à qui ils écrivent encore
lead: Un flux peut désormais être désactivé sans être supprimé, par exemple pour le préparer avant sa mise en service. « Abonnements » ne compte plus que les abonnements auxquels un flux envoie encore des messages, et l’en-tête de la colonne affiche le total.
---

- **Désactiver et activer un flux.** Sous « Messages automatiques », chaque flux sauf le flux standard a une coche dans « Actions » : pleine signifie activé, vide désactivé. Avant de basculer, vous voyez combien d’abonnements passent à d’autres flux, ou combien ce flux reprend. Un flux désactivé est grisé, et sa page l’indique.
- **Où vont les abonnements.** Tant qu’un flux est désactivé, ses abonnements reçoivent les messages du prochain flux correspondant : un flux pour tous les plans, sinon le flux standard. Le flux standard ne peut pas être désactivé.
- **Chevauchements.** Un flux désactivé ne bloque pas les autres. L’activation est refusée s’il couvrait les mêmes abonnements qu’un flux actif.
- **« Abonnements » compte ceux qu’un flux gère encore :** les abonnements en cours, et ceux terminés dont la fin se situe dans le dernier événement du flux, p. ex. 5 jours pour « Désactivation pour facture impayée ». Les abonnements terminés depuis longtemps ne sont plus comptés.
- **Le total dans l’en-tête.** Il compte les abonnements en cours, et les abonnements terminés tant que leur flux leur envoie encore un message. Activer ou désactiver un flux peut donc modifier le total : un abonnement terminé peut passer d’un flux avec des messages ultérieurs à un flux sans. Si la liste est filtrée par plan d’abonnement, chaque chiffre suit le filtre, et le total additionne les lignes affichées.
