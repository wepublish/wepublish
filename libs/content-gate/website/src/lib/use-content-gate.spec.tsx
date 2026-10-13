import { InMemoryCache } from '@apollo/client';
import { MockedProvider } from '@apollo/client/testing/react';
import { renderHook, waitFor } from '@testing-library/react';
import { SessionTokenContext } from '@wepublish/authentication/website';
import {
  mockArticle,
  mockArticleRevision,
  mockContentGate,
  mockRichTextBlock,
  mockSubscription,
} from '@wepublish/storybook/mocks';
import {
  ArticleUnlockedDocument,
  ContentGateAudience,
  possibleTypes,
  SubscriptionsDocument,
} from '@wepublish/website/api';
import { PropsWithChildren } from 'react';
import { CONTENT_GATE_METER_KEY, useContentGate } from './use-content-gate';

const session = {
  hasUser: false,
  // null: the subscriptions never arrive
  activeSubscriptions: null as unknown[] | null,
};

const unlockedBlocks = [mockRichTextBlock()];

const gatedArticle = (overrides = {}) =>
  mockArticle({
    id: 'article-1',
    contentGate: mockContentGate({
      freeArticles: 1,
      softGateArticles: 1,
      ...overrides,
    }),
    latest: mockArticleRevision({ contentGated: true }),
  });

const unlockResult = vi.fn(() => ({
  data: {
    article: {
      __typename: 'Article',
      id: 'article-1',
      latest: {
        __typename: 'ArticleRevision',
        id: 'revision-1',
        blocks: unlockedBlocks,
      },
    },
  },
}));

const wrapper = ({ children }: PropsWithChildren) => (
  <MockedProvider
    cache={new InMemoryCache({ possibleTypes: possibleTypes.possibleTypes })}
    mocks={[
      {
        request: {
          query: ArticleUnlockedDocument,
          variables: () => true,
        },
        maxUsageCount: Number.POSITIVE_INFINITY,
        result: unlockResult,
      },
      ...(session.activeSubscriptions ?
        [
          {
            request: { query: SubscriptionsDocument },
            result: {
              data: { userSubscriptions: session.activeSubscriptions },
            },
          },
        ]
      : []),
    ]}
  >
    <SessionTokenContext.Provider
      value={[null, session.hasUser, async () => undefined]}
    >
      {children}
    </SessionTokenContext.Provider>
  </MockedProvider>
);

const readMeterOf = (articleIds: string[]) =>
  localStorage.setItem(
    CONTENT_GATE_METER_KEY,
    JSON.stringify({
      gateId: 'content-gate-1',
      reads: articleIds.map(articleId => ({
        articleId,
        at: Date.now(),
        state: 'free',
      })),
    })
  );

describe('useContentGate', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    unlockResult.mockClear();
    session.hasUser = false;
    session.activeSubscriptions = null;
  });

  it('does nothing for articles without a gate', () => {
    const { result } = renderHook(() => useContentGate(mockArticle()), {
      wrapper,
    });

    expect(result.current.state).toBeNull();
    expect(unlockResult).not.toHaveBeenCalled();
  });

  it('fetches the rest of a free article and counts the read', async () => {
    const { result } = renderHook(() => useContentGate(gatedArticle()), {
      wrapper,
    });

    await waitFor(() =>
      expect(result.current.unlockedBlocks).toMatchObject([
        { __typename: 'RichTextBlock', richText: unlockedBlocks[0].richText },
      ])
    );
    expect(result.current.state).toBe('none');
    expect(
      JSON.parse(localStorage.getItem(CONTENT_GATE_METER_KEY)!).reads
    ).toMatchObject([{ articleId: 'article-1', state: 'free' }]);
  });

  it('fetches the rest of the article behind a soft gate', async () => {
    readMeterOf(['other-article']);

    const { result } = renderHook(() => useContentGate(gatedArticle()), {
      wrapper,
    });

    await waitFor(() =>
      expect(result.current.unlockedBlocks).toMatchObject([
        { __typename: 'RichTextBlock', richText: unlockedBlocks[0].richText },
      ])
    );
    expect(result.current.state).toBe('soft');
  });

  it('never fetches the rest of the article behind the hard gate', async () => {
    readMeterOf(['other-article', 'another-article']);

    const { result } = renderHook(() => useContentGate(gatedArticle()), {
      wrapper,
    });

    await waitFor(() => expect(result.current.state).toBe('hard'));
    expect(result.current.unlockedBlocks).toBeUndefined();
    expect(unlockResult).not.toHaveBeenCalled();
  });

  it('does not meter logged-in readers of a registration gate', async () => {
    session.hasUser = true;
    readMeterOf(['other-article', 'another-article']);

    const { result } = renderHook(() => useContentGate(gatedArticle()), {
      wrapper,
    });

    await waitFor(() => expect(result.current.state).toBe('none'));
    expect(
      JSON.parse(localStorage.getItem(CONTENT_GATE_METER_KEY)!).reads
    ).toHaveLength(2);
  });

  it('waits for the subscriptions of logged-in readers before metering them', () => {
    session.hasUser = true;

    const { result } = renderHook(
      () =>
        useContentGate(
          gatedArticle({ audience: ContentGateAudience.NonSubscribers })
        ),
      { wrapper }
    );

    expect(result.current.state).toBeNull();
    expect(localStorage.getItem(CONTENT_GATE_METER_KEY)).toBeNull();
  });

  it('does not meter subscribers', async () => {
    session.hasUser = true;
    session.activeSubscriptions = [mockSubscription({ isActive: true })];

    const { result } = renderHook(
      () =>
        useContentGate(
          gatedArticle({ audience: ContentGateAudience.NonSubscribers })
        ),
      { wrapper }
    );

    await waitFor(() => expect(result.current.state).toBe('none'));
    expect(localStorage.getItem(CONTENT_GATE_METER_KEY)).toBeNull();
  });

  it('meters logged-in readers without a subscription', async () => {
    session.hasUser = true;
    session.activeSubscriptions = [];
    readMeterOf(['other-article', 'another-article']);

    const { result } = renderHook(
      () =>
        useContentGate(
          gatedArticle({ audience: ContentGateAudience.NonSubscribers })
        ),
      { wrapper }
    );

    await waitFor(() => expect(result.current.state).toBe('hard'));
  });

  it('starts over when the stored meter is unreadable', async () => {
    localStorage.setItem(CONTENT_GATE_METER_KEY, '{not json');

    const { result } = renderHook(() => useContentGate(gatedArticle()), {
      wrapper,
    });

    await waitFor(() => expect(result.current.state).toBe('none'));
  });
});
