---
title: Gérer les intégrations dans l’éditeur
lead: Les prestataires de paiement, de messagerie, de captcha et de pixels de suivi se configurent désormais entièrement sous Réglages → Intégrations, et une modification prend effet dès l’enregistrement — sans déploiement, sans attente.
---

Jusqu’ici, la liste des prestataires disponibles était figée dans un fichier de configuration que seul votre partenaire d’hébergement pouvait modifier. Cette liste est maintenant dans l’éditeur.

**Ce qui est désormais possible**

- **Ajouter et retirer vous-même** des prestataires de paiement et des pixels de suivi, sous *Réglages → Intégrations*.
- **Changer le type** de votre prestataire de messagerie ou de captcha — par exemple de Mailchimp à SMTP, ou de Turnstile à hCaptcha.
- **Définir la durée de validité d’une connexion**, sous *Réglages → Connexion*.

**Le retrait est volontairement prudent**

Un prestataire retiré disparaît des listes, de sorte que plus rien de nouveau ne peut être configuré avec lui — mais il continue de fonctionner en arrière-plan. Un paiement en cours de traitement n’est pas interrompu, et une facture de l’an dernier affiche toujours le prestataire qui a encaissé. Si vous le rajoutez plus tard, sa configuration est intacte.

**Changer de type efface la configuration**

Les identifiants d’un prestataire n’ont aucun sens pour un autre : changer le type les supprime. L’éditeur vous demande confirmation au préalable.

**Après la mise à jour**

Vos prestataires existants sont repris tels quels. Cela vaut tout de même la peine d’ouvrir une fois *Réglages → Intégrations* pour vérifier que la liste correspond à ce que vous proposez réellement — les prestataires configurés autrefois et depuis longtemps inutilisés n’y figurent plus.
