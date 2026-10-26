import { render, screen } from '@testing-library/react';

import { renderWith } from '../event-list/test-helpers';
import { pictogramLabels, ProInfirmisSummary } from './pro-infirmis-summary';

vi.mock('react-i18next', async () =>
  (await import('../event-list/test-translate')).i18nMock()
);

describe('pictogramLabels', () => {
  it('reads names from strings and from objects, and ignores the rest', () => {
    expect(
      pictogramLabels([
        'Rollstuhlgerecht',
        { name: 'WC' },
        { Name: 'Parkplatz' },
        { title: 'Hörhilfe' },
        42,
        null,
      ])
    ).toEqual(['Rollstuhlgerecht', 'WC', 'Parkplatz', 'Hörhilfe']);
  });

  it('gives nothing for data that is not a list', () => {
    expect(pictogramLabels(null)).toEqual([]);
    expect(pictogramLabels({ name: 'WC' })).toEqual([]);
  });
});

describe('ProInfirmisSummary', () => {
  it('says when no ProInfirmis entry is linked', () => {
    render(
      renderWith(
        <ProInfirmisSummary
          idSource={null}
          detailUrl={null}
          pictograms={null}
        />
      )
    );

    expect(
      screen.getByText('agenda.venues.proInfirmis.none')
    ).toBeInTheDocument();
  });

  it('shows the synced data read-only with a link to the Ginto entry', () => {
    render(
      renderWith(
        <ProInfirmisSummary
          idSource="poi-42"
          detailUrl="https://www.ginto.guide/entries/42"
          pictograms={['Rollstuhlgerecht', { name: 'WC' }]}
        />
      )
    );

    expect(screen.getByText('Rollstuhlgerecht')).toBeInTheDocument();
    expect(screen.getByText('WC')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /agenda.venues.proInfirmis.open/ })
    ).toHaveAttribute('href', 'https://www.ginto.guide/entries/42');
    expect(
      screen.getByText('agenda.venues.proInfirmis.readOnly')
    ).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  });
});
