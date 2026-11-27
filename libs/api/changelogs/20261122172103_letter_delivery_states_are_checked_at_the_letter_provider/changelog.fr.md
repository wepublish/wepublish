---
title: Le statut de distribution des lettres est vérifié auprès du fournisseur de lettres
lead: « Actualiser les statuts » sous « Messages envoyés » et le traitement nocturne demandent désormais aussi au fournisseur de lettres où en sont les lettres imprimées. Une lettre ne reste donc plus sur un ancien statut lorsqu'un message de statut s'est perdu.
---

Cela concerne les installations qui envoient des lettres imprimées.

- **Messages envoyés :** « Actualiser les statuts » interroge le fournisseur de lettres en plus du fournisseur de messagerie. Le message qui suit indique combien de lettres ont été vérifiées et combien ont été mises à jour.
- **Chaque nuit :** le traitement nocturne fait de même de lui-même. Sous **Journaux des jobs périodiques**, il apparaît comme l'étape « États de distribution des lettres », avec le nombre de lettres vérifiées et mises à jour.
- **Retours :** une lettre remise à la poste est encore vérifiée pendant 30 jours, car une lettre non distribuable est signalée tardivement.

Un message de statut qui arrive en retard ou en double ne ramène plus une lettre à un statut antérieur.
