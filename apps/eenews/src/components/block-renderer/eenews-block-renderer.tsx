import styled from '@emotion/styled';
import {
  BlockRenderer,
  TeaserListBlockTeasers,
} from '@wepublish/block-content/website';
import {
  BuilderBlockRendererProps,
  useWebsiteBuilder,
  WebsiteBuilderProvider,
} from '@wepublish/website/builder';
import { cond } from 'ramda';
import { useMemo } from 'react';

import {
  isFeaturedLead,
  isNewsletterInline,
  isRichTextCallout,
  isTeaserCompactList,
  isTeaserSlotsStandard,
  isTeaserSlotsStandardLarge,
  isTopicStrip,
} from '../block-predicates';
import { EenewsCallout } from '../blocks/eenews-callout';
import { EenewsNewsletterInline } from '../blocks/eenews-newsletter-inline';
import { EenewsTeaser } from '../blocks/eenews-teaser';
import { EenewsTeaserSlots } from '../blocks/eenews-teaser-slots';
import { EenewsTopicStrip } from '../blocks/eenews-topic-strip';

// Same fix as in eenews-teaser-slots.tsx: target the wepublish styled grid
// via Emotion component selector so the override survives prod label
// stripping. Used by the TeaserCompactList branch below.
const TeaserListGridFrame = styled('div')`
  ${TeaserListBlockTeasers} {
    grid-template-columns: 1fr !important;
    gap: 0 !important;

    & > * {
      grid-column-start: auto !important;
      grid-column-end: auto !important;
      grid-row-start: auto !important;
      grid-row-end: auto !important;
    }
  }
`;

/**
 * EE News block renderer — Ramda `cond` dispatch on enum-typed predicates (MP-3).
 *
 * Each tuple is `[predicate, handler]`. Adding a new block-style is a new tuple,
 * not a new branch in this file. The renderer stays bounded as the project grows.
 *
 * For TeaserSlots / TeaserList variants, we wrap the default wepublish container in
 * a nested WebsiteBuilderProvider that injects the EeNews teaser — this scopes the
 * teaser override to that container only.
 */
export const EenewsBlockRenderer = (props: BuilderBlockRendererProps) => {
  const {
    blocks: { TeaserSlots, TeaserList },
  } = useWebsiteBuilder();

  const dispatch = useMemo(
    () =>
      cond<
        [Parameters<typeof BlockRenderer>[0]['block']],
        JSX.Element | undefined
      >([
        // Featured lead — single-teaser TeaserSlots rendered as a 2-col hero.
        [
          isFeaturedLead as any,
          block => <EenewsTeaserSlots {...(block as any)} />,
        ],
        // Standard 3-col grid of teasers with eyebrow + display section head.
        [
          isTeaserSlotsStandard as any,
          block => <EenewsTeaserSlots {...(block as any)} />,
        ],
        // Large (16:10) variant.
        [
          isTeaserSlotsStandardLarge as any,
          block => <EenewsTeaserSlots {...(block as any)} />,
        ],
        // Compact list (40px / 1fr / arrow row).
        [
          isTeaserCompactList as any,
          block => (
            <WebsiteBuilderProvider blocks={{ Teaser: EenewsTeaser }}>
              <TeaserListGridFrame>
                <TeaserList {...(block as any)} />
              </TeaserListGridFrame>
            </WebsiteBuilderProvider>
          ),
        ],
        // Topic strip (4 paper-warm cards driven by Tag.main).
        [isTopicStrip as any, () => <EenewsTopicStrip />],
        // Inline newsletter card.
        [isNewsletterInline as any, () => <EenewsNewsletterInline />],
        // Article-body callout aside.
        [
          isRichTextCallout as any,
          block => <EenewsCallout {...(block as any)} />,
        ],
      ]),
    [TeaserSlots, TeaserList]
  );

  const matched = dispatch(props.block);
  if (matched) return matched;
  return <BlockRenderer {...props} />;
};
