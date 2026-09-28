import styled from '@emotion/styled';
import { FullImageFragment } from '@wepublish/editor/api';
import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Message } from 'rsuite';

import { SeoPreviewData } from './seoPreviewData';

export const GOOGLE_TITLE_LIMIT = 60;
export const GOOGLE_DESCRIPTION_LIMIT = 158;

const truncate = (text: string | undefined, max: number) =>
  text && text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;

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

const Clamp = styled.div<{ lines: number }>`
  display: -webkit-box;
  -webkit-line-clamp: ${({ lines }) => lines};
  -webkit-box-orient: vertical;
  overflow: hidden;
  overflow-wrap: anywhere;
`;

const ImagePlaceholder = styled.div`
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
  background: #e4e6eb;
  color: #65676b;
  font-size: 12px;
`;

const Img = styled.img`
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const PreviewImage = ({
  image,
  square,
}: {
  image?: FullImageFragment;
  square?: boolean;
}) => {
  const { t } = useTranslation();
  const src = square ? image?.squareURL : (image?.largeURL ?? image?.url);

  if (!src) {
    return <ImagePlaceholder>{t('seoPreviews.noImage')}</ImagePlaceholder>;
  }

  return (
    <Img
      src={src}
      alt={image?.description ?? ''}
    />
  );
};

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

const Facebook = styled.div`
  font-family: Helvetica, Arial, sans-serif;
  max-width: 500px;
  border: 1px solid #dadde1;
  background: #f2f3f5;
`;

const WideImage = styled.div`
  aspect-ratio: 1.91 / 1;
  overflow: hidden;
`;

const FacebookText = styled.div`
  padding: 10px 12px;
  display: grid;
  gap: 2px;
`;

const Domain = styled.div`
  font-size: 12px;
  color: #606770;
`;

const FacebookDomain = styled(Domain)`
  text-transform: uppercase;
`;

const FacebookTitle = styled(Clamp)`
  font-size: 16px;
  font-weight: 600;
  color: #1d2129;
`;

const FacebookDescription = styled(Clamp)`
  font-size: 14px;
  color: #606770;
`;

const LinkedIn = styled.div`
  font-family: -apple-system, system-ui, sans-serif;
  max-width: 550px;
  border: 1px solid #e0dfdc;
  border-radius: 8px;
  overflow: hidden;
  background: #fff;
`;

const LinkedInText = styled.div`
  padding: 8px 12px;
  display: grid;
  gap: 4px;
`;

const LinkedInTitle = styled(Clamp)`
  font-size: 14px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.9);
`;

const WhatsApp = styled.div`
  font-family: -apple-system, system-ui, sans-serif;
  max-width: 360px;
  padding: 4px;
  border-radius: 8px;
  background: #d9fdd3;
`;

const WhatsAppCard = styled.div`
  border-radius: 6px;
  overflow: hidden;
  background: #cfe9c7;
`;

const WhatsAppText = styled.div`
  padding: 8px 10px;
  display: grid;
  gap: 2px;
`;

const WhatsAppTitle = styled(Clamp)`
  font-size: 14px;
  font-weight: 600;
  color: #111b21;
`;

const WhatsAppDescription = styled(Clamp)`
  font-size: 13px;
  color: #54656f;
`;

const WhatsAppLink = styled.div`
  padding: 6px 6px 2px;
  font-size: 14px;
  color: #027eb5;
  overflow-wrap: anywhere;
`;

const Discord = styled.div<{ accent: string }>`
  font-family: 'gg sans', 'Noto Sans', Helvetica, Arial, sans-serif;
  max-width: 432px;
  padding: 8px 16px 16px 12px;
  border-left: 4px solid ${({ accent }) => accent};
  border-radius: 4px;
  background: #2b2d31;
  display: grid;
  gap: 8px;
`;

const DiscordSite = styled.div`
  font-size: 12px;
  color: #dbdee1;
`;

const DiscordTitle = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: #00a8fc;
`;

const DiscordDescription = styled(Clamp)`
  font-size: 14px;
  color: #dbdee1;
`;

const DiscordImage = styled(WideImage)`
  border-radius: 4px;
`;

const XLarge = styled.div`
  font-family: -apple-system, system-ui, sans-serif;
  max-width: 506px;
`;

const XLargeImage = styled(WideImage)`
  position: relative;
  border: 1px solid #cfd9de;
  border-radius: 16px;
`;

