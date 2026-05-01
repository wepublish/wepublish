import styled from '@emotion/styled';
import { Container, Typography } from '@mui/material';
import { TeaserSlotsBlockTeasers } from '@wepublish/block-content/website';
import {
  BuilderTeaserSlotsBlockProps,
  useWebsiteBuilder,
  WebsiteBuilderProvider,
} from '@wepublish/website/builder';
import Link from 'next/link';

import { eenewsColors } from '../../theme';
import { EeNewsBlockType } from '../block-styles/eenews-block-styles';
import { EenewsTeaser } from './eenews-teaser';

// We target wepublish's internal `TeaserSlotsBlockTeasers` styled component
// directly via Emotion's component-selector pattern (`${TeaserSlotsBlockTeasers}`).
// The previous `[class*='TeaserSlotsBlockTeasers']` regex selector worked in
// dev but silently broke in production: Next.js + Emotion strip the display
// name at build time (autoLabel: 'dev-only' default), so the class becomes
// `css-abc123` and the substring match fails. Component selectors resolve
// to the generated class via `.toString()` at runtime — works in every build.
const SectionFrame = styled('section')<{ band?: boolean; columns?: number }>`
  ${({ band }) => (band ? `background: ${eenewsColors.section};` : '')}
  padding: ${({ band }) => (band ? '72px 0' : '24px 0 56px')};

  ${TeaserSlotsBlockTeasers} {
    grid-template-columns: ${({ columns }) =>
      `repeat(${columns ?? 3}, 1fr)`} !important;
    gap: 40px !important;
    row-gap: 56px !important;

    @media (max-width: 720px) {
      grid-template-columns: 1fr !important;
    }

    & > * {
      grid-column-start: auto !important;
      grid-column-end: auto !important;
      grid-row-start: auto !important;
      grid-row-end: auto !important;
    }
  }
`;

const SectionHead = styled('div')`
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 24px;
  padding-bottom: 18px;
  border-bottom: 2px solid ${eenewsColors.ink};
  margin-bottom: 32px;
  @media (max-width: 800px) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

const ActionLink = styled(Link)`
  color: ${eenewsColors.ink};
  text-decoration: none;
  white-space: nowrap;
  padding-bottom: 4px;
`;

const FeaturedFrame = styled('section')`
  padding: 48px 0 56px;
`;

const FeaturedEyebrow = styled('div')`
  margin-bottom: 24px;
  padding-bottom: 12px;
  border-bottom: 2px solid ${eenewsColors.ink};
  display: flex;
  align-items: center;
  gap: 8px;
`;

/**
 * Wepublish's default TeaserSlots renders the slots grid AND resolves autofill.
 * We wrap it so the section-head treatment (eyebrow + display + action link
 * with thick ink underline) appears above, and inject EenewsTeaser via a
 * nested WebsiteBuilderProvider for the per-card style.
 */
const sectionMeta: Record<
  string,
  {
    kicker: string;
    band?: boolean;
    actionHref?: string;
    actionLabel?: string;
    columns?: number;
  }
> = {
  [EeNewsBlockType.TeaserStandard]: {
    kicker: 'Aktuell',
    actionHref: '/a',
    actionLabel: 'Alle News',
    columns: 3,
  },
  [EeNewsBlockType.TeaserStandardLarge]: {
    kicker: 'Schwerpunkt',
    actionHref: '/a',
    actionLabel: 'Alle Beiträge',
    columns: 2,
  },
};

const dossiersMeta = {
  kicker: 'Vertiefung',
  band: true,
  actionHref: '/a/tag/speicher',
  actionLabel: 'Alle Dossiers',
  columns: 3,
};

export const EenewsTeaserSlots = (props: BuilderTeaserSlotsBlockProps) => {
  const {
    blocks: { TeaserSlots },
  } = useWebsiteBuilder();
  const { blockStyle, title } = props;
  // The wepublish FullTeaserSlotsBlock fragment fetches resolved `teasers`
  // (not `slots`) — `slots` is undefined at runtime. Use `teasers` for any
  // direct render path.
  const teasers = (props as any).teasers as Array<unknown> | undefined;

  // ───── FeaturedLead: 2-col image+text hero ─────
  if (blockStyle === EeNewsBlockType.FlexBlockFeaturedLead) {
    const teaser = (teasers ?? []).find(Boolean);
    return (
      <FeaturedFrame>
        <Container>
          <FeaturedEyebrow>
            <Typography
              variant="metaEyebrow"
              component="span"
              sx={{ color: eenewsColors.accentDeep, fontWeight: 600 }}
            >
              ● Live
            </Typography>
            <Typography
              variant="metaEyebrow"
              component="span"
            >
              · Schweiz · Heute
            </Typography>
          </FeaturedEyebrow>
          {teaser ?
            <WebsiteBuilderProvider blocks={{ Teaser: EenewsTeaser }}>
              <EenewsTeaser
                teaser={teaser as any}
                blockStyle={EeNewsBlockType.FlexBlockFeaturedLead}
                index={0}
                alignment={{ i: '0', x: 0, y: 0, w: 1, h: 1, static: false }}
                numColumns={1}
              />
            </WebsiteBuilderProvider>
          : null}
        </Container>
      </FeaturedFrame>
    );
  }

  // ───── Standard / Large grids: wrap default TeaserSlots with section head ─────
  // Heuristic: title containing "Dossier" → use the sage band (matches v2).
  const fallbackMeta = sectionMeta[EeNewsBlockType.TeaserStandard];
  const meta =
    title?.toLowerCase().includes('dossier') ?
      dossiersMeta
    : ((blockStyle ? sectionMeta[blockStyle] : undefined) ?? fallbackMeta);

  return (
    <SectionFrame
      band={meta.band}
      columns={meta.columns}
    >
      <Container>
        <SectionHead>
          <div>
            <Typography
              variant="metaEyebrow"
              component="div"
              sx={{ marginBottom: 1 }}
            >
              {meta.kicker}
            </Typography>
            <Typography
              variant="displaySection"
              component="h2"
              sx={{ margin: 0, color: eenewsColors.ink }}
            >
              {title ?? 'Beiträge'}
            </Typography>
          </div>
          {meta.actionHref ?
            <Typography
              variant="uiActionLink"
              component={ActionLink}
              href={meta.actionHref}
            >
              {meta.actionLabel} →
            </Typography>
          : null}
        </SectionHead>
        <WebsiteBuilderProvider blocks={{ Teaser: EenewsTeaser }}>
          <TeaserSlots
            {...(props as any)}
            title={null}
          />
        </WebsiteBuilderProvider>
      </Container>
    </SectionFrame>
  );
};
