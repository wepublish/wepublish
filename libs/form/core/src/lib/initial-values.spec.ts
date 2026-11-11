import { z } from 'zod/v4';
import { branchEmpty, emptyValues, mergeValues } from './initial-values';
import { activeBranch } from './schema-at';
import { withKind } from './kind';

const page = z.object({
  type: z.literal('page'),
  label: z.string(),
  pageId: z.string(),
});
const external = z.object({
  type: z.literal('external'),
  label: z.string(),
  url: z.url(),
});
const link = z.discriminatedUnion('type', [page, external]);

describe('emptyValues', () => {
  it('builds the empty value of every field', () => {
    const schema = z.object({
      title: z.string().min(1),
      email: z.email().optional(),
      delay: z.number().int().min(0),
      status: z.enum(['a', 'b']),
      active: z.boolean(),
      image: withKind(
        z.custom<{ id: string; url: string }>(),
        'image'
      ).nullable(),
      author: z.object({ id: z.string() }).nullable(),
      address: z.object({ street: z.string(), zip: z.number().optional() }),
      tags: z.array(z.string()),
      actions: z.array(z.object({ label: z.string() })),
      link,
    });

    expect(emptyValues(schema)).toEqual({
      title: '',
      email: undefined,
      delay: null,
      status: null,
      active: false,
      image: null,
      author: { id: '' },
      address: { street: '', zip: undefined },
      tags: [],
      actions: [],
      link: { type: 'page', label: '', pageId: '' },
    });
  });

  it('uses defaults, calling lazy defaults every time', () => {
    let calls = 0;
    const schema = z.object({
      delay: z.number().default(5),
      status: z.enum(['a', 'b']).default('b'),
      startsAt: z.date().default(() => new Date(2030, 0, ++calls)),
    });

    const first = emptyValues(schema);
    const second = emptyValues(schema);

    expect(first).toMatchObject({
      delay: 5,
      status: 'b',
      startsAt: new Date(2030, 0, 1),
    });
    expect(second).toMatchObject({ startsAt: new Date(2030, 0, 2) });
  });

  it('keeps prefaults as input values', () => {
    const schema = z.object({
      count: z
        .string()
        .transform(value => value.length)
        .prefault('abc'),
    });

    expect(emptyValues(schema)).toEqual({ count: 'abc' });
  });

  it('fills an object default with the empty values of its keys', () => {
    const schema = z.object({
      settings: z
        .object({
          name: z.string(),
          size: z.number().default(3),
          mode: z.enum(['a', 'b']),
        })
        .default({ name: 'n', size: 1, mode: 'a' }),
      partial: z
        .object({ name: z.string(), size: z.number().default(3) })
        .prefault({ name: 'p' }),
    });

    expect(emptyValues(schema)).toEqual({
      settings: { name: 'n', size: 1, mode: 'a' },
      partial: { name: 'p', size: 3 },
    });
  });

  it('treats custom kinds as leaves', () => {
    const schema = z.object({
      image: withKind(z.object({ id: z.string() }), 'image'),
      page: withKind(z.object({ id: z.string() }), 'page').optional(),
    });

    expect(emptyValues(schema)).toEqual({ image: null, page: undefined });
  });

  it('builds the first branch of a discriminated union root', () => {
    expect(emptyValues(link)).toEqual({ type: 'page', label: '', pageId: '' });
  });

  it('expands optional and nullable object groups to their blank shape', () => {
    const schema = z.object({
      seo: z
        .object({
          slug: z.string().min(1),
          size: z.number().default(3),
          meta: z.object({ title: z.string() }).nullish(),
          link,
        })
        .optional(),
      address: z.object({ street: z.string() }).nullable(),
      optionalLink: link.optional(),
      image: withKind(z.object({ id: z.string() }), 'image').nullable(),
    });

    expect(emptyValues(schema)).toEqual({
      seo: {
        slug: '',
        size: 3,
        meta: { title: '' },
        link: { type: 'page', label: '', pageId: '' },
      },
      address: { street: '' },
      optionalLink: undefined,
      image: null,
    });
  });

  it('evaluates a lazy default inside an optional group once', () => {
    let calls = 0;
    const schema = z.object({
      seo: z
        .object({
          title: z.string(),
          publishedAt: z.date().default(() => new Date(2030, 0, ++calls)),
          tags: withKind(z.array(z.string()), 'tags').default(() => ['news']),
        })
        .optional(),
    });

    const first = emptyValues(schema);
    const second = mergeValues(schema, emptyValues(schema), { seo: null });

    expect(first).toEqual({
      seo: { title: '', publishedAt: new Date(2030, 0, 1), tags: ['news'] },
    });
    expect(second).toEqual(first);
    expect(calls).toBe(1);
  });

  it('stops expanding optional groups where a lazy schema recurses', () => {
    const node: z.ZodType = z.lazy(() =>
      z.object({
        label: z.string(),
        first: node.optional(),
        second: node.optional(),
        parent: node.nullable(),
      })
    );

    expect(emptyValues(z.object({ tree: node.optional() }))).toEqual({
      tree: { label: '', first: undefined, second: undefined, parent: null },
    });
  });

  it('stops expanding optional groups where a getter recurses', () => {
    const category: z.ZodType = z.object({
      name: z.string(),
      get parent() {
        return category.nullable();
      },
    });

    expect(emptyValues(z.object({ category }))).toEqual({
      category: { name: '', parent: null },
    });
  });

  it('stops on required recursive objects', () => {
    const node: z.ZodType = z.object({
      label: z.string(),
      get child() {
        return node;
      },
    });

    expect(() => emptyValues(node)).not.toThrow();
  });
});

