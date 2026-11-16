---
title: Les listes de blocage du service d’e-mail comptent dans le statut e-mail
lead: Les adresses auxquelles votre service d’e-mail ne distribue plus, quel que soit le système qui a envoyé l’e-mail, sont désormais « injoignables » dans We.Publish, et les statuts de distribution Mailgun sont récupérés comme ceux de Mandrill.
---

- Chaque nuit et lors d’« Actualiser les statuts », We.Publish lit les listes de blocage du service d’e-mail : la liste de rejet de Mandrill, les rebonds, plaintes et désabonnements de Mailgun. Une adresse qui y figure est « injoignable », même si l’e-mail rejeté n’a pas été envoyé par We.Publish.
- Un désabonnement d’un seul tag Mailgun compte comme un désabonnement, pas comme une adresse injoignable.
- Pour Mailgun, les statuts de distribution tardifs sont désormais récupérés via l’API des événements lorsque le webhook n’est pas arrivé, comme c’était déjà le cas pour Mandrill.
