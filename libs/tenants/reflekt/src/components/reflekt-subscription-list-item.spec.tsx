import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  applyTenantTranslations,
  mockMemberPlan,
  mockSubscription,
  renderWithProviders,
  resetTranslations,
} from '@wepublish/mocks/website';
import { ProductType } from '@wepublish/website/api';
import { t } from 'i18next';

import { reflektTenant } from '../reflekt-tenant';
import { ReflektSubscriptionListItem } from './reflekt-subscription-list-item';

const theme = reflektTenant.createTheme();

const renderItem = () => {
  renderWithProviders(
    <ReflektSubscriptionListItem
      {...mockSubscription({
        memberPlan: mockMemberPlan({ name: 'Kompliz:in' }),
        paidUntil: '2032-01-01T00:00:00.000Z',
        autoRenew: true,
        extendable: true,
      })}
      cancel={vi.fn(async () => undefined)}
      extend={vi.fn(async () => undefined)}
    />,
    { tenant: reflektTenant }
  );

  return userEvent.setup();
};

const cancelButton = () =>
  screen.getByRole('button', {
    name: t('subscription.cancel', { type: ProductType.Subscription }),
  });

describe('ReflektSubscriptionListItem', () => {
  beforeAll(() => applyTenantTranslations(reflektTenant));
  afterAll(() => resetTranslations());

  it('sets the cancel link in the text colour instead of the light secondary yellow', () => {
    renderItem();

    expect(getComputedStyle(cancelButton()).color).toBe(
      theme.palette.text.primary
    );
  });

  it('sets the dismiss button of the cancel confirmation in the text colour', async () => {
    const user = renderItem();

    await user.click(cancelButton());

    expect(
      getComputedStyle(screen.getByRole('button', { name: t('user.cancel') }))
        .color
    ).toBe(theme.palette.text.primary);
  });
});
