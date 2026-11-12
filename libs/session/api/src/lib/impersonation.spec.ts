import {
  DEFAULT_IMPERSONATION_MINUTES,
  ImpersonationError,
  MAX_IMPERSONATION_MINUTES,
  assertDuration,
  assertReason,
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
