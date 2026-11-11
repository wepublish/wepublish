import { z } from 'zod/v4';
import { withKind } from './kind';
import type {
  AnyFormSchema,
  FormInput,
  FormOutput,
  FormValue,
  FormValues,
} from './value-types';

declare function inputOf<S extends AnyFormSchema>(schema: S): FormInput<S>;
declare function outputOf<S extends AnyFormSchema>(schema: S): FormOutput<S>;
declare function valuesOf<S extends AnyFormSchema>(schema: S): FormValues<S>;

const acceptsFormSchema = <S extends AnyFormSchema>(schema: S) => schema;

describe('AnyFormSchema', () => {
  it('accepts object roots, discriminated union roots, refines and transforms', () => {
    acceptsFormSchema(z.object({ a: z.string() }));
    acceptsFormSchema(
      z.discriminatedUnion('type', [
        z.object({ type: z.literal('a'), x: z.string() }),
        z.object({ type: z.literal('b'), y: z.number() }),
      ])
    );
    acceptsFormSchema(z.object({ a: z.string() }).refine(() => true));
    acceptsFormSchema(
      z
        .object({ n: z.number() })
        .transform(value => ({ ...value, sum: value.n + 1 }))
    );
  });

  it('rejects schemas whose value is not an object', () => {
    // @ts-expect-error a string is not a form
    acceptsFormSchema(z.string());
    // @ts-expect-error an array is not a form
    acceptsFormSchema(z.array(z.object({ a: z.string() })));
  });

  it('rejects object-valued schemas without fields', () => {
    // @ts-expect-error a record has no paths to render
    acceptsFormSchema(z.record(z.string(), z.string()));
    acceptsFormSchema(
      // @ts-expect-error a union without a discriminator has no paths to render
      z.union([z.object({ a: z.string() }), z.object({ b: z.string() })])
    );
    acceptsFormSchema(z.object({ a: z.string() }).readonly());
    acceptsFormSchema(z.lazy(() => z.object({ a: z.string() })));
    acceptsFormSchema(z.object({ a: z.string() }).brand<'A'>());
  });
});

describe('FormInput and FormOutput', () => {
  it('reads the input and output of the schema', () => {
    const schema = z.object({
      name: z.string().transform(value => value.length),
      delay: z.number().default(0),
    });

    expectTypeOf(inputOf(schema)).toEqualTypeOf<{
      name: string;
      delay?: number | undefined;
    }>();
    expectTypeOf(outputOf(schema)).toEqualTypeOf<{
      name: number;
      delay: number;
    }>();
  });
});

describe('FormValues', () => {
  it('is null-honest for dates, numbers and enums', () => {
    const refined = z
      .object({ starts: z.date(), ends: z.date().nullable() })
      .refine(value => !value.ends || value.ends > value.starts, {
        path: ['ends'],
        error: 'event.endsBeforeStarts',
      });

    expectTypeOf(valuesOf(refined)).toEqualTypeOf<{
      starts: Date | null;
      ends: Date | null;
    }>();
  });

  it('maps every leaf of a nested schema', () => {
    const schema = z.object({
      title: z.string(),
      email: z.email().optional(),
      count: z.number(),
      active: z.boolean(),
      status: z.enum(['a', 'b']),
      tags: z.array(z.string()),
      roles: z.array(z.enum(['admin', 'editor'])),
      address: z.object({ street: z.string(), zip: z.number().nullable() }),
      file: z.instanceof(Blob),
      image: withKind(z.object({ id: z.string() }), 'image').nullable(),
    });

    expectTypeOf(valuesOf(schema)).toEqualTypeOf<{
      title: string;
      email?: string | undefined;
      count: number | null;
      active: boolean;
      status: 'a' | 'b' | null;
      tags: string[];
      roles: ('admin' | 'editor' | null)[];
      address: { street: string; zip: number | null };
      file: Blob | null;
      image: { id: string } | null;
    }>();
  });

  it('starts custom-kind values that reject null and undefined at null', () => {
    const schema = z.object({
      image: withKind(z.object({ id: z.string(), url: z.string() }), 'image'),
      plan: withKind(z.custom<{ currency: string }>(), 'entity'),
      page: withKind(z.object({ id: z.string() }), 'page').optional(),
      text: withKind(z.string(), 'textarea'),
      tagIds: withKind(z.array(z.string()), 'tags'),
      agreed: withKind(z.boolean(), 'checkbox'),
      startsAt: withKind(z.date(), 'dateTime'),
      size: withKind(z.object({ width: z.number() }), 'size').nullable(),
    });

    expectTypeOf(valuesOf(schema)).toEqualTypeOf<{
      image: { id: string; url: string } | null;
      plan: { currency: string } | null;
      page?: { id: string } | undefined;
      text: string;
      tagIds: string[];
      agreed: boolean;
      startsAt: Date | null;
      size: { width: number } | null;
    }>();
  });

  it('lets a defaulted string hold null once it is cleared', () => {
    const schema = z.object({
      title: z.string().default('Untitled'),
      lead: withKind(z.string(), 'textarea').default(''),
      note: z.string().nullable().default('n'),
      delay: z.number().default(0),
      active: z.boolean().default(true),
      roles: z.array(z.string()).default([]),
    });

    expectTypeOf(valuesOf(schema)).toEqualTypeOf<{
      title?: string | null | undefined;
      lead?: string | null | undefined;
      note?: string | null | undefined;
      delay?: number | null | undefined;
      active?: boolean | undefined;
      roles?: string[] | undefined;
    }>();
  });

  it('maps optional and nullable containers and union branches', () => {
    const schema = z.object({
      seo: z
        .object({
          slug: z.string(),
          image: withKind(z.object({ id: z.string() }), 'image'),
        })
        .optional(),
      address: z.object({ zip: z.number() }).nullable(),
      links: z.array(
        z.discriminatedUnion('type', [
          z.object({
            type: z.literal('page'),
            page: withKind(z.object({ id: z.string() }), 'page'),
          }),
          z.object({ type: z.literal('external'), url: z.string() }),
        ])
      ),
    });

    expectTypeOf(valuesOf(schema)).toEqualTypeOf<{
      seo?: { slug: string; image: { id: string } | null } | undefined;
      address: { zip: number | null } | null;
      links: (
        | { type: 'page' | null; page: { id: string } | null }
        | { type: 'external' | null; url: string }
      )[];
    }>();
  });

  it('keeps the branches of a discriminated union root', () => {
    const schema = z.discriminatedUnion('type', [
      z.object({ type: z.literal('stripe'), secretKey: z.string() }),
      z.object({ type: z.literal('payrexx'), instance: z.string() }),
    ]);

    expectTypeOf(valuesOf(schema)).toEqualTypeOf<
      | { type: 'stripe' | null; secretKey: string }
      | { type: 'payrexx' | null; instance: string }
    >();
  });

  it('maps single values', () => {
    expectTypeOf<FormValue<Date>>().toEqualTypeOf<Date | null>();
    expectTypeOf<FormValue<string>>().toEqualTypeOf<string>();
    expectTypeOf<FormValue<'a' | 'b'>>().toEqualTypeOf<'a' | 'b' | null>();
    expectTypeOf<FormValue<boolean>>().toEqualTypeOf<boolean>();
    expectTypeOf<FormValue<number | undefined>>().toEqualTypeOf<
      number | null | undefined
    >();
  });
});
