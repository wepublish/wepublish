import { BlockRenderer } from '@wepublish/block-content/website';
import { FullBlockFragment } from '@wepublish/website/api';
import { BuilderBlockRendererProps } from '@wepublish/website/builder';
import { cond } from 'ramda';
import { useMemo } from 'react';

import {
  isAktuellGrid,
  isArticleSupportCallout,
  isDossierGrid,
  isFlexSectionBand,
  isTopNewsCarousel,
} from '../block-predicates';
import { EenewsAktuellGrid } from '../blocks/eenews-aktuell-grid';
import { EenewsArticleSupportCallout } from '../blocks/eenews-article-support';
import { EenewsDossierGrid } from '../blocks/eenews-dossier-grid';
import { EenewsSectionBand } from '../blocks/eenews-section-band';
import { EenewsTopNewsCarousel } from '../blocks/eenews-top-news-carousel';

export const EenewsBlockRenderer = (props: BuilderBlockRendererProps) => {
  const extraBlockMap = useMemo(
    () =>
      cond([
        [isTopNewsCarousel, block => <EenewsTopNewsCarousel {...block} />],
        [isAktuellGrid, block => <EenewsAktuellGrid {...block} />],
        [isDossierGrid, block => <EenewsDossierGrid {...block} />],
        [isFlexSectionBand, block => <EenewsSectionBand {...block} />],
        [
          isArticleSupportCallout,
          block => <EenewsArticleSupportCallout {...block} />,
        ],
      ]) as (block: FullBlockFragment) => JSX.Element | undefined,
    []
  );

  return extraBlockMap(props.block) ?? <BlockRenderer {...props} />;
};
