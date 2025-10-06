import { ComponentType } from 'react';
import {
  ControllerFieldState,
  ControllerRenderProps as FormControllerRenderProps,
} from 'react-hook-form';
import * as v from 'valibot';

type ControllerRenderProps<T> = Omit<FormControllerRenderProps, 'value'> & {
  value: T;
};

export type InputComponentProps<
  T extends v.BaseSchema<unknown, unknown, v.BaseIssue<unknown>> = v.BaseSchema<
    unknown,
    unknown,
    v.BaseIssue<unknown>
  >,
  Value = v.InferOutput<T>,
> = {
  fieldState: ControllerFieldState;
  field: ControllerRenderProps<Value>;
  schema: T;
  name: string;
  title: string | null | undefined;
  description: string | null | undefined;
  enums: Record<string, string> | null | undefined;
};

export type InputSchemaMapping = readonly [
  v.BaseSchema<unknown, unknown, v.BaseIssue<unknown>>,
  ComponentType<InputComponentProps<any>>,
];

export type FormSchemaMapping = ReadonlyArray<InputSchemaMapping>;
