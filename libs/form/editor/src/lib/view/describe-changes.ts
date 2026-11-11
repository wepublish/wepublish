import {
  fieldMeta,
  getChangedEntries,
  resolveKind,
  schemaAt,
  type AnyFormSchema,
  type SchemaForm,
} from '@wepublish/form/core';

import type { ViewFields } from './form-view';
import type { FormChange, SaveConfirmation } from './use-form-controller';

type Translate = (key: string, params?: Record<string, unknown>) => string;

type ValueFormat = (value: unknown) => string;

const ENUM_KINDS: ReadonlySet<string> = new Set(['enum', 'radio']);

const isPrimitive = (value: unknown) =>
  typeof value === 'string' ||
  typeof value === 'number' ||
  typeof value === 'boolean';

function unitOf(fields: ViewFields<AnyFormSchema>, key: string) {
  const override: unknown = (fields as Record<string, unknown>)[key];

  if (typeof override !== 'object' || override === null) {
    return undefined;
  }

  const props: unknown = (override as { props?: unknown }).props;

  if (typeof props !== 'object' || props === null) {
    return undefined;
  }

  const unit: unknown = (props as { unit?: unknown }).unit;

  return typeof unit === 'string' ? unit : undefined;
}

function describeValue(
  value: unknown,
  t: Translate,
  optionPrefix: string | undefined,
  unit: string | undefined
): string {
  if (value === null || value === undefined || value === '') {
    return t('form.value.empty');
  }

  if (typeof value === 'boolean') {
    return value ? t('form.value.on') : t('form.value.off');
  }

  if (optionPrefix !== undefined && isPrimitive(value)) {
    return t(`${optionPrefix}${String(value)}`);
  }

  if (typeof value === 'number') {
    return unit === undefined ?
        String(value)
      : `${value} ${t(unit, { count: value })}`;
  }

  if (typeof value === 'string') {
    return value;
  }

  if (Array.isArray(value) && value.every(isPrimitive)) {
    return value.map(String).join(', ');
  }

  return t('form.value.changed');
}

export function describeChanges<S extends AnyFormSchema>(
  schema: S,
  fields: ViewFields<S>,
  form: SchemaForm<S>['form'],
  t: Translate,
  format: SaveConfirmation<S>['format']
): FormChange[] {
  const formats = (format ?? {}) as Readonly<
    Record<string, ValueFormat | undefined>
  >;

  return getChangedEntries(form).map(({ key, before, after }) => {
    const at = schemaAt(schema, key);
    const meta = at === undefined ? {} : fieldMeta(at);
    const kind = at === undefined ? undefined : resolveKind(at)?.kind;
    const optionPrefix =
      kind !== undefined && ENUM_KINDS.has(kind) ?
        meta.optionLabelPrefix
      : undefined;
    const unit = unitOf(fields as ViewFields<AnyFormSchema>, key);
    const custom = formats[key];
    const text = (value: unknown) =>
      custom === undefined ?
        describeValue(value, t, optionPrefix, unit)
      : custom(value);

    return {
      path: key,
      label: meta.label === undefined ? key : t(meta.label),
      before,
      after,
      beforeText: text(before),
      afterText: text(after),
    };
  });
}
