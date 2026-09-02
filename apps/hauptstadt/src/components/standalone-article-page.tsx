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
import { CommentItemType, useArticleQuery } from '@wepublish/website/api';
import { Link, useWebsiteBuilder } from '@wepublish/website/builder';
import { usePathname, useSearchParams } from 'next/navigation';
import { useRouter } from 'next/router';
import { anyPass } from 'ramda';
import { ComponentProps } from 'react';

import { DuplicatedPaywall } from './hauptstadt-paywall';

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
