import { FieldLabel, FieldProps } from '@puckeditor/core';

import {
  PaddingField,
  PaddingSide,
  paddingSides,
  PaddingValue,
} from './padding.field';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

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

export type PaddingFieldRenderProps = FieldProps<PaddingField, PaddingValue> & {
  name: string;
};

export const PaddingFieldRender = ({
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
      el="div"
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
            el="div"
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
