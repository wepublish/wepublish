import { createTheme, ThemeProvider } from '@mui/material';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import type { ArticleFilterParams, WepOneClient } from './networkContent.types';
import { NetworkContentArticleFilters } from './networkContentArticleFilters';

const theme = createTheme({ cssVariables: true });

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

const clients = [{ name: 'Hauptstadt' }, { name: 'Bajour' }] as WepOneClient[];

const filters: ArticleFilterParams = {
  search: '',
  clientName: '',
  dateFrom: '',
  dateTo: '',
} as ArticleFilterParams;

const renderFilters = (
  overrides: Partial<ArticleFilterParams> = {},
  onFiltersChange = vi.fn()
) => {
  render(
    <ThemeProvider theme={theme}>
      <NetworkContentArticleFilters
        filters={{ ...filters, ...overrides }}
        clients={clients}
        onFiltersChange={onFiltersChange}
      />
    </ThemeProvider>
  );
  return onFiltersChange;
};

describe('NetworkContentArticleFilters', () => {
  it('reports what the user typed into the search box', () => {
    const onFiltersChange = renderFilters();

    fireEvent.change(screen.getByLabelText('networkContentPage.searchLabel'), {
      target: { value: 'climate' },
    });

    expect(onFiltersChange).toHaveBeenCalledWith(
      expect.objectContaining({ search: 'climate' })
    );
  });

  it('offers every client as a media filter', async () => {
    renderFilters();

    fireEvent.mouseDown(
      screen.getByLabelText('networkContentPage.mediaFilter')
    );

    await waitFor(() =>
      expect(screen.getByText('Hauptstadt')).toBeInTheDocument()
    );
    expect(screen.getByText('Bajour')).toBeInTheDocument();
  });

  it('reports the client the user picked', async () => {
    const onFiltersChange = renderFilters();

    fireEvent.mouseDown(
      screen.getByLabelText('networkContentPage.mediaFilter')
    );
    fireEvent.click(await screen.findByText('Bajour'));

    expect(onFiltersChange).toHaveBeenCalledWith(
      expect.objectContaining({ clientName: 'Bajour' })
    );
  });

  it('shows the client that is already selected', () => {
    renderFilters({ clientName: 'Bajour' } as Partial<ArticleFilterParams>);

    expect(screen.getByLabelText('networkContentPage.mediaFilter')).toHaveValue(
      'Bajour'
    );
  });

  it('shows the stored ISO day in day-month-year order', () => {
    renderFilters({ dateFrom: '2026-03-04' } as Partial<ArticleFilterParams>);

    expect(
      screen.getByRole('textbox', { name: 'networkContentPage.dateFrom' })
    ).toHaveValue('04.03.2026');
  });

  it('leaves the date field empty when no day is stored', () => {
    renderFilters();

    expect(
      screen.getByRole('textbox', { name: 'networkContentPage.dateTo' })
    ).toHaveValue('');
  });
});
