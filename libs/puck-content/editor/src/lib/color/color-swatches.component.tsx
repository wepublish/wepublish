import { Tooltip } from '@mui/material';
import { CSSProperties, Fragment, KeyboardEvent, useRef } from 'react';
import { LuCheck } from 'react-icons/lu';

import { useWebsiteTheme } from '../website-theme';
import {
  ColorSwatchButton,
  ColorSwatchChip,
  ColorSwatchLabelledRow,
  ColorSwatchList,
  ColorSwatchPreview,
  ColorSwatchPreviewSmall,
  ColorSwatchRowLabel,
  ColorSwatchRows,
  ColorSwatchTooltipTitle,
} from './color-swatches.styles';
import { isLightColor } from './color.field';

export type ColorSwatchOption<Value extends string> = {
  value: Value;
  label: string;
  color: string | undefined;
  detail?: string;
  showLabel?: boolean;
};

export type ColorSwatchRow<Value extends string> = {
  key: string;
  label?: string;
  options: ColorSwatchOption<Value>[];
};

export type ColorSwatchRadioGroupProps<Value extends string> = {
  label: string;
  rows: ColorSwatchRow<Value>[];
  value: Value | undefined;
  onChange: (value: Value) => void;
  onPick?: (value: Value) => void;
  readOnly?: boolean;
  autoFocus?: boolean;
};

export const ColorSwatch = ({
  color,
  small,
}: {
  color: string | undefined;
  small?: boolean;
}) => {
  const Preview = small ? ColorSwatchPreviewSmall : ColorSwatchPreview;

  return (
    <Preview
      aria-hidden="true"
      data-empty={!color}
      style={{ '--swatch-color': color } as CSSProperties}
    />
  );
};

const nextIndexForKey = (
  key: string,
  index: number,
  positions: Array<{ rowIndex: number; column: number }>,
  rowStarts: number[],
  rowSizes: number[]
) => {
  const count = positions.length;
  const { rowIndex, column } = positions[index];
  const moveRow = (offset: number) => {
    if (rowSizes.length === 1) {
      return (index + offset + count) % count;
    }

    const nextRow = (rowIndex + offset + rowSizes.length) % rowSizes.length;

    return rowStarts[nextRow] + Math.min(column, rowSizes[nextRow] - 1);
  };

  switch (key) {
    case 'ArrowRight':
      return (index + 1) % count;
    case 'ArrowLeft':
      return (index - 1 + count) % count;
    case 'ArrowDown':
      return moveRow(1);
    case 'ArrowUp':
      return moveRow(-1);
    case 'Home':
      return 0;
    case 'End':
      return count - 1;
    default:
      return undefined;
  }
};

export const ColorSwatchRadioGroup = <Value extends string>({
  label,
  rows,
  value,
  onChange,
  onPick,
  readOnly,
  autoFocus,
}: ColorSwatchRadioGroupProps<Value>) => {
  const theme = useWebsiteTheme();
  const buttons = useRef<Array<HTMLButtonElement | null>>([]);
  const visibleRows = rows.filter(row => row.options.length);
  const rowSizes = visibleRows.map(row => row.options.length);
  const rowStarts = rowSizes.map((_, rowIndex) =>
    rowSizes.slice(0, rowIndex).reduce((sum, size) => sum + size, 0)
  );
  const positions = visibleRows.flatMap((row, rowIndex) =>
    row.options.map((option, column) => ({ option, rowIndex, column }))
  );
  const checkedIndex = positions.findIndex(
    ({ option }) => option.value === value
  );
  const tabStop = Math.max(checkedIndex, 0);

  const select = (index: number) => {
    const target = positions[index];

    buttons.current[index]?.focus();

    if (!readOnly && target && target.option.value !== value) {
      onChange(target.option.value);
    }
  };

  const handleKeyDown =
    (index: number) => (event: KeyboardEvent<HTMLButtonElement>) => {
      const next = nextIndexForKey(
        event.key,
        index,
        positions,
        rowStarts,
        rowSizes
      );

      if (next === undefined) {
        return;
      }

      event.preventDefault();
      select(next);
    };

  const handleClick = (option: ColorSwatchOption<Value>) => () => {
    if (readOnly) {
      return;
    }

    if (option.value !== value) {
      onChange(option.value);
    }

    onPick?.(option.value);
  };

  const checkColorFor = (color: string | undefined) => {
    const light = color ? isLightColor(color) : undefined;

    if (light === undefined) {
      return undefined;
    }

    return light ? theme.palette?.common.black : theme.palette?.common.white;
  };

  return (
    <ColorSwatchRows
      role="radiogroup"
      aria-label={label}
      aria-disabled={readOnly || undefined}
    >
      {visibleRows.map((row, rowIndex) => {
        const list = (
          <ColorSwatchList>
            {row.options.map((option, column) => {
              const index = rowStarts[rowIndex] + column;
              const checked = index === checkedIndex;
              const radioProps = {
                type: 'button' as const,
                role: 'radio',
                'aria-checked': checked,
                'aria-disabled': readOnly || undefined,
                tabIndex: index === tabStop ? 0 : -1,
                autoFocus: autoFocus && index === tabStop,
                onClick: handleClick(option),
                onKeyDown: handleKeyDown(index),
              };

              if (option.showLabel) {
                return (
                  <ColorSwatchChip
                    key={option.value}
                    ref={element => {
                      buttons.current[index] = element;
                    }}
                    {...radioProps}
                  >
                    <ColorSwatch
                      color={option.color}
                      small
                    />
                    {option.label}
                    {checked && <LuCheck aria-hidden="true" />}
                  </ColorSwatchChip>
                );
              }

              return (
                <Tooltip
                  key={option.value}
                  describeChild
                  disableInteractive
                  placement="top"
                  title={
                    <ColorSwatchTooltipTitle>
                      <span>{option.label}</span>
                      {option.detail && <span>{option.detail}</span>}
                    </ColorSwatchTooltipTitle>
                  }
                >
                  <ColorSwatchButton
                    ref={element => {
                      buttons.current[index] = element;
                    }}
                    {...radioProps}
                    aria-label={option.label}
                    data-empty={!option.color}
                    style={
                      {
                        '--swatch-color': option.color,
                        '--swatch-check-color': checkColorFor(option.color),
                      } as CSSProperties
                    }
                  >
                    {checked && <LuCheck aria-hidden="true" />}
                  </ColorSwatchButton>
                </Tooltip>
              );
            })}
          </ColorSwatchList>
        );

        return row.label ?
            <ColorSwatchLabelledRow key={row.key}>
              <ColorSwatchRowLabel aria-hidden="true">
                {row.label}
              </ColorSwatchRowLabel>
              {list}
            </ColorSwatchLabelledRow>
          : <Fragment key={row.key}>{list}</Fragment>;
      })}
    </ColorSwatchRows>
  );
};
