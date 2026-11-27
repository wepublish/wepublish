---
title: Druckausgaben: nummeriert, wie ihr es wollt
lead: Unter Einstellungen › Druckausgaben legt ihr jetzt fest, wie eure gedruckten Ausgaben nummeriert werden, jedes Jahr neu («6.26») oder fortlaufend («#117»), und wie eine Ausgabe geschrieben wird.
---

Verfügbar für Medien, bei denen der Druckexport eingeschaltet ist. Solange ihr die Einstellungen nicht ändert, bleibt alles wie bisher.

- **Nummerierung**:
  - **Pro Jahr** (wie bisher): Die Nummern beginnen jedes Jahr bei 1, z. B. 6.26.
  - **Fortlaufend**: Die Nummern laufen über die Jahre weiter, z. B. #117, #118. Eine neue Ausgabe und «Duplizieren» schlagen die nächste Nummer nach der höchsten aller Jahre vor. Das Formular fragt nicht mehr nach dem Jahr, denn es ergibt sich aus dem Erscheinungsdatum.
- **Schreibweise der Ausgabe**: eine Vorlage mit den Platzhaltern `{range}` (die Nummer, bei Doppelnummern «3/4»), `{number}` (nur die erste Nummer), `{yy}` und `{yyyy}` (das Jahr).
  - Drei Beispiele zum Übernehmen: «6.26» (`{range}.{yy}`), «#117» (`#{range}`), «Nr. 6/2026» (`Nr. {range}/{yyyy}`).
  - Eine Vorschau zeigt eine einfache und eine Doppelnummer.
  - Bei Nummern pro Jahr muss die Vorlage das Jahr enthalten.
- Die Schreibweise gilt überall: in der Ausgabenliste, in den Dateinamen der Drucklisten (`druckliste-117-….csv`) und bei Einzelheft-Bestellungen in bexio, die die Ausgabe gleich nennen müssen (z. B. «Einzelheft #117»).
