import { FieldProps } from '@puckeditor/core';
import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import {
  LuArrowDownToLine,
  LuArrowRightToLine,
  LuMoveHorizontal,
  LuMoveVertical,
} from 'react-icons/lu';

import { FieldNumberInput, ToggleableField } from '../field-controls.component';
import { FieldGrid, FieldStack } from '../field-controls';
import {
  defaultGridColumns,
  GridLine,
  gridLineRange,
  GridPlacementField,
  maxGridLineSpan,
  maxGridLineStart,
  setGridLine,
} from './grid-placement.field';
import {
  GridPlacementHint,
  GridPlacementPreview,
  GridPlacementPreviewCell,
} from './grid-placement.styles';

const startIcons = { column: LuArrowRightToLine, row: LuArrowDownToLine };
const spanIcons = { column: LuMoveHorizontal, row: LuMoveVertical };

export type GridPlacementFieldRenderProps = FieldProps<
  GridPlacementField,
  GridLine | undefined
> & {
  name: string;
};

export const GridPlacementFieldRender = ({
  field: { axis, columns = defaultGridColumns, ...field },
  value,
  onChange,
  readOnly,
}: GridPlacementFieldRenderProps) => {
  const { t } = useTranslation();
  const hintId = useId();
  const current = value ?? {};
  const range = gridLineRange(current);
  const isColumn = axis === 'column';

  const labels =
    isColumn ?
      {
        field: t('', 'Column placement'),
        start: t('', 'Start column'),
        span: t('', 'Column span'),
        unit: t('', 'cols'),
      }
    : {
        field: t('', 'Row placement'),
        start: t('', 'Start row'),
        span: t('', 'Row span'),
        unit: t('', 'rows'),
      };

  const hint = (() => {
    if (range && range.from === range.to) {
      return isColumn ?
          t('', 'Column {{line}}', { line: range.from })
        : t('', 'Row {{line}}', { line: range.from });
    }

    if (range) {
      return isColumn ?
          t('', 'Columns {{from}}–{{to}}', range)
        : t('', 'Rows {{from}}–{{to}}', range);
    }

    if (current.span) {
      return isColumn ?
          t('', 'Spans {{count}} columns, placed automatically', {
            count: current.span,
          })
        : t('', 'Spans {{count}} rows, placed automatically', {
            count: current.span,
          });
    }

    return t('', 'Placed automatically');
  })();

  const change = (key: keyof GridLine, amount: number | undefined) =>
    onChange(setGridLine(axis, current, key, amount, columns));

  const covers = (line: number) =>
    range ?
      line >= range.from && line <= range.to
    : line <= (current.span ?? 1);

  return (
    <ToggleableField
      label={field.label ?? labels.field}
      value={value}
      readOnly={readOnly}
      onChange={onChange}
    >
      <FieldStack>
        <FieldGrid columns={2}>
          <FieldNumberInput
            label={labels.start}
            icon={startIcons[axis]}
            value={current.start}
            min={1}
            max={maxGridLineStart(axis, columns)}
            unit=""
            placeholder={t('', 'auto')}
            describedBy={hintId}
            readOnly={readOnly}
            onChange={amount => change('start', amount)}
          />

          <FieldNumberInput
            label={labels.span}
            icon={spanIcons[axis]}
            value={current.span}
            min={1}
            max={maxGridLineSpan(axis, current, columns)}
            unit={labels.unit}
            placeholder="1"
            describedBy={hintId}
            readOnly={readOnly}
            onChange={amount => change('span', amount)}
          />
        </FieldGrid>

        {isColumn && (
          <GridPlacementPreview
            columns={columns}
            aria-hidden
          >
            {Array.from({ length: columns }, (_, index) => (
              <GridPlacementPreviewCell
                key={index}
                covered={covers(index + 1)}
                automatic={!range}
              />
            ))}
          </GridPlacementPreview>
        )}

        <GridPlacementHint id={hintId}>{hint}</GridPlacementHint>
      </FieldStack>
    </ToggleableField>
  );
};
