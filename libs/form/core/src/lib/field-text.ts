import type { ReactNode } from 'react';
import type { FieldValues } from 'react-hook-form';
import type { z } from 'zod/v4';
import {
  fieldOptions,
  optionLabelKey,
  optionLabelPrefix,
  type OptionValue,
} from './field-info';
import type { Translate } from './form-types';
import { fieldMeta } from './meta';
import type {
  OptionEntry,
  ResolvedOverride,
  RuntimeOverride,
} from './overrides';

export type FieldOptionItem = { value: OptionValue; label: ReactNode };

export const translateText = (t: Translate, value: ReactNode): ReactNode =>
  typeof value === 'string' ? t(value) : value;

export function staticLabel(
  override: RuntimeOverride,
  schema: z.ZodType | undefined
): ReactNode {
  const { label } = override;

  if (label !== undefined) {
    return typeof label === 'function' ? undefined : label;
  }

  return schema === undefined ? undefined : fieldMeta(schema).label;
}

export function staticDescription(
  override: RuntimeOverride,
  schema: z.ZodType | undefined
): ReactNode {
  const { description } = override;

  if (description !== undefined) {
    return typeof description === 'function' ? undefined : description;
  }

  return schema === undefined ? undefined : fieldMeta(schema).description;
}

export function evaluatedLabel(
  override: RuntimeOverride,
  schema: z.ZodType | undefined,
  values: FieldValues
): ReactNode {
  const { label } = override;
  const evaluated = typeof label === 'function' ? label(values) : label;

  return (
    evaluated ?? (schema === undefined ? undefined : fieldMeta(schema).label)
  );
}

const isLabelled = (
  entry: OptionEntry
): entry is Exclude<OptionEntry, OptionValue> =>
  typeof entry === 'object' && entry !== null;

export function labelledOptions(
  schema: z.ZodType,
  override: Pick<ResolvedOverride, 'options' | 'optionLabel'>,
  t: Translate
): FieldOptionItem[] {
  const prefix = optionLabelPrefix(schema);
  const entries =
    override.options ?? fieldOptions(schema).map(option => option.value);

  const labelOf = (value: OptionValue): ReactNode => {
    if (override.optionLabel) {
      return translateText(t, override.optionLabel(value));
    }

    const key = optionLabelKey(prefix, value);

    return key === undefined ? String(value) : t(key);
  };

  return entries.map(entry =>
    isLabelled(entry) ?
      { value: entry.value, label: entry.label }
    : { value: entry, label: labelOf(entry) }
  );
}
