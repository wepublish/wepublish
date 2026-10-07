import styled from '@emotion/styled';
import { usePeerProfileQuery } from '@wepublish/editor/api';

import { SeoBlockContext } from '../blocks/blocksToPlaintext';
import { SeoAnalysis } from './seoAnalysis';
import { SeoDocumentChecklist } from './seoDocumentChecklist';
import {
  getSeoPreviewData,
  SeoContentType,
  SeoPreviewMetadata,
} from './seoPreviewData';
import { GooglePreview } from './seoPreviews';

const SeoTabWrapper = styled.div`
  display: grid;
  gap: 24px;
`;

export interface SeoTabProps {
  readonly type: SeoContentType;
  readonly metadata: SeoPreviewMetadata & { readonly slug?: string | null };
  readonly seoContext?: SeoBlockContext;
}

export function SeoTab({ type, metadata, seoContext }: SeoTabProps) {
  const { data: peerProfile } = usePeerProfileQuery();
  const profile = peerProfile?.peerProfile;

  const previewData = getSeoPreviewData(
    type,
    metadata,
    seoContext ?? {},
    profile?.name
  );

  return (
    <SeoTabWrapper>
      <SeoDocumentChecklist
        metadata={{
          seoTitle: metadata.seoTitle,
          seoDescription: metadata.seoDescription,
          socialMediaTitle: metadata.socialMediaTitle,
          socialMediaDescription: metadata.socialMediaDescription,
          slug: metadata.slug,
        }}
        stats={seoContext?.stats}
        shareImage={previewData.image}
      />

      <SeoAnalysis stats={seoContext?.stats} />

      <GooglePreview
        data={previewData}
        siteName={profile?.name}
        favicon={profile?.squareLogo ?? profile?.logo}
      />
    </SeoTabWrapper>
  );
}
