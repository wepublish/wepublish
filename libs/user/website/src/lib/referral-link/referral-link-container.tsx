import { useQuery } from '@apollo/client/react';
import { useUser } from '@wepublish/authentication/website';
import { ReferralCodeDocument } from '@wepublish/website/api';
import { BuilderContainerProps } from '@wepublish/website/builder';
import { useCallback, useMemo, useSyncExternalStore } from 'react';
import { ReferralLink } from './referral-link';

export type ReferralLinkContainerProps = BuilderContainerProps & {
  /** Path of the page with the subscribe form the link leads to. */
  subscribePath?: string;
};

const subscribeToNothing = () => () => undefined;

// The origin is only known in the browser, the server renders without it.
const useOrigin = () =>
  useSyncExternalStore(
    subscribeToNothing,
    () => window.location.origin,
    () => null
  );

export function ReferralLinkContainer({
  className,
  subscribePath = '/mitmachen',
}: ReferralLinkContainerProps) {
  const { user } = useUser();
  const { data } = useQuery(ReferralCodeDocument, { skip: !user });
  const referralCode = data?.me?.referralCode;
  const origin = useOrigin();

  const referralLink = useMemo(() => {
    if (!referralCode || !origin) {
      return null;
    }

    const url = new URL(subscribePath, origin);
    url.searchParams.set('referrer', referralCode);

    return url.toString();
  }, [origin, referralCode, subscribePath]);

  const handleCopy = useCallback(
    (link: string) => navigator.clipboard.writeText(link),
    []
  );

  if (!user || !referralLink) {
    return null;
  }

  return (
    <ReferralLink
      className={className}
      referralLink={referralLink}
      onCopy={handleCopy}
    />
  );
}
