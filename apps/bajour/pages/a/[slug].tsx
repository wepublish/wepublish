import styled from '@emotion/styled';
import { css } from '@mui/material';
import {
  Article,
  ArticleContainer,
  ArticleList,
  ArticleListContainer,
  ArticleWrapper,
} from '@wepublish/article/website';
import { ArticleAuthor } from '@wepublish/author/website';
import { PollBlock } from '@wepublish/block-content/website';
import { Comment } from '@wepublish/comments/website';
import { ContentWrapper } from '@wepublish/content/website';
import {
  addClientCacheToV1Props,
  Article as ArticleType,
  ArticleDocument,
  ArticleListDocument,
  BannerDocumentType,
  CommentItemType,
  CommentListDocument,
  CommentSort,
  getV1ApiClient,
  HotAndTrendingDocument,
  NavigationListDocument,
  PeerProfileDocument,
  PrimaryBannerDocument,
  SettingListDocument,
  SortOrder,
  Tag,
  useArticleQuery,
} from '@wepublish/website/api';
import {
  BuilderArticleListProps,
  useWebsiteBuilder,
  WebsiteBuilderProvider,
} from '@wepublish/website/builder';
import { GetStaticProps } from 'next';
import getConfig from 'next/config';
import { useRouter } from 'next/router';
import { ComponentProps } from 'react';

import { BriefingNewsletter } from '../../src/components/briefing-newsletter/briefing-newsletter';
import { FdTArticle } from '../../src/components/frage-des-tages/fdt-article';
import { FdtPollBlock } from '../../src/components/frage-des-tages/fdt-poll-block';
import { Container } from '../../src/components/layout/container';
import { SEARCH_SLIDER_TAG } from '../../src/components/search-slider/search-slider';
import { SearchSlider } from '../../src/components/search-slider/search-slider';
import { BajourComment } from '../../src/components/website-builder-overwrites/blocks/comment/comment';
import { CommentListContainer } from '../../src/components/website-builder-overwrites/blocks/comment-list-container/comment-list-container';
import { BajourTeaserSlider } from '../../src/components/website-builder-overwrites/blocks/teaser-slider/bajour-teaser-slider';

const uppercase = css`
  text-transform: uppercase;
`;

const RelatedArticleSlider = (props: BuilderArticleListProps) => {
  return (
    <WebsiteBuilderProvider blocks={{ TeaserGrid: BajourTeaserSlider }}>
      <ArticleList {...props} />
    </WebsiteBuilderProvider>
  );
};

export const AuthorWrapper = styled(ContentWrapper)`
  margin: 0 ${({ theme }) => theme.spacing(6)};

  ${({ theme }) => theme.breakpoints.up('md')} {
    margin: 0;
  }
`;

export default function ArticleBySlugOrId() {
  const {
    query: { slug, id },
  } = useRouter();
  const {
    elements: { H5 },
  } = useWebsiteBuilder();

  const { data } = useArticleQuery({
    fetchPolicy: 'cache-only',
    variables: {
      slug: slug as string,
      id: id as string,
    },
  });

  const containerProps = {
    slug,
    id,
  } as ComponentProps<typeof ArticleContainer>;

  const isFDT = data?.article?.tags.some(
    ({ tag }) => tag === 'frage-des-tages'
  );
  const isSearchSlider = data?.article?.tags.some(
    ({ tag }) => tag === SEARCH_SLIDER_TAG
  );

  return (
    <WebsiteBuilderProvider
      ArticleList={RelatedArticleSlider}
      blocks={{
        Poll: isFDT ? FdtPollBlock : PollBlock,
      }}
      Article={isFDT ? FdTArticle : Article}
      Comment={isFDT ? BajourComment : Comment}
    >
      <Container>
        {isSearchSlider && data?.article ?
          <SearchSlider
            key={data.article.id}
            article={data.article as ArticleType}
            includeSEO
          />
        : <>
            <ArticleContainer {...containerProps} />
            <BriefingNewsletter />

            {data?.article && !isSearchSlider && (
              <>
                <ArticleWrapper>
                  <H5
                    component={'h2'}
                    css={uppercase}
                  >
                    Das könnte dich auch interessieren
                  </H5>

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
                </ArticleWrapper>

                {!isFDT &&
                  data.article.latest.authors.map(a => (
                    <AuthorWrapper key={a.id}>
                      <ArticleAuthor author={a} />
                    </AuthorWrapper>
                  ))}

                {!isFDT && (
                  <ArticleWrapper>
                    <H5
                      component={'h2'}
                      css={uppercase}
                    >
                      Kommentare
                    </H5>

                    {!data.article.disableComments && (
                      <CommentListContainer
                        id={data.article.id}
                        type={CommentItemType.Article}
                        variables={{
                          sort: CommentSort.Rating,
                          order: SortOrder.Descending,
                        }}
                        maxCommentDepth={1}
                      />
                    )}
                  </ArticleWrapper>
                )}
              </>
            )}
          </>
        }
      </Container>
    </WebsiteBuilderProvider>
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
    client.query({
      query: SettingListDocument,
    }),
    client.query({
      query: HotAndTrendingDocument,
      variables: {
        take: 4,
      },
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
          sort: CommentSort.Rating,
          order: SortOrder.Descending,
          itemId: article.data.article.id,
        },
      }),
      client.query({
        query: PeerProfileDocument,
      }),
      client.query({
        query: PrimaryBannerDocument,
        variables: {
          document: {
            type: BannerDocumentType.Article,
            id: article.data.article.id,
          },
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
