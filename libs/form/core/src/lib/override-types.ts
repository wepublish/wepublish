import type { ReactNode } from 'react';
import type { FieldValues, UseFormReturn } from 'react-hook-form';
import type { BoundComponent } from './bind-component';
import type {
  ComponentAt,
  ComponentMap,
  ExtraProps,
  HasRequiredProps,
} from './component-types';
import type { KindOf } from './kind-types';
import type { SchemaAt, SchemaPath } from './path-types';
import type { AnyFormSchema, FormValues, SchemaValue } from './value-types';

export type Dynamic<T, In> = T | ((values: In) => T);

export type FieldActions<In extends FieldValues> = Pick<
  UseFormReturn<In>,
  'getValues' | 'setValue' | 'trigger' | 'resetField'
>;

export type OptionValueOf<V> =
  NonNullable<V> extends readonly (infer E)[] ? NonNullable<E> : NonNullable<V>;

export type OptionInput<V> =
  OptionValueOf<V> | { value: OptionValueOf<V>; label: ReactNode };

export type BaseOverride<In extends FieldValues, V> = {
  label?: Dynamic<ReactNode, In>;
  description?: Dynamic<ReactNode, In>;
  helperText?: Dynamic<ReactNode, In>;
  placeholder?: Dynamic<string, In>;
  hidden?: Dynamic<boolean, In>;
  disabled?: Dynamic<boolean, In>;
  readOnly?: Dynamic<boolean, In>;
  required?: Dynamic<boolean, In>;
  hideLabel?: boolean;
  options?: Dynamic<ReadonlyArray<OptionInput<V>>, In>;
  optionLabel?: (value: OptionValueOf<V>) => ReactNode;
  normalize?: (next: V) => V;
  guard?: (next: V, actions: FieldActions<In>) => boolean;
  onValueChange?: (value: V, actions: FieldActions<In>) => void;
};

export type FieldValueAt<S, P extends string> = SchemaValue<SchemaAt<S, P>>;

export type PropsOverride<P, In> =
  [keyof P] extends [never] ? { props?: never }
  : HasRequiredProps<P> extends true ? { props: Dynamic<P, In> }
  : { props?: Dynamic<P, In> };

export type ComponentOverride<V = never> = {
  component: BoundComponent<Exclude<V, undefined>>;
  props?: never;
};

export type ChildOverride = {
  label?: ReactNode;
  description?: ReactNode;
  helperText?: ReactNode;
  placeholder?: string;
  hidden?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  hideLabel?: boolean;
  component?: BoundComponent;
  props?: Readonly<Record<string, unknown>>;
};

export type ItemLayoutProps = {
  index: number;
  count: number;
  remove: () => void;
  move: (to: number) => void;
};

export type ItemLayout = (item: ItemLayoutProps) => ReactNode;

export type IsItemPath<P extends string> =
  P extends `${string}*` ? true : false;

export type LayoutOverride<P extends string> =
  IsItemPath<P> extends true ? { layout?: ItemLayout } : { layout?: never };

export type UnmappedOverride<P extends string, V = never> =
  IsItemPath<P> extends true ?
    | ComponentOverride<V>
    | { component?: undefined; props?: never; layout: ItemLayout }
  : ComponentOverride<V>;

export type Override<
  In extends FieldValues,
  V,
  Comp,
  P extends string,
> = BaseOverride<In, V> &
  LayoutOverride<P> &
  ([Comp] extends [never] ? UnmappedOverride<P, V>
  : | ({ component?: undefined } & PropsOverride<ExtraProps<Comp>, In>)
    | ComponentOverride<V>);

export type HasUnmappedBranch<S, C extends ComponentMap, P extends string> =
  true extends (
    SchemaAt<S, P> extends infer B ?
      B extends unknown ?
        [KindOf<B>] extends [never] ? true
        : KindOf<B> extends keyof C ? false
        : true
      : never
    : never
  ) ?
    true
  : false;

export type MappedComponentAt<S, C extends ComponentMap, P extends string> =
  HasUnmappedBranch<S, C, P> extends true ? never : ComponentAt<C, S, P>;

export type PathOverride<
  S extends AnyFormSchema,
  C extends ComponentMap,
  P extends string,
> = Override<FormValues<S>, FieldValueAt<S, P>, MappedComponentAt<S, C, P>, P>;

export type IsRequiredPath<S, C extends ComponentMap, P extends string> =
  HasUnmappedBranch<S, C, P> extends true ? true
  : HasRequiredProps<ExtraProps<ComponentAt<C, S, P>>>;

export type RequiredPaths<S, C extends ComponentMap> = {
  [P in SchemaPath<S>]: IsRequiredPath<S, C, P> extends true ? P : never;
}[SchemaPath<S>];

export type FieldOverrides<S extends AnyFormSchema, C extends ComponentMap> = {
  [
    P in SchemaPath<S> as P extends RequiredPaths<S, C> ? P : never
  ]: PathOverride<S, C, P>;
} & {
  [
    P in SchemaPath<S> as P extends RequiredPaths<S, C> ? never : P
  ]?: PathOverride<S, C, P>;
};

export type FieldsProp<S extends AnyFormSchema, C extends ComponentMap> =
  [RequiredPaths<S, C>] extends [never] ? { fields?: FieldOverrides<S, C> }
  : { fields: FieldOverrides<S, C> };
