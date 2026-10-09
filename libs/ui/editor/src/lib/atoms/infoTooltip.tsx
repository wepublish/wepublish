import styled from '@emotion/styled';
import { Tooltip, TooltipProps } from '@mui/material';
import { ComponentPropsWithoutRef, forwardRef, ReactNode } from 'react';
import { MdInfoOutline } from 'react-icons/md';

const TriggerButton = styled('button')`
  position: relative;
  z-index: 1;
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  margin: 0;
  padding: 2px;
  border: 0;
  border-radius: 50%;
  background: none;
  color: ${({ theme }) => theme.palette.text.secondary};
  line-height: 0;
  vertical-align: middle;
  cursor: help;

  &:hover,
  &:focus-visible {
    color: ${({ theme }) => theme.palette.text.primary};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.palette.primary.main};
    outline-offset: 1px;
  }
`;

export const InfoTrigger = forwardRef<
  HTMLButtonElement,
  ComponentPropsWithoutRef<'button'>
>(function InfoTrigger(props, ref) {
  return (
    <TriggerButton
      ref={ref}
      type="button"
      {...props}
    >
      <MdInfoOutline size={16} />
    </TriggerButton>
  );
});

const TooltipText = styled('span')`
  white-space: pre-line;
`;

export interface InfoTooltipProps {
  text: ReactNode;
  label?: string;
  placement?: TooltipProps['placement'];
}

export function InfoTooltip({
  text,
  label,
  placement = 'top',
}: InfoTooltipProps) {
  return (
    <Tooltip
      placement={placement}
      title={<TooltipText>{text}</TooltipText>}
    >
      <InfoTrigger
        aria-label={label ?? (typeof text === 'string' ? text : undefined)}
      />
    </Tooltip>
  );
}
