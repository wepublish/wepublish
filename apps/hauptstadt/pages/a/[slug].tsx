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
import { getApiUrl } from '@wepublish/utils/website';
import {
  addClientCacheToProps,
  ArticleDocument,
  ArticleListDocument,
  CommentItemType,
  CommentListDocument,
  getApiClient,
  NavigationListDocument,
  PeerProfileDocument,
  Tag,
  useArticleQuery,
} from '@wepublish/website/api';
import { Link, useWebsiteBuilder } from '@wepublish/website/builder';
import { GetStaticProps } from 'next';
import { usePathname, useSearchParams } from 'next/navigation';
import { useRouter } from 'next/router';
import { anyPass } from 'ramda';
import { ComponentProps } from 'react';

import { isArchived, isNachtleben } from '../../src/archiviert';
import { DuplicatedPaywall } from '../../src/components/hauptstadt-paywall';

export const ArticleWrapperComments = styled(ArticleWrapper)``;
export const ArticleWrapperAppendix = styled(ArticleWrapper)``;

export interface StandaloneArticlePageProps {
  slug?: string;
  id?: string;
}

export function StandaloneArticlePage({
  slug,
  id,
}: StandaloneArticlePageProps) {
  const router = useRouter();
  const {
    query: { articleId },
  } = router;
  const {
    elements: { H4 },
  } = useWebsiteBuilder();

  const { data } = useArticleQuery({
    fetchPolicy: 'cache-only',
    variables: {
      slug,
      id,
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

export default function ArticleBySlugOrId() {
  const {
    query: { slug, id },
  } = useRouter();

  return (
    <StandaloneArticlePage
      slug={slug as string}
      id={id as string}
    />
  );
}

export const getStaticPaths = () => ({
  paths: [],
  fallback: 'blocking',
});

type ArticlePageVariant = 'default' | 'archive';

const createArticleGetStaticProps =
  (variant: ArticlePageVariant): GetStaticProps =>
  async ({ params }) => {
    const { id, slug } = params || {};
    const client = getApiClient(getApiUrl(), []);

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

    const articleData = article.data?.article;

    if (variant === 'default') {
      // nachtleben articles permanently redirect to the ausgang-in-bern page
      // so it inherits their page ranking; the archived ones stay readable
      // under /archive/<slug> via the tag page
      if (articleData && isNachtleben(articleData.tags)) {
        return {
          redirect: {
            destination: '/ausgang-in-bern',
            permanent: true,
          },
          revalidate: 60,
        };
      }

      // other archived articles live under /archive/<slug>
      // (see HauptstadtURLAdapter)
      if (articleData && isArchived(articleData.tags) && articleData.slug) {
        return {
          redirect: {
            destination: `/archive/${articleData.slug}`,
            permanent: false,
          },
          revalidate: 60,
        };
      }
    }

    if (variant === 'archive') {
      // only archived articles live under /archive — everything else keeps
      // its canonical /a/<slug> url
      if (articleData && !isArchived(articleData.tags)) {
        return {
          redirect: {
            destination: `/a/${articleData.slug}`,
            permanent: false,
          },
          revalidate: 60,
        };
      }
    }

    if (articleData) {
      await Promise.all([
        client.query({
          query: ArticleListDocument,
          variables: {
            filter: {
              tags: articleData.tags.map((tag: Tag) => tag.id),
            },
            take: 4,
          },
        }),
        client.query({
          query: CommentListDocument,
          variables: {
            itemId: articleData.id,
          },
        }),
      ]);
    }

    const props = addClientCacheToProps(client, {});

    return {
      props,
      revalidate: 60, // every 60 seconds
    };
  };

export const getStaticProps = createArticleGetStaticProps('default');
export const archiveArticleGetStaticProps =
  createArticleGetStaticProps('archive');
