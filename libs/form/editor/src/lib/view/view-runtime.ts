import {
  resolveKind,
  schemaAt,
  setFieldError,
  type AnyFormSchema,
  type FieldErrorPath,
  type FormDefaultValues,
  type FormOutput,
  type FormValues,
  type SchemaForm,
  type SchemaFormOptions,
  type TopLevelKey,
} from '@wepublish/form/core';
import { get } from 'react-hook-form';

import {
  sectionPaths,
  type FormMode,
  type FormView,
  type FormViewSection,
  type ServerErrorRule,
  type ViewFields,
} from './form-view';

type Form<S extends AnyFormSchema> = SchemaForm<S>['form'];

type LooseOverride = Readonly<Record<string, unknown>>;

const GROUP_KINDS: ReadonlySet<string> = new Set([
  'array',
  'object',
  'discriminatedUnion',
]);

const isPlainObject = (value: unknown): value is LooseOverride =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const loading = <S extends AnyFormSchema>(
  load: () => Promise<FormDefaultValues<S>>
) => ({ defaultValues: load }) as SchemaFormOptions<S>;

export const keysOf = <S extends AnyFormSchema>(
  changed: Partial<FormValues<S>>
) => Object.keys(changed) as TopLevelKey<S>[];

export const hasFieldErrors = <S extends AnyFormSchema>(form: Form<S>) =>
  Object.keys(form.getErrors()).length > 0;

export const matchingRule = <S extends AnyFormSchema>(
  rules: readonly ServerErrorRule<S>[] | undefined,
  mode: FormMode,
  error: unknown
) =>
  (rules ?? []).find(
    rule =>
      (rule.modes === undefined || rule.modes.includes(mode)) &&
      rule.match(error)
  );

const lastSegment = (path: string) => path.split('.').at(-1) ?? path;

export function applyRule<S extends AnyFormSchema>(
  form: Form<S>,
  rule: ServerErrorRule<S>,
  values: FormOutput<S>
) {
  const path: string = rule.path;
  const params =
    rule.params === undefined ?
      { [lastSegment(path)]: get(values, path) }
    : rule.params(values);

  setFieldError(
    form,
    path as FieldErrorPath<FormValues<S>>,
    rule.error,
    params
  );
}

function mergeOverride(view: unknown, hook: unknown): unknown {
  if (!isPlainObject(view) || !isPlainObject(hook)) {
    return hook;
  }

  const merged = { ...view, ...hook };

  if (isPlainObject(view['props']) && isPlainObject(hook['props'])) {
    return { ...merged, props: { ...view['props'], ...hook['props'] } };
  }

  return merged;
}

export function mergeFields<S extends AnyFormSchema>(
  viewFields: ViewFields<S> | undefined,
  hookFields: object | undefined
): ViewFields<S> {
  if (hookFields === undefined) {
    return viewFields ?? {};
  }

  const merged: Record<string, unknown> = { ...viewFields };

  for (const [path, override] of Object.entries(hookFields)) {
    merged[path] = mergeOverride(merged[path], override);
  }

  return merged as ViewFields<S>;
}

export const isRow = (entry: unknown): entry is readonly string[] =>
  Array.isArray(entry);

export const pathsOf = <S extends AnyFormSchema>(
  section: FormViewSection<S>
): string[] => sectionPaths(section);

export function isLoneGroup<S extends AnyFormSchema>(
  view: FormView<S>,
  fields: ViewFields<S>,
  section: FormViewSection<S>
): boolean {
  const entries = section.fields ?? [];
  const [entry] = entries;

  if (
    section.title === undefined ||
    entries.length !== 1 ||
    typeof entry !== 'string'
  ) {
    return false;
  }

  const override: unknown = (fields as Record<string, unknown>)[entry];

  if (isPlainObject(override) && override['hideLabel'] === false) {
    return false;
  }

  const at = schemaAt(view.schema, entry);
  const kind = at === undefined ? undefined : resolveKind(at)?.kind;

  return kind !== undefined && GROUP_KINDS.has(kind);
}
