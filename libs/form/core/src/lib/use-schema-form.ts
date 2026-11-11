import { useState } from 'react';
import { useForm, type DefaultValues } from 'react-hook-form';
import { rememberFormSchema } from './changed-values';
import type { ComponentMap } from './component-types';
import type {
  FormConfig,
  FormDefaultValues,
  FormDefaultsLoader,
  SchemaForm,
  SchemaFormOptions,
} from './form-types';
import { emptyValues, mergeValues } from './initial-values';
import { schemaResolver } from './schema-resolver';
import type { AnyFormSchema, FormOutput, FormValues } from './value-types';

type Loaded<S extends AnyFormSchema> = FormDefaultValues<S> | undefined;

const loadedValues = <S extends AnyFormSchema>(schema: S, loaded: Loaded<S>) =>
  mergeValues(schema, emptyValues(schema), loaded) as FormValues<S>;

const initialValues = <S extends AnyFormSchema>(schema: S, loaded: Loaded<S>) =>
  mergeValues(schema, emptyValues(schema), loaded) as DefaultValues<
    FormValues<S>
  >;

const asLoader = <S extends AnyFormSchema>(loader: FormDefaultsLoader<S>) =>
  loader as () => Promise<FormDefaultValues<S>>;

const loadFailure = (error: unknown) =>
  error === undefined || error === null ?
    new Error('The form loader rejected without a reason.')
  : error;

export function createUseSchemaForm<C extends ComponentMap>(
  config: FormConfig<C>
) {
  function useSchemaForm<S extends AnyFormSchema>(
    schema: S,
    options: SchemaFormOptions<S> = {}
  ): SchemaForm<S> {
    const { defaultValues, ...rest } = options;
    const [loadError, setLoadError] = useState<unknown>();
    const [reloading, setReloading] = useState(false);
    const loader =
      typeof defaultValues === 'function' ? asLoader(defaultValues) : undefined;
    const [staticValues] = useState(() =>
      typeof defaultValues === 'function' ? undefined : (
        initialValues(schema, defaultValues)
      )
    );

    const load = async (loadDefaults: () => Promise<FormDefaultValues<S>>) => {
      try {
        return loadedValues(schema, await loadDefaults());
      } catch (error) {
        const failure = loadFailure(error);

        setLoadError(failure);
        config.onLoadError?.(failure);

        return loadedValues(schema, undefined);
      }
    };

    const form = useForm<FormValues<S>, unknown, FormOutput<S>>({
      mode: config.mode ?? 'onTouched',
      reValidateMode: config.reValidateMode ?? 'onChange',
      ...rest,
      resolver: schemaResolver(schema),
      defaultValues: loader ? () => load(loader) : staticValues,
    });

    rememberFormSchema(form.control, schema);

    const retry = async () => {
      if (!loader || reloading) {
        return;
      }

      setLoadError(undefined);
      setReloading(true);

      const values = await load(loader);

      form.reset(values);
      setReloading(false);
    };

    return {
      form,
      schema,
      loadError,
      reloading,
      retry: () => {
        void retry();
      },
    };
  }

  return useSchemaForm;
}
