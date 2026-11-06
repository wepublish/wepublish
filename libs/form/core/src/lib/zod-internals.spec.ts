import { z } from 'zod/v4';

const PROBE = '~probe';

const readProbe = (schema: z.ZodType): unknown => {
  const def: { type: string; [PROBE]?: unknown } = schema._zod.def;

  return def[PROBE];
};

const withProbe = <S extends z.ZodType>(schema: S): S =>
  schema.clone(Object.assign({}, schema._zod.def, { [PROBE]: 'kept' }));

describe('zod internals the form library relies on', () => {
  it('keeps unknown def keys through checks, meta and describe, because check() spreads the def', () => {
    const schema = withProbe(z.string());

    expect(readProbe(schema.min(1))).toBe('kept');
    expect(readProbe(schema.max(3).trim())).toBe('kept');
    expect(readProbe(schema.refine(() => true))).toBe('kept');
    expect(readProbe(schema.superRefine(() => undefined))).toBe('kept');
    expect(readProbe(schema.meta({ label: 'x' }))).toBe('kept');
    expect(readProbe(schema.describe('x'))).toBe('kept');
    expect(readProbe(schema.brand<'Probe'>())).toBe('kept');
  });

  it('keeps the inner def of wrappers', () => {
    const schema = withProbe(z.string());
    const optional = schema.optional();
    const piped = schema.transform(value => value.length);
    const defaulted = schema.default('');

    expect(readProbe(optional.unwrap())).toBe('kept');
    expect(readProbe(defaulted.unwrap())).toBe('kept');
    expect(readProbe(piped.in)).toBe('kept');
  });

  it('keeps meta on clone only with { parent: true }', () => {
    const schema = z.string().meta({ label: 'k' });

    expect(schema.clone(schema._zod.def).meta()).toBeUndefined();
    expect(schema.clone(schema._zod.def, { parent: true }).meta()).toEqual({
      label: 'k',
    });
  });

  it('drops meta in checks that are chained after it', () => {
    expect(z.string().meta({ label: 'k' }).min(1).meta()).toBeUndefined();
    expect(
      z
        .object({ a: z.string() })
        .meta({ label: 'k' })
        .extend({ b: z.string() })
        .meta()
    ).toBeUndefined();
  });

  it('reads a lazy default through a getter, which spreading the def freezes', () => {
    let calls = 0;
    const schema = z.number().default(() => ++calls);
    const descriptor = Object.getOwnPropertyDescriptor(
      schema._zod.def,
      'defaultValue'
    );
    const spread = { ...schema._zod.def };

    expect(typeof descriptor?.get).toBe('function');
    expect(
      Object.getOwnPropertyDescriptor(spread, 'defaultValue')?.get
    ).toBeUndefined();
  });

  it('returns the default without parsing it, but parses a prefault', () => {
    expect(z.string().min(3).default('').parse(undefined)).toBe('');
    expect(() => z.string().min(3).prefault('').parse(undefined)).toThrow();
  });

  it('models preprocess as a pipe whose input is a transform', () => {
    const def = z.preprocess(value => value, z.number())._zod.def;

    expect(def.type).toBe('pipe');
    expect(def.type === 'pipe' && def.in._zod.def.type).toBe('transform');
  });

  it('passes the input to the error map, and strips it from the final issues', () => {
    const inputs: unknown[] = [];
    const result = z.enum(['a', 'b']).safeParse(null, {
      error: issue => {
        inputs.push(issue.input);

        return 'key';
      },
    });

    expect(inputs).toEqual([null]);
    expect(result.error?.issues[0]).toMatchObject({
      code: 'invalid_value',
      message: 'key',
    });
    expect(result.error?.issues[0]).not.toHaveProperty('input');
  });

  it('prefers the error of the schema or check over the error map', () => {
    const result = z
      .string()
      .min(2, { error: 'own' })
      .safeParse('a', { error: () => 'map' });

    expect(result.error?.issues[0]?.message).toBe('own');
  });

  it('nests the branch issues of a union', () => {
    const result = z
      .string()
      .regex(/x/, { error: 'branch' })
      .or(z.literal(''))
      .safeParse('a');
    const issue = result.error?.issues[0];

    expect(issue?.code).toBe('invalid_union');
    expect(
      issue?.code === 'invalid_union' && issue.errors[0]?.[0]?.message
    ).toBe('branch');
  });

  it('skips an object refine after an aborting issue, unless when says otherwise', () => {
    const shape = { status: z.enum(['a']), n: z.number() };
    const plain = z.object(shape).refine(() => false, { error: 'rule' });
    const forced = z
      .object(shape)
      .refine(() => false, { error: 'rule', when: () => true });

    expect(
      plain
        .safeParse({ status: null, n: 1 })
        .error?.issues.map(issue => issue.code)
    ).toEqual(['invalid_value']);
    expect(
      forced
        .safeParse({ status: null, n: 1 })
        .error?.issues.map(issue => issue.code)
    ).toEqual(['invalid_value', 'custom']);
  });

  it('collects literal values on enums, literals and literal unions', () => {
    expect([...(z.enum(['a', 'b'])._zod.values ?? [])]).toEqual(['a', 'b']);
    expect([...(z.literal(['a', 'b'])._zod.values ?? [])]).toEqual(['a', 'b']);
    expect([
      ...(z.union([z.literal('a'), z.literal(1)])._zod.values ?? []),
    ]).toEqual(['a', 1]);
    expect(z.string()._zod.values).toBeUndefined();
  });

  it('describes checks in the bag', () => {
    expect(z.string().min(3).max(5)._zod.bag).toMatchObject({
      minimum: 3,
      maximum: 5,
    });
    expect(z.number().positive()._zod.bag).toMatchObject({
      exclusiveMinimum: 0,
    });
    expect(z.int()._zod.bag).toMatchObject({ format: 'safeint' });
    expect(z.string().regex(/x/)._zod.bag).toMatchObject({
      format: 'regex',
      patterns: new Set([/x/]),
    });
  });

  it('throws an async error when a sync parse meets an async refine', () => {
    const schema = z.string().refine(async () => true);

    expect(() => schema.safeParse('a')).toThrow(z.core.$ZodAsyncError);
  });
});
