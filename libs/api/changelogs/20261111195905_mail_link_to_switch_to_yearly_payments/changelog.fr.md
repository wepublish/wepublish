---
title: Lien dans un e-mail pour passer au paiement annuel
lead: Un lien dans un e-mail peut désormais ouvrir directement le passage au paiement annuel. Qui paie chaque mois change en deux clics, sans se connecter d'abord.
---

Ajoute `?switchTo=yearly` au lien vers la page d'un abonnement dans le profil. Avec le jeton de connexion que contient chaque e-mail d'abonnement, la lectrice ou le lecteur arrive connecté sur son abonnement et la confirmation du passage au paiement annuel s'ouvre aussitôt :

```
https://<ton-site>/profile/subscription/{{optional.subscription.id}}?jwt={{jwt}}&switchTo=yearly
```

Le lien convient bien à un e-mail d'un flux d'abonnement limité au paiement mensuel, par exemple quelques jours avant le renouvellement.

Si l'abonnement ne peut pas être changé (il est déjà payé annuellement, résilié ou impayé), la page l'indique au lieu d'ouvrir la confirmation.
