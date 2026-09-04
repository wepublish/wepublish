import { describe, expect, it } from 'vitest';

import { formatFactCitation } from './fact-citation';

const labels = { source: 'Quelle', asOf: 'Stand' };

describe('formatFactCitation', () => {
  it('quotes the statement verbatim and names source and date', () => {
    const text = formatFactCitation(
      {
        statement: 'Mitglied des Regierungsrats.',
        source: 'Staatskanzlei',
        sourceName: 'Staatskanzlei',
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
        sourceName: 'Kantonsblatt BS',
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

  it('names the whole source, not only its first comma-separated part', () => {
    const text = formatFactCitation(
      {
        statement: 'Mitglied des Regierungsrats des Kantons Basel-Stadt.',
        source:
          'Liste aller Mitglieder, Staatskanzlei (bs.ch/regierungsrat), rohablage/regierungsrat_bs/2026-08-21T1732, Blatt «Lebensdaten der RR»',
        sourceName:
          'Liste aller Mitglieder, Staatskanzlei (bs.ch/regierungsrat)',
        learnedAt: '2026-08-21',
        valid: true,
      },
      labels
    );
    expect(text).toBe(
      '«Mitglied des Regierungsrats des Kantons Basel-Stadt.» (Quelle: Liste aller Mitglieder, Staatskanzlei (bs.ch/regierungsrat), Stand 2026-08-21)'
    );
  });

  it('leaves out the source when the quelle line was only a raw-store path', () => {
    const text = formatFactCitation(
      {
        statement: 'Etwas.',
        source: 'rohablage/regierungsrat_bs/2026-08-21T1732',
        learnedAt: '2026-08-21',
        valid: true,
      },
      labels
    );
    expect(text).toBe('«Etwas.» (Stand 2026-08-21)');
  });
});
