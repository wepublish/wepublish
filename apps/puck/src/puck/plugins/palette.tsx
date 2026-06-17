import { useTheme } from '@emotion/react';
import styled from '@emotion/styled';
import { Palette } from '@mui/material';
import { BaseField, FieldLabel, FieldProps, Plugin } from '@puckeditor/core';
import { useTranslation } from 'react-i18next';

import { UserConfig } from '../types';

export type PaletteValue = Extract<
  keyof Palette,
  'primary' | 'secondary' | 'accent' | 'success' | 'info' | 'warning' | 'error'
>;

export const palettes = [
  'primary',
  'secondary',
  'accent',

  'success',
  'error',
  'info',
  'warning',
] as PaletteValue[];

export type PaletteField = BaseField & {
  type: 'palette';
  palettes?: PaletteValue[];
};

const usePaletteLabels = (): Record<PaletteValue, string> => {
  const { t } = useTranslation();

  return {
    primary: t('', 'Primary'),
    secondary: t('', 'Secondary'),
    accent: t('', 'Accent'),

    success: t('', 'Success'),
    error: t('', 'Error'),
    info: t('', 'Info'),
    warning: t('', 'Warning'),
  };
};

const PaletteOptions = styled.div`
  display: flex;
  gap: 4px;
`;

const PaletteOption = styled.label<{
  active: boolean;
  disabled: boolean;
  color: string;
}>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 25px;
  height: 25px;
  border: 1px solid
    ${({ active, theme }) =>
      active ? theme.palette.action.active : theme.palette.divider};
  border-radius: 4px;
  background: ${({ color }) => color};
  cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};
  opacity: ${({ disabled }) => (disabled ? 0.5 : 1)};

  input {
    position: absolute;
    width: 1px;
    height: 1px;
    margin: -1px;
    padding: 0;
    border: 0;
    overflow: hidden;
    clip: rect(0 0 0 0);
  }
`;

type PaletteFieldRenderProps = FieldProps<PaletteField, PaletteValue> & {
  name: string;
};

const PaletteFieldRender = ({
  field,
  value,
  onChange,
  readOnly,
  name,
}: PaletteFieldRenderProps) => {
  const labels = usePaletteLabels();
  const theme = useTheme();

  return (
    <FieldLabel
      label={field.label ?? 'Palette'}
      readOnly={readOnly}
    >
      <PaletteOptions>
        {palettes.map(palette => {
          const color = theme.palette[palette].main;
          const active = value === palette;

          return (
            <PaletteOption
              key={palette}
              title={labels[palette]}
              active={active}
              disabled={!!readOnly}
              color={color}
            >
              <input
                type="radio"
                name={name}
                value={palette}
                checked={active}
                disabled={readOnly}
                onChange={() => onChange(palette)}
              />
            </PaletteOption>
          );
        })}
      </PaletteOptions>
    </FieldLabel>
  );
};

export const palettePlugin: Plugin<UserConfig> = {
  name: 'palette',
  overrides: {
    fieldTypes: {
      palette: PaletteFieldRender,
    },
  },
};
