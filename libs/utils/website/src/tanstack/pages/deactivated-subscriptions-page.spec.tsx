import { createTheme, ThemeProvider } from '@mui/material';
import { render, waitFor } from '@testing-library/react';
import { FullSubscriptionFragment } from '@wepublish/website/api';
import { ComponentType, PropsWithChildren } from 'react';

import { DeactivatedSubscriptionsPage } from './deactivated-subscriptions-page';

type Filter = (
  subscriptions: FullSubscriptionFragment[]
) => FullSubscriptionFragment[];

const listProps = vi.hoisted(() => ({
  filter: undefined as Filter | undefined,
}));

vi.mock('../auth-guard', () => ({
  withAuthGuard: (Cmp: ComponentType) => Cmp,
}));

vi.mock('@wepublish/membership/website', async importOriginal => ({
  ...(await importOriginal<object>()),
  SubscriptionListContainer: (props: { filter: Filter }) => {
    listProps.filter = props.filter;
    return null;
  },
}));

vi.mock('@wepublish/website/builder', async importOriginal => ({
  ...(await importOriginal<object>()),
  Link: () => null,
}));

// The real one renders the builder's wrapper, which is empty without a
// `WebsiteBuilderProvider`.
vi.mock('@wepublish/content/website', async importOriginal => ({
  ...(await importOriginal<object>()),
  ContentWrapper: ({ children }: PropsWithChildren) => <div>{children}</div>,
}));

// Without an initialised i18n instance `useTranslation` suspends.
vi.mock('react-i18next', async importOriginal => ({
  ...(await importOriginal<object>()),
  useTranslation: () => ({ t: (key: string) => key }),
}));

const subscription = (
  id: string,
  state: Pick<FullSubscriptionFragment, 'deactivation' | 'isActive'>
) => ({ id, ...state }) as FullSubscriptionFragment;

describe('DeactivatedSubscriptionsPage', () => {
  it('lists only subscriptions that have actually ended', async () => {
    render(
      <ThemeProvider theme={createTheme()}>
        <DeactivatedSubscriptionsPage />
      </ThemeProvider>
    );

    await waitFor(() => expect(listProps.filter).toBeDefined());

    const ended = subscription('ended', {
      isActive: false,
      deactivation: { date: '2026-01-01', reason: 'userSelfDeactivated' },
    } as never);
    const pendingCancellation = subscription('pending', {
      isActive: true,
      deactivation: { date: '2027-01-01', reason: 'userSelfDeactivated' },
    } as never);
    const running = subscription('running', {
      isActive: true,
      deactivation: null,
    });

    expect(
      listProps.filter?.([ended, pendingCancellation, running]).map(s => s.id)
    ).toEqual(['ended']);
  });
});
