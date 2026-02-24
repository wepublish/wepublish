import styled from '@emotion/styled';
import { Typography } from '@mui/material';
import {
  selectTeaserImage,
  selectTeaserLead,
  selectTeaserTitle,
  selectTeaserUrl,
} from '@wepublish/block-content/website';
import { BuilderTeaserProps, Image } from '@wepublish/website/builder';

type TeaserTextColor = 'white' | 'black';

const getTeaserTextColor = (
  teaser: BuilderTeaserProps['teaser']
): TeaserTextColor => {
  if (teaser?.__typename === 'ArticleTeaser') {
    const val = teaser.article?.latest?.properties?.find(
      (p: { key: string }) => p.key === 'teaserTextColor'
    )?.value;
    if (val === 'black') return 'black';
  }
  return 'white';
};

const TeaserCard = styled('a')<{ textColor: TeaserTextColor }>`
  display: grid;
  position: relative;
  aspect-ratio: 3 / 2;
  overflow: hidden;
  text-decoration: none;
  color: ${({ textColor }) => (textColor === 'black' ? '#000' : '#fff')};
  cursor: pointer;

  &:hover img {
    transform: scale(1.03);
  }
`;

const TeaserBgImage = styled(Image)`
  width: 100%;
  height: 100%;
  object-fit: cover;
  position: absolute;
  inset: 0;
  transition: transform 300ms ease;
`;

const TeaserOverlay = styled('div')<{ textColor: TeaserTextColor }>`
  position: absolute;
  inset: 0;
  background: ${({ textColor }) =>
    textColor === 'black' ?
      'linear-gradient(to top, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0) 50%)'
    : 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0) 55%)'};
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: ${({ theme }) => theme.spacing(2)};
  gap: ${({ theme }) => theme.spacing(0.5)};
`;

const TeaserTitle = styled(Typography)`
  font-family: 'Euclid', sans-serif;
  font-weight: 700;
  font-size: clamp(0.95rem, 2vw, 1.2rem);
  line-height: 1.25;
`;

const TeaserLead = styled(Typography)`
  font-size: 0.85rem;
  line-height: 1.4;
  opacity: 0.9;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

export const ReflektTeaser = ({ teaser, className }: BuilderTeaserProps) => {
  const title = teaser && selectTeaserTitle(teaser);
  const lead = teaser && selectTeaserLead(teaser);
  const image = teaser && selectTeaserImage(teaser);
  const href = teaser && selectTeaserUrl(teaser);
  const textColor = getTeaserTextColor(teaser);

  if (!teaser || !href) {
    return null;
  }

  return (
    <TeaserCard
      href={href}
      className={className}
      textColor={textColor}
    >
      {image && (
        <TeaserBgImage
          image={image}
          maxWidth={800}
        />
      )}

      <TeaserOverlay textColor={textColor}>
        {title && <TeaserTitle>{title}</TeaserTitle>}
        {lead && <TeaserLead>{lead}</TeaserLead>}
      </TeaserOverlay>
    </TeaserCard>
  );
};
