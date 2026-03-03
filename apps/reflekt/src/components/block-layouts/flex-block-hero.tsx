import styled from '@emotion/styled';
import {
  hasBlockStyle,
  ImageBlockCaption,
  ImageBlockImage,
  ImageBlockInnerWrapper,
  ImageBlockWrapper,
  isFlexBlock,
  RichTextBlockWrapper,
} from '@wepublish/block-content/website';
import {
  type FlexBlock as FlexBlockType,
  BlockContent,
  FlexAlignment,
} from '@wepublish/website/api';
import {
  BuilderBlockRendererProps,
  BuilderFlexBlockProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { allPass } from 'ramda';
import { useIntersectionObserver } from 'usehooks-ts';

import { ReflektBlockType } from '../block-styles/reflekt-block-styles';
import { heroOffScreen } from '../reflekt-navbar';

export const isFlexBlockHero = (
  block: Pick<BlockContent, '__typename'>
): block is FlexBlockType => {
  return allPass([hasBlockStyle(ReflektBlockType.FlexBlockHero), isFlexBlock])(
    block
  );
};

export const FlexBlockHeroWrapper = styled('div')`
  margin-top: calc(-1 * var(--navbar-height));
  display: grid;
  gap: 0;
  grid-column: -1 / 1;
`;

export const BlockWithAlignment = styled('div')<FlexAlignment>`
  grid-column: -1 / 1;
  grid-row: 1 / 2;
  display: none;
  position: relative;

  &:nth-of-type(1):has(${ImageBlockWrapper}) {
    ${({ theme }) => theme.breakpoints.down('md')} {
      display: block;
    }
  }

  &:nth-of-type(2):has(${ImageBlockWrapper}) {
    ${({ theme }) => theme.breakpoints.up('md')} {
      display: block;
    }
  }

  &:nth-of-type(3) {
    z-index: 2;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
  }

  ${ImageBlockWrapper} {
    height: 100vh;
    width: 100vw;
  }

  ${ImageBlockInnerWrapper} {
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;
    overflow: hidden;
  }

  ${RichTextBlockWrapper} {
    background-color: transparent;
    color: white;
    width: 50%;
    margin: 0 auto;
  }

  ${ImageBlockImage} {
    object-fit: cover;
    aspect-ratio: unset;
    width: 100%;
    height: 100%;
    max-width: 100%;
    max-height: 100%;
  }

  ${ImageBlockCaption} {
    display: none;
  }
`;

export const FlexBlockHero = ({
  className,
  blocks,
  type,
}: BuilderFlexBlockProps) => {
  const {
    blocks: { Renderer },
  } = useWebsiteBuilder();
  const { isIntersecting, ref } = useIntersectionObserver({
    initialIsIntersecting: true,
    threshold: 0,
  });

  const sortedBlocks = [...blocks].sort(
    (a, b) => a.alignment.y - b.alignment.y || a.alignment.x - b.alignment.x
  );

  return (
    <FlexBlockHeroWrapper
      className={className}
      ref={ref}
    >
      {sortedBlocks.map((nestedBlock, index) => {
        return (
          <BlockWithAlignment
            key={index}
            {...(nestedBlock.alignment as FlexAlignment)}
          >
            <Renderer
              block={nestedBlock.block as BlockContent}
              type={
                (
                  (type as unknown as BuilderBlockRendererProps['type']) ===
                  'Article'
                ) ?
                  'ArticleNested'
                : 'PageNested'
              }
              index={index}
              count={sortedBlocks.length}
            />
          </BlockWithAlignment>
        );
      })}
      {heroOffScreen(isIntersecting)}
    </FlexBlockHeroWrapper>
  );
};
