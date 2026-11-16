import { z } from 'zod/v4';
import { withKind } from './kind';
import type { CustomKindOf, KindOf, KindParamsOf, Unwrap } from './kind-types';

declare function kindOf<S>(schema: S): KindOf<S>;
declare function kindParamsOf<S>(schema: S): KindParamsOf<S>;
declare function customKindOf<S>(schema: S): CustomKindOf<S>;
declare function unwrapped<S>(schema: S): Unwrap<S>;
declare function inputOf<S extends z.ZodType>(schema: S): z.input<S>;
declare function outputOf<S extends z.ZodType>(schema: S): z.output<S>;

const textarea = withKind(z.string(), 'textarea');
const tags = withKind(z.array(z.string()), 'tags', {
  tagType: 'Event' as const,
});

enum GoalType {
  Revenue = 'revenue',
  Subscribers = 'subscribers',
}

describe('KindOf follows a custom kind through every chain method', () => {
  it('keeps the kind on the marked schema', () => {
    expectTypeOf(kindOf(textarea)).toEqualTypeOf<'textarea'>();
  });

  it('keeps the kind through checks, meta and brand', () => {
    const min = textarea.min(1);
    const maxTrim = textarea.max(3).trim();
    const refine = textarea.refine(value => value.length > 0);
    const superRefine = textarea.superRefine(() => undefined);
    const check = textarea.check(() => undefined);
    const overwrite = textarea.overwrite(value => value.trim());
    const meta = textarea.meta({ title: 'x' });
    const describe = textarea.describe('x');
    const brand = textarea.brand<'Slug'>();

    expectTypeOf(kindOf(min)).toEqualTypeOf<'textarea'>();
    expectTypeOf(kindOf(maxTrim)).toEqualTypeOf<'textarea'>();
    expectTypeOf(kindOf(refine)).toEqualTypeOf<'textarea'>();
    expectTypeOf(kindOf(superRefine)).toEqualTypeOf<'textarea'>();
    expectTypeOf(kindOf(check)).toEqualTypeOf<'textarea'>();
    expectTypeOf(kindOf(overwrite)).toEqualTypeOf<'textarea'>();
    expectTypeOf(kindOf(meta)).toEqualTypeOf<'textarea'>();
    expectTypeOf(kindOf(describe)).toEqualTypeOf<'textarea'>();
    expectTypeOf(kindOf(brand)).toEqualTypeOf<'textarea'>();
  });

  it('keeps the kind through wrappers', () => {
    const optional = textarea.optional();
    const nullable = textarea.nullable();
    const nullish = textarea.nullish();
    const withDefault = textarea.default('');
    const prefault = textarea.prefault('');
    const readonly = textarea.readonly();
    const withCatch = textarea.catch('');
    const nonoptional = textarea.optional().nonoptional();
    const lazy = z.lazy(() => textarea);
    const deep = textarea
      .min(1)
      .refine(Boolean)
      .meta({})
      .optional()
      .nullable()
      .default(null);
    const markedOptional = withKind(z.string().optional(), 'textarea');

    expectTypeOf(kindOf(optional)).toEqualTypeOf<'textarea'>();
    expectTypeOf(kindOf(nullable)).toEqualTypeOf<'textarea'>();
    expectTypeOf(kindOf(nullish)).toEqualTypeOf<'textarea'>();
    expectTypeOf(kindOf(withDefault)).toEqualTypeOf<'textarea'>();
    expectTypeOf(kindOf(prefault)).toEqualTypeOf<'textarea'>();
    expectTypeOf(kindOf(readonly)).toEqualTypeOf<'textarea'>();
    expectTypeOf(kindOf(withCatch)).toEqualTypeOf<'textarea'>();
    expectTypeOf(kindOf(nonoptional)).toEqualTypeOf<'textarea'>();
    expectTypeOf(kindOf(lazy)).toEqualTypeOf<'textarea'>();
    expectTypeOf(kindOf(deep)).toEqualTypeOf<'textarea'>();
    expectTypeOf(kindOf(markedOptional)).toEqualTypeOf<'textarea'>();
  });

  it('keeps the kind through pipes and the empty string union', () => {
    const transform = textarea.transform(value => value.length);
    const pipe = textarea.pipe(z.string());
    const orEmpty = textarea.or(z.literal('')).nullish();

    expectTypeOf(kindOf(transform)).toEqualTypeOf<'textarea'>();
    expectTypeOf(kindOf(pipe)).toEqualTypeOf<'textarea'>();
    expectTypeOf(kindOf(orEmpty)).toEqualTypeOf<'textarea'>();
  });

  it('puts .array() on the element, so the array stays structural', () => {
    const array = textarea.array();

    expectTypeOf(kindOf(array)).toEqualTypeOf<'array'>();
  });

  it('keeps the params literal', () => {
    const tagsMin = tags.min(1).optional();

    expectTypeOf(kindOf(tagsMin)).toEqualTypeOf<'tags'>();
    expectTypeOf(kindParamsOf(tagsMin)).toEqualTypeOf<{ tagType: 'Event' }>();
    expectTypeOf(kindParamsOf(textarea.min(1))).toEqualTypeOf<undefined>();
  });

  it('has no custom kind on plain schemas', () => {
    expectTypeOf(customKindOf(z.string())).toBeNever();
  });
});

