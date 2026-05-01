import styled from '@emotion/styled';
import { Box, Typography } from '@mui/material';
import { BuilderTeaserProps, Image } from '@wepublish/website/builder';
import Link from 'next/link';

import { eenewsColors } from '../../theme';
import { EeNewsBlockType } from '../block-styles/eenews-block-styles';
import {
  selectTeaserBodyLead,
  selectTeaserDateLabel,
  selectTeaserEyebrow,
  selectTeaserHeadline,
  selectTeaserImage,
  selectTeaserReadTimeMin,
  selectTeaserRubrik,
  selectTeaserUrl,
} from '../teasers/eenews-teaser-selectors';

const Card = styled(Link)`
  display: flex;
  flex-direction: column;
  gap: 14px;
  cursor: pointer;
  text-decoration: none;
  color: inherit;

  & .img-wrap img {
    transition: transform 0.55s cubic-bezier(0.2, 0.8, 0.2, 1);
  }
  &:hover .img-wrap img {
    transform: scale(1.03);
  }
  &:hover h3,
  &:hover h2 {
    color: ${eenewsColors.inkSoft};
  }
`;

const ImageWrap = styled('div')<{ aspect?: string }>`
  position: relative;
  width: 100%;
  aspect-ratio: ${({ aspect }) => aspect ?? '4/3'};
  overflow: hidden;
  background: ${eenewsColors.paperWarm};
  & img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
`;

const TopicPill = styled('div')<{ small?: boolean }>`
  position: absolute;
  top: ${({ small }) => (small ? 12 : 16)}px;
  left: ${({ small }) => (small ? 12 : 16)}px;
  background: ${eenewsColors.paper};
  color: ${eenewsColors.ink};
  padding: ${({ small }) => (small ? '5px 10px' : '6px 12px')};
  border-radius: 999px;
  font-size: ${({ small }) => (small ? 10 : 11)}px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-weight: 400;
`;

const TextColumn = styled('div')`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const FeaturedWrap = styled(Link)`
  display: grid;
  grid-template-columns: 1.15fr 1fr;
  gap: 40px;
  cursor: pointer;
  text-decoration: none;
  color: inherit;
  align-items: center;
  @media (max-width: 1100px) {
    grid-template-columns: 1fr;
    gap: 24px;
  }

  & .img-wrap img {
    transition: transform 0.55s cubic-bezier(0.2, 0.8, 0.2, 1);
  }
  &:hover .img-wrap img {
    transform: scale(1.03);
  }
`;

const FeaturedText = styled('div')`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const FeaturedActionRow = styled('div')`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 6px;
`;

const ReadMoreLabel = styled('span')`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
  color: ${eenewsColors.ink};
`;

const CompactRow = styled(Link)`
  display: grid;
  grid-template-columns: 40px 1fr auto;
  gap: 18px;
  padding: 18px 0;
  border-bottom: 1px solid ${eenewsColors.rule};
  cursor: pointer;
  align-items: baseline;
  text-decoration: none;
  color: inherit;
`;

const CompactIndex = styled('div')`
  font-size: 13px;
  color: ${eenewsColors.accentDeep};
  font-weight: 500;
`;

/**
 * EE News teaser — single component dispatches on `blockStyle` per MP-D ("one base,
 * variants set styling, not structure"). Variants:
 *
 *   - FlexBlockFeaturedLead → 2-col image+text lead story (home featured)
 *   - TeaserStandard (default) → 4:3 image, eyebrow, 24px title, body lead
 *   - TeaserStandardLarge → 16:10 image, 32px title
 *   - TeaserCompactList → 40px/1fr/auto row, mono index + 20px title + arrow
 *
 * The containing block (TeaserSlots / TeaserList / FlexBlock) sets `blockStyle`
 * via the wepublish blockStyle pass-through; the renderer wraps each container
 * with a nested WebsiteBuilderProvider that injects this Teaser.
 */
