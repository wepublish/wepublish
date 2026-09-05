import { BaseField, FieldLabel, FieldProps, Plugin } from '@puckeditor/core';
import { FieldAiParams } from '@puckeditor/plugin-ai';

import { UserFieldsConfig } from './fields';

export type ColumnsValue = number[];

export type ColumnsField = BaseField & {
  type: 'columns';
};

export const columnsPresets = [
  [1],
  [1, 1],
  [1, 1, 1],
  [1, 1, 1, 1],
  [1, 2],
  [2, 1],
  [1, 2, 1, 2],
  [2, 1, 2, 1],
] satisfies ColumnsValue[];

export const columnsFieldAi: FieldAiParams = {
  instructions: `Column layout as an array of fractional width units (CSS grid fr), one entry per column. [1, 1] is two equal columns, [1, 2] makes the second column twice as wide as the first. Prefer one of the presets: ${JSON.stringify(columnsPresets)}.`,
  schema: {
    type: 'array',
    items: {
      type: 'number',
      minimum: 1,
    },
    minItems: 1,
  },
};

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
    </FieldLabel>
  );
};

export const columnsPlugin: Plugin<UserFieldsConfig> = {
  name: 'columns',
  overrides: {
    fieldTypes: {
      columns: ColumnsFieldRender,
    },
  },
};
