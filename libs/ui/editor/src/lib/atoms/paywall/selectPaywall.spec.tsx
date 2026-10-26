import { createTheme, ThemeProvider } from '@mui/material';
import { render, screen } from '@testing-library/react';

import { SelectPaywall } from './selectPaywall';

vi.mock('@apollo/client/react', () => ({
  useQuery: () => ({ data: undefined }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const theme = createTheme({ cssVariables: true });

describe('SelectPaywall', () => {
  it('names its input with the label it is given', () => {
    render(
      <ThemeProvider theme={theme}>
        <SelectPaywall
          label="Paywall"
          setSelectedPaywall={vi.fn()}
        />
      </ThemeProvider>
    );

    expect(screen.getByRole('combobox', { name: 'Paywall' })).toBeTruthy();
  });

  it('can be named by a label rendered elsewhere', () => {
    render(
      <ThemeProvider theme={theme}>
        <span id="paywall-label">Paywall to show</span>
        <SelectPaywall
          aria-labelledby="paywall-label"
          setSelectedPaywall={vi.fn()}
        />
      </ThemeProvider>
    );

    expect(
      screen.getByRole('combobox', { name: 'Paywall to show' })
    ).toBeTruthy();
  });
});
