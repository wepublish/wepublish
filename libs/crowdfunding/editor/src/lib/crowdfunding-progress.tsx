import { useQuery } from '@apollo/client/react';
import { CrowdfundingDocument } from '@wepublish/editor/api';
import { CrowdfundingProgressBar } from '@wepublish/ui/editor';
import { useParams } from 'react-router-dom';

export function CrowdfundingProgress() {
  const { id = '' } = useParams();
  const { data } = useQuery(CrowdfundingDocument, { variables: { id } });

  if (data === undefined) {
    return null;
  }

  return <CrowdfundingProgressBar crowdfunding={data.crowdfunding} />;
}
