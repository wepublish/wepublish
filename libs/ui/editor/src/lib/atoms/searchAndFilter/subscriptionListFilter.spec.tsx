import '@testing-library/jest-dom/vitest';

import { createTheme, ThemeProvider } from '@mui/material';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

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

const enabledFeatures = new Set<string>();

vi.mock('../../featureContext', () => ({
  useFeature: (feature: string) => enabledFeatures.has(feature),
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
  afterEach(() => {
    enabledFeatures.clear();
  });

  describe('legacy subscriptions', () => {
    it('offers no legacy filter while the feature is off', () => {
      renderFilter();

      expect(
        screen.queryByRole('combobox', {
          name: 'subscriptionListFilter.legacy',
        })
      ).not.toBeInTheDocument();
    });

    it('filters for legacy subscriptions with the feature on', async () => {
      enabledFeatures.add('legacy-subscriptions');
      const onSetFilter = vi.fn();
      renderFilter({ filter: {}, onSetFilter });

      await userEvent.click(
        screen.getByRole('combobox', { name: 'subscriptionListFilter.legacy' })
      );
      await userEvent.click(screen.getByRole('option', { name: 'yes' }));

      expect(onSetFilter).toHaveBeenCalledWith({ legacy: true });
    });
  });

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
