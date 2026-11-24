---
title: Beim Druckdienstleister zurückgehaltene Briefe haben einen eigenen Status und werden nicht doppelt gesendet
lead: Ein Brief, den der Druckdienstleister angenommen hat, aber zur Prüfung durch eine Person zurückhält, erscheint jetzt als «Handlung nötig» statt «rejected». We.Publish übergibt einen solchen Brief nicht mehr ein zweites Mal.
---

**Neuer Status «Handlung nötig».** Nimmt der Druckdienstleister einen Brief an, druckt ihn aber nicht, zum Beispiel weil seine Prüfung des PDFs fehlgeschlagen ist, zeigt die Liste der gesendeten Mitteilungen den Brief als **actionRequired**, mit dem Grund des Dienstleisters in der Spalte **Fehler**. Der Brief liegt beim Druckdienstleister. Öffne ihn dort und korrigiere ihn, gib ihn frei oder lösche ihn; der Status in We.Publish folgt von selbst. **rejected** bedeutet jetzt nur noch, dass ein Brief den Druckdienstleister nie erreicht hat.

**Keine Duplikate mehr beim Druckdienstleister.** Bisher wurde ein zurückgehaltener Rechnungsbrief erneut übergeben, bis zu dreimal, und war dort jedes Mal ein weiterer Brief. Was der Druckdienstleister bereits hat, wird nicht mehr erneut übergeben. Nur ein Brief, der gar nicht übergeben werden konnte, wird in den folgenden Nächten weiterhin erneut versucht.

**Es hängt von «Briefe automatisch versenden»** in der Brief-Integration ab:

- **Aus** (jemand bestätigt jeden Brief beim Druckdienstleister): Ein zurückgehaltener Brief bleibt, wo er ist, bis sich dort jemand darum kümmert.
- **Ein**: In der folgenden Nacht fragt We.Publish beim Druckdienstleister nach dem zurückgehaltenen Rechnungsbrief. Hat sich niemand darum gekümmert, wird der Brief dort entfernt und ein neuer an seiner Stelle aufgegeben, höchstens drei Briefe insgesamt. Ein Brief, den jemand beim Druckdienstleister korrigiert, versendet oder entfernt hat, bleibt unangetastet.

**Gut zu wissen.** Ein Brief, der beim Druckdienstleister gelöscht wurde, bevor er gedruckt war, erscheint als **canceled**, und es wird nichts an seiner Stelle aufgegeben. Briefe, die als «rejected» verzeichnet waren, obwohl sie beim Druckdienstleister liegen, erscheinen ab diesem Update als **actionRequired**.
