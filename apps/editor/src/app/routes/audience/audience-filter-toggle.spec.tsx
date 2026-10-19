import '@testing-library/jest-dom/vitest';

import { createTheme, ThemeProvider } from '@mui/material';
import { render, screen } from '@testing-library/react';

import { DEFAULT_AUDIENCE_CLIENT_FILTER } from './audience-filter-params';
import { AudienceFilterToggle } from './audience-filter-toggle';

const theme = createTheme({ cssVariables: true });

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

const renderToggle = () =>
  render(
    <ThemeProvider theme={theme}>
      <AudienceFilterToggle
        filterKey="createdSubscriptionCount"
        clientFilter={DEFAULT_AUDIENCE_CLIENT_FILTER}
        setClientFilter={vi.fn()}
      />
    </ThemeProvider>
  );

describe('AudienceFilterToggle', () => {
  it('puts the explanation at the end of the row, not after the words', () => {
    const { container } = renderToggle();

    const row = container.firstElementChild as HTMLElement;

    expect(row.lastElementChild).toHaveAttribute('data-row-end');
  });

  it('names the series by its label', () => {
    renderToggle();

    expect(
      screen.getByRole('switch', {
        name: /audience.legend.createdSubscriptionCount/,
      })
    ).toBeInTheDocument();
  });
});
