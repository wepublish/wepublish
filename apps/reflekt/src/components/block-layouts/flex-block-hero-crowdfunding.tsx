import styled from '@emotion/styled';
import { css, GlobalStyles } from '@mui/material';
import { hasBlockStyle, isFlexBlock } from '@wepublish/block-content/website';
import { BlockContent, FullBlockFragment } from '@wepublish/website/api';
import {
  BuilderBlockRendererProps,
  BuilderFlexBlockProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { allPass } from 'ramda';
import { startTransition, useEffect, useRef, useState } from 'react';

import { ReflektBlockStyles } from '../block-styles/reflekt-block-styles';
import { ReflektLogo } from '../reflekt-navbar';

export const isFlexBlockHeroCrowdfunding = (
  block: Pick<BlockContent, '__typename'>
): block is BuilderFlexBlockProps => {
  return allPass([
    hasBlockStyle(ReflektBlockStyles.FlexBlockHeroCrowdfunding),
    isFlexBlock,
  ])(block);
};

export const FlexBlockHeroCrowdfundingWrapper = styled('div')`
  width: 100vw;
  margin-left: calc(50% - 50vw);
  margin-right: calc(50% - 50vw);
  display: grid;
  justify-items: center;
  background-color: ${({ theme }) => theme.palette.secondary.dark};
`;

export const FlexBlockHeroCrowdfundingContent = styled('div')`
  width: 100%;
  max-width: var(--breakpoint-width);
  box-sizing: border-box;
  padding-top: calc(var(--navbar-height) + ${({ theme }) => theme.spacing(3)});
  padding-bottom: ${({ theme }) => theme.spacing(6)};
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
        {sortedBlocks.map((nestedBlock, index) => (
          <Renderer
            key={index}
            block={nestedBlock.block as FullBlockFragment}
            type={type ?? 'Page'}
            level={(level ?? 0) + 1}
            index={index}
            count={sortedBlocks.length}
          />
        ))}
      </FlexBlockHeroCrowdfundingContent>
    </FlexBlockHeroCrowdfundingWrapper>
  );
};
