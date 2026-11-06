import styled from '@emotion/styled';
import { useTheme } from '@mui/material';
import { HTMLAttributes } from 'react';

import { paletteColor } from '../paletteColor';
import { StateColor } from '../utility';

export const stateTextColors: Record<StateColor, string> = {
  [StateColor.pending]: 'var(--wep-state-pending-text)',
  [StateColor.published]: 'var(--wep-state-published-text)',
  [StateColor.draft]: 'var(--wep-state-draft-text)',
  [StateColor.none]: 'text.secondary',
};

const stateNames: Record<StateColor, string> = {
  [StateColor.pending]: 'pending',
  [StateColor.published]: 'published',
  [StateColor.draft]: 'draft',
  [StateColor.none]: 'none',
};

const Pill = styled('span', {
  shouldForwardProp: prop =>
    prop !== 'background' && prop !== 'color' && prop !== 'size',
})<{ background: string; color: string; size: 'small' | 'medium' }>`
  display: inline-flex;
  align-items: center;
  gap: ${({ size }) => (size === 'small' ? '5px' : '6px')};
  min-width: 0;
  max-width: 100%;
  padding: ${({ size }) => (size === 'small' ? '0 8px' : '2px 10px')};
  border-radius: ${({ size }) => (size === 'small' ? '10px' : '12px')};
  background-color: ${({ background }) => background};
  color: ${({ color }) => color};
  font-size: ${({ size }) => (size === 'small' ? '11px' : '12px')};
  font-weight: 600;
  line-height: 20px;

  &::before {
    content: '';
    flex-shrink: 0;
    width: ${({ size }) => (size === 'small' ? '5px' : '6px')};
    height: ${({ size }) => (size === 'small' ? '5px' : '6px')};
    border-radius: 50%;
    background-color: currentColor;
  }

  > span {
    min-width: 0;
    overflow-wrap: anywhere;
  }
`;

export type StatePillProps = HTMLAttributes<HTMLSpanElement> & {
  state: StateColor;
  size?: 'small' | 'medium';
};

export function StatePill({
  state,
  size = 'medium',
  children,
  ...props
}: StatePillProps) {
  const theme = useTheme();

  return (
    <Pill
      {...props}
      data-state={stateNames[state]}
      size={size}
      background={
        state === StateColor.none ? theme.vars.palette.action.selected : state
      }
      color={paletteColor(theme, stateTextColors[state])}
    >
      {children}
    </Pill>
  );
}
