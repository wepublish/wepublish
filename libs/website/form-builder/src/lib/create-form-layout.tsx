import * as v from 'valibot';
import { getComponentBySchema } from './get-component-by-schema';
import {
  ComponentType,
  createContext,
  Fragment,
  PropsWithChildren,
} from 'react';
import {
  Controller,
  FormProvider,
  Path,
  useForm,
  UseFormProps,
  UseFormReturn,
} from 'react-hook-form';
import { valibotResolver } from '@hookform/resolvers/valibot';
import {
  FormSchemaMapping,
  InputComponentProps,
} from './utility/input-schema-mapping';
import { getDescription, getTitle } from './utility/get-description';
import { getEnums } from './utility/get-enum';
import { getDefaultBySchema } from './get-default-by-schema';

export const InputComponentContext = createContext<InputComponentProps | null>(
  null
);

export const createFormLayout = <
  Mapping extends FormSchemaMapping,
  FormProps extends object,
>(
  mapping: Mapping,
  {
    FormComponent,
    useFormProps = {
      mode: 'onTouched',
      reValidateMode: 'onChange',
    },
  }: {
    FormComponent: ComponentType<
      PropsWithChildren<FormProps> & { onSubmit: () => Promise<void> }
    >;
    useFormProps?: Omit<
      UseFormProps,
      'defaultValues' | 'values' | 'resolver' | 'progressive'
    >;
  }
) => {
  return <
    Schema extends v.ObjectSchema<
      Record<string, v.BaseSchema<unknown, unknown, v.BaseIssue<unknown>>>,
      any
    >,
    Keys extends keyof Schema['entries'],
  >({
    name,
    schema,
    formProps,
    inputProps,
    defaultValues,
    form,
    onSubmit,
    renderAfter: RenderAfter,
    renderBefore: RenderBefore,
  }: {
    name?: string;
    schema: Schema;
    formProps?: FormProps;
    inputProps?: Record<Keys, unknown>;
    defaultValues?: Partial<v.InferInput<Schema>>;
    form?: UseFormReturn<v.InferOutput<Schema>>;
    onSubmit: (data: v.InferOutput<Schema>) => void | Promise<void>;
    renderAfter?: ComponentType;
    renderBefore?: ComponentType;
  }) => {
    const internalForm = useForm<v.InferOutput<Schema>>({
      resolver: valibotResolver(schema),
      progressive: true,
      ...useFormProps,
    });

    const actualForm = form || internalForm;
    const { handleSubmit, control } = actualForm;
    const submit = handleSubmit(async data => {
      await onSubmit(data);
    });

    return (
      // @ts-expect-error somehow it believes FormProps can be not an object
      <FormComponent
        {...(formProps ?? {})}
        onSubmit={submit}
      >
        {RenderBefore && <RenderBefore />}

        {Object.keys(schema.entries).map(key => {
          const schem = v.unwrap(schema.entries[key]) ?? schema.entries[key];
          const defaults = defaultValues?.[key] ?? getDefaultBySchema(schem);
          const Component = getComponentBySchema(mapping, schem) ?? Fragment;

          const actualName = (name ? `${name}.${key}` : key) as Path<
            v.InferOutput<Schema>
          >;

          return (
            <Controller
              key={key}
              name={actualName}
              control={control}
              defaultValue={defaults}
              render={({ field, fieldState }) => (
                <FormProvider {...actualForm}>
                  <InputComponentContext.Provider
                    value={{
                      name: key,
                      field,
                      fieldState,
                      schema: schem,
                      title: getTitle(schem),
                      description: getDescription(schem),
                      enums: getEnums(schem),
                    }}
                  >
                    <Component
                      {...(inputProps?.[key as keyof typeof inputProps] ?? {})}
                      key={key}
                      schema={schem}
                      field={field}
                      fieldState={fieldState}
                      name={key}
                      title={getTitle(schem)}
                      description={getDescription(schem)}
                      enums={getEnums(schem)}
                    />
                  </InputComponentContext.Provider>
                </FormProvider>
              )}
            />
          );
        })}

        {RenderAfter && <RenderAfter />}
      </FormComponent>
    );
  };
};
