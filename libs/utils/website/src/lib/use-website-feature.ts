import { useQuery } from '@apollo/client/react';
import type { FeatureKey } from '@wepublish/features';
import { FeaturesDocument } from '@wepublish/website/api';

/**
 * Whether this medium has a feature switched on in We.Publish One. False until
 * the answer is known and when it cannot be read, so a feature that is not
 * ready never flashes onto a page. The query needs a session: use it on pages
 * behind the auth guard and prefetch `FeaturesDocument` in getInitialProps.
 */
export function useWebsiteFeature(feature: FeatureKey): boolean {
  const { data } = useQuery(FeaturesDocument);

  return data?.features.includes(feature) ?? false;
}
