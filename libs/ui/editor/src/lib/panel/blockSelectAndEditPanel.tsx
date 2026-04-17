import { EditorBlockType } from '@wepublish/editor/api';

import { BlockSelectPanel } from './blockSelectPanel';

export interface BlockSelectAndEditPanelProps {
  onClose: () => void;
  onSelect: (block: any) => void;
}
export type AllowedBlockTypes = {
  [K in EditorBlockType]?: boolean;
};

export const allowedBlockTypes: AllowedBlockTypes = {
  [EditorBlockType.TeaserSlots]: true,
  [EditorBlockType.Image]: true,
  [EditorBlockType.Embed]: true,
  [EditorBlockType.RichText]: true,
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
