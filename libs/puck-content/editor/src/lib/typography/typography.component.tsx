import { useQuery } from '@apollo/client/react';
import { CSSObject } from '@emotion/react';
import styled from '@emotion/styled';
import { TypographyStyle } from '@mui/material/styles';
import { FieldLabel, FieldProps } from '@puckeditor/core';
import { FontWeight, WebsiteSettingsDocument } from '@wepublish/editor/api';

import { FieldSelect } from '../field-controls.component';
import { FieldInput } from '../field-controls';
import { useWebsiteTheme } from '../website-theme';
import {
  customTypographyVariant,
  fontWeights,
  getThemeTypographyVariants,
  resolveTypography,
  TypographyField,
  TypographyValue,
} from './typography.field';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

const fontWeightToNumber: Record<
  Exclude<FontWeight, FontWeight.Variable>,
  number
> = {
  [FontWeight.Thin]: 100,
  [FontWeight.ExtraLight]: 200,
  [FontWeight.Light]: 300,
  [FontWeight.Regular]: 400,
  [FontWeight.Medium]: 500,
  [FontWeight.SemiBold]: 600,
  [FontWeight.Bold]: 700,
  [FontWeight.ExtraBold]: 800,
  [FontWeight.Black]: 900,
};

const useTypographyLabels = () => {
  const { t } = useTranslation();

  return {
    typography: t('', 'Typography'),
    themeDefault: t('', 'Theme default'),
    custom: t('', 'Custom'),
    fontSize: t('', 'Font Size'),
    lineHeight: t('', 'Line Height'),
    fontFamily: t('', 'Font Family'),
    fontWeight: t('', 'Font Weight'),
    weights: {
      100: t('', 'Thin'),
      200: t('', 'Extra light'),
      300: t('', 'Light'),
      400: t('', 'Regular'),
      500: t('', 'Medium'),
      600: t('', 'Semi bold'),
      700: t('', 'Bold'),
      800: t('', 'Extra bold'),
      900: t('', 'Black'),
    } as Record<number, string>,
    fontSizePlaceholder: t('', 'e.g. 1.25rem'),
    lineHeightPlaceholder: t('', 'e.g. 1.4'),
  };
};

type WebsiteFont = {
  name: string;
  /** Numeric weights the font is loaded in, all of them for variable fonts */
  weights: number[];
};

const useWebsiteFonts = (): WebsiteFont[] => {
  const { data } = useQuery(WebsiteSettingsDocument);

  return useMemo(
    () =>
      (data?.websiteSettings.fonts ?? [])
        .filter(font => !!font.name)
        .map(font => ({
          name: font.name,
          weights:
            font.weight.includes(FontWeight.Variable) || !font.weight.length ?
              fontWeights
            : fontWeights.filter(weight =>
                font.weight.some(
                  fontWeight =>
                    fontWeightToNumber[
                      fontWeight as Exclude<FontWeight, FontWeight.Variable>
                    ] === weight
                )
              ),
        })),
    [data]
  );
};

const Fields = styled.div`
  display: grid;
  gap: 8px;
`;

const Preview = styled.div<{ font: TypographyStyle | undefined }>`
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  ${({ font }) => (font ?? {}) as CSSObject}
`;

export type TypographyFieldRenderProps = FieldProps<
  TypographyField,
  TypographyValue | undefined
> & {
  name: string;
};

