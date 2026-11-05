import { mockMemberPlan, mockPaymentMethod } from '@wepublish/mocks/website';
import { SubscriptionDeactivationReason } from '@wepublish/website/api';

import { isInvoiceDue } from './invoice-due';
import { invoiceFixture, subscriptionFixture } from './membership.fixtures';

const subscription = subscriptionFixture({
  memberPlan: mockMemberPlan(),
  paymentMethod: mockPaymentMethod(),
});

const invoice = (
  id: string,
  dueAt: string,
  state: 'open' | 'paid' | 'canceled',
  of = subscription
) =>
  invoiceFixture(of, {
    id,
    dueAt,
    paidAt: state === 'paid' ? dueAt : null,
    canceledAt: state === 'canceled' ? dueAt : null,
  });

describe('isInvoiceDue', () => {
  it('is due while open and nothing later has been paid', () => {
    const open = invoice('2026', '2026-10-07T00:00:00.000Z', 'open');
    const paid = invoice('2025', '2025-10-07T00:00:00.000Z', 'paid');

    expect(isInvoiceDue(open, [open, paid])).toBe(true);
  });

  it.each([
    ['paid', 'paid'],
    ['cancelled', 'canceled'],
  ] as const)('is not due once %s', (_, state) => {
    const settled = invoice('2026', '2026-10-07T00:00:00.000Z', state);

    expect(isInvoiceDue(settled, [settled])).toBe(false);
  });

  // the reader kept paying after it: it is left over, not owed
  it('is not due when a later invoice of its subscription has been paid', () => {
    const old = invoice('2023', '2023-10-07T00:00:00.000Z', 'open');
    const later = invoice('2024', '2024-10-07T00:00:00.000Z', 'paid');

    expect(isInvoiceDue(old, [old, later])).toBe(false);
  });

  it('stays due when only another subscription paid later', () => {
    const old = invoice('2023', '2023-10-07T00:00:00.000Z', 'open');
    const other = invoice('other-2024', '2024-10-07T00:00:00.000Z', 'paid', {
      ...subscription,
      id: 'subscription-2',
    });

    expect(isInvoiceDue(old, [old, other])).toBe(true);
  });

  it('is not due once its subscription has ended', () => {
    const ended = {
      ...subscription,
      isActive: false,
      deactivation: {
        __typename: 'SubscriptionDeactivation' as const,
        date: '2025-01-01T00:00:00.000Z',
        reason: SubscriptionDeactivationReason.InvoiceNotPaid,
      },
    };
    const open = invoice('2024', '2024-10-07T00:00:00.000Z', 'open', ended);

    expect(isInvoiceDue(open, [open])).toBe(false);
  });

  it('stays due while a cancelled subscription is still running', () => {
    const running = {
      ...subscription,
      isActive: true,
      deactivation: {
        __typename: 'SubscriptionDeactivation' as const,
        date: '2032-01-01T00:00:00.000Z',
        reason: SubscriptionDeactivationReason.UserSelfDeactivated,
      },
    };
    const open = invoice('2026', '2026-10-07T00:00:00.000Z', 'open', running);

    expect(isInvoiceDue(open, [open])).toBe(true);
  });
});
