import { BaseField, FieldLabel, FieldProps, Plugin } from '@puckeditor/core';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { UserConfig } from '../types';

export type BorderSide = 'top' | 'right' | 'bottom' | 'left';
export const borderSides = ['top', 'right', 'bottom', 'left'] as BorderSide[];

export type BorderStyle = 'solid' | 'dashed' | 'dotted';
export const borderStyles = ['solid', 'dashed', 'dotted'] as BorderStyle[];

export type BorderSideValue = {
  width?: number;
  style?: BorderStyle;
};

export type BorderValue = {
  top?: BorderSideValue;
  right?: BorderSideValue;
  bottom?: BorderSideValue;
  left?: BorderSideValue;
};

export type BorderField = BaseField & {
  type: 'border';
};

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

type BorderFieldRenderProps = FieldProps<BorderField, BorderValue> & {
  name: string;
};

const BorderFieldRender = ({
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

export const borderPlugin: Plugin<UserConfig> = {
  name: 'border',
  overrides: {
    fieldTypes: {
      border: BorderFieldRender,
    },
  },
};
