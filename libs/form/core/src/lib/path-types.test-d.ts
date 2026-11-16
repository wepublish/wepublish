import type { Path } from 'react-hook-form';
import { z } from 'zod/v4';
import { withKind } from './kind';
import type { KindOf } from './kind-types';
import type {
  ItemPath,
  RenderablePath,
  SchemaAt,
  SchemaPath,
  ScopePath,
  TopLevelKey,
} from './path-types';
import type { FormValues } from './value-types';

declare function pathsOf<S>(schema: S): SchemaPath<S>;
declare function pathsWithin<S, L extends number>(
  schema: S,
  levels: L
): SchemaPath<S, L>;
declare function renderablePathsOf<S, Scope extends string = ''>(
  schema: S,
  scope?: Scope
): RenderablePath<S, Scope>;
declare function itemPathsOf<S>(schema: S): ItemPath<S>;
declare function scopePathsOf<S>(schema: S): ScopePath<S>;
declare function topLevelKeysOf<S, Scope extends string = ''>(
  schema: S,
  scope?: Scope
): TopLevelKey<S, Scope>;
declare function inputAt<S, P extends string>(
  schema: S,
  path: P
): z.input<SchemaAt<S, P>>;
declare function kindAt<S, P extends string>(
  schema: S,
  path: P
): KindOf<SchemaAt<S, P>>;

enum Status {
  Draft = 'draft',
  Published = 'published',
}

const bannerSchema = z
  .object({
    title: z.string().min(1).meta({ label: 'banner.title' }),
    text: withKind(z.string(), 'textarea').optional(),
    delay: z.number().int().nullable(),
    active: z.boolean(),
    status: z.enum(Status),
    starts: z.date(),
    ends: z.date().nullable(),
    actions: z.array(
      z.object({
        label: z.string(),
        url: z.url(),
        role: z.enum(['primary', 'secondary']),
      })
    ),
    link: z.discriminatedUnion('type', [
      z.object({ type: z.literal('external'), url: z.url() }),
      z.object({ type: z.literal('page'), pageId: z.string() }),
    ]),
    address: z
      .object({ street: z.string(), zip: z.string().optional() })
      .optional(),
  })
  .refine(value => value.ends === null || value.ends > value.starts, {
    path: ['ends'],
  });

describe('SchemaPath', () => {
  it('lists every path of an object schema', () => {
    expectTypeOf(pathsOf(bannerSchema)).toEqualTypeOf<
      | 'title'
      | 'text'
      | 'delay'
      | 'active'
      | 'status'
      | 'starts'
      | 'ends'
      | 'actions'
      | 'actions.*'
      | 'actions.*.label'
      | 'actions.*.url'
      | 'actions.*.role'
      | 'link'
      | 'link.type'
      | 'link.url'
      | 'link.pageId'
      | 'address'
      | 'address.street'
      | 'address.zip'
    >();
  });

  it('treats custom kinds as leaves and stars only object, union and custom elements', () => {
    const schema = z.object({
      image: withKind(
        z.object({ id: z.string(), url: z.string() }),
        'image'
      ).nullable(),
      tagIds: withKind(z.array(z.string()), 'tags'),
      pages: z.array(withKind(z.object({ id: z.string() }), 'page')),
      names: z.array(z.string()),
      roles: z.array(z.enum(['a', 'b'])),
      links: z.array(
        z.discriminatedUnion('type', [
          z.object({
            type: z.literal('page'),
            label: z.string(),
            pageId: z.string(),
          }),
          z.object({
            type: z.literal('external'),
            label: z.string(),
            url: z.url(),
          }),
        ])
      ),
    });

    expectTypeOf(pathsOf(schema)).toEqualTypeOf<
      | 'image'
      | 'tagIds'
      | 'pages'
      | 'pages.*'
      | 'names'
      | 'roles'
      | 'links'
      | 'links.*'
      | 'links.*.type'
      | 'links.*.label'
      | 'links.*.pageId'
      | 'links.*.url'
    >();
  });

  it('has no paths below a custom kind', () => {
    expectTypeOf(
      pathsOf(withKind(z.object({ id: z.string() }), 'image'))
    ).toBeNever();
    expectTypeOf(
      renderablePathsOf(
        z.object({
          pages: z.array(withKind(z.object({ id: z.string() }), 'image')),
        }),
        'pages.*'
      )
    ).toBeNever();
  });

  it('lists the keys of every branch of a discriminated union root', () => {
    const schema = z.discriminatedUnion('type', [
      z.object({ type: z.literal('stripe'), secretKey: z.string() }),
      z.object({ type: z.literal('payrexx'), instance: z.string() }),
    ]);

    expectTypeOf(pathsOf(schema)).toEqualTypeOf<
      'type' | 'secretKey' | 'instance'
    >();
  });

  it('reads through a transformed root', () => {
    const schema = z
      .object({ a: z.string(), n: z.number(), b: z.boolean() })
      .transform(value => ({ ...value, sum: value.n + 1 }));

    expectTypeOf(pathsOf(schema)).toEqualTypeOf<'a' | 'n' | 'b'>();
  });

  it('reaches five object levels by default', () => {
    const deep = z.object({
      a: z.object({
        b: z.object({
          c: z.object({ d: z.object({ e: z.object({ f: z.string() }) }) }),
        }),
      }),
    });

    expectTypeOf(pathsOf(deep))
      .extract<`a.b.c.d${string}`>()
      .toEqualTypeOf<'a.b.c.d' | 'a.b.c.d.e'>();
    expectTypeOf(pathsWithin(deep, 2)).toEqualTypeOf<'a' | 'a.b'>();
  });

  it('terminates on recursive schemas', () => {
    const node = z.object({
      label: z.string(),
      get children() {
        return z.array(node);
      },
    });
    const lazyNode: z.ZodType<{ label: string; children: unknown[] }> = z.lazy(
      () => z.object({ label: z.string(), children: z.array(lazyNode) })
    );
    const nav = z.object({
      name: z.string(),
      items: z.array(node),
      lazyItems: z.array(lazyNode),
    });

    expectTypeOf(pathsOf(nav))
      .extract<'items.*.children.*.children.*.children.*.label'>()
      .toEqualTypeOf<'items.*.children.*.children.*.children.*.label'>();
    expectTypeOf(pathsOf(nav))
      .extract<'items.*.children.*.children.*.children.*.children.*.label'>()
      .toBeNever();
    expectTypeOf(kindAt(nav, 'items.*.children')).toEqualTypeOf<'array'>();
    expectTypeOf(pathsOf(nav))
      .extract<`lazyItems${string}`>()
      .toEqualTypeOf<'lazyItems'>();
  });
});

