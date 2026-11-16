import { z } from 'zod/v4';
import { withKind } from './kind';
import { fieldMeta, type FormMeta } from './meta';

describe('GlobalMeta augmentation', () => {
  it('types the form keys in .meta()', () => {
    z.string().meta({
      label: 'a.b',
      description: 'd',
      helperText: 'h',
      placeholder: 'p',
    });
    z.enum(['a', 'b']).meta({ optionLabelPrefix: 'enum.x.' });
    withKind(z.string(), 'textarea').min(1).meta({ label: 'x' });

    const read = z.string().meta({ label: 'k' }).meta();

    expectTypeOf(read).toEqualTypeOf<z.core.GlobalMeta | undefined>();
    expectTypeOf<NonNullable<typeof read>['label']>().toEqualTypeOf<
      string | undefined
    >();
    expectTypeOf<z.core.GlobalMeta['description']>().toEqualTypeOf<
      string | undefined
    >();
    expectTypeOf<
      NonNullable<ReturnType<typeof z.globalRegistry.get>>['label']
    >().toEqualTypeOf<string | undefined>();
  });

  it('rejects values that are not strings', () => {
    // @ts-expect-error label must be a string
    z.string().meta({ label: 1 });
    // @ts-expect-error helperText must be a string
    z.string().meta({ helperText: { key: 'x' } });
    // @ts-expect-error description must be a string
    z.string().meta({ description: 1 });
    // @ts-expect-error optionLabelPrefix must be a string
    z.string().meta({ optionLabelPrefix: true });
  });

  it('lets typos through .meta() because of the index signature', () => {
    z.string().meta({ lable: 'a.b' });
  });

  it('catches typos with satisfies FormMeta', () => {
    // @ts-expect-error FormMeta has no index signature
    z.string().meta({ lable: 'a.b' } satisfies FormMeta);
    z.string().meta({ label: 'a.b' } satisfies FormMeta);
  });
});

describe('fieldMeta', () => {
  it('returns the form keys only', () => {
    expectTypeOf(fieldMeta(z.string())).toEqualTypeOf<FormMeta>();
    expectTypeOf<keyof FormMeta>().toEqualTypeOf<
      | 'label'
      | 'description'
      | 'helperText'
      | 'placeholder'
      | 'optionLabelPrefix'
    >();
  });
});
