import { EditorBlockType } from '@wepublish/editor/api-v2';
import { useState } from 'react';

import { BlockSelectPanel } from './blockSelectPanel';

export interface BlockSelectAndEditPanelProps {
  onClose: () => void;
  onSelect: (test: any) => void;
}
/*
type ObjectFromList<T extends ReadonlyArray<EditorBlockType>, V = string> = {
  [K in (T extends ReadonlyArray<infer U> ? U : never)]: V
};

type Type = ObjectFromList<EditorBlockType, boolean>;
*/

/*
Partial<
  Record<keyof typeof EditorBlockType, boolean>
>
  */
export type AlllowedBlockTypes = {
  [K in EditorBlockType]?: boolean;
};

export const allowedBlockTypes: AlllowedBlockTypes = {
  [EditorBlockType.TeaserSlots]: true,
};

export function BlockSelectAndEditPanel({
  onClose,
  onSelect,
}: BlockSelectAndEditPanelProps) {
  const [block, setBlock] = useState<null>(null);

  return (
    <BlockSelectPanel
      onClose={onClose}
      onSelect={block => {
        onSelect(block);
      }}
      allowedBlockTypes={allowedBlockTypes}
    />
  );
}
