import type { campaigns } from '@mailchimp/mailchimp_marketing';
import { screen } from '@testing-library/react';
import {
  mockArticleTeaser,
  mockCustomTeaser,
  mockFlexAlignment,
  renderWithProviders,
} from '@wepublish/mocks/website';
import { DailyBriefingContext } from '@wepublish/utils/website/daily-briefing';
import { FullTeaserFragment } from '@wepublish/website/api';

import { CulturTeaser } from './cultur-teaser';

const campaign = (id: string, subject: string) =>
  ({
    id,
    long_archive_url: `https://mailchi.mp/cultur/${id}`,
    settings: { subject_line: subject },
  }) as campaigns.Campaigns;

const renderTeaser = (
  teaser: FullTeaserFragment,
  briefings: campaigns.Campaigns[] = []
) =>
  renderWithProviders(
    <DailyBriefingContext.Provider value={briefings}>
      <CulturTeaser
        teaser={teaser}
        alignment={mockFlexAlignment()}
        index={0}
        blockStyle={null}
      />
    </DailyBriefingContext.Provider>
  );

describe('CulturTeaser', () => {
  it('lists the latest daily briefings for a daily briefing teaser', () => {
    renderTeaser(
      mockCustomTeaser({ preTitle: 'daily-briefing', title: 'Tagesbriefing' }),
      [campaign('monday', 'Montag in Basel'), campaign('tuesday', 'Dienstag')]
    );

    expect(
      screen.getByRole('heading', { name: 'Tagesbriefing' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Montag in Basel' })
    ).toHaveAttribute('href', 'https://mailchi.mp/cultur/monday');
    expect(screen.getByRole('link', { name: 'Dienstag' })).toHaveAttribute(
      'href',
      'https://mailchi.mp/cultur/tuesday'
    );
  });

  it('renders any other teaser as a regular teaser', () => {
    renderTeaser(
      mockArticleTeaser({
        preTitle: 'Konzert',
        title: 'Was diese Woche läuft',
      }),
      [campaign('monday', 'Montag in Basel')]
    );

    expect(
      screen.getByRole('heading', { name: 'Was diese Woche läuft' })
    ).toBeInTheDocument();
    expect(screen.getByText('Konzert')).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: 'Montag in Basel' })
    ).not.toBeInTheDocument();
  });

  it('does not treat a custom teaser with another pre-title as a daily briefing', () => {
    renderTeaser(
      mockCustomTeaser({ preTitle: 'Agenda', title: 'Ausgehtipps' }),
      [campaign('monday', 'Montag in Basel')]
    );

    expect(
      screen.queryByRole('link', { name: 'Montag in Basel' })
    ).not.toBeInTheDocument();
    expect(screen.getByText('Agenda')).toBeInTheDocument();
  });
});