describe('branchEmpty', () => {
  it('builds the empty value of a branch with its discriminator set', () => {
    expect(branchEmpty(external, 'type')).toEqual({
      type: 'external',
      label: '',
      url: '',
    });
  });
});

const schema = z.object({
  title: z.string().min(1),
  delay: z.number().int(),
  startsAt: z.date().nullable(),
  tags: z.array(z.string()),
  image: withKind(z.custom<{ id: string; url: string }>(), 'image').nullable(),
  author: z.object({ id: z.string(), name: z.string() }).nullable(),
  address: z.object({ street: z.string(), zip: z.string() }),
  actions: z.array(z.object({ label: z.string(), url: z.string() })),
  links: z.array(link),
  link,
});

const load = (loaded: unknown) =>
  mergeValues(schema, emptyValues(schema), loaded);

describe('mergeValues', () => {
  it('copies only the keys of the schema', () => {
    expect(load({ __typename: 'Banner', title: 'Hi', id: 'b1' })).toEqual({
      ...(emptyValues(schema) as object),
      title: 'Hi',
    });
  });

  it('keeps the empty value for undefined and takes null', () => {
    expect(
      load({ delay: undefined, startsAt: null, image: null })
    ).toMatchObject({
      delay: null,
      startsAt: null,
      image: null,
    });
  });

  it('expands a null optional or nullable group to its blank shape', () => {
    const groups = z.object({
      author: z.object({ id: z.string(), name: z.string() }).nullable(),
      seo: z.object({ slug: z.string() }).optional(),
      address: z.object({ street: z.string() }),
      link: link.nullable(),
    });

    expect(
      mergeValues(groups, emptyValues(groups), {
        author: null,
        seo: null,
        address: null,
        link: null,
      })
    ).toEqual({
      author: { id: '', name: '' },
      seo: { slug: '' },
      address: null,
      link: null,
    });
  });

  it('keeps null where a recursive group would expand again', () => {
    const node: z.ZodType = z.lazy(() =>
      z.object({ label: z.string(), child: node.nullable() })
    );
    const tree = z.object({ tree: node.nullable() });

    expect(
      mergeValues(tree, emptyValues(tree), {
        tree: { label: 'a', child: { label: 'b', child: null } },
      })
    ).toEqual({ tree: { label: 'a', child: { label: 'b', child: null } } });
    expect(mergeValues(tree, emptyValues(tree), { tree: null })).toEqual({
      tree: { label: '', child: null },
    });
  });

  it('takes dates, primitive arrays and custom kinds whole', () => {
    const startsAt = new Date(2030, 0, 1);
    const image = { id: 'i', url: 'u', __typename: 'Image' };

    expect(load({ startsAt, tags: ['b'], image })).toMatchObject({
      startsAt,
      tags: ['b'],
      image,
    });
  });

  it('merges nested objects key by key', () => {
    expect(
      load({ address: { street: 'Main', __typename: 'Address' } })
    ).toMatchObject({
      address: { street: 'Main', zip: '' },
    });
    expect(load({ author: { id: 'a', name: 'n', email: 'x' } })).toMatchObject({
      author: { id: 'a', name: 'n' },
    });
  });

  it('merges every array item against the element schema', () => {
    const merged = load({
      actions: [{ label: 'a', __typename: 'Action' }],
      links: [
        {
          __typename: 'ExternalLink',
          type: 'external',
          label: 'e',
          url: 'https://x',
        },
        { type: 'page', pageId: 'p' },
      ],
    });

    expect(merged).toMatchObject({
      actions: [{ label: 'a', url: '' }],
      links: [
        { type: 'external', label: 'e', url: 'https://x' },
        { type: 'page', label: '', pageId: 'p' },
      ],
    });
  });

  it('replaces a discriminated union value with the selected branch', () => {
    const merged = load({
      link: {
        __typename: 'L',
        type: 'external',
        url: 'https://x',
        pageId: 'stale',
      },
    });

    expect(merged).toMatchObject({
      link: { type: 'external', label: '', url: 'https://x' },
    });
  });

  it('merges a union value without discriminator into the branch of the base', () => {
    expect(
      mergeValues(
        link,
        { type: 'external', label: 'old', url: 'u' },
        { label: 'new' }
      )
    ).toEqual({ type: 'external', label: 'new', url: 'u' });
  });

  it('returns values that do not fit the schema unchanged', () => {
    expect(mergeValues(schema, emptyValues(schema), 'x')).toBe('x');
    expect(load({ address: 'x' })).toMatchObject({ address: 'x' });
    expect(mergeValues(link, undefined, { type: 'unknown' })).toEqual({
      type: 'unknown',
    });
  });

  it('merges a discriminated union root', () => {
    expect(
      mergeValues(link, emptyValues(link), {
        type: 'external',
        url: 'u',
        id: 1,
      })
    ).toEqual({
      type: 'external',
      label: '',
      url: 'u',
    });
  });

  it('does not mutate its inputs', () => {
    const base = emptyValues(schema);
    const snapshot = JSON.stringify(base);

    mergeValues(schema, base, { title: 'x', address: { street: 's' } });

    expect(JSON.stringify(base)).toBe(snapshot);
  });
});

describe('activeBranch', () => {
  it('finds the branch whose discriminator accepts the value', () => {
    expect(activeBranch(link, { type: 'external' })).toBe(external);
    expect(activeBranch(link.optional(), { type: 'page' })).toBe(page);
    expect(activeBranch(link, { type: 'x' })).toBeUndefined();
    expect(activeBranch(z.string(), { type: 'page' })).toBeUndefined();
  });
});
