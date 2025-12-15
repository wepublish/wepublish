import { Editor } from '@tiptap/react';

import { TableBubbleMenu } from './bubble-menu/table-bubble-menu';
import { MarkBubbleMenu } from './bubble-menu/mark-bubble-menu';

export function BubbleMenu({ editor }: { editor: Editor }) {
  return (
    <>
      <MarkBubbleMenu editor={editor} />
      <TableBubbleMenu editor={editor} />
    </>
  );
}
