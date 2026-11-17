import { useQuery } from '@apollo/client/react';
import { useUser } from '@wepublish/authentication/website';
import {
  EngagementBannerSlot,
  EngagementPromptSlot,
  resolveEngagement,
  useEngagementDismissals,
  useHydrated,
  useNewsletterToken,
} from '@wepublish/engagement/website';
import { getPaywallBypassToken } from '@wepublish/paywall/website';
import {
  BannerDocumentType,
  EngagementDocumentType,
  EngagementPromptsDocument,
} from '@wepublish/website/api';
import { BuilderContainerProps } from '@wepublish/website/builder';
import { useEffect, useMemo, useRef } from 'react';

export type BannerContainerProps = {
  documentType: BannerDocumentType;
  documentId?: string;
  tags?: string[];
} & BuilderContainerProps;

/**
 * The banner (and modal) engagement prompts of a page. The server knows the
 * reader from the session, so only the bypass token is sent along.
 */
export function BannerContainer({
  documentType,
  documentId,
  tags,
  className,
}: BannerContainerProps) {
  const { user } = useUser();
  const { dismissals, legacyBannerClosedAt, now, dismiss } =
    useEngagementDismissals();

  const newsletterToken = useNewsletterToken();
  // The cookies are read once hydrated, so the first request carries them.
  const hydrated = useHydrated();
  const paywallBypassToken = hydrated ? getPaywallBypassToken() : undefined;

  const { data, refetch } = useQuery(EngagementPromptsDocument, {
    skip: !documentId || !hydrated,
    variables: {
      documentId: documentId ?? '',
      documentType:
        documentType === BannerDocumentType.Article ?
          EngagementDocumentType.Article
        : EngagementDocumentType.Page,
      paywallBypassToken,
      newsletterToken,
    },
  });

  // The server reads the reader from the session: ask again when it changes.
  const userId = user?.id;
  const askedFor = useRef(userId);

  useEffect(() => {
    if (askedFor.current === userId) {
      return;
    }

    askedFor.current = userId;

    if (documentId && hydrated) {
      refetch().catch(() => undefined);
    }
  }, [userId, documentId, hydrated, refetch]);

  const { banner, modal } = useMemo(
    () =>
      resolveEngagement({
        prompts: data?.engagementPrompts ?? [],
        dismissals,
        legacyBannerClosedAt,
        now,
      }),
    [data?.engagementPrompts, dismissals, legacyBannerClosedAt, now]
  );

  return (
    <>
      {banner && (
        <EngagementBannerSlot
          key={banner.stage.id}
          prompt={banner}
          tags={tags}
          className={className}
        />
      )}

      {modal && (
        <EngagementPromptSlot
          key={modal.stage.id}
          prompt={modal}
          onDismiss={dismiss}
        />
      )}
    </>
  );
}
