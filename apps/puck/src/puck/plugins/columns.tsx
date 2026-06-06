import { BaseField, FieldLabel, FieldProps, Plugin } from '@puckeditor/core';

import { UserConfig } from '../types';

export type ColumnsValue = number[];

export type ColumnsField = BaseField & {
  type: 'columns';
};

type ColumnsPreset = {
  columns: ColumnsValue;
};

export const columnsPresets = [
  { columns: [1] },
  { columns: [1, 1] },
  { columns: [1, 1, 1] },
  { columns: [1, 1, 1, 1] },
  { columns: [1, 2] },
  { columns: [2, 1] },
  { columns: [1, 2, 1, 2] },
  { columns: [2, 1, 2, 1] },
] satisfies ColumnsPreset[];

const columnsEqual = (a: ColumnsValue, b: ColumnsValue) => {
  return a.length === b.length && a.every((value, index) => value === b[index]);
};

const formatPercent = (column: number, total: number) => {
  return `${Math.round((column / total) * 100)}%`;
};

type ColumnsFieldRenderProps = FieldProps<ColumnsField, ColumnsValue> & {
  name: string;
};

const ColumnsFieldRender = ({
  field,
  value,
  onChange,
  readOnly,
}: ColumnsFieldRenderProps) => {
  const current = value ?? [1];

  return (
    <FieldLabel
      label={field.label ?? 'Columns'}
      readOnly={readOnly}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 16,
        }}
      >
        {columnsPresets.map((preset, index) => {
          const selected = columnsEqual(current, preset.columns);
          const total = preset.columns.reduce((sum, column) => sum + column, 0);

          return (
            <button
              key={index}
              type="button"
              disabled={readOnly}
              onClick={() => onChange(preset.columns)}
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
              {preset.columns.map((column, index) => (
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
    </FieldLabel>
  );
};

export const columnsPlugin: Plugin<UserConfig> = {
  name: 'columns',
  overrides: {
    fieldTypes: {
      columns: ColumnsFieldRender,
    },
  },
};
