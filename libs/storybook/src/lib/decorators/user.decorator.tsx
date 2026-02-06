import { SessionTokenContext } from '@wepublish/authentication/website';
import { SensitiveDataUser } from '@wepublish/website/api';
import { ComponentType } from 'react';

export const WithUserDecorator =
  (user: SensitiveDataUser | null) => (Story: ComponentType) => {
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