export const EenewsTeaser = ({
  teaser,
  blockStyle,
  index,
  className,
}: BuilderTeaserProps) => {
  const url = teaser ? selectTeaserUrl(teaser) : undefined;
  const headline = teaser ? selectTeaserHeadline(teaser) : undefined;
  if (!teaser || !url || !headline) return null;

  const image = selectTeaserImage(teaser);
  const lead = selectTeaserBodyLead(teaser);
  const eyebrow = selectTeaserEyebrow(teaser);
  const rubrik = selectTeaserRubrik(teaser);

  if (blockStyle === EeNewsBlockType.FlexBlockFeaturedLead) {
    const dateLabel = selectTeaserDateLabel(teaser);
    const readTime = selectTeaserReadTimeMin(teaser);
    return (
      <FeaturedWrap
        href={url}
        className={className}
      >
        <ImageWrap
          aspect="4/3"
          className="img-wrap"
        >
          {image && (
            <Image
              image={image}
              maxWidth={1200}
            />
          )}
          {rubrik && <TopicPill>{rubrik}</TopicPill>}
        </ImageWrap>
        <FeaturedText>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography
              variant="metaEyebrow"
              component="span"
              sx={{ color: eenewsColors.accentDeep, fontWeight: 500 }}
            >
              Lead Story
            </Typography>
            {dateLabel && (
              <Typography
                variant="metaEyebrow"
                component="span"
              >
                · {dateLabel}
              </Typography>
            )}
          </Box>
          <Typography
            variant="displayFeaturedTeaser"
            component="h2"
            sx={{ margin: 0, color: eenewsColors.ink }}
          >
            {headline}
          </Typography>
          {lead && (
            <Typography
              variant="bodyTeaserFeatured"
              component="p"
              sx={{ margin: 0, color: eenewsColors.inkSoft, maxWidth: '52ch' }}
            >
              {lead}
            </Typography>
          )}
          <FeaturedActionRow>
            <ReadMoreLabel>
              Weiterlesen
              <svg
                width="16"
                height="10"
                viewBox="0 0 16 10"
                fill="none"
              >
                <path
                  d="M1 5 H14 M10 1 L14 5 L10 9"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </ReadMoreLabel>
            {readTime != null && (
              <Typography
                variant="metaEyebrowSmall"
                component="span"
              >
                {readTime} Min. Lesezeit
              </Typography>
            )}
          </FeaturedActionRow>
        </FeaturedText>
      </FeaturedWrap>
    );
  }

  if (blockStyle === EeNewsBlockType.TeaserCompactList) {
    return (
      <CompactRow
        href={url}
        className={className}
      >
        <CompactIndex>{String((index ?? 0) + 1).padStart(2, '0')}</CompactIndex>
        <Box>
          <Typography
            variant="displayTeaserCompact"
            component="h4"
            sx={{ margin: 0, color: eenewsColors.ink }}
          >
            {headline}
          </Typography>
          {eyebrow && (
            <Typography
              variant="metaEyebrow"
              component="div"
              sx={{ marginTop: 0.75 }}
            >
              {eyebrow}
            </Typography>
          )}
        </Box>
        <svg
          width="16"
          height="10"
          viewBox="0 0 16 10"
          fill="none"
          style={{ alignSelf: 'center' }}
          aria-hidden
        >
          <path
            d="M1 5 H14 M10 1 L14 5 L10 9"
            stroke={eenewsColors.ink}
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </CompactRow>
    );
  }

  // Standard teaser (default + TeaserStandardLarge)
  const isLarge = blockStyle === EeNewsBlockType.TeaserStandardLarge;
  return (
    <Card
      href={url}
      className={className}
    >
      <ImageWrap
        aspect={isLarge ? '16/10' : '4/3'}
        className="img-wrap"
      >
        {image && (
          <Image
            image={image}
            maxWidth={isLarge ? 1200 : 800}
          />
        )}
        {rubrik && <TopicPill small>{rubrik}</TopicPill>}
      </ImageWrap>
      <TextColumn>
        {eyebrow && (
          <Typography
            variant="metaEyebrow"
            component="div"
          >
            {eyebrow}
          </Typography>
        )}
        <Typography
          variant={isLarge ? 'displayTeaserLg' : 'displayTeaserMd'}
          component="h3"
          sx={{ margin: 0, color: eenewsColors.ink }}
        >
          {headline}
        </Typography>
        {lead && (
          <Typography
            variant="bodyTeaserStandard"
            component="p"
            sx={{ margin: 0, color: eenewsColors.inkSoft }}
          >
            {lead}
          </Typography>
        )}
      </TextColumn>
    </Card>
  );
};
