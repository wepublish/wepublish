import { ApolloClient, InMemoryCache } from '@apollo/client';
import { ApolloProvider } from '@apollo/client/react';
import { MockLink } from '@apollo/client/testing';
import { act, renderHook, waitFor } from '@testing-library/react';
import { SessionTokenContext } from '@wepublish/authentication/website';
import { clearArticleAccess } from '@wepublish/paywall/website';
import {
  mockArticle,
  mockArticleAccess,
  mockArticleRevision,
  mockEngagementPrompt,
  mockRichTextBlock,
} from '@wepublish/storybook/mocks';
import {
  ArticleDocument,
  SubscriptionsDocument,
  ViewArticleDocument,
  ViewArticleMutationVariables,
  possibleTypes,
} from '@wepublish/website/api';
import { PropsWithChildren } from 'react';
import { ENGAGEMENT_METER_KEY } from './engagement-storage';
import { useArticleEngagement } from './use-article-engagement';

const preview = mockRichTextBlock();
const rest = mockRichTextBlock();
const article = mockArticle({
  latest: mockArticleRevision({ blocks: [preview], restricted: true }),
});
const prompt = mockEngagementPrompt();

describe('useArticleEngagement', () => {
  let views: ViewArticleMutationVariables[];
  let user: { id: string } | null;
  let client: ApolloClient;

  const viewArticleMock = {
    request: {
      query: ViewArticleDocument,
      variables: (variables: ViewArticleMutationVariables) => {
        views.push(variables);

        return true;
      },
    },
    maxUsageCount: Number.POSITIVE_INFINITY,
    result: () => ({
      data: {
        viewArticle: {
          __typename: 'ArticleView' as const,
          meterToken: `token-${views.length}`,
          access: mockArticleAccess(),
          prompts: [prompt],
          article: {
            __typename: 'Article' as const,
            id: article.id,
            latest: {
              __typename: 'ArticleRevision' as const,
              id: article.latest.id,
              restricted: false,
              blocks: [preview, rest],
            },
          },
        },
      },
    }),
  };

  const wrapper = ({ children }: PropsWithChildren) => (
    <ApolloProvider client={client}>
      <SessionTokenContext.Provider
        value={[user as never, !!user, async () => undefined]}
      >
        {children}
      </SessionTokenContext.Provider>
    </ApolloProvider>
  );

  beforeEach(() => {
    views = [];
    user = null;
    localStorage.clear();
    clearArticleAccess();
    client = new ApolloClient({
      cache: new InMemoryCache({
        possibleTypes: possibleTypes.possibleTypes,
      }),
      link: new MockLink([
        viewArticleMock,
        {
          request: { query: SubscriptionsDocument },
          maxUsageCount: Number.POSITIVE_INFINITY,
          result: { data: { userSubscriptions: [] } },
        },
      ]),
    });
    client.writeQuery({
      query: ArticleDocument,
      variables: { id: article.id },
      data: { article },
    });
  });

  it('views the article with the stored meter token and keeps the new one', async () => {
    localStorage.setItem(ENGAGEMENT_METER_KEY, 'token-0');

    const { result } = renderHook(() => useArticleEngagement(article), {
      wrapper,
    });

    await waitFor(() => expect(result.current.access?.granted).toBe(true));

    expect(views).toEqual([
      {
        input: {
          articleId: article.id,
          meterToken: 'token-0',
          referral: [],
          paywallBypassToken: undefined,
        },
      },
    ]);
    expect(localStorage.getItem(ENGAGEMENT_METER_KEY)).toBe('token-1');
    expect(result.current.prompts).toEqual([prompt]);
  });

  it('sends the params of the current url as referral', async () => {
    window.history.pushState({}, '', '/a/article?utm_medium=email');

    renderHook(() => useArticleEngagement(article), { wrapper });

    await waitFor(() => expect(views).toHaveLength(1));
    expect(views[0].input.referral).toEqual([
      { key: 'utm_medium', value: 'email' },
    ]);

    window.history.pushState({}, '', '/');
  });

  it('views the article again once the reader logged in', async () => {
    const { rerender } = renderHook(() => useArticleEngagement(article), {
      wrapper,
    });

    await waitFor(() => expect(views).toHaveLength(1));

    user = { id: 'user-1' };
    rerender();

    await waitFor(() => expect(views).toHaveLength(2));
  });

  it('replaces the cut blocks of the cached article', async () => {
    expect(
      client.readQuery({
        query: ArticleDocument,
        variables: { id: article.id },
      })?.article?.latest.blocks
    ).toHaveLength(1);

    const { result } = renderHook(() => useArticleEngagement(article), {
      wrapper,
    });

    await waitFor(() => expect(result.current.access).toBeDefined());

    const cached = client.readQuery({
      query: ArticleDocument,
      variables: { id: article.id },
    });

    expect(cached?.article?.latest.blocks).toHaveLength(2);
    expect(cached?.article?.latest.restricted).toBe(false);
  });

  it('does not view anything without an article', async () => {
    renderHook(() => useArticleEngagement(null), { wrapper });

    await act(() => new Promise(resolve => setTimeout(resolve, 10)));

    expect(views).toEqual([]);
  });
});
