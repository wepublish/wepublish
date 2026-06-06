'use client';

import { Box, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';

interface DiscordPreviewProps {
  siteName: string;
  title: string;
  description: string;
  image: string;
  color?: string;
  small?: boolean;
}

const CardContainer = styled(Box)<{ accentColor: string }>(
  ({ accentColor }) => ({
    maxWidth: 432,
    backgroundColor: '#2b2d31',
    borderRadius: 4,
    overflow: 'hidden',
    borderLeft: `4px solid ${accentColor}`,
    display: 'flex',
    flexDirection: 'column',
  })
);

const ContentWrapper = styled(Box)({
  padding: '8px 16px 16px 12px',
  display: 'flex',
  gap: 16,
});

const TextContent = styled(Box)({
  flex: 1,
  minWidth: 0,
});

const SiteNameText = styled(Typography)({
  fontSize: '12px',
  color: '#b5bac1',
  lineHeight: 1.4,
  marginBottom: 4,
});

const TitleLink = styled(Typography)({
  fontSize: '16px',
  color: '#00a8fc',
  fontWeight: 600,
  lineHeight: 1.25,
  cursor: 'pointer',
  '&:hover': {
    textDecoration: 'underline',
  },
});

const DescriptionText = styled(Typography)({
  fontSize: '14px',
  color: '#dbdee1',
  lineHeight: 1.43,
  marginTop: 8,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  display: '-webkit-box',
  WebkitLineClamp: 3,
  WebkitBoxOrient: 'vertical',
});

const ThumbnailContainer = styled(Box)({
  width: 80,
  height: 80,
  borderRadius: 4,
  overflow: 'hidden',
  flexShrink: 0,
  marginTop: 8,
  '& img': {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
});

const LargeImageContainer = styled(Box)({
  width: '100%',
  maxWidth: 400,
  margin: '0 12px 16px',
  borderRadius: 4,
  overflow: 'hidden',
  '& img': {
    width: '100%',
    height: 'auto',
    display: 'block',
  },
});

export function DiscordPreview({
  small,
  siteName,
  title,
  description,
  image,
  color = '#1da0f2',
}: DiscordPreviewProps) {
  return (
    <CardContainer accentColor={color}>
      <ContentWrapper>
        <TextContent>
          <SiteNameText>{siteName}</SiteNameText>
          <TitleLink>{title}</TitleLink>
          <DescriptionText>{description}</DescriptionText>
        </TextContent>

        {small && (
          <ThumbnailContainer>
            <img
              src={image || '/placeholder.svg'}
              alt={title}
              fetchPriority="low"
              loading="lazy"
            />
          </ThumbnailContainer>
        )}
      </ContentWrapper>

      {!small && (
        <LargeImageContainer>
          <img
            src={image || '/placeholder.svg'}
            alt={title}
            fetchPriority="low"
            loading="lazy"
          />
        </LargeImageContainer>
      )}
    </CardContainer>
  );
}
