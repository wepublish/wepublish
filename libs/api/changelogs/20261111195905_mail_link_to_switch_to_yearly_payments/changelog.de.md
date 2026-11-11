---
title: Mail-Link zur Umstellung auf jährliche Zahlung
lead: Ein Link in einem Mail kann neu direkt die Umstellung auf jährliche Zahlung öffnen. Wer monatlich zahlt, wechselt mit zwei Klicks, ohne sich zuerst einzuloggen.
---

Hänge `?switchTo=yearly` an den Link zur Seite eines Abos im Profil. Zusammen mit dem Login-Token, das jedes Abo-Mail hat, landet die Leserin oder der Leser eingeloggt beim eigenen Abo, und die Bestätigung zur Umstellung auf jährliche Zahlung öffnet sich sofort:

```
https://<deine-website>/profile/subscription/{{optional.subscription.id}}?jwt={{jwt}}&switchTo=yearly
```

Gut passt der Link in ein Mail eines Abo-Flows, der auf monatliche Zahlung beschränkt ist, zum Beispiel einige Tage vor der Erneuerung.

Kann das Abo nicht umgestellt werden (es wird bereits jährlich bezahlt, ist gekündigt oder unbezahlt), sagt die Seite das, statt die Bestätigung zu öffnen.
