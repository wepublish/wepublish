import { EditorBlockType } from '@wepublish/editor/api';

import { BlockSelectPanel } from './blockSelectPanel';

export interface BlockSelectAndEditPanelProps {
  onClose: () => void;
  onSelect: (block: any) => void;
}
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
