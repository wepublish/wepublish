import { FieldLabel, FieldProps } from '@puckeditor/core';

import { ColumnsField, columnsPresets, ColumnsValue } from './columns.field';

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
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 16,
      }}
    >
      {columnsPresets.map((preset, index) => {
        const selected = columnsEqual(current, preset);
        const total = preset.reduce((sum, column) => sum + column, 0);

        return (
          <button
            key={index}
            type="button"
            disabled={readOnly}
            onClick={() => onChange(preset)}
            style={{
              display: 'flex',
              gap: 4,
              padding: selected ? 11 : 12,
              borderRadius: 8,
              border: selected ? '2px solid #1a1a1a' : '1px solid #e0e0e0',
              background: '#fff',
              cursor: readOnly ? 'default' : 'pointer',
            }}
          >
            {preset.map((column, index) => (
              <div
                key={index}
                css={{
                  flex: column,
                  height: 56,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 4,
                  border: '1px solid #e0e0e0',
                  background: selected ? '#fff' : '#f2f2f2',
                  color: '#333',
                  fontSize: 14,
                  fontWeight: 500,
                }}
              >
                {selected ? formatPercent(column, total) : null}
              </div>
            ))}
          </button>
        );
      })}
    </div>
  );

  // Without a label the presets are rendered bare, e.g. nested inside another
  // field that already provides the heading.
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
