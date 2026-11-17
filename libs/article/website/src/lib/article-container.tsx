import { useQuery } from '@apollo/client/react';
import {
  PollBlockProvider,
  SubscribeBlockProvider,
} from '@wepublish/block-content/website';
import {
  EngagementBannerSlot,
  EngagementPromptSlot,
  resolveEngagement,
  useArticleEngagement,
  useEngagementDismissals,
} from '@wepublish/engagement/website';
import { useShowPaywall } from '@wepublish/paywall/website';
import { ArticleDocument } from '@wepublish/website/api';
import { Article, BuilderContainerProps } from '@wepublish/website/builder';
import { PropsWithChildren, useMemo } from 'react';

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
  // The server cuts restricted articles. viewArticle meters the reader and,
  // when they may read on, writes every block into the cached article.
  const { access, prompts } = useArticleEngagement(data?.article);
  const { showPaywall, hideContent } = useShowPaywall(
    data?.article?.paywall,
    data?.article?.id
  );
  const { dismissals, legacyBannerClosedAt, now, dismiss } =
    useEngagementDismissals();
  const { banner, modal, inline, restriction } = useMemo(
    () =>
      resolveEngagement({
        access,
        prompts,
        dismissals,
        legacyBannerClosedAt,
        now,
      }),
    [access, prompts, dismissals, legacyBannerClosedAt, now]
  );
  const tags = useMemo(
    () =>
      data?.article?.tags
        .map(tag => tag.tag)
        .filter((tag): tag is string => !!tag),
    [data?.article?.tags]
  );

  return (
    <PollBlockProvider>
      <SubscribeBlockProvider>
        {banner && (
          <EngagementBannerSlot
            key={banner.stage.id}
            prompt={banner}
            tags={tags}
          />
        )}

        <Article
          data={data}
          loading={loading}
          error={error}
          showPaywall={showPaywall}
          hideContent={hideContent}
          className={className}
        >
          {inline && (
            <EngagementPromptSlot
              key={inline.stage.id}
              prompt={inline}
              onDismiss={dismiss}
            />
          )}

          {restriction?.prompt && (
            <EngagementPromptSlot
              key={restriction.prompt.stage.id}
              prompt={restriction.prompt}
              onDismiss={dismiss}
            />
          )}

          {modal && (
            <EngagementPromptSlot
              key={modal.stage.id}
              prompt={modal}
              onDismiss={dismiss}
            />
          )}

          {children}
        </Article>
      </SubscribeBlockProvider>
    </PollBlockProvider>
  );
}