export const TypographyFieldRender = ({
  field,
  value,
  onChange,
  readOnly,
}: TypographyFieldRenderProps) => {
  const labels = useTypographyLabels();
  const theme = useWebsiteTheme();
  const fonts = useWebsiteFonts();
  const variants = field.variants ?? getThemeTypographyVariants(theme);
  const current = value ?? {};
  const isCustom = current.variant === customTypographyVariant;
  const selectedFont = fonts.find(font => font.name === current.fontFamily);
  // Only offer weights the selected font is actually loaded in
  const weights = selectedFont?.weights ?? fontWeights;

  const handleVariantChange = (variant: string) => {
    if (!variant) {
      onChange(undefined);
      return;
    }

    if (variant === customTypographyVariant) {
      onChange({ ...current, variant });
      return;
    }

    onChange({ variant });
  };

  const handleCustomChange = (key: 'fontSize' | 'lineHeight', raw: string) => {
    onChange({
      ...current,
      variant: customTypographyVariant,
      [key]: raw || undefined,
    });
  };

  const handleFontFamilyChange = (raw: string) => {
    const nextWeights =
      fonts.find(font => font.name === raw)?.weights ?? fontWeights;

    onChange({
      ...current,
      variant: customTypographyVariant,
      fontFamily: raw || undefined,
      // Drop a weight the newly selected font is not loaded in
      fontWeight:
        current.fontWeight && nextWeights.includes(current.fontWeight) ?
          current.fontWeight
        : undefined,
    });
  };

  const handleFontWeightChange = (raw: string) => {
    onChange({
      ...current,
      variant: customTypographyVariant,
      fontWeight: raw ? +raw : undefined,
    });
  };

  return (
    <FieldLabel
      label={field.label ?? labels.typography}
      readOnly={readOnly}
      el="div"
    >
      <Fields>
        <FieldSelect
          value={current.variant ?? ''}
          disabled={readOnly}
          onChange={event => handleVariantChange(event.currentTarget.value)}
        >
          <option value="">{labels.themeDefault}</option>

          {variants.map(variant => (
            <option
              key={variant}
              value={variant}
            >
              {variant}
            </option>
          ))}

          <option value={customTypographyVariant}>{labels.custom}</option>
        </FieldSelect>

        {isCustom && (
          <>
            <FieldLabel
              label={labels.fontFamily}
              readOnly={readOnly}
              el="div"
            >
              <FieldSelect
                value={current.fontFamily ?? ''}
                disabled={readOnly}
                onChange={event =>
                  handleFontFamilyChange(event.currentTarget.value)
                }
              >
                <option value="">{labels.themeDefault}</option>

                {fonts.map(font => (
                  <option
                    key={font.name}
                    value={font.name}
                  >
                    {font.name}
                  </option>
                ))}
              </FieldSelect>
            </FieldLabel>

            <FieldLabel
              label={labels.fontWeight}
              readOnly={readOnly}
              el="div"
            >
              <FieldSelect
                value={current.fontWeight ?? ''}
                disabled={readOnly}
                onChange={event =>
                  handleFontWeightChange(event.currentTarget.value)
                }
              >
                <option value="">{labels.themeDefault}</option>

                {weights.map(weight => (
                  <option
                    key={weight}
                    value={weight}
                  >
                    {weight} · {labels.weights[weight]}
                  </option>
                ))}
              </FieldSelect>
            </FieldLabel>

            <FieldLabel
              label={labels.fontSize}
              readOnly={readOnly}
              el="div"
            >
              <FieldInput
                type="text"
                value={current.fontSize ?? ''}
                disabled={readOnly}
                placeholder={labels.fontSizePlaceholder}
                onChange={event =>
                  handleCustomChange('fontSize', event.currentTarget.value)
                }
              />
            </FieldLabel>

            <FieldLabel
              label={labels.lineHeight}
              readOnly={readOnly}
              el="div"
            >
              <FieldInput
                type="text"
                value={current.lineHeight ?? ''}
                disabled={readOnly}
                placeholder={labels.lineHeightPlaceholder}
                onChange={event =>
                  handleCustomChange('lineHeight', event.currentTarget.value)
                }
              />
            </FieldLabel>
          </>
        )}

        {!!current.variant && (
          <Preview font={resolveTypography(theme, current)}>
            The quick brown fox jumps over the lazy dog
          </Preview>
        )}
      </Fields>
    </FieldLabel>
  );
};
