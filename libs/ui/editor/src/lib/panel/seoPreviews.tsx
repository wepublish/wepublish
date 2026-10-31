import 'react-og-preview/styles.css';

import styled from '@emotion/styled';
import { Alert } from '@mui/material';
import { FullImageFragment } from '@wepublish/editor/api';
import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { SocialPreview } from 'react-og-preview';

import { useDarkMode } from '../useDarkMode';
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
  grid-template-columns: minmax(0, 1fr);
  gap: 24px;
  min-width: 0;
`;

const Preview = styled.section`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 8px;
  min-width: 0;
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

const linkedInColors = {
  light: {
    background: '#fff',
    border: '#e0dfdc',
    title: 'rgba(0, 0, 0, 0.9)',
    hostname: 'rgba(0, 0, 0, 0.6)',
    placeholder: '#eef3f8',
  },
  dark: {
    background: '#1b1f23',
    border: '#38434f',
    title: 'rgba(255, 255, 255, 0.9)',
    hostname: 'rgba(255, 255, 255, 0.6)',
    placeholder: '#38434f',
  },
};

const LinkedIn = styled.div<{ dark: boolean }>`
  ${({ dark }) => {
    const colors = linkedInColors[dark ? 'dark' : 'light'];

    return `
      --linkedin-title: ${colors.title};
      --linkedin-hostname: ${colors.hostname};
      --linkedin-placeholder: ${colors.placeholder};
      border: 1px solid ${colors.border};
      background: ${colors.background};
    `;
  }}
  max-width: 552px;
  display: grid;
  grid-template-columns: 128px minmax(0, 1fr);
  gap: 16px;
  align-items: center;
  padding: 12px;
  border-radius: 8px;
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial,
    sans-serif;

  &:hover > div:last-of-type > div:first-of-type {
    text-decoration: underline;
  }
`;

const LinkedInImage = styled.img`
  display: block;
  width: 128px;
  aspect-ratio: 1.91;
  object-fit: cover;
  border-radius: 8px;
`;

const LinkedInPlaceholder = styled.div`
  display: grid;
  place-items: center;
  width: 128px;
  aspect-ratio: 1.91;
  border-radius: 8px;
  background: var(--linkedin-placeholder);
  color: var(--linkedin-hostname);
  font-size: 20px;
`;

const PlaceholderIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width="1em"
    height="1em"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <rect
      x="3"
      y="3"
      width="18"
      height="18"
      rx="2"
      ry="2"
    />
    <circle
      cx="8.5"
      cy="8.5"
      r="1.5"
    />
    <path d="M21 15l-5-5L5 21" />
  </svg>
);

const VisuallyHidden = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
`;

const LinkedInTitle = styled(Clamp)`
  font-size: 14px;
  font-weight: 600;
  line-height: 1.43;
  color: var(--linkedin-title);
`;

const LinkedInHostname = styled.div`
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.33;
  color: var(--linkedin-hostname);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const discordColors = {
  light: {
    background: '#f2f3f5',
    border: '#e3e5e8',
    title: '#006ce7',
    description: '#2e3338',
    placeholder: '#e3e5e8',
    icon: '#80848e',
  },
  dark: {
    background: '#2b2d31',
    border: '#1e1f22',
    title: '#00a8fc',
    description: '#dbdee1',
    placeholder: '#1e1f22',
    icon: '#80848e',
  },
};

const Discord = styled.div<{ dark: boolean }>`
  ${({ dark }) => {
    const colors = discordColors[dark ? 'dark' : 'light'];

    return `
      --discord-title: ${colors.title};
      --discord-description: ${colors.description};
      --discord-placeholder: ${colors.placeholder};
      --discord-icon: ${colors.icon};
      border-left: 4px solid ${colors.border};
      background: ${colors.background};
    `;
  }}
  max-width: 432px;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 8px;
  padding: 8px 16px 16px 12px;
  border-radius: 4px;
  font-family:
    'gg sans', 'Noto Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif;
`;

const DiscordTitle = styled.div`
  font-size: 16px;
  font-weight: 600;
  line-height: 1.375;
  color: var(--discord-title);
  overflow-wrap: anywhere;
`;

const DiscordDescription = styled.div`
  font-size: 14px;
  line-height: 1.43;
  color: var(--discord-description);
  white-space: pre-line;
  overflow-wrap: anywhere;
`;

const DiscordImage = styled.img`
  display: block;
  width: 100%;
  aspect-ratio: 1.91;
  object-fit: cover;
  border-radius: 4px;
`;

const DiscordPlaceholder = styled.div`
  display: grid;
  place-items: center;
  width: 100%;
  aspect-ratio: 1.91;
  border-radius: 4px;
  background: var(--discord-placeholder);
  color: var(--discord-icon);
  font-size: 20px;
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
  min-width: 0;
  font-family: Arial, sans-serif;
  max-width: 600px;
  padding: 12px 16px;
  border-radius: 8px;
`;

const GoogleSite = styled.div`
  display: grid;
  grid-template-columns: 28px minmax(0, 1fr);
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
  const dark = useDarkMode();

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

export function SeoPreviewInfo() {
  const { t } = useTranslation();

  return <Alert severity="info">{t('seoPreviews.info')}</Alert>;
}

export interface SocialPreviewsProps {
  data: SeoPreviewData;
}

export function SocialPreviews({ data }: SocialPreviewsProps) {
  const { t } = useTranslation();
  // react-og-preview switches to its dark card styles under a `.dark` parent
  const dark = useDarkMode();

  const social = {
    url: data.url ?? '',
    title: data.socialTitle ?? null,
    description: data.socialDescription ?? null,
    image: toOgImage(data.image),
    disableLink: true,
  };

  return (
    <Previews className={dark ? 'dark' : undefined}>
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
        <LinkedIn
          dark={dark}
          data-testid="seo-preview-linkedin"
        >
          {social.image ?
            <LinkedInImage
              src={social.image.url}
              alt={social.image.alt}
            />
          : <LinkedInPlaceholder>
              <PlaceholderIcon />
              <VisuallyHidden>{t('seoPreviews.noImage')}</VisuallyHidden>
            </LinkedInPlaceholder>
          }

          <div>
            <LinkedInTitle lines={2}>
              {social.title || data.domain}
            </LinkedInTitle>
            <LinkedInHostname>{data.domain}</LinkedInHostname>
          </div>
        </LinkedIn>
      </PreviewSection>

      <PreviewSection title={t('seoPreviews.whatsApp')}>
        <SocialCard
          maxWidth={360}
          data-testid="seo-preview-whatsapp"
        >
          <SocialPreview
            provider="whatsapp"
            {...social}
            image={social.image ?? { url: '' }}
          />
        </SocialCard>
      </PreviewSection>

      <PreviewSection title={t('seoPreviews.discord')}>
        <Discord
          dark={dark}
          data-testid="seo-preview-discord"
        >
          <DiscordTitle>{social.title || data.domain}</DiscordTitle>

          {social.description && (
            <DiscordDescription>{social.description}</DiscordDescription>
          )}

          {social.image ?
            <DiscordImage
              src={social.image.url}
              alt={social.image.alt}
            />
          : <DiscordPlaceholder>
              <PlaceholderIcon />
              <VisuallyHidden>{t('seoPreviews.noImage')}</VisuallyHidden>
            </DiscordPlaceholder>
          }
        </Discord>
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
