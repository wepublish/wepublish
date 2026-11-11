import { useId, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { FormProvider, useFormState, type FieldErrors } from 'react-hook-form';
import { SchemaAutoFields } from './auto-fields';
import type { ComponentMap } from './component-types';
import { createErrorSummaryStore } from './error-summary-store';
import { flattenErrors, type FlatFieldError } from './field-errors';
import { createFieldRegistry, reaches } from './field-registry';
import {
  FormRuntimeContext,
  type FormRuntime,
  type LoadStatus,
} from './form-runtime';
import type { FormConfig, FormProps } from './form-types';
import type { OverrideMap } from './overrides';
import { SERVER_ERROR_PATH, setFieldError } from './set-field-error';
import { snapshotValues } from './snapshot-values';
import type { AnyFormSchema, FormOutput, FormValues } from './value-types';

const useNoUnsavedChangesWarning = () => undefined;

const submitterValue = (
  event: FormEvent<HTMLFormElement>
): string | undefined => {
  const { nativeEvent, currentTarget } = event;
  const submitter = 'submitter' in nativeEvent ? nativeEvent.submitter : null;

  if (!(submitter instanceof Element) || submitter === currentTarget) {
    return undefined;
  }

  return submitter.getAttribute('value') ?? undefined;
};

function declaredIntent<I extends string>(
  intents: readonly I[] | undefined,
  value: string | undefined
): I | undefined {
  if (value === undefined || intents === undefined) {
    return value as I | undefined;
  }

  const intent = intents.find(candidate => candidate === value);

  if (intent === undefined && process.env.NODE_ENV !== 'production') {
    console.error(
      `Form submitted with intent "${value}", which is not one of the declared intents: ${intents.join(', ')}.`
    );
  }

  return intent;
}

const hasErrors = (errors: FieldErrors) => Object.keys(errors).length > 0;

const reportUnreachable = (errors: readonly FlatFieldError[]) => {
  if (process.env.NODE_ENV === 'production') {
    return;
  }

  console.error(
    `Form submit blocked by errors on fields that are not rendered: ${errors
      .map(({ path, error }) => `"${path}" (${error.message ?? ''})`)
      .join(
        ', '
      )}. Render these fields or mount useFormErrorSummary() in the layout.`
  );
};

export function createFormComponent<C extends ComponentMap, I extends string>(
  config: FormConfig<C, I>,
  components: FormRuntime['components']
) {
  const useUnsavedChanges =
    config.useUnsavedChanges ?? useNoUnsavedChangesWarning;

  function Form<S extends AnyFormSchema>(props: FormProps<S, C, I>): ReactNode {
    const { form, schema, loadError, reloading, retry } = props.form;
    const fields: OverrideMap = props.fields ?? {};
    const disabled = props.disabled === true;
    const t = config.useTranslate();
    const generatedId = useId();
    const [fieldRegistry] = useState(createFieldRegistry);
    const [errorSummary] = useState(createErrorSummaryStore);
    const submitting = useRef(false);
    const { isLoading, isDirty, isSubmitting } = useFormState({
      control: form.control,
    });
    const status: LoadStatus =
      isLoading || reloading ? 'loading'
      : loadError !== undefined ? 'error'
      : 'ready';

    useUnsavedChanges(
      isDirty && !isSubmitting && props.warnOnUnsavedChanges !== false
    );

    const onValid = async (
      values: FormOutput<S>,
      intent: I | undefined,
      submitted: FormValues<S>
    ) => {
      try {
        await props.onSubmit(values, { intent });
      } catch (error) {
        setFieldError(
          form,
          SERVER_ERROR_PATH,
          config.submitErrorKey?.(error) ?? 'form.errors.server'
        );
        config.onSubmitError?.(error);

        return;
      }

      if (!hasErrors(form.getErrors())) {
        form.resetDefaultValues(submitted);
      }
    };

    const onInvalid = async (errors: FieldErrors<FormValues<S>>) => {
      const registered = fieldRegistry.snapshot();
      const unreachable = flattenErrors(errors).filter(
        ({ path }) => !reaches(registered, path)
      );

      if (unreachable.length > 0 && !errorSummary.isMounted()) {
        reportUnreachable(unreachable);
      }

      await props.onInvalid?.(errors);
    };

    const onSubmit = (event: FormEvent<HTMLFormElement>) => {
      if (event.target !== event.currentTarget) {
        return;
      }

      event.stopPropagation();

      if (status !== 'ready' || disabled || submitting.current) {
        event.preventDefault();

        return;
      }

      const intent = declaredIntent(config.intents, submitterValue(event));
      const submitted = snapshotValues(form.getValues());

      submitting.current = true;

      return form
        .handleSubmit(
          values => onValid(values, intent, submitted),
          onInvalid
        )(event)
        .finally(() => {
          submitting.current = false;
        });
    };

    const runtime: FormRuntime = {
      config,
      components,
      t,
      schema,
      fields,
      disabled,
      status,
      loadError,
      retry,
      idPrefix: props.id ?? generatedId,
      fieldRegistry,
      errorSummary,
    };
    const As = props.as ?? config.as ?? 'form';

    return (
      <FormProvider {...form}>
        <FormRuntimeContext.Provider value={runtime}>
          <As
            id={props.id}
            noValidate
            onSubmit={onSubmit}
          >
            {'children' in props ? props.children : <SchemaAutoFields />}
          </As>
        </FormRuntimeContext.Provider>
      </FormProvider>
    );
  }

  return Form;
}
