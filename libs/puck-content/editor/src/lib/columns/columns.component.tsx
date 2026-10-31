import { FieldLabel, FieldProps } from '@puckeditor/core';

import { ColumnsField, columnsPresets, ColumnsValue } from './columns.field';
import {
  ColumnsPresetButton,
  ColumnsPresetColumn,
  ColumnsPresetGrid,
  ColumnsPresetPercent,
} from './columns.styles';

const columnsEqual = (a: ColumnsValue, b: ColumnsValue) => {
  return a.length === b.length && a.every((value, index) => value === b[index]);
};

const formatPercent = (column: number, total: number) => {
  return `${Math.round((column / total) * 100)}%`;
};

export type ColumnsFieldRenderProps = FieldProps<ColumnsField, ColumnsValue> & {
  name: string;
};

export const ColumnsFieldRender = ({
  field,
  value,
  onChange,
  readOnly,
}: ColumnsFieldRenderProps) => {
  const current = value ?? [1];

  const presets = (
    <ColumnsPresetGrid>
      {columnsPresets.map((preset, index) => {
        const selected = columnsEqual(current, preset);
        const total = preset.reduce((sum, column) => sum + column, 0);
        const percents = preset.map(column => formatPercent(column, total));

        return (
          <ColumnsPresetButton
            key={index}
            type="button"
            aria-label={percents.join(' / ')}
            aria-pressed={selected}
            disabled={readOnly}
            onClick={() => onChange(preset)}
          >
            {preset.map((column, index) => (
              <ColumnsPresetColumn
                key={index}
                style={{ flex: column }}
              >
                {selected && (
                  <ColumnsPresetPercent>{percents[index]}</ColumnsPresetPercent>
                )}
              </ColumnsPresetColumn>
            ))}
          </ColumnsPresetButton>
        );
      })}
    </ColumnsPresetGrid>
  );

  if (!field.label) {
    return presets;
  }

  return (
    <FieldLabel
      label={field.label}
      readOnly={readOnly}
      el="div"
    >
      {presets}
    </FieldLabel>
  );
};
