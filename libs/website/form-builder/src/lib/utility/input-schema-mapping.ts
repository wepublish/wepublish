import {ComponentType} from 'react'
import {ControllerFieldState, ControllerRenderProps} from 'react-hook-form'
import * as v from 'valibot'

export type InputComponentProps = {
  fieldState: ControllerFieldState
  field: ControllerRenderProps
  schema: v.BaseSchema<any, any, any>
  name: string
  title: string | null
  description: string | null
}

export type InputSchemaMapping = readonly [
  v.BaseSchema<any, any, any>,
  ComponentType<InputComponentProps>
]

export type FormSchemaMapping = ReadonlyArray<InputSchemaMapping>
