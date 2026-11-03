import { Link, Slider, Tooltip } from '@mui/material';
import { ReactNode, useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IconType } from 'react-icons';
import { LuCircle } from 'react-icons/lu';

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
import { useFocusWithin } from '../focus-within';
import { FieldSelect, FieldToggleGroup } from '../field-controls.component';
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
  CornerShapeValue,
  cornerShapes,
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
  CornerActions,
  CornerCenter,
  CornerGrid,
  CornerPreview,
  CornerRoundToggle,
  CornerShapeIcon,
  CornerShapeNote,
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
    'left top': t('puck.styling.topLeft'),
    'center top': t('puck.styling.top'),
    'right top': t('puck.styling.topRight'),
    'left center': t('puck.styling.left'),
    'center center': t('puck.styling.center'),
    'right center': t('puck.styling.right'),
    'left bottom': t('puck.styling.bottomLeft'),
    'center bottom': t('puck.styling.bottom'),
    'right bottom': t('puck.styling.bottomRight'),
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
            t('puck.styling.noShadow')
          : t('puck.styling.elevationLevel', { level: step });

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
        aria-label={t('puck.styling.labelUnit', { label })}
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
        <option value="">{t('puck.styling.none')}</option>

        {maxWidthBreakpoints.map(breakpoint => (
          <option
            key={breakpoint}
            value={breakpoint}
          >
            {`${breakpoint.toUpperCase()} · ${theme.breakpoints.values[breakpoint]}px`}
          </option>
        ))}

        <option value={customMaxWidth}>{t('puck.styling.custom')}</option>
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

const fullyRoundedRadius = '9999px';

export const CornerRadiusInput = ({
  value,
  onChange,
  readOnly,
}: CornerRadiusInputProps) => {
  const { t } = useTranslation();
  const theme = useWebsiteTheme();
  const hintId = useId();
  const { focused, focusProps } = useFocusWithin();
  const [linked, setLinked] = useLinkedSpacingKeys(value, corners);

  const labels: Record<Corner, string> = {
    topLeft: t('puck.styling.topLeftRadius'),
    topRight: t('puck.styling.topRightRadius'),
    bottomRight: t('puck.styling.bottomRightRadius'),
    bottomLeft: t('puck.styling.bottomLeftRadius'),
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

  const rounded = corners.every(
    corner => value?.[corner] === fullyRoundedRadius
  );

  const toggleRounded = () => {
    setLinked(true);
    onChange(
      rounded ? {} : setSpacingKeys(undefined, corners, fullyRoundedRadius)
    );
  };

  const toggleLinked = () => {
    setLinked(!linked);

    if (!linked && !areSpacingKeysUniform(value, corners)) {
      onChange(linkSpacingKeys(value, corners));
    }
  };

  return (
    <StylingControlGroup {...focusProps}>
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
            label={t('puck.styling.linkCorners')}
            linked={linked}
            readOnly={readOnly}
            onToggle={toggleLinked}
          />
        </CornerCenter>
      </CornerGrid>

      <CornerActions>
        <CornerRoundToggle
          type="button"
          aria-pressed={rounded}
          disabled={readOnly}
          onClick={toggleRounded}
        >
          <LuCircle
            size={14}
            aria-hidden
          />
          {t('puck.styling.fullyRounded')}
        </CornerRoundToggle>
      </CornerActions>

      <BoxModelHint
        id={hintId}
        data-visible={focused}
      >
        {t('puck.styling.radiusHint', { radius: themeRadius })}
      </BoxModelHint>
    </StylingControlGroup>
  );
};

const cornerShapePaths = {
  round: 'M3 14V8A5 5 0 0 1 8 3H14',
  squircle: 'M3 14V8C3 4.2 4.2 3 8 3H14',
  bevel: 'M3 14V8L8 3H14',
  scoop: 'M3 14V8A5 5 0 0 0 8 3H14',
  notch: 'M3 14V8H8V3H14',
  square: 'M3 14V3H14',
} satisfies Record<CornerShapeValue, string>;

const defaultCornerShape: CornerShapeValue = 'round';

const cornerShapeSupportUrl = 'https://caniuse.com/wf-corner-shape';

export type CornerShapeInputProps = {
  name: string;
  label: string;
  value: CornerShapeValue | undefined;
  hasRadius: boolean;
  onChange: (value: CornerShapeValue | undefined) => void;
  readOnly?: boolean;
};

export const CornerShapeInput = ({
  name,
  label,
  value,
  hasRadius,
  onChange,
  readOnly,
}: CornerShapeInputProps) => {
  const { t } = useTranslation();
  const hintId = useId();
  const labels: Record<CornerShapeValue, string> = {
    round: t('puck.styling.roundDefault'),
    squircle: t('puck.styling.squircle'),
    bevel: t('puck.styling.bevel'),
    scoop: t('puck.styling.scoop'),
    notch: t('puck.styling.notch'),
    square: t('puck.styling.square'),
  };

  return (
    <StylingControlGroup>
      <FieldToggleGroup
        name={name}
        label={label}
        describedBy={hasRadius ? undefined : hintId}
        value={value ?? defaultCornerShape}
        readOnly={readOnly}
        onChange={shape =>
          onChange(shape === defaultCornerShape ? undefined : shape)
        }
        deselectable
        options={cornerShapes.map(shape => ({
          value: shape,
          label: labels[shape],
          icon: (
            <CornerShapeIcon
              viewBox="0 0 16 16"
              aria-hidden
            >
              <path d={cornerShapePaths[shape]} />
            </CornerShapeIcon>
          ),
        }))}
      />

      {!hasRadius && (
        <BoxModelHint id={hintId}>
          {t('puck.styling.cornerShapeNeedsRadius')}
        </BoxModelHint>
      )}

      <CornerShapeNote
        severity="info"
        variant="outlined"
        role="note"
      >
        {t('puck.styling.cornerShapeSupport')}{' '}
        <Link
          href={cornerShapeSupportUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          {t('puck.styling.browserSupport')}
        </Link>
      </CornerShapeNote>
    </StylingControlGroup>
  );
};
