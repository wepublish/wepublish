---
title: Un flux de communication peut valoir pour tous les plans d’abonnement
lead: Jusqu’ici, un flux propre appartenait à un seul plan d’abonnement. Un flux peut désormais valoir pour les abonnements correspondants de tous les plans, par exemple un flux pour tous les abonnements annuels. Les mêmes messages n’ont ainsi plus à être configurés pour chaque plan.
---

- **Création.** Sous « Messages automatiques », « Nouveau flux » : choisissez « Tous les plans d’abonnement » au lieu d’un plan, puis les modes de paiement, les durées et le renouvellement auxquels le flux s’applique. Un champ laissé vide ne restreint pas : « Annuel » seul couvre les abonnements annuels avec tout mode de paiement. Au moins un champ doit être rempli.
- **Quel flux reçoit un abonnement.** D’abord un flux de son propre plan, si l’un correspond. Ensuite un flux pour tous les plans. Si aucun ne correspond, le flux standard.
- **Dans la vue d’ensemble.** Les flux pour tous les plans figurent juste après le flux standard et restent visibles lorsque vous filtrez par plan. « Abonnements » ne compte que ceux qu’aucun flux de plan ne prend d’abord.
- **À partir de quand il peut agir.** Comme pour le flux d’un plan : la durée la plus courte de ses conditions fixe le jour le plus tôt. Un flux pour « Annuel » uniquement peut créer des factures jusqu’à 360 jours à l’avance.
- **Pas de chevauchement.** Deux flux pour tous les plans ne peuvent pas valoir pour les mêmes abonnements ; le second est refusé. Un champ vide compte ici comme toute valeur.
- **Une liste groupée.** La vue d’ensemble classe les flux selon ce à quoi ils s’appliquent : « Standard », « Pour tous les plans d’abonnement », puis chaque plan. La liste se filtre par plan d’abonnement.
