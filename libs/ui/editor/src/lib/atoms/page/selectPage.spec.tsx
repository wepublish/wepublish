import { createTheme, ThemeProvider } from '@mui/material';
import { render, screen } from '@testing-library/react';

import { SelectPage } from './selectPage';

vi.mock('@apollo/client/react', () => ({
  useQuery: () => ({ data: undefined, refetch: vi.fn() }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const theme = createTheme({ cssVariables: true });

describe('SelectPage', () => {
  it('names its input with the label it is given', () => {
    render(
      <ThemeProvider theme={theme}>
        <SelectPage
          label="Page"
          setSelectedPage={vi.fn()}
        />
      </ThemeProvider>
    );

    expect(screen.getByRole('combobox', { name: 'Page' })).toBeTruthy();
  });

  it('can be named by a label rendered elsewhere', () => {
    render(
      <ThemeProvider theme={theme}>
        <span id="page-label">Landing page</span>
        <SelectPage
          aria-labelledby="page-label"
          setSelectedPage={vi.fn()}
        />
      </ThemeProvider>
    );

    expect(screen.getByRole('combobox', { name: 'Landing page' })).toBeTruthy();
  });
});
