---
title: Les données personnelles des URL restent loin d’Umami
lead: Tu peux maintenant indiquer des paramètres d’URL qu’Umami ne reçoit jamais, par exemple l’adresse e-mail qu’une newsletter ajoute à ses liens.
actionRequired: false
---

Sous *Paramètres du site → Analytics*, la section Umami a un nouveau panneau **Avancé**. Ajoute-y les noms des paramètres d’URL à écarter, comme `mail`, `firstName` ou `lastName`. Ils sont retirés de l’adresse de la page et du référent avant tout envoi à Umami. Tous les autres paramètres, comme les paramètres de campagne `utm_`, restent suivis.

La liste est facultative : tant qu’elle est vide, Umami suit tout comme avant. La casse des noms de paramètres compte.
