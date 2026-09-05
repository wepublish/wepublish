import { BaseField, FieldLabel, FieldProps, Plugin } from '@puckeditor/core';
import { FieldAiParams } from '@puckeditor/plugin-ai';

import { UserFieldsConfig } from './fields';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export type PaddingSide = 'top' | 'right' | 'bottom' | 'left';

export const paddingSides = ['top', 'right', 'bottom', 'left'] as PaddingSide[];

export type PaddingValue = {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
};

export type PaddingField = BaseField & {
  type: 'padding';
};

export const paddingFieldAi: FieldAiParams = {
  instructions:
    'Inner padding of the element in pixels, per side. Set all four sides to the same number for uniform padding. Sides that are omitted keep the component default.',
  schema: {
    type: 'object',
    properties: {
      top: { type: 'number', description: 'Top padding in pixels' },
      right: { type: 'number', description: 'Right padding in pixels' },
      bottom: { type: 'number', description: 'Bottom padding in pixels' },
      left: { type: 'number', description: 'Left padding in pixels' },
    },
    additionalProperties: false,
  },
};

const usePaddingLabels = () => {
  const { t } = useTranslation();

  return {
    all: t('', 'All sides'),
    top: t('', 'Top'),
    right: t('', 'Right'),
    bottom: t('', 'Bottom'),
    left: t('', 'Left'),
    moreOptions: t('', 'More options'),
  };
};

const allSidesEqual = (value: PaddingValue) => {
  return (
    value.top === value.right &&
    value.right === value.bottom &&
    value.bottom === value.left
  );
};

type PaddingFieldRenderProps = FieldProps<PaddingField, PaddingValue> & {
  name: string;
};

const PaddingFieldRender = ({
  field,
  value,
  onChange,
  readOnly,
}: PaddingFieldRenderProps) => {
  const labels = usePaddingLabels();
  const current = value ?? {};
  const [showMore, setShowMore] = useState(() => !allSidesEqual(current));

  const handleAllChange = (raw: string) => {
    const parsed = +raw;

    onChange({
      top: parsed,
      right: parsed,
      bottom: parsed,
      left: parsed,
    });
  };

  const handleSideChange = (side: PaddingSide, raw: string) => {
    onChange({
      ...current,
      [side]: +raw,
    });
  };

  return (
    <FieldLabel
      label={field.label ?? 'Padding'}
      readOnly={readOnly}
    >
      {!showMore && (
        <input
          type="number"
          value={current.top ?? ''}
          disabled={readOnly}
          placeholder={labels.all}
          onChange={event => handleAllChange(event.currentTarget.value)}
        />
      )}

      {showMore &&
        paddingSides.map(side => (
          <FieldLabel
            key={side}
            label={labels[side]}
            readOnly={readOnly}
          >
            <input
              type="number"
              value={current[side] ?? ''}
              disabled={readOnly}
              onChange={event =>
                handleSideChange(side, event.currentTarget.value)
              }
            />
          </FieldLabel>
        ))}

      <label>
        <input
          type="checkbox"
          checked={showMore}
          disabled={readOnly}
          onChange={event => setShowMore(event.currentTarget.checked)}
        />
        {labels.moreOptions}
      </label>
    </FieldLabel>
  );
};

export const paddingPlugin: Plugin<UserFieldsConfig> = {
  name: 'padding',
  overrides: {
    fieldTypes: {
      padding: PaddingFieldRender,
    },
  },
};