describe('KindOf derives structural kinds from the def', () => {
  const kinds = {
    string: z.string(),
    email: z.email(),
    stringEmail: z.string().email(),
    url: z.url(),
    uuid: z.uuid(),
    stringbool: z.stringbool(),
    transformed: z.string().transform(value => value.length),
    number: z.number(),
    int: z.int(),
    numberInt: z.number().int().min(0),
    preprocess: z.preprocess(value => value, z.number()),
    boolean: z.boolean(),
    date: z.date(),
    coercedDate: z.coerce.date(),
    enum: z.enum(['a', 'b']),
    tsEnum: z.enum(GoalType),
    nativeEnum: z.nativeEnum(GoalType),
    literal: z.literal('a'),
    multiLiteral: z.literal(['a', 'b']),
    literalUnion: z.union([z.literal('a'), z.literal('b')]),
    enumOrEmpty: z.enum(['a', 'b']).or(z.literal('')),
    regexOrEmpty: z.string().regex(/x/).or(z.literal('')).nullish(),
    urlOrEmpty: z.url().or(z.literal('')).nullish(),
    object: z.object({ a: z.string() }),
    strictObject: z.strictObject({ a: z.string() }),
    discriminatedUnion: z.discriminatedUnion('type', [
      z.object({ type: z.literal('a'), x: z.string() }),
      z.object({ type: z.literal('b'), y: z.number() }),
    ]),
    objectArray: z.array(z.object({ a: z.string() })),
    unionArray: z.array(
      z.discriminatedUnion('type', [
        z.object({ type: z.literal('a'), x: z.string() }),
        z.object({ type: z.literal('b'), y: z.number() }),
      ])
    ),
    customKindArray: z.array(withKind(z.string(), 'page')),
    enumArray: z.array(z.enum(['a', 'b'])),
    enumArrayMethod: z.enum(['a', 'b']).array(),
    stringArray: z.array(z.string()),
    optionalNumberArray: z.array(z.number().optional()),
    mixedUnion: z.union([z.string(), z.number()]),
    record: z.record(z.string(), z.string()),
    file: z.file(),
    custom: z.custom<{ id: string }>(),
    any: z.any(),
  };

  it('maps strings, including formats, stringbool and transforms', () => {
    expectTypeOf(kindOf(kinds.string)).toEqualTypeOf<'string'>();
    expectTypeOf(kindOf(kinds.email)).toEqualTypeOf<'string'>();
    expectTypeOf(kindOf(kinds.stringEmail)).toEqualTypeOf<'string'>();
    expectTypeOf(kindOf(kinds.url)).toEqualTypeOf<'string'>();
    expectTypeOf(kindOf(kinds.uuid)).toEqualTypeOf<'string'>();
    expectTypeOf(kindOf(kinds.stringbool)).toEqualTypeOf<'string'>();
    expectTypeOf(kindOf(kinds.transformed)).toEqualTypeOf<'string'>();
  });

  it('maps numbers, booleans and dates', () => {
    expectTypeOf(kindOf(kinds.number)).toEqualTypeOf<'number'>();
    expectTypeOf(kindOf(kinds.int)).toEqualTypeOf<'number'>();
    expectTypeOf(kindOf(kinds.numberInt)).toEqualTypeOf<'number'>();
    expectTypeOf(kindOf(kinds.preprocess)).toEqualTypeOf<'number'>();
    expectTypeOf(kindOf(kinds.boolean)).toEqualTypeOf<'boolean'>();
    expectTypeOf(kindOf(kinds.date)).toEqualTypeOf<'date'>();
    expectTypeOf(kindOf(kinds.coercedDate)).toEqualTypeOf<'date'>();
  });

  it('maps enums, literals and literal unions', () => {
    expectTypeOf(kindOf(kinds.enum)).toEqualTypeOf<'enum'>();
    expectTypeOf(kindOf(kinds.tsEnum)).toEqualTypeOf<'enum'>();
    expectTypeOf(kindOf(kinds.nativeEnum)).toEqualTypeOf<'enum'>();
    expectTypeOf(kindOf(kinds.literal)).toEqualTypeOf<'enum'>();
    expectTypeOf(kindOf(kinds.multiLiteral)).toEqualTypeOf<'enum'>();
    expectTypeOf(kindOf(kinds.literalUnion)).toEqualTypeOf<'enum'>();
    expectTypeOf(kindOf(kinds.enumOrEmpty)).toEqualTypeOf<'enum'>();
  });

  it('gives a union with the empty string the kind of its other branch', () => {
    expectTypeOf(kindOf(kinds.regexOrEmpty)).toEqualTypeOf<'string'>();
    expectTypeOf(kindOf(kinds.urlOrEmpty)).toEqualTypeOf<'string'>();
  });

  it('maps objects and discriminated unions', () => {
    expectTypeOf(kindOf(kinds.object)).toEqualTypeOf<'object'>();
    expectTypeOf(kindOf(kinds.strictObject)).toEqualTypeOf<'object'>();
    expectTypeOf(
      kindOf(kinds.discriminatedUnion)
    ).toEqualTypeOf<'discriminatedUnion'>();
  });

  it('maps arrays by their element', () => {
    expectTypeOf(kindOf(kinds.objectArray)).toEqualTypeOf<'array'>();
    expectTypeOf(kindOf(kinds.unionArray)).toEqualTypeOf<'array'>();
    expectTypeOf(kindOf(kinds.customKindArray)).toEqualTypeOf<'array'>();
    expectTypeOf(kindOf(kinds.enumArray)).toEqualTypeOf<'enumArray'>();
    expectTypeOf(kindOf(kinds.enumArrayMethod)).toEqualTypeOf<'enumArray'>();
    expectTypeOf(kindOf(kinds.stringArray)).toEqualTypeOf<'primitiveArray'>();
  });

  it('maps only string elements to primitiveArray, so number, date and boolean arrays need a component', () => {
    expectTypeOf(kindOf(kinds.optionalNumberArray)).toBeNever();
    expectTypeOf(kindOf(z.array(z.date()))).toBeNever();
    expectTypeOf(kindOf(z.array(z.boolean()))).toBeNever();
    expectTypeOf(
      kindOf(z.array(z.string().optional()))
    ).toEqualTypeOf<'primitiveArray'>();
  });

  it('has no kind for records, files, customs, any and mixed unions', () => {
    expectTypeOf(kindOf(kinds.mixedUnion)).toBeNever();
    expectTypeOf(kindOf(kinds.record)).toBeNever();
    expectTypeOf(kindOf(kinds.file)).toBeNever();
    expectTypeOf(kindOf(kinds.custom)).toBeNever();
    expectTypeOf(kindOf(kinds.any)).toBeNever();
  });

  it('unwraps wrappers to the innermost schema', () => {
    const schema = z.string();
    const wrapped = schema.optional().nullable().default(null);

    expectTypeOf(unwrapped(wrapped)).toEqualTypeOf(schema);
  });
});

describe('kinded schemas keep clean value types', () => {
  it('leaves input and output untouched', () => {
    const nested = z.object({ body: textarea, tags, title: z.string().min(1) });
    const optional = textarea.optional();
    const withDefault = textarea.default('');

    expectTypeOf(outputOf(nested)).toEqualTypeOf<{
      body: string;
      tags: string[];
      title: string;
    }>();
    expectTypeOf(inputOf(nested)).toEqualTypeOf<{
      body: string;
      tags: string[];
      title: string;
    }>();
    expectTypeOf(outputOf(optional)).toEqualTypeOf<string | undefined>();
    expectTypeOf(outputOf(withDefault)).toEqualTypeOf<string>();
    expectTypeOf(inputOf(withDefault)).toEqualTypeOf<string | undefined>();
  });
});
