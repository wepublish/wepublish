import {
  PuckBlockDatasources,
  PuckBlockStyling,
  PuckBlockVisibility,
} from '@wepublish/website/api';

export type GraphQLShape<T> =
  T extends string ? `${T}`
  : T extends number | boolean ? T
  : T extends readonly (infer Item)[] ? readonly GraphQLShape<Item>[]
  : T extends object ?
    {
      [Key in Exclude<keyof T, '__typename'>]?: GraphQLShape<
        NonNullable<T[Key]>
      > | null;
    }
  : T;

export type PuckStyling = GraphQLShape<
  Omit<PuckBlockStyling, 'backgroundImageObject'>
>;

export type BlockVisibility = GraphQLShape<PuckBlockVisibility>;

export type PuckDatasources = GraphQLShape<PuckBlockDatasources>;
