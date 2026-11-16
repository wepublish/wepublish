import { useContext, type ReactNode } from 'react';
import {
  get,
  useFieldArray,
  useFormContext,
  useFormState,
} from 'react-hook-form';
import type { z } from 'zod/v4';
import { fieldErrorOf } from './field-errors';
import { joinPath } from './field-path';
import {
  fieldPresentation,
  type FieldPresentation,
} from './field-presentation';
import { staticDescription, staticLabel, translateText } from './field-text';
import {
  ItemScopeContext,
  useFieldRuntime,
  useFormRuntime,
} from './form-runtime';
import { emptyValues } from './initial-values';
import { innermost } from './kind';
import type { ChildOverride } from './override-types';
import { toOverride } from './overrides';
import { schemaAt, topLevelKeys } from './schema-at';
import { SchemaField } from './schema-field';
import { defOf } from './zod-def';

export type ArrayFieldItem = { key: string; index: number };

export type ArrayItemKey = {
  key: string;
  label: ReactNode;
  description: ReactNode;
};

export type UseArrayFieldReturn = FieldPresentation & {
  items: ArrayFieldItem[];
  itemKeys: ArrayItemKey[];
  count: number;
  append: () => void;
  remove: (index: number) => void;
  move: (from: number, to: number) => void;
  renderItem: (index: number, override?: ChildOverride) => ReactNode;
};

const elementOf = (array: z.ZodType): z.ZodType | undefined => {
  const def = defOf(innermost(array));

  return def.type === 'array' ? def.element : undefined;
};

const emptyItem = (element: z.ZodType | undefined): unknown => {
  if (element === undefined) {
    return undefined;
  }

  const value = emptyValues(element);

  return value === null || value === undefined ?
      emptyValues(innermost(element))
    : value;
};

export function useArrayField(): UseArrayFieldReturn {
  const field = useFieldRuntime('useArrayField');
  const runtime = useFormRuntime();
  const scope = useContext(ItemScopeContext);
  const form = useFormContext();
  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: field.path,
  });
  const { errors } = useFormState({ control: form.control, name: field.path });
  const element = elementOf(field.schema);
  const itemName = joinPath(field.name, '*');
  const { layout: Layout } = toOverride(runtime.fields[itemName]);
  const count = fields.length;

  const itemKeys = (element === undefined ? [] : topLevelKeys(element)).map(
    key => {
      const keyOverride = toOverride(runtime.fields[joinPath(itemName, key)]);
      const keySchema =
        element === undefined ? undefined : schemaAt(element, key);

      return {
        key,
        label: translateText(runtime.t, staticLabel(keyOverride, keySchema)),
        description: translateText(
          runtime.t,
          staticDescription(keyOverride, keySchema)
        ),
      };
    }
  );

  const renderItem = (index: number, override?: ChildOverride) => (
    <ItemScopeContext.Provider
      value={{ ...scope, [field.name]: `${field.path}.${index}` }}
    >
      {Layout ?
        <Layout
          index={index}
          count={count}
          remove={() => remove(index)}
          move={to => move(index, to)}
        />
      : <SchemaField
          name={itemName}
          call={toOverride(override)}
        />
      }
    </ItemScopeContext.Provider>
  );

  return {
    ...fieldPresentation(
      runtime,
      field,
      fieldErrorOf(get(errors, field.path), true)
    ),
    items: fields.map((item, index) => ({ key: item.id, index })),
    itemKeys,
    count,
    append: () => append(emptyItem(element)),
    remove,
    move,
    renderItem,
  };
}
