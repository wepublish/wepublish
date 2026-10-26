import styled from '@emotion/styled';

const controlStyles = `
  box-sizing: border-box;
  width: 100%;
  max-width: 100%;
  padding: var(--puck-space-3) calc(var(--puck-space-4) - var(--puck-border-width-regular));
  border: var(--puck-border-width-regular) solid var(--puck-color-border);
  border-radius: var(--puck-radius-m);
  background: var(--puck-color-surface);
  color: var(--puck-color-text);
  font-family: inherit;
  font-size: var(--puck-font-size-xxs);
  transition: border-color var(--puck-duration-fast) var(--puck-ease-exit);

  &:hover:not(:disabled) {
    border-color: var(--puck-color-border-hover);
    transition: none;
  }

  &:focus {
    border-color: var(--puck-color-border-hover);
    outline: var(--puck-border-width-focus) solid var(--puck-color-focus-ring);
    transition: none;
  }

  &:disabled {
    background: var(--puck-color-surface-muted);
    color: var(--puck-color-text-secondary);
    cursor: default;
  }
`;

export const FieldInput = styled.input`
  ${controlStyles}

  &::placeholder {
    color: var(--puck-color-text-muted);
  }
`;

export const SelectWrapper = styled.div`
  position: relative;
  width: 100%;
  min-width: 0;
`;

export const NativeSelect = styled.select`
  ${controlStyles}
  appearance: none;
  padding-inline-end: 36px;
  cursor: pointer;
  text-overflow: ellipsis;

  &:hover:not(:disabled) {
    background-color: var(--puck-color-interactive-soft-hover);
  }
`;

export const SelectIcon = styled.svg`
  position: absolute;
  top: 50%;
  right: 12px;
  width: 10px;
  height: 10px;
  transform: translateY(-50%);
  pointer-events: none;
  fill: var(--puck-color-border-hover);
`;

export const FieldCheckboxLabel = styled.label`
  display: inline-flex;
  gap: var(--puck-space-2);
  align-items: center;
  color: var(--puck-color-text);
  font-size: var(--puck-font-size-xxs);
  cursor: pointer;

  input {
    margin: 0;
    accent-color: var(--puck-color-interactive);
  }
`;

export const FieldStack = styled.div`
  display: grid;
  gap: var(--puck-space-2);
`;
