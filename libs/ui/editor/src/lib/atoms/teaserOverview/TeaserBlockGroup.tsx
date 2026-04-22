import styled from '@emotion/styled';
import { css, Typography, useTheme } from '@mui/material';

import {
  BlockType,
  ExtractedTeaser,
  TeaserAddress,
  teaserContentKey,
} from './extractTeasers';
import { groupColor, TeaserCard } from './TeaserCard';

const GroupWrapper = styled('div', {
  shouldForwardProp: p => p !== 'borderColor',
})<{ borderColor: string }>`
  display: flex;
  flex-direction: column;
  gap: 6px;
  border-left: 0;
  padding-left: 10px;
`;

const GroupHeader = styled('div')`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const GroupDot = styled('div', {
  shouldForwardProp: p => p !== 'dotColor',
})<{ dotColor: string }>`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: ${({ dotColor }) => dotColor};
  flex-shrink: 0;
`;

const GroupLabel = styled(Typography)`
  ${({ theme }) => css`
    font-size: ${theme.typography.caption.fontSize};
    font-weight: ${theme.typography.fontWeightMedium};
    color: ${theme.palette.text.secondary};
    letter-spacing: 0.02em;
  `}
`;

const CardGrid = styled('div')`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 8px;
`;

type TeaserBlockGroupProps = {
  label: string;
  groupIndex: number;
  teasers: ExtractedTeaser[];
  duplicateKeys: Set<string>;
  selectedAddress: TeaserAddress | null;
  onCardClick: (extracted: ExtractedTeaser) => void;
};

export function TeaserBlockGroup({
  label,
  groupIndex,
  teasers,
  duplicateKeys,
  selectedAddress,
  onCardClick,
}: TeaserBlockGroupProps) {
  const theme = useTheme();
  const color = groupColor(groupIndex, theme);

  return (
    <GroupWrapper borderColor={color}>
      <GroupHeader>
        <GroupDot dotColor={color} />
        <GroupLabel variant="caption">{label}</GroupLabel>
      </GroupHeader>

      <CardGrid>
        {teasers.map((extracted, i) => {
          const isSelected = addressesEqual(extracted.address, selectedAddress);
          const isTarget = selectedAddress !== null && !isSelected;

          return (
            <TeaserCard
              key={i}
              extracted={extracted}
              isSelected={isSelected}
              isTarget={isTarget}
              isDuplicate={duplicateKeys.has(
                teaserContentKey(extracted.teaser)
              )}
              onClick={() => onCardClick(extracted)}
            />
          );
        })}
      </CardGrid>
    </GroupWrapper>
  );
}

function addressesEqual(a: TeaserAddress, b: TeaserAddress | null): boolean {
  if (!b) return false;
  if (a.blockType !== b.blockType) return false;
  if (a.blockIndex !== b.blockIndex) return false;

  switch (a.blockType) {
    case BlockType.TeaserGrid:
      return (
        b.blockType === BlockType.TeaserGrid && a.teaserIndex === b.teaserIndex
      );
    case BlockType.TeaserFlex:
      return (
        b.blockType === BlockType.TeaserFlex && a.flexIndex === b.flexIndex
      );
    case BlockType.TeaserSlots:
      return (
        b.blockType === BlockType.TeaserSlots && a.slotIndex === b.slotIndex
      );
    case BlockType.FlexBlock:
      return (
        b.blockType === BlockType.FlexBlock &&
        a.nestedBlockIndex === b.nestedBlockIndex &&
        addressesEqual(a.nested, b.nested)
      );
  }
}
