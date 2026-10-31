import styled from '@emotion/styled';
import { FieldLabel, FieldProps } from '@puckeditor/core';

import {
  AlignmentField,
  AlignmentOrientation,
  AlignmentValue,
} from './alignment.field';
import { Tooltip } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { IconType } from 'react-icons';
import {
  LuAlignCenter,
  LuAlignCenterHorizontal,
  LuAlignEndHorizontal,
  LuAlignHorizontalDistributeCenter,
  LuAlignHorizontalJustifyCenter,
  LuAlignHorizontalJustifyEnd,
  LuAlignHorizontalJustifyStart,
  LuAlignHorizontalSpaceAround,
  LuAlignHorizontalSpaceBetween,
  LuAlignLeft,
  LuAlignRight,
  LuAlignStartHorizontal,
  LuAlignVerticalDistributeCenter,
  LuAlignVerticalSpaceAround,
  LuAlignVerticalSpaceBetween,
  LuStretchHorizontal,
  LuStretchVertical,
} from 'react-icons/lu';

const useAlignmentLabels = (): Record<AlignmentValue, string> => {
  const { t } = useTranslation();

  return {
    start: t('', 'Start'),
    left: t('', 'Left'),
    center: t('', 'Center'),
    right: t('', 'Right'),
    end: t('', 'End'),
    stretch: t('', 'Stretch'),
    'space-between': t('', 'Space between'),
    'space-around': t('', 'Space around'),
    'space-evenly': t('', 'Space evenly'),
  };
};

const alignmentIcons: Record<
  AlignmentOrientation,
  Record<AlignmentValue, IconType>
> = {
  text: {
    start: LuAlignLeft,
    left: LuAlignLeft,
    center: LuAlignCenter,
    right: LuAlignRight,
    end: LuAlignRight,
    stretch: LuStretchHorizontal,
    'space-between': LuAlignHorizontalSpaceBetween,
    'space-around': LuAlignHorizontalSpaceAround,
    'space-evenly': LuAlignHorizontalDistributeCenter,
  },
  horizontal: {
    start: LuAlignHorizontalJustifyStart,
    left: LuAlignHorizontalJustifyStart,
    center: LuAlignHorizontalJustifyCenter,
    right: LuAlignHorizontalJustifyEnd,
    end: LuAlignHorizontalJustifyEnd,
    stretch: LuStretchHorizontal,
    'space-between': LuAlignHorizontalSpaceBetween,
    'space-around': LuAlignHorizontalSpaceAround,
    'space-evenly': LuAlignHorizontalDistributeCenter,
  },
  vertical: {
    start: LuAlignStartHorizontal,
    left: LuAlignStartHorizontal,
    center: LuAlignCenterHorizontal,
    right: LuAlignEndHorizontal,
    end: LuAlignEndHorizontal,
    stretch: LuStretchVertical,
    'space-between': LuAlignVerticalSpaceBetween,
    'space-around': LuAlignVerticalSpaceAround,
    'space-evenly': LuAlignVerticalDistributeCenter,
  },
};

const AlignmentOptions = styled.div`
  display: flex;
  gap: var(--puck-space-2);
`;

const AlignmentOption = styled.label<{ active: boolean; disabled: boolean }>`
  position: relative;
  display: flex;
  flex: 1;
  min-width: 0;
  align-items: center;
  justify-content: center;
  padding: 8px;
  border: 1px solid
    ${({ active }) => (active ? 'var(--puck-color-interactive)' : 'var(--puck-color-border)')};
  border-radius: 4px;
  background: ${({ active }) => (active ? 'var(--puck-color-interactive-soft)' : 'var(--puck-color-surface)')};
  color: ${({ active }) => (active ? 'var(--puck-color-interactive)' : 'var(--puck-color-text)')};
  cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};
  opacity: ${({ disabled }) => (disabled ? 0.5 : 1)};

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

export type AlignmentFieldRenderProps = FieldProps<
  AlignmentField,
  AlignmentValue | undefined
> & {
  name: string;
};

export const AlignmentFieldRender = ({
  field: {
    alignments = ['start', 'center', 'end'],
    orientation = 'horizontal',
    ...field
  },
  value,
  onChange,
  readOnly,
  name,
}: AlignmentFieldRenderProps) => {
  const labels = useAlignmentLabels();

  return (
    <FieldLabel
      label={field.label ?? 'Alignment'}
      readOnly={readOnly}
      el="div"
    >
      <AlignmentOptions>
        {alignments.map(alignment => {
          const Icon = alignmentIcons[orientation][alignment];
          const active = value === alignment;

          return (
            <Tooltip
              key={alignment}
              title={labels[alignment]}
              disableInteractive
            >
              <AlignmentOption
                active={active}
                disabled={!!readOnly}
              >
                <input
                  type="radio"
                  name={name}
                  value={alignment}
                  checked={active}
                  disabled={readOnly}
                  onChange={() => onChange(alignment)}
                  // Radios do not fire onChange when already checked, so clear
                  // the selection on a repeated click
                  onClick={() => active && onChange(undefined)}
                />

                <Icon size={20} />
              </AlignmentOption>
            </Tooltip>
          );
        })}
      </AlignmentOptions>
    </FieldLabel>
  );
};
