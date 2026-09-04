import { describe, expect, it } from 'vitest';

import { evidenceOf, parseDossier, quotedPhrase } from './dossier';

const inhalt = `---
typ: person
name: Stephanie Eymann
aliasse: [Regierungsrätin Eymann]
mandant: bajour
zuletzt_geprueft: 2026-09-01
---

# Stephanie Eymann

Kompiliert aus dem Bestand des Zettelkastens.

## Amtliches

Aus amtlichen Registern, deterministisch abgeschrieben, ohne Modell.

- Mitglied des Regierungsrats des Kantons Basel-Stadt.
  gueltig: 2021-02-03 bis offen | erfahren: 2026-08-21
  quelle: Liste aller Mitglieder, Staatskanzlei (bs.ch/regierungsrat), rohablage/regierungsrat_bs/2026-08-21T1732, Blatt «Lebensdaten der RR»
  status: gueltig

- Grossrätin (LDP).
  gueltig: 2017-02-01 bis 2021-02-02 | erfahren: 2026-08-25
  quelle: Wahlprotokoll Staatskanzlei BS, von Hand belegt
  herkunft: haus
  status: invalidiert 2026-08-25, ersetzt durch den Eintrag oben

## Amtliche Publikationen

- Am 2025-01-18 im Kantonsblatt publiziert, namentlich genannt: «Grossratsbeschluss betreffend Gesamterneuerungswahlen».
  gueltig: 2025-01-18 bis offen | erfahren: 2026-08-31
  quelle: Amtsblattportal, Publikation RS-BS40-0000000872, rohablage/kantonsblatt_bs/2026-08-31T2016/publikationen_2025-01-18_bis_2025-01-18.json :: RS-BS40-0000000872, Original https://amtsblattportal.ch/api/v1/publications/75462ab9/pdf
  status: gueltig
`;

describe('parseDossier', () => {
  const dossier = parseDossier(inhalt);

  it('reads the yaml head', () => {
    expect(dossier.meta.name).toBe('Stephanie Eymann');
    expect(dossier.meta.typ).toBe('person');
    expect(dossier.meta.zuletzt_geprueft).toBe('2026-09-01');
  });

  it('splits the sections and keeps their notes', () => {
    expect(dossier.sections.map(s => s.title)).toEqual([
      'Amtliches',
      'Amtliche Publikationen',
    ]);
    expect(dossier.sections[0].notes).toEqual([
      'Aus amtlichen Registern, deterministisch abgeschrieben, ohne Modell.',
    ]);
  });

  it('reads every line of a fact', () => {
    const [first, second] = dossier.sections[0].facts;

    expect(first).toEqual({
      statement: 'Mitglied des Regierungsrats des Kantons Basel-Stadt.',
      validFrom: '2021-02-03',
      validTo: 'offen',
      learnedAt: '2026-08-21',
      source:
        'Liste aller Mitglieder, Staatskanzlei (bs.ch/regierungsrat), rohablage/regierungsrat_bs/2026-08-21T1732, Blatt «Lebensdaten der RR»',
      sourceName: 'Liste aller Mitglieder, Staatskanzlei (bs.ch/regierungsrat)',
      evidence: 'rohablage/regierungsrat_bs/2026-08-21T1732',
      original: undefined,
      origin: undefined,
      status: 'gueltig',
      valid: true,
    });
    expect(second.origin).toBe('haus');
    expect(second.evidence).toBeUndefined();
    expect(second.valid).toBe(false);
    expect(second.status).toBe(
      'invalidiert 2026-08-25, ersetzt durch den Eintrag oben'
    );
  });

  it('keeps the zip entry in the evidence and finds the original address', () => {
    const [publication] = dossier.sections[1].facts;

    expect(publication.evidence).toBe(
      'rohablage/kantonsblatt_bs/2026-08-31T2016/publikationen_2025-01-18_bis_2025-01-18.json :: RS-BS40-0000000872'
    );
    expect(publication.original).toBe(
      'https://amtsblattportal.ch/api/v1/publications/75462ab9/pdf'
    );
  });

  it('keeps the publication number in the source name', () => {
    const [publication] = dossier.sections[1].facts;

    expect(publication.sourceName).toBe(
      'Amtsblattportal, Publikation RS-BS40-0000000872'
    );
  });

  it('leaves the source name empty when the line is only a raw-store path', () => {
    const [fact] = parseDossier(
      `## Amtliches

- Etwas.
  quelle: rohablage/regierungsrat_bs/2026-08-21T1732
  status: gueltig
`
    ).sections[0].facts;

    expect(fact.source).toBe('rohablage/regierungsrat_bs/2026-08-21T1732');
    expect(fact.sourceName).toBeUndefined();
  });
});

describe('evidenceOf', () => {
  it('drops the zip entry for the door, which wants the path', () => {
    expect(
      evidenceOf(
        'rohablage/kantonsblatt_bs/2026-08-31T2016/x.json :: RS-BS40-0000000872'
      )
    ).toBe('rohablage/kantonsblatt_bs/2026-08-31T2016/x.json');
    expect(evidenceOf('rohablage/a/b')).toBe('rohablage/a/b');
  });
});

describe('quotedPhrase', () => {
  it('returns the phrase in guillemets, if any', () => {
    expect(
      quotedPhrase('genannt: «Grossratsbeschluss betreffend Wahlen».')
    ).toBe('Grossratsbeschluss betreffend Wahlen');
    expect(quotedPhrase('Mitglied des Regierungsrats.')).toBeUndefined();
  });
});
