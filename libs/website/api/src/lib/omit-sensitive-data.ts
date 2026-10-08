import { InMemoryCacheConfig } from '@apollo/client';

/**
 * Cache merge payload, not an operation result — codegen only emits schema
 * types that operations actually select, so the shape is declared locally.
 */
type MergedKey = { key?: string | null; enabled?: boolean | null };

export const omitSensitiveData: Exclude<
  InMemoryCacheConfig['typePolicies'],
  undefined
> = {
  WebsiteMail: {
    keyFields: false,
    fields: {
      mailchimp: {
        merge: (_, key: MergedKey) => {
          return {
            ...key,
            key: undefined,
          };
        },
        read: (key: MergedKey) => {
          return {
            ...key,
            key: undefined,
          };
        },
      },
    },
  },
};
