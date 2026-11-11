import '@testing-library/jest-dom/vitest';

import { createTheme, ThemeProvider } from '@mui/material';
import { render, screen } from '@testing-library/react';

import { SubscriptionListFilter } from './subscriptionListFilter';

const theme = createTheme({ cssVariables: true });

vi.mock('@apollo/client/react', () => ({
  useQuery: () => ({ data: undefined, loading: false }),
  useLazyQuery: () => [vi.fn(), { data: undefined }],
  useApolloClient: () => ({ query: vi.fn() }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

const renderFilter = (props = {}) =>
  render(
    <ThemeProvider theme={theme}>
      <SubscriptionListFilter
        filter={{ autoRenew: true }}
        isLoading={false}
        onSetFilter={vi.fn()}
        {...props}
      />
    </ThemeProvider>
  );

describe('SubscriptionListFilter', () => {
  it('leaves the reset to the toolbar', () => {
    renderFilter();

    expect(
      screen.queryByRole('button', { name: /subscriptionList.filter.reset/ })
    ).not.toBeInTheDocument();
  });

  it('labels the owner search instead of relying on its placeholder', () => {
    renderFilter();

    expect(
      screen.getByRole('combobox', { name: 'userSubscriptionEdit.selectUser' })
    ).toBeInTheDocument();
  });

  it('keeps its fields mounted across a reset', () => {
    const { rerender } = renderFilter({ filter: { autoRenew: true } });

    const before = screen.getByRole('combobox', {
      name: 'userSubscriptionEdit.autoRenew',
    });

    rerender(
      <ThemeProvider theme={theme}>
        <SubscriptionListFilter
          filter={{}}
          isLoading={false}
          onSetFilter={vi.fn()}
        />
      </ThemeProvider>
    );

    expect(
      screen.getByRole('combobox', { name: 'userSubscriptionEdit.autoRenew' })
    ).toBe(before);
  });
});
