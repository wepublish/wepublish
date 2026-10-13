import {
  DEFAULT_IMPERSONATION_MINUTES,
  ImpersonationError,
  MAX_IMPERSONATION_MINUTES,
  assertDuration,
  assertReason,
  isImpersonationEnabled,
} from './impersonation';

describe('assertDuration', () => {
  it('accepts the default', () => {
    expect(assertDuration(DEFAULT_IMPERSONATION_MINUTES)).toBe(60);
  });

  it('accepts exactly the maximum', () => {
    expect(assertDuration(MAX_IMPERSONATION_MINUTES)).toBe(720);
  });

  it('refuses one minute past the maximum rather than clamping', () => {
    expect(() => assertDuration(721)).toThrow(ImpersonationError);
  });

  it('refuses zero, negative and fractional values', () => {
    expect(() => assertDuration(0)).toThrow(ImpersonationError);
    expect(() => assertDuration(-5)).toThrow(ImpersonationError);
    expect(() => assertDuration(1.5)).toThrow(ImpersonationError);
  });
});

describe('assertReason', () => {
  it('keeps a real reason, trimmed', () => {
    expect(assertReason('  Ticket 4711  ')).toBe('Ticket 4711');
  });

  it('refuses an empty or whitespace reason', () => {
    expect(() => assertReason('')).toThrow(ImpersonationError);
    expect(() => assertReason('   ')).toThrow(ImpersonationError);
  });

  it('refuses a token gesture like a single character', () => {
    expect(() => assertReason('x')).toThrow(ImpersonationError);
  });

  it('caps an overlong reason', () => {
    expect(assertReason('a'.repeat(900))).toHaveLength(500);
  });
});

describe('isImpersonationEnabled', () => {
  it('is on when unset — a medium opts out, not in', () => {
    expect(isImpersonationEnabled({})).toBe(true);
  });

  it('is off only when a medium says so', () => {
    expect(isImpersonationEnabled({ WEP_ONE_IMPERSONATION: 'false' })).toBe(
      false
    );
    expect(isImpersonationEnabled({ WEP_ONE_IMPERSONATION: '0' })).toBe(false);
    expect(isImpersonationEnabled({ WEP_ONE_IMPERSONATION: 'off' })).toBe(
      false
    );
  });

  it('accepts the off values regardless of casing and padding', () => {
    expect(isImpersonationEnabled({ WEP_ONE_IMPERSONATION: 'FALSE' })).toBe(
      false
    );
    expect(isImpersonationEnabled({ WEP_ONE_IMPERSONATION: '  false  ' })).toBe(
      false
    );
  });

  it('stays on for anything that does not mean off', () => {
    for (const value of ['true', 'TRUE', '1', 'yes', '', 'nonsense']) {
      expect(isImpersonationEnabled({ WEP_ONE_IMPERSONATION: value })).toBe(
        true
      );
    }
  });
});
