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
  CreateGiftCodesDocument,
  GiftCodeListDocument,
  GiftCodeOfferListDocument,
  GiftCodeSource,
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
  useMutation: (
    document: unknown,
    options?: { onCompleted?: (data: unknown) => void }
  ) => [
    async (...args: unknown[]) => {
      const result = await mutationFor(document)(...args);
      options?.onCompleted?.(result.data);

      return result;
    },
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
  source: GiftCodeSource.Purchase,
  recipientName: 'Anna',
  buyerId: 'user-1',
  buyer: {
    id: 'user-1',
    name: 'Muster',
    firstName: 'Max',
  },
  redeemedBy: null,
  redeemedInvoice: null,
  createdBy: null,
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
  code('redeemed', GiftCodeStatus.Redeemed, {
    redeemedBy: { id: 'user-2', name: 'Beispiel', firstName: 'Erika' },
    redeemedInvoice: {
      id: 'invoice-paid-1',
      subscriptionID: 'subscription-9',
      createdAt: '2026-10-20T08:00:00.000Z',
    },
  }),
  code('admin', GiftCodeStatus.Issued, {
    source: GiftCodeSource.Admin,
    paid: null,
    amount: null,
    currency: null,
    invoiceId: null,
    recipientName: null,
    buyerId: null,
    buyer: null,
    createdBy: { id: 'admin-1', name: 'Redaktion', firstName: 'Rita' },
  }),
];

const offers = [
  { id: 'offer-1', name: 'Ein Jahr schenken', active: true },
  { id: 'offer-2', name: 'Altes Angebot', active: false },
];

const columnsOf = () =>
  (tableProps.current as DataTableProps<(typeof codes)[number]>).columns;

const choose = (combobox: string, option: string) => {
  fireEvent.mouseDown(screen.getByRole('combobox', { name: combobox }));
  fireEvent.click(
    within(screen.getByRole('listbox')).getByRole('option', { name: option })
  );
};

