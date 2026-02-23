import styled from '@emotion/styled';
import {
  ArticleContainer as AricleContainerDefault,
  ArticleListContainer,
  ArticleWrapper as DefaultArticleWrapper,
} from '@wepublish/article/website';
import { ArticleListWrapper } from '@wepublish/article/website';
import { CommentListContainer } from '@wepublish/comments/website';
import { ContentWrapper } from '@wepublish/content/website';
import { H2 } from '@wepublish/ui';
import { CommentItemType, Tag } from '@wepublish/website/api';
import {
  addClientCacheToV1Props,
  ArticleDocument,
  ArticleListDocument,
  CommentListDocument,
  getV1ApiClient,
  NavigationListDocument,
  PeerProfileDocument,
  useArticleQuery,
} from '@wepublish/website/api';
import { useWebsiteBuilder } from '@wepublish/website/builder';
import { GetStaticProps } from 'next';
import getConfig from 'next/config';
import { useRouter } from 'next/router';
import { ComponentProps } from 'react';

import { TsriAttentionCatcher } from '../../src/components/break-blocks/tsri-attention-catcher';
import TsriAdHeader from '../../src/components/tsri-ad-header';

const AfterArticleWrapper = styled(DefaultArticleWrapper)`
  background-color: transparent !important;
`;

const AfterArticleTitle = styled(H2)`
  background-color: ${({ theme }) => theme.palette.common.black};
  color: ${({ theme }) => theme.palette.common.white};
  border-top-left-radius: 0.8rem;
  border-top-right-radius: 0.8rem;
  padding: 0.33rem 1rem;
  font-size: 1rem !important;
  line-height: 1.5rem !important;
  grid-column: -1 / 1;
  scroll-margin-top: ${({ theme }) => theme.spacing(8)};

  &:has(+ ${ArticleListWrapper}) {
    margin-bottom: ${({ theme }) => theme.spacing(-5)};
  }

  ${({ theme }) => theme.breakpoints.up('md')} {
    scroll-margin-top: ${({ theme }) => theme.spacing(5)};
  }
`;

export const AfterArticleAuthorWrapper = styled(ContentWrapper)`
  display: grid;
  grid-template-columns: unset;

  ${({ theme }) => theme.breakpoints.up('md')} {
    grid-template-columns: min-content 1fr min-content;
  }
`;

const ArticleContainer = styled(AricleContainerDefault)`
  ${TsriAttentionCatcher} {
    .MuiButton-root {
      padding-right: 2cqw;
    }
  }
`;

export default function ArticleBySlugOrId() {
  const {
    query: { slug, id },
  } = useRouter();

  const { data } = useArticleQuery({
    fetchPolicy: 'cache-only',
    variables: {
      slug: slug as string,
      id: id as string,
    },
  });

  const { ArticleAuthor } = useWebsiteBuilder();

  const containerProps = {
    slug,
    id,
  } as ComponentProps<typeof ArticleContainer>;

  return (
    <>
      <TsriAdHeader authors={data?.article?.latest.authors} />

      <ArticleContainer {...containerProps}>
        {data?.article?.latest.authors.map(author => (
          <AfterArticleAuthorWrapper
            key={author.id}
            fullWidth
          >
            <ArticleAuthor author={author} />
          </AfterArticleAuthorWrapper>
        ))}

        {data?.article && !data.article.disableComments && (
          <AfterArticleWrapper>
            <AfterArticleTitle
              component={'h2'}
              id="comments"
            >
              Kommentare
            </AfterArticleTitle>

            <CommentListContainer
              id={data.article.id}
              type={CommentItemType.Article}
              signUpUrl="/mitmachen"
            />
          </AfterArticleWrapper>
        )}
      </ArticleContainer>

      {data?.article && (
        <>
          <AfterArticleWrapper>
            <AfterArticleTitle component={'h2'}>
              Das könnte dich auch interessieren
            </AfterArticleTitle>

            <ArticleListContainer
              variables={{
                filter: { tags: data.article.tags.map(tag => tag.id) },
                take: 7,
              }}
              filter={articles =>
                articles
                  .filter(article => article.id !== data.article?.id)
                  .splice(0, 6)
              }
            />
          </AfterArticleWrapper>
        </>
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
          take: 7,
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
