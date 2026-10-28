import { useQuery } from '@apollo/client/react';
import {
  BannerDocumentType,
  PrimaryBannerDocument,
} from '@wepublish/website/api';
import {
  BuilderContainerProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { useUser } from '@wepublish/authentication/website';
import { useActiveSubscriptions } from '@wepublish/membership/website';
import { hasPaywallBypass } from '@wepublish/paywall/website';

export type BannerContainerProps = {
  documentType: BannerDocumentType;
  documentId?: string;
  tags?: string[];
} & BuilderContainerProps;

export function BannerContainer({
  documentType,
  documentId,
  tags,
  className,
}: BannerContainerProps) {
  const { Banner } = useWebsiteBuilder();
  const { hasUser } = useUser();
  const activeSubscriptions = useActiveSubscriptions();
  const hasSubscription = !!activeSubscriptions?.length;

  const { data, loading, error } = useQuery(PrimaryBannerDocument, {
    skip: hasUser && activeSubscriptions == null,
    variables: {
      documentId: documentId ?? '',
      documentType,
      loggedIn: hasUser,
      hasSubscription,
      hasPaywallBypass: hasPaywallBypass(),
    },
  });

  return (
    <Banner
      data={data}
      loading={loading}
      error={error}
      tags={tags}
      className={className}
    />
  );
}
