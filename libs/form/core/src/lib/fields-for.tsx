import type { ReactNode } from 'react';
import type { z } from 'zod/v4';
import { SchemaAutoFields } from './auto-fields';
import type { ComponentMap } from './component-types';
import { joinPath } from './field-path';
import type { CreatedForm } from './form-types';
import { toOverride } from './overrides';
import { SchemaField } from './schema-field';

type FieldsForComponents = {
  Field: (props: { name: string }) => ReactNode;
  AutoFields: (props: { omit?: readonly string[] }) => ReactNode;
};

const created = new WeakMap<z.ZodType, Map<string, FieldsForComponents>>();

function buildFieldsFor(
  schema: z.ZodType,
  prefix: string
): FieldsForComponents {
  function Field({ name, ...call }: { name: string }): ReactNode {
    return (
      <SchemaField
        name={joinPath(prefix, name)}
        call={toOverride(call)}
        owner={schema}
      />
    );
  }

  function AutoFields({ omit }: { omit?: readonly string[] }): ReactNode {
    return (
      <SchemaAutoFields
        scope={prefix}
        omit={omit}
        owner={schema}
      />
    );
  }

  return { Field, AutoFields };
}

function fieldsForSchema(
  schema: z.ZodType,
  prefix: string
): FieldsForComponents {
  const scopes = created.get(schema) ?? new Map<string, FieldsForComponents>();
  const cached = scopes.get(prefix);

  if (cached) {
    return cached;
  }

  const fresh = buildFieldsFor(schema, prefix);

  scopes.set(prefix, fresh);
  created.set(schema, scopes);

  return fresh;
}

export function createFieldsFor<
  C extends ComponentMap,
>(): CreatedForm<C>['fieldsFor'] {
  return (schema, scope) => fieldsForSchema(schema, scope ?? '');
}
