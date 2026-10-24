import { useQuery } from '@apollo/client/react';
import { render, renderHook, screen } from '@testing-library/react';
import { EventReviewQueueCountDocument } from '@wepublish/editor/api';
import {
  CanGetEvents,
  CanGetOtherOrganizationEvents,
  CanPublishEvent,
  CanUpdateOtherOrganizationEvents,
} from '@wepublish/permissions';
import { AuthContext } from '@wepublish/ui/editor';
import { ReactNode } from 'react';
import type { Mock } from 'vitest';

import { ReviewQueueCard, useReviewQueueAccess } from './review-queue-card';
import { renderWith, sessionWith, translate } from './test-helpers';

vi.mock('react-i18next', async () =>
  (await import('./test-translate')).i18nMock()
);

vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useQuery: vi.fn(),
}));

const mockedUseQuery = useQuery as unknown as Mock;

const accessOf = (permissions: string[] | undefined) =>
  renderHook(() => useReviewQueueAccess(), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <AuthContext.Provider value={sessionWith(permissions)}>
        {children}
      </AuthContext.Provider>
    ),
  }).result.current;

describe('useReviewQueueAccess', () => {
  it('lets whoever lists and publishes events see the queue', () => {
    expect(accessOf([CanGetEvents.id, CanPublishEvent.id])).toBe(true);
  });

  it.each([CanGetOtherOrganizationEvents, CanUpdateOtherOrganizationEvents])(
    'lets a holder of %s see the queue',
    permission => {
      expect(accessOf([CanGetEvents.id, permission.id])).toBe(true);
    }
  );

  it('hides the queue from someone who cannot publish or see other organisations', () => {
    expect(accessOf([CanGetEvents.id])).toBe(false);
  });

  it('hides the queue without CanGetEvents, whose count would be the public one', () => {
    expect(accessOf([CanPublishEvent.id])).toBe(false);
  });

  it('is undecided while the roles load', () => {
    expect(accessOf(undefined)).toBeUndefined();
  });
});

describe('ReviewQueueCard', () => {
  it('counts the events waiting and links to the queue', () => {
    mockedUseQuery.mockReturnValue({
      data: { events: { totalCount: 3 } },
      loading: false,
    });

    render(renderWith(<ReviewQueueCard />));

    expect(mockedUseQuery.mock.calls.at(-1)?.[0]).toBe(
      EventReviewQueueCountDocument
    );
    expect(mockedUseQuery.mock.calls.at(-1)?.[1]?.context).toBeUndefined();
    expect(
      screen.getByText(translate('agenda.reviewQueue.count', { count: 3 }))
    ).toBeTruthy();
    expect(
      screen
        .getByRole('link', { name: 'agenda.reviewQueue.open' })
        .getAttribute('href')
    ).toBe('/events?review=1');
  });

  it('calls an empty queue an achievement', () => {
    mockedUseQuery.mockReturnValue({
      data: { events: { totalCount: 0 } },
      loading: false,
    });

    render(renderWith(<ReviewQueueCard />));

    expect(screen.getByText('agenda.reviewQueue.empty')).toBeTruthy();
  });

  it('announces the count to screen readers when it changes', () => {
    mockedUseQuery.mockReturnValue({
      data: { events: { totalCount: 3 } },
      loading: false,
    });

    render(renderWith(<ReviewQueueCard />));

    expect(
      screen
        .getByText(translate('agenda.reviewQueue.count', { count: 3 }))
        .closest('[aria-live="polite"]')
    ).toBeTruthy();
  });
});
