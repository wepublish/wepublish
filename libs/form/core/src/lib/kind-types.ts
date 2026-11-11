import type { WrapperType } from './zod-def';

export type Kinded<S, K extends string, P = undefined> = S & {
  readonly '~formKind': K;
  readonly '~formKindParams'?: P;
};

export type Depth = [never, 0, 1, 2, 3, 4, 5, 6, 7, 8];

export type Wrapping = {
  _zod: { def: { type: WrapperType | 'pipe' | 'lazy' } };
};

export type UnwrapOnce<S> =
  S extends (
    {
      _zod: { def: { type: WrapperType; innerType: infer I } };
    }
  ) ?
    I
  : S extends (
    {
      _zod: {
        def: {
          type: 'pipe';
          in: { _zod: { def: { type: 'transform' } } };
          out: infer O;
        };
      };
    }
  ) ?
    O
  : S extends { _zod: { def: { type: 'pipe'; in: infer I } } } ? I
  : S extends { _zod: { def: { type: 'lazy'; getter: () => infer I } } } ? I
  : S;

export type Unwrap<S, D extends number = 8> =
  [D] extends [never] ? S
  : S extends Wrapping ? Unwrap<UnwrapOnce<S>, Depth[D]>
  : S;

export type CustomKindOf<S, D extends number = 8> =
  [D] extends [never] ? never
  : S extends { readonly '~formKind': infer K extends string } ? K
  : S extends Wrapping ? CustomKindOf<UnwrapOnce<S>, Depth[D]>
  : S extends (
    {
      _zod: {
        def: { type: 'union'; options: infer O extends readonly unknown[] };
      };
    }
  ) ?
    CustomKindOf<SingleRealOption<O>, Depth[D]>
  : never;

export type KindParamsOf<S, D extends number = 8> =
  [D] extends [never] ? undefined
  : S extends (
    { readonly '~formKind': string; readonly '~formKindParams'?: infer P }
  ) ?
    P
  : S extends Wrapping ? KindParamsOf<UnwrapOnce<S>, Depth[D]>
  : S extends (
    {
      _zod: {
        def: { type: 'union'; options: infer O extends readonly unknown[] };
      };
    }
  ) ?
    KindParamsOf<SingleRealOption<O>, Depth[D]>
  : undefined;

export type EmptyStringLiteral = {
  _zod: { def: { type: 'literal'; values: ''[] } };
};

export type IsUnion<T, U = T> =
  T extends unknown ?
    [U] extends [T] ?
      false
    : true
  : never;

export type SingleRealOption<O extends readonly unknown[]> =
  Exclude<O[number], EmptyStringLiteral> extends infer R ?
    true extends IsUnion<R> ?
      never
    : R
  : never;

export type SingleKind<K> =
  [K] extends [never] ? never
  : true extends IsUnion<K> ? never
  : K;

export type DefOf<S> = S extends { _zod: { def: infer D } } ? D : never;

export type IsLiteralUnion<O extends readonly unknown[]> =
  O[number] extends (
    {
      _zod: { def: { type: 'literal' | 'enum' } };
    }
  ) ?
    true
  : false;

export type PrimitiveKind = 'string' | 'number' | 'boolean' | 'date';

export type StructuralKind<U> =
  DefOf<U> extends infer D ?
    D extends { type: 'string' } ? 'string'
    : D extends { type: 'number' } ? 'number'
    : D extends { type: 'boolean' } ? 'boolean'
    : D extends { type: 'date' } ? 'date'
    : D extends { type: 'enum' | 'literal' } ? 'enum'
    : D extends { type: 'object' } ? 'object'
    : D extends { type: 'union'; discriminator: string } ? 'discriminatedUnion'
    : D extends { type: 'union'; options: infer O extends readonly unknown[] } ?
      IsLiteralUnion<O> extends true ?
        'enum'
      : SingleKind<KindOf<Exclude<O[number], EmptyStringLiteral>>>
    : D extends { type: 'array'; element: infer E } ? ElementKind<E>
    : never
  : never;

export type ElementKind<E> =
  [CustomKindOf<E>] extends [never] ?
    StructuralKind<Unwrap<E>> extends infer K ?
      K extends 'object' | 'discriminatedUnion' ? 'array'
      : K extends 'enum' ? 'enumArray'
      : K extends 'string' ? 'primitiveArray'
      : never
    : never
  : 'array';

export type KindOf<S> =
  [CustomKindOf<S>] extends [never] ? StructuralKind<Unwrap<S>>
  : CustomKindOf<S>;
