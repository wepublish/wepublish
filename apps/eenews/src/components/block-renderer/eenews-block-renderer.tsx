import styled from '@emotion/styled';
import {
  BlockRenderer,
  isCrowdfundingBlock,
  isFlexBlock,
  isRichTextBlock,
} from '@wepublish/block-content/website';
import { useFullWidthContent } from '@wepublish/content/website';
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
import { EenewsArticleRichText } from '../eenews-article-richtext';

// The homepage renders blocks full-width (ContentWidthProvider fullWidth), so —
// like Top-News and Aktuell — the crowdfunding block constrains itself to the
// centre column instead of spanning the whole window.
const CrowdfundingSection = styled('section')`
  background-color: #eaffdd;
  padding: 56px 56px 36px;

  ${({ theme }) => theme.breakpoints.down('lg')} {
    padding: 36px 20px 24px;
  }
`;

const CrowdfundingInner = styled('div')`
  max-width: var(--max-width);
  margin: 0 auto;
`;

const flexBlockHostsCrowdfunding = (block: FullBlockFragment): boolean =>
  isFlexBlock(block) &&
  (block.blocks ?? []).some(
    nested => !!nested.block && isCrowdfundingBlock(nested.block)
  );

export const EenewsBlockRenderer = (props: BuilderBlockRendererProps) => {
  const fullWidth = useFullWidthContent();

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

  const custom = extraBlockMap(props.block);
  if (custom) {
    return custom;
  }

  if (
    props.type === 'Article' &&
    props.index === 0 &&
    isRichTextBlock(props.block)
  ) {
    return (
      <EenewsArticleRichText
        className={props.className}
        richText={props.block.richText}
      />
    );
  }

  if (fullWidth && flexBlockHostsCrowdfunding(props.block)) {
    return (
      <CrowdfundingSection className={props.className}>
        <CrowdfundingInner>
          <BlockRenderer
            {...props}
            className=""
          />
        </CrowdfundingInner>
      </CrowdfundingSection>
    );
  }

  if (isCrowdfundingBlock(props.block)) {
    if ((props.level ?? 0) > 0 || !fullWidth) {
      return <BlockRenderer {...props} />;
    }

    return (
      <CrowdfundingSection className={props.className}>
        <CrowdfundingInner>
          <BlockRenderer
            {...props}
            className=""
          />
        </CrowdfundingInner>
      </CrowdfundingSection>
    );
  }

  return <BlockRenderer {...props} />;
};
