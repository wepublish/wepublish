import {
  PollBlockProvider,
  SubscribeBlockProvider,
} from '@wepublish/block-content/website';
import { BannerDocumentType, useArticleQuery } from '@wepublish/website/api';
import { Article, BuilderContainerProps } from '@wepublish/website/builder';
import { BannerContainer } from '@wepublish/banner/website';
import { PropsWithChildren } from 'react';
import { useShowPaywall } from '@wepublish/paywall/website';

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
  const { data, loading, error } = useArticleQuery({
    variables: {
      id,
      slug,
    },
  });
  const { showPaywall, hideContent } = useShowPaywall(data?.article?.paywall);

  return (
    <PollBlockProvider>
      <SubscribeBlockProvider>
        <BannerContainer
          documentId={data?.article?.id}
          documentType={BannerDocumentType.Article}
        />

        <Article
          data={data}
          loading={loading}
          error={error}
          showPaywall={showPaywall}
          hideContent={hideContent}
          className={className}
        >
          {children}
        </Article>
      </SubscribeBlockProvider>
    </PollBlockProvider>
  );
}
