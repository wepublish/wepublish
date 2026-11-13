import type { ReactNode } from 'react';
import type { FieldValues } from 'react-hook-form';
import type { BoundComponent } from './bind-component';
import type { OptionValue } from './field-info';
import { schemaPathOf } from './field-path';
import type { FieldActions, ItemLayout } from './override-types';

type Evaluator<T> = { evaluate(values: FieldValues): T }['evaluate'];

export type DynamicValue<T> = T | Evaluator<T>;

export type FieldProps = Readonly<Record<string, unknown>>;

export type OptionEntry =
  OptionValue | { value: OptionValue; label: ReactNode };

export type OverrideCallbacks = {
  hideLabel?: boolean;
  component?: BoundComponent;
  layout?: ItemLayout;
  optionLabel?(value: OptionValue): ReactNode;
  normalize?(next: unknown): unknown;
  guard?(next: unknown, actions: FieldActions<FieldValues>): boolean;
  onValueChange?(value: unknown, actions: FieldActions<FieldValues>): void;
};

export type ResolvedOverride = OverrideCallbacks & {
  label?: ReactNode;
  description?: ReactNode;
  helperText?: ReactNode;
  placeholder?: string;
  hidden?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  options?: readonly OptionEntry[];
  props?: FieldProps;
};

export type RuntimeOverride = OverrideCallbacks & {
  [K in DynamicKey]?: DynamicValue<NonNullable<ResolvedOverride[K]>>;
};

export type OverrideMap = Readonly<Partial<Record<string, unknown>>>;

const DYNAMIC_KEYS = [
  'label',
  'description',
  'helperText',
  'placeholder',
  'hidden',
  'disabled',
  'readOnly',
  'required',
  'options',
  'props',
] as const;

type DynamicKey = (typeof DYNAMIC_KEYS)[number];

const isOverride = (value: unknown): value is RuntimeOverride =>
  typeof value === 'object' && value !== null;

export const toOverride = (value: unknown): RuntimeOverride =>
  isOverride(value) ? value : {};

const isEvaluator = <T>(value: DynamicValue<T>): value is Evaluator<T> =>
  typeof value === 'function';

const evaluate = <T>(
  value: DynamicValue<T> | undefined,
  values: FieldValues
): T | undefined => {
  if (value === undefined) {
    return undefined;
  }

  return isEvaluator(value) ? value(values) : value;
};

const definedEntries = (override: RuntimeOverride): RuntimeOverride =>
  Object.fromEntries(
    Object.entries(override).filter(([, value]) => value !== undefined)
  );

function mergeProps(
  base: DynamicValue<FieldProps> | undefined,
  call: DynamicValue<FieldProps> | undefined
): DynamicValue<FieldProps> | undefined {
  if (base === undefined || call === undefined) {
    return base ?? call;
  }

  if (isEvaluator(base) || isEvaluator(call)) {
    return (values: FieldValues) => ({
      ...evaluate(base, values),
      ...evaluate(call, values),
    });
  }

  return { ...base, ...call };
}

export function mergeOverrides(
  fields: OverrideMap,
  name: string,
  call: RuntimeOverride = {}
): RuntimeOverride {
  const pattern = schemaPathOf(name);
  const fromPattern = pattern === name ? {} : toOverride(fields[pattern]);
  const fromPath = toOverride(fields[name]);
  const fromCall = definedEntries(call);
  const merged: RuntimeOverride = { ...fromPattern, ...fromPath, ...fromCall };
  const props = mergeProps(
    mergeProps(fromPattern.props, fromPath.props),
    fromCall.props
  );

  return props === undefined ? merged : { ...merged, props };
}

export const hasDynamic = (override: RuntimeOverride) =>
  DYNAMIC_KEYS.some(key => typeof override[key] === 'function');

export function evaluateOverride(
  override: RuntimeOverride,
  values: FieldValues
): ResolvedOverride {
  return {
    ...override,
    label: evaluate(override.label, values),
    description: evaluate(override.description, values),
    helperText: evaluate(override.helperText, values),
    placeholder: evaluate(override.placeholder, values),
    hidden: evaluate(override.hidden, values),
    disabled: evaluate(override.disabled, values),
    readOnly: evaluate(override.readOnly, values),
    required: evaluate(override.required, values),
    options: evaluate(override.options, values),
    props: evaluate(override.props, values),
  };
}
