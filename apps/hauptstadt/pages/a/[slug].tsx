import styled from '@emotion/styled';
import {
  ArticleContainer,
  ArticleListContainer,
  ArticleWrapper,
} from '@wepublish/article/website';
import {
  isTeaserGridBlock,
  isTeaserGridFlexBlock,
  isTeaserListBlock,
  isTeaserSlotsBlock,
} from '@wepublish/block-content/website';
import { CommentListContainer } from '@wepublish/comments/website';
import { ShowPaywallContext, useShowPaywall } from '@wepublish/paywall/website';
import {
  addClientCacheToV1Props,
  ArticleDocument,
  ArticleListDocument,
  CommentItemType,
  CommentListDocument,
  getV1ApiClient,
  NavigationListDocument,
  PeerProfileDocument,
  Tag,
  useArticleQuery,
} from '@wepublish/website/api';
import { Link, useWebsiteBuilder } from '@wepublish/website/builder';
import { GetStaticProps } from 'next';
import getConfig from 'next/config';
import { usePathname, useSearchParams } from 'next/navigation';
import { useRouter } from 'next/router';
import { anyPass } from 'ramda';
import { ComponentProps } from 'react';

import { DuplicatedPaywall } from '../../src/components/hauptstadt-paywall';

export const ArticleWrapperComments = styled(ArticleWrapper)``;
export const ArticleWrapperAppendix = styled(ArticleWrapper)``;

export default function ArticleBySlugOrId() {
  const router = useRouter();
  const {
    query: { slug, id, articleId },
  } = router;
  const {
    elements: { H4 },
  } = useWebsiteBuilder();

  const { data } = useArticleQuery({
    fetchPolicy: 'cache-only',
    variables: {
      slug: slug as string,
      id: id as string,
    },
  });
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const lastBlock = data?.article.latest.blocks.at(-1);
  const isLastBlockTeaser =
    lastBlock &&
    anyPass([
      isTeaserGridBlock,
      isTeaserSlotsBlock,
      isTeaserGridFlexBlock,
      isTeaserListBlock,
    ])(lastBlock);

  const { showPaywall } = useShowPaywall(data?.article.paywall);
  const showDuplicatedPaywall = (data?.article.latest.blocks.length ?? 0) > 4;

  if (!showPaywall && router.query.articleId) {
    const nextSearchParams = new URLSearchParams(searchParams.toString());
    nextSearchParams.delete('articleId');
    const search = nextSearchParams.size ? `?${nextSearchParams}` : '';

    router.replace(`${pathname}${search}`, undefined, { shallow: true });
  }

  const containerProps = {
    slug,
    id,
  } as ComponentProps<typeof ArticleContainer>;

  return (
    <>
      <ShowPaywallContext.Provider
        value={{
          hideContent: articleId === data?.article.id ? undefined : false,
        }}
      >
        <ArticleContainer {...containerProps}>
          {showDuplicatedPaywall && (
            <DuplicatedPaywall paywall={data?.article?.paywall} />
          )}
        </ArticleContainer>
      </ShowPaywallContext.Provider>

      {data?.article && !isLastBlockTeaser && (
        <ArticleWrapperAppendix>
          <H4 component={'h2'}>Das könnte dich auch interessieren</H4>

          <ArticleListContainer
            variables={{
              filter: { tags: data.article.tags.map(tag => tag.id) },
              take: 4,
            }}
            filter={articles =>
              articles
                .filter(article => article.id !== data.article?.id)
                .splice(0, 3)
            }
          />
        </ArticleWrapperAppendix>
      )}

      {data?.article && !data.article.disableComments && (
        <ArticleWrapperComments>
          <div>
            <H4
              component={'h2'}
              id="comments"
            >
              Diskussion
            </H4>

            <small>
              <Link
                href="/unsere-etikette"
                target="_blank"
              >
                Unsere Etikette
              </Link>
            </small>
          </div>

          <CommentListContainer
            id={data!.article!.id}
            type={CommentItemType.Article}
          />
        </ArticleWrapperComments>
      )}
    </>
  );
}

export const getStaticPaths = () => ({
  paths: [],
  fallback: 'blocking',
});

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { id, slug } = params || {};
  const { publicRuntimeConfig } = getConfig();

  const client = getV1ApiClient(publicRuntimeConfig.env.API_URL!, []);

  const [article] = await Promise.all([
    client.query({
      query: ArticleDocument,
      variables: {
        id,
        slug,
      },
    }),
    client.query({
      query: NavigationListDocument,
    }),
    client.query({
      query: PeerProfileDocument,
    }),
  ]);
  const is404 = article.errors?.find(
    ({ extensions }) => extensions?.status === 404
  );
  if (is404) {
    return {
      notFound: true,
      revalidate: 1,
    };
  }

  if (article.data?.article) {
    await Promise.all([
      client.query({
        query: ArticleListDocument,
        variables: {
          filter: {
            tags: article.data.article.tags.map((tag: Tag) => tag.id),
          },
          take: 4,
        },
      }),
      client.query({
        query: CommentListDocument,
        variables: {
          itemId: article.data.article.id,
        },
      }),
    ]);
  }

  const props = addClientCacheToV1Props(client, {});

  return {
    props,
    revalidate: 60, // every 60 seconds
  };
};
