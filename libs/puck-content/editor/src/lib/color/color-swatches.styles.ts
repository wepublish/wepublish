import styled from '@emotion/styled';

const swatchFill = `
  background-color: var(--puck-color-surface);
  background-image:
    linear-gradient(var(--swatch-color), var(--swatch-color)),
    repeating-conic-gradient(
      var(--puck-color-border) 0% 25%,
      transparent 0% 50%
    );
  background-position: center;
  background-size:
    auto,
    8px 8px;

  &[data-empty='true'] {
    background-image: linear-gradient(
      to top right,
      transparent calc(50% - 1px),
      var(--puck-color-red-06) calc(50% - 1px) calc(50% + 1px),
      transparent calc(50% + 1px)
    );
    background-size: auto;
  }
`;

export const ColorSwatchPreview = styled.span`
  display: inline-block;
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  border-radius: var(--puck-radius-s);
  box-shadow: inset 0 0 0 1px var(--puck-color-border);
  ${swatchFill}
`;

export const ColorSwatchPreviewSmall = styled(ColorSwatchPreview)`
  width: 18px;
  height: 18px;
`;

export const ColorSwatchRows = styled.div`
  display: grid;
  gap: var(--puck-space-1);
`;

export const ColorSwatchLabelledRow = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 72px) minmax(0, 1fr);
  align-items: center;
  gap: var(--puck-space-2);
`;

export const ColorSwatchRowLabel = styled.span`
  overflow: hidden;
  color: var(--puck-color-text-secondary);
  font-size: var(--puck-font-size-xxxs);
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const ColorSwatchList = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  padding: 4px;
`;

export const ColorSwatchButton = styled.button`
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  border: 0;
  border-radius: var(--puck-radius-s);
  box-shadow: inset 0 0 0 1px var(--puck-color-border);
  color: var(--swatch-check-color, var(--puck-color-text));
  cursor: pointer;
  ${swatchFill}

  &[aria-checked='true'] {
    box-shadow:
      inset 0 0 0 1px var(--puck-color-border),
      0 0 0 2px var(--puck-color-surface),
      0 0 0 4px var(--puck-color-text);
  }

  &:focus-visible {
    outline: var(--puck-border-width-focus) solid var(--puck-color-focus-ring);
    outline-offset: 4px;
  }

  &[aria-disabled='true'] {
    cursor: not-allowed;
    opacity: 0.5;
  }

  > svg {
    width: 14px;
    height: 14px;
  }
`;

export const ColorSwatchChip = styled.button`
  display: inline-flex;
  align-items: center;
  gap: var(--puck-space-2);
  min-height: 30px;
  padding: var(--puck-space-1) var(--puck-space-3) var(--puck-space-1)
    var(--puck-space-1);
  border: var(--puck-border-width-regular) solid var(--puck-color-border);
  border-radius: var(--puck-radius-m);
  background: var(--puck-color-surface);
  color: var(--puck-color-text);
  font: inherit;
  font-size: var(--puck-font-size-xxs);
  cursor: pointer;

  &:hover:not([aria-disabled='true']) {
    background: var(--puck-color-interactive-neutral-hover);
  }

  &[aria-checked='true'] {
    border-color: var(--puck-color-interactive);
    background: var(--puck-color-interactive-soft);
  }

  &:focus-visible {
    outline: var(--puck-border-width-focus) solid var(--puck-color-focus-ring);
    outline-offset: 2px;
  }

  &[aria-disabled='true'] {
    cursor: not-allowed;
    opacity: 0.5;
  }

  > svg {
    width: 14px;
    height: 14px;
    color: var(--puck-color-interactive);
  }
`;

export const ColorSwatchTooltipTitle = styled.span`
  display: grid;
  text-align: center;
`;
