import { InMemoryCacheConfig } from '@apollo/client';

export const omitSensitiveData: Exclude<
  InMemoryCacheConfig['typePolicies'],
  undefined
> = {};
