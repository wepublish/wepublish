import { MockedProvider } from '@apollo/client/testing';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ZettelkastenSearchDocument } from '@wepublish/editor/api';
import { describe, expect, it, vi } from 'vitest';

import { ZettelkastenPanel } from './zettelkasten-panel';

const treffer = {
  mandant: 'bajour',
  suche: 'Conradin Cramer',
  gesamt: 1,
  treffer: [
    {
      titel: 'Conradin Cramer',
      quelle: 'staatskalender.bs.ch/api',
      datum: '2026-08-25',
      reihe: 'personen',
      beleg: 'mandanten/bajour/wiki/personen/cramer_conradin.md',
      stelle: 'Regierungspräsident des Kantons Basel-Stadt.',
    },
  ],
};

const mocks = [
  {
    request: {
      query: ZettelkastenSearchDocument,
      variables: { query: 'Conradin Cramer', limit: 20, offset: 0 },
    },
    result: { data: { zettelkastenSearch: treffer } },
  },
];

describe('ZettelkastenPanel', () => {
  it('searches when a fact anchor is clicked and shows every hit with its evidence', async () => {
    render(
      <MockedProvider
        mocks={mocks}
        addTypename={false}
      >
        <ZettelkastenPanel
          anchors={['Conradin Cramer']}
          onClose={vi.fn()}
        />
      </MockedProvider>
    );

    fireEvent.click(screen.getByText('Conradin Cramer'));

    await waitFor(() =>
      expect(
        screen.getByText('Regierungspräsident des Kantons Basel-Stadt.')
      ).toBeTruthy()
    );
    expect(
      screen.getByText('mandanten/bajour/wiki/personen/cramer_conradin.md')
    ).toBeTruthy();
  });
});
