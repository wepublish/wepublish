import '@testing-library/jest-dom/vitest';

import { createTheme, ThemeProvider } from '@mui/material';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import {
  FullMemberPlanFragment,
  PaymentPeriodicity,
  SubscriptionFlowFragment,
} from '@wepublish/editor/api';
import { ComponentProps } from 'react';

import { SubscriptionClientContext } from '../graphql-client-context';
import { FlowFilters } from './flow-filters';

const enabledFeatures = new Set<string>();

vi.mock('@wepublish/ui/editor', async importOriginal => ({
  ...(await importOriginal<typeof import('@wepublish/ui/editor')>()),
  useFeature: (feature: string) => enabledFeatures.has(feature),
  useAuthorisation: () => true,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const memberPlan = { id: 'plan-1' } as FullMemberPlanFragment;

const existingFlow = (legacy: boolean[]) =>
  ({
    id: 'flow-1',
    default: false,
    paymentMethods: [{ id: 'invoice', name: 'Rechnung' }],
    periodicities: [PaymentPeriodicity.Yearly],
    autoRenewal: [true],
    legacy,
  }) as unknown as SubscriptionFlowFragment;

const renderFilters = (props: Partial<ComponentProps<typeof FlowFilters>>) => {
  const client = {
    createSubscriptionFlow: vi.fn(),
    updateSubscriptionFlow: vi.fn(),
  };

  render(
    <ThemeProvider theme={createTheme({ cssVariables: true })}>
      <SubscriptionClientContext.Provider value={client as never}>
        <FlowFilters
          memberPlan={memberPlan}
          paymentMethods={undefined}
          {...props}
        />
      </SubscriptionClientContext.Provider>
    </ThemeProvider>
  );

  return client;
};

const legacySelect = () =>
  screen.queryByRole('combobox', { name: 'subscriptionFlow.legacy' });

const choose = (option: string) => {
  fireEvent.mouseDown(legacySelect() as HTMLElement);
  fireEvent.click(screen.getByRole('option', { name: option }));
};

describe('FlowFilters legacy subscriptions', () => {
  afterEach(() => {
    cleanup();
    enabledFeatures.clear();
  });

  it('does not tell legacy subscriptions apart while the feature is off', () => {
    renderFilters({ subscriptionFlow: existingFlow([true, false]) });

    expect(legacySelect()).not.toBeInTheDocument();
  });

  describe('with the feature on', () => {
    beforeEach(() => {
      enabledFeatures.add('legacy-subscriptions');
    });

    it('shows whom an existing flow is for', () => {
      renderFilters({ subscriptionFlow: existingFlow([true]) });

      expect(legacySelect()).toHaveTextContent(
        'subscriptionFlow.legacyFilter.only'
      );
    });

    it('narrows an existing flow to legacy subscriptions and leaves its other filters alone', () => {
      const client = renderFilters({
        subscriptionFlow: existingFlow([true, false]),
      });

      choose('subscriptionFlow.legacyFilter.only');

      expect(client.updateSubscriptionFlow).toHaveBeenCalledWith({
        variables: {
          id: 'flow-1',
          paymentMethodIds: ['invoice'],
          periodicities: [PaymentPeriodicity.Yearly],
          autoRenewal: [true],
          legacy: [true],
        },
      });
    });

    it('keeps legacy subscriptions out of a flow for all the others', () => {
      const client = renderFilters({
        subscriptionFlow: existingFlow([true, false]),
      });

      choose('subscriptionFlow.legacyFilter.none');

      expect(client.updateSubscriptionFlow).toHaveBeenCalledWith({
        variables: expect.objectContaining({ legacy: [false] }),
      });
    });

    it('creates a new flow for legacy subscriptions only', () => {
      const client = renderFilters({ createNewFlow: true });

      choose('subscriptionFlow.legacyFilter.only');
      fireEvent.click(
        screen.getByRole('button', { name: 'subscriptionFlow.addNew' })
      );

      expect(client.createSubscriptionFlow).toHaveBeenCalledWith({
        variables: expect.objectContaining({
          memberPlanId: 'plan-1',
          legacy: [true],
        }),
      });
    });

    it('cannot be changed on the default flow', () => {
      renderFilters({
        subscriptionFlow: { ...existingFlow([true, false]), default: true },
      });

      expect(legacySelect()).toHaveAttribute('aria-disabled', 'true');
    });
  });

  it('leaves whom a flow is for untouched when another filter changes with the feature off', () => {
    const client = renderFilters({ subscriptionFlow: existingFlow([true]) });

    // periodicity, then auto renewal; neither is labelled for a query by name
    const autoRenewal = screen.getAllByRole('combobox')[1];
    fireEvent.mouseDown(autoRenewal);
    fireEvent.click(
      screen.getByRole('option', {
        name: 'subscriptionFlow.booleanFilter.false',
      })
    );

    expect(
      client.updateSubscriptionFlow.mock.calls[0][0].variables.legacy
    ).toBeUndefined();
  });
});
