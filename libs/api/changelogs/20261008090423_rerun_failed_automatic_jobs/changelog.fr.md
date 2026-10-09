---
title: Relancer les jobs échoués, des messages d'erreur plus clairs
lead: Lorsque les jobs nocturnes des abonnements échouent, un admin peut désormais les relancer depuis le tableau de bord, et ils rattrapent toutes les nuits manquées jusqu'à aujourd'hui. Les messages d'erreur indiquent désormais quel prestataire a échoué et où.
---

**Relancer les jobs échoués**

- **«Relancer» sur un job échoué.** Les admins voient le bouton sur le job échoué dans l'encadré «Notifications» du tableau de bord et sur la page «Notifications», onglet «Journal des jobs périodiques». La nuit échouée est exécutée à nouveau, puis toutes les nuits manquées depuis, aujourd'hui inclus. L'exécution se poursuit en arrière-plan, vous pouvez quitter la page.
- **Vous voyez quand un job est en cours.** Un job en cours affiche «En cours» et se met à jour tout seul jusqu'à la fin, même s'il a été lancé par la planification nocturne.
- **Jamais deux exécutions en même temps.** Tant qu'un job est en cours, aucun autre ne peut être lancé, ni automatiquement ni à la main. Ainsi, les renouvellements ne sont pas débités deux fois.
- **Un job interrompu par un redémarrage du serveur** apparaît comme échoué après environ deux minutes et peut être relancé immédiatement.

**Des messages d'erreur plus clairs**

- **Lorsqu'un job échoue, le message indique ce qui s'est mal passé et où:** quel prestataire de paiement ou d'e-mail a échoué, à quelle étape et pour quel abonnement ou quelle facture. Auparavant, il n'affichait souvent qu'un code comme `401 Unauthorized`. Vous le voyez dans le journal des jobs, et l'équipe We.Publish le voit aussi.
- **Un débit échoué conserve sa raison** sur le paiement, lisible au lieu de vide.

**E-mail «Échec du renouvellement»**

- Si le débit échoue en raison d'un problème technique chez le prestataire de paiement, `errorCode` dans l'e-mail «Échec du renouvellement» vaut désormais `payment-provider-error`. Auparavant, il pouvait contenir des détails techniques du prestataire. Vérifiez votre modèle s'il affiche `errorCode`.

**Un statut de distribution plus fiable**

- Les rapports de distribution de Mailgun et Mailchimp (Mandrill) ne sont plus acceptés qu'avec une signature valide. Si le «Secret du point de terminaison du webhook» de votre intégration e-mail ne correspond pas à la clé de signature du webhook dans Mailgun ou Mandrill, le statut de distribution n'est plus mis à jour.
