import { z } from 'zod/v4';
import { withKind } from './kind';
import { fieldMeta, formMetaKeys } from './meta';

describe('fieldMeta', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('reads the form keys of a schema', () => {
    const schema = z.string().meta({
      label: 'a.label',
      description: 'a.description',
      helperText: 'a.helper',
      placeholder: 'a.placeholder',
      optionLabelPrefix: 'a.option.',
    });

    expect(fieldMeta(schema)).toEqual({
      label: 'a.label',
      description: 'a.description',
      helperText: 'a.helper',
      placeholder: 'a.placeholder',
      optionLabelPrefix: 'a.option.',
    });
  });

  it('merges meta across wrapper layers, the outer layer winning', () => {
    const schema = z
      .string()
      .meta({ label: 'inner', helperText: 'H' })
      .optional()
      .meta({ label: 'outer' });

    expect(fieldMeta(schema)).toEqual({ label: 'outer', helperText: 'H' });
  });

  it('reads meta through kinds, pipes, lazies and empty string unions', () => {
    const kinded = withKind(z.string(), 'textarea')
      .min(1)
      .meta({ helperText: 'h' })
      .optional()
      .default('');
    const piped = z
      .string()
      .meta({ label: 'piped' })
      .transform(value => value.length);
    const lazy = z.lazy(() => z.string().meta({ label: 'lazy' }));
    const orEmpty = z
      .string()
      .regex(/^G-/)
      .meta({ label: 'inner' })
      .or(z.literal(''))
      .nullish()
      .meta({ helperText: 'outer' });

    expect(fieldMeta(kinded)).toEqual({ helperText: 'h' });
    expect(fieldMeta(piped)).toEqual({ label: 'piped' });
    expect(fieldMeta(lazy)).toEqual({ label: 'lazy' });
    expect(fieldMeta(orEmpty)).toEqual({ label: 'inner', helperText: 'outer' });
  });

  it('takes the description from describe()', () => {
    expect(fieldMeta(z.string().describe('a.description'))).toEqual({
      description: 'a.description',
    });
  });

  it('is empty without meta', () => {
    expect(fieldMeta(z.string())).toEqual({});
  });

  it('accepts zod keys but leaves them out', () => {
    const schema = z
      .string()
      .meta({ title: 't', deprecated: true, examples: ['x'] });

    expect(fieldMeta(schema)).toEqual({});
  });

  it('throws on unknown keys in development', () => {
    expect(() =>
      fieldMeta(z.string().meta({ lable: 'x', hepler: 'y' }))
    ).toThrow('Unknown form meta key(s) "lable", "hepler".');
  });

  it('ignores unknown keys in production', () => {
    vi.stubEnv('NODE_ENV', 'production');

    expect(fieldMeta(z.string().meta({ lable: 'x', label: 'y' }))).toEqual({
      label: 'y',
    });
  });

  it('exports the form keys', () => {
    expect(formMetaKeys).toEqual([
      'label',
      'description',
      'helperText',
      'placeholder',
      'optionLabelPrefix',
    ]);
  });
});
