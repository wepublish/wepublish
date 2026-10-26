import { createTheme, ThemeProvider } from '@mui/material';
import { render, screen } from '@testing-library/react';
import { ReactElement } from 'react';

import { SeoAnalysis } from './seoAnalysis';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

const theme = createTheme({ cssVariables: true });

const renderWithTheme = (ui: ReactElement) =>
  render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);

const stats = {
  wordCount: 600,
  headingCount: 2,
  linkCount: 3,
  imageCount: 4,
  imagesWithoutDescription: 1,
};

describe('SeoAnalysis', () => {
  test('shows the content stats', () => {
    renderWithTheme(<SeoAnalysis stats={stats} />);

    expect(screen.getByText('seoAnalysis.stats.wordCount')).toBeTruthy();
    expect(screen.getByText('600')).toBeTruthy();
    expect(screen.getByText('2')).toBeTruthy();
    expect(screen.getByText('3')).toBeTruthy();
    expect(screen.getByText('1')).toBeTruthy();
  });

  test('does not offer an analysis', () => {
    renderWithTheme(<SeoAnalysis stats={stats} />);

    expect(screen.queryByRole('button')).toBe(null);
  });

  test('renders nothing without stats', () => {
    const { container } = renderWithTheme(<SeoAnalysis />);

    expect(container.innerHTML).toBe('');
  });
});
