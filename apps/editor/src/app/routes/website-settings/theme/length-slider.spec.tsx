import { createTheme, ThemeProvider } from '@mui/material';
import { render, screen } from '@testing-library/react';

import { LengthSlider, UnitConfig } from './length-slider';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options ? `${key}:${Object.values(options).join(',')}` : key,
    i18n: { language: 'en' },
  }),
}));

const config: UnitConfig = {
  em: { min: 1, max: 3, step: 0.1 },
  rem: { min: 1, max: 3, step: 0.1 },
  px: { min: 8, max: 48, step: 1 },
};

const renderSlider = (props: Partial<Parameters<typeof LengthSlider>[0]>) =>
  render(
    <ThemeProvider theme={createTheme({ cssVariables: true })}>
      <LengthSlider
        name="typography.allVariants.lineHeight"
        value="1.5em"
        defaultUnit="em"
        unitConfig={config}
        onChange={vi.fn()}
        onBlur={vi.fn()}
        label="Line Height"
        {...props}
      />
    </ThemeProvider>
  );

describe('LengthSlider', () => {
  it('names the slider, the number and the unit after the setting', () => {
    renderSlider({});

    expect(screen.getByRole('slider', { name: 'Line Height' })).toBeTruthy();
    expect(
      screen.getByRole('spinbutton', { name: 'Line Height' })
    ).toBeTruthy();
    expect(
      screen.getByRole('combobox', {
        name: 'websiteSettings.theme.typography.unitFor:Line Height',
      })
    ).toBeTruthy();
  });

  it('reads the slider value out with its unit', () => {
    renderSlider({});

    expect(screen.getByRole('slider')).toHaveAttribute(
      'aria-valuetext',
      '1.5em'
    );
  });

  it('shows the validation message and ties it to the number field', () => {
    renderSlider({ error: { type: 'custom', message: 'Too wide' } });

    expect(
      screen.getByRole('spinbutton', { name: 'Line Height' })
    ).toHaveAccessibleDescription('Too wide');
  });
});
