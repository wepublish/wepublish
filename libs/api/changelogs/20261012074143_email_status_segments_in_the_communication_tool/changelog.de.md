---
title: E-Mail-Status im Kommunikations-Tool
lead: Der Empfängerfilter weiss jetzt, ob eine Adresse noch funktioniert. «Platzhalter» und «Nicht erreichbar» erreichen alle per Brief, «Unbekannt» versucht es per Mail – und das Ergebnis eines Versands steht beim Auftrag.
---

Jede Person trägt neu einen **E-Mail-Status**, der automatisch aus den Rückmeldungen des Mail-Providers und der eigenen Aktivität abgeleitet wird:

- **Aktiv** – hat sich kürzlich angemeldet oder in einer Mail einen Link geklickt.
- **Unbekannt** – noch nichts entschieden.
- **Reagiert nicht** – Mails wurden zugestellt, aber seit längerem kein Login und kein Klick (wie lange, steht unter *Einstellungen → E-Mail-Qualität*).
- **Nicht erreichbar** – die Adresse ist gebounct oder ungültig, die Person hat sich beschwert oder abgemeldet.
- **Platzhalter** – eine generierte Adresse aus einem Import; diese Personen sind nur per Brief erreichbar.

**Kommunikations-Tool:** Der Schritt «Zielgruppe» zeigt, wie sich die gewählte Zielgruppe auf diese Status verteilt, und lässt einen oder mehrere davon auswählen. Ein Brief an *Platzhalter + Nicht erreichbar* geht an alle, die per Mail sicher nicht ankommen; eine Mail an *Unbekannt* ist der erste Durchgang, dessen Bounces danach von selbst in den Status landen.

**Ergebnis eines Versands:** Ein Auftrag zeigt neu, wie viele Mails zugestellt und geklickt wurden, wie viele gebounct sind und wie viele Empfänger:innen inzwischen als nicht erreichbar gelten. Bounces treffen über Stunden oder Tage ein; «Status aktualisieren» holt nach, was der Provider noch nicht gemeldet hat, und bewertet alle neu. Dasselbe passiert jede Nacht automatisch.

Der Status wird auch auf der Benutzerseite unter der E-Mail-Adresse angezeigt. Wird eine Adresse geändert, beginnt ihr Status von vorn.
