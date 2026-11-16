import {
  resolveKind,
  schemaAt,
  topLevelKeys,
  type AnyFormSchema,
  type Dynamic,
  type FieldOverrides,
  type FieldsFor,
  type FormOutput,
  type FormValues,
  type RenderablePath,
} from '@wepublish/form/core';
import type { ComponentType } from 'react';

import type { EditorComponents } from '../components';
import { editorForm } from '../editor-form';

export type FormMode = 'create' | 'edit' | 'singleton';

export type FieldRow<S extends AnyFormSchema> = readonly [
  RenderablePath<S>,
  RenderablePath<S>,
  ...RenderablePath<S>[],
];

export type FieldToggleGroup<S extends AnyFormSchema> = {
  readonly group: readonly RenderablePath<S>[];
  readonly title?: string;
};

export type SectionEntry<S extends AnyFormSchema> =
  RenderablePath<S> | FieldRow<S> | FieldToggleGroup<S>;

export type SectionComponentProps = {
  readonly mode: FormMode;
  readonly readOnly: boolean;
};

export type FormViewLayout = 'sections' | 'cards';

export type FormViewSection<S extends AnyFormSchema> = {
  readonly title?: string;
  readonly description?: string;
  readonly placement?: 'main' | 'aside';
  readonly span?: 'full';
  readonly modes?: readonly FormMode[];
  readonly hidden?: Dynamic<boolean, FormValues<S>>;
  readonly collapsible?: 'open' | 'closed';
  readonly fields?: readonly SectionEntry<S>[];
  readonly component?: ComponentType<SectionComponentProps>;
  readonly covers?: readonly RenderablePath<S>[];
};

export type ServerErrorRule<S extends AnyFormSchema> = {
  readonly match: (error: unknown) => boolean;
  readonly path: RenderablePath<S>;
  readonly error: string;
  readonly params?: (values: FormOutput<S>) => Record<string, unknown>;
  readonly modes?: readonly FormMode[];
};

export type FormPaths = {
  readonly list: string;
  readonly edit: (id: string) => string;
};

export type ViewFields<S extends AnyFormSchema> = Partial<
  FieldOverrides<S, EditorComponents>
>;

type LayoutSection<S extends AnyFormSchema, L extends FormViewLayout> =
  L extends 'cards' ? FormViewSection<S> & { readonly placement?: never }
  : FormViewSection<S> & { readonly span?: never };

export type FormViewConfig<
  S extends AnyFormSchema,
  L extends FormViewLayout = FormViewLayout,
> = {
  readonly layout?: L;
  readonly sections: readonly LayoutSection<S, L>[];
  readonly fields?: ViewFields<S>;
  readonly serverErrors?: readonly ServerErrorRule<S>[];
  readonly paths?: FormPaths;
};

export type FormView<S extends AnyFormSchema> = FormViewConfig<S> & {
  readonly schema: S;
  readonly Field: FieldsFor<S, EditorComponents, ''>['Field'];
};

type LooseSection = {
  readonly title?: string;
  readonly placement?: 'main' | 'aside';
  readonly span?: 'full';
  readonly collapsible?: 'open' | 'closed';
  readonly fields?: readonly unknown[];
  readonly covers?: readonly string[];
};

export const entryPaths = (entry: unknown): readonly string[] => {
  if (typeof entry === 'string') {
    return [entry];
  }

  if (Array.isArray(entry)) {
    return entry.filter(path => typeof path === 'string');
  }

  const group = (entry as { group?: unknown }).group;

  return Array.isArray(group) ?
      group.filter(path => typeof path === 'string')
    : [];
};

export const sectionPaths = (section: LooseSection): string[] => [
  ...(section.fields ?? []).flatMap(entryPaths),
  ...(section.covers ?? []),
];

const topLevelKeyOf = (path: string) => path.split('.')[0];

const quoted = (keys: readonly string[]) =>
  keys.map(key => `"${key}"`).join(', ');

function checkPlacement(
  keys: readonly string[],
  sections: readonly LooseSection[]
) {
  const paths = sections.flatMap(sectionPaths);
  const placed = new Set(paths.map(topLevelKeyOf));
  const twice = [...placed].filter(key => {
    const whole = paths.filter(path => path === key).length;
    const nested = paths.filter(path => topLevelKeyOf(path) === key);

    return (
      whole > 1 ||
      (whole === 1 && nested.length > 1) ||
      new Set(nested).size < nested.length
    );
  });

  if (twice.length > 0) {
    throw new Error(
      `formView: ${quoted(twice)} placed more than once. Place every top-level key in exactly one section.`
    );
  }

  const missing = keys.filter(key => !placed.has(key));

  if (missing.length > 0) {
    throw new Error(
      `formView: ${quoted(missing)} not placed in any section. Add it to a section's fields or covers.`
    );
  }
}

const richTextPaths = (schema: AnyFormSchema, section: LooseSection) =>
  sectionPaths(section).filter(path => {
    const at = schemaAt(schema, path);

    return at !== undefined && resolveKind(at)?.kind === 'richText';
  });

function checkSections(
  schema: AnyFormSchema,
  layout: FormViewLayout,
  sections: readonly LooseSection[]
) {
  for (const section of sections) {
    if (section.collapsible !== undefined && section.title === undefined) {
      throw new Error('formView: a collapsible section needs a title.');
    }

    if (layout === 'cards' && section.placement === 'aside') {
      throw new Error(
        'formView: the cards layout has no aside. Place the section in the grid; span: "full" gives it the whole row.'
      );
    }

    if (layout !== 'cards' && section.span !== undefined) {
      throw new Error(
        'formView: span: "full" works only in the cards layout; add layout: "cards" or remove the span.'
      );
    }

    if (layout !== 'cards' && section.placement !== 'aside') {
      continue;
    }

    const richText = richTextPaths(schema, section);

    if (richText.length > 0) {
      throw new Error(
        layout === 'cards' ?
          `formView: rich text ${quoted(richText)} cannot sit in the cards layout; a card is a bordered box.`
        : `formView: rich text ${quoted(richText)} cannot sit in an aside section; the aside is a bordered panel.`
      );
    }
  }
}

export function formView<
  S extends AnyFormSchema,
  L extends FormViewLayout = 'sections',
>(
  schema: S,
  config: { readonly layout?: L } & NoInfer<FormViewConfig<S, L>>
): FormView<S> {
  if (process.env.NODE_ENV !== 'production') {
    const sections: readonly LooseSection[] = config.sections;

    checkSections(schema, config.layout ?? 'sections', sections);
    checkPlacement(topLevelKeys(schema), sections);
  }

  return {
    ...config,
    schema,
    Field: editorForm.fieldsFor(schema).Field,
  };
}
