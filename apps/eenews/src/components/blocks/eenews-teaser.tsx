import styled from '@emotion/styled';
import { Typography, useTheme } from '@mui/material';
import {
  selectTeaserDate,
  selectTeaserImage,
  selectTeaserLead,
  selectTeaserTitle,
  selectTeaserUrl,
} from '@wepublish/block-content/website';
import { BuilderTeaserProps, Image, Link } from '@wepublish/website/builder';
import { useContext } from 'react';

import { ActiveBadgeTagContext } from '../../context/active-badge-tag-context';
import { Advertisement } from '../advertisement';
import { EeNewsBlockType } from '../block-styles/eenews-block-styles';
import { isAdTeaser } from '../teasers/eenews-teaser-ads';
import {
  selectTeaserBreaking,
  selectTeaserTag,
  selectTeaserTopic,
} from '../teasers/eenews-teaser-selectors';

const Card = styled(Link)`
  display: flex;
  flex-direction: column;
  gap: 12px;
  cursor: pointer;
  text-decoration: none;
  color: inherit;
  transition: transform 160ms ease;
  &:hover {
    transform: translateY(-2px);
  }
`;

const ImageFrame = styled('div')`
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 3;
  overflow: hidden;
  background: #e6ece9;
`;

const TeaserImage = styled(Image)`
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 600ms ease;
  ${Card}:hover & {
    transform: scale(1.04);
  }
`;

const TagChip = styled('span')`
  position: absolute;
  top: 0;
  left: 0;
  color: ${({ theme }) => theme.palette.primary.main};
  padding: 8px 14px 7px;
  text-transform: capitalize;
`;

const Badges = styled('div')`
  position: absolute;
  top: 8px;
  right: 8px;
  display: inline-flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
  z-index: 2;
`;

const BreakingBadge = styled(Typography)`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 24px;
  padding: 0 9px;
  background: #d6342f;
  color: ${({ theme }) => theme.palette.background.paper};
  line-height: 1;
  border-radius: 3px;
`;

const Meta = styled(Typography)`
  display: block;
  color: ${({ theme }) => theme.palette.primary.main};
  margin-top: 2px;
`;

const MetaSep = styled('span')`
  font-weight: 400;
  margin: 0 4px;
  opacity: 0.7;
`;

const MetaTopic = styled('span')`
  text-transform: capitalize;
`;

const Title = styled(Typography)`
  display: block;
  color: ${({ theme }) => theme.palette.primary.main};
  margin: 0;
  text-wrap: balance;
`;

const Excerpt = styled(Typography)`
  display: block;
  color: ${({ theme }) => theme.palette.text.primary};
  margin: 4px 0 0;
  text-wrap: pretty;
`;

const formatDateDE = (raw: string | Date | null | undefined): string => {
  if (!raw) {
    return '';
  }
  const d = typeof raw === 'string' ? new Date(raw) : raw;
  if (Number.isNaN(d.getTime())) {
    return '';
  }
  return d.toLocaleDateString('de-CH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

export const EenewsTeaser = ({
  teaser,
  blockStyle,
  className,
}: BuilderTeaserProps) => {
  const theme = useTheme();
  const priorityBadgeTag = useContext(ActiveBadgeTagContext);

  if (!teaser) {
    return null;
  }

  if (isAdTeaser(teaser)) {
    return <Advertisement type="medium-rectangle" />;
  }

  const title = selectTeaserTitle(teaser);
  const lead = selectTeaserLead(teaser);
  const image = selectTeaserImage(teaser);
  const url = selectTeaserUrl(teaser);
  const date = selectTeaserDate(teaser);
  const tag = selectTeaserTag(teaser, priorityBadgeTag);
  const topic = selectTeaserTopic(teaser);
  const breaking = selectTeaserBreaking(teaser);

  if (!url) {
    return null;
  }

  const showTagChip =
    blockStyle !== EeNewsBlockType.AktuellGrid && tag !== undefined;

  const TITLE_SPLIT_LENGTH = 34;
  const LEAD_MAX_LENGTH = 120;
  const truncatedTitle =
    title && title.length > TITLE_SPLIT_LENGTH ?
      `${title.slice(0, TITLE_SPLIT_LENGTH).trimEnd()}…`
    : title;
  let displayTitle = title;
  let displayLead = lead;
  if (!lead && title && title.length > TITLE_SPLIT_LENGTH) {
    displayTitle = truncatedTitle;
    displayLead = title;
  } else if (lead) {
    displayTitle = truncatedTitle;
    displayLead =
      lead.length > LEAD_MAX_LENGTH ?
        `${lead.slice(0, LEAD_MAX_LENGTH).trimEnd()}…`
      : lead;
  }

  return (
    <Card
      href={url}
      className={className}
    >
      <ImageFrame>
        {image && (
          <TeaserImage
            image={image}
            maxWidth={800}
          />
        )}
        {showTagChip && tag && (
          <TagChip
            style={{ background: tag.color ?? theme.palette.secondary.main }}
          >
            <Typography
              variant="teaserTagChip"
              component="span"
            >
              {tag.tag}
            </Typography>
          </TagChip>
        )}
        {breaking && (
          <Badges>
            <BreakingBadge variant="teaserBadge">Breaking</BreakingBadge>
          </Badges>
        )}
      </ImageFrame>

      <Meta variant="teaserMeta">
        {topic && <MetaTopic>{topic.tag}</MetaTopic>}
        {topic && date && <MetaSep>|</MetaSep>}
        {date && formatDateDE(date)}
      </Meta>

      <Title variant="teaserTitle">{displayTitle}</Title>

      {displayLead && <Excerpt variant="teaserExcerpt">{displayLead}</Excerpt>}
    </Card>
  );
};
