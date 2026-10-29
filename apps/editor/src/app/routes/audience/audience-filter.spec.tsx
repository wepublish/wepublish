import '@testing-library/jest-dom/vitest';

import { createTheme, ThemeProvider } from '@mui/material';
import { fireEvent, render, screen } from '@testing-library/react';

import { AudienceFilter, AudienceFilterProps } from './audience-filter';
import {
  DEFAULT_AUDIENCE_CLIENT_FILTER,
  DEFAULT_AUDIENCE_COMPONENT_FILTER,
} from './audience-filter-params';

const theme = createTheme({ cssVariables: true });

vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useQuery: () => ({ data: undefined, loading: false }),
  useLazyQuery: () => [vi.fn(), { data: undefined }],
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

const setComponentFilter = vi.fn();
const setResolution = vi.fn();
const setApiFilter = vi.fn();

const renderFilter = (props: Partial<AudienceFilterProps> = {}) =>
  render(
    <ThemeProvider theme={theme}>
      <AudienceFilter
        resolution="daily"
        setResolution={setResolution}
        clientFilter={DEFAULT_AUDIENCE_CLIENT_FILTER}
        setClientFilter={vi.fn()}
        apiFilter={{ dateRange: null, memberPlanIds: [] }}
        setApiFilter={setApiFilter}
        componentFilter={DEFAULT_AUDIENCE_COMPONENT_FILTER}
        setComponentFilter={setComponentFilter}
        buildPermalink={() => 'https://example.com/audience'}
        {...props}
      />
    </ThemeProvider>
  );

beforeEach(() => {
  setComponentFilter.mockClear();
  setResolution.mockClear();
  setApiFilter.mockClear();
});

describe('AudienceFilter', () => {
  it('offers the resolution as one choice of two', () => {
    renderFilter();

    expect(
      screen.getByRole('button', { name: 'audienceFilter.daily' })
    ).toHaveAttribute('aria-pressed', 'true');
    expect(
      screen.getByRole('button', { name: 'audienceFilter.monthly' })
    ).toHaveAttribute('aria-pressed', 'false');
  });

  it('switches the view rather than toggling two of them', () => {
    renderFilter();

    expect(
      screen.getByRole('button', { name: 'audienceFilter.chart' })
    ).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(
      screen.getByRole('button', { name: 'audienceFilter.table' })
    );

    expect(setComponentFilter).toHaveBeenCalledWith(
      expect.objectContaining({ chart: false, table: true })
    );
  });

  it('will not leave the dashboard with nothing to draw', () => {
    renderFilter();

    fireEvent.click(
      screen.getByRole('button', { name: 'audienceFilter.chart' })
    );

    expect(setComponentFilter).not.toHaveBeenCalled();
  });

  it('keeps the ranges in the calendar', () => {
    renderFilter();

    expect(
      screen.queryByRole('button', { name: 'audienceFilter.rangeLastWeek' })
    ).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('textbox', { name: 'audienceFilter.dateRange' })
    );

    expect(
      screen.getByRole('button', { name: 'audienceFilter.rangeLastWeek' })
    ).toBeInTheDocument();
  });

  it('sets the range the user picked', () => {
    renderFilter();

    fireEvent.click(
      screen.getByRole('textbox', { name: 'audienceFilter.dateRange' })
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'audienceFilter.rangeLastWeek' })
    );

    expect(setApiFilter).toHaveBeenCalledWith(
      expect.objectContaining({ dateRange: expect.any(Array) })
    );
  });

  it('puts the resolution and the view on one line', () => {
    renderFilter();

    const resolution = screen.getByRole('button', {
      name: 'audienceFilter.daily',
    });
    const view = screen.getByRole('button', { name: 'audienceFilter.chart' });

    const row = resolution.closest('div[class*="Choices"]');

    expect(row).not.toBeNull();
    expect(view.closest('div[class*="Choices"]')).toBe(row);
  });

  it('keeps the whole filter in one panel', () => {
    renderFilter();

    const resolution = screen.getByRole('button', {
      name: 'audienceFilter.daily',
    });
    const series = screen.getByRole('switch', {
      name: /audience.legend.createdSubscriptionCount/,
    });

    const panel = resolution.closest('.MuiPaper-root');

    expect(panel).not.toBeNull();
    expect(series.closest('.MuiPaper-root')).toBe(panel);
  });
});
