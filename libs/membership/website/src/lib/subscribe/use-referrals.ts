import { useQuery } from '@apollo/client/react';
import { useUser } from '@wepublish/authentication/website';
import { FeaturesDocument } from '@wepublish/website/api';

/**
 * Whether referrals are switched on for this medium. The `features` query
 * needs a session, so for a reader who is not signed in this is false: the
 * subscribe form then asks for no referrer, but still passes on the code of
 * a referral link.
 */
export function useReferrals(): boolean {
  const { hasUser } = useUser();
  const { data } = useQuery(FeaturesDocument, { skip: !hasUser });

  return !!data?.features.includes('referrals');
}
