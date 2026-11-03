import styled from '@emotion/styled';

const focusRing = `
  &:focus-visible {
    outline: var(--puck-border-width-focus) solid var(--puck-color-focus-ring);
    outline-offset: -2px;
  }
`;

export const BreakpointTabs = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
  border-bottom: 1px solid var(--puck-color-border);
  margin-bottom: 12px;
`;

export const BreakpointTabItem = styled.div<{ active: boolean }>`
  display: flex;
  align-items: center;
  border-bottom: 2px solid
    ${({ active }) => (active ? 'var(--puck-color-text)' : 'transparent')};
  margin-bottom: -1px;
`;

export const BreakpointTab = styled.button<{
  active: boolean;
  removable: boolean;
}>`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: ${({ removable }) => (removable ? '6px 2px 6px 10px' : '6px 10px')};
  border: 0;
  border-radius: var(--puck-radius-s);
  background: transparent;
  color: ${({ active }) =>
    active ? 'var(--puck-color-text)' : 'var(--puck-color-text-secondary)'};
  font: inherit;
  font-weight: ${({ active }) => (active ? 600 : 400)};
  cursor: pointer;

  ${focusRing}

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
`;

export const BreakpointActiveDot = styled.span`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: ${({ theme }) => theme.vars.palette.success.main};
`;

export const BreakpointRemoveButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  margin: 0 2px 0 0;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: var(--puck-color-text-secondary);
  cursor: pointer;

  &:hover {
    color: var(--puck-color-text);
    background: var(--puck-color-interactive-neutral-hover);
  }

  ${focusRing}
`;

export const BreakpointAddButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: 1px solid var(--puck-color-border);
  border-radius: 4px;
  background: transparent;
  color: inherit;
  cursor: pointer;

  ${focusRing}

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
`;

export const BreakpointAddWrapper = styled.span`
  display: inline-flex;
  margin-left: auto;
`;

export const BreakpointFields = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 16px;
`;
