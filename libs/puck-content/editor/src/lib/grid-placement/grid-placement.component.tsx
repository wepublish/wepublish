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
        field: t('puck.gridPlacement.columnPlacement'),
        start: t('puck.gridPlacement.startColumn'),
        span: t('puck.gridPlacement.columnSpan'),
        unit: t('puck.gridPlacement.columnsUnit'),
      }
    : {
        field: t('puck.gridPlacement.rowPlacement'),
        start: t('puck.gridPlacement.startRow'),
        span: t('puck.gridPlacement.rowSpan'),
        unit: t('puck.gridPlacement.rowsUnit'),
      };

  const hint = (() => {
    if (range && range.from === range.to) {
      return isColumn ?
          t('puck.gridPlacement.columnLine', { line: range.from })
        : t('puck.gridPlacement.rowLine', { line: range.from });
    }

    if (range) {
      return isColumn ?
          t('puck.gridPlacement.columnsFromTo', range)
        : t('puck.gridPlacement.rowsFromTo', range);
    }

    if (current.span) {
      return isColumn ?
          t('puck.gridPlacement.spansColumns', {
            count: current.span,
          })
        : t('puck.gridPlacement.spansRows', {
            count: current.span,
          });
    }

    return t('puck.gridPlacement.placedAutomatically');
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
            placeholder={t('puck.gridPlacement.auto')}
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
