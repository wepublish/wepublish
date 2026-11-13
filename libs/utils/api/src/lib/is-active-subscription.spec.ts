import { isActiveSubscription } from './is-active-subscription';

describe('isActiveSubscription', () => {
  beforeAll(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-15T12:00:00Z'));
  });
  afterAll(() => vi.useRealTimers());

  it('is active while paid', () => {
    expect(
      isActiveSubscription({
        startsAt: new Date('2026-01-01'),
        paidUntil: new Date('2026-07-01'),
        gracePeriod: 0,
      })
    ).toBe(true);
  });

  it('is active within the grace period after it ran out', () => {
    expect(
      isActiveSubscription({
        startsAt: new Date('2026-01-01'),
        paidUntil: new Date('2026-06-10'),
        gracePeriod: 7,
      })
    ).toBe(true);
  });

  it('is not active once the grace period is over', () => {
    expect(
      isActiveSubscription({
        startsAt: new Date('2026-01-01'),
        paidUntil: new Date('2026-06-01'),
        gracePeriod: 7,
      })
    ).toBe(false);
  });

  it('is not active before it starts, unless within the grace period', () => {
    expect(
      isActiveSubscription({
        startsAt: new Date('2026-07-01'),
        paidUntil: new Date('2026-08-01'),
        gracePeriod: 0,
      })
    ).toBe(false);
  });

  it('is not active when it was never paid', () => {
    expect(
      isActiveSubscription({
        startsAt: new Date('2026-01-01'),
        paidUntil: null,
        gracePeriod: 0,
      })
    ).toBe(false);
  });
});
