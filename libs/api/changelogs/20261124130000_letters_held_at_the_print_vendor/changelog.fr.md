---
title: Les lettres retenues chez le prestataire d'impression ont leur propre statut et ne sont plus envoyées deux fois
lead: Une lettre que le prestataire d'impression a acceptée mais retient pour qu'une personne l'examine apparaît désormais comme « Action requise » au lieu de « rejected ». We.Publish ne remet plus une telle lettre une seconde fois.
---

**Nouveau statut « Action requise ».** Lorsque le prestataire d'impression accepte une lettre mais ne l'imprime pas, par exemple parce que sa vérification du PDF a échoué, la liste des messages envoyés affiche la lettre comme **actionRequired**, avec la raison du prestataire dans la colonne **Erreur**. La lettre se trouve chez le prestataire. Ouvrez-la là-bas et corrigez-la, validez-la ou supprimez-la ; le statut dans We.Publish suit de lui-même. **rejected** signifie désormais uniquement qu'une lettre n'est jamais arrivée chez le prestataire.

**Plus de doublons chez le prestataire.** Jusqu'ici, une lettre de facture retenue était remise à nouveau, jusqu'à trois fois, et constituait à chaque fois une lettre supplémentaire. Ce que le prestataire détient déjà n'est plus remis à nouveau. Seule une lettre qui n'a pas pu être remise du tout est encore retentée les nuits suivantes.

**Cela dépend de « Envoyer les lettres automatiquement »** dans l'intégration des lettres :

- **Désactivé** (quelqu'un confirme chaque lettre chez le prestataire) : une lettre retenue reste où elle est jusqu'à ce que quelqu'un s'en occupe là-bas.
- **Activé** : la nuit suivante, We.Publish interroge le prestataire sur la lettre de facture retenue. Si personne ne s'en est occupé, la lettre y est supprimée et une nouvelle est postée à sa place, trois lettres au maximum en tout. Une lettre que quelqu'un a corrigée, envoyée ou supprimée chez le prestataire n'est pas touchée.

**Bon à savoir.** Une lettre supprimée chez le prestataire avant d'être imprimée apparaît comme **canceled**, et rien n'est posté à sa place. Les lettres enregistrées comme « rejected » alors que le prestataire les détient apparaissent comme **actionRequired** à partir de cette mise à jour.
