import { z } from 'zod/v4';
import { fieldInfo, fieldOptions } from './field-info';
import { withKind } from './kind';
import { schemaAt } from './schema-at';

describe('fieldInfo', () => {
  it.each<[string, z.ZodType, object]>([
    ['plain string', z.string(), {}],
    [
      'string length',
      z.string().min(3).max(5).optional(),
      { minLength: 3, maxLength: 5 },
    ],
    ['exact length', z.string().length(3), { minLength: 3, maxLength: 3 }],
    ['email', z.email().nullish(), { format: 'email' }],
    ['url', z.url(), { format: 'url' }],
    [
      'regex',
      z.string().regex(/^G-/).regex(/x$/),
      { format: 'regex', patterns: [/^G-/, /x$/] },
    ],
    [
      'regex or empty',
      z.string().regex(/^G-/).or(z.literal('')).nullish(),
      { format: 'regex', patterns: [/^G-/] },
    ],
    ['number range', z.number().min(1).max(10), { minimum: 1, maximum: 10 }],
    [
      'positive',
      z.number().positive().lt(5),
      { exclusiveMinimum: 0, exclusiveMaximum: 5 },
    ],
    ['multiple of', z.number().multipleOf(5), { multipleOf: 5 }],
    ['integer', z.number().int().min(0), { integer: true, minimum: 0 }],
    ['z.int()', z.int(), { integer: true }],
    [
      'array length',
      z.array(z.string()).min(1).max(3),
      { minLength: 1, maxLength: 3 },
    ],
    [
      'date range',
      z.date().min(new Date(2030, 0, 1)),
      { minimum: new Date(2030, 0, 1) },
    ],
    [
      'kinded',
      withKind(z.string().max(10), 'textarea').optional(),
      { maxLength: 10 },
    ],
    ['enum', z.enum(['a', 'b']), {}],
  ])('%s', (_name, schema, info) => {
    expect(fieldInfo(schema)).toEqual(info);
  });
});

describe('fieldOptions', () => {
  enum GoalType {
    Revenue = 'revenue',
    Subscribers = 'subscribers',
  }

  enum Level {
    Low = 1,
    High = 2,
  }

  it.each<[string, z.ZodType, unknown[]]>([
    ['enum', z.enum(['a', 'b']).nullable(), ['a', 'b']],
    ['TS enum', z.enum(GoalType), ['revenue', 'subscribers']],
    ['numeric TS enum', z.enum(Level), [1, 2]],
    ['literal', z.literal('a'), ['a']],
    ['multi literal', z.literal(['a', 'b']), ['a', 'b']],
    [
      'literal union',
      z.union([z.literal('a'), z.literal(2), z.literal(true)]),
      ['a', 2, true],
    ],
    [
      'enum or empty',
      z.enum(['a', 'b']).or(z.literal('')).nullish(),
      ['a', 'b'],
    ],
    ['literal or empty', z.literal('a').or(z.literal('')), ['a']],
    ['enum array', z.array(z.enum(['x', 'y'])).optional(), ['x', 'y']],
    ['string', z.string(), []],
    ['boolean', z.boolean(), []],
  ])('lists the values of %s', (_name, schema, values) => {
    expect(fieldOptions(schema).map(option => option.value)).toEqual(values);
  });

  it('builds label keys from optionLabelPrefix', () => {
    const schema = z
      .enum(['ALL', 'LOGGED_IN'])
      .meta({ optionLabelPrefix: 'banner.form.loginStatus.' });

    expect(fieldOptions(schema)).toEqual([
      { value: 'ALL', labelKey: 'banner.form.loginStatus.ALL' },
      { value: 'LOGGED_IN', labelKey: 'banner.form.loginStatus.LOGGED_IN' },
    ]);
  });

  it('has no label key without a prefix', () => {
    expect(fieldOptions(z.enum(['a']))).toEqual([
      { value: 'a', labelKey: undefined },
    ]);
  });

  it('reads the prefix of an enum array from the array or its element', () => {
    const onArray = z
      .array(z.enum(['a']))
      .meta({ optionLabelPrefix: 'array.' });
    const onElement = z.array(
      z.enum(['a']).meta({ optionLabelPrefix: 'element.' })
    );

    expect(fieldOptions(onArray)).toEqual([
      { value: 'a', labelKey: 'array.a' },
    ]);
    expect(fieldOptions(onElement)).toEqual([
      { value: 'a', labelKey: 'element.a' },
    ]);
  });

  it('lists every type of a discriminated union for its discriminator', () => {
    const schema = z.object({
      link: z.discriminatedUnion('type', [
        z.object({
          type: z.literal('page').meta({ optionLabelPrefix: 'link.type_' }),
        }),
        z.object({ type: z.literal('external') }),
      ]),
    });

    expect(fieldOptions(schemaAt(schema, 'link.type') ?? z.never())).toEqual([
      { value: 'page', labelKey: 'link.type_page' },
      { value: 'external', labelKey: 'link.type_external' },
    ]);
  });
});
