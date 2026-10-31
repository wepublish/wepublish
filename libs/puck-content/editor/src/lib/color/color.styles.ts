import styled from '@emotion/styled';

export const ColorTrigger = styled.button`
  display: flex;
  align-items: center;
  gap: var(--puck-space-2);
  box-sizing: border-box;
  width: 100%;
  min-height: 36px;
  padding: 5px var(--puck-space-3) 5px 5px;
  border: var(--puck-border-width-regular) solid var(--puck-color-border);
  border-radius: var(--puck-radius-m);
  background: var(--puck-color-surface);
  color: var(--puck-color-text);
  font: inherit;
  font-size: var(--puck-font-size-xxs);
  text-align: start;
  cursor: pointer;
  transition: border-color var(--puck-duration-fast) var(--puck-ease-exit);

  &:hover:not(:disabled) {
    border-color: var(--puck-color-border-hover);
    transition: none;
  }

  &:focus-visible {
    border-color: var(--puck-color-border-hover);
    outline: var(--puck-border-width-focus) solid var(--puck-color-focus-ring);
  }

  &:disabled {
    background: var(--puck-color-surface-muted);
    color: var(--puck-color-text-secondary);
    cursor: default;
  }

  > svg {
    flex-shrink: 0;
    width: 16px;
    height: 16px;
    margin-inline-start: auto;
    color: var(--puck-color-text-secondary);
  }
`;

export const ColorTriggerText = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const ColorPickerSurface = styled.div`
  box-sizing: border-box;
  display: grid;
  gap: var(--puck-space-3);
  width: 296px;
  max-width: calc(100vw - 32px);
  padding: var(--puck-space-3);
  background: var(--puck-color-surface);
  color: var(--puck-color-text);
  font-family: var(--puck-font-family);
  font-size: var(--puck-font-size-xxs);
`;

export const ColorTabList = styled.div`
  display: grid;
  grid-auto-columns: minmax(0, 1fr);
  grid-auto-flow: column;
  gap: var(--puck-space-1);
  padding: var(--puck-space-1);
  border-radius: var(--puck-radius-m);
  background: var(--puck-color-surface-muted);
`;

export const ColorTabButton = styled.button`
  padding: var(--puck-space-1) var(--puck-space-2);
  border: 0;
  border-radius: var(--puck-radius-s);
  background: transparent;
  color: var(--puck-color-text-secondary);
  font: inherit;
  font-weight: var(--puck-font-weight-medium);
  cursor: pointer;

  &:hover {
    color: var(--puck-color-text);
  }

  &[aria-selected='true'] {
    background: var(--puck-color-surface);
    color: var(--puck-color-text);
    box-shadow: 0 0 0 var(--puck-border-width-regular) var(--puck-color-border);
  }

  &:focus-visible {
    outline: var(--puck-border-width-focus) solid var(--puck-color-focus-ring);
    outline-offset: 1px;
  }
`;

export const ColorCustomEditor = styled.div`
  display: grid;
  gap: var(--puck-space-3);

  [tabindex]:focus-visible {
    outline: var(--puck-border-width-focus) solid var(--puck-color-focus-ring) !important;
    outline-offset: 2px;
  }
`;

export const ColorHexRow = styled.div`
  display: grid;
  grid-template-columns: auto auto minmax(0, 1fr);
  align-items: center;
  gap: var(--puck-space-2);
`;

export const ColorHexLabel = styled.label`
  color: var(--puck-color-text-secondary);
  font-size: var(--puck-font-size-xxxs);
  font-weight: var(--puck-font-weight-medium);
`;

export const ColorFieldError = styled.p`
  margin: 0;
  color: var(--mui-palette-error-main, var(--puck-color-red-04));
  font-size: var(--puck-font-size-xxxs);
`;

export const ColorMatchHint = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--puck-space-2);
  padding: var(--puck-space-2) var(--puck-space-3);
  border-radius: var(--puck-radius-m);
  background: var(--puck-color-interactive-soft);
  color: var(--puck-color-text);
  font-size: var(--puck-font-size-xxxs);
`;

export const ColorTextButton = styled.button`
  padding: 0;
  border: 0;
  border-radius: var(--puck-radius-xs);
  background: transparent;
  color: var(--puck-color-interactive);
  font: inherit;
  font-weight: var(--puck-font-weight-semibold);
  cursor: pointer;

  &:hover {
    color: var(--puck-color-interactive-hover);
    text-decoration: underline;
  }

  &:focus-visible {
    outline: var(--puck-border-width-focus) solid var(--puck-color-focus-ring);
    outline-offset: 2px;
  }
`;