const XOverlay = styled.div`
  position: absolute;
  left: 12px;
  bottom: 12px;
  max-width: calc(100% - 24px);
  padding: 0 4px;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.77);
  color: #fff;
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const XFrom = styled.div`
  margin-top: 4px;
  font-size: 13px;
  color: #536471;
`;

const XSummary = styled.div`
  font-family: -apple-system, system-ui, sans-serif;
  max-width: 506px;
  display: grid;
  grid-template-columns: 130px 1fr;
  border: 1px solid #cfd9de;
  border-radius: 16px;
  overflow: hidden;
`;

const XSummaryImage = styled.div`
  aspect-ratio: 1;
  border-right: 1px solid #cfd9de;
`;

const XSummaryText = styled.div`
  padding: 12px;
  display: grid;
  align-content: center;
  gap: 2px;
  font-size: 15px;
`;

const XMuted = styled(Clamp)`
  color: #536471;
`;

const XTitle = styled(Clamp)`
  color: #0f1419;
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
  readonly accentColor?: string | null;
}

export function SeoPreviews({
  data,
  siteName,
  favicon,
  accentColor,
}: SeoPreviewsProps) {
  const { t } = useTranslation();

  const domain = data.domain ?? '';
  const path = data.url?.replace(/^https?:\/\/[^/]+/, '').replace(/\//g, ' › ');

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
              {favicon && (
                <PreviewImage
                  image={favicon}
                  square
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
        <Facebook data-testid="seo-preview-facebook">
          <WideImage>
            <PreviewImage image={data.image} />
          </WideImage>
          <FacebookText>
            <FacebookDomain>{domain}</FacebookDomain>
            <FacebookTitle lines={2}>{data.socialTitle}</FacebookTitle>
            <FacebookDescription lines={1}>
              {data.socialDescription}
            </FacebookDescription>
          </FacebookText>
        </Facebook>
      </PreviewSection>

      <PreviewSection title={t('seoPreviews.linkedIn')}>
        <LinkedIn data-testid="seo-preview-linkedin">
          <WideImage>
            <PreviewImage image={data.image} />
          </WideImage>
          <LinkedInText>
            <LinkedInTitle lines={2}>{data.socialTitle}</LinkedInTitle>
            <Domain>{domain}</Domain>
          </LinkedInText>
        </LinkedIn>
      </PreviewSection>

      <PreviewSection title={t('seoPreviews.whatsApp')}>
        <WhatsApp data-testid="seo-preview-whatsapp">
          <WhatsAppCard>
            <WideImage>
              <PreviewImage image={data.image} />
            </WideImage>
            <WhatsAppText>
              <WhatsAppTitle lines={2}>{data.socialTitle}</WhatsAppTitle>
              <WhatsAppDescription lines={2}>
                {data.socialDescription}
              </WhatsAppDescription>
              <Domain>{domain}</Domain>
            </WhatsAppText>
          </WhatsAppCard>
          <WhatsAppLink>{data.url}</WhatsAppLink>
        </WhatsApp>
      </PreviewSection>

      <PreviewSection title={t('seoPreviews.discord')}>
        <Discord
          accent={accentColor || '#1e1f22'}
          data-testid="seo-preview-discord"
        >
          {siteName && <DiscordSite>{siteName}</DiscordSite>}
          <DiscordTitle>{data.socialTitle}</DiscordTitle>
          <DiscordDescription lines={3}>
            {data.socialDescription}
          </DiscordDescription>
          <DiscordImage>
            <PreviewImage image={data.image} />
          </DiscordImage>
        </Discord>
      </PreviewSection>

      <PreviewSection
        title={t('seoPreviews.xLarge')}
        note={t('seoPreviews.xLargeUsed')}
      >
        <XLarge data-testid="seo-preview-x-large">
          <XLargeImage>
            <PreviewImage image={data.image} />
            <XOverlay>{data.socialTitle}</XOverlay>
          </XLargeImage>
          <XFrom>{t('seoPreviews.xFrom', { domain })}</XFrom>
        </XLarge>
      </PreviewSection>

      <PreviewSection
        title={t('seoPreviews.xSummary')}
        note={t('seoPreviews.xSummaryUnused')}
      >
        <XSummary data-testid="seo-preview-x-summary">
          <XSummaryImage>
            <PreviewImage
              image={data.image}
              square
            />
          </XSummaryImage>
          <XSummaryText>
            <XMuted lines={1}>{domain}</XMuted>
            <XTitle lines={1}>{data.socialTitle}</XTitle>
            <XMuted lines={2}>{data.socialDescription}</XMuted>
          </XSummaryText>
        </XSummary>
      </PreviewSection>
    </Previews>
  );
}
