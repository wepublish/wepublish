import { z } from 'zod/v4';
import { clearedValue, clearedValueOver, isRequired } from './cleared-value';
import { withKind } from './kind';

describe('clearedValue and isRequired', () => {
  it.each<[string, z.ZodType, unknown, boolean]>([
    ['string', z.string(), '', false],
    ['string().min(1)', z.string().min(1), '', true],
    ['textarea kind', withKind(z.string(), 'textarea').min(1), '', true],
    ['optional email', z.email().optional(), undefined, false],
    ['nullish email', z.email().nullish(), null, false],
    ['email', z.email(), '', true],
    ['email with default', z.email().default('a@b.ch'), null, true],
    ['string with default', z.string().default('x'), null, true],
    ['string with prefault', z.string().prefault('x'), null, true],
    [
      'textarea kind with default',
      withKind(z.string(), 'textarea').default(''),
      null,
      true,
    ],
    [
      'nullable string with default',
      z.string().nullable().default('x'),
      '',
      false,
    ],
    ['array with default', z.array(z.string()).default([]), [], false],
    [
      'regex or empty',
      z.string().regex(/^G-/).or(z.literal('')).nullish(),
      '',
      false,
    ],
    ['number', z.number(), null, true],
    ['number with default', z.number().default(0), null, true],
    ['nullable number', z.number().nullable(), null, false],
    ['optional number', z.number().optional(), undefined, false],
    ['enum', z.enum(['a', 'b']), null, true],
    ['enum with default', z.enum(['a', 'b']).default('a'), null, true],
    ['enum or empty', z.enum(['a', 'b']).or(z.literal('')), '', false],
    ['nullish enum', z.enum(['a', 'b']).nullish(), null, false],
    ['boolean', z.boolean(), false, false],
    ['boolean with default', z.boolean().default(true), false, false],
    ['checkbox kind', withKind(z.boolean(), 'checkbox'), false, false],
    ['literal true', z.literal(true), null, true],
    ['array().min(1)', z.array(z.string()).min(1), [], true],
    ['array', z.array(z.string()), [], false],
    ['tags kind', withKind(z.array(z.string()), 'tags'), [], false],
    [
      'required tags kind',
      withKind(z.array(z.string()).min(1), 'tags'),
      [],
      true,
    ],
    ['date', z.date(), null, true],
    ['nullable date', z.date().nullable(), null, false],
    [
      'nullable image',
      withKind(z.custom<{ id: string }>(), 'image').nullable(),
      null,
      false,
    ],
    [
      'required image',
      withKind(
        z.custom<{ id: string }>(value => value != null),
        'image'
      ),
      null,
      true,
    ],
    ['object', z.object({ a: z.string() }), null, true],
    [
      'optional object',
      z.object({ a: z.string() }).optional(),
      undefined,
      false,
    ],
  ])('%s', (_name, schema, cleared, required) => {
    expect(clearedValue(schema)).toEqual(cleared);
    expect(isRequired(schema)).toBe(required);
  });

  it('treats a field with an async refine as not required', () => {
    const schema = z.string().refine(async () => true);

    expect(clearedValue(schema)).toBe('');
    expect(isRequired(schema)).toBe(false);
  });
});

describe('clearedValueOver', () => {
  it.each<[string, z.ZodType, unknown, unknown]>([
    ['nullish string loaded as null', z.string().nullish(), null, null],
    ['nullable string loaded as null', z.string().nullable(), null, null],
    ['nullish string loaded as empty', z.string().nullish(), '', ''],
    ['nullish string loaded with text', z.string().nullish(), 'abc', ''],
    [
      'nullish string without a loaded value',
      z.string().nullish(),
      undefined,
      '',
    ],
    ['string loaded as null', z.string(), null, ''],
    ['nullish enum loaded as empty', z.enum(['a', 'b']).nullish(), '', null],
    ['defaulted string loaded as empty', z.string().default('x'), '', null],
    [
      'nullable defaulted string loaded as null',
      z.string().nullable().default('x'),
      null,
      null,
    ],
    ['optional number loaded as null', z.number().optional(), null, undefined],
  ])('%s', (_name, schema, initial, cleared) => {
    expect(clearedValueOver(schema, initial)).toEqual(cleared);
  });
});
