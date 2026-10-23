import { render, screen, within } from '@testing-library/react';

import { EventStackList, shouldShowEventStack } from './event-stack-list';
import { listItem, renderWith } from './test-helpers';

vi.mock('react-i18next', async () =>
  (await import('./test-translate')).i18nMock()
);

describe('shouldShowEventStack', () => {
  const base = {
    canPublish: false,
    filterCount: 0,
    totalCount: 3,
    loadedCount: 3,
  };

  it('shows the stack to someone who cannot publish and has a few events', () => {
    expect(shouldShowEventStack(base)).toBe(true);
  });

  it('shows it for ten events', () => {
    expect(
      shouldShowEventStack({ ...base, totalCount: 10, loadedCount: 10 })
    ).toBe(true);
  });

  it('shows the table for eleven events', () => {
    expect(
      shouldShowEventStack({ ...base, totalCount: 11, loadedCount: 10 })
    ).toBe(false);
  });

  it('shows the table to someone who can publish', () => {
    expect(shouldShowEventStack({ ...base, canPublish: true })).toBe(false);
  });

  it('waits for the roles to load before collapsing the list', () => {
    expect(shouldShowEventStack({ ...base, canPublish: undefined })).toBe(
      false
    );
  });

  it('keeps the table while a filter is active', () => {
    expect(shouldShowEventStack({ ...base, filterCount: 1 })).toBe(false);
  });

  it('leaves no events to the empty state', () => {
    expect(
      shouldShowEventStack({ ...base, totalCount: 0, loadedCount: 0 })
    ).toBe(false);
  });

  it('keeps the table while not every event is loaded', () => {
    expect(shouldShowEventStack({ ...base, loadedCount: 2 })).toBe(false);
  });
});

describe('EventStackList', () => {
  it('lists each event with its next date and state', () => {
    render(
      renderWith(
        <EventStackList
          events={[
            listItem({ id: 'a', name: 'Qui-vive' }),
            listItem({ id: 'b', name: 'Les Limbes' }),
          ]}
          now={new Date('2026-10-23T12:00:00.000Z')}
        />
      )
    );

    const items = within(screen.getByRole('list')).getAllByRole('listitem');

    expect(items).toHaveLength(2);
    expect(within(items[0]).getByText('Qui-vive')).toBeTruthy();
    expect(within(items[0]).getByText('Wed 26 May, 19:00')).toBeTruthy();
    expect(within(items[0]).getByText('agenda.publication.draft')).toBeTruthy();
    expect(within(items[1]).getByText('Les Limbes')).toBeTruthy();
  });

  it('names an untitled event as such', () => {
    render(
      renderWith(
        <EventStackList
          events={[listItem({ name: null })]}
          now={new Date('2026-10-23T12:00:00.000Z')}
        />
      )
    );

    expect(screen.getByText('agenda.list.untitled')).toBeTruthy();
  });
});
