import { shouldOfferMailOptOut } from './invoiceListPanel';

const period = (invoiceID: string, startsAt: string) => ({
  invoiceID,
  startsAt,
});

describe('shouldOfferMailOptOut', () => {
  it('offers the opt-out when the subscription has an earlier period', () => {
    const periods = [
      period('inv-1', '2026-01-01T00:00:00.000Z'),
      period('inv-2', '2026-02-01T00:00:00.000Z'),
    ];

    expect(shouldOfferMailOptOut(periods, 'inv-2')).toBe(true);
  });

  it('hides the opt-out for the first period of a subscription', () => {
    const periods = [
      period('inv-1', '2026-01-01T00:00:00.000Z'),
      period('inv-2', '2026-02-01T00:00:00.000Z'),
    ];

    expect(shouldOfferMailOptOut(periods, 'inv-1')).toBe(false);
  });

  it('offers the opt-out while the periods are still loading', () => {
    expect(shouldOfferMailOptOut(undefined, 'inv-1')).toBe(true);
  });

  it('offers the opt-out when no period matches the invoice', () => {
    const periods = [period('inv-1', '2026-01-01T00:00:00.000Z')];

    expect(shouldOfferMailOptOut(periods, 'inv-unknown')).toBe(true);
  });

  it('compares periods by date rather than by list order', () => {
    const periods = [
      period('inv-2', '2026-02-01T00:00:00.000Z'),
      period('inv-1', '2026-01-01T00:00:00.000Z'),
    ];

    expect(shouldOfferMailOptOut(periods, 'inv-1')).toBe(false);
    expect(shouldOfferMailOptOut(periods, 'inv-2')).toBe(true);
  });
});
