import type { CustomKindOf, Depth, Unwrap } from './kind-types';

export type ObjectSchema = {
  _zod: { def: { type: 'object'; shape: unknown } };
};
export type ArraySchema = {
  _zod: { def: { type: 'array'; element: unknown } };
};
export type UnionSchema = {
  _zod: {
    def: { type: 'union'; discriminator: string; options: readonly unknown[] };
  };
};

export type ShapeOf<U> =
  U extends { _zod: { def: { shape: infer Sh } } } ? Sh : never;
export type ElementOf<U> =
  U extends { _zod: { def: { element: infer E } } } ? E : never;
export type BranchesOf<U> =
  U extends { _zod: { def: { options: infer O extends readonly unknown[] } } } ?
    O[number]
  : never;

export type ContainerPaths<U, D extends number> =
  U extends ObjectSchema ? ObjectPaths<ShapeOf<U>, D>
  : U extends UnionSchema ?
    BranchesOf<U> extends infer B ?
      B extends ObjectSchema ?
        ObjectPaths<ShapeOf<B>, D>
      : never
    : never
  : never;

export type ChildPaths<S, D extends number> =
  [D] extends [never] ? never
  : [CustomKindOf<S>] extends [never] ?
    Unwrap<S> extends infer U ?
      U extends ArraySchema ?
        [CustomKindOf<ElementOf<U>>] extends [never] ?
          Unwrap<ElementOf<U>> extends ObjectSchema | UnionSchema ?
            '*' | `*.${ContainerPaths<Unwrap<ElementOf<U>>, D>}`
          : never
        : '*'
      : ContainerPaths<U, D>
    : never
  : never;

export type ObjectPaths<Sh, D extends number> = {
  [K in keyof Sh & string]: K | `${K}.${ChildPaths<Sh[K], Depth[D]>}`;
}[keyof Sh & string];

export type SchemaPath<S, Levels extends number = 5> =
  [CustomKindOf<S>] extends [never] ? ContainerPaths<Unwrap<S>, Depth[Levels]>
  : never;

export type Step<S, K extends string> =
  Unwrap<S> extends infer U ?
    U extends ArraySchema ?
      K extends '*' ?
        ElementOf<U>
      : never
    : U extends ObjectSchema ?
      K extends keyof ShapeOf<U> ?
        ShapeOf<U>[K]
      : never
    : U extends UnionSchema ?
      BranchesOf<U> extends infer B ?
        B extends ObjectSchema ?
          K extends keyof ShapeOf<B> ?
            ShapeOf<B>[K]
          : never
        : never
      : never
    : never
  : never;

export type SchemaAt<S, P extends string> =
  P extends `${infer Head}.${infer Rest}` ? SchemaAt<Step<S, Head>, Rest>
  : Step<S, P>;

export type Join<Scope extends string, P extends string> =
  Scope extends '' ? P : `${Scope}.${P}`;

export type ScopedPath<S, Scope extends string = ''> =
  Scope extends '' ? SchemaPath<S> : SchemaPath<SchemaAt<S, Scope>>;

export type RenderablePath<S, Scope extends string = ''> = Exclude<
  ScopedPath<S, Scope>,
  `${string}*${string}`
>;

export type ItemPath<S> = Extract<SchemaPath<S>, `${string}*`>;

export type ScopePath<S> =
  ItemPath<S> extends infer P ?
    P extends string ?
      [CustomKindOf<SchemaAt<S, P>>] extends [never] ?
        P
      : never
    : never
  : never;

export type TopLevelKey<S, Scope extends string = ''> = Exclude<
  ScopedPath<S, Scope>,
  `${string}.${string}`
>;
