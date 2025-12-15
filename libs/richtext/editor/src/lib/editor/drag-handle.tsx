import TipTapDragHandle from '@tiptap/extension-drag-handle-react';
import { Editor } from '@tiptap/react';
import { MdDragIndicator } from 'react-icons/md';
import styled from '@emotion/styled';
import { useRef } from 'react';

const DragHandleIndicator = styled('button')`
  color: ${({ theme }) => theme.palette.text.disabled};
  background-color: transparent;
  border-radius: 0.75rem;
  padding: 0.5rem 4px;
  cursor: grab;
  border: 0;
  display: grid;
  align-items: center;
  margin-top: 4px;
  margin-right: 8px;

  &:hover {
    background-color: ${({ theme }) => theme.palette.divider};
  }
`;

const DragHandleAnim = styled(TipTapDragHandle)`
  will-change: top;
  transition: top 200ms ease-out;
`;

export function DragHandle({ editor }: { editor: Editor }) {
  const pos = useRef<number | null>(null);

  return (
    <DragHandleAnim
      editor={editor}
      computePositionConfig={{ placement: 'left-start', strategy: 'absolute' }}
      onNodeChange={e => (pos.current = e.pos)}
    >
      <DragHandleIndicator
        onMouseDown={() => {
          if (pos.current != null) {
            editor.commands.setNodeSelection(pos.current);
          }
        }}
      >
        <MdDragIndicator size={16} />
      </DragHandleIndicator>
    </DragHandleAnim>
  );
}
