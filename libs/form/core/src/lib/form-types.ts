import type { ComponentType, ElementType, ReactNode } from 'react';
import type {
  FieldErrors,
  FieldValues,
  UseFormProps,
  UseFormReturn,
} from 'react-hook-form';
import type { ComponentAt, ComponentMap, ExtraProps } from './component-types';
import type {
  BaseOverride,
  ComponentOverride,
  Dynamic,
  FieldValueAt,
  FieldsProp,
} from './override-types';
import type {
  Join,
  RenderablePath,
  ScopePath,
  TopLevelKey,
} from './path-types';
import type {
  AnyFormSchema,
  FormOutput,
  FormValues,
  SchemaDefaultValue,
} from './value-types';

export type Translate = (
  key: string,
  params?: Record<string, unknown>
) => string;

export type FormConfig<C extends ComponentMap, I extends string = string> = {
  components: C;
  intents?: readonly I[];
  useTranslate: () => Translate;
  as?: ElementType;
  Loading?: ComponentType;
  LoadError?: ComponentType<{ error: unknown; retry: () => void }>;
  onLoadError?: (error: unknown) => void;
  onSubmitError?: (error: unknown) => void;
  submitErrorKey?: (error: unknown) => string | undefined;
  useUnsavedChanges?: (dirty: boolean) => void;
  mode?: UseFormProps['mode'];
  reValidateMode?: UseFormProps['reValidateMode'];
};

export type SchemaForm<S extends AnyFormSchema> = {
  form: UseFormReturn<FormValues<S>, unknown, FormOutput<S>>;
  schema: S;
  loadError: unknown;
  reloading: boolean;
  retry: () => void;
};

export type FormDefaultValues<S extends AnyFormSchema> = Extract<
  SchemaDefaultValue<S>,
  FieldValues
>;

export type FormDefaultsLoader<S extends AnyFormSchema> =
  S extends AnyFormSchema ? () => Promise<FormDefaultValues<S>> : never;

export type SchemaFormOptions<S extends AnyFormSchema> = Omit<
  UseFormProps<FormValues<S>, unknown, FormOutput<S>>,
  'resolver' | 'defaultValues' | 'values' | 'disabled' | 'shouldUnregister'
> & {
  defaultValues?: FormDefaultValues<S> | FormDefaultsLoader<S>;
};

export type SubmitContext<I extends string = string> = {
  intent?: I;
};

export type FormProps<
  S extends AnyFormSchema,
  C extends ComponentMap,
  I extends string = string,
> = {
  form: SchemaForm<S>;
  onSubmit: (values: FormOutput<S>, context: SubmitContext<I>) => unknown;
  onInvalid?: (errors: FieldErrors<FormValues<S>>) => void;
  disabled?: boolean;
  warnOnUnsavedChanges?: boolean;
  as?: ElementType;
  id?: string;
  children?: ReactNode;
} & FieldsProp<S, C>;

export type CallProps<P, In> =
  [keyof P] extends [never] ? { props?: never }
  : { props?: Dynamic<Partial<P>, In> };

export type CallOverride<
  S extends AnyFormSchema,
  C extends ComponentMap,
  Full extends string,
> = Partial<BaseOverride<FormValues<S>, FieldValueAt<S, Full>>> &
  (
    | ({ component?: undefined } & CallProps<
        ExtraProps<ComponentAt<C, S, Full>>,
        FormValues<S>
      >)
    | ComponentOverride<FieldValueAt<S, Full>>
  );

export type FieldComponent<
  S extends AnyFormSchema,
  C extends ComponentMap,
  Scope extends string,
> = <P extends RenderablePath<S, Scope>>(
  props: { name: P } & CallOverride<S, C, Join<Scope, P>>
) => ReactNode;

export type AutoFieldsProps<S extends AnyFormSchema, Scope extends string> = {
  omit?: ReadonlyArray<TopLevelKey<S, Scope>>;
};

export type FieldsFor<
  S extends AnyFormSchema,
  C extends ComponentMap,
  Scope extends string,
> = {
  Field: FieldComponent<S, C, Scope>;
  AutoFields: (props: AutoFieldsProps<S, Scope>) => ReactNode;
};

export type CreatedForm<C extends ComponentMap, I extends string = string> = {
  useSchemaForm: <S extends AnyFormSchema>(
    schema: S,
    options?: SchemaFormOptions<S>
  ) => SchemaForm<S>;
  Form: <S extends AnyFormSchema>(props: FormProps<S, C, I>) => ReactNode;
  fieldsFor: <
    S extends AnyFormSchema,
    const Scope extends ScopePath<S> | '' = '',
  >(
    schema: S,
    scope?: Scope
  ) => FieldsFor<S, C, Scope>;
};

export type CreateForm = <
  const C extends ComponentMap,
  const I extends string = string,
>(
  config: FormConfig<C, I>
) => CreatedForm<C, I>;
