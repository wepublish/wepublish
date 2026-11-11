import { z } from 'zod/v4';
import { defaultIssueKey, formErrorKeys, isEmptyValue } from './error-keys';

const keyOf = (schema: z.ZodType, value: unknown) => {
  const result = z
    .object({ field: schema })
    .safeParse({ field: value }, { error: defaultIssueKey });

  return result.success ? undefined : result.error.issues[0]?.message;
};

describe('formErrorKeys', () => {
  it('is a finite list of form.errors keys', () => {
    expect(formErrorKeys.length).toBeGreaterThan(20);
    expect(new Set(formErrorKeys).size).toBe(formErrorKeys.length);
    expect(formErrorKeys.every(key => key.startsWith('form.errors.'))).toBe(
      true
    );
    expect(formErrorKeys).toEqual(
      expect.arrayContaining([
        'form.errors.required',
        'form.errors.invalid',
        'form.errors.unexpected',
        'form.errors.server',
        'form.errors.invalid_type.int',
        'form.errors.invalid_format.email',
        'form.errors.invalid_format.default',
        'form.errors.too_small.string.min',
        'form.errors.too_small.string.exact',
        'form.errors.too_big.string.max',
        'form.errors.too_small.number.inclusive',
        'form.errors.too_small.number.exclusive',
        'form.errors.too_big.date.exclusive',
      ])
    );
  });

  it('never uses a key as the parent of another key', () => {
    const parents = formErrorKeys.filter(key =>
      formErrorKeys.some(other => other.startsWith(`${key}.`))
    );

    expect(parents).toEqual([]);
  });
});

describe('isEmptyValue', () => {
  it.each<[unknown, boolean]>([
    [undefined, true],
    [null, true],
    ['', true],
    [[], true],
    [0, false],
    [false, false],
    [' ', false],
    [['a'], false],
  ])('%j → %s', (value, empty) => {
    expect(isEmptyValue(value)).toBe(empty);
  });
});

