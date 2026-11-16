import type { JSXElementConstructor } from 'react';
import type { KindOf } from './kind-types';
import type { SchemaAt } from './path-types';

export type AnyComponent = JSXElementConstructor<never>;

export type ComponentMap = Readonly<Record<string, AnyComponent>>;

export type DistributiveOmit<T, K extends PropertyKey> =
  T extends unknown ? Omit<T, K> : never;

export type ExtraProps<Comp> =
  [Comp] extends [never] ? never
  : Comp extends JSXElementConstructor<infer P> ?
    DistributiveOmit<P, 'ref' | 'key'>
  : never;

export type RequiredKeys<T> =
  T extends unknown ?
    { [K in keyof T]-?: {} extends Pick<T, K> ? never : K }[keyof T]
  : never;

export type HasRequiredProps<P> =
  [RequiredKeys<P>] extends [never] ? false : true;

export type ComponentAt<C extends ComponentMap, S, P extends string> =
  KindOf<SchemaAt<S, P>> extends infer K ?
    K extends keyof C ?
      C[K]
    : never
  : never;
