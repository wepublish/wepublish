import {
  getChangedValues,
  type AnyFormSchema,
  type FieldsProp,
  type FormDefaultValues,
  type FormOutput,
  type FormValues,
  type SchemaForm,
  type TopLevelKey,
} from '@wepublish/form/core';
import { enqueueSnackbar, useHasPermission } from '@wepublish/ui/editor';
import { useState, type ComponentType, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import type { EditorComponents } from '../components';
import { editorForm, type SubmitContext } from '../editor-form';
import type { FormMode, FormPaths, FormView, ViewFields } from './form-view';
import {
  applyRule,
  hasFieldErrors,
  keysOf,
  loading,
  matchingRule,
  mergeFields,
} from './view-runtime';

export type SaveContext<S extends AnyFormSchema> = {
  readonly intent: SubmitContext['intent'];
  readonly mode: FormMode;
  readonly form: SchemaForm<S>['form'];
  readonly changed: Partial<FormValues<S>>;
  readonly changedKeys: readonly TopLevelKey<S>[];
};

export type FormChange = {
  readonly path: string;
  readonly label: string;
  readonly before: unknown;
  readonly after: unknown;
  readonly beforeText: string;
  readonly afterText: string;
};

export type SaveConfirmation<S extends AnyFormSchema> = {
  readonly title: string;
  readonly description?: string;
  readonly format?: {
    readonly [K in TopLevelKey<S>]?: (
      value: FormValues<S>[K] | undefined
    ) => string;
  };
  readonly body?: ComponentType<{ readonly changes: readonly FormChange[] }>;
};

export type ControllerOptions<S extends AnyFormSchema> = {
  readonly title: string;
  readonly titleParams?: (values: FormValues<S>) => Record<string, unknown>;
  readonly subtitle?: ReactNode;
  readonly readOnly?: boolean;
  readonly writePermissions?: string[];
  readonly successToast?: string | false;
  readonly confirm?: SaveConfirmation<S>;
  readonly headerActions?: ReactNode;
} & FieldsProp<S, EditorComponents>;

export type CreateFormOptions<S extends AnyFormSchema> =
  ControllerOptions<S> & {
    readonly paths?: FormPaths;
    readonly defaultValues?: FormDefaultValues<S>;
    readonly save: (
      values: FormOutput<S>,
      context: SaveContext<S>
    ) => Promise<string | null | undefined>;
  };

export type EditFormOptions<S extends AnyFormSchema> = ControllerOptions<S> & {
  readonly paths?: FormPaths;
  readonly load: () => Promise<FormDefaultValues<S>>;
  readonly save: (
    values: FormOutput<S>,
    context: SaveContext<S>
  ) => Promise<unknown>;
};

export type SingletonFormOptions<S extends AnyFormSchema> =
  ControllerOptions<S> & {
    readonly closePath?: string;
    readonly load: () => Promise<FormDefaultValues<S>>;
    readonly save: (
      values: FormOutput<S>,
      context: SaveContext<S>
    ) => Promise<unknown>;
  };

export type FormConfirmation<S extends AnyFormSchema> = SaveConfirmation<S> & {
  readonly changes: readonly FormChange[] | null;
  readonly intent: SubmitContext['intent'];
  readonly open: (
    changes: readonly FormChange[],
    intent?: SubmitContext['intent']
  ) => void;
  readonly close: () => void;
};

export type FormController<S extends AnyFormSchema> = {
  readonly view: FormView<S>;
  readonly mode: FormMode;
  readonly handle: SchemaForm<S>;
  readonly onSubmit: (
    values: FormOutput<S>,
    context: SubmitContext
  ) => Promise<void>;
  readonly onInvalid: () => void;
  readonly fields: ViewFields<S>;
  readonly title: string;
  readonly titleParams:
    ((values: FormValues<S>) => Record<string, unknown>) | undefined;
  readonly subtitle: ReactNode;
  readonly readOnly: boolean;
  readonly closePath: string | undefined;
  readonly confirmation: FormConfirmation<S> | undefined;
  readonly headerActions: ReactNode;
};

type SharedOptions<S extends AnyFormSchema> = ControllerOptions<S> & {
  readonly paths?: FormPaths;
  readonly closePath?: string;
  readonly save: (
    values: FormOutput<S>,
    context: SaveContext<S>
  ) => Promise<unknown>;
};

type PendingConfirmation = {
  readonly changes: readonly FormChange[];
  readonly intent: SubmitContext['intent'];
};

const NO_PERMISSIONS: string[] = [];

const SUCCESS = { variant: 'success', autoHideDuration: 3000 } as const;

export function useCreateForm<S extends AnyFormSchema>(
  view: FormView<S>,
  options: NoInfer<CreateFormOptions<S>>
): FormController<S> {
  const handle = editorForm.useSchemaForm(
    view.schema,
    options.defaultValues === undefined ?
      undefined
    : { defaultValues: options.defaultValues }
  );

  return useFormController(view, 'create', handle, options);
}

export function useEditForm<S extends AnyFormSchema>(
  view: FormView<S>,
  options: NoInfer<EditFormOptions<S>>
): FormController<S> {
  const handle = editorForm.useSchemaForm(view.schema, loading(options.load));

  return useFormController(view, 'edit', handle, options);
}

export function useSingletonForm<S extends AnyFormSchema>(
  view: FormView<S>,
  options: NoInfer<SingletonFormOptions<S>>
): FormController<S> {
  const handle = editorForm.useSchemaForm(view.schema, loading(options.load));

  return useFormController(view, 'singleton', handle, options);
}

function requirePaths(paths: FormPaths | undefined, mode: FormMode) {
  if (
    paths === undefined &&
    mode !== 'singleton' &&
    process.env.NODE_ENV !== 'production'
  ) {
    throw new Error(
      `A ${mode} form needs paths: pass them to formView() or to the hook.`
    );
  }
}

function useFormController<S extends AnyFormSchema>(
  view: FormView<S>,
  mode: FormMode,
  handle: SchemaForm<S>,
  options: SharedOptions<S>
): FormController<S> {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const permitted = useHasPermission(
    options.writePermissions ?? NO_PERMISSIONS
  );
  const [pending, setPending] = useState<PendingConfirmation | null>(null);
  const paths = options.paths ?? view.paths;

  requirePaths(paths, mode);

  const readOnly =
    options.readOnly === true ||
    (options.writePermissions !== undefined && !permitted);

  const onSubmit = async (values: FormOutput<S>, { intent }: SubmitContext) => {
    const changed = getChangedValues(handle.form);
    let saved: unknown;

    try {
      saved = await options.save(values, {
        intent,
        mode,
        form: handle.form,
        changed,
        changedKeys: keysOf<S>(changed),
      });
    } catch (error) {
      setPending(null);

      const rule = matchingRule(view.serverErrors, mode, error);

      if (rule === undefined) {
        throw error;
      }

      applyRule(handle.form, rule, values);

      return;
    }

    setPending(null);

    if (hasFieldErrors(handle.form)) {
      return;
    }

    if (options.successToast !== false) {
      enqueueSnackbar(
        options.successToast === undefined ?
          successText(t, mode)
        : t(options.successToast),
        SUCCESS
      );
    }

    const destination = destinationAfterSave(mode, intent, paths, saved);

    if (destination !== undefined) {
      navigate(destination);
    }
  };

  return {
    view,
    mode,
    handle,
    onSubmit,
    onInvalid: () => setPending(null),
    fields: mergeFields(view.fields, options.fields),
    title: options.title,
    titleParams: options.titleParams,
    subtitle: options.subtitle,
    readOnly,
    closePath:
      mode === 'singleton' ? options.closePath
      : paths === undefined ? undefined
      : paths.list,
    confirmation:
      options.confirm === undefined ?
        undefined
      : {
          ...options.confirm,
          changes: pending === null ? null : pending.changes,
          intent: pending === null ? undefined : pending.intent,
          open: (changes, intent = 'save') => setPending({ changes, intent }),
          close: () => setPending(null),
        },
    headerActions: options.headerActions,
  };
}

function successText(t: (key: string) => string, mode: FormMode) {
  return mode === 'create' ?
      t('toast.createdSuccess')
    : t('toast.updatedSuccess');
}

function destinationAfterSave(
  mode: FormMode,
  intent: SubmitContext['intent'],
  paths: FormPaths | undefined,
  saved: unknown
) {
  if (mode === 'singleton' || paths === undefined) {
    return undefined;
  }

  if (intent === 'close') {
    return paths.list;
  }

  if (mode === 'edit') {
    return undefined;
  }

  return typeof saved === 'string' && saved !== '' ?
      paths.edit(saved)
    : paths.list;
}
