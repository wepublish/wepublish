import 'react-og-preview/styles.css';

import styled from '@emotion/styled';
import { FullImageFragment } from '@wepublish/editor/api';
import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { SocialPreview } from 'react-og-preview';
import { Message } from 'rsuite';

import { SeoPreviewData } from './seoPreviewData';

export const GOOGLE_TITLE_LIMIT = 60;
export const GOOGLE_DESCRIPTION_LIMIT = 158;

const truncate = (text: string | undefined, max: number) =>
  text && text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;

const toOgImage = (image?: FullImageFragment, square?: boolean) => {
  const url = square ? image?.squareURL : (image?.largeURL ?? image?.url);

  return url ? { url, alt: image?.description ?? '' } : null;
};

const Previews = styled.div`
  display: grid;
  gap: 24px;
`;

const Preview = styled.section`
  display: grid;
  gap: 8px;
`;

const PreviewTitle = styled.h6`
  display: flex;
  gap: 8px;
  align-items: baseline;
  margin: 0;
`;

const PreviewNote = styled.small`
  font-weight: normal;
  color: var(--rs-text-secondary, #8e8e93);
`;

const SocialCard = styled.div<{ maxWidth: number }>`
  max-width: ${({ maxWidth }) => maxWidth}px;
`;

const Clamp = styled.div<{ lines: number }>`
  display: -webkit-box;
  -webkit-line-clamp: ${({ lines }) => lines};
  -webkit-box-orient: vertical;
  overflow: hidden;
  overflow-wrap: anywhere;
`;

const Google = styled.div`
  font-family: Arial, sans-serif;
  max-width: 600px;
  padding: 12px 16px;
  border: 1px solid #dadce0;
  border-radius: 8px;
  background: #fff;
`;

const GoogleSite = styled.div`
  display: grid;
  grid-template-columns: 28px 1fr;
  gap: 12px;
  align-items: center;
  font-size: 14px;
  color: #202124;
`;

const GoogleFavicon = styled.div`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  overflow: hidden;
  background: #f1f3f4;
`;

const GoogleFaviconImage = styled.img`
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const GoogleUrl = styled.div`
  font-size: 12px;
  color: #4d5156;
`;

const GoogleTitle = styled.div`
  margin-top: 8px;
  font-size: 20px;
  line-height: 1.3;
  color: #1a0dab;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const GoogleDescription = styled(Clamp)`
  font-size: 14px;
  line-height: 1.58;
  color: #4d5156;
`;

const PreviewSection = ({
  title,
  note,
  children,
}: {
  title: string;
  note?: ReactNode;
  children: ReactNode;
}) => (
  <Preview>
    <PreviewTitle>
      {title}
      {note && <PreviewNote>{note}</PreviewNote>}
    </PreviewTitle>
    {children}
  </Preview>
);

export interface SeoPreviewsProps {
  readonly data: SeoPreviewData;
  readonly siteName?: string | null;
  readonly favicon?: FullImageFragment | null;
}

export function SeoPreviews({ data, siteName, favicon }: SeoPreviewsProps) {
  const { t } = useTranslation();

  const domain = data.domain ?? '';
  const path = data.url?.replace(/^https?:\/\/[^/]+/, '').replace(/\//g, ' › ');
  const faviconSrc = favicon?.squareURL ?? favicon?.url;

  const social = {
    url: data.url ?? '',
    title: data.socialTitle ?? null,
    description: data.socialDescription ?? null,
    image: toOgImage(data.image),
    disableLink: true,
  };

  return (
    <Previews>
      <Message
        showIcon
        type="info"
      >
        {t('seoPreviews.info')}
      </Message>

      {!!data.ignoredFields.length && (
        <Message
          showIcon
          type="warning"
        >
          {t('seoPreviews.pageIgnoresSeoFields')}
        </Message>
      )}

      <PreviewSection
        title={t('seoPreviews.google')}
        note={
          (data.documentTitle?.length ?? 0) > GOOGLE_TITLE_LIMIT ?
            t('seoPreviews.googleTitleTooLong', { limit: GOOGLE_TITLE_LIMIT })
          : undefined
        }
      >
        <Google data-testid="seo-preview-google">
          <GoogleSite>
            <GoogleFavicon>
              {faviconSrc && (
                <GoogleFaviconImage
                  src={faviconSrc}
                  alt=""
                />
              )}
            </GoogleFavicon>
            <div>
              <div>{siteName || domain}</div>
              <GoogleUrl>
                {domain}
                {path}
              </GoogleUrl>
            </div>
          </GoogleSite>
          <GoogleTitle>{data.documentTitle}</GoogleTitle>
          <GoogleDescription lines={2}>
            {truncate(data.description, GOOGLE_DESCRIPTION_LIMIT)}
          </GoogleDescription>
        </Google>
      </PreviewSection>

      <PreviewSection title={t('seoPreviews.facebook')}>
        <SocialCard
          maxWidth={500}
          data-testid="seo-preview-facebook"
        >
          <SocialPreview
            provider="facebook"
            {...social}
          />
        </SocialCard>
      </PreviewSection>

      <PreviewSection title={t('seoPreviews.linkedIn')}>
        <SocialCard
          maxWidth={550}
          data-testid="seo-preview-linkedin"
        >
          <SocialPreview
            provider="linkedin"
            {...social}
          />
        </SocialCard>
      </PreviewSection>

      <PreviewSection title={t('seoPreviews.whatsApp')}>
        <SocialCard
          maxWidth={360}
          data-testid="seo-preview-whatsapp"
        >
          <SocialPreview
            provider="whatsapp"
            {...social}
          />
        </SocialCard>
      </PreviewSection>

      <PreviewSection title={t('seoPreviews.discord')}>
        <SocialCard
          maxWidth={432}
          data-testid="seo-preview-discord"
        >
          <SocialPreview
            provider="discord"
            {...social}
          />
        </SocialCard>
      </PreviewSection>

      <PreviewSection
        title={t('seoPreviews.xLarge')}
        note={t('seoPreviews.xLargeUsed')}
      >
        <SocialCard
          maxWidth={506}
          data-testid="seo-preview-x-large"
        >
          <SocialPreview
            provider="twitter"
            variant="large"
            {...social}
          />
        </SocialCard>
      </PreviewSection>

      <PreviewSection
        title={t('seoPreviews.xSummary')}
        note={t('seoPreviews.xSummaryUnused')}
      >
        <SocialCard
          maxWidth={506}
          data-testid="seo-preview-x-summary"
        >
          <SocialPreview
            provider="twitter"
            variant="compact"
            {...social}
            image={toOgImage(data.image, true)}
          />
        </SocialCard>
      </PreviewSection>
    </Previews>
  );
}
