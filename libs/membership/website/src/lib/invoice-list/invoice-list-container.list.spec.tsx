import { waitFor } from '@testing-library/react';
import {
  mockMemberPlan,
  mockPaymentMethod,
  renderWithProviders,
} from '@wepublish/mocks/website';
import { actWait } from '@wepublish/testing';
import {
  CheckInvoiceStatusDocument,
  FullInvoiceFragment,
  InvoicesDocument,
} from '@wepublish/website/api';
import { BuilderInvoiceListProps } from '@wepublish/website/builder';

import { invoiceFixture, subscriptionFixture } from '../membership.fixtures';
import { InvoiceListContainer } from './invoice-list-container';

const plan = {
  memberPlan: mockMemberPlan(),
  paymentMethod: mockPaymentMethod(),
};
const first = subscriptionFixture(plan, { id: 'subscription-1' });
const second = subscriptionFixture(plan, { id: 'subscription-2' });
const openOfFirst = invoiceFixture(first, { id: 'invoice-1' });
const openOfSecond = invoiceFixture(second, { id: 'invoice-2' });

const checkMock = (invoice: FullInvoiceFragment) => {
  const result = vi.fn(() => ({ data: { checkInvoiceStatus: invoice } }));

  return {
    result,
    mock: {
      request: {
        query: CheckInvoiceStatusDocument,
        variables: { id: invoice.id },
      },
      result,
    },
  };
};

const ofFirst = (invoices: FullInvoiceFragment[]) =>
  invoices.filter(({ subscriptionID }) => subscriptionID === first.id);

describe('InvoiceListContainer with its own list', () => {
  it('renders the given list with the filtered invoices', async () => {
    const List = vi.fn((_: BuilderInvoiceListProps) => null);

    renderWithProviders(
      <InvoiceListContainer
        List={List}
        filter={ofFirst}
      />,
      {
        mocks: [
          {
            request: { query: InvoicesDocument },
            result: { data: { userInvoices: [openOfFirst, openOfSecond] } },
          },
          checkMock(openOfFirst).mock,
        ],
      }
    );

    await waitFor(() =>
      expect(
        List.mock.lastCall?.[0].data?.userInvoices.map(({ id }) => id)
      ).toEqual([openOfFirst.id])
    );
    expect(List.mock.lastCall?.[0].onPay).toBeInstanceOf(Function);
  });

  it('asks the payment provider only about the open invoices it shows', async () => {
    const checkFirst = checkMock(openOfFirst);
    const checkSecond = checkMock(openOfSecond);

    renderWithProviders(
      <InvoiceListContainer
        List={() => null}
        filter={ofFirst}
      />,
      {
        mocks: [
          {
            request: { query: InvoicesDocument },
            result: { data: { userInvoices: [openOfFirst, openOfSecond] } },
          },
          checkFirst.mock,
          checkSecond.mock,
        ],
      }
    );

    await waitFor(() => expect(checkFirst.result).toHaveBeenCalled());
    await actWait(100);

    expect(checkSecond.result).not.toHaveBeenCalled();
  });

  it('asks about every open invoice it shows, once each', async () => {
    const second = invoiceFixture(first, { id: 'invoice-3' });
    const checkFirst = checkMock(openOfFirst);
    const checkSecond = checkMock(second);

    renderWithProviders(<InvoiceListContainer List={() => null} />, {
      mocks: [
        {
          request: { query: InvoicesDocument },
          result: { data: { userInvoices: [openOfFirst, second] } },
        },
        checkFirst.mock,
        checkSecond.mock,
      ],
    });

    await waitFor(() => expect(checkSecond.result).toHaveBeenCalled());
    await actWait(100);

    expect(checkFirst.result).toHaveBeenCalledTimes(1);
    expect(checkSecond.result).toHaveBeenCalledTimes(1);
  });
});
