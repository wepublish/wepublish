import { useMutation, useQuery } from '@apollo/client/react';
import { createTheme, ThemeProvider } from '@mui/material';
import { fireEvent, render, screen, within } from '@testing-library/react';
import {
  DeleteGiftCodeOfferDocument,
  GiftCodeOfferListDocument,
  GiftCodeOfferSort,
  PaymentPeriodicity,
} from '@wepublish/editor/api';
import { CanDeleteGiftCodes } from '@wepublish/permissions';
import { enqueueSnackbar } from '@wepublish/ui/editor';
import { MemoryRouter } from 'react-router-dom';
import type { Mock } from 'vitest';

import { GiftCodeOfferList } from './giftCodeOfferList';

const { permissions, deleteOffer } = vi.hoisted(() => ({
  permissions: new Set<string>(),
  deleteOffer: vi.fn(),
}));

vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useQuery: vi.fn(),
  useLazyQuery: () => [vi.fn(), { loading: false }],
  useApolloClient: () => ({ query: vi.fn() }),
  useMutation: vi.fn(() => [deleteOffer, { loading: false }]),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options ? `${key}:${Object.values(options).join(',')}` : key,
    i18n: { language: 'en' },
  }),
}));

vi.mock('@wepublish/ui/editor', async importOriginal => ({
  ...(await importOriginal<typeof import('@wepublish/ui/editor')>()),
  createCheckedPermissionComponent: () => (component: unknown) => component,
  PermissionControl: ({
    qualifyingPermissions,
    children,
  }: {
    qualifyingPermissions: string[];
    children: React.ReactNode;
  }) =>
    qualifyingPermissions.some(permission => permissions.has(permission)) ?
      children
    : null,
  enqueueSnackbar: vi.fn(),
}));

const mockedUseQuery = useQuery as unknown as Mock;
const mockedUseMutation = useMutation as unknown as Mock;

const offer = {
  __typename: 'GiftCodeOffer',
  id: 'offer-1',
  createdAt: '2026-10-01T10:00:00.000Z',
  modifiedAt: '2026-10-02T10:00:00.000Z',
  name: 'Ein Jahr schenken',
  description: null,
  active: true,
  issueBeforePayment: true,
  allowDiscountCodes: false,
  periodicity: PaymentPeriodicity.Yearly,
  redemptionWindowMonths: null,
  imageID: null,
  image: null,
  memberPlanId: 'plan-1',
  memberPlan: { id: 'plan-1', name: 'Jahresabo', currency: 'CHF' },
  paymentMethodIds: ['method-1'],
  paymentMethods: [{ id: 'method-1', name: 'Stripe', slug: 'stripe' }],
  price: { amount: 12000, currency: 'CHF' },
};

const theme = createTheme({ cssVariables: true });

const renderList = () =>
  render(
    <ThemeProvider theme={theme}>
      <MemoryRouter>
        <GiftCodeOfferList />
      </MemoryRouter>
    </ThemeProvider>
  );

const listVariables = () =>
  mockedUseQuery.mock.calls
    .filter(([document]) => document === GiftCodeOfferListDocument)
    .at(-1)?.[1]?.variables;

beforeEach(() => {
  localStorage.clear();
  permissions.clear();
  deleteOffer.mockReset();
  mockedUseMutation.mockClear();
  vi.mocked(enqueueSnackbar).mockClear();
  mockedUseQuery.mockReset();
  mockedUseQuery.mockReturnValue({
    data: {
      giftCodeOffers: {
        nodes: [offer],
        totalCount: 1,
        pageInfo: { hasNextPage: false, hasPreviousPage: false },
      },
    },
    loading: false,
    refetch: vi.fn(),
  });
});

describe('GiftCodeOfferList', () => {
  it('lists the most recently edited offers first', () => {
    renderList();

    expect(listVariables()).toEqual(
      expect.objectContaining({ sort: GiftCodeOfferSort.ModifiedAt })
    );
  });

  it('describes what an offer sells', () => {
    renderList();

    const row = screen
      .getByText('Ein Jahr schenken')
      .closest('tr') as HTMLElement;

    expect(within(row).getByText('Jahresabo')).toBeInTheDocument();
    expect(
      within(row).getByText('memberPlanList.paymentPeriodicity.yearly')
    ).toBeInTheDocument();
    expect(within(row).getByText('120.00 CHF')).toBeInTheDocument();
    expect(
      within(row).getByText('giftCodeOffer.overview.unlimited')
    ).toBeInTheDocument();
  });

  it('shows whether an offer takes discount codes', () => {
    renderList();

    const row = screen
      .getByText('Ein Jahr schenken')
      .closest('tr') as HTMLElement;

    expect(
      screen.getByText('giftCodeOffer.overview.allowDiscountCodes')
    ).toBeInTheDocument();
    expect(within(row).getAllByText('❌')).toHaveLength(1);
  });

  it('only lets who may delete offers delete them', () => {
    renderList();

    expect(
      screen.queryByRole('button', { name: 'delete' })
    ).not.toBeInTheDocument();
  });

  it('deletes an offer once the editor confirms', () => {
    permissions.add(CanDeleteGiftCodes.id);
    renderList();

    fireEvent.click(screen.getByRole('button', { name: 'delete' }));
    fireEvent.click(
      screen.getByRole('button', {
        name: 'giftCodeOffer.overview.areYouSureConfirmation',
      })
    );

    expect(deleteOffer).toHaveBeenCalledWith({
      variables: { id: 'offer-1' },
    });
  });

  it('tells the editor why an offer could not be deleted', () => {
    renderList();

    const [, options] = mockedUseMutation.mock.calls.find(
      ([document]) => document === DeleteGiftCodeOfferDocument
    )!;
    options.onError(new Error('The offer has sold gift codes'));

    expect(enqueueSnackbar).toHaveBeenCalledWith(
      expect.stringContaining('The offer has sold gift codes'),
      expect.objectContaining({ variant: 'error' })
    );
  });
});