describe('SchemaAt', () => {
  it('returns the schema at a path', () => {
    expectTypeOf(inputAt(bannerSchema, 'actions.*.role')).toEqualTypeOf<
      'primary' | 'secondary'
    >();
    expectTypeOf(inputAt(bannerSchema, 'link.pageId')).toEqualTypeOf<string>();
    expectTypeOf(inputAt(bannerSchema, 'address.zip')).toEqualTypeOf<
      string | undefined
    >();
    expectTypeOf(inputAt(bannerSchema, 'link.type')).toEqualTypeOf<
      'external' | 'page'
    >();
    expectTypeOf(kindAt(bannerSchema, 'actions.*')).toEqualTypeOf<'object'>();
  });
});

describe('RenderablePath, ItemPath and TopLevelKey', () => {
  it('leaves out star paths', () => {
    expectTypeOf(renderablePathsOf(bannerSchema))
      .extract<`actions${string}`>()
      .toEqualTypeOf<'actions'>();
  });

  it('lists the paths of an item relative to its scope', () => {
    expectTypeOf(renderablePathsOf(bannerSchema, 'actions.*')).toEqualTypeOf<
      'label' | 'url' | 'role'
    >();
  });

  it('lists item paths', () => {
    expectTypeOf(itemPathsOf(bannerSchema)).toEqualTypeOf<'actions.*'>();
  });

  it('lists scope paths, leaving out custom-kind items', () => {
    const schema = z.object({
      pages: z.array(withKind(z.object({ id: z.string() }), 'image')),
      actions: z.array(
        z.object({
          label: z.string(),
          links: z.array(z.object({ href: z.string() })),
        })
      ),
    });

    expectTypeOf(itemPathsOf(schema)).toEqualTypeOf<
      'pages.*' | 'actions.*' | 'actions.*.links.*'
    >();
    expectTypeOf(scopePathsOf(schema)).toEqualTypeOf<
      'actions.*' | 'actions.*.links.*'
    >();
  });

  it('lists top-level keys', () => {
    expectTypeOf(topLevelKeysOf(bannerSchema)).toEqualTypeOf<
      | 'title'
      | 'text'
      | 'delay'
      | 'active'
      | 'status'
      | 'starts'
      | 'ends'
      | 'actions'
      | 'link'
      | 'address'
    >();
    expectTypeOf(topLevelKeysOf(bannerSchema, 'actions.*')).toEqualTypeOf<
      'label' | 'url' | 'role'
    >();
  });

  it('is a subset of the react-hook-form paths of the form values', () => {
    const schema = z.object({
      title: z.string(),
      text: withKind(z.string(), 'textarea').optional(),
      status: z.enum(['a', 'b']),
      starts: z.date(),
      actions: z.array(
        z.object({
          label: z.string(),
          links: z.array(z.object({ href: z.string() })),
        })
      ),
      link: z.discriminatedUnion('type', [
        z.object({ type: z.literal('external'), url: z.url() }),
        z.object({ type: z.literal('page'), pageId: z.string() }),
      ]),
      address: z.object({ street: z.string() }).nullable(),
      image: withKind(z.object({ id: z.string() }), 'image').nullable(),
    });

    expectTypeOf(renderablePathsOf(schema))
      .exclude<Path<FormValues<typeof schema>>>()
      .toBeNever();
  });
});
