import { keyframes } from '@emotion/react';
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
import { BlockContent, FlexAlignment } from '@wepublish/website/api';
import {
  BuilderBlockRendererProps,
  BuilderFlexBlockProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { allPass } from 'ramda';
import { useEffect, useState } from 'react';
import { useIntersectionObserver } from 'usehooks-ts';

import { ReflektBlockType } from '../block-styles/reflekt-block-styles';

export const isFlexBlockFullsizeImage = (
  block: Pick<BlockContent, '__typename'>
): block is BuilderFlexBlockProps => {
  return allPass([
    hasBlockStyle(ReflektBlockType.FlexBlockFullsizeImage),
    isFlexBlock,
  ])(block);
};

const textRoll = keyframes`
  from { transform: translateY(100%); }
  to { transform: translateY(-75vw); }
`;

export const FlexBlockFullsizeImageWrapper = styled('div')`
  display: grid;
  gap: 0;
  grid-column: -1 / 1;

  ${RichTextBlockWrapper} {
    transform: translateY(100%);
  }

  &[data-text-visible='true'] ${RichTextBlockWrapper} {
    transform: none;
    animation: ${textRoll} 10s linear infinite;
  }

  ${({ theme }) => theme.breakpoints.up('md')} {
    &[data-text-visible='true'] ${RichTextBlockWrapper} {
      animation: none;
      transform: translateY(25vh);
      transition: transform 2s ease-out;
    }
  }
`;

export const BlockWithAlignment = styled('div')<FlexAlignment>`
  grid-column: -1 / 1;
  grid-row: 1 / 2;
  position: relative;
  overflow: hidden;

  ${ImageBlockWrapper} {
    height: auto;
    width: 100vw;

    ${({ theme }) => theme.breakpoints.up('md')} {
      height: calc(100vh - var(--navbar-height));
    }
  }

  ${ImageBlockInnerWrapper} {
    ${({ theme }) => theme.breakpoints.up('md')} {
      position: absolute;
      top: 0;
      left: 0;
      bottom: 0;
      right: 0;
      overflow: hidden;
    }
  }

  ${RichTextBlockWrapper} {
    background-color: transparent;
    color: white;
    margin: 0;
    width: calc(100vw - ${({ theme }) => theme.spacing(4)});

    z-index: 2;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;

    position: absolute;
    bottom: 0;
    left: 50%;
    margin-left: calc(-50% + ${({ theme }) => theme.spacing(2)});

    ${({ theme }) => theme.breakpoints.up('md')} {
      margin: 0 auto;
      position: static;
      width: 50%;
    }

    .MuiTypography-root {
      font-size: 2.333rem;
      line-height: 1.2;
      margin-bottom: ${({ theme }) => theme.spacing(4)};

      ${({ theme }) => theme.breakpoints.up('md')} {
        font-size: 3rem;
      }
    }
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

export const FlexBlockFullsizeImage = ({
  className,
  blocks,
  type,
}: BuilderFlexBlockProps & { type?: BuilderBlockRendererProps['type'] }) => {
  const {
    blocks: { Renderer },
  } = useWebsiteBuilder();

  const { isIntersecting: partiallyVisible, ref } = useIntersectionObserver({
    initialIsIntersecting: false,
    threshold: 0.5,
  });

  const [textVisible, setTextVisible] = useState(false);

  useEffect(() => {
    if (partiallyVisible) setTextVisible(true);
  }, [partiallyVisible]);

  const sortedBlocks = [...(blocks ?? [])].sort(
    (a, b) => a.alignment.y - b.alignment.y || a.alignment.x - b.alignment.x
  );

  return (
    <FlexBlockFullsizeImageWrapper
      className={className}
      ref={ref}
      data-text-visible={textVisible}
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
    </FlexBlockFullsizeImageWrapper>
  );
};
