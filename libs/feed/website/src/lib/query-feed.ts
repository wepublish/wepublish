import { ApolloClient } from '@apollo/client';
import {
  FeedArticleFragment,
  FeedArticleListDocument,
  FeedArticleListQueryVariables,
  SettingDocument,
} from '@wepublish/website/api';

import {
  FEED_PAYWALLED_CONTENT_SETTING,
  FeedOptions,
  toFeedPaywalledContent,
} from './feed-generator';

const readPaywalledContent = async (client: ApolloClient) => {
  try {
    const { data } = await client.query({
      query: SettingDocument,
      variables: { name: FEED_PAYWALLED_CONTENT_SETTING },
    });

    return toFeedPaywalledContent(data?.setting?.value);
  } catch {
    return toFeedPaywalledContent(undefined);
  }
};

export const queryFeed = async (
  client: ApolloClient,
  variables: FeedArticleListQueryVariables
): Promise<{ articles: FeedArticleFragment[]; options: FeedOptions }> => {
  const [{ data }, paywalledContent] = await Promise.all([
    client.query({ query: FeedArticleListDocument, variables }),
    readPaywalledContent(client),
  ]);

  return {
    articles: data?.articles.nodes ?? [],
    options: { paywalledContent },
  };
};
