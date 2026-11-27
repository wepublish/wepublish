---
title: Vérifier le lien dans l’e-mail de changement d’adresse
lead: Lorsque des lecteur·rices changent leur adresse e-mail, l’e-mail de confirmation est désormais envoyé à la nouvelle adresse et son lien ouvre une page dédiée. Veuillez vérifier que votre modèle d’e-mail y renvoie.
---

**Ce qu’il faut faire**

Ouvrez le modèle d’e-mail utilisé pour le changement d’adresse e-mail et assurez-vous que le lien est le suivant :

`https://<votre site>/confirm-email?token={{jwt}}`

Un lien vers le profil de la forme `…/profile?jwt={{jwt}}&confirmEmailChange=…` continue de fonctionner et est redirigé vers la nouvelle page. Tout autre lien ne confirme plus l’adresse.

**Ce qui change pour vos lecteur·rices**

- L’e-mail de confirmation est envoyé à la nouvelle adresse : seule une personne qui peut lire cette boîte peut confirmer.
- Après la confirmation, les lecteur·rices connecté·es arrivent dans leur profil ; la connexion est proposée aux autres.
