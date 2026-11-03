import { FieldProps } from '@puckeditor/core';
import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  LuColumns2,
  LuGrid2X2,
  LuLink2,
  LuRows2,
  LuUnlink2,
} from 'react-icons/lu';

import { useFocusWithin } from '../focus-within';
import {
  FieldSpacingHint,
  FieldSpacingInput,
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
  const { focused, focusProps } = useFocusWithin();
  const hintId = useId();
  const current = value ?? {};
  const [linked, setLinked] = useState(() => isGapLinked(value));
  const labels: Record<GapAxis, string> = {
    row: t('puck.gap.rowGap'),
    column: t('puck.gap.columnGap'),
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
      label={field.label ?? t('puck.gap.gap')}
      value={value}
      readOnly={readOnly}
      onChange={onChange}
    >
      <FieldStack {...focusProps}>
        {both && (
          <FieldToggleGroup
            name={`${name}-mode`}
            value={linked ? 'linked' : 'separate'}
            readOnly={readOnly}
            onChange={changeLinked}
            options={[
              {
                value: 'linked',
                label: t('puck.gap.sameGapForRows'),
                icon: <LuLink2 size={16} />,
              },
              {
                value: 'separate',
                label: t('puck.gap.separateRowAndColumn'),
                icon: <LuUnlink2 size={16} />,
              },
            ]}
          />
        )}

        {both && linked ?
          <FieldSpacingInput
            label={t('puck.gap.gap')}
            icon={LuGrid2X2}
            value={current.column}
            readOnly={readOnly}
            describedBy={hintId}
            onChange={amount => onChange(setLinkedGap(amount))}
          />
        : <FieldGrid columns={axes.length}>
            {axes.map(axis => (
              <FieldSpacingInput
                key={axis}
                label={labels[axis]}
                icon={axisIcons[axis]}
                value={current[axis]}
                readOnly={readOnly}
                describedBy={hintId}
                onChange={amount => onChange(setGap(current, axis, amount))}
              />
            ))}
          </FieldGrid>
        }

        <FieldSpacingHint
          id={hintId}
          visible={focused}
        />
      </FieldStack>
    </ToggleableField>
  );
};
