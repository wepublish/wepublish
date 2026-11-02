import { ComponentData } from '@puckeditor/core';
import { PropsWithChildren, useState } from 'react';

import { SaveBlockTemplateDialog } from './save-block-template.component';
import { SavedBlocksContext } from './saved-blocks.context';
import { useSavedBlocksValue } from './saved-blocks.hooks';

export function SavedBlocksProvider({ children }: PropsWithChildren) {
  const [block, setBlock] = useState<ComponentData | null>(null);
  const value = useSavedBlocksValue(setBlock);

  return (
    <SavedBlocksContext.Provider value={value}>
      {children}

      {block && (
        <SaveBlockTemplateDialog
          block={block}
          open
          onClose={() => setBlock(null)}
        />
      )}
    </SavedBlocksContext.Provider>
  );
}
