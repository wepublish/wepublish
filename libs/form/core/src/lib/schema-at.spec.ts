import { z } from 'zod/v4';
import { resolveKind, withKind } from './kind';
import { fieldMeta } from './meta';
import { schemaAt, topLevelKeys } from './schema-at';

const title = z.string().min(1);
const street = z.string();
const actionLabel = z.string();
const pageId = z.string();
const url = z.url();
const linkLabel = z.string();

const schema = z
  .object({
    title,
    address: z.object({ street }).optional(),
    actions: z.array(z.object({ label: actionLabel })),
    link: z.discriminatedUnion('type', [
      z.object({
        type: z.literal('page').meta({ label: 'link.type' }),
        label: linkLabel,
        pageId,
      }),
      z.object({ type: z.literal('external'), label: z.string(), url }),
    ]),
    image: withKind(z.object({ id: z.string() }), 'image').nullable(),
  })
  .refine(() => true);

describe('schemaAt', () => {
  it('returns the schema itself for the empty path', () => {
    expect(schemaAt(schema, '')).toBe(schema);
  });

  it('walks object keys through wrappers', () => {
    expect(schemaAt(schema, 'title')).toBe(title);
    expect(schemaAt(schema, 'address.street')).toBe(street);
  });

  it('walks array items by * or by index', () => {
    expect(schemaAt(schema, 'actions.*.label')).toBe(actionLabel);
    expect(schemaAt(schema, 'actions.12.label')).toBe(actionLabel);
    expect(resolveKind(schemaAt(schema, 'actions.*') ?? z.never())?.kind).toBe(
      'object'
    );
  });

  it('walks into the discriminated union branch that has the key', () => {
    expect(schemaAt(schema, 'link.pageId')).toBe(pageId);
    expect(schemaAt(schema, 'link.url')).toBe(url);
    expect(schemaAt(schema, 'link.label')).toBe(linkLabel);
  });

  it('returns a union of every branch literal for the discriminator', () => {
    const discriminator = schemaAt(schema, 'link.type') ?? z.never();

    expect(resolveKind(discriminator)?.kind).toBe('enum');
    expect([...(discriminator._zod.values ?? [])]).toEqual([
      'page',
      'external',
    ]);
    expect(fieldMeta(discriminator)).toEqual({ label: 'link.type' });
    expect(schemaAt(schema, 'link.type')).toBe(discriminator);
  });

  it('labels the discriminator without registering it in the global registry', () => {
    const discriminator = schemaAt(schema, 'link.type') ?? z.never();

    expect(fieldMeta(discriminator)).toEqual({ label: 'link.type' });
    expect(z.globalRegistry.has(discriminator)).toBe(false);
  });

  it('treats custom kinds as leaves', () => {
    expect(schemaAt(schema, 'image')).toBeDefined();
    expect(schemaAt(schema, 'image.id')).toBeUndefined();
  });

  it('returns undefined for unknown paths', () => {
    expect(schemaAt(schema, 'titel')).toBeUndefined();
    expect(schemaAt(schema, 'title.length')).toBeUndefined();
    expect(schemaAt(schema, 'actions.label')).toBeUndefined();
    expect(schemaAt(schema, 'link.unknown')).toBeUndefined();
  });

  it('walks a discriminated union root', () => {
    const secretKey = z.string();
    const root = z.discriminatedUnion('type', [
      z.object({ type: z.literal('stripe'), secretKey }),
      z.object({ type: z.literal('payrexx'), instance: z.string() }),
    ]);

    expect(schemaAt(root, 'secretKey')).toBe(secretKey);
    expect([...(schemaAt(root, 'type')?._zod.values ?? [])]).toEqual([
      'stripe',
      'payrexx',
    ]);
  });

  it('walks getter-recursive schemas', () => {
    const label = z.string();
    const node = z.object({
      label,
      get children() {
        return z.array(node);
      },
    });

    expect(schemaAt(node, 'children.*.children.*.label')).toBe(label);
  });
});

describe('topLevelKeys', () => {
  it('lists object keys in schema order', () => {
    expect(topLevelKeys(schema)).toEqual([
      'title',
      'address',
      'actions',
      'link',
      'image',
    ]);
  });

  it('lists the discriminator first, then every branch key once', () => {
    const root = z.discriminatedUnion('type', [
      z.object({
        label: z.string(),
        type: z.literal('stripe'),
        secretKey: z.string(),
      }),
      z.object({
        type: z.literal('payrexx'),
        label: z.string(),
        instance: z.string(),
      }),
    ]);

    expect(topLevelKeys(root)).toEqual([
      'type',
      'label',
      'secretKey',
      'instance',
    ]);
  });

  it('reads through a transformed root', () => {
    const transformed = z.object({ a: z.string() }).transform(value => value.a);

    expect(topLevelKeys(transformed)).toEqual(['a']);
  });

  it('is empty for non-container schemas', () => {
    expect(topLevelKeys(z.string())).toEqual([]);
  });
});
