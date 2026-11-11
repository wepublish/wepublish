import { z } from 'zod/v4';
import { createTestForm } from '../testing/form-test-kit';
import { SchemaAutoFields } from './auto-fields';
import { LoadState } from './load-state';
import { SchemaField } from './schema-field';
import { useArrayField } from './use-array-field';
import { useErrorEntries } from './use-error-entries';
import { useField } from './use-field';
import { useFieldErrors } from './use-field-errors';
import { useFormErrorSummary } from './use-form-error-summary';
import { useFormStatus } from './use-form-status';
import { useObjectField } from './use-object-field';
import { useUnionField } from './use-union-field';

const form = createTestForm();
const { Field, AutoFields } = form.fieldsFor(z.object({ title: z.string() }));

const isCompiled = (code: string) => /\$\[\d+\]/.test(code);

describe('the React layer under test', () => {
  it.each([
    ['Form', form.Form],
    ['useSchemaForm', form.useSchemaForm],
    ['Field', Field],
    ['AutoFields', AutoFields],
    ['SchemaField', SchemaField],
    ['SchemaAutoFields', SchemaAutoFields],
    ['LoadState', LoadState],
    ['useField', useField],
    ['useArrayField', useArrayField],
    ['useObjectField', useObjectField],
    ['useUnionField', useUnionField],
    ['useFormStatus', useFormStatus],
    ['useFieldErrors', useFieldErrors],
    ['useErrorEntries', useErrorEntries],
    ['useFormErrorSummary', useFormErrorSummary],
  ])('runs %s through the React Compiler', (_name, compiled) => {
    expect(isCompiled(compiled.toString())).toBe(true);
  });
});
