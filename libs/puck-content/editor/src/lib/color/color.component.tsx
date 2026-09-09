import { useTheme } from '@emotion/react';
import styled from '@emotion/styled';
import { FieldLabel, FieldProps } from '@puckeditor/core';

import { ColorPicker } from './color-picker';
import {
  ColorField,
  ColorValue,
  customColor,
  isThemeColor,
  resolveColor,
  ThemeColorGroups,
  themeColorGroups,
  themeColors,
  ThemeColorValue,
} from './color.field';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

const useColorLabels = () => {
  const { t } = useTranslation();

  return {
    color: t('', 'Color'),
    themeDefault: t('', 'Theme default'),
    custom: t('', 'Custom'),
    groups: {
      primary: t('', 'Primary'),
      secondary: t('', 'Secondary'),
      accent: t('', 'Accent'),
      success: t('', 'Success'),
      error: t('', 'Error'),
      info: t('', 'Info'),
      warning: t('', 'Warning'),
      text: t('', 'Text'),
      background: t('', 'Background'),
      common: t('', 'Common'),
    } satisfies Record<keyof ThemeColorGroups, string>,
    shades: {
      main: t('', 'Main'),
      light: t('', 'Light'),
      dark: t('', 'Dark'),
      contrastText: t('', 'Contrast text'),
      primary: t('', 'Primary'),
      secondary: t('', 'Secondary'),
      disabled: t('', 'Disabled'),
      default: t('', 'Default'),
      paper: t('', 'Paper'),
      black: t('', 'Black'),
      white: t('', 'White'),
    } as Record<string, string>,
  };
};

const Fields = styled.div`
  display: grid;
  gap: 8px;
`;

const Selection = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;

  select {
    flex: 1;
    min-width: 0;
  }
`;

const Swatch = styled.div<{ color?: string }>`
  flex-shrink: 0;
  width: 25px;
  height: 25px;
  border-radius: 3px;
  border: 1px solid ${({ theme }) => theme.palette.divider};
  background: ${({ color }) => color ?? 'transparent'};
`;

export type ColorFieldRenderProps = FieldProps<
  ColorField,
  ColorValue | undefined
> & {
  name: string;
};

export const ColorFieldRender = ({
  field: { colors = themeColors, allowCustom = true, ...field },
  value,
  onChange,
  readOnly,
  name,
}: ColorFieldRenderProps) => {
  const labels = useColorLabels();
  const theme = useTheme();
  const isCustom = !!value && !isThemeColor(value);
  // Switching to custom starts with an empty picker, so track the mode
  // separately from the value
  const [customMode, setCustomMode] = useState(isCustom);
  const showCustom = allowCustom && (isCustom || customMode);

  const groups = Object.entries(themeColorGroups).flatMap(([group, shades]) => {
    const available = shades
      .map(shade => `${group}.${shade}` as ThemeColorValue)
      .filter(color => colors.includes(color));

    return available.length ?
        [{ group: group as keyof ThemeColorGroups, colors: available }]
      : [];
  });

  const handleSelectChange = (selected: string) => {
    if (selected === customColor) {
      setCustomMode(true);

      if (!isCustom) {
        onChange(undefined);
      }

      return;
    }

    setCustomMode(false);
    onChange(selected ? (selected as ThemeColorValue) : undefined);
  };

  return (
    <FieldLabel
      label={field.label ?? labels.color}
      readOnly={readOnly}
      el="div"
    >
      <Fields>
        <Selection>
          <Swatch color={resolveColor(theme, value)} />

          <select
            value={showCustom ? customColor : (value ?? '')}
            disabled={readOnly}
            onChange={event => handleSelectChange(event.currentTarget.value)}
          >
            <option value="">{labels.themeDefault}</option>

            {groups.map(({ group, colors }) => (
              <optgroup
                key={group}
                label={labels.groups[group]}
              >
                {colors.map(color => {
                  const shade = color.split('.')[1];

                  return (
                    <option
                      key={color}
                      value={color}
                    >
                      {labels.groups[group]} · {labels.shades[shade] ?? shade}
                    </option>
                  );
                })}
              </optgroup>
            ))}

            {allowCustom && (
              <option value={customColor}>{labels.custom}</option>
            )}
          </select>
        </Selection>

        {showCustom && (
          <ColorPicker
            name={name}
            value={value ?? ''}
            onChange={event => onChange(event.target.value)}
          />
        )}
      </Fields>
    </FieldLabel>
  );
};
