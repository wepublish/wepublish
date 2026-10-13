import styled from '@emotion/styled';
import { ComponentPropsWithoutRef, forwardRef, ReactNode } from 'react';
import { MdInfoOutline } from 'react-icons/md';
import { Tooltip, Whisper, WhisperProps } from 'rsuite';

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
  color: var(--rs-text-secondary);
  line-height: 0;
  vertical-align: middle;
  cursor: help;

  &:hover,
  &:focus-visible {
    color: var(--rs-text-heading);
  }

  &:focus-visible {
    outline: 2px solid var(--rs-primary-500);
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
  placement?: WhisperProps['placement'];
}

export function InfoTooltip({
  text,
  label,
  placement = 'top',
}: InfoTooltipProps) {
  return (
    <Whisper
      trigger={['hover', 'focus']}
      placement={placement}
      speaker={
        <Tooltip>
          <TooltipText>{text}</TooltipText>
        </Tooltip>
      }
    >
      <InfoTrigger
        aria-label={label ?? (typeof text === 'string' ? text : undefined)}
      />
    </Whisper>
  );
}
