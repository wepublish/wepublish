import { InMemoryCache } from '@apollo/client';
import { MockedProvider } from '@apollo/client/testing';
import { render, screen, waitFor } from '@testing-library/react';
import { ZettelkastenDailyReportDocument } from '@wepublish/editor/api';
import { describe, expect, it } from 'vitest';

import { DailyReportCard } from './daily-report-card';

const entry = [
  '## 2026-09-04 nachtlauf',
  'Zubringer: 4 neue Artikel, 2 amtliche Publikationen',
  'Lint: 0 Widersprüche, 3 offene Fragen',
].join('\n');

/** The entry of 2026-09-04, read verbatim from the holdings on the server. */
const realEntry = `## 2026-09-04 mittagslauf

Mandant: bajour.
Zubringer für Sokrates: 5 von 5 durchgelaufen.

- Newsletter über den Archiv-Feed (bajour): Angehaengt an /home/.../index/mailchimp_ausgaben.jsonl: 1 Ausgaben.
- Frage des Tages nachfuehren (bajour): Die Kommentare liegen in community/, tilgbar mit werkzeuge/tilgung.py.
- Lueckenwaechter Newsletter: 2 Werktag(e) ohne Ausgabe der Reihe basel-briefing im Fenster von 14 Tagen: 2026-08-28, 2026-09-03.
- Volltextindex: Datei: /home/.../index/volltext.sqlite (640.2 MB)
- Vorlagenprobe: Briefing 1675 vom 2026-09-04: 4 Hauptthemen, 3 Kurznews.`;

/** The card asks for the last run only, and never through the cache. */
const request = {
  query: ZettelkastenDailyReportDocument,
  variables: { count: 1 },
};

const mockWith = (eintraege: unknown) => [
  {
    request,
    result: { data: { zettelkastenDailyReport: { eintraege } } },
  },
];

const renderCard = (
  mocks: ReturnType<typeof mockWith>,
  cache?: InMemoryCache
) =>
  render(
    <MockedProvider
      mocks={mocks}
      cache={cache}
      addTypename={false}
    >
      <DailyReportCard />
    </MockedProvider>
  );

describe('DailyReportCard', () => {
  it('asks for one run only, so that no more journal entries reach the browser than the card shows', async () => {
    renderCard(mockWith([entry]));

    await waitFor(() =>
      expect(screen.getByText('2026-09-04 · nachtlauf')).toBeTruthy()
    );
  });

  it('shows the feed line of the real journal, whose word carries a qualifier', async () => {
    renderCard(mockWith([realEntry]));

    await waitFor(() =>
      expect(screen.getByText('2026-09-04 · mittagslauf')).toBeTruthy()
    );
    expect(screen.getByText(/5 von 5 durchgelaufen\./)).toBeTruthy();
  });

  // The editor translations are not loaded in the test environment, so t()
  // hands back the key instead of «Kein Eintrag im Rapport ...».
  it('says that nothing is in the holdings instead of rendering an empty list', async () => {
    renderCard(mockWith([]));

    await waitFor(() =>
      expect(screen.getByText('zettelkasten.report.empty')).toBeTruthy()
    );
  });

  it('leaves no journal entry behind in the Apollo cache', async () => {
    const cache = new InMemoryCache({ addTypename: false });
    renderCard(mockWith([entry]), cache);

    await waitFor(() =>
      expect(screen.getByText('2026-09-04 · nachtlauf')).toBeTruthy()
    );
    expect(JSON.stringify(cache.extract())).not.toContain(
      'zettelkastenDailyReport'
    );
  });

  it('survives a payload whose eintraege is not a list', async () => {
    renderCard(mockWith({ kein: 'array' }));

    await waitFor(() =>
      expect(screen.getByText('zettelkasten.report.empty')).toBeTruthy()
    );
  });

  it('says that the report could not be read instead of claiming nothing is in the holdings', async () => {
    renderCard(mockWith(['ein Rapport ohne Kopfzeile']));

    await waitFor(() =>
      expect(screen.getByText('zettelkasten.report.unreadable')).toBeTruthy()
    );
    expect(screen.queryByText('zettelkasten.report.empty')).toBeNull();
  });
});
