import { Editor } from '@tiptap/react';

import { MarkBubbleMenu } from './bubble-menu/mark-bubble-menu';

export function BubbleMenu({ editor }: { editor: Editor }) {
  return <MarkBubbleMenu editor={editor} />;
}
