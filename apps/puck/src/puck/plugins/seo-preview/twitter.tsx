'use client';

import { Box, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';

interface TwitterPreviewProps {
  url: string;
  domain: string;
  title: string;
  description: string;
  image: string;
}

const CardContainer = styled(Box)({
  maxWidth: 504,
  borderRadius: 16,
  overflow: 'hidden',
  border: '1px solid #cfd9de',
  cursor: 'pointer',
  transition: 'background-color 0.2s',
  '&:hover': {
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
  },
});

const ImageContainer = styled(Box)({
  width: '100%',
  height: 252,
  position: 'relative',
  overflow: 'hidden',
  '& img': {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
});

const ContentContainer = styled(Box)({
  padding: '12px',
  borderTop: '1px solid #cfd9de',
});

const DomainText = styled(Typography)({
  fontSize: '13px',
  color: '#536471',
  textTransform: 'lowercase',
  lineHeight: 1.2,
});

const TitleText = styled(Typography)({
  fontSize: '15px',
  color: '#0f1419',
  fontWeight: 400,
  lineHeight: 1.3,
  marginTop: 2,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  display: '-webkit-box',
  WebkitLineClamp: 1,
  WebkitBoxOrient: 'vertical',
});

const DescriptionText = styled(Typography)({
  fontSize: '15px',
  color: '#536471',
  lineHeight: 1.3,
  marginTop: 2,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
});

export function TwitterPreview({
  url,
  domain,
  title,
  description,
  image,
}: TwitterPreviewProps) {
  return (
    <CardContainer>
      <ImageContainer>
        <img
          src={image}
          alt={title}
          fetchPriority="low"
          loading="lazy"
        />
      </ImageContainer>
      <ContentContainer>
        <DomainText>{domain}</DomainText>
        <TitleText>{title}</TitleText>
        <DescriptionText>{description}</DescriptionText>
      </ContentContainer>
    </CardContainer>
  );
}
