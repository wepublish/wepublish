---
title: Bexio-Kontakte bleiben synchron
lead: Schalte in der Bexio-Integration die nächtliche Kontakt-Übertragung ein, und jede Änderung an Name, Firma, E-Mail oder Adresse einer Person erreicht in der folgenden Nacht ihren Bexio-Kontakt. Wer über Bexio bezahlt und noch keinen Kontakt hat, bekommt einen.
---

**Was sich ändert** (Bexio als Zahlungsanbieter; aus, bis du es einschaltest)

- **Nächtliche Übertragung:** Unter Integrationen → Zahlungsanbieter → Bexio «Kontakte nächtlich nach Bexio übertragen» ankreuzen. Ab dann werden jede Nacht alle Personen, deren Daten sich seit der letzten Übertragung geändert haben, in Bexio aktualisiert, und für Abos mit Bexio-Zahlung ohne Kontakt wird einer angelegt. In der ersten Nacht werden alle Personen, die Bexio bereits kennt, einmal übertragen.
- **Was übertragen wird:** Name oder Firma, Vorname, E-Mail, Strasse, Hausnummer, Adresszusatz, PLZ, Ort und Land. Das Land wird über seinen Code zugeordnet, eine deutsche Adresse bekommt also Deutschland statt des Standardlands der Integration.
- **Was in Bexio bleibt, wie es ist:** Kontaktgruppen, Telefonnummern, die zweite E-Mail und alles Weitere im Kontakt. Das gilt auch für die Kontakt-Aktualisierung, die Bexio mit jeder Rechnung bekommt.
- **Status:** Der Hinweis beim Schalter zeigt, wann die Übertragung zuletzt lief und den ersten Fehler dieses Laufs, falls es einen gab. Ein Kontakt, den Bexio nicht mehr kennt, wird übersprungen und protokolliert statt doppelt angelegt.
