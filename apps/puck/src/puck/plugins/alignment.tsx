import styled from '@emotion/styled';
import { BaseField, FieldLabel, FieldProps, Plugin } from '@puckeditor/core';
import { useTranslation } from 'react-i18next';
import {
  MdFormatAlignCenter,
  MdFormatAlignLeft,
  MdFormatAlignRight,
} from 'react-icons/md';

import { UserConfig } from '../types';

export type AlignmentValue = 'left' | 'start' | 'center' | 'right' | 'end';

export type AlignmentField = BaseField & {
  type: 'alignment';
  alignments?: AlignmentValue[];
};

const useAlignmentLabels = (): Record<AlignmentValue, string> => {
  const { t } = useTranslation();

  return {
    start: t('', 'Start'),
    left: t('', 'Left'),
    center: t('', 'Center'),
    right: t('', 'Right'),
    end: t('', 'End'),
  };
};

const alignmentIcons: Record<AlignmentValue, typeof MdFormatAlignLeft> = {
  start: MdFormatAlignLeft,
  left: MdFormatAlignLeft,
  center: MdFormatAlignCenter,
  right: MdFormatAlignRight,
  end: MdFormatAlignRight,
};

const AlignmentOptions = styled.div`
  display: flex;
  gap: 4px;
`;

const AlignmentOption = styled.label<{ active: boolean; disabled: boolean }>`
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  padding: 8px;
  border: 1px solid ${({ active }) => (active ? '#1a1a1a' : '#ddd')};
  border-radius: 4px;
  background: ${({ active }) => (active ? '#1a1a1a' : 'transparent')};
  color: ${({ active }) => (active ? '#f2f2f2' : 'inherit')};
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

type AlignmentFieldRenderProps = FieldProps<AlignmentField, AlignmentValue> & {
  name: string;
};

const AlignmentFieldRender = ({
  field: { alignments = ['start', 'center', 'end'], ...field },
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
    >
      <AlignmentOptions>
        {alignments.map(alignment => {
          const Icon = alignmentIcons[alignment];
          const active = value === alignment;

          return (
            <AlignmentOption
              key={alignment}
              title={labels[alignment]}
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
              />

              <Icon size={20} />
            </AlignmentOption>
          );
        })}
      </AlignmentOptions>
    </FieldLabel>
  );
};

export const alignmentPlugin: Plugin<UserConfig> = {
  name: 'alignment',
  overrides: {
    fieldTypes: {
      alignment: AlignmentFieldRender,
    },
  },
};
