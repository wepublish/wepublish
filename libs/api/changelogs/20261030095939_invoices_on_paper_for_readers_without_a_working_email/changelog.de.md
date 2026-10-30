---
title: Rechnungen auf Papier für Leser:innen ohne funktionierende E-Mail
lead: Personen mit Zustellkanal Brief erhalten ihre Erneuerungsrechnung neu gedruckt aus bexio, zusammen mit dem Rechnungsbrief. Zahlungen in bexio werden jede Nacht übernommen, eine bezahlte Erneuerung verlängert das Abo von selbst.
---

**Was sich ändert** (mit bexio als Zahlungsanbieter; der gedruckte Teil braucht den Brief-Flow für dein Medium)

- **Rechnungsbriefe:** Für eine Person mit Zustellkanal Brief und Schweizer Adresse wird die Erneuerungsrechnung in bexio ohne E-Mail ausgestellt, und ihr PDF samt Einzahlungsschein wird nach dem Brief «Rechnung erstellt» gedruckt. Dafür im Abo-Flow beim Ereignis «Rechnungserstellung» «Auch per Brief» einschalten und in der bexio-Integration «Rechnung als offen markieren» eingeschaltet lassen.
- **Zahlungen:** Jede Erneuerungsrechnung, die bexio erstellt, bleibt in We.Publish als Zahlung hinterlegt. Die nächtliche Prüfung markiert sie als bezahlt, sobald sie in bexio bezahlt ist, verlängert das Abo und verschickt die Mitteilung zur erfolgreichen Erneuerung. Niemand muss diese Rechnungen von Hand als bezahlt markieren. Beim Deaktivieren eines Abos wird auch seine offene bexio-Rechnung storniert.
- **Fehlende Briefe werden nachgeholt:** Jede Nacht werden offene Rechnungen von Personen mit Zustellkanal Brief verschickt, für die noch kein Brief angekommen ist – ob der Druckdienst den Brief abgelehnt hat, das PDF nicht verfügbar war oder die Person erst nach dem E-Mail-Versand auf Brief umgestellt wurde. Nach drei Ablehnungen bleibt die Rechnung zur Prüfung liegen.
- **Erneuern im Editor** (optional, pro Medium von We.Publish freigeschaltet): «Erneuern» und «Reaktivieren» bei einem Abo erstellen die Rechnung dann sofort in bexio und verschicken die Rechnungsmitteilung oder den Brief, wie es der nächtliche Lauf tut.
