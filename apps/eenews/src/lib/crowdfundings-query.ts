import { gql, useQuery } from '@apollo/client';
import {
  FullCrowdfundingFragment,
  FullCrowdfundingFragmentDoc,
} from '@wepublish/website/api';

export const CrowdfundingsDocument = gql`
  query Crowdfundings {
    crowdfundings {
      ...FullCrowdfunding
    }
  }
  ${FullCrowdfundingFragmentDoc}
`;

export type CrowdfundingsQuery = {
  __typename?: 'Query';
  crowdfundings: FullCrowdfundingFragment[];
};

export const useCrowdfundingsQuery = () =>
  useQuery<CrowdfundingsQuery>(CrowdfundingsDocument);
