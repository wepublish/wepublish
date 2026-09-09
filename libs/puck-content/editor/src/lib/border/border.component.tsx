import { FieldLabel, FieldProps } from '@puckeditor/core';

import {
  BorderField,
  BorderSide,
  borderSides,
  BorderSideValue,
  BorderStyle,
  borderStyles,
  BorderValue,
} from './border.field';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

const useBorderLabels = () => {
  const { t } = useTranslation();

  return {
    all: t('', 'All sides'),
    top: t('', 'Top'),
    right: t('', 'Right'),
    bottom: t('', 'Bottom'),
    left: t('', 'Left'),
    width: t('', 'Width'),
    moreOptions: t('', 'More options'),
    solid: t('', 'Solid'),
    dashed: t('', 'Dashed'),
    dotted: t('', 'Dotted'),
  };
};

const sidesEqual = (a?: BorderSideValue, b?: BorderSideValue) => {
  return a?.width === b?.width && a?.style === b?.style;
};

const allSidesEqual = (value: BorderValue) => {
  return (
    sidesEqual(value.top, value.right) &&
    sidesEqual(value.right, value.bottom) &&
    sidesEqual(value.bottom, value.left)
  );
};

export type BorderFieldRenderProps = FieldProps<BorderField, BorderValue> & {
  name: string;
};

export const BorderFieldRender = ({
  field,
  value,
  onChange,
  readOnly,
}: BorderFieldRenderProps) => {
  const labels = useBorderLabels();
  const current = value ?? {};
  const [showMore, setShowMore] = useState(() => !allSidesEqual(current));

  const styleLabels: Record<BorderStyle, string> = {
    solid: labels.solid,
    dashed: labels.dashed,
    dotted: labels.dotted,
  };

  const applyToAll = (side: BorderSideValue) => {
    onChange({
      top: side,
      right: side,
      bottom: side,
      left: side,
    });
  };

  const handleAllWidthChange = (raw: string) => {
    applyToAll({ ...current.top, width: +raw });
  };

  const handleAllStyleChange = (style: BorderStyle) => {
    applyToAll({ ...current.top, style });
  };

  const handleSideWidthChange = (side: BorderSide, raw: string) => {
    onChange({
      ...current,
      [side]: { ...current[side], width: +raw },
    });
  };

  const handleSideStyleChange = (side: BorderSide, style: BorderStyle) => {
    onChange({
      ...current,
      [side]: { ...current[side], style },
    });
  };

  const renderStyleSelect = (
    sideValue: BorderSideValue | undefined,
    onStyleChange: (style: BorderStyle) => void
  ) => (
    <select
      value={sideValue?.style ?? 'solid'}
      disabled={readOnly}
      onChange={event =>
        onStyleChange(event.currentTarget.value as BorderStyle)
      }
    >
      {borderStyles.map(style => (
        <option
          key={style}
          value={style}
        >
          {styleLabels[style]}
        </option>
      ))}
    </select>
  );

  return (
    <FieldLabel
      label={field.label ?? 'Border'}
      readOnly={readOnly}
      el="div"
    >
      {!showMore && (
        <>
          <input
            type="number"
            value={current.top?.width ?? ''}
            disabled={readOnly}
            placeholder={labels.width}
            onChange={event => handleAllWidthChange(event.currentTarget.value)}
          />

          {renderStyleSelect(current.top, handleAllStyleChange)}
        </>
      )}

      {showMore &&
        borderSides.map(side => (
          <FieldLabel
            key={side}
            label={labels[side]}
            readOnly={readOnly}
            el="div"
          >
            <input
              type="number"
              value={current[side]?.width ?? ''}
              disabled={readOnly}
              placeholder={labels.width}
              onChange={event =>
                handleSideWidthChange(side, event.currentTarget.value)
              }
            />

            {renderStyleSelect(current[side], style =>
              handleSideStyleChange(side, style)
            )}
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
