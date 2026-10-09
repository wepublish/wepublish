import styled from '@emotion/styled';
import { ReactNode, useId } from 'react';
import { IconButton, IconButtonProps } from 'rsuite';

import { StateColor } from '../utility';

const stateTextColors: Record<StateColor, string> = {
  [StateColor.pending]: 'var(--wep-state-pending-text)',
  [StateColor.published]: 'var(--wep-state-published-text)',
  [StateColor.draft]: 'var(--wep-state-draft-text)',
  [StateColor.none]: 'var(--rs-text-secondary)',
};

const Bar = styled('header', {
  shouldForwardProp: prop => prop !== 'accent',
})<{ accent: string }>`
  container-type: inline-size;
  width: 100%;
  background-color: var(--wep-content-bg, var(--rs-bg-card));
  border-bottom: 1px solid var(--rs-border-primary);
  box-shadow: inset 0 3px 0 ${({ accent }) => accent};

  @container (max-width: 1240px) {
    .rs-btn[data-collapse='md'] {
      padding-inline: 9px;

      > [data-label] {
        display: none;
      }
    }
  }

  @container (max-width: 520px) {
    .rs-btn[data-collapse='sm'] {
      padding-inline: 9px;

      > [data-label] {
        display: none;
      }
    }
  }
`;

const Inner = styled('div')`
  display: flex;
  align-items: center;
  gap: 12px 16px;
  min-height: 64px;
  padding: 13px 20px 10px;

  @container (max-width: 760px) {
    flex-wrap: wrap;
    padding: 11px 12px 8px;
  }
`;

const Start = styled('div')`
  display: flex;
  flex: 1 1 auto;
  align-items: center;
  gap: 12px;
  min-width: 0;
`;

const Status = styled('div')`
  display: grid;
  justify-items: start;
  gap: 2px;
  min-width: 0;
`;

const Chip = styled('span', {
  shouldForwardProp: prop => prop !== 'background' && prop !== 'color',
})<{ background: string; color: string }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  max-width: 100%;
  padding: 2px 10px;
  border-radius: 999px;
  background-color: ${({ background }) => background};
  color: ${({ color }) => color};
  font-size: 12px;
  font-weight: 600;
  line-height: 20px;
  white-space: nowrap;

  &::before {
    content: '';
    flex-shrink: 0;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background-color: currentColor;
  }

  > span {
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;

const Meta = styled('span')`
  max-width: 100%;
  overflow: hidden;
  padding-left: 2px;
  font-size: 12px;
  line-height: 16px;
  color: var(--rs-text-secondary);
  white-space: nowrap;
  text-overflow: ellipsis;
`;

const Title = styled('div')`
  flex: 1 1 auto;
  min-width: 0;
`;

const Actions = styled('div')`
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 8px;

  @container (max-width: 760px) {
    flex: 1 1 100%;
    justify-content: space-between;
  }
`;

const Group = styled('div')`
  display: flex;
  align-items: center;
  gap: 4px;

  &:empty {
    display: none;
  }
`;

const PrimaryGroup = styled(Group)`
  gap: 8px;
`;

const Divider = styled('span')`
  flex-shrink: 0;
  width: 1px;
  height: 24px;
  margin: 0 4px;
  background-color: var(--rs-border-primary);
`;

export interface EditorHeaderProps {
  state: StateColor;
  stateLabel: string;
  meta?: ReactNode;
  back?: ReactNode;
  title?: ReactNode;
  secondaryActions?: ReactNode;
  primaryActions?: ReactNode;
}

export function EditorHeader({
  state,
  stateLabel,
  meta,
  back,
  title,
  secondaryActions,
  primaryActions,
}: EditorHeaderProps) {
  const statusId = useId();
  const textColor = stateTextColors[state];

  return (
    <Bar accent={textColor}>
      <Inner>
        <Start>
          {back}

          <Status
            role="group"
            aria-labelledby={statusId}
          >
            <Chip
              background={state}
              color={textColor}
            >
              <span id={statusId}>{stateLabel}</span>
            </Chip>

            {meta && <Meta>{meta}</Meta>}
          </Status>

          {title && <Title>{title}</Title>}
        </Start>

        <Actions>
          <Group>{secondaryActions}</Group>
          {secondaryActions && primaryActions && <Divider />}
          <PrimaryGroup>{primaryActions}</PrimaryGroup>
        </Actions>
      </Inner>
    </Bar>
  );
}

export interface EditorHeaderButtonProps extends IconButtonProps {
  label: string;
  collapse?: 'md' | 'sm' | false;
}

export function EditorHeaderButton({
  label,
  collapse = 'md',
  ...props
}: EditorHeaderButtonProps) {
  return (
    <IconButton
      title={collapse ? label : undefined}
      aria-label={label}
      data-collapse={collapse || undefined}
      {...props}
    >
      <span data-label>{label}</span>
    </IconButton>
  );
}
