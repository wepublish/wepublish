import { describe, expect, it } from 'vitest';
import { parseDailyReport } from './daily-report';

const entry = `## 2026-09-04 tagesabruf

Mandant: bajour.
Zeitraum: 2026-09-03 bis 2026-09-04.
Zubringer: 24 von 24 durchgelaufen.

Was ist neu:
- Bajour-Archiv, neue Artikel: 8 neue Artikel.
Fristen: 310 amtliche Fristen laufen ab, die nächste am 2026-09-04: Kollokationsplan Beispiel Person.

Nachtlauf vom 2026-09-03T22:34:03: durchgelaufen, 0 Seiten verdichtet, Rueckstand 18.

Lint: 590 Seiten, 5 Fehler, 28094 Warnungen, 0 Hinweise.
  FEHLER   mandanten/bajour/wiki/personen/beispiel.md:1  gueltig endet vor dem Beginn`;

/** The entry of 2026-09-04, read verbatim from the holdings on the server. */
const realEntry = `## 2026-09-04 mittagslauf

Mandant: bajour.
Zubringer für Sokrates: 5 von 5 durchgelaufen.

- Newsletter über den Archiv-Feed (bajour): Angehaengt an /home/.../index/mailchimp_ausgaben.jsonl: 1 Ausgaben.
- Frage des Tages nachfuehren (bajour): Die Kommentare liegen in community/, tilgbar mit werkzeuge/tilgung.py.
- Lueckenwaechter Newsletter: 2 Werktag(e) ohne Ausgabe der Reihe basel-briefing im Fenster von 14 Tagen: 2026-08-28, 2026-09-03.
- Volltextindex: Datei: /home/.../index/volltext.sqlite (640.2 MB)
- Vorlagenprobe: Briefing 1675 vom 2026-09-04: 4 Hauptthemen, 3 Kurznews.`;

describe('parseDailyReport', () => {
  it('keeps the head lines and drops everything that could name a person', () => {
    const [report] = parseDailyReport([entry]);
    expect(report.date).toBe('2026-09-04');
    expect(report.run).toBe('tagesabruf');
    expect(report.feeds).toBe('24 von 24 durchgelaufen.');
    expect(report.lint).toBe(
      '590 Seiten, 5 Fehler, 28094 Warnungen, 0 Hinweise.'
    );
    expect(report.night).toBe(
      'durchgelaufen, 0 Seiten verdichtet, Rueckstand 18.'
    );
    expect(JSON.stringify(report)).not.toContain('Beispiel Person');
  });

  it('tolerates an entry without lint or night line', () => {
    const [report] = parseDailyReport([
      '## 2026-09-03 mittagslauf\n\nZubringer: 5 von 5 durchgelaufen.',
    ]);
    expect(report.run).toBe('mittagslauf');
    expect(report.lint).toBeUndefined();
    expect(report.night).toBeUndefined();
  });

  it('reads the feed line of the real journal, which carries a qualifier before the colon', () => {
    const [report] = parseDailyReport([realEntry]);
    expect(report.date).toBe('2026-09-04');
    expect(report.run).toBe('mittagslauf');
    expect(report.feeds).toBe('5 von 5 durchgelaufen.');
  });

  it('still reads the feed line without a qualifier', () => {
    const [report] = parseDailyReport([
      '## 2026-09-04 tagesabruf\n\nZubringer: 24 von 24 durchgelaufen.',
    ]);
    expect(report.feeds).toBe('24 von 24 durchgelaufen.');
  });

  it('leaves the feed line empty when the word stands in running prose without a colon', () => {
    const [report] = parseDailyReport([
      '## 2026-09-04 tagesabruf\n\nZubringer liefen heute alle durch.',
    ]);
    expect(report.feeds).toBeUndefined();
  });
});
