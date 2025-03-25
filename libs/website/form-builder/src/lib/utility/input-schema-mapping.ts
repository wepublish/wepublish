import {ComponentType} from 'react'
import {
  ControllerFieldState,
  ControllerRenderProps as FormControllerRenderProps
} from 'react-hook-form'
import * as v from 'valibot'

type ControllerRenderProps<T> = Omit<FormControllerRenderProps, 'value'> & {
  value: T
}

export type InputComponentProps<
  T extends v.BaseSchema<any, any, any> = v.BaseSchema<any, any, any>,
  Value = v.InferOutput<T>
> = {
  fieldState: ControllerFieldState
  field: ControllerRenderProps<Value>
  schema: T
  name: string
  title: string | null
  description: string | null
}

export type InputSchemaMapping = readonly [
  v.BaseSchema<any, any, any>,
  ComponentType<InputComponentProps<any>>
]

export type FormSchemaMapping = ReadonlyArray<InputSchemaMapping>
