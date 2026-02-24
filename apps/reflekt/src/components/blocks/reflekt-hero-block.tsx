import styled from '@emotion/styled';
import { css } from '@mui/material';
import { isImageBlock } from '@wepublish/block-content/website';
import {
  BlockContent,
  ImageBlock as ImageBlockType,
} from '@wepublish/website/api';
import {
  BuilderFlexBlockProps,
  Image,
  useWebsiteBuilder,
} from '@wepublish/website/builder';

const HeroWrapper = styled('div')`
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 7;
  overflow: hidden;
  grid-column: -1 / 1;

  ${({ theme }) => css`
    ${theme.breakpoints.down('sm')} {
      aspect-ratio: 4 / 3;
    }
  `}
`;

const DesktopImageWrapper = styled('div')`
  position: absolute;
  inset: 0;
  display: none;

  ${({ theme }) => css`
    ${theme.breakpoints.up('md')} {
      display: block;
    }
  `}
`;

const MobileImageWrapper = styled('div')`
  position: absolute;
  inset: 0;
  display: block;

  ${({ theme }) => css`
    ${theme.breakpoints.up('md')} {
      display: none;
    }
  `}
`;

const HeroImageFill = styled(Image)`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const HeroTextOverlay = styled('div')`
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: ${({ theme }) => theme.spacing(4)};
  background: linear-gradient(
    to top,
    rgba(0, 0, 0, 0.75) 0%,
    rgba(0, 0, 0, 0) 55%
  );
  color: white;

  ${({ theme }) => css`
    ${theme.breakpoints.up('md')} {
      padding: ${theme.spacing(6)};
    }
  `}
`;

export const ReflektHeroBlock = ({ blocks }: BuilderFlexBlockProps) => {
  const {
    blocks: { Renderer },
  } = useWebsiteBuilder();

  const sortedBlocks = [...blocks].sort(
    (a, b) => a.alignment.y - b.alignment.y || a.alignment.x - b.alignment.x
  );

  const imageBlocks = sortedBlocks.filter(
    b => b.block && isImageBlock(b.block)
  );
  const textBlocks = sortedBlocks.filter(
    b => !b.block || !isImageBlock(b.block)
  );

  const desktopImage = imageBlocks[0]?.block as ImageBlockType | undefined;
  const mobileImage = (imageBlocks[1]?.block ?? imageBlocks[0]?.block) as
    | ImageBlockType
    | undefined;

  return (
    <HeroWrapper>
      {desktopImage?.image && (
        <DesktopImageWrapper>
          <HeroImageFill
            image={desktopImage.image}
            maxWidth={1500}
          />
        </DesktopImageWrapper>
      )}

      {mobileImage?.image && (
        <MobileImageWrapper>
          <HeroImageFill
            image={mobileImage.image}
            maxWidth={800}
          />
        </MobileImageWrapper>
      )}

      {textBlocks.length > 0 && (
        <HeroTextOverlay>
          {textBlocks.map((b, i) => (
            <Renderer
              key={i}
              block={b.block as BlockContent}
              type="Article"
              index={i}
              count={textBlocks.length}
            />
          ))}
        </HeroTextOverlay>
      )}
    </HeroWrapper>
  );
};
