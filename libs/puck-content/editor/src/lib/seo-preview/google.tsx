'use client';

import { Box, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import { BsThreeDotsVertical } from 'react-icons/bs';

interface GoogleSearchPreviewProps {
  url: string;
  breadcrumbs: string[];
  title: string;
  description: string;
  favicon: string;
  siteName: string;
}

const CardContainer = styled(Box)({
  maxWidth: 600,
  fontFamily: 'arial, sans-serif',
});

const SiteInfoRow = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  marginBottom: 4,
});

const FaviconContainer = styled(Box)({
  width: 26,
  height: 26,
  borderRadius: '50%',
  backgroundColor: '#f1f3f4',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'hidden',
  '& img': {
    width: 18,
    height: 18,
    objectFit: 'contain',
  },
});

const SiteTextContainer = styled(Box)({
  flex: 1,
  minWidth: 0,
});

const SiteNameText = styled(Typography)({
  fontSize: '14px',
  color: '#202124',
  lineHeight: 1.3,
});

const BreadcrumbText = styled(Typography)({
  fontSize: '12px',
  color: '#4d5156',
  lineHeight: 1.4,
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  flexWrap: 'wrap',
});

const BreadcrumbSeparator = styled('span')({
  color: '#70757a',
  margin: '0 1px',
});

const MoreButton = styled(Box)({
  width: 24,
  height: 24,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  borderRadius: '50%',
  '&:hover': {
    backgroundColor: '#f1f3f4',
  },
});

const TitleLink = styled(Typography)({
  fontSize: '20px',
  color: '#1a0dab',
  fontWeight: 400,
  lineHeight: 1.3,
  cursor: 'pointer',
  '&:hover': {
    textDecoration: 'underline',
  },
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  display: '-webkit-box',
  WebkitLineClamp: 1,
  WebkitBoxOrient: 'vertical',
});

const DescriptionText = styled(Typography)({
  fontSize: '14px',
  color: '#4d5156',
  lineHeight: 1.58,
  marginTop: 4,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  '& em': {
    fontWeight: 700,
    fontStyle: 'normal',
  },
});

export function GoogleSearchPreview({
  breadcrumbs,
  title,
  description,
  favicon,
  siteName,
}: GoogleSearchPreviewProps) {
  return (
    <CardContainer>
      <SiteInfoRow>
        <FaviconContainer>
          <img
            src={favicon}
            alt={siteName}
            fetchPriority="low"
            loading="lazy"
          />
        </FaviconContainer>

        <SiteTextContainer>
          <SiteNameText>{siteName}</SiteNameText>
          <BreadcrumbText>
            {breadcrumbs.map((crumb, index) => (
              <span key={index}>
                {crumb}
                {index < breadcrumbs.length - 1 && (
                  <BreadcrumbSeparator>{' › '}</BreadcrumbSeparator>
                )}
              </span>
            ))}
          </BreadcrumbText>
        </SiteTextContainer>

        <MoreButton>
          <BsThreeDotsVertical
            size={16}
            color="#70757a"
          />
        </MoreButton>
      </SiteInfoRow>

      <TitleLink>{title}</TitleLink>
      <DescriptionText>{description}</DescriptionText>
    </CardContainer>
  );
}
