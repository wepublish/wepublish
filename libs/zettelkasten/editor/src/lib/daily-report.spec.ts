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
});
