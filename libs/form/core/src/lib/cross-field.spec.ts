import type { ResolverOptions } from 'react-hook-form';
import { z } from 'zod/v4';
import { crossField } from './cross-field';
import { schemaResolver } from './schema-resolver';
import type { AnyFormSchema } from './value-types';

const options: ResolverOptions<Record<string, unknown>> = {
  fields: {},
  shouldUseNativeValidation: false,
};

const errorsOf = async (
  schema: AnyFormSchema,
  values: Record<string, unknown>
) => (await schemaResolver(schema)(values, undefined, options)).errors;

const errorKeys = async (
  schema: AnyFormSchema,
  values: Record<string, unknown>
) => Object.keys(await errorsOf(schema, values)).sort();

const base = z.object({
  status: z.enum(['a', 'b']),
  starts: z.date(),
  ends: z.date().nullable(),
});

const endsAfterStarts = (schema: typeof base) =>
  crossField(
    schema,
    ['starts', 'ends'],
    value => !value.ends || value.ends > value.starts,
    {
      path: ['ends'],
      error: 'event.endsBeforeStarts',
    }
  );

describe('crossField', () => {
  const swapped = {
    status: null,
    starts: new Date(2030, 0, 2),
    ends: new Date(2030, 0, 1),
  };

  it('reports the rule while an unrelated field is still empty', async () => {
    const plain = base.refine(
      value => !value.ends || value.ends > value.starts,
      {
        path: ['ends'],
        error: 'event.endsBeforeStarts',
      }
    );

    expect(await errorKeys(plain, swapped)).toEqual(['status']);
    expect(await errorKeys(endsAfterStarts(base), swapped)).toEqual([
      'ends',
      'status',
    ]);
  });

  it('puts the error key at the path', async () => {
    expect(await errorsOf(endsAfterStarts(base), swapped)).toMatchObject({
      ends: { message: 'event.endsBeforeStarts' },
    });
  });

  it('skips the rule while one of its own keys is invalid', async () => {
    expect(
      await errorKeys(endsAfterStarts(base), {
        status: 'a',
        starts: null,
        ends: new Date(2030, 0, 1),
      })
    ).toEqual(['starts']);
  });

  it('passes when the rule holds', async () => {
    expect(
      await errorKeys(endsAfterStarts(base), {
        status: 'a',
        starts: new Date(2030, 0, 1),
        ends: new Date(2030, 0, 2),
      })
    ).toEqual([]);
  });

  it('runs the rule on transformed keys with their output', async () => {
    const transformed = crossField(
      z.object({
        starts: z.string().transform(value => new Date(value)),
        ends: z.string().transform(value => new Date(value)),
      }),
      ['starts', 'ends'],
      value => value.ends > value.starts,
      { path: ['ends'], error: 'event.endsBeforeStarts' }
    );

    expect(
      await errorsOf(transformed, { starts: '2030-01-02', ends: '2030-01-01' })
    ).toMatchObject({
      ends: { message: 'event.endsBeforeStarts' },
    });
    expect(
      await errorKeys(transformed, { starts: '2030-01-01', ends: '2030-01-02' })
    ).toEqual([]);
  });

  it('skips the rule while a nested key of its own is invalid', async () => {
    const nested = crossField(
      z.object({
        range: z.object({ from: z.number(), to: z.number() }),
        max: z.number(),
      }),
      ['range', 'max'],
      value => value.range.to <= value.max,
      { path: ['max'], error: 'range.tooBig' }
    );

    expect(
      await errorKeys(nested, { range: { from: 1, to: null }, max: 0 })
    ).toEqual(['range']);
    expect(
      await errorKeys(nested, { range: { from: 1, to: 5 }, max: 0 })
    ).toEqual(['max']);
  });

  it('is dropped by extend, so rules are applied last', async () => {
    const extended = endsAfterStarts(base).extend({ name: z.string() });

    expect(
      await errorKeys(extended, { ...swapped, status: 'a', name: 'x' })
    ).toEqual([]);
  });
});
