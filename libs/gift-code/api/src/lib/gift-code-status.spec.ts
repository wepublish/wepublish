import {
  deriveGiftCodeStatus,
  GiftCodeStatus,
  giftCodeStatusWhere,
} from './gift-code-status';

const now = new Date('2026-10-24T12:00:00.000Z');
const past = new Date('2026-10-01T00:00:00.000Z');
const future = new Date('2027-10-01T00:00:00.000Z');

const code = (
  overrides: Partial<{
    issuedAt: Date | null;
    expiresAt: Date | null;
    redeemedAt: Date | null;
    canceledAt: Date | null;
  }>
) => ({
  issuedAt: null,
  expiresAt: null,
  redeemedAt: null,
  canceledAt: null,
  ...overrides,
});

describe('deriveGiftCodeStatus', () => {
  it.each([
    ['nothing set', code({}), GiftCodeStatus.ordered],
    [
      'canceled before issue',
      code({ canceledAt: past }),
      GiftCodeStatus.canceled,
    ],
    [
      'canceled after issue',
      code({ issuedAt: past, canceledAt: past }),
      GiftCodeStatus.canceled,
    ],
    [
      'canceled after redemption',
      code({ issuedAt: past, redeemedAt: past, canceledAt: past }),
      GiftCodeStatus.canceled,
    ],
    [
      'redeemed after expiry',
      code({ issuedAt: past, redeemedAt: past, expiresAt: past }),
      GiftCodeStatus.redeemed,
    ],
    ['issued without expiry', code({ issuedAt: past }), GiftCodeStatus.issued],
    [
      'issued with a future expiry',
      code({ issuedAt: past, expiresAt: future }),
      GiftCodeStatus.issued,
    ],
    [
      'issued and expiring right now',
      code({ issuedAt: past, expiresAt: now }),
      GiftCodeStatus.expired,
    ],
    [
      'issued and expired',
      code({ issuedAt: past, expiresAt: past }),
      GiftCodeStatus.expired,
    ],
    [
      'not issued with a past expiry',
      code({ expiresAt: past }),
      GiftCodeStatus.ordered,
    ],
  ])('%s', (_, giftCode, status) => {
    expect(deriveGiftCodeStatus(giftCode, now)).toBe(status);
  });

  it('defaults to the current time', () => {
    expect(
      deriveGiftCodeStatus(code({ issuedAt: past, expiresAt: future }))
    ).toBe(GiftCodeStatus.issued);
  });
});

describe('giftCodeStatusWhere', () => {
  it.each([
    [GiftCodeStatus.ordered, { issuedAt: null, canceledAt: null }],
    [
      GiftCodeStatus.issued,
      {
        issuedAt: { not: null },
        canceledAt: null,
        redeemedAt: null,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
    ],
    [GiftCodeStatus.redeemed, { redeemedAt: { not: null }, canceledAt: null }],
    [GiftCodeStatus.canceled, { canceledAt: { not: null } }],
    [
      GiftCodeStatus.expired,
      {
        issuedAt: { not: null },
        canceledAt: null,
        redeemedAt: null,
        expiresAt: { lte: now },
      },
    ],
  ])('%s', (status, where) => {
    expect(giftCodeStatusWhere(status, now)).toEqual(where);
  });
});
