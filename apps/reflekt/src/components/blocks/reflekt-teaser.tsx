import styled from '@emotion/styled';
import { Button, Typography } from '@mui/material';
import {
  selectTeaserImage,
  selectTeaserTitle,
  selectTeaserUrl,
} from '@wepublish/block-content/website';
import { BuilderTeaserProps, Image } from '@wepublish/website/builder';

const TeaserCard = styled('a')`
  display: grid;
  grid-template-rows: auto 1fr auto;
  background-color: ${({ theme }) => theme.palette.common.white};
  text-decoration: none;
  color: inherit;
  border: 1px solid rgba(0, 0, 0, 0.08);
  overflow: hidden;
  transition: box-shadow 200ms ease;

  &:hover {
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
  }
`;

const TeaserImageWrapper = styled('div')`
  aspect-ratio: 3 / 2;
  overflow: hidden;
`;

const TeaserImg = styled(Image)`
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 300ms ease;

  ${TeaserCard}:hover & {
    transform: scale(1.03);
  }
`;

const TeaserContent = styled('div')`
  padding: ${({ theme }) => theme.spacing(2)};
  display: grid;
  gap: ${({ theme }) => theme.spacing(1.5)};
  align-content: start;
`;

const TeaserTitle = styled(Typography)`
  font-family: 'Euclid', sans-serif;
  font-weight: 700;
  font-size: 1.15rem;
  line-height: 1.3;
`;

const TeaserFooter = styled('div')`
  padding: ${({ theme }) => theme.spacing(0, 2, 2)};
`;

export const ReflektTeaser = ({ teaser, className }: BuilderTeaserProps) => {
  const title = teaser && selectTeaserTitle(teaser);
  const image = teaser && selectTeaserImage(teaser);
  const href = teaser && selectTeaserUrl(teaser);

  if (!teaser || !href) {
    return null;
  }

  return (
    <TeaserCard
      href={href}
      className={className}
    >
      <TeaserImageWrapper>
        {image && (
          <TeaserImg
            image={image}
            maxWidth={800}
          />
        )}
      </TeaserImageWrapper>

      <TeaserContent>
        {title && <TeaserTitle>{title}</TeaserTitle>}
      </TeaserContent>

      <TeaserFooter>
        <Button
          variant="cta-yellow"
          size="small"
          tabIndex={-1}
          sx={{ fontSize: '0.8rem', padding: '6px 20px' }}
        >
          Weiterlesen
        </Button>
      </TeaserFooter>
    </TeaserCard>
  );
};
