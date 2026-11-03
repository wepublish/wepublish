import styled from '@emotion/styled';

export const VisuallyHiddenInput = styled.input`
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  border: 0;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
`;

export const VisibilityControl = styled.div`
  display: grid;
  gap: var(--puck-space-2);
`;

export const VisibilitySummaryRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--puck-space-2);
  min-height: 24px;
`;

export const VisibilitySummary = styled.p`
  margin: 0;
  color: var(--puck-color-text-secondary);
  font-size: var(--puck-font-size-xxs);
  line-height: 1.4;
`;

export const VisibilityTextButton = styled.button`
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  gap: var(--puck-space-1);
  padding: var(--puck-space-1) var(--puck-space-2);
  border: 0;
  border-radius: var(--puck-radius-s);
  background: none;
  color: var(--puck-color-interactive);
  font-family: inherit;
  font-size: var(--puck-font-size-xxs);
  font-weight: var(--puck-font-weight-medium);
  white-space: nowrap;
  cursor: pointer;

  &:hover:not(:disabled) {
    background: var(--puck-color-interactive-soft);
  }

  &:focus-visible {
    outline: var(--puck-border-width-focus) solid var(--puck-color-focus-ring);
    outline-offset: 1px;
  }

  &:disabled {
    color: var(--puck-color-text-disabled);
    cursor: default;
  }

  svg {
    width: var(--puck-icon-size-xs);
    height: var(--puck-icon-size-xs);
  }
`;

export const BreakpointList = styled.ul`
  container-type: inline-size;
  display: grid;
  margin: 0;
  padding: 0;
  border: var(--puck-border-width-regular) solid var(--puck-color-border);
  border-radius: var(--puck-radius-m);
  background: var(--puck-color-surface);
  list-style: none;

  > li + li {
    border-top: var(--puck-border-width-regular) solid
      var(--puck-color-border-muted);
  }

  > li:first-of-type > label {
    border-radius: var(--puck-radius-m) var(--puck-radius-m) 0 0;
  }

  > li:last-of-type > label {
    border-radius: 0 0 var(--puck-radius-m) var(--puck-radius-m);
  }
`;

export const BreakpointOption = styled.label<{
  shown: boolean;
  locked: boolean;
}>`
  position: relative;
  display: grid;
  grid-template-areas: 'icon name width check';
  grid-template-columns:
    var(--puck-icon-size-s) 2.5em minmax(0, 1fr)
    var(--puck-icon-size-s);
  align-items: center;
  gap: 0 var(--puck-space-2);
  padding: var(--puck-space-2) var(--puck-space-3);

  @container (max-width: 219px) {
    grid-template-areas:
      'icon name check'
      'icon width check';
    grid-template-columns:
      var(--puck-icon-size-s) minmax(0, 1fr)
      var(--puck-icon-size-s);
  }
  color: ${({ shown }) =>
    shown ? 'var(--puck-color-text)' : 'var(--puck-color-text-muted)'};
  font-size: var(--puck-font-size-xxs);
  cursor: ${({ locked }) => (locked ? 'default' : 'pointer')};
  opacity: ${({ locked }) => (locked ? 0.6 : 1)};

  &:hover {
    background: ${({ locked }) =>
      locked ? 'none' : 'var(--puck-color-interactive-neutral-hover)'};
  }

  &:has(:focus-visible) {
    z-index: 1;
    outline: var(--puck-border-width-focus) solid var(--puck-color-focus-ring);
    outline-offset: calc(var(--puck-border-width-focus) * -1);
  }

  > svg {
    grid-area: icon;
    width: var(--puck-icon-size-s);
    height: var(--puck-icon-size-s);
  }
`;

export const BreakpointName = styled.span`
  grid-area: name;
  font-weight: var(--puck-font-weight-semibold);
`;

export const BreakpointWidth = styled.span`
  grid-area: width;
  overflow: hidden;
  color: var(--puck-color-text-secondary);
  font-variant-numeric: tabular-nums;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const BreakpointCheck = styled.span<{ shown: boolean }>`
  grid-area: check;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  width: var(--puck-icon-size-s);
  height: var(--puck-icon-size-s);
  border: var(--puck-border-width-regular) solid
    ${({ shown }) =>
      shown ?
        'var(--puck-color-interactive)'
      : 'var(--puck-color-border-hover)'};
  border-radius: var(--puck-radius-s);
  background: ${({ shown }) =>
    shown ? 'var(--puck-color-interactive)' : 'var(--puck-color-surface)'};
  color: var(--puck-color-text-inverse);

  svg {
    width: 12px;
    height: 12px;
  }
`;
