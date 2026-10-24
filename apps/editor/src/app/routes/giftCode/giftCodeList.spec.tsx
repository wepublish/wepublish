import { useQuery } from '@apollo/client/react';
import { createTheme, ThemeProvider } from '@mui/material';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import {
  CancelGiftCodeDocument,
  GiftCodeListDocument,
  GiftCodeStatus,
  MarkInvoiceAsPaidDocument,
  PaymentPeriodicity,
} from '@wepublish/editor/api';
import { CanCreateInvoice, CanUpdateGiftCodes } from '@wepublish/permissions';
import { DataTableProps, getExportColumns } from '@wepublish/ui/editor';
import { MemoryRouter } from 'react-router-dom';
import type { Mock } from 'vitest';

import { GiftCodeList } from './giftCodeList';

const { mutationFor, permissions, tableProps } = vi.hoisted(() => {
  const mutations = new Map<unknown, Mock>();

  return {
    permissions: new Set<string>(),
    tableProps: { current: undefined as unknown },
    mutationFor: (document: unknown) => {
      if (!mutations.has(document)) {
        mutations.set(
          document,
          vi.fn(async () => ({ data: {} }))
        );
      }

      return mutations.get(document) as Mock;
    },
  };
});

vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useQuery: vi.fn(),
  useLazyQuery: () => [vi.fn(), { loading: false }],
  useApolloClient: () => ({ query: vi.fn() }),
  useMutation: (document: unknown) => [
    mutationFor(document),
    { loading: false },
  ],
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

vi.mock('@wepublish/ui/editor', async importOriginal => {
  const original =
    await importOriginal<typeof import('@wepublish/ui/editor')>();

  return {
    ...original,
    DataTable: (props: DataTableProps<unknown>) => {
      tableProps.current = props;

      return <original.DataTable {...props} />;
    },
    createCheckedPermissionComponent: () => (component: unknown) => component,
    PermissionControl: ({ children }: { children: React.ReactNode }) =>
      children,
    useAuthorisation: (permission: string) => permissions.has(permission),
  };
});

const mockedUseQuery = useQuery as unknown as Mock;
const refetch = vi.fn();

const code = (
  id: string,
  status: GiftCodeStatus,
  overrides: Record<string, unknown> = {}
) => ({
  __typename: 'GiftCode',
  id,
  code: status === GiftCodeStatus.Ordered ? null : `ABCD-EFGH-${id}`,
  status,
  paid: status !== GiftCodeStatus.Ordered,
  recipientName: 'Anna',
  message: null,
  buyerId: 'user-1',
  buyer: {
    id: 'user-1',
    name: 'Muster',
    firstName: 'Max',
    email: 'max@example.com',
  },
  offerId: 'offer-1',
  offer: { id: 'offer-1', name: 'Ein Jahr schenken' },
  memberPlanId: 'plan-1',
  memberPlan: { id: 'plan-1', name: 'Jahresabo' },
  periodicity: PaymentPeriodicity.Yearly,
  redemptionWindowMonths: 12,
  amount: 12000,
  currency: 'CHF',
  invoiceId: `invoice-${id}`,
  createdAt: '2026-10-01T10:00:00.000Z',
  issuedAt: null,
  expiresAt: null,
  redeemedAt: null,
  canceledAt: null,
  cancellationReason: null,
  ...overrides,
});

const codes = [
  code('ordered', GiftCodeStatus.Ordered),
  code('issued', GiftCodeStatus.Issued),
  code('unpaid', GiftCodeStatus.Issued, { paid: false }),
  code('redeemed', GiftCodeStatus.Redeemed),
];

const theme = createTheme({ cssVariables: true });

const renderList = () =>
  render(
    <ThemeProvider theme={theme}>
      <MemoryRouter>
        <GiftCodeList />
      </MemoryRouter>
    </ThemeProvider>
  );

const listVariables = () =>
  mockedUseQuery.mock.calls
    .filter(([document]) => document === GiftCodeListDocument)
    .at(-1)?.[1]?.variables;

const row = (id: string) =>
  screen.getByText(`ABCD-EFGH-${id}`).closest('tr') as HTMLElement;

const orderedRow = () =>
  screen.getByText('giftCode.list.noCodeYet').closest('tr') as HTMLElement;

