import styled from '@emotion/styled';
import { css, GlobalStyles } from '@mui/material';
import {
  hasBlockStyle,
  IFrameBlockWrapper,
  isCrowdfundingBlock,
  isFlexBlock,
  isIFrameBlock,
  isVimeoVideoBlock,
  isYouTubeVideoBlock,
  RichTextBlockWrapper,
  VimeoVideoBlockWrapper,
  YouTubeVideoBlockWrapper,
} from '@wepublish/block-content/website';
import {
  BlockContent,
  FlexAlignment,
  FullBlockFragment,
} from '@wepublish/website/api';
import {
  BuilderBlockRendererProps,
  BuilderFlexBlockProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { allPass } from 'ramda';
import { startTransition, useEffect, useRef, useState } from 'react';

import theme from '../../theme';
import { ReflektBlockStyles } from '../block-styles/reflekt-block-styles';
import {
  BreakBlockVideo,
  BreakVideoFrame,
  breakVideoFromBlock,
} from '../break-blocks/break-block-video';
import { ReflektLogo } from '../reflekt-navbar';

const FLEX_GRID_COLUMN_COUNT = 12;

export const isFlexBlockHeroCrowdfunding = (
  block: Pick<BlockContent, '__typename'>
): block is BuilderFlexBlockProps => {
  return allPass([
    hasBlockStyle(ReflektBlockStyles.FlexBlockHeroCrowdfunding),
    isFlexBlock,
  ])(block);
};

const isVideoBlock = (block: Pick<BlockContent, '__typename'>): boolean =>
  isVimeoVideoBlock(block) ||
  isYouTubeVideoBlock(block) ||
  isIFrameBlock(block);

const isRightColumnBlock = (alignment: FlexAlignment): boolean =>
  alignment.x + alignment.w / 2 > FLEX_GRID_COLUMN_COUNT / 2;

export const FlexBlockHeroCrowdfundingWrapper = styled('div')`
  grid-column: -1 / 1;
  display: grid;
  justify-items: center;
  background-color: ${({ theme }) => theme.palette.secondary.dark};
  padding-top: ${({ theme }) => theme.spacing(10)};
  padding-bottom: ${({ theme }) => theme.spacing(8)};
`;

export const FlexBlockHeroCrowdfundingContent = styled('div')`
  width: 100%;
  max-width: var(--breakpoint-width);
  box-sizing: border-box;
  padding-top: calc(var(--navbar-height) + ${({ theme }) => theme.spacing(3)});
  padding-bottom: ${({ theme }) => theme.spacing(6)};
  padding-left: ${({ theme }) => theme.spacing(2)};
  padding-right: ${({ theme }) => theme.spacing(2)};

  display: grid;
  column-gap: ${({ theme }) => theme.spacing(6)};
  row-gap: ${({ theme }) => theme.spacing(8)};

  ${({ theme }) => theme.breakpoints.up('md')} {
    grid-template-columns: 5fr 3fr;
    align-items: start;
    column-gap: 3rem;
    row-gap: 0;
  }

  ${RichTextBlockWrapper} {
    color: ${theme.palette.common.white};
    max-width: unset;

    h1,
    h2 {
      font-size: clamp(2.25rem, 6.5vw, 2.8rem);
      margin-bottom: ${theme.spacing(2)};
      text-wrap: wrap;
    }

    h3 {
      font-size: clamp(1.3rem, 3.2vw, 1.5rem);
      margin-bottom: ${theme.spacing(2)};
      text-wrap: wrap;
    }
  }
`;

export const FlexBlockHeroCrowdfundingColumn = styled('div')`
  display: grid;
  align-content: start;
  gap: ${theme.spacing(4)};

  ${theme.breakpoints.up('md')} {
    align-self: center;
    gap: ${theme.spacing(2)};

    &:only-child {
      grid-column: 1 / -1;
    }
  }
`;

export const FlexBlockHeroCrowdfundingVideo = styled('div')`
  ${BreakVideoFrame} {
    width: 100%;
  }

  ${YouTubeVideoBlockWrapper},
  ${VimeoVideoBlockWrapper},
  ${IFrameBlockWrapper} {
    position: relative;
    aspect-ratio: 4 / 5;
    width: 100%;
    margin: 0 auto;
    overflow: hidden;

    > * {
      position: absolute;
      inset: 0;
      width: 100% !important;
      height: 100% !important;
      aspect-ratio: auto;
    }

    iframe {
      width: 100%;
      height: 100%;
    }
  }

  ${theme.breakpoints.up('md')} {
    ${BreakVideoFrame} {
      width: min(100%, 20rem);
    }

    ${YouTubeVideoBlockWrapper},
    ${VimeoVideoBlockWrapper},
    ${IFrameBlockWrapper} {
      width: min(100%, 20rem);
    }
  }
`;

export const FlexBlockHeroCrowdfunding = ({
  className,
  blocks,
  type,
  level,
}: BuilderFlexBlockProps & {
  type?: BuilderBlockRendererProps['type'];
  level?: number;
}) => {
  const {
    blocks: { Renderer },
  } = useWebsiteBuilder();
  const ref = useRef<HTMLDivElement>(null);
  const [isIntersecting, setIsIntersecting] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        startTransition(() => setIsIntersecting(entry.isIntersecting));
      },
      { threshold: 0 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const sortedBlocks = [...(blocks ?? [])].sort(
    (a, b) => a.alignment.y - b.alignment.y || a.alignment.x - b.alignment.x
  );

  const items = sortedBlocks.map((nestedBlock, index) => ({
    nestedBlock,
    index,
  }));

  let rightItems = items.filter(({ nestedBlock }) =>
    isRightColumnBlock(nestedBlock.alignment as FlexAlignment)
  );

  if (!rightItems.length) {
    rightItems = items.filter(({ nestedBlock }) =>
      isVideoBlock(nestedBlock.block as FullBlockFragment)
    );
  }

  const rightIndexes = new Set(rightItems.map(({ index }) => index));
  const leftItems = items.filter(({ index }) => !rightIndexes.has(index));
  const hasRightColumn = rightItems.length > 0;

  const renderItem = ({ nestedBlock, index }: (typeof items)[number]) => {
    const block = nestedBlock.block as FullBlockFragment;
    const styledBlock =
      isCrowdfundingBlock(block) ?
        { ...block, blockStyle: ReflektBlockStyles.CrowdfundingHero }
      : block;

    return (
      <Renderer
        key={index}
        block={styledBlock as FullBlockFragment}
        type={type ?? 'Page'}
        level={(level ?? 0) + 1}
        index={index}
        count={sortedBlocks.length}
      />
    );
  };

  return (
    <FlexBlockHeroCrowdfundingWrapper
      className={className}
      ref={ref}
    >
      {isIntersecting && (
        <GlobalStyles
          styles={css`
            :root {
              --navbar-bg-color-hero-off-screen: transparent !important;
            }

            ${ReflektLogo} {
              mix-blend-mode: difference !important;
              filter: none !important;
            }
          `}
        />
      )}

      <FlexBlockHeroCrowdfundingContent>
        <FlexBlockHeroCrowdfundingColumn>
          {leftItems.map(renderItem)}
        </FlexBlockHeroCrowdfundingColumn>

        {hasRightColumn && (
          <FlexBlockHeroCrowdfundingVideo>
            {rightItems.map(({ nestedBlock, index }) => {
              const video = breakVideoFromBlock(
                nestedBlock.block as FullBlockFragment
              );

              return video ?
                  <BreakBlockVideo
                    key={index}
                    video={video}
                    fit="contain"
                  />
                : renderItem({ nestedBlock, index });
            })}
          </FlexBlockHeroCrowdfundingVideo>
        )}
      </FlexBlockHeroCrowdfundingContent>
    </FlexBlockHeroCrowdfundingWrapper>
  );
};
