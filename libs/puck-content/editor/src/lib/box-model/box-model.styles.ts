import styled from '@emotion/styled';

import type { Side } from '../sides/sides';

export const SpacingTextField = styled.input`
  box-sizing: border-box;
  width: 100%;
  max-width: 52px;
  height: 26px;
  padding: 0 var(--puck-space-1);
  border: var(--puck-border-width-regular) solid var(--puck-color-border-muted);
  border-radius: var(--puck-radius-s);
  background: var(--puck-color-surface);
  color: var(--puck-color-text);
  font-family: inherit;
  font-size: var(--puck-font-size-xxxs);
  text-align: center;
  font-variant-numeric: tabular-nums;

  &::placeholder {
    color: var(--puck-color-text-muted);
  }

  &:hover:not(:disabled) {
    border-color: var(--puck-color-border-hover);
  }

  &:focus {
    border-color: var(--puck-color-border-hover);
    outline: var(--puck-border-width-focus) solid var(--puck-color-focus-ring);
  }

  &[aria-invalid='true'] {
    border-color: var(--mui-palette-error-main, var(--puck-color-red-06));
  }

  &:disabled {
    background: var(--puck-color-surface-muted);
    color: var(--puck-color-text-secondary);
  }
`;

export const SpacingLinkToggle = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  border: 0;
  border-radius: var(--puck-radius-s);
  background: transparent;
  color: var(--puck-color-text-muted);
  cursor: pointer;

  &[aria-pressed='true'] {
    background: var(--puck-color-interactive-soft);
    color: var(--puck-color-interactive);
  }

  &:hover:not(:disabled) {
    background: var(--puck-color-interactive-soft-hover);
    color: var(--puck-color-text);
  }

  &:focus-visible {
    outline: var(--puck-border-width-focus) solid var(--puck-color-focus-ring);
    outline-offset: 1px;
  }

  &:disabled {
    cursor: default;
    opacity: 0.5;
  }
`;

export const BoxModelFrame = styled.div`
  display: grid;
  gap: var(--puck-space-2);
`;

export const BoxModelRing = styled.div<{ ringKind: 'margin' | 'padding' }>`
  display: grid;
  grid-template-columns: minmax(36px, 1fr) minmax(0, 2fr) minmax(36px, 1fr);
  grid-template-areas:
    'label label link'
    'top top top'
    'left inner right'
    'bottom bottom bottom';
  align-items: center;
  gap: var(--puck-space-1);
  padding: var(--puck-space-2) var(--puck-space-1);
  border: var(--puck-border-width-regular)
    ${({ ringKind }) => (ringKind === 'margin' ? 'dashed' : 'solid')}
    var(--puck-color-border);
  border-radius: var(--puck-radius-m);
  background: ${({ ringKind }) =>
    ringKind === 'margin' ?
      'var(--puck-color-surface-muted)'
    : 'var(--puck-color-surface)'};
`;

export const BoxModelRingLabel = styled.span`
  grid-area: label;
  min-width: 0;
  padding-inline-start: var(--puck-space-1);
  color: var(--puck-color-text-secondary);
  font-size: var(--puck-font-size-xxxs);
  font-weight: var(--puck-font-weight-semibold);
  letter-spacing: 0.04em;
  text-transform: uppercase;
  white-space: nowrap;
`;

export const BoxModelLinkCell = styled.div`
  grid-area: link;
  justify-self: end;
`;

export const BoxModelSideCell = styled.div<{ gridArea: Side }>`
  grid-area: ${({ gridArea }) => gridArea};
  display: flex;
  justify-content: center;
`;

export const BoxModelSideUnavailable = styled.span`
  color: var(--puck-color-text-muted);
  font-size: var(--puck-font-size-xxxs);
`;

export const BoxModelInner = styled.div`
  grid-area: inner;
  min-width: 0;
`;

export const BoxModelContent = styled.div`
  min-height: 20px;
  border: var(--puck-border-width-regular) dashed var(--puck-color-border);
  border-radius: var(--puck-radius-s);
  background: var(--puck-color-interactive-soft);
`;

export const BoxModelHint = styled.p`
  margin: 0;
  color: var(--puck-color-text-muted);
  font-size: var(--puck-font-size-xxxs);
  line-height: var(--puck-line-height-s);
`;
