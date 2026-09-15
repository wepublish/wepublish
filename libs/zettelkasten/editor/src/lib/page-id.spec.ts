import { describe, expect, it } from 'vitest';

import { pageIdFromEvidence } from './page-id';

describe('pageIdFromEvidence', () => {
  it('cuts the tenant and wiki prefix off an evidence path', () => {
    expect(
      pageIdFromEvidence('mandanten/bajour/wiki/personen/cramer_conradin.md')
    ).toBe('personen/cramer_conradin.md');
  });

  it('passes a bare id or a path without wiki through', () => {
    expect(pageIdFromEvidence('cramer_conradin')).toBe('cramer_conradin');
    expect(pageIdFromEvidence('themen/klybeck.md')).toBe('themen/klybeck.md');
  });
});