beforeEach(() => {
  localStorage.clear();
  permissions.clear();
  refetch.mockReset();
  mutationFor(CancelGiftCodeDocument).mockClear();
  mutationFor(MarkInvoiceAsPaidDocument).mockClear();
  mockedUseQuery.mockReset();
  mockedUseQuery.mockImplementation((document: unknown) =>
    document === GiftCodeListDocument ?
      {
        data: {
          giftCodes: {
            nodes: codes,
            totalCount: codes.length,
            pageInfo: { hasNextPage: false, hasPreviousPage: false },
          },
        },
        loading: false,
        refetch,
      }
    : { data: undefined, loading: false, refetch: vi.fn() }
  );
});

describe('GiftCodeList', () => {
  it('asks for the chosen status only', () => {
    renderList();

    fireEvent.click(
      screen.getByRole('button', { name: /filterableList.filter.label/ })
    );
    fireEvent.mouseDown(
      screen.getByRole('combobox', { name: 'giftCode.filters.status' })
    );
    fireEvent.click(
      within(screen.getByRole('listbox')).getByRole('option', {
        name: 'giftCode.status.ordered',
      })
    );

    expect(listVariables()).toEqual(
      expect.objectContaining({
        filter: { status: GiftCodeStatus.Ordered },
      })
    );
  });

  it('shows the buyer email', () => {
    renderList();

    expect(
      within(row('issued')).getByText('max@example.com')
    ).toBeInTheDocument();
  });

  it('exports the buyer email', () => {
    renderList();

    const { columns } = tableProps.current as DataTableProps<
      (typeof codes)[number]
    >;
    const buyerEmail = getExportColumns(columns, codes).find(
      ({ header }) => header === 'giftCode.list.buyerEmail'
    );

    expect(buyerEmail?.value(codes[1])).toBe('max@example.com');
  });

  it('marks issued codes that are not paid yet', () => {
    renderList();

    expect(
      within(row('unpaid')).getByText('giftCode.list.unpaid')
    ).toBeInTheDocument();
    expect(
      within(row('issued')).queryByText('giftCode.list.unpaid')
    ).not.toBeInTheDocument();
  });

  it('lets editors cancel ordered and issued codes only', () => {
    permissions.add(CanUpdateGiftCodes.id);
    renderList();

    const cancel = { name: 'giftCode.actions.cancel' };

    expect(within(orderedRow()).getByRole('button', cancel)).toBeTruthy();
    expect(within(row('issued')).getByRole('button', cancel)).toBeTruthy();
    expect(
      within(row('redeemed')).queryByRole('button', cancel)
    ).not.toBeInTheDocument();
  });

  it('hides cancel without the permission to update gift codes', () => {
    renderList();

    expect(
      screen.queryByRole('button', { name: 'giftCode.actions.cancel' })
    ).not.toBeInTheDocument();
  });

  it('cancels a code once the editor confirms', async () => {
    permissions.add(CanUpdateGiftCodes.id);
    renderList();

    fireEvent.click(
      within(row('issued')).getByRole('button', {
        name: 'giftCode.actions.cancel',
      })
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'giftCode.dialogs.cancelConfirm' })
    );

    await waitFor(() =>
      expect(mutationFor(CancelGiftCodeDocument)).toHaveBeenCalledWith({
        variables: { id: 'issued' },
      })
    );
  });

  it('offers mark as paid for unpaid codes to who may create invoices', () => {
    permissions.add(CanCreateInvoice.id);
    renderList();

    const markAsPaid = { name: 'giftCode.actions.markAsPaid' };

    expect(within(orderedRow()).getByRole('button', markAsPaid)).toBeTruthy();
    expect(within(row('unpaid')).getByRole('button', markAsPaid)).toBeTruthy();
    expect(
      within(row('issued')).queryByRole('button', markAsPaid)
    ).not.toBeInTheDocument();
    expect(
      within(row('redeemed')).queryByRole('button', markAsPaid)
    ).not.toBeInTheDocument();
  });

  it('hides mark as paid without the invoice permission', () => {
    renderList();

    expect(
      screen.queryByRole('button', { name: 'giftCode.actions.markAsPaid' })
    ).not.toBeInTheDocument();
  });

  it('marks the invoice paid without sending the renewal mail', async () => {
    permissions.add(CanCreateInvoice.id);
    renderList();

    fireEvent.click(
      within(orderedRow()).getByRole('button', {
        name: 'giftCode.actions.markAsPaid',
      })
    );
    fireEvent.click(
      screen.getByRole('button', {
        name: 'giftCode.dialogs.markAsPaidConfirm',
      })
    );

    await waitFor(() =>
      expect(mutationFor(MarkInvoiceAsPaidDocument)).toHaveBeenCalledWith({
        variables: { id: 'invoice-ordered', sendMail: false },
      })
    );
    await waitFor(() => expect(refetch).toHaveBeenCalled());
  });
});
