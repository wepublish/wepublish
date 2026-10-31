import { Slider, Tooltip } from '@mui/material';
import { ReactNode, useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IconType } from 'react-icons';

import {
  areSpacingKeysUniform,
  linkSpacingKeys,
  setSpacingKeys,
} from '../box-model/box-model';
import {
  SpacingLinkButton,
  SpacingTextInput,
} from '../box-model/box-model.component';
import { useLinkedSpacingKeys } from '../box-model/box-model.hooks';
import { BoxModelHint } from '../box-model/box-model.styles';
import { FieldSelect } from '../field-controls.component';
import {
  FieldInput,
  NumberInputWrapper,
  ToggleOption,
  UnitSelect,
} from '../field-controls';
import { SpacingValue } from '../spacing/spacing';
import { useWebsiteTheme } from '../website-theme';
import {
  BackgroundPositionValue,
  backgroundPositionValues,
  Corner,
  corners,
  fromLengthParts,
  isLengthValue,
  LengthUnit,
  LengthValue,
  MaxWidthUnit,
  MaxWidthValue,
  maxWidthBreakpoints,
  maxWidthUnits,
  RadiusValue,
  radiusToCss,
  shadowSteps,
  toLengthParts,
} from './styling.field';
import {
  CornerCell,
  CornerCenter,
  CornerGrid,
  CornerPreview,
  PercentSliderRow,
  PercentSliderValue,
  PositionDot,
  PositionGrid,
  ShadowCaption,
  ShadowGrid,
  ShadowSample,
  ShadowTile,
  ShadowWell,
  StylingControlGroup,
} from './styling-controls.styles';

export type StylingToggleGroupProps = {
  label: string;
  children: ReactNode;
};

export const StylingToggleGroup = ({
  label,
  children,
}: StylingToggleGroupProps) => (
  <div
    role="group"
    aria-label={label}
  >
    {children}
  </div>
);

const useBackgroundPositionLabels = (): Record<
  BackgroundPositionValue,
  string
> => {
  const { t } = useTranslation();

  return {
    'left top': t('', 'Top left'),
    'center top': t('', 'Top'),
    'right top': t('', 'Top right'),
    'left center': t('', 'Left'),
    'center center': t('', 'Centre'),
    'right center': t('', 'Right'),
    'left bottom': t('', 'Bottom left'),
    'center bottom': t('', 'Bottom'),
    'right bottom': t('', 'Bottom right'),
  };
};

export type BackgroundPositionInputProps = {
  name: string;
  label: string;
  value: BackgroundPositionValue;
  onChange: (value: BackgroundPositionValue) => void;
  readOnly?: boolean;
};

export const BackgroundPositionInput = ({
  name,
  label,
  value,
  onChange,
  readOnly,
}: BackgroundPositionInputProps) => {
  const labels = useBackgroundPositionLabels();

  return (
    <PositionGrid
      role="radiogroup"
      aria-label={label}
    >
      {backgroundPositionValues.map(position => {
        const active = value === position;

        return (
          <Tooltip
            key={position}
            title={labels[position]}
            disableInteractive
          >
            <ToggleOption
              active={active}
              disabled={!!readOnly}
            >
              <input
                type="radio"
                name={name}
                value={position}
                aria-label={labels[position]}
                checked={active}
                disabled={readOnly}
                onChange={() => onChange(position)}
              />

              <PositionDot
                filled={active}
                aria-hidden
              />
            </ToggleOption>
          </Tooltip>
        );
      })}
    </PositionGrid>
  );
};

export type ShadowInputProps = {
  name: string;
  label: string;
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  readOnly?: boolean;
};

