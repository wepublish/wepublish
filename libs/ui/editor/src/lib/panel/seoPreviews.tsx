import 'react-og-preview/styles.css';

import styled from '@emotion/styled';
import { Alert, useTheme } from '@mui/material';
import { FullImageFragment } from '@wepublish/editor/api';
import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { SocialPreview } from 'react-og-preview';

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
  color: ${({ theme }) => theme.vars.palette.text.secondary};
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

const googleColors = {
  light: {
    background: '#fff',
    border: '#dadce0',
    site: '#202124',
    url: '#4d5156',
    title: '#1a0dab',
    description: '#4d5156',
    favicon: '#f1f3f4',
  },
  dark: {
    background: '#1f1f1f',
    border: '#3c4043',
    site: '#dadce0',
    url: '#bdc1c6',
    title: '#8ab4f8',
    description: '#bdc1c6',
    favicon: '#303134',
  },
};

const Google = styled.div<{ dark: boolean }>`
  ${({ dark }) => {
    const colors = googleColors[dark ? 'dark' : 'light'];

    return `
      --google-site: ${colors.site};
      --google-url: ${colors.url};
      --google-title: ${colors.title};
      --google-description: ${colors.description};
      --google-favicon: ${colors.favicon};
      border: 1px solid ${colors.border};
      background: ${colors.background};
    `;
  }}
  font-family: Arial, sans-serif;
  max-width: 600px;
  padding: 12px 16px;
  border-radius: 8px;
`;

const GoogleSite = styled.div`
  display: grid;
  grid-template-columns: 28px 1fr;
  gap: 12px;
  align-items: center;
  font-size: 14px;
  color: var(--google-site);
`;

const GoogleFavicon = styled.div`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  overflow: hidden;
  background: var(--google-favicon);
`;

const GoogleFaviconImage = styled.img`
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const GoogleUrl = styled.div`
  font-size: 12px;
  color: var(--google-url);
`;

const GoogleTitle = styled.div`
  margin-top: 8px;
  font-size: 20px;
  line-height: 1.3;
  color: var(--google-title);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const GoogleDescription = styled(Clamp)`
  font-size: 14px;
  line-height: 1.58;
  color: var(--google-description);
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

export interface GooglePreviewProps {
  data: SeoPreviewData;
  siteName?: string | null;
  favicon?: FullImageFragment | null;
}

export function GooglePreview({ data, siteName, favicon }: GooglePreviewProps) {
  const { t } = useTranslation();
  const dark = useTheme().palette.mode === 'dark';

  const domain = data.domain ?? '';
  const path = data.url?.replace(/^https?:\/\/[^/]+/, '').replace(/\//g, ' › ');
  const faviconSrc = favicon?.squareURL ?? favicon?.url;

  return (
    <Previews>
      {!!data.ignoredFields.length && (
        <Alert severity="warning">
          {t('seoPreviews.pageIgnoresSeoFields')}
        </Alert>
      )}

      <PreviewSection
        title={t('seoPreviews.google')}
        note={
          (data.documentTitle?.length ?? 0) > GOOGLE_TITLE_LIMIT ?
            t('seoPreviews.googleTitleTooLong', { limit: GOOGLE_TITLE_LIMIT })
          : undefined
        }
      >
        <Google
          dark={dark}
          data-testid="seo-preview-google"
        >
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
    </Previews>
  );
}

export interface SocialPreviewsProps {
  data: SeoPreviewData;
}

export function SocialPreviews({ data }: SocialPreviewsProps) {
  const { t } = useTranslation();
  // react-og-preview switches to its dark card styles under a `.dark` parent
  const dark = useTheme().palette.mode === 'dark';

  const social = {
    url: data.url ?? '',
    title: data.socialTitle ?? null,
    description: data.socialDescription ?? null,
    image: toOgImage(data.image),
    disableLink: true,
  };

  return (
    <Previews className={dark ? 'dark' : undefined}>
      <Alert severity="info">{t('seoPreviews.info')}</Alert>

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

      <PreviewSection title={t('seoPreviews.xLarge')}>
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

      <PreviewSection title={t('seoPreviews.xSummary')}>
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
