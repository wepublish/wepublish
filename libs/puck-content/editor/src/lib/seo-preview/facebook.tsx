'use client';

import { Box, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';

interface FacebookPreviewProps {
  url: string;
  domain: string;
  title: string;
  description: string;
  image: string;
}

const CardContainer = styled(Box)({
  maxWidth: 500,
  backgroundColor: '#f0f2f5',
  borderRadius: 8,
  overflow: 'hidden',
  cursor: 'pointer',
  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
  '&:hover': {
    '& .fb-content': {
      backgroundColor: '#e4e6e9',
    },
  },
});

const ImageContainer = styled(Box)({
  width: '100%',
  height: 261,
  position: 'relative',
  overflow: 'hidden',
  backgroundColor: '#e4e6eb',
  '& img': {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
});

const ContentContainer = styled(Box)({
  padding: '10px 12px',
  backgroundColor: '#f0f2f5',
  transition: 'background-color 0.1s',
});

const DomainText = styled(Typography)({
  fontSize: '12px',
  color: '#65676b',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  lineHeight: 1.4,
});

const TitleText = styled(Typography)({
  fontSize: '16px',
  color: '#050505',
  fontWeight: 600,
  lineHeight: 1.25,
  marginTop: 3,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
});

const DescriptionText = styled(Typography)({
  fontSize: '14px',
  color: '#65676b',
  lineHeight: 1.33,
  marginTop: 3,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  display: '-webkit-box',
  WebkitLineClamp: 1,
  WebkitBoxOrient: 'vertical',
});

export function FacebookPreview({
  domain,
  title,
  description,
  image,
}: FacebookPreviewProps) {
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

      <ContentContainer className="fb-content">
        <DomainText>{domain}</DomainText>
        <TitleText>{title}</TitleText>
        <DescriptionText>{description}</DescriptionText>
      </ContentContainer>
    </CardContainer>
  );
}
