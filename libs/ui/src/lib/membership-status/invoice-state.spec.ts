import { getInvoiceState, isInvoiceOpen } from './invoice-state';

describe('getInvoiceState', () => {
  it('is paid once paidAt is set', () => {
    expect(getInvoiceState({ paidAt: '2026-01-02', canceledAt: null })).toBe(
      'paid'
    );
  });

  it('is paid even when it was also cancelled', () => {
    expect(
      getInvoiceState({ paidAt: '2026-01-02', canceledAt: '2026-01-03' })
    ).toBe('paid');
  });

  it('is canceled when cancelled and not paid', () => {
    expect(getInvoiceState({ paidAt: null, canceledAt: '2026-01-03' })).toBe(
      'canceled'
    );
  });

  it('is unpaid otherwise', () => {
    expect(getInvoiceState({ paidAt: null, canceledAt: null })).toBe('unpaid');
  });
});

describe('isInvoiceOpen', () => {
  it('is open only when neither paid nor cancelled', () => {
    expect(isInvoiceOpen({ paidAt: null, canceledAt: null })).toBe(true);
    expect(isInvoiceOpen({ paidAt: '2026-01-02', canceledAt: null })).toBe(
      false
    );
    expect(isInvoiceOpen({ paidAt: null, canceledAt: '2026-01-03' })).toBe(
      false
    );
  });
});
