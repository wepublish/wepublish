import type { Mock } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import {
  NewsletterSubscriberSource,
  NewsletterSubscriberStatus,
  useAddNewsletterSubscriberMutation,
  useNewsletterSubscriberCountsQuery,
  useNewsletterSubscriberLazyQuery,
  useNewsletterSubscribersQuery,
  useRemoveNewsletterSubscriberMutation,
} from '@wepublish/editor/api';
import { toaster } from 'rsuite';
import { NewsletterSubscriberList } from './newsletter-subscriber-list';

vi.mock('@wepublish/editor/api', async importOriginal => ({
  ...(await importOriginal<typeof import('@wepublish/editor/api')>()),
  useNewsletterSubscribersQuery: vi.fn(),
  useNewsletterSubscriberCountsQuery: vi.fn(),
  useNewsletterSubscriberLazyQuery: vi.fn(),
  useAddNewsletterSubscriberMutation: vi.fn(),
  useRemoveNewsletterSubscriberMutation: vi.fn(),
}));

vi.mock('@wepublish/ui/editor', async importOriginal => ({
  ...(await importOriginal<typeof import('@wepublish/ui/editor')>()),
  useAuthorisation: () => true,
  UserSearch: ({
    onUpdateUser,
  }: {
    onUpdateUser: (user: { id: string }) => void;
  }) => (
    <button onClick={() => onUpdateUser({ id: 'user-2' })}>pick user</button>
  ),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options ? `${key} ${JSON.stringify(options)}` : key,
    i18n: { language: 'en' },
  }),
}));

const subscriber = {
  id: 'row-1',
  source: NewsletterSubscriberSource.Self,
  status: NewsletterSubscriberStatus.Subscribed,
  receiving: false,
  subscribedAt: '2026-01-01T00:00:00.000Z',
  confirmedAt: '2026-01-01T00:00:00.000Z',
  unsubscribedAt: null,
  user: {
    id: 'user-1',
    name: 'Muster',
    firstName: 'Anna',
    email: 'anna@example.com',
  },
};

const refetch = vi.fn();
const getSubscriber = vi.fn();
const addSubscriber = vi.fn();
const removeSubscriber = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(toaster, 'push').mockReturnValue('toast');

  (useNewsletterSubscribersQuery as Mock).mockReturnValue({
    data: {
      newsletterSubscribers: {
        nodes: [subscriber],
        totalCount: 1,
        pageInfo: { hasNextPage: false, hasPreviousPage: false },
      },
    },
    loading: false,
    refetch,
  });
  (useNewsletterSubscriberCountsQuery as Mock).mockReturnValue({
    data: {
      newsletterSubscriberCounts: {
        subscribed: 5,
        pending: 2,
        unsubscribed: 1,
      },
    },
    refetch,
  });
  (useNewsletterSubscriberLazyQuery as Mock).mockReturnValue([getSubscriber]);
  (useAddNewsletterSubscriberMutation as Mock).mockReturnValue([addSubscriber]);
  (useRemoveNewsletterSubscriberMutation as Mock).mockReturnValue([
    removeSubscriber,
  ]);

  addSubscriber.mockResolvedValue({
    data: { addNewsletterSubscriber: { ...subscriber, receiving: true } },
  });
  removeSubscriber.mockResolvedValue({ data: {} });
});

