import styled from '@emotion/styled';
import { css, Typography, useTheme } from '@mui/material';

import { ExtractedTeaser, TeaserAddress } from './extractTeasers';
import { groupColor, TeaserCard } from './TeaserCard';

// ─── Styled components ────────────────────────────────────────────────────────

const GroupWrapper = styled('div', {
  shouldForwardProp: p => p !== 'borderColor',
})<{ borderColor: string }>`
  display: flex;
  flex-direction: column;
  gap: 6px;
  border-left: 0; //4px solid ${({ borderColor }) => borderColor};
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

// ─── Props ────────────────────────────────────────────────────────────────────

type TeaserBlockGroupProps = {
  label: string;
  groupIndex: number;
  teasers: ExtractedTeaser[];
  selectedAddress: TeaserAddress | null;
  onCardClick: (extracted: ExtractedTeaser) => void;
};

// ─── Component ────────────────────────────────────────────────────────────────

export function TeaserBlockGroup({
  label,
  groupIndex,
  teasers,
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
          // A card is a "target" when something else is selected (highlight swap targets)
          const isTarget = selectedAddress !== null && !isSelected;

          return (
            <TeaserCard
              key={i}
              extracted={extracted}
              isSelected={isSelected}
              isTarget={isTarget}
              onClick={() => onCardClick(extracted)}
            />
          );
        })}
      </CardGrid>
    </GroupWrapper>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function addressesEqual(a: TeaserAddress, b: TeaserAddress | null): boolean {
  if (!b) return false;
  if (a.blockKind !== b.blockKind) return false;
  if (a.blockIndex !== b.blockIndex) return false;

  switch (a.blockKind) {
    case 'teaserGrid':
      return b.blockKind === 'teaserGrid' && a.teaserIndex === b.teaserIndex;
    case 'teaserFlex':
      return b.blockKind === 'teaserFlex' && a.flexIndex === b.flexIndex;
    case 'teaserList':
      return b.blockKind === 'teaserList' && a.teaserIndex === b.teaserIndex;
    case 'teaserSlots':
      return b.blockKind === 'teaserSlots' && a.slotIndex === b.slotIndex;
    case 'flexNested':
      return (
        b.blockKind === 'flexNested' &&
        a.nestedBlockIndex === b.nestedBlockIndex &&
        addressesEqual(a.nested, b.nested)
      );
  }
}
