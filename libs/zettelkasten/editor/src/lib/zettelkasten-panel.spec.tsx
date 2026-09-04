import { MockedProvider } from '@apollo/client/testing';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import {
  ZettelkastenAnchorsDocument,
  ZettelkastenArchiveDocument,
  ZettelkastenSearchDocument,
} from '@wepublish/editor/api';
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
  {
    request: {
      query: ZettelkastenAnchorsDocument,
      variables: { anchors: ['Conradin Cramer'] },
    },
    result: {
      data: {
        zettelkastenAnchors: {
          anchors: [{ anchor: 'Conradin Cramer', hits: 3 }],
        },
      },
    },
  },
];

const anchorsMock = {
  request: {
    query: ZettelkastenAnchorsDocument,
    variables: { anchors: ['Conradin Cramer', 'Liebe Grüsse'] },
  },
  result: {
    data: {
      zettelkastenAnchors: {
        anchors: [
          { anchor: 'Conradin Cramer', hits: 3 },
          { anchor: 'Liebe Grüsse', hits: 0 },
        ],
      },
    },
  },
};

const archive = {
  gesamt: 146,
  treffer_je_quelle: { archiv: 71, newsletter: 75 },
  treffer: [
    {
      titel: 'Wohnschutz: Kommt das noch gut?',
      quelle: 'archiv',
      datum: '2024-02-09',
      reihe: 'artikel',
      beleg: 'rohablage/bajour_archiv/2026-08-21T1622/artikel_4338.json',
      stelle: 'Der Wohnschutz, die Gesetzgebung, die festlegt ...',
    },
  ],
};

const archiveMock = {
  request: {
    query: ZettelkastenArchiveDocument,
    variables: {
      query: 'Conradin Cramer',
      source: 'beides',
      limit: 5,
      offset: 0,
    },
  },
  result: { data: { zettelkastenArchive: archive } },
};

const archiveErrorMock = {
  request: archiveMock.request,
  error: new Error('Das Bearer-Token fehlt oder stimmt nicht.'),
};

describe('ZettelkastenPanel', () => {
  it('searches when a fact anchor is clicked and shows every hit with its evidence', async () => {
    render(
      <MockedProvider
        mocks={[...mocks, archiveMock]}
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

  it('shows what the medium already reported, with counts per source', async () => {
    render(
      <MockedProvider
        mocks={[...mocks, archiveMock]}
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
        screen.getByText('Wohnschutz: Kommt das noch gut? · 2024-02-09')
      ).toBeTruthy()
    );
    expect(
      screen.getByText(
        'rohablage/bajour_archiv/2026-08-21T1622/artikel_4338.json',
        { exact: false }
      )
    ).toBeTruthy();
    // The editor translations are not loaded in the test environment, so
    // t() hands back the key instead of «71 Artikel, 75 Newsletter-Ausgaben».
    expect(screen.getByText('zettelkasten.archive.counts')).toBeTruthy();
  });

  it('says when the archive door refuses, and keeps the wiki hits', async () => {
    render(
      <MockedProvider
        mocks={[...mocks, archiveErrorMock]}
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
        screen.getByText('Das Bearer-Token fehlt oder stimmt nicht.')
      ).toBeTruthy()
    );
    expect(
      screen.getByText('Regierungspräsident des Kantons Basel-Stadt.')
    ).toBeTruthy();
  });

  // The editor translations are not loaded in the test environment, so the
  // chip title is the key instead of «Nicht im Bestand».
  it('marks anchors without a dossier', async () => {
    render(
      <MockedProvider
        mocks={[anchorsMock]}
        addTypename={false}
      >
        <ZettelkastenPanel
          anchors={['Conradin Cramer', 'Liebe Grüsse']}
          onClose={vi.fn()}
        />
      </MockedProvider>
    );

    await waitFor(() =>
      expect(screen.getByTitle('zettelkasten.anchorMissing')).toBeTruthy()
    );
  });
});
