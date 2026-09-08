import styled from '@emotion/styled';
import {
  BlockWithAlignment,
  FlexBlockWrapper,
  hasBlockStyle,
  isFlexBlock,
} from '@wepublish/block-content/website';
import {
  BlockContent,
  FlexAlignment,
  FullBlockFragment,
  FullFlexBlockFragment,
} from '@wepublish/website/api';
import {
  BuilderBlockRendererProps,
  BuilderFlexBlockProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { allPass } from 'ramda';
import { Fragment } from 'react';

import { CompactNewsSlotsWrapper } from '../teaser-layouts/layout-compact-news';
import { TeaserSlotsXLFullsizeImage } from '../teaser-layouts/layout-xl-fullsize-image-teasers';
import { TeaserLayoutWrapper } from '../teaser-layouts/tsri-layout';
import { FlexEntry, groupShortNewsRuns } from './short-news-runs';

export enum TsriFlexBlockType {
  SmallRowGapsWithShortNews = 'SmallRowGapsWithShortNews',
}

export const isFlexBlockSmallRowGapsWithShortNews = (
  block: Pick<BlockContent, '__typename'>
): block is FullFlexBlockFragment =>
  allPass([
    hasBlockStyle(TsriFlexBlockType.SmallRowGapsWithShortNews),
    isFlexBlock,
  ])(block);

export const MergedTeaserSlots = styled('div')`
  ${({ theme }) => theme.breakpoints.up('xs')} {
    grid-column: -1 / 1;
    display: grid;
    grid-template-columns: unset;
    row-gap: 4cqw;

    & > :is(${TeaserLayoutWrapper}, ${CompactNewsSlotsWrapper}) {
      display: contents;
    }
  }

  ${({ theme }) => theme.breakpoints.up('md')} {
    grid-template-columns: repeat(2, calc(50% - 1.25cqw / 2));
    column-gap: 1.25cqw;
    row-gap: 1.25cqw;
  }
`;

const FlexBlockWithShortNewsWrapper = styled(FlexBlockWrapper)`
  row-gap: 4cqw;

  ${({ theme }) => theme.breakpoints.up('md')} {
    row-gap: 1.25cqw;
  }

  ${({ theme }) => theme.breakpoints.up('xs')} {
    ${BlockWithAlignment} {
      &:has(${TeaserSlotsXLFullsizeImage}) {
        grid-column-start: unset;
        grid-column-end: unset;
        grid-column: -1 / 1;
      }
    }
  }
`;

export const FlexBlockSmallRowGapsWithShortNews = ({
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

  const sortedBlocks = [...blocks].sort(
    (a, b) => a.alignment.y - b.alignment.y || a.alignment.x - b.alignment.x
  );
  const runs = groupShortNewsRuns(sortedBlocks);

  const renderEntry = (entry: FlexEntry) => (
    <Renderer
      block={entry.block as FullBlockFragment}
      type={type ?? 'Page'}
      level={(level ?? 0) + 1}
      index={sortedBlocks.indexOf(entry)}
      count={sortedBlocks.length}
    />
  );

  return (
    <FlexBlockWithShortNewsWrapper className={className}>
      {runs.map((run, runIndex) =>
        run.merged ?
          <MergedTeaserSlots key={runIndex}>
            {run.entries.map(entry => (
              <Fragment key={sortedBlocks.indexOf(entry)}>
                {renderEntry(entry)}
              </Fragment>
            ))}
          </MergedTeaserSlots>
        : run.entries.map(entry => (
            <BlockWithAlignment
              key={sortedBlocks.indexOf(entry)}
              {...(entry.alignment as FlexAlignment)}
            >
              {renderEntry(entry)}
            </BlockWithAlignment>
          ))
      )}
    </FlexBlockWithShortNewsWrapper>
  );
};
