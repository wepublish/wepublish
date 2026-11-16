import type { DeepPartial, FieldValues } from 'react-hook-form';
import type { z } from 'zod/v4';
import type {
  CustomKindOf,
  DefOf,
  Depth,
  SingleRealOption,
  Unwrap,
} from './kind-types';
import type {
  ArraySchema,
  BranchesOf,
  ElementOf,
  ObjectSchema,
  ShapeOf,
  UnionSchema,
} from './path-types';
import type { WrapperType } from './zod-def';

export type ObjectValue = FieldValues & { readonly [Symbol.iterator]?: never };

export type FormRootDef =
  | { type: 'object' }
  | { type: 'union'; discriminator: string }
  | { type: WrapperType | 'pipe' | 'lazy' };

export type AnyFormSchema = z.ZodType & {
  _zod: { input: ObjectValue; output: FieldValues; def: FormRootDef };
};

export type FormInput<S extends AnyFormSchema> = S['_zod']['input'];

export type FormOutput<S extends AnyFormSchema> = S['_zod']['output'];

export type FormValue<V> =
  V extends Date ? V | null
  : V extends Blob | FileList ? V
  : V extends number ? V | null
  : V extends boolean ? V
  : V extends string ?
    string extends V ?
      V
    : V | null
  : V extends readonly (infer E)[] ? FormValue<E>[]
  : V extends object ? { [K in keyof V]: FormValue<V[K]> }
  : V;

export type InputOf<S> = S extends { _zod: { input: infer I } } ? I : unknown;

export type DefaultLayer = { _zod: { def: { type: 'default' | 'prefault' } } };

type Nullish<S> = Extract<InputOf<S>, null | undefined>;

type WithoutEmptyString<U> =
  U extends (
    {
      _zod: {
        def: { type: 'union'; options: infer O extends readonly unknown[] };
      };
    }
  ) ?
    U extends UnionSchema ? U
    : [SingleRealOption<O>] extends [never] ? U
    : Unwrap<SingleRealOption<O>>
  : U;

type ValueType<S> =
  DefOf<WithoutEmptyString<Unwrap<S>>> extends { type: infer T } ? T : never;

type NullUnlessNullish<S> = [Nullish<S>] extends [never] ? null : never;

export type ClearedNull<S> =
  [ValueType<S>] extends ['array' | 'boolean'] ? never
  : [ValueType<S>] extends ['string'] ?
    S extends DefaultLayer ?
      null
    : never
  : NullUnlessNullish<S>;

type ObjectFormValue<U, D extends number> =
  InputOf<U> extends infer I ?
    {
      [K in keyof I]: K extends keyof ShapeOf<U> ? SchemaValue<ShapeOf<U>[K], D>
      : I[K];
    }
  : never;

type BranchFormValue<U, D extends number> =
  BranchesOf<U> extends infer B ?
    B extends ObjectSchema ?
      ObjectFormValue<B, D>
    : never
  : never;

type StructuralValue<S, U, D extends number> =
  U extends ObjectSchema ? ObjectFormValue<U, Depth[D]> | Nullish<S>
  : U extends UnionSchema ? BranchFormValue<U, Depth[D]> | Nullish<S>
  : U extends ArraySchema ? SchemaValue<ElementOf<U>, Depth[D]>[] | Nullish<S>
  : FormValue<InputOf<S>> | ClearedNull<S>;

export type SchemaValue<S, D extends number = 8> =
  S extends unknown ?
    [D] extends [never] ? FormValue<InputOf<S>>
    : [CustomKindOf<S>] extends [never] ? StructuralValue<S, Unwrap<S>, D>
    : InputOf<S> | ClearedNull<S>
  : never;

export type FormValues<S extends AnyFormSchema> = Extract<
  SchemaValue<S>,
  FieldValues
>;

type ObjectDefaultValue<U, D extends number> =
  InputOf<U> extends infer I ?
    {
      [K in keyof I]?: K extends keyof ShapeOf<U> ?
        SchemaDefaultValue<ShapeOf<U>[K], D>
      : I[K];
    }
  : never;

type BranchDefaultValue<U, D extends number> =
  BranchesOf<U> extends infer B ?
    B extends ObjectSchema ?
      ObjectDefaultValue<B, D>
    : never
  : never;

type StructuralDefaultValue<S, U, D extends number> =
  U extends ObjectSchema ? ObjectDefaultValue<U, Depth[D]> | Nullish<S>
  : U extends UnionSchema ? BranchDefaultValue<U, Depth[D]> | Nullish<S>
  : U extends ArraySchema ?
    SchemaDefaultValue<ElementOf<U>, Depth[D]>[] | Nullish<S>
  : FormValue<InputOf<S>> | ClearedNull<S>;

export type SchemaDefaultValue<S, D extends number = 8> =
  S extends unknown ?
    [D] extends [never] ? DeepPartial<FormValue<InputOf<S>>>
    : [CustomKindOf<S>] extends [never] ?
      StructuralDefaultValue<S, Unwrap<S>, D>
    : InputOf<S> | ClearedNull<S>
  : never;