export const ShadowInput = ({
  name,
  label,
  value,
  onChange,
  readOnly,
}: ShadowInputProps) => {
  const { t } = useTranslation();
  const theme = useWebsiteTheme();
  const steps =
    value === undefined || shadowSteps.includes(value) ?
      shadowSteps
    : [...shadowSteps, value].sort((a, b) => a - b);

  return (
    <ShadowGrid
      role="radiogroup"
      aria-label={label}
    >
      {steps.map(step => {
        const active = value === step;
        const stepLabel =
          step === 0 ?
            t('', 'No shadow')
          : t('', 'Elevation {{level}}', { level: step });

        return (
          <Tooltip
            key={step}
            title={stepLabel}
            disableInteractive
          >
            <ToggleOption
              active={active}
              disabled={!!readOnly}
            >
              <input
                type="radio"
                name={name}
                value={step}
                aria-label={stepLabel}
                checked={active}
                disabled={readOnly}
                onChange={() => onChange(step)}
                onClick={() => active && onChange(undefined)}
              />

              <ShadowTile aria-hidden>
                <ShadowWell surface={theme.palette.background.default}>
                  <ShadowSample
                    shadow={theme.shadows[step] ?? 'none'}
                    surface={theme.palette.background.paper}
                  />
                </ShadowWell>
                <ShadowCaption>{step}</ShadowCaption>
              </ShadowTile>
            </ToggleOption>
          </Tooltip>
        );
      })}
    </ShadowGrid>
  );
};

export type PercentSliderProps = {
  label: string;
  value: number | undefined;
  defaultValue: number;
  onChange: (value: number) => void;
  readOnly?: boolean;
};

export const PercentSlider = ({
  label,
  value,
  defaultValue,
  onChange,
  readOnly,
}: PercentSliderProps) => {
  const current = value ?? defaultValue;

  return (
    <PercentSliderRow>
      <Slider
        size="small"
        min={0}
        max={100}
        value={current}
        disabled={readOnly}
        aria-label={label}
        getAriaValueText={percent => `${percent}%`}
        valueLabelDisplay="auto"
        valueLabelFormat={percent => `${percent}%`}
        onChange={(_event, next) =>
          onChange(typeof next === 'number' ? next : current)
        }
      />

      <PercentSliderValue aria-hidden>{current}%</PercentSliderValue>
    </PercentSliderRow>
  );
};

const toAmount = (raw: string) => {
  if (raw.trim() === '') {
    return undefined;
  }

  const amount = Number(raw);

  return Number.isNaN(amount) ? undefined : Math.max(0, amount);
};

export type LengthInputProps<Unit extends LengthUnit> = {
  label: string;
  icon: IconType;
  units: Unit[];
  value: LengthValue<Unit> | undefined;
  onChange: (value: LengthValue<Unit> | undefined) => void;
  readOnly?: boolean;
};

export const LengthInput = <Unit extends LengthUnit>({
  label,
  icon: Icon,
  units,
  value,
  onChange,
  readOnly,
}: LengthInputProps<Unit>) => {
  const { t } = useTranslation();
  const parts = toLengthParts(value, units);
  const [pendingUnit, setPendingUnit] = useState<Unit>();
  const unit = parts?.unit ?? pendingUnit ?? units[0];

  const changeUnit = (raw: string) => {
    const next = units.find(candidate => candidate === raw);

    if (!next) {
      return;
    }

    setPendingUnit(next);

    if (parts) {
      onChange(fromLengthParts(parts.amount, next));
    }
  };

  return (
    <NumberInputWrapper>
      <Icon aria-hidden />

      <FieldInput
        type="number"
        inputMode="decimal"
        min={0}
        aria-label={label}
        value={parts?.amount ?? ''}
        disabled={readOnly}
        onChange={event =>
          onChange(fromLengthParts(toAmount(event.currentTarget.value), unit))
        }
      />

      <UnitSelect
        aria-label={t('', '{{label}} unit', { label })}
        value={unit}
        disabled={readOnly}
        onChange={event => changeUnit(event.currentTarget.value)}
      >
        {units.map(option => (
          <option
            key={option}
            value={option}
          >
            {option}
          </option>
        ))}
      </UnitSelect>
    </NumberInputWrapper>
  );
};

const customMaxWidth = 'custom';
const defaultCustomMaxWidth: LengthValue<'%'> = '100%';

export type MaxWidthInputProps = {
  label: string;
  customLabel: string;
  icon: IconType;
  value: MaxWidthValue | undefined;
  onChange: (value: MaxWidthValue | undefined) => void;
  readOnly?: boolean;
};

