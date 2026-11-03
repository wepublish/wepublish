import { Tooltip } from '@mui/material';
import { FieldLabel, FieldProps } from '@puckeditor/core';
import {
  aspectRatioCss,
  aspectRatioPresets,
  AspectRatioPreset,
  objectFitValues,
  parseAspectRatio,
} from '@wepublish/puck-content/website';
import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IconType } from 'react-icons';
import {
  LuCrop,
  LuExpand,
  LuImage,
  LuMinimize2,
  LuShrink,
  LuSlidersHorizontal,
  LuSquareDashed,
} from 'react-icons/lu';

import { FieldInput, ToggleOption } from '../field-controls';
import { FieldToggleGroup } from '../field-controls.component';
import {
  AspectRatioField,
  AspectRatioValue,
  ObjectFitField,
  ObjectFitValue,
} from './image-fit.field';
import {
  FitHint,
  RatioCustomInputs,
  RatioOptionContent,
  RatioOptions,
  RatioPreview,
  RatioPreviewFrame,
} from './image-fit.styles';

const useRatioLabels = (): Record<AspectRatioPreset | 'custom', string> => {
  const { t } = useTranslation();

  return {
    auto: t('puck.imageFit.ratios.auto'),
    '1:1': t('puck.imageFit.ratios.square'),
    '4:3': t('puck.imageFit.ratios.landscape43'),
    '3:2': t('puck.imageFit.ratios.landscape32'),
    '16:9': t('puck.imageFit.ratios.widescreen'),
    '21:9': t('puck.imageFit.ratios.cinema'),
    '3:4': t('puck.imageFit.ratios.portrait34'),
    '2:3': t('puck.imageFit.ratios.portrait23'),
    '9:16': t('puck.imageFit.ratios.vertical'),
    custom: t('puck.imageFit.ratios.custom'),
  };
};

const isPreset = (value: string | undefined): value is AspectRatioPreset =>
  (aspectRatioPresets as readonly string[]).includes(value ?? '');

const toPositive = (raw: string) => {
  const parsed = Number(raw);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
};

export type AspectRatioFieldRenderProps = FieldProps<
  AspectRatioField,
  AspectRatioValue | undefined
> & {
  name?: string;
};

export const AspectRatioFieldRender = ({
  value,
  onChange,
  readOnly,
}: AspectRatioFieldRenderProps) => {
  const { t } = useTranslation();
  const labels = useRatioLabels();
  const name = useId();
  const current = value ?? 'auto';
  const [customOpen, setCustomOpen] = useState(() => !isPreset(current));
  const custom = customOpen || !isPreset(current);
  const [width, height] = parseAspectRatio(current) ?? [16, 9];
  const label = t('puck.imageFit.aspectRatio');

  const pick = (preset: AspectRatioPreset) => {
    setCustomOpen(false);
    onChange(preset);
  };

  const changeCustom = (nextWidth: number, nextHeight: number) =>
    onChange(`${nextWidth}:${nextHeight}`);

  const options: (AspectRatioPreset | 'custom')[] = [
    ...aspectRatioPresets,
    'custom',
  ];

  return (
    <FieldLabel
      label={label}
      readOnly={readOnly}
      el="div"
    >
      <RatioOptions
        role="radiogroup"
        aria-label={label}
      >
        {options.map(option => {
          const active =
            option === 'custom' ? custom : !custom && current === option;
          const ratio =
            option === 'custom' ? undefined : aspectRatioCss(option);
          const Icon: IconType | undefined =
            option === 'auto' ? LuImage
            : option === 'custom' ? LuSlidersHorizontal
            : undefined;

          return (
            <Tooltip
              key={option}
              title={labels[option]}
              disableInteractive
            >
              <ToggleOption
                active={active}
                disabled={!!readOnly}
              >
                <input
                  type="radio"
                  name={name}
                  value={option}
                  aria-label={labels[option]}
                  checked={active}
                  disabled={readOnly}
                  onChange={() =>
                    option === 'custom' ? setCustomOpen(true) : pick(option)
                  }
                />

                <RatioOptionContent aria-hidden>
                  <RatioPreviewFrame>
                    {Icon ?
                      <Icon size={18} />
                    : <RatioPreview ratio={ratio ?? '1 / 1'} />}
                  </RatioPreviewFrame>

                  {option !== 'auto' && option !== 'custom' && option}
                </RatioOptionContent>
              </ToggleOption>
            </Tooltip>
          );
        })}
      </RatioOptions>

      {custom && (
        <RatioCustomInputs>
          <FieldInput
            type="number"
            inputMode="decimal"
            min={0}
            step="any"
            aria-label={t('puck.imageFit.ratioWidth')}
            value={width}
            disabled={readOnly}
            onChange={event => {
              const next = toPositive(event.currentTarget.value);

              if (next) {
                changeCustom(next, height);
              }
            }}
          />
          :
          <FieldInput
            type="number"
            inputMode="decimal"
            min={0}
            step="any"
            aria-label={t('puck.imageFit.ratioHeight')}
            value={height}
            disabled={readOnly}
            onChange={event => {
              const next = toPositive(event.currentTarget.value);

              if (next) {
                changeCustom(width, next);
              }
            }}
          />
        </RatioCustomInputs>
      )}
    </FieldLabel>
  );
};

const objectFitIcons: Record<ObjectFitValue, IconType> = {
  cover: LuCrop,
  contain: LuShrink,
  fill: LuExpand,
  none: LuSquareDashed,
  'scale-down': LuMinimize2,
};

export type ObjectFitFieldRenderProps = FieldProps<
  ObjectFitField,
  ObjectFitValue | undefined
> & {
  name?: string;
};

export const ObjectFitFieldRender = ({
  value,
  onChange,
  readOnly,
}: ObjectFitFieldRenderProps) => {
  const { t } = useTranslation();
  const name = useId();
  const hintId = useId();
  const label = t('puck.imageFit.objectFit');
  const labels: Record<ObjectFitValue, string> = {
    cover: t('puck.imageFit.fits.cover'),
    contain: t('puck.imageFit.fits.contain'),
    fill: t('puck.imageFit.fits.fill'),
    none: t('puck.imageFit.fits.none'),
    'scale-down': t('puck.imageFit.fits.scaleDown'),
  };

  return (
    <FieldLabel
      label={label}
      readOnly={readOnly}
      el="div"
    >
      <FieldToggleGroup
        name={name}
        label={label}
        describedBy={hintId}
        readOnly={readOnly}
        value={value ?? 'cover'}
        onChange={next => onChange(next ?? 'cover')}
        options={objectFitValues.map(fit => {
          const Icon = objectFitIcons[fit];

          return { value: fit, label: labels[fit], icon: <Icon size={18} /> };
        })}
      />

      <FitHint id={hintId}>{t('puck.imageFit.fitHint')}</FitHint>
    </FieldLabel>
  );
};