const openFilters = () =>
  fireEvent.click(
    screen.getByRole('button', { name: /filterableList.filter.label/ })
  );

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
  mutationFor(CreateGiftCodesDocument).mockReset();
  mutationFor(CreateGiftCodesDocument).mockImplementation(
    async ({ variables }: { variables: { count: number } }) => ({
      data: {
        createGiftCodes: Array.from({ length: variables.count }, (_, index) =>
          code(`new${index}`, GiftCodeStatus.Issued, {
            code: `NEWC-ODE0-000${index}`,
          })
        ),
      },
    })
  );
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
    : document === GiftCodeOfferListDocument ?
      {
        data: { giftCodeOffers: { nodes: offers, totalCount: offers.length } },
        loading: false,
        refetch: vi.fn(),
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

  it.each([
    [{}, 'giftCode.filters.unpaid', { paid: false }],
    [{}, 'giftCode.filters.paid', { paid: true }],
    [{ paid: false }, 'giftCode.filters.allPayments', {}],
  ])(
    'filters %j by the payment option %s',
    (initialFilter, option, expected) => {
      localStorage.setItem(
        'wepublish:editor:listState:giftCodes',
        JSON.stringify({ filter: initialFilter })
      );
      renderList();

      openFilters();
      choose('giftCode.filters.payment', option);

      expect(listVariables()).toEqual(
        expect.objectContaining({ filter: expected })
      );
    }
  );

  it('combines the payment filter with the status filter', () => {
    renderList();

    openFilters();
    choose('giftCode.filters.status', 'giftCode.status.issued');
    choose('giftCode.filters.payment', 'giftCode.filters.unpaid');

    expect(listVariables()).toEqual(
      expect.objectContaining({
        filter: { status: GiftCodeStatus.Issued, paid: false },
      })
    );
  });

  it('remembers the payment filter', () => {
    const { unmount } = renderList();

    openFilters();
    choose('giftCode.filters.payment', 'giftCode.filters.unpaid');
    unmount();
    mockedUseQuery.mockClear();
    renderList();

    expect(listVariables()).toEqual(
      expect.objectContaining({ filter: { paid: false } })
    );
  });

  it('has no buyer email column', () => {
    renderList();

    const headers = getExportColumns(columnsOf(), codes).map(
      ({ header }) => header
    );

    expect(headers).not.toContain('giftCode.list.buyerEmail');
  });

  it('shows the redeemer right after the buyer', () => {
    renderList();

    const ids = columnsOf().map(({ id }) => id);

    expect(ids.indexOf('redeemedby')).toBe(ids.indexOf('buyer') + 1);
    expect(
      within(row('redeemed')).getByRole('link', { name: 'Erika Beispiel' })
    ).toHaveAttribute('href', '/users/edit/user-2');
  });

  it('exports the redeemer', () => {
    renderList();

    const redeemer = getExportColumns(columnsOf(), codes).find(
      ({ header }) => header === 'giftCode.list.redeemedBy'
    );

    expect(redeemer?.value(codes[3])).toBe('Erika Beispiel');
    expect(redeemer?.value(codes[1])).toBeNull();
  });

  it('links the subscription whose invoice a code paid next to the redeemer', () => {
    renderList();

    const ids = columnsOf().map(({ id }) => id);

    expect(ids.indexOf('paidinvoice')).toBe(ids.indexOf('redeemedby') + 1);
    expect(
      within(row('redeemed')).getByRole('link', {
        name: 'giftCode.list.paidInvoiceLink',
      })
    ).toHaveAttribute('href', '/subscriptions/edit/subscription-9');
    expect(
      within(row('issued')).queryByText('giftCode.list.paidInvoiceLink')
    ).not.toBeInTheDocument();
  });

  it('exports the date of the invoice a code paid', () => {
    renderList();

    const paidInvoice = getExportColumns(columnsOf(), codes).find(
      ({ header }) => header === 'giftCode.list.paidInvoice'
    );

    expect(paidInvoice?.value(codes[3])).toEqual(
      new Date('2026-10-20T08:00:00.000Z')
    );
    expect(paidInvoice?.value(codes[1])).toBeNull();
  });

  it('labels the recipient column with the recipient name', () => {
    renderList();

    expect(columnsOf().find(({ id }) => id === 'recipient')?.label).toBe(
      'giftCode.list.recipientName'
    );
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

  it('filters by source', () => {
    renderList();

    openFilters();
    choose('giftCode.filters.source', 'giftCode.source.admin');

    expect(listVariables()).toEqual(
      expect.objectContaining({ filter: { source: GiftCodeSource.Admin } })
    );
  });

  it('shows and exports the source', () => {
    renderList();

    expect(
      within(row('admin')).getByText('giftCode.source.admin')
    ).toBeTruthy();
    expect(
      within(row('issued')).getByText('giftCode.source.purchase')
    ).toBeTruthy();

    const source = getExportColumns(columnsOf(), codes).find(
      ({ header }) => header === 'giftCode.list.source'
    );
    expect(source?.value(codes[4])).toBe('giftCode.source.admin');
  });

  it('shows the admin who created a code in the buyer column', () => {
    renderList();

    expect(
      within(row('admin')).getByRole('link', { name: 'Rita Redaktion' })
    ).toHaveAttribute('href', '/users/edit/admin-1');
    expect(
      within(row('admin')).getByText('giftCode.list.createdBy')
    ).toBeTruthy();
  });

  it('shows no payment details and no recipient for an admin code', () => {
    permissions.add(CanCreateInvoice.id);
    renderList();

    const columns = columnsOf();
    const render = (id: string) =>
      columns.find(column => column.id === id)?.render(codes[4]);

    expect(render('paid')).toBe('–');
    expect(render('amount')).toBe('–');
    expect(render('recipient')).toBe('–');
    expect(
      within(row('admin')).queryByText('giftCode.list.unpaid')
    ).not.toBeInTheDocument();
    expect(
      within(row('admin')).queryByRole('button', {
        name: 'giftCode.actions.markAsPaid',
      })
    ).not.toBeInTheDocument();
  });

  describe('creating codes', () => {
    const openCreate = () =>
      fireEvent.click(
        screen.getByRole('button', { name: 'giftCode.create.open' })
      );

    const dialog = () => screen.getByRole('dialog');

    const fill = ({
      offer = 'Ein Jahr schenken',
      count = '3',
      recipientName,
    }: {
      offer?: string | RegExp;
      count?: string;
      recipientName?: string;
    }) => {
      fireEvent.mouseDown(
        within(dialog()).getByRole('combobox', {
          name: /giftCode.create.offer/,
        })
      );
      fireEvent.click(
        within(screen.getByRole('listbox')).getByRole('option', {
          name: offer,
        })
      );
      fireEvent.change(
        within(dialog()).getByRole('spinbutton', {
          name: /giftCode.create.count/,
        }),
        { target: { value: count } }
      );

      if (recipientName !== undefined) {
        fireEvent.change(
          within(dialog()).getByRole('textbox', {
            name: /giftCode.create.recipientName/,
          }),
          { target: { value: recipientName } }
        );
      }
    };

    const submit = () =>
      fireEvent.click(
        within(dialog()).getByRole('button', {
          name: 'giftCode.create.submit',
        })
      );

    it('is hidden without the permission to update gift codes', () => {
      renderList();

      expect(
        screen.queryByRole('button', { name: 'giftCode.create.open' })
      ).not.toBeInTheDocument();
    });

    it('creates codes for the chosen offer and lists them', async () => {
      permissions.add(CanUpdateGiftCodes.id);
      renderList();

      openCreate();
      fill({ count: '2', recipientName: '  Anna  ' });
      submit();

      await waitFor(() =>
        expect(mutationFor(CreateGiftCodesDocument)).toHaveBeenCalledWith({
          variables: { offerId: 'offer-1', count: 2, recipientName: 'Anna' },
        })
      );
      expect(await within(dialog()).findByText('NEWC-ODE0-0000')).toBeTruthy();
      expect(within(dialog()).getByText('NEWC-ODE0-0001')).toBeTruthy();
      expect(refetch).toHaveBeenCalled();
    });

    it.each([undefined, '', '   '])(
      'sends no recipient name for %j',
      async recipientName => {
        permissions.add(CanUpdateGiftCodes.id);
        renderList();

        openCreate();
        fill({ count: '1', recipientName });
        submit();

        await waitFor(() =>
          expect(mutationFor(CreateGiftCodesDocument)).toHaveBeenCalledWith({
            variables: { offerId: 'offer-1', count: 1, recipientName: null },
          })
        );
      }
    );

    it('offers inactive offers too', async () => {
      permissions.add(CanUpdateGiftCodes.id);
      renderList();

      openCreate();
      fill({ offer: /Altes Angebot/, count: '1' });
      submit();

      expect(
        within(dialog()).getByRole('combobox', {
          name: /giftCode.create.offer/,
        })
      ).toHaveTextContent('Altes Angebot (giftCode.create.inactiveOffer)');
      await waitFor(() =>
        expect(mutationFor(CreateGiftCodesDocument)).toHaveBeenCalledWith({
          variables: { offerId: 'offer-2', count: 1, recipientName: null },
        })
      );
    });

    it.each(['0', '501', '1.5', ''])('rejects a count of %j', async count => {
      permissions.add(CanUpdateGiftCodes.id);
      renderList();

      openCreate();
      fill({ count });
      submit();

      expect(
        await within(dialog()).findByText('giftCode.create.countInvalid')
      ).toBeTruthy();
      expect(mutationFor(CreateGiftCodesDocument)).not.toHaveBeenCalled();
    });

    it('requires an offer', async () => {
      permissions.add(CanUpdateGiftCodes.id);
      renderList();

      openCreate();
      submit();

      expect(
        await within(dialog()).findByText('giftCode.create.offerRequired')
      ).toBeTruthy();
      expect(mutationFor(CreateGiftCodesDocument)).not.toHaveBeenCalled();
    });

    it('copies the created codes', async () => {
      const writeText = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText },
        configurable: true,
      });
      permissions.add(CanUpdateGiftCodes.id);
      renderList();

      openCreate();
      fill({ count: '2' });
      submit();
      fireEvent.click(
        await within(dialog()).findByRole('button', {
          name: 'giftCode.create.copy',
        })
      );

      expect(writeText).toHaveBeenCalledWith('NEWC-ODE0-0000\nNEWC-ODE0-0001');
    });
  });
});
