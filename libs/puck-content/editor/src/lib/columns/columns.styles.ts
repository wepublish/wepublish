import styled from '@emotion/styled';

export const ColumnsPresetGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--puck-space-3);
`;

export const ColumnsPresetButton = styled.button`
  display: flex;
  gap: var(--puck-space-1);
  min-width: 0;
  padding: var(--puck-space-3);
  border: 1px solid var(--puck-color-border);
  border-radius: var(--puck-radius-l);
  background: var(--puck-color-surface);
  cursor: pointer;

  &[aria-pressed='true'] {
    padding: calc(var(--puck-space-3) - 1px);
    border: 2px solid var(--puck-color-interactive);
  }

  &:disabled {
    cursor: default;
  }

  &:focus-visible {
    outline: var(--puck-border-width-focus) solid var(--puck-color-focus-ring);
    outline-offset: var(--puck-border-width-focus);
  }
`;

export const ColumnsPresetColumn = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
  height: 56px;
  container-type: inline-size;
  border: 1px solid var(--puck-color-border);
  border-radius: var(--puck-radius-m);
  background: var(--puck-color-surface-subtle);
  color: var(--puck-color-text);
  font-size: var(--puck-font-size-xxs);
  font-weight: 500;

  [aria-pressed='true'] > & {
    background: var(--puck-color-surface);
  }
`;

export const ColumnsPresetPercent = styled.span`
  @container (max-width: 31px) {
    display: none;
  }
`;
