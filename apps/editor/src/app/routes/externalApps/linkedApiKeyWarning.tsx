import type { ExternalAppApiTokenFragment } from '@wepublish/editor/api';
import { createContext, useContext } from 'react';
import { useWatch } from 'react-hook-form';

import { ApiKeyWarning } from './apiKeyWarning';

export type LinkedApiKey = ExternalAppApiTokenFragment | null;

export const LinkedApiKeyContext = createContext<LinkedApiKey>(null);

export function LinkedApiKeyWarning() {
  const linked = useContext(LinkedApiKeyContext);
  const apiTokenId = useWatch({ name: 'apiTokenId' });

  return linked !== null && apiTokenId === linked.id ?
      <ApiKeyWarning apiToken={linked} />
    : null;
}
