import styled from '@emotion/styled';

export const StylingGroups = styled.div`
  display: grid;
  gap: var(--puck-space-3);
`;

export const StylingGroupFrame = styled.div`
  position: relative;

  & [data-puck-field-group-collapsible] > [class*='_FieldGroup-toggle_'] {
    margin-block: calc(var(--puck-space-1) * -1);
    padding-block: var(--puck-space-1);
  }
`;

export const StylingGroupIcon = styled.span`
  position: relative;
  display: inline-flex;
`;

export const StylingModifiedDot = styled.span`
  position: absolute;
  top: -2px;
  right: -3px;
  width: 6px;
  height: 6px;
  border-radius: var(--puck-radius-round);
  background: var(--puck-color-interactive);
  box-shadow: 0 0 0 1.5px var(--puck-color-surface);
`;

export const StylingResetButton = styled.button`
  position: absolute;
  top: -3px;
  right: calc(16px + var(--puck-space-2));
  z-index: 1;
  height: 24px;
  padding: 0 var(--puck-space-2);
  border: 0;
  border-radius: var(--puck-radius-s);
  background: transparent;
  color: var(--puck-color-text-secondary);
  font-family: inherit;
  font-size: var(--puck-font-size-xxxs);
  font-weight: var(--puck-font-weight-medium);
  cursor: pointer;

  &:hover {
    background: var(--puck-color-interactive-neutral-hover);
    color: var(--puck-color-text);
  }

  &:focus-visible {
    outline: var(--puck-border-width-focus) solid var(--puck-color-focus-ring);
  }
`;
