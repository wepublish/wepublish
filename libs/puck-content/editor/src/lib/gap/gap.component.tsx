import { FieldProps } from '@puckeditor/core';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LuColumns2, LuLink2, LuRows2, LuUnlink2 } from 'react-icons/lu';

import {
  FieldNumberInput,
  FieldToggleGroup,
  ToggleableField,
} from '../field-controls.component';
import { FieldGrid, FieldStack } from '../field-controls';
import {
  GapAxis,
  gapAxes,
  GapField,
  GapValue,
  isGapLinked,
  setGap,
  setLinkedGap,
} from './gap.field';

const axisIcons = { row: LuRows2, column: LuColumns2 };

export type GapFieldRenderProps = FieldProps<GapField, GapValue | undefined> & {
  name: string;
};

export const GapFieldRender = ({
  field: { axes = gapAxes, ...field },
  name,
  value,
  onChange,
  readOnly,
}: GapFieldRenderProps) => {
  const { t } = useTranslation();
  const current = value ?? {};
  const [linked, setLinked] = useState(() => isGapLinked(value));
  const labels: Record<GapAxis, string> = {
    row: t('', 'Row gap'),
    column: t('', 'Column gap'),
  };
  const both = axes.length > 1;

  const changeLinked = (next: 'linked' | 'separate' | undefined) => {
    if (!next) {
      return;
    }

    setLinked(next === 'linked');

    if (next === 'linked') {
      onChange(setLinkedGap(current.column ?? current.row));
    }
  };

  return (
    <ToggleableField
      label={field.label ?? t('', 'Gap')}
      value={value}
      readOnly={readOnly}
      onChange={onChange}
    >
      <FieldStack>
        {both && (
          <FieldToggleGroup
            name={`${name}-mode`}
            value={linked ? 'linked' : 'separate'}
            readOnly={readOnly}
            onChange={changeLinked}
            options={[
              {
                value: 'linked',
                label: t('', 'Same gap for rows and columns'),
                icon: <LuLink2 size={16} />,
              },
              {
                value: 'separate',
                label: t('', 'Separate row and column gaps'),
                icon: <LuUnlink2 size={16} />,
              },
            ]}
          />
        )}

        {both && linked ?
          <FieldNumberInput
            label={t('', 'Gap')}
            icon={LuLink2}
            value={current.column}
            readOnly={readOnly}
            onChange={amount => onChange(setLinkedGap(amount))}
          />
        : <FieldGrid columns={axes.length}>
            {axes.map(axis => (
              <FieldNumberInput
                key={axis}
                label={labels[axis]}
                icon={axisIcons[axis]}
                value={current[axis]}
                readOnly={readOnly}
                onChange={amount => onChange(setGap(current, axis, amount))}
              />
            ))}
          </FieldGrid>
        }
      </FieldStack>
    </ToggleableField>
  );
};
