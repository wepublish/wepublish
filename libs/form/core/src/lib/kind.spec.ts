import { z } from 'zod/v4';
import {
  FORM_KIND,
  innermost,
  isCustomKind,
  resolveKind,
  unwrapStep,
  valueSchema,
  withKind,
} from './kind';

const kindOf = (schema: z.ZodType) => resolveKind(schema)?.kind;

describe('withKind', () => {
  it('marks the schema with a custom kind and params', () => {
    const tags = withKind(z.array(z.string()), 'tags', { tagType: 'Event' });

    expect(resolveKind(tags)).toMatchObject({
      kind: 'tags',
      custom: true,
      params: { tagType: 'Event' },
    });
  });

  it('keeps the kind through every chain method and wrapper', () => {
    const textarea = withKind(z.string(), 'textarea');
    const chains: z.ZodType[] = [
      textarea.min(1),
      textarea.max(3).trim(),
      textarea.refine(value => value.length > 0),
      textarea.superRefine(() => undefined),
      textarea.check(() => undefined),
      textarea.overwrite(value => value.trim()),
      textarea.meta({ label: 'x' }),
      textarea.describe('x'),
      textarea.optional(),
      textarea.nullable(),
      textarea.nullish(),
      textarea.default(''),
      textarea.prefault(''),
      textarea.readonly(),
      textarea.catch(''),
      textarea.optional().nonoptional(),
      textarea.transform(value => value.length),
      textarea.pipe(z.string()),
      textarea.brand<'Slug'>(),
      z.lazy(() => textarea),
      textarea
        .min(1)
        .refine(Boolean)
        .meta({})
        .optional()
        .nullable()
        .default(null),
      textarea.or(z.literal('')).nullish(),
    ];

    expect(chains.map(kindOf)).toEqual(chains.map(() => 'textarea'));
  });

  it('keeps meta that was set before it', () => {
    const schema = withKind(z.string().meta({ label: 'k' }), 'textarea');

    expect(schema.meta()).toEqual({ label: 'k' });
  });

  it('keeps a lazy default lazy', () => {
    let calls = 0;
    const schema = withKind(
      z.number().default(() => ++calls),
      'counter'
    );

    expect([schema.parse(undefined), schema.parse(undefined)]).toEqual([1, 2]);
  });

  it('lets the outermost mark win', () => {
    const schema = withKind(withKind(z.string(), 'inner').optional(), 'outer');

    expect(kindOf(schema)).toBe('outer');
  });

  it('writes the mark into the def under FORM_KIND', () => {
    const schema = withKind(z.string(), 'x', 1);

    expect(
      (schema._zod.def as unknown as Record<string, unknown>)[FORM_KIND]
    ).toEqual({ kind: 'x', params: 1 });
  });
});

describe('unwrapStep and innermost', () => {
  it('unwraps wrappers, pipes and lazies', () => {
    const inner = z.string();

    expect(unwrapStep(inner.optional())).toBe(inner);
    expect(unwrapStep(z.lazy(() => inner))).toBe(inner);
    expect(unwrapStep(inner)).toBeUndefined();
    expect(
      innermost(inner.optional().nullable().default(null).readonly())
    ).toBe(inner);
  });

  it('follows the input of a pipe, and the output of a preprocess', () => {
    const number = z.number();
    const string = z.string();

    expect(innermost(string.transform(value => value.length))).toBe(string);
    expect(innermost(z.preprocess(value => value, number))).toBe(number);
  });

  it('stops on recursive lazies', () => {
    const loop: z.ZodType = z.lazy(() => loop.optional());

    expect(() => innermost(loop)).not.toThrow();
  });
});

describe('valueSchema', () => {
  it('crosses a union with the empty string literal', () => {
    const regex = z.string().regex(/^G-/);

    expect(valueSchema(regex.or(z.literal('')).nullish())).toBe(regex);
    expect(valueSchema(z.literal('').or(regex))).toBe(regex);
  });

  it('stops at other unions', () => {
    const union = z.union([z.string(), z.number()]);

    expect(valueSchema(union.optional())).toBe(union);
  });
});

