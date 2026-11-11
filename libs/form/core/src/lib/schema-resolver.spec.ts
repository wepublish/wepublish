import type { FieldErrors, ResolverOptions } from 'react-hook-form';
import { z } from 'zod/v4';
import type { AnyFormSchema } from './value-types';
import { emptyValues } from './initial-values';
import { schemaResolver } from './schema-resolver';

const options: ResolverOptions<Record<string, unknown>> = {
  fields: {},
  shouldUseNativeValidation: false,
};

const resolve = async (
  schema: AnyFormSchema,
  values: Record<string, unknown>
) => schemaResolver(schema)(values, undefined, options);

const errorsOf = async (
  schema: AnyFormSchema,
  values: Record<string, unknown>
) =>
  (await resolve(schema, values)).errors as FieldErrors &
    Record<string, unknown>;

describe('schemaResolver', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns the parsed output values on success', async () => {
    const schema = z.object({
      name: z.string().trim(),
      count: z.string().transform(Number),
    });

    expect(
      await resolve(schema, { name: ' a ', count: '2', extra: 1 })
    ).toEqual({
      values: { name: 'a', count: 2 },
      errors: {},
    });
  });

  it('nests errors by path and keeps the issue params', async () => {
    const schema = z.object({
      name: z.string().min(3),
      actions: z.array(z.object({ label: z.string().min(1) })),
    });

    const errors = await errorsOf(schema, {
      name: 'ab',
      actions: [{ label: 'x' }, { label: '' }],
    });

    expect(errors).toMatchObject({
      name: {
        type: 'too_small',
        message: 'form.errors.too_small.string.min',
        params: { minimum: 3, origin: 'string', inclusive: true },
      },
      actions: [undefined, { label: { message: 'form.errors.required' } }],
    });
    expect(errors['name']).not.toHaveProperty('params.path');
    expect(errors['name']).not.toHaveProperty('params.input');
  });

  it('keeps the params of a custom issue', async () => {
    const schema = z
      .object({ slug: z.string() })
      .superRefine((value, context) => {
        context.addIssue({
          code: 'custom',
          path: ['slug'],
          message: 'slug.taken',
          params: { slug: value.slug },
        });
      });

    expect(await errorsOf(schema, { slug: 'a' })).toMatchObject({
      slug: { type: 'custom', message: 'slug.taken', params: { slug: 'a' } },
    });
  });

  it('keeps only the first issue per path', async () => {
    const schema = z.object({
      name: z
        .string()
        .min(3, { error: 'first' })
        .regex(/x/, { error: 'second' }),
    });

    expect(await errorsOf(schema, { name: 'ab' })).toMatchObject({
      name: { message: 'first' },
    });
  });

  it('puts path-less issues at root.schema', async () => {
    const schema = z
      .object({ starts: z.date(), ends: z.date() })
      .refine(value => value.ends > value.starts, {
        error: 'event.endsBeforeStarts',
      });

    const errors = await errorsOf(schema, {
      starts: new Date(2030, 0, 2),
      ends: new Date(2030, 0, 1),
    });

    expect(errors.root).toMatchObject({
      schema: { message: 'event.endsBeforeStarts' },
    });
  });

  it('turns a throwing schema into root.schema form.errors.unexpected', async () => {
    const error = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    const schema = z.object({ a: z.string() }).refine(() => {
      throw new Error('boom');
    });

    const result = await resolve(schema, { a: 'x' });

    expect(result).toMatchObject({
      values: {},
      errors: {
        root: {
          schema: { type: 'exception', message: 'form.errors.unexpected' },
        },
      },
    });
    expect(error).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'boom' })
    );
  });

  it('runs async refines', async () => {
    const schema = z.object({
      slug: z
        .string()
        .refine(async value => value !== 'taken', { error: 'slug.taken' }),
    });

    expect(await errorsOf(schema, { slug: 'taken' })).toMatchObject({
      slug: { message: 'slug.taken' },
    });
  });

  it('replaces a union issue with the first issue of its first branch', async () => {
    const schema = z.object({
      key: z
        .string()
        .regex(/^G-/, { error: 'analytics.invalidGaId' })
        .or(z.literal(''))
        .nullish(),
      nested: z.union([z.object({ id: z.string().min(2) }), z.literal('')]),
    });

    expect(
      await errorsOf(schema, { key: 'x', nested: { id: 'a' } })
    ).toMatchObject({
      key: {
        type: 'invalid_format',
        message: 'analytics.invalidGaId',
        params: { format: 'regex' },
      },
      nested: { id: { message: 'form.errors.too_small.string.min' } },
    });
  });

  it('reports an empty discriminator as required', async () => {
    const schema = z.object({
      link: z.discriminatedUnion('type', [
        z.object({ type: z.literal('page'), pageId: z.string() }),
        z.object({ type: z.literal('external'), url: z.url() }),
      ]),
    });

    expect(await errorsOf(schema, { link: { type: null } })).toMatchObject({
      link: { type: { message: 'form.errors.required' } },
    });
    expect(await errorsOf(schema, { link: { type: 'unknown' } })).toMatchObject(
      {
        link: { type: { message: 'form.errors.invalid' } },
      }
    );
  });

  it('parses blank optional and nullable objects as undefined and null', async () => {
    const schema = z.object({
      seo: z
        .object({
          slug: z.string().min(1),
          active: z.boolean(),
          count: z.number(),
          tags: z.array(z.string()),
          meta: z.object({ title: z.string().min(1) }),
        })
        .optional(),
      address: z.object({ street: z.string().min(1) }).nullable(),
      items: z.array(
        z.object({ note: z.object({ text: z.string().min(1) }).nullish() })
      ),
    });

    expect(
      await resolve(schema, {
        seo: {
          slug: undefined,
          active: false,
          count: null,
          tags: [],
          meta: { title: undefined },
        },
        address: { street: '' },
        items: [{ note: { text: undefined } }],
      })
    ).toEqual({
      values: { seo: undefined, address: null, items: [{ note: null }] },
      errors: {},
    });
  });

  it('parses the blank expansion of optional groups as undefined and null', async () => {
    const link = z.discriminatedUnion('type', [
      z.object({ type: z.literal('page'), pageId: z.string().min(1) }),
      z.object({ type: z.literal('external'), url: z.url() }),
    ]);
    const schema = z.object({
      seo: z
        .object({
          slug: z.string().min(1),
          size: z.number().min(1).default(3),
          enabled: z.boolean().default(true),
          meta: z.object({ title: z.string().min(1) }).nullish(),
          link,
        })
        .optional(),
      address: z
        .object({ street: z.string().min(1), zip: z.string().default('8000') })
        .nullable(),
    });

    expect(
      await resolve(schema, emptyValues(schema) as Record<string, unknown>)
    ).toEqual({
      values: { seo: undefined, address: null },
      errors: {},
    });
  });

  it('treats defaults inside an optional group as blank, but not a changed default', async () => {
    const schema = z.object({
      seo: z
        .object({
          title: z.string().min(1),
          index: z.boolean().default(true),
          size: z.number().default(3),
          publishedAt: z.date().default(() => new Date()),
        })
        .optional(),
    });
    const blank = emptyValues(schema) as { seo: Record<string, unknown> };

    expect(blank.seo).toMatchObject({ index: true, size: 3 });
    expect(await resolve(schema, blank)).toEqual({
      values: { seo: undefined },
      errors: {},
    });
    expect(
      await resolve(schema, { seo: { ...blank.seo, size: null } })
    ).toEqual({
      values: { seo: undefined },
      errors: {},
    });
    expect(
      await errorsOf(schema, { seo: { ...blank.seo, index: false } })
    ).toMatchObject({
      seo: { title: { message: 'form.errors.required' } },
    });
  });

  it('applies the defaults inside a filled optional object', async () => {
    const schema = z.object({
      seo: z
        .object({
          slug: z.string().min(1),
          size: z.number().default(3),
          enabled: z.boolean().default(true),
        })
        .optional(),
    });
    const blank = emptyValues(schema) as { seo: Record<string, unknown> };

    expect(await resolve(schema, { seo: { ...blank.seo, slug: 'a' } })).toEqual(
      {
        values: { seo: { slug: 'a', size: 3, enabled: true } },
        errors: {},
      }
    );
  });

  it('validates an optional object whose union left its blank branch', async () => {
    const schema = z.object({
      seo: z
        .object({
          link: z.discriminatedUnion('type', [
            z.object({ type: z.literal('page'), pageId: z.string().min(1) }),
            z.object({ type: z.literal('external'), url: z.string().min(1) }),
          ]),
        })
        .optional(),
      link: z
        .discriminatedUnion('type', [
          z.object({ type: z.literal('page'), pageId: z.string().min(1) }),
          z.object({ type: z.literal('external'), url: z.string().min(1) }),
        ])
        .optional(),
    });

    expect(
      await errorsOf(schema, {
        seo: { link: { type: 'external', url: '' } },
        link: { type: 'page', pageId: '' },
      })
    ).toMatchObject({
      seo: { link: { url: { message: 'form.errors.required' } } },
      link: { pageId: { message: 'form.errors.required' } },
    });
  });

  it('validates an optional object once one of its fields holds a value', async () => {
    const schema = z.object({
      seo: z
        .object({ slug: z.string().min(1), title: z.string().min(1) })
        .optional(),
    });

    expect(
      await errorsOf(schema, { seo: { slug: 'a', title: '' } })
    ).toMatchObject({
      seo: { title: { message: 'form.errors.required' } },
    });
  });

  it('never collapses required or defaulted objects', async () => {
    const schema = z.object({
      address: z.object({ street: z.string().min(1) }),
      settings: z.object({ name: z.string().min(1) }).default({ name: 'n' }),
    });

    expect(
      Object.keys(
        await errorsOf(schema, {
          address: { street: '' },
          settings: { name: '' },
        })
      ).sort()
    ).toEqual(['address', 'settings']);
  });

  it('reads the schema it was created with', async () => {
    const strict = z.object({ name: z.string().min(1) });
    const loose = z.object({ name: z.string() });

    expect(await errorsOf(strict, { name: '' })).toHaveProperty('name');
    expect(await errorsOf(loose, { name: '' })).toEqual({});
  });
});
