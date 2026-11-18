---
title: Vos flux RSS contiennent désormais le texte intégral des articles
lead: Les flux RSS, Atom et JSON de votre site contiennent désormais l'article entier au lieu du seul chapeau. Les banques de données médias comme la Schweizer Mediendatenbank (SMD) et les lecteurs de flux reçoivent ainsi votre texte complet.
---

Jusqu'ici, chaque entrée du flux ne contenait que le chapeau de l'article. Elle contient désormais l'article lui-même :

- le texte, avec ses intertitres et ses citations
- les images avec leurs légendes

Les flux sont disponibles aux adresses `/rss.xml`, `/atom.xml` et `/feed.json` (les anciennes adresses continuent de fonctionner). Les banques de données médias comme la Schweizer Mediendatenbank reprennent les nouveaux articles depuis ces flux : vos articles y arrivent donc désormais en entier.

Les articles gratuits apparaissent toujours en entier. Pour les articles derrière un paywall actif, vous choisissez ce que montrent les flux, sous **Paramètres → Flux** :

- **Le chapeau uniquement** (par défaut) : les articles payants restent comme avant
- **La partie visible avant le paywall** : la même partie qu'un lecteur sans abonnement voit sur votre site
- **Le texte intégral**

Les articles repris d'un autre média We.Publish apparaissent toujours avec leur chapeau uniquement. Une modification apparaît dans les flux en dix minutes au plus.
