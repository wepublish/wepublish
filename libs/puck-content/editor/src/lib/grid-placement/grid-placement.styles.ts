import styled from '@emotion/styled';

export const GridPlacementPreview = styled.div<{ columns: number }>`
  display: grid;
  grid-template-columns: repeat(${({ columns }) => columns}, minmax(0, 1fr));
  gap: 2px;
`;

export const GridPlacementPreviewCell = styled.span<{
  covered: boolean;
  automatic: boolean;
}>`
  aspect-ratio: 1;
  border-radius: 2px;
  background: ${({ covered, automatic }) =>
    !covered ? 'var(--puck-color-surface-muted)'
    : automatic ? 'var(--puck-color-interactive-soft)'
    : 'var(--puck-color-interactive)'};
  outline: ${({ covered, automatic }) =>
    covered && automatic ?
      '1px dashed var(--puck-color-interactive)'
    : '1px solid var(--puck-color-border-muted)'};
  outline-offset: -1px;
`;

export const GridPlacementHint = styled.div`
  color: var(--puck-color-text-secondary);
  font-size: var(--puck-font-size-xxxs);
`;
