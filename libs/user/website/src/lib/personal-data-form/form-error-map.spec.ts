import { t } from 'i18next';
import { z } from 'zod';

import { formErrorMap } from './form-error-map';

const messages = (schema: z.ZodTypeAny, value: unknown) => {
  const result = schema.safeParse(value, {
    errorMap: formErrorMap(t),
  });

  return result.success ? [] : result.error.issues.map(issue => issue.message);
};

describe('formErrorMap', () => {
  it('calls an empty required field empty', () => {
    expect(messages(z.string().min(1), '')).toEqual(['Darf nicht leer sein']);
  });

  it('names the least number of characters of a longer minimum', () => {
    expect(messages(z.string().min(2), 'a')).toEqual(['Mind. 2 Zeichen']);
    expect(messages(z.string().min(12), 'a')).toEqual(['Mind. 12 Zeichen']);
  });

  it('asks to pick an option instead of listing them all', () => {
    expect(messages(z.enum(['Schweiz', 'Deutschland']), '')).toEqual([
      'Bitte eine Option wählen',
    ]);
  });

  it('leaves every other message to the global error map', () => {
    const schema = z.string().email();
    const global = schema.safeParse('no-email');

    expect(messages(schema, 'no-email')).toEqual(
      global.success ? [] : global.error.issues.map(issue => issue.message)
    );
  });
});
