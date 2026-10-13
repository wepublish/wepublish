import { useQuery } from '@apollo/client/react';
import {
  PollBlockProvider,
  SubscribeBlockProvider,
} from '@wepublish/block-content/website';
import { ArticleDocument, BannerDocumentType } from '@wepublish/website/api';
import {
  Article,
  BuilderContainerProps,
  ContentGate,
} from '@wepublish/website/builder';
import { BannerContainer } from '@wepublish/banner/website';
import { PropsWithChildren, useMemo } from 'react';
import { useShowPaywall } from '@wepublish/paywall/website';
import { useContentGate } from '@wepublish/content-gate/website';

type IdOrSlug = { id: string; slug?: never } | { id?: never; slug: string };

export type ArticleContainerProps = PropsWithChildren<
  IdOrSlug & BuilderContainerProps
>;

export function ArticleContainer({
  id,
  slug,
  className,
  children,
}: ArticleContainerProps) {
  const { data, loading, error } = useQuery(ArticleDocument, {
    variables: {
      id,
      slug,
    },
  });
  const { showPaywall, hideContent } = useShowPaywall(data?.article?.paywall);
  const {
    state: contentGateState,
    gate,
    unlockedBlocks,
  } = useContentGate(data?.article);

  // The api only sends the preview blocks of gated articles,
  // the rest arrives once the reader's meter allows it.
  const articleData = useMemo(
    () =>
      data?.article && unlockedBlocks ?
        {
          ...data,
          article: {
            ...data.article,
            latest: { ...data.article.latest, blocks: unlockedBlocks },
          },
        }
      : data,
    [data, unlockedBlocks]
  );

  return (
    <PollBlockProvider>
      <SubscribeBlockProvider>
        <BannerContainer
          documentId={data?.article?.id}
          documentType={BannerDocumentType.Article}
          tags={data?.article?.tags
            .map(tag => tag.tag)
            .filter((tag): tag is string => !!tag)}
        />

        <Article
          data={articleData}
          loading={loading}
          error={error}
          showPaywall={showPaywall}
          hideContent={hideContent}
          className={className}
        >
          {gate &&
            (contentGateState === 'soft' || contentGateState === 'hard') && (
              <ContentGate
                key={data?.article?.id}
                {...gate}
                state={contentGateState}
              />
            )}

          {children}
        </Article>
      </SubscribeBlockProvider>
    </PollBlockProvider>
  );
}
