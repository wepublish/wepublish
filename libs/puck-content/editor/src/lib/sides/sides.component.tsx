import { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  FieldToggleGroup,
} from '../field-controls.component';
import { FieldGrid, FieldStack } from '../field-controls';
import {
  getSidesMode,
  setAllSides,
  setAxis,
  setSide,
  Side,
  SidesMode,
  sidesModes,
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
};

export const SidesInput = ({
  name,
  value,
  onChange,
  readOnly,
}: SidesInputProps) => {
  const labels = useSidesLabels();
  const current = value ?? {};
  const [mode, setMode] = useState(() => getSidesMode(value));

  const changeMode = (next: SidesMode | undefined) => {
    if (!next) {
      return;
    }

    setMode(next);
    onChange(toSidesMode(current, next));
  };

  return (
    <FieldStack>
      <FieldToggleGroup
        name={`${name}-mode`}
        value={mode}
        readOnly={readOnly}
        onChange={changeMode}
        options={sidesModes.map(option => ({
          value: option,
          label: labels.modes[option],
          icon: modeIcons[option],
        }))}
      />

      {mode === 'all' && (
        <FieldNumberInput
          label={labels.all}
          icon={LuSquare}
          value={current.top}
          readOnly={readOnly}
          onChange={amount => onChange(setAllSides(amount))}
        />
      )}

      {mode === 'axis' && (
        <FieldGrid columns={2}>
          <FieldNumberInput
            label={labels.vertical}
            icon={LuMoveVertical}
            value={current.top}
            readOnly={readOnly}
            onChange={amount => onChange(setAxis(current, 'vertical', amount))}
          />

          <FieldNumberInput
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
          {(['top', 'right', 'bottom', 'left'] as const).map(side => (
            <FieldNumberInput
              key={side}
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
