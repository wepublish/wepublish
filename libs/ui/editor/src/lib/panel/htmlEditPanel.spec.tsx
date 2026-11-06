import { createTheme, ThemeProvider } from '@mui/material';
import { render, screen } from '@testing-library/react';

import { HtmlEditPanel } from './htmlEditPanel';

vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useLazyQuery: () => [vi.fn(), { loading: false }],
}));

vi.mock('@wepublish/editor/api', async importOriginal => ({
  ...(await importOriginal<typeof import('@wepublish/editor/api')>()),
  getApiClientV2: () => undefined,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

describe('HtmlEditPanel', () => {
  it('labels the prompt field with its visible label', () => {
    render(
      <ThemeProvider theme={createTheme({ cssVariables: true })}>
        <HtmlEditPanel
          value={{ html: '' }}
          onClose={vi.fn()}
          onConfirm={vi.fn()}
        />
      </ThemeProvider>
    );

    expect(
      screen.getByRole('textbox', { name: 'blocks.html.generate' })
    ).toBeInTheDocument();
  });

  it('gives the HTML field a persistent label, not only a placeholder', () => {
    render(
      <ThemeProvider theme={createTheme({ cssVariables: true })}>
        <HtmlEditPanel
          value={{ html: '' }}
          onClose={vi.fn()}
          onConfirm={vi.fn()}
        />
      </ThemeProvider>
    );

    expect(screen.getByLabelText('blocks.html.label')).toHaveAttribute(
      'placeholder',
      'blocks.html.placeholder'
    );
  });
});
