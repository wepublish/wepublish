import { InMemoryCacheConfig } from '@apollo/client';
import { KeyEnabled } from './graphql';

export const omitSensitiveData: Exclude<
  InMemoryCacheConfig['typePolicies'],
  undefined
> = {
  WebsiteMail: {
    keyFields: false,
    fields: {
      mailchimp: {
        merge: (_, key: KeyEnabled) => {
          return {
            ...key,
            key: undefined,
          };
        },
        read: (key: KeyEnabled) => {
          return {
            ...key,
            key: undefined,
          };
        },
      },
    },
  },
};
