import { fireEvent, render, screen } from '@testing-library/react';
import { ComponentProps } from 'react';

import { EventListEmptyState } from './event-list-empty-state';
import { REVIEW_QUEUE_FILTER } from './event-list-filter';
import { renderWith, translate } from './test-helpers';

vi.mock('react-i18next', async () =>
  (await import('./test-translate')).i18nMock()
);

const renderEmpty = (
  props: Partial<ComponentProps<typeof EventListEmptyState>> = {}
) => {
  const onClearFilters = vi.fn();

  render(
    renderWith(
      <EventListEmptyState
        filter={{}}
        canSeeAll={false}
        hasMembership
        canCreate
        onClearFilters={onClearFilters}
        {...props}
      />
    )
  );

  return onClearFilters;
};

describe('EventListEmptyState', () => {
  it('offers to create the first event to someone who may', () => {
    renderEmpty({ canCreate: true });

    expect(
      screen
        .getByRole('link', { name: 'agenda.list.empty.createFirst' })
        .getAttribute('href')
    ).toBe('/events/create');
  });

  it('offers no create action to someone who may not', () => {
    renderEmpty({ canCreate: false });

    expect(
      screen.queryByRole('link', { name: 'agenda.list.empty.createFirst' })
    ).toBeNull();
  });

  it('tells someone without an organisation who cannot file events why the list is empty', () => {
    renderEmpty({ hasMembership: false, canCreate: false });

    expect(
      screen.getByText('agenda.list.empty.noMembershipTitle')
    ).toBeTruthy();
    expect(screen.getByText('agenda.list.empty.noMembershipBody')).toBeTruthy();
  });

  it('does not send someone who may file events of their own to find an organisation', () => {
    renderEmpty({ hasMembership: false, canCreate: true });

    expect(screen.getByText('agenda.list.empty.noEventsTitle')).toBeTruthy();
    expect(
      screen.getByText('agenda.list.empty.noEventsMembershipHint')
    ).toBeTruthy();
    expect(
      screen.queryByText('agenda.list.empty.noMembershipTitle')
    ).toBeNull();
  });

  it('explains what the agenda is for when there are no events at all', () => {
    renderEmpty();

    expect(screen.getByText('agenda.list.empty.noEventsTitle')).toBeTruthy();
    expect(screen.getByText('agenda.list.empty.noEventsBody')).toBeTruthy();
    expect(
      screen.queryByText('agenda.list.empty.noEventsMembershipHint')
    ).toBeNull();
  });

  it('gives whoever sees every event no membership hint', () => {
    renderEmpty({ canSeeAll: true, hasMembership: false, canCreate: false });

    expect(screen.getByText('agenda.list.empty.noEventsTitle')).toBeTruthy();
    expect(
      screen.queryByText('agenda.list.empty.noEventsMembershipHint')
    ).toBeNull();
  });

  it('repeats the search that found nothing and offers to clear the filters', () => {
    const onClearFilters = renderEmpty({ filter: { search: 'jazz' } });

    expect(screen.getByText('agenda.list.empty.noResultsTitle')).toBeTruthy();
    expect(
      screen.getByText(
        translate('agenda.list.empty.noResultsSearch', { search: 'jazz' })
      )
    ).toBeTruthy();

    fireEvent.click(
      screen.getByRole('button', { name: 'agenda.list.empty.clearFilters' })
    );

    expect(onClearFilters).toHaveBeenCalled();
  });

  it('offers to clear filters that found nothing, without a search', () => {
    renderEmpty({ filter: { ending: 'ended' } });

    expect(screen.getByText('agenda.list.empty.noResultsTitle')).toBeTruthy();
    expect(screen.queryByText(/noResultsSearch/)).toBeNull();
    expect(
      screen.getByRole('button', { name: 'agenda.list.empty.clearFilters' })
    ).toBeTruthy();
  });

  it('celebrates an empty review queue', () => {
    renderEmpty({ filter: REVIEW_QUEUE_FILTER });

    expect(screen.getByText('agenda.list.empty.queueEmptyTitle')).toBeTruthy();
  });

  it('treats a narrowed queue as a search that found nothing', () => {
    renderEmpty({ filter: { ...REVIEW_QUEUE_FILTER, search: 'jazz' } });

    expect(screen.getByText('agenda.list.empty.noResultsTitle')).toBeTruthy();
  });

  it('renders only inline elements, as the table puts it inside a paragraph', () => {
    const { container } = render(
      renderWith(
        <p>
          <EventListEmptyState
            filter={{ search: 'jazz' }}
            canSeeAll={false}
            hasMembership
            canCreate
            onClearFilters={vi.fn()}
          />
        </p>
      )
    );

    expect(container.querySelector('p div, p p')).toBeNull();
  });
});
