import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IconType } from 'react-icons';
import {
  LuArrowDownToLine,
  LuArrowLeftToLine,
  LuArrowRightToLine,
  LuArrowUpToLine,
  LuMove,
  LuMoveHorizontal,
  LuMoveVertical,
  LuScan,
  LuSquare,
} from 'react-icons/lu';

import {
  FieldNumberInput,
  FieldSpacingInput,
  FieldToggleGroup,
} from '../field-controls.component';
import { SpacingValue } from '../spacing/spacing';
import { FieldGrid, FieldStack } from '../field-controls';
import {
  getSidesMode,
  setAllSides,
  setAxis,
  setSide,
  Side,
  sides,
  SidesMode,
  sidesModesFor,
  SidesValue,
  toSidesMode,
} from './sides';

const sideIcons = {
  top: LuArrowUpToLine,
  right: LuArrowRightToLine,
  bottom: LuArrowDownToLine,
  left: LuArrowLeftToLine,
};

const modeIcons = {
  all: <LuSquare size={16} />,
  axis: <LuMove size={16} />,
  individual: <LuScan size={16} />,
};

const useSidesLabels = () => {
  const { t } = useTranslation();

  return {
    modes: {
      all: t('', 'All sides'),
      axis: t('', 'Vertical and horizontal'),
      individual: t('', 'Individual sides'),
    } satisfies Record<SidesMode, string>,
    all: t('', 'All sides'),
    vertical: t('', 'Top and bottom'),
    horizontal: t('', 'Left and right'),
    sides: {
      top: t('', 'Top'),
      right: t('', 'Right'),
      bottom: t('', 'Bottom'),
      left: t('', 'Left'),
    } satisfies Record<Side, string>,
  };
};

export type SidesInputProps = {
  name: string;
  value: SidesValue | undefined;
  onChange: (value: SidesValue) => void;
  readOnly?: boolean;
  unit?: 'spacing' | 'px';
  allowed?: Side[];
};

type SideInputProps = {
  unit: 'spacing' | 'px';
  label: string;
  icon: IconType;
  value: SpacingValue | undefined;
  onChange: (value: SpacingValue | undefined) => void;
  readOnly?: boolean;
};

const SideInput = ({ unit, value, ...props }: SideInputProps) =>
  unit === 'px' ?
    <FieldNumberInput
      {...props}
      value={typeof value === 'number' ? value : undefined}
    />
  : <FieldSpacingInput
      {...props}
      value={value}
    />;

export const SidesInput = ({
  name,
  value,
  onChange,
  readOnly,
  unit = 'spacing',
  allowed = sides,
}: SidesInputProps) => {
  const labels = useSidesLabels();
  const current = value ?? {};
  const [mode, setMode] = useState(() => getSidesMode(value, allowed));
  const isVertical =
    allowed.length === 2 &&
    allowed.includes('top') &&
    allowed.includes('bottom');

  const changeMode = (next: SidesMode | undefined) => {
    if (!next) {
      return;
    }

    setMode(next);
    onChange(toSidesMode(current, next, allowed));
  };

  return (
    <FieldStack>
      <FieldToggleGroup
        name={`${name}-mode`}
        value={mode}
        readOnly={readOnly}
        onChange={changeMode}
        options={sidesModesFor(allowed).map(option => ({
          value: option,
          label: labels.modes[option],
          icon: modeIcons[option],
        }))}
      />

      {mode === 'all' && (
        <SideInput
          unit={unit}
          label={isVertical ? labels.vertical : labels.all}
          icon={isVertical ? LuMoveVertical : LuSquare}
          value={current[allowed[0]]}
          readOnly={readOnly}
          onChange={amount => onChange(setAllSides(amount, allowed))}
        />
      )}

      {mode === 'axis' && (
        <FieldGrid columns={2}>
          <SideInput
            unit={unit}
            label={labels.vertical}
            icon={LuMoveVertical}
            value={current.top}
            readOnly={readOnly}
            onChange={amount => onChange(setAxis(current, 'vertical', amount))}
          />

          <SideInput
            unit={unit}
            label={labels.horizontal}
            icon={LuMoveHorizontal}
            value={current.left}
            readOnly={readOnly}
            onChange={amount =>
              onChange(setAxis(current, 'horizontal', amount))
            }
          />
        </FieldGrid>
      )}

      {mode === 'individual' && (
        <FieldGrid columns={2}>
          {allowed.map(side => (
            <SideInput
              key={side}
              unit={unit}
              label={labels.sides[side]}
              icon={sideIcons[side]}
              value={current[side]}
              readOnly={readOnly}
              onChange={amount => onChange(setSide(current, side, amount))}
            />
          ))}
        </FieldGrid>
      )}
    </FieldStack>
  );
};
