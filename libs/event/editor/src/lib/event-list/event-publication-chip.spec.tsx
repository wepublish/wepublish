import { render, screen } from '@testing-library/react';

import { EventPublicationChip } from './event-publication-chip';
import { listItem, renderWith, translate } from './test-helpers';

vi.mock('react-i18next', async () =>
  (await import('./test-translate')).i18nMock()
);

const now = new Date('2026-10-23T12:00:00.000Z');

const renderChip = (overrides: Parameters<typeof listItem>[0]) =>
  render(
    renderWith(
      <EventPublicationChip
        event={listItem(overrides)}
        now={now}
      />
    )
  );

describe('EventPublicationChip', () => {
  it('marks a draft with ○ and says Draft', () => {
    renderChip({});

    expect(screen.getByText('○')).toBeTruthy();
    expect(screen.getByText('agenda.publication.draft')).toBeTruthy();
  });

  it('marks a published event with ● and says Published', () => {
    renderChip({
      draft: null,
      published: {
        __typename: 'EventRevision',
        id: 'rev-1',
        publishedAt: '2026-10-01T00:00:00.000Z',
      },
    });

    expect(screen.getByText('●')).toBeTruthy();
    expect(screen.getByText('agenda.publication.published')).toBeTruthy();
    expect(screen.queryByText('agenda.publication.draft')).toBeNull();
  });

  it('marks a scheduled event with ◔ and says Scheduled', () => {
    renderChip({
      draft: null,
      pending: {
        __typename: 'EventRevision',
        id: 'rev-1',
        publishedAt: '2026-11-01T00:00:00.000Z',
      },
    });

    expect(screen.getByText('◔')).toBeTruthy();
    expect(screen.getByText('agenda.publication.pending')).toBeTruthy();
  });

  it('marks a draft waiting for review with ◐ and says how long it has waited', () => {
    renderChip({ reviewRequestedAt: '2026-10-21T12:00:00.000Z' });

    expect(screen.getByText('◐')).toBeTruthy();
    expect(
      screen.getByText(
        translate('agenda.publication.reviewRequestedAgo', {
          time: '2 days ago',
        })
      )
    ).toBeTruthy();
    expect(screen.queryByText('agenda.publication.draft')).toBeNull();
  });

  it('shows both states of a published event with unpublished changes', () => {
    renderChip({
      published: {
        __typename: 'EventRevision',
        id: 'rev-0',
        publishedAt: '2026-10-01T00:00:00.000Z',
      },
    });

    expect(screen.getByText('agenda.publication.draft')).toBeTruthy();
    expect(screen.getByText('agenda.publication.published')).toBeTruthy();
  });

  it('hides the marks from screen readers, which read the text', () => {
    renderChip({});

    expect(screen.getByText('○').getAttribute('aria-hidden')).toBe('true');
  });
});
