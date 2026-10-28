import { useQuery } from '@apollo/client/react';
import { useUser } from '@wepublish/authentication/website';
import {
  EngagementBannerSlot,
  EngagementPromptSlot,
  resolveEngagement,
  useEngagementDismissals,
} from '@wepublish/engagement/website';
import { getPaywallBypassToken } from '@wepublish/paywall/website';
import {
  BannerDocumentType,
  EngagementDocumentType,
  EngagementPromptsDocument,
} from '@wepublish/website/api';
import { BuilderContainerProps } from '@wepublish/website/builder';
import { useEffect, useMemo, useState } from 'react';

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
  const [paywallBypassToken, setPaywallBypassToken] = useState<string>();
  const { dismissals, legacyBannerClosedAt, now, dismiss } =
    useEngagementDismissals();

  useEffect(() => setPaywallBypassToken(getPaywallBypassToken()), []);

  const { data, refetch } = useQuery(EngagementPromptsDocument, {
    skip: !documentId,
    variables: {
      documentId: documentId ?? '',
      documentType:
        documentType === BannerDocumentType.Article ?
          EngagementDocumentType.Article
        : EngagementDocumentType.Page,
      paywallBypassToken,
    },
  });

  useEffect(() => {
    if (documentId) {
      refetch().catch(() => undefined);
    }
  }, [user?.id, documentId, refetch]);

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
