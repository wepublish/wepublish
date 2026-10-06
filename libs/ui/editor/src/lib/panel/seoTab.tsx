import styled from '@emotion/styled';
import {
  SeoMetadataContentType,
  usePeerProfileQuery,
} from '@wepublish/editor/api';

import { SeoBlockContext } from '../blocks/blocksToPlaintext';
import { SeoAnalysis } from './seoAnalysis';
import { SeoDocumentChecklist } from './seoDocumentChecklist';
import { getSeoPreviewData, SeoPreviewMetadata } from './seoPreviewData';
import { SeoPreviews } from './seoPreviews';
import { AppliedSeoSuggestions, SeoSuggestions } from './seoSuggestions';

const SeoTabWrapper = styled.div`
  display: grid;
  gap: 24px;
`;

export interface SeoTabProps {
  readonly type: SeoMetadataContentType;
  readonly metadata: SeoPreviewMetadata & { readonly slug?: string | null };
  readonly seoContext?: SeoBlockContext;
  readonly disabled?: boolean;

  onApply(values: AppliedSeoSuggestions): void;
}

export function SeoTab({
  type,
  metadata,
  seoContext,
  disabled,
  onApply,
}: SeoTabProps) {
  const { data: peerProfile } = usePeerProfileQuery();
  const profile = peerProfile?.peerProfile;

  const previewData = getSeoPreviewData(
    type,
    metadata,
    seoContext ?? {},
    profile?.name
  );

  const context = {
    title: metadata.title,
    lead: metadata.lead,
    body: seoContext?.body,
  };

  const seoFields = {
    seoTitle: metadata.seoTitle,
    seoDescription: metadata.seoDescription,
    socialMediaTitle: metadata.socialMediaTitle,
    socialMediaDescription: metadata.socialMediaDescription,
    slug: metadata.slug,
  };

  return (
    <SeoTabWrapper>
      <SeoDocumentChecklist
        metadata={seoFields}
        stats={seoContext?.stats}
        shareImage={previewData.image}
      />

      <SeoSuggestions
        type={type}
        context={context}
        value={seoFields}
        disabled={disabled}
        onApply={onApply}
      />

      <SeoAnalysis
        type={type}
        context={context}
        metadata={seoFields}
        stats={seoContext?.stats}
        hasShareImage={!!previewData.image}
        disabled={disabled}
      />

      <SeoPreviews
        data={previewData}
        siteName={profile?.name}
        favicon={profile?.squareLogo ?? profile?.logo}
      />
    </SeoTabWrapper>
  );
}