describe('resolveKind', () => {
  enum GoalType {
    Revenue = 'revenue',
    Subscribers = 'subscribers',
  }

  it.each<[string, z.ZodType, string | undefined]>([
    ['string', z.string(), 'string'],
    ['z.email()', z.email(), 'string'],
    ['string().email()', z.string().email(), 'string'],
    ['z.url()', z.url(), 'string'],
    ['z.uuid()', z.uuid(), 'string'],
    ['stringbool', z.stringbool(), 'string'],
    ['transform', z.string().transform(value => value.length), 'string'],
    ['number', z.number(), 'number'],
    ['z.int()', z.int().min(0), 'number'],
    ['number().int()', z.number().int().min(0), 'number'],
    ['preprocess', z.preprocess(value => value, z.number()), 'number'],
    ['boolean', z.boolean(), 'boolean'],
    ['date', z.date(), 'date'],
    ['coerced date', z.coerce.date(), 'date'],
    ['enum', z.enum(['a', 'b']).nullable(), 'enum'],
    ['TS enum', z.enum(GoalType), 'enum'],
    ['literal', z.literal('a'), 'enum'],
    ['multi literal', z.literal(['a', 'b']), 'enum'],
    ['literal union', z.union([z.literal('a'), z.literal('b')]), 'enum'],
    ['enum or empty', z.enum(['a', 'b']).or(z.literal('')), 'enum'],
    [
      'regex or empty',
      z.string().regex(/x/).or(z.literal('')).nullish(),
      'string',
    ],
    ['object', z.object({ a: z.string() }), 'object'],
    ['strict object', z.strictObject({ a: z.string() }), 'object'],
    [
      'discriminated union',
      z.discriminatedUnion('t', [
        z.object({ t: z.literal('a') }),
        z.object({ t: z.literal('b') }),
      ]),
      'discriminatedUnion',
    ],
    ['array of objects', z.array(z.object({ a: z.string() })), 'array'],
    [
      'array of discriminated unions',
      z.array(
        z.discriminatedUnion('t', [
          z.object({ t: z.literal('a') }),
          z.object({ t: z.literal('b') }),
        ])
      ),
      'array',
    ],
    ['array of custom kinds', z.array(withKind(z.string(), 'page')), 'array'],
    ['array of enums', z.array(z.enum(['a'])), 'enumArray'],
    ['enum().array()', z.enum(['a', 'b']).array(), 'enumArray'],
    ['array of strings', z.array(z.string()), 'primitiveArray'],
    [
      'array of optional strings',
      z.array(z.string().optional()),
      'primitiveArray',
    ],
    ['array of optional numbers', z.array(z.number().optional()), undefined],
    ['array of dates', z.array(z.date()), undefined],
    ['array of booleans', z.array(z.boolean()), undefined],
    ['custom', z.custom(), undefined],
    ['any', z.any(), undefined],
    ['record', z.record(z.string(), z.string()), undefined],
    ['file', z.file(), undefined],
    ['mixed union', z.union([z.string(), z.number()]), undefined],
    ['array of records', z.array(z.record(z.string(), z.string())), undefined],
  ])('%s', (_name, schema, kind) => {
    expect(kindOf(schema)).toBe(kind);
  });

  it('reports the innermost value schema', () => {
    const inner = z.string().regex(/x/);

    expect(resolveKind(inner.or(z.literal('')).nullish())?.inner).toBe(inner);
  });

  it('does not loop on recursive arrays', () => {
    const list: z.ZodType = z.lazy(() => z.array(list));

    expect(() => resolveKind(list)).not.toThrow();
  });
});

describe('isCustomKind', () => {
  it('is true only for withKind schemas', () => {
    expect(
      isCustomKind(withKind(z.object({ id: z.string() }), 'image').nullable())
    ).toBe(true);
    expect(isCustomKind(z.object({ id: z.string() }))).toBe(false);
    expect(isCustomKind(z.custom())).toBe(false);
  });
});
