'use client';

import { Box, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import { IoCheckmarkDone } from 'react-icons/io5';

interface WhatsAppPreviewProps {
  url: string;
  domain: string;
  title: string;
  description: string;
  image: string;
  time?: string;
}

const MessageBubble = styled(Box)({
  maxWidth: 330,
  backgroundColor: '#d9fdd3',
  borderRadius: '7.5px',
  overflow: 'hidden',
  boxShadow: '0 1px 0.5px rgba(0, 0, 0, 0.13)',
  position: 'relative',
});

const LinkPreviewContainer = styled(Box)({
  margin: '3px 3px 0',
  borderRadius: '6px',
  overflow: 'hidden',
  backgroundColor: '#d1f4cc',
});

const ImageContainer = styled(Box)({
  width: '100%',
  height: 140,
  position: 'relative',
  overflow: 'hidden',
  '& img': {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
});

const ContentContainer = styled(Box)({
  padding: '6px 8px 8px',
});

const TitleText = styled(Typography)({
  fontSize: '13px',
  color: '#111b21',
  fontWeight: 400,
  lineHeight: 1.27,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
});

const DescriptionText = styled(Typography)({
  fontSize: '12px',
  color: '#667781',
  lineHeight: 1.27,
  marginTop: 2,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
});

const DomainText = styled(Typography)({
  fontSize: '12px',
  color: '#667781',
  lineHeight: 1.27,
  marginTop: 4,
  textTransform: 'lowercase',
});

const UrlContainer = styled(Box)({
  padding: '0 7px 6px',
});

const UrlText = styled(Typography)({
  fontSize: '14px',
  color: '#027eb5',
  lineHeight: 1.35,
  wordBreak: 'break-all',
});

const TimeContainer = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: 3,
  padding: '0 6px 5px',
});

const TimeText = styled(Typography)({
  fontSize: '11px',
  color: '#667781',
});

export function WhatsAppPreview({
  url,
  domain,
  title,
  description,
  image,
  time = '10:30 AM',
}: WhatsAppPreviewProps) {
  return (
    <MessageBubble>
      <LinkPreviewContainer>
        <ImageContainer>
          <img
            src={image}
            alt={title}
            fetchPriority="low"
            loading="lazy"
          />
        </ImageContainer>

        <ContentContainer>
          <TitleText>{title}</TitleText>
          <DescriptionText>{description}</DescriptionText>
          <DomainText>{domain}</DomainText>
        </ContentContainer>
      </LinkPreviewContainer>

      <UrlContainer>
        <UrlText>{url}</UrlText>
      </UrlContainer>

      <TimeContainer>
        <TimeText>{time}</TimeText>
        <IoCheckmarkDone
          size={16}
          color="#53bdeb"
        />
      </TimeContainer>
    </MessageBubble>
  );
}
