import type { MockedResponse } from '@apollo/client/testing';
import { MockedProvider } from '@apollo/client/testing/react';
import { createTheme, ThemeProvider } from '@mui/material';
import { fireEvent, render, screen } from '@testing-library/react';
import {
  ArchiveNewsletterCampaignDocument,
  NewsletterCampaignsDocument,
  UnarchiveNewsletterCampaignDocument,
} from '@wepublish/editor/api';
import { MemoryRouter } from 'react-router-dom';
import { NewsletterCampaignList } from './newsletter-campaign-list';

const campaign = (id: string, title: string, status: string) => ({
  __typename: 'NewsletterCampaign',
  id,
  title,
  status,
  createdAt: '2026-10-01T00:00:00.000Z',
  modifiedAt: '2026-10-02T00:00:00.000Z',
  blockCount: 2,
  mailchimpCampaignWebId: null,
  mailchimpEditUrl: null,
});

const active = campaign('campaign-1', 'Ausgabe 1', 'active');
const archived = campaign('campaign-2', 'Ausgabe 0', 'archived');

const list = (includeArchived: boolean, campaigns: object[]) => ({
  request: {
    query: NewsletterCampaignsDocument,
    variables: { includeArchived },
  },
  result: { data: { newsletterCampaigns: campaigns } },
});

const renderWith = (mocks: MockedResponse[]) =>
  render(
    <ThemeProvider theme={createTheme({ cssVariables: true })}>
      <MockedProvider mocks={mocks}>
        <MemoryRouter>
          <NewsletterCampaignList />
        </MemoryRouter>
      </MockedProvider>
    </ThemeProvider>
  );

describe('NewsletterCampaignList', () => {
  it('archives an issue, which then leaves the list', async () => {
    const archive = vi.fn(() => ({
      data: {
        archiveNewsletterCampaign: { ...active, status: 'archived' },
      },
    }));

    renderWith([
      list(false, [active]),
      {
        request: {
          query: ArchiveNewsletterCampaignDocument,
          variables: { id: 'campaign-1' },
        },
        result: archive,
      },
      list(false, []),
    ]);

    fireEvent.click(
      await screen.findByRole('button', { name: 'newsletter.list.archive' })
    );

    await vi.waitFor(() => expect(archive).toHaveBeenCalled());
    await vi.waitFor(() => expect(screen.queryByText('Ausgabe 1')).toBeNull());
  });

  it('shows archived issues on request and restores them', async () => {
    const unarchive = vi.fn(() => ({
      data: { unarchiveNewsletterCampaign: { ...archived, status: 'active' } },
    }));

    renderWith([
      list(false, [active]),
      list(true, [active, archived]),
      {
        request: {
          query: UnarchiveNewsletterCampaignDocument,
          variables: { id: 'campaign-2' },
        },
        result: unarchive,
      },
      list(true, [active, { ...archived, status: 'active' }]),
    ]);

    await screen.findByText('Ausgabe 1');
    expect(screen.queryByText('Ausgabe 0')).toBeNull();

    fireEvent.click(screen.getByLabelText('newsletter.list.showArchived'));

    await screen.findByText('Ausgabe 0');
    expect(screen.getByText('newsletter.list.archived')).toBeTruthy();
    // An archived issue offers restoring, not archiving it a second time.
    expect(
      screen.getAllByRole('button', { name: 'newsletter.list.archive' })
    ).toHaveLength(1);

    fireEvent.click(
      screen.getByRole('button', { name: 'newsletter.list.unarchive' })
    );

    await vi.waitFor(() => expect(unarchive).toHaveBeenCalled());
    await vi.waitFor(() =>
      expect(screen.queryByText('newsletter.list.archived')).toBeNull()
    );
  });
});