export const MaxWidthInput = ({
  label,
  customLabel,
  icon,
  value,
  onChange,
  readOnly,
}: MaxWidthInputProps) => {
  const { t } = useTranslation();
  const theme = useWebsiteTheme();
  const [customChosen, setCustomChosen] = useState(false);
  const custom = isLengthValue(value, maxWidthUnits) ? value : undefined;
  const selected =
    custom || (customChosen && !value) ? customMaxWidth : (value ?? '');

  const select = (raw: string) => {
    setCustomChosen(raw === customMaxWidth);

    if (raw === customMaxWidth) {
      onChange(custom ?? defaultCustomMaxWidth);
      return;
    }

    onChange(maxWidthBreakpoints.find(breakpoint => breakpoint === raw));
  };

  return (
    <StylingControlGroup>
      <FieldSelect
        aria-label={label}
        value={selected}
        disabled={readOnly}
        onChange={event => select(event.currentTarget.value)}
      >
        <option value="">{t('', 'None')}</option>

        {maxWidthBreakpoints.map(breakpoint => (
          <option
            key={breakpoint}
            value={breakpoint}
          >
            {`${breakpoint.toUpperCase()} · ${theme.breakpoints.values[breakpoint]}px`}
          </option>
        ))}

        <option value={customMaxWidth}>{t('', 'Custom')}</option>
      </FieldSelect>

      {selected === customMaxWidth && (
        <LengthInput<MaxWidthUnit>
          label={customLabel}
          icon={icon}
          units={maxWidthUnits}
          value={custom}
          readOnly={readOnly}
          onChange={onChange}
        />
      )}
    </StylingControlGroup>
  );
};

export type CornerRadiusInputProps = {
  value: RadiusValue | undefined;
  onChange: (value: RadiusValue) => void;
  readOnly?: boolean;
};

export const CornerRadiusInput = ({
  value,
  onChange,
  readOnly,
}: CornerRadiusInputProps) => {
  const { t } = useTranslation();
  const theme = useWebsiteTheme();
  const hintId = useId();
  const [linked, setLinked] = useLinkedSpacingKeys(value, corners);

  const labels: Record<Corner, string> = {
    topLeft: t('', 'Top left radius'),
    topRight: t('', 'Top right radius'),
    bottomRight: t('', 'Bottom right radius'),
    bottomLeft: t('', 'Bottom left radius'),
  };
  const themeRadius =
    typeof theme.shape.borderRadius === 'number' ?
      `${theme.shape.borderRadius}px`
    : theme.shape.borderRadius;
  const radii: Partial<Record<Corner, string>> = {};

  for (const corner of corners) {
    radii[corner] = radiusToCss(theme, value?.[corner]);
  }

  const changeCorner = (corner: Corner, amount: SpacingValue | undefined) =>
    onChange(setSpacingKeys(value, linked ? corners : [corner], amount));

  const toggleLinked = () => {
    setLinked(!linked);

    if (!linked && !areSpacingKeysUniform(value, corners)) {
      onChange(linkSpacingKeys(value, corners));
    }
  };

  return (
    <StylingControlGroup>
      <CornerGrid>
        {corners.map(corner => (
          <CornerCell
            key={corner}
            gridArea={corner}
          >
            <SpacingTextInput
              label={labels[corner]}
              value={value?.[corner]}
              readOnly={readOnly}
              describedBy={hintId}
              onChange={amount => changeCorner(corner, amount)}
            />
          </CornerCell>
        ))}

        <CornerCenter>
          <CornerPreview
            radii={radii}
            aria-hidden
          />

          <SpacingLinkButton
            label={t('', 'Link corners')}
            linked={linked}
            readOnly={readOnly}
            onToggle={toggleLinked}
          />
        </CornerCenter>
      </CornerGrid>

      <BoxModelHint id={hintId}>
        {t(
          '',
          'Numbers are multiples of the theme radius ({{radius}}), add px for exact pixels.',
          { radius: themeRadius }
        )}
      </BoxModelHint>
    </StylingControlGroup>
  );
};
