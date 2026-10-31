import styled from '@emotion/styled';

import type { Corner } from './styling.field';

export const StylingControlGroup = styled.div`
  display: grid;
  gap: var(--puck-space-2);
`;

export const StylingOptionText = styled.span`
  font-size: var(--puck-font-size-xxxs);
  line-height: 1;
  white-space: nowrap;
`;

export const StylingWeightSample = styled.span<{
  sampleWeight: string | number | undefined;
}>`
  font-size: var(--puck-font-size-xs);
  font-weight: ${({ sampleWeight }) => sampleWeight ?? 'normal'};
  line-height: 1;
`;

export const PositionGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 36px);
  gap: var(--puck-space-1);
`;

export const PositionDot = styled.span<{ filled: boolean }>`
  width: 8px;
  height: 8px;
  border: var(--puck-border-width-regular) solid currentColor;
  border-radius: var(--puck-radius-round);
  background: ${({ filled }) => (filled ? 'currentColor' : 'transparent')};
`;

export const ShadowGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: var(--puck-space-2);
`;

export const ShadowTile = styled.span`
  display: grid;
  justify-items: center;
  gap: var(--puck-space-1);
`;

export const ShadowWell = styled.span<{ surface: string }>`
  box-sizing: border-box;
  display: flex;
  justify-content: center;
  justify-self: stretch;
  padding: 6px 4px;
  overflow: hidden;
  border: var(--puck-border-width-regular) solid var(--puck-color-border-muted);
  border-radius: var(--puck-radius-s);
  background: ${({ surface }) => surface};
`;

export const ShadowSample = styled.span<{ shadow: string; surface: string }>`
  width: 100%;
  max-width: 24px;
  height: 12px;
  border-radius: var(--puck-radius-s);
  background: ${({ surface }) => surface};
  box-shadow: ${({ shadow }) => shadow};
`;

export const ShadowCaption = styled.span`
  font-size: var(--puck-font-size-xxxs);
  line-height: 1;
  font-variant-numeric: tabular-nums;
`;

export const PercentSliderRow = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) 40px;
  align-items: center;
  gap: var(--puck-space-3);
  padding-inline: var(--puck-space-2) 0;
`;

export const PercentSliderValue = styled.span`
  color: var(--puck-color-text-secondary);
  font-size: var(--puck-font-size-xxs);
  font-variant-numeric: tabular-nums;
  text-align: end;
`;

export const CornerGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  grid-template-areas:
    'topLeft center topRight'
    'bottomLeft center bottomRight';
  align-items: center;
  gap: var(--puck-space-2);
`;

export const CornerCell = styled.div<{ gridArea: Corner }>`
  grid-area: ${({ gridArea }) => gridArea};
  display: flex;
  justify-content: ${({ gridArea }) =>
    gridArea.endsWith('Left') ? 'flex-end' : 'flex-start'};
`;

export const CornerCenter = styled.div`
  grid-area: center;
  display: grid;
  justify-items: center;
  gap: var(--puck-space-1);
`;

export const CornerPreview = styled.span<{
  radii: Partial<Record<Corner, string>>;
}>`
  width: 36px;
  height: 36px;
  border: var(--puck-border-width-strong) solid var(--puck-color-text-secondary);
  border-top-left-radius: ${({ radii }) => radii.topLeft ?? 0};
  border-top-right-radius: ${({ radii }) => radii.topRight ?? 0};
  border-bottom-right-radius: ${({ radii }) => radii.bottomRight ?? 0};
  border-bottom-left-radius: ${({ radii }) => radii.bottomLeft ?? 0};
  box-sizing: border-box;
`;