describe('defaultIssueKey', () => {
  it.each<[string, z.ZodType, unknown, string | undefined]>([
    ['empty string with min(1)', z.string().min(1), '', 'form.errors.required'],
    [
      'short string',
      z.string().min(3),
      'ab',
      'form.errors.too_small.string.min',
    ],
    ['long string', z.string().max(2), 'abc', 'form.errors.too_big.string.max'],
    [
      'exact length',
      z.string().length(3),
      'ab',
      'form.errors.too_small.string.exact',
    ],
    ['missing string', z.string(), undefined, 'form.errors.required'],
    ['wrong type', z.string(), 1, 'form.errors.invalid_type.string'],
    ['null enum', z.enum(['a', 'b']), null, 'form.errors.required'],
    [
      'unknown enum value',
      z.enum(['a', 'b']),
      'c',
      'form.errors.invalid_value',
    ],
    ['null literal', z.literal(true), null, 'form.errors.required'],
    ['empty email', z.email(), '', 'form.errors.required'],
    ['bad email', z.email(), 'x', 'form.errors.invalid_format.email'],
    ['bad url', z.url(), 'x', 'form.errors.invalid_format.url'],
    [
      'bad regex',
      z.string().regex(/^G-/),
      'x',
      'form.errors.invalid_format.regex',
    ],
    [
      'bad prefix',
      z.string().startsWith('G-'),
      'x',
      'form.errors.invalid_format.default',
    ],
    ['null number', z.number(), null, 'form.errors.required'],
    ['not an integer', z.number().int(), 1.5, 'form.errors.invalid_type.int'],
    ['not a z.int()', z.int(), 1.5, 'form.errors.invalid_type.int'],
    [
      'positive',
      z.number().positive(),
      0,
      'form.errors.too_small.number.exclusive',
    ],
    ['max', z.number().max(10), 11, 'form.errors.too_big.number.inclusive'],
    ['lt', z.number().lt(10), 10, 'form.errors.too_big.number.exclusive'],
    ['min', z.number().min(1), 0, 'form.errors.too_small.number.inclusive'],
    [
      'exact array',
      z.array(z.string()).length(2),
      ['a'],
      'form.errors.too_small.array.exact',
    ],
    [
      'exact string too long',
      z.string().length(1),
      'ab',
      'form.errors.too_big.string.exact',
    ],
    [
      'unsafe integer',
      z.int(),
      2 ** 60,
      'form.errors.too_big.number.inclusive',
    ],
    ['multiple of', z.number().multipleOf(5), 3, 'form.errors.not_multiple_of'],
    ['null date', z.date(), null, 'form.errors.required'],
    ['invalid date', z.date(), new Date('x'), 'form.errors.invalid_type.date'],
    [
      'early date',
      z.date().min(new Date(2030, 0, 1)),
      new Date(2020, 0, 1),
      'form.errors.too_small.date.inclusive',
    ],
    ['empty array', z.array(z.string()).min(1), [], 'form.errors.required'],
    [
      'short array',
      z.array(z.string()).min(2),
      ['a'],
      'form.errors.too_small.array.min',
    ],
    [
      'long array',
      z.array(z.string()).max(1),
      ['a', 'b'],
      'form.errors.too_big.array.max',
    ],
    [
      'false boolean literal',
      z.literal(true),
      false,
      'form.errors.invalid_value',
    ],
    [
      'empty union',
      z.union([z.string(), z.number()]),
      null,
      'form.errors.required',
    ],
    [
      'bad union',
      z.union([z.string(), z.number()]),
      true,
      'form.errors.invalid',
    ],
    ['own key', z.string().min(2, { error: 'my.key' }), 'a', 'my.key'],
    ['own key on type', z.string({ error: 'my.type' }), 1, 'my.type'],
    [
      'refine key',
      z.string().refine(() => false, { error: 'my.refine' }),
      'a',
      'my.refine',
    ],
    ['valid', z.string(), 'a', undefined],
  ])('%s', (_name, schema, value, key) => {
    expect(keyOf(schema, value)).toBe(key);
  });

  it('only produces keys from formErrorKeys', () => {
    const issues: z.core.$ZodRawIssue[] = [
      { code: 'invalid_type', expected: 'bigint', input: BigInt(1) },
      { code: 'too_small', origin: 'set', minimum: 2, input: new Set([1]) },
      { code: 'too_big', origin: 'file', maximum: 2, input: 1 },
      { code: 'invalid_format', format: 'cuid', input: 'x' },
      { code: 'unrecognized_keys', keys: ['x'], input: {} },
      { code: 'invalid_key', origin: 'record', issues: [], input: {} },
      {
        code: 'invalid_element',
        origin: 'set',
        key: 1,
        issues: [],
        input: new Set(),
      },
      { code: 'custom', input: 1 },
    ];

    expect(
      issues.map(defaultIssueKey).filter(key => !formErrorKeys.includes(key))
    ).toEqual([]);
  });

  it('only produces keys from formErrorKeys for every code, origin, bound and input', () => {
    const inputs: unknown[] = [
      undefined,
      null,
      '',
      [],
      'x',
      0,
      1.5,
      false,
      new Date(2030, 0, 1),
      {},
    ];
    const types: z.core.$ZodIssueInvalidType['expected'][] = [
      'string',
      'number',
      'int',
      'boolean',
      'bigint',
      'symbol',
      'null',
      'undefined',
      'date',
      'array',
      'object',
      'map',
      'set',
      'file',
      'nan',
      'never',
    ];
    const formats = [
      'email',
      'url',
      'regex',
      'uuid',
      'starts_with',
      'ends_with',
      'includes',
      'cuid',
    ];
    const origins = [
      'string',
      'array',
      'number',
      'int',
      'date',
      'bigint',
      'set',
      'file',
    ];
    const bounds = [undefined, true, false];
    const formatIssues: z.core.$ZodRawIssue[] = ['', 'x'].flatMap(input =>
      formats.map(format => ({
        code: 'invalid_format' as const,
        format,
        input,
      }))
    );
    const multipleIssues: z.core.$ZodRawIssue[] = [0, 1.5].map(input => ({
      code: 'not_multiple_of' as const,
      divisor: 2,
      input,
    }));
    const otherIssues: z.core.$ZodRawIssue[] = inputs.flatMap(input => [
      ...types.map(expected => ({
        code: 'invalid_type' as const,
        expected,
        input,
      })),
      ...origins.flatMap(origin =>
        bounds.flatMap(exact =>
          bounds.flatMap(inclusive => [
            {
              code: 'too_small' as const,
              origin,
              minimum: 1,
              exact,
              inclusive,
              input,
            },
            {
              code: 'too_big' as const,
              origin,
              maximum: 1,
              exact,
              inclusive,
              input,
            },
          ])
        )
      ),
      { code: 'invalid_value' as const, values: ['a'], input },
      { code: 'invalid_union' as const, errors: [], input },
      { code: 'custom' as const, input },
    ]);

    const issues = [...formatIssues, ...multipleIssues, ...otherIssues];
    const unknown = [...new Set(issues.map(defaultIssueKey))].filter(
      key => !formErrorKeys.includes(key)
    );

    expect(unknown).toEqual([]);
  });
});
