import {
  formatGiftCode,
  generateGiftCode,
  GIFT_CODE_ALPHABET,
  normalizeGiftCode,
} from './gift-code-generator';

describe('GIFT_CODE_ALPHABET', () => {
  it('has 31 characters without the ones that are easy to confuse', () => {
    expect(GIFT_CODE_ALPHABET).toHaveLength(31);
    expect(new Set(GIFT_CODE_ALPHABET).size).toBe(31);

    for (const confusable of ['0', 'O', '1', 'I', 'L']) {
      expect(GIFT_CODE_ALPHABET).not.toContain(confusable);
    }
  });
});

describe('generateGiftCode', () => {
  it('builds 12 characters from the alphabet', () => {
    let next = 0;
    const sequential = vi.fn((max: number) => next++ % max);

    const code = generateGiftCode(sequential);

    expect(code).toBe(GIFT_CODE_ALPHABET.slice(0, 12));
    expect(sequential).toHaveBeenCalledTimes(12);
    expect(sequential).toHaveBeenCalledWith(GIFT_CODE_ALPHABET.length);
  });

  it('never uses a character outside the alphabet', () => {
    let next = 0;
    const codes = Array.from({ length: 6 }, () =>
      generateGiftCode(max => next++ % max)
    );

    for (const code of codes) {
      expect(code).toMatch(/^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{12}$/);
      expect(code).not.toMatch(/[01OIL]/);
    }
  });

  it('uses a cryptographic random source by default', () => {
    const code = generateGiftCode();

    expect(code).toMatch(/^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{12}$/);
  });
});

describe('formatGiftCode', () => {
  it('groups the code in blocks of four', () => {
    expect(formatGiftCode('ABCDEFGHJKMN')).toBe('ABCD-EFGH-JKMN');
  });
});

describe('normalizeGiftCode', () => {
  it.each([
    ['ABCD-EFGH-JKMN', 'ABCDEFGHJKMN'],
    ['abcd efgh jkmn', 'ABCDEFGHJKMN'],
    [' abcd-EFGH - jkmn ', 'ABCDEFGHJKMN'],
    ['ABCDEFGHJKMN', 'ABCDEFGHJKMN'],
  ])('accepts %j', (input, expected) => {
    expect(normalizeGiftCode(input)).toBe(expected);
  });

  it.each([
    ['ABCD-EFGH-JKM0'],
    ['ABCD-EFGH-JKMO'],
    ['ABCD-EFGH-JKM1'],
    ['ABCD-EFGH-JKMI'],
    ['ABCD-EFGH-JKML'],
    ['ABCD-EFGH-JKM'],
    ['ABCD-EFGH-JKMNP'],
    ['ABCD_EFGH_JKMN'],
    [''],
  ])('rejects %j', input => {
    expect(normalizeGiftCode(input)).toBeNull();
  });
});
