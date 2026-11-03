import { FieldLabel, FieldProps } from '@puckeditor/core';
import { useTranslation } from 'react-i18next';

import { ColorSwatchRadioGroup } from '../color/color-swatches.component';
import { formatColorHex, resolvePaletteColor } from '../color/color.field';
import { useWebsiteTheme } from '../website-theme';
import { PaletteField, palettes, PaletteValue } from './palette.field';

const usePaletteLabels = () => {
  const { t } = useTranslation();

  return {
    palette: t('puck.palette.palette'),
    palettes: {
      primary: t('puck.palette.primary'),
      secondary: t('puck.palette.secondary'),
      accent: t('puck.palette.accent'),

      success: t('puck.palette.success'),
      error: t('puck.palette.error'),
      info: t('puck.palette.info'),
      warning: t('puck.palette.warning'),
    } satisfies Record<PaletteValue, string>,
  };
};

export type PaletteFieldRenderProps = FieldProps<PaletteField, PaletteValue> & {
  name: string;
};

export const PaletteFieldRender = ({
  field,
  value,
  onChange,
  readOnly,
}: PaletteFieldRenderProps) => {
  const labels = usePaletteLabels();
  const theme = useWebsiteTheme();
  const label = field.label ?? labels.palette;
  const options = (field.palettes ?? palettes).map(palette => {
    const color = resolvePaletteColor(theme, `${palette}.main`);

    return {
      value: palette,
      label: labels.palettes[palette],
      color,
      detail: formatColorHex(color),
    };
  });

  return (
    <FieldLabel
      label={label}
      readOnly={readOnly}
      el="div"
    >
      <ColorSwatchRadioGroup
        label={label}
        rows={[{ key: 'palettes', options }]}
        value={value}
        readOnly={readOnly}
        onChange={next => onChange(next)}
      />
    </FieldLabel>
  );
};
