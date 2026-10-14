---
title: Les apps savent qui vous êtes
lead: Les apps sous «We.Publish Apps» reçoivent désormais, à l'ouverture, un jeton signé avec votre identité d'éditeur·trice, dans l'éditeur comme dans un nouvel onglet. Une app peut ainsi vous reconnaître comme connecté·e sans second login.
---

**Apps sur le tableau de bord** (Tableau de bord → We.Publish Apps)

- **Un clic, connecté·e.** Quand vous ouvrez une app, l'éditeur lui transmet un jeton signé qui vous identifie (nom, e-mail, rôles). Les apps qui le prennent en charge sautent leur propre login.
- **Les deux façons d'ouvrir.** Les apps intégrées dans l'éditeur et celles qui s'ouvrent dans un nouvel onglet reçoivent le jeton de la même manière.
- **Pas de jeton, pas d'app.** Si aucun jeton ne peut être émis, l'app ne s'ouvre pas et l'éditeur affiche la raison à la place.
- **Pour qui construit une app:** le jeton se trouve dans le fragment de l'URL (`#token=…`), est valable 4 heures et se vérifie via `GET /external-apps/userinfo` ou la clé publique sous `/.well-known/jwks.json`. Il est émis pour l'origine de l'app, de sorte que les apps enregistrées avec un chemin ou une barre oblique finale sont vérifiées aussi.
