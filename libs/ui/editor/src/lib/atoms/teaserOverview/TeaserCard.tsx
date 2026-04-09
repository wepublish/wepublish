import styled from '@emotion/styled';
import {
  css,
  Tooltip,
  tooltipClasses,
  TooltipProps,
  useTheme,
} from '@mui/material';
import type { Theme } from '@mui/material/styles';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdContentCopy, MdImage } from 'react-icons/md';

import { ExtractedTeaser } from './extractTeasers';

// ─── Colours ──────────────────────────────────────────────────────────────────

export function groupColor(groupIndex: number, theme: Theme): string {
  // Avoid primary (blue) shades — they clash with the selected-teaser highlight.
  const colors = [
    theme.palette.secondary.main,
    theme.palette.success.main,
    theme.palette.warning.main,
    theme.palette.info.dark,
    theme.palette.secondary.dark,
    theme.palette.success.dark,
    theme.palette.warning.dark,
    theme.palette.error.main,
  ];
  return colors[groupIndex % colors.length];
}

// ─── Styled components ────────────────────────────────────────────────────────

const Card = styled('div', {
  shouldForwardProp: p =>
    p !== 'isSelected' && p !== 'isTarget' && p !== 'groupColor',
})<{ isSelected: boolean; isTarget: boolean; groupColor: string }>`
  display: flex;
  align-items: stretch;
  height: 72px;
  border-radius: 6px;
  border: 2px solid
    ${({ isSelected, isTarget, groupColor, theme }) =>
      isSelected ? theme.palette.primary.main
      : isTarget ? '#eeeeee'
      : groupColor};
  background: ${({ theme }) => theme.palette.background.paper};
  cursor: pointer;
  overflow: hidden;
  user-select: none;
  transition:
    border-color 0.15s,
    box-shadow 0.15s;
  box-shadow: ${({ isSelected, theme }) =>
    isSelected ? `0 0 0 3px ${theme.palette.primary.main}55` : 'none'};

  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  }
`;

const ColorBar = styled('div', {
  shouldForwardProp: p => p !== 'barColor' && p !== 'nestDepth',
})<{ barColor: string; nestDepth: number }>`
  width: ${({ nestDepth }) => 6 + nestDepth * 3}px;
  flex-shrink: 0;
  background: ${({ barColor }) => barColor};
  opacity: ${({ nestDepth }) => (nestDepth > 0 ? 0.6 : 1)};
`;

const Thumbnail = styled('div')`
  width: 88px;
  flex-shrink: 0;
  background: ${({ theme }) => theme.palette.action.hover};
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const ThumbnailPlaceholder = styled('div')`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.palette.text.disabled};
  font-size: 24px;
`;

const TextArea = styled('div')`
  flex: 1;
  min-width: 0;
  padding: 6px 8px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 2px;
`;

const PreTitle = styled('div')`
  ${({ theme }) => css`
    font-size: ${theme.typography.caption.fontSize};
    color: ${theme.palette.text.secondary};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  `}
`;

const Title = styled('div')`
  ${({ theme }) => css`
    font-size: ${theme.typography.body2.fontSize};
    font-weight: ${theme.typography.fontWeightMedium};
    color: ${theme.palette.text.primary};
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  `}
`;

const DuplicateBadge = styled('div', {
  shouldForwardProp: p => p !== 'badgeColor',
})<{ badgeColor: string }>`
  position: absolute;
  top: -6px;
  right: -6px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: ${({ badgeColor }) => badgeColor};
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
`;

const CardWrapper = styled('div')`
  position: relative;
`;

const SelectionTooltip = styled(({ className, ...props }: TooltipProps) => (
  <Tooltip
    {...props}
    classes={{ popper: className }}
  />
))`
  & .${tooltipClasses.tooltip} {
    font-size: 11px;
  }
`;

// ─── Props ────────────────────────────────────────────────────────────────────

type TeaserCardProps = {
  extracted: ExtractedTeaser;
  isSelected: boolean;
  isTarget: boolean;
  isDuplicate: boolean;
  onClick: () => void;
};

// ─── Component ────────────────────────────────────────────────────────────────

export function TeaserCard({
  extracted,
  isSelected,
  isTarget,
  isDuplicate,
  onClick,
}: TeaserCardProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const { teaser, groupIndex, nestDepth } = extracted;
  const color = groupColor(groupIndex, theme);

  const imageUrl = teaser.image?.thumbURL ?? teaser.image?.url ?? null;

  const displayTitle =
    teaser.title ??
    ('article' in teaser ? teaser.article?.latest?.title
    : 'page' in teaser ? teaser.page?.latest?.title
    : 'event' in teaser ? teaser.event?.name
    : null) ??
    t('teaserOverview.noTitle');

  const displayPreTitle =
    teaser.preTitle ??
    ('article' in teaser ? teaser.article?.latest?.preTitle : null) ??
    '';

  const cardTooltip =
    isSelected ? t('teaserOverview.tooltipSelected')
    : isTarget ? t('teaserOverview.tooltipTarget')
    : t('teaserOverview.tooltipDefault');

  const [badgeHover, setBadgeHover] = useState(false);

  return (
    <SelectionTooltip
      title={badgeHover ? '' : cardTooltip}
      placement="top"
      enterDelay={600}
    >
      <CardWrapper>
        {isDuplicate && (
          <SelectionTooltip
            title={t('teaserOverview.duplicateBadge')}
            placement="top"
            enterDelay={300}
          >
            <DuplicateBadge
              badgeColor={color}
              onMouseEnter={() => setBadgeHover(true)}
              onMouseLeave={() => setBadgeHover(false)}
            >
              <MdContentCopy />
            </DuplicateBadge>
          </SelectionTooltip>
        )}

        <Card
          isSelected={isSelected}
          isTarget={isTarget}
          groupColor={color}
          onClick={onClick}
          role="button"
          aria-pressed={isSelected}
        >
          <ColorBar
            barColor={color}
            nestDepth={nestDepth}
          />

          <Thumbnail>
            {imageUrl ?
              <img
                src={imageUrl}
                alt=""
              />
            : <ThumbnailPlaceholder>
                <MdImage />
              </ThumbnailPlaceholder>
            }
          </Thumbnail>

          <TextArea>
            {displayPreTitle && <PreTitle>{displayPreTitle}</PreTitle>}
            <Title>{displayTitle}</Title>
          </TextArea>
        </Card>
      </CardWrapper>
    </SelectionTooltip>
  );
}
