import { SessionTokenContext } from '@wepublish/authentication/website';
import { FullSensitiveDataUserFragment } from '@wepublish/website/api';
import { ComponentType } from 'react';

export const WithUserDecorator =
  (user: FullSensitiveDataUserFragment | null) => (Story: ComponentType) => {
    return (
      <SessionTokenContext.Provider
        value={[
          user,
          true,
          async () => {
            /* do nothing */
          },
        ]}
      >
        <Story />
      </SessionTokenContext.Provider>
    );
  };
