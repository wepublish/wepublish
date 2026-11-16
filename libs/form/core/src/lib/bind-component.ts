import type { ComponentType } from 'react';
import type {
  AnyComponent,
  DistributiveOmit,
  HasRequiredProps,
} from './component-types';

const boundComponentTag: unique symbol = Symbol('boundComponent');

export type FieldValueMark<V> = { readonly '~fieldValue'?: V };

export type BoundComponent<V = never> = {
  readonly [boundComponentTag]: true;
  readonly component: ComponentType<Record<string, unknown>>;
  readonly props: Readonly<Record<string, unknown>>;
  readonly '~fieldValue'?: (value: V) => void;
};

export type BindComponentProps<P> =
  [keyof P] extends [never] ? []
  : HasRequiredProps<P> extends true ? [props: P]
  : [props?: P];

export const fieldComponent =
  <V>() =>
  <C extends AnyComponent>(component: C): C & FieldValueMark<V> =>
    component;

export function bindComponent<P extends object, V = unknown>(
  component: ComponentType<P> & FieldValueMark<V>,
  ...props: BindComponentProps<DistributiveOmit<NoInfer<P>, 'ref' | 'key'>>
): BoundComponent<NoInfer<V>> {
  const [boundProps]: readonly (object | undefined)[] = props;

  return {
    [boundComponentTag]: true,
    component: component as ComponentType<Record<string, unknown>>,
    props: { ...boundProps },
  };
}

export const isBoundComponent = (value: unknown): value is BoundComponent =>
  typeof value === 'object' && value !== null && boundComponentTag in value;
