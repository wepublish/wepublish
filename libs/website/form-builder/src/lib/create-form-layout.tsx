import * as v from 'valibot'
import {getComponentBySchema} from './get-component-by-schema'
import {ComponentType, createContext, Fragment, PropsWithChildren} from 'react'
import {Controller, Path, useForm, UseFormProps, UseFormReturn} from 'react-hook-form'
import {valibotResolver} from '@hookform/resolvers/valibot'
import {FormSchemaMapping, InputComponentProps} from './utility/input-schema-mapping'
import {getDescription, getTitle} from './utility/get-description'

export const InputComponentContext = createContext<InputComponentProps | null>(null)

export const createFormLayout = <Mapping extends FormSchemaMapping, FormProps extends object>(
  mapping: Mapping,
  {
    FormComponent,
    useFormProps = {
      mode: 'onTouched',
      reValidateMode: 'onChange'
    }
  }: {
    FormComponent: ComponentType<PropsWithChildren<FormProps>>
    useFormProps?: Omit<UseFormProps, 'defaultValues' | 'values' | 'resolver' | 'progressive'>
  }
) => {
  return <
    Schema extends v.ObjectSchema<Record<string, v.BaseSchema<any, any, any>>, any>,
    Keys extends keyof Schema['entries']
  >({
    schema,
    formProps,
    inputProps,
    defaultValues,
    form,
    onSubmit,
    renderAfter: RenderAfter,
    renderBefore: RenderBefore
  }: {
    schema: Schema
    formProps?: FormProps
    inputProps?: Record<Keys, unknown>
    defaultValues?: Partial<v.InferInput<Schema>>
    form?: UseFormReturn<v.InferOutput<Schema>>
    onSubmit: (data: v.InferOutput<Schema>) => void | Promise<void>
    renderAfter?: ComponentType
    renderBefore?: ComponentType
  }) => {
    const internalForm = useForm<v.InferOutput<Schema>>({
      resolver: valibotResolver(schema),
      progressive: true,
      ...useFormProps
    })

    const {handleSubmit, control} = form || internalForm
    const submit = handleSubmit(async data => {
      await onSubmit(data)
    })

    return (
      <FormComponent {...formProps} onSubmit={submit}>
        {RenderBefore && <RenderBefore />}

        {Object.keys(schema.entries).map(key => {
          const Component = getComponentBySchema(mapping, schema.entries[key])

          if (!Component) {
            return <Fragment key={key} />
          }

          return (
            <Controller
              key={key}
              name={key as Path<v.InferOutput<Schema>>}
              control={control}
              defaultValue={defaultValues?.[key]}
              render={({field, fieldState}) => (
                <InputComponentContext.Provider
                  value={{
                    name: key,
                    field,
                    fieldState,
                    schema: schema.entries[key],
                    title: getTitle(schema.entries[key]),
                    description: getDescription(schema.entries[key])
                  }}>
                  <Component
                    {...(inputProps?.[key as keyof typeof inputProps] ?? {})}
                    key={key}
                    schema={schema}
                    field={field}
                    fieldState={fieldState}
                    name={key}
                    title={getTitle(schema.entries[key])}
                    description={getDescription(schema.entries[key])}
                  />
                </InputComponentContext.Provider>
              )}
            />
          )
        })}

        {RenderAfter && <RenderAfter />}
      </FormComponent>
    )
  }
}
