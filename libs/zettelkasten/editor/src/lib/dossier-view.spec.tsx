import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { parseDossier } from './dossier';
import { DossierView } from './dossier-view';

const inhalt = `---
name: Stephanie Eymann
zuletzt_geprueft: 2026-09-01
---

## Amtliches

- Mitglied des Regierungsrats.
  gueltig: 2021-02-03 bis offen | erfahren: 2026-08-21
  quelle: Staatskanzlei, rohablage/regierungsrat_bs/2026-08-21T1732
  status: gueltig

- Grossrätin (LDP).
  gueltig: 2017-02-01 bis 2021-02-02 | erfahren: 2026-08-25
  quelle: von Hand belegt
  herkunft: haus
  status: invalidiert 2026-08-25, ersetzt durch den Eintrag oben
`;

describe('DossierView', () => {
  it('shows every fact with its source and hands the fact to the evidence callback', () => {
    const onShowEvidence = vi.fn();
    render(
      <DossierView
        dossier={parseDossier(inhalt)}
        beleg="mandanten/bajour/wiki/personen/eymann_stephanie.md"
        onShowEvidence={onShowEvidence}
      />
    );

    expect(screen.getByText('Mitglied des Regierungsrats.')).toBeTruthy();
    expect(screen.getByText(/rohablage\/regierungsrat_bs/)).toBeTruthy();
    expect(screen.getByText('Grossrätin (LDP).')).toBeTruthy();
    expect(
      screen.getByText('invalidiert 2026-08-25, ersetzt durch den Eintrag oben')
    ).toBeTruthy();

    // Only the fact with a raw-store path offers evidence; the in-house one has none.
    const buttons = screen.getAllByRole('button', {
      name: 'zettelkasten.showEvidence',
    });
    expect(buttons).toHaveLength(1);

    fireEvent.click(buttons[0]);

    expect(onShowEvidence).toHaveBeenCalledWith(
      expect.objectContaining({
        evidence: 'rohablage/regierungsrat_bs/2026-08-21T1732',
      })
    );
  });
});