describe('NewsletterSubscriberList', () => {
  it('shows the number of entries per status', () => {
    render(
      <NewsletterSubscriberList
        listId="list-1"
        requiresSubscription={false}
      />
    );

    expect(
      screen.getByText('newsletter.subscribers.filterAll {"count":8}')
    ).toBeTruthy();
    expect(
      screen.getByText('newsletter.subscribers.filterPending {"count":2}')
    ).toBeTruthy();
  });

  it('filters by status', () => {
    render(
      <NewsletterSubscriberList
        listId="list-1"
        requiresSubscription={false}
      />
    );

    fireEvent.click(
      screen.getByText('newsletter.subscribers.filterPending {"count":2}')
    );

    expect(useNewsletterSubscribersQuery).toHaveBeenLastCalledWith({
      variables: {
        listId: 'list-1',
        filter: { status: NewsletterSubscriberStatus.Pending, q: undefined },
        take: 25,
        skip: 0,
      },
    });
  });

  it('shows whether a subscriber currently receives a subscriber-only newsletter', () => {
    render(
      <NewsletterSubscriberList
        listId="list-1"
        requiresSubscription
      />
    );

    expect(screen.getByText('anna@example.com')).toBeTruthy();
    expect(screen.getByText('newsletter.subscribers.receivingNo')).toBeTruthy();
  });

  it('adds a user', async () => {
    getSubscriber.mockResolvedValue({ data: { newsletterSubscriber: null } });

    render(
      <NewsletterSubscriberList
        listId="list-1"
        requiresSubscription={false}
      />
    );

    fireEvent.click(screen.getByText('newsletter.subscribers.add'));
    fireEvent.click(screen.getByText('pick user'));
    fireEvent.click(screen.getByText('newsletter.subscribers.addConfirm'));

    await waitFor(() =>
      expect(addSubscriber).toHaveBeenCalledWith({
        variables: { listId: 'list-1', userId: 'user-2', force: false },
      })
    );
  });

  it('asks before re-adding a user who unsubscribed', async () => {
    getSubscriber.mockResolvedValue({
      data: {
        newsletterSubscriber: {
          ...subscriber,
          status: NewsletterSubscriberStatus.Unsubscribed,
          unsubscribedAt: '2026-03-01T00:00:00.000Z',
        },
      },
    });

    render(
      <NewsletterSubscriberList
        listId="list-1"
        requiresSubscription={false}
      />
    );

    fireEvent.click(screen.getByText('newsletter.subscribers.add'));
    fireEvent.click(screen.getByText('pick user'));
    fireEvent.click(screen.getByText('newsletter.subscribers.addConfirm'));

    await screen.findByText(/newsletter.subscribers.reAddBody/);
    expect(addSubscriber).not.toHaveBeenCalled();

    fireEvent.click(screen.getByText('newsletter.subscribers.reAddConfirm'));

    await waitFor(() =>
      expect(addSubscriber).toHaveBeenCalledWith({
        variables: { listId: 'list-1', userId: 'user-2', force: true },
      })
    );
  });

  it('offers re-adding only for people who unsubscribed', () => {
    (useNewsletterSubscribersQuery as Mock).mockReturnValue({
      data: {
        newsletterSubscribers: {
          nodes: [
            subscriber,
            {
              ...subscriber,
              id: 'row-2',
              status: NewsletterSubscriberStatus.Unsubscribed,
              unsubscribedAt: '2026-03-01T00:00:00.000Z',
              user: {
                ...subscriber.user,
                id: 'user-3',
                email: 'ben@example.com',
              },
            },
          ],
          totalCount: 2,
          pageInfo: { hasNextPage: false, hasPreviousPage: false },
        },
      },
      loading: false,
      refetch,
    });

    render(
      <NewsletterSubscriberList
        listId="list-1"
        requiresSubscription={false}
      />
    );

    expect(
      screen.getAllByLabelText('newsletter.subscribers.reAdd')
    ).toHaveLength(1);
    expect(
      screen.getAllByLabelText('newsletter.subscribers.remove')
    ).toHaveLength(1);
  });

  it('re-adds an unsubscribed person from their row after confirmation', async () => {
    (useNewsletterSubscribersQuery as Mock).mockReturnValue({
      data: {
        newsletterSubscribers: {
          nodes: [
            {
              ...subscriber,
              status: NewsletterSubscriberStatus.Unsubscribed,
              unsubscribedAt: '2026-03-01T00:00:00.000Z',
            },
          ],
          totalCount: 1,
          pageInfo: { hasNextPage: false, hasPreviousPage: false },
        },
      },
      loading: false,
      refetch,
    });

    render(
      <NewsletterSubscriberList
        listId="list-1"
        requiresSubscription={false}
      />
    );

    fireEvent.click(screen.getByLabelText('newsletter.subscribers.reAdd'));

    expect(screen.getByText(/newsletter.subscribers.reAddBody/)).toBeTruthy();
    expect(addSubscriber).not.toHaveBeenCalled();

    fireEvent.click(screen.getByText('newsletter.subscribers.reAddConfirm'));

    await waitFor(() =>
      expect(addSubscriber).toHaveBeenCalledWith({
        variables: { listId: 'list-1', userId: 'user-1', force: true },
      })
    );
  });

  it('removes a subscriber', async () => {
    render(
      <NewsletterSubscriberList
        listId="list-1"
        requiresSubscription={false}
      />
    );

    fireEvent.click(screen.getByLabelText('newsletter.subscribers.remove'));

    await waitFor(() =>
      expect(removeSubscriber).toHaveBeenCalledWith({
        variables: { listId: 'list-1', userId: 'user-1' },
      })
    );
  });
});
