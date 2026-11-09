import { createTheme, ThemeProvider } from '@mui/material';
import { render, screen } from '@testing-library/react';

import { TokenGeneratePanel } from './tokenGeneratePanel';

vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useMutation: () => [vi.fn(), { loading: false }],
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

describe('TokenGeneratePanel', () => {
  it('labels the name field', () => {
    render(
      <ThemeProvider theme={createTheme({ cssVariables: true })}>
        <TokenGeneratePanel />
      </ThemeProvider>
    );

    expect(
      screen.getByRole('textbox', { name: 'tokenList.panels.name' })
    ).toBeInTheDocument();
  });
});
