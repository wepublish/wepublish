import type { z } from 'zod/v4';
import { joinPath } from './field-path';
import { assertOwnSchema, useFormRuntime } from './form-runtime';
import { LoadState } from './load-state';
import { schemaAt, topLevelKeys } from './schema-at';
import { SchemaField } from './schema-field';

export type SchemaAutoFieldsProps = {
  scope?: string;
  omit?: readonly string[];
  owner?: z.ZodType;
};

export function SchemaAutoFields({
  scope = '',
  omit = [],
  owner,
}: SchemaAutoFieldsProps) {
  const runtime = useFormRuntime();

  assertOwnSchema(runtime, owner, 'AutoFields');

  const target =
    scope === '' ? runtime.schema : schemaAt(runtime.schema, scope);
  const keys =
    target === undefined ?
      []
    : topLevelKeys(target).filter(key => !omit.includes(key));

  return (
    <>
      <LoadState />
      {keys.map(key => (
        <SchemaField
          key={key}
          name={joinPath(scope, key)}
        />
      ))}
    </>
  );
}
