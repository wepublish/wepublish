import { createUsePuck } from '@puckeditor/core';
import { PropsWithChildren, useMemo } from 'react';

import { toPreviewVariables } from './preview-input';
import { PuckBlockDataContext } from './puck-block-data.context';
import { usePuckBlockDataPreview } from './use-puck-block-data-preview';

const usePuck = createUsePuck();

export function PuckBlockDataProvider({ children }: PropsWithChildren) {
  const data = usePuck(puck => puck.appState.data);
  const config = usePuck(puck => puck.config);
  const variables = useMemo(
    () => toPreviewVariables(data, config),
    [data, config]
  );
  const blockData = usePuckBlockDataPreview(variables);

  return (
    <PuckBlockDataContext.Provider value={blockData}>
      {children}
    </PuckBlockDataContext.Provider>
  );
}
