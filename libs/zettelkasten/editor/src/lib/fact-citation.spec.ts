import { describe, expect, it } from 'vitest';

import { formatFactCitation } from './fact-citation';

const labels = { source: 'Quelle', asOf: 'Stand' };

describe('formatFactCitation', () => {
  it('quotes the statement verbatim and names source and date', () => {
    const text = formatFactCitation(
      {
        statement: 'Mitglied des Regierungsrats.',
        source: 'Staatskanzlei',
        learnedAt: '2026-08-21',
        valid: true,
      },
      labels
    );
    expect(text).toBe(
      '«Mitglied des Regierungsrats.» (Quelle: Staatskanzlei, Stand 2026-08-21)'
    );
  });

  it('adds the original address for official publications', () => {
    const text = formatFactCitation(
      {
        statement: 'Baugesuch eingereicht.',
        source: 'Kantonsblatt BS',
        learnedAt: '2026-09-01',
        original: 'https://amtsblattportal.ch/#!/search/publications/detail/1',
        valid: true,
      },
      labels
    );
    expect(text).toContain(
      'https://amtsblattportal.ch/#!/search/publications/detail/1'
    );
  });

  it('never invents a date or a source', () => {
    expect(
      formatFactCitation({ statement: 'Etwas.', valid: true }, labels)
    ).toBe('«Etwas.»');
  });

  it('names the source without the raw-store path parseDossier leaves in it', () => {
    const text = formatFactCitation(
      {
        statement: 'Mitglied des Regierungsrats des Kantons Basel-Stadt.',
        source:
          'Liste aller Mitglieder, Staatskanzlei (bs.ch/regierungsrat), rohablage/regierungsrat_bs/2026-08-21T1732, Blatt «Lebensdaten der RR»',
        learnedAt: '2026-08-21',
        valid: true,
      },
      labels
    );
    expect(text).toBe(
      '«Mitglied des Regierungsrats des Kantons Basel-Stadt.» (Quelle: Liste aller Mitglieder, Stand 2026-08-21)'
    );
  });
});
