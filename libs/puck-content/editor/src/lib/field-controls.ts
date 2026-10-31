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

export const ToggleOptions = styled.div`
  display: flex;
  gap: var(--puck-space-2);
`;

export const ToggleOption = styled.label<{
  active: boolean;
  disabled: boolean;
}>`
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  min-height: 36px;
  padding: 8px;
  border: 1px solid
    ${({ active }) =>
      active ? 'var(--puck-color-interactive)' : 'var(--puck-color-border)'};
  border-radius: 4px;
  background: ${({ active }) =>
    active ?
      'var(--puck-color-interactive-soft)'
    : 'var(--puck-color-surface)'};
  color: ${({ active }) =>
    active ? 'var(--puck-color-interactive)' : 'var(--puck-color-text)'};
  cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};
  opacity: ${({ disabled }) => (disabled ? 0.5 : 1)};

  &:has(:focus-visible) {
    outline: var(--puck-border-width-focus) solid var(--puck-color-focus-ring);
    outline-offset: 1px;
  }

  input {
    position: absolute;
    width: 1px;
    height: 1px;
    margin: -1px;
    padding: 0;
    border: 0;
    overflow: hidden;
    clip: rect(0 0 0 0);
  }
`;

export const NumberInputWrapper = styled.label`
  position: relative;
  display: flex;
  align-items: center;
  min-width: 0;

  > svg {
    position: absolute;
    left: 10px;
    width: 16px;
    height: 16px;
    color: var(--puck-color-text-secondary);
    pointer-events: none;
  }

  > input {
    padding-inline-start: 34px;
    padding-inline-end: 30px;
    -moz-appearance: textfield;
  }

  &:has(select) > input {
    padding-inline-end: 64px;
  }

  > input::-webkit-outer-spin-button,
  > input::-webkit-inner-spin-button {
    margin: 0;
    -webkit-appearance: none;
  }
`;

export const NumberInputUnit = styled.span`
  position: absolute;
  right: 10px;
  color: var(--puck-color-text-muted);
  font-size: var(--puck-font-size-xxxs);
  pointer-events: none;
`;

export const FieldGrid = styled.div<{ columns: number }>`
  display: grid;
  grid-template-columns: repeat(${({ columns }) => columns}, minmax(0, 1fr));
  gap: var(--puck-space-2);
`;

export const ToggleableFieldWrapper = styled.div`
  position: relative;

  > .MuiSwitch-root {
    position: absolute;
    top: -6px;
    right: -8px;
    z-index: 1;
  }
`;

export const UnitSelect = styled.select`
  position: absolute;
  right: 6px;
  min-height: 24px;
  padding: 2px 4px;
  border: 0;
  border-radius: var(--puck-radius-s);
  background: transparent;
  color: var(--puck-color-text-muted);
  font-family: inherit;
  font-size: var(--puck-font-size-xxxs);
  cursor: pointer;

  &:hover:not(:disabled) {
    background: var(--puck-color-interactive-neutral-hover);
    color: var(--puck-color-text);
  }

  &:focus-visible {
    outline: var(--puck-border-width-focus) solid var(--puck-color-focus-ring);
  }
`;
