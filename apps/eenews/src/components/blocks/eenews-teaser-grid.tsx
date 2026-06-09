import styled from '@emotion/styled';
import { isFilledTeaser } from '@wepublish/block-content/website';
import {
  BuilderTeaserGridBlockProps,
  useWebsiteBuilder,
  WebsiteBuilderProvider,
} from '@wepublish/website/builder';

import { EeNewsBlockType } from '../block-styles/eenews-block-styles';
import { EenewsTeaser } from './eenews-teaser';
import { EenewsTeaserSkeleton } from './eenews-teaser-skeleton';

type EenewsTeaserGridProps = BuilderTeaserGridBlockProps & {
  loading?: boolean;
  skeletonCount?: number;
};

const Grid = styled('div', {
  shouldForwardProp: p => p !== 'columns',
})<{ columns: number }>`
  max-width: var(--max-width);
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(${({ columns }) => columns}, 1fr);
  gap: 36px 32px;

  ${({ theme }) => theme.breakpoints.down('lg')} {
    grid-template-columns: repeat(2, 1fr);
    gap: 24px;
  }
  ${({ theme }) => theme.breakpoints.down('sm')} {
    grid-template-columns: 1fr;
  }
`;

// Shared teaser grid that renders the same card layout as the home sections
// (Top-News, Aktuell, Dossiers). Registered as the website-builder `TeaserGrid`
// override so the search results and any teaser-grid block share it, and used
// directly on the article archive (`/a`).
export const EenewsTeaserGrid = ({
  teasers,
  numColumns,
  blockStyle,
  className,
  loading,
  skeletonCount,
}: EenewsTeaserGridProps) => {
  const {
    blocks: { Teaser },
  } = useWebsiteBuilder();
  const columns = numColumns || 3;
  const filled = (teasers ?? []).filter(isFilledTeaser);

  // While loading with nothing to show yet, render skeleton cards so the grid
  // reserves its space instead of popping in. Existing cards are kept during
  // background revalidation (filled.length > 0).
  if (!filled.length && loading) {
    return (
      <Grid
        className={className}
        columns={columns}
      >
        {Array.from({ length: skeletonCount ?? columns * 2 }).map((_, idx) => (
          <EenewsTeaserSkeleton key={idx} />
        ))}
      </Grid>
    );
  }

  if (!filled.length) {
    return null;
  }

  return (
    <Grid
      className={className}
      columns={columns}
    >
      <WebsiteBuilderProvider blocks={{ Teaser: EenewsTeaser }}>
        {filled.map((teaser, idx) => (
          <Teaser
            key={idx}
            teaser={teaser}
            index={idx}
            blockStyle={blockStyle ?? EeNewsBlockType.DossierGrid}
            numColumns={columns}
            alignment={{
              i: String(idx),
              x: 0,
              y: 0,
              w: Math.round(12 / columns),
              h: 1,
            }}
          />
        ))}
      </WebsiteBuilderProvider>
    </Grid>
  );
};
