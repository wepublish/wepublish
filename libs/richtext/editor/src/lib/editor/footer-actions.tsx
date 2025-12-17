import { Editor } from '@tiptap/react';

import { TableActions } from './footer-actions/table-actions';

export function FooterActions({ editor }: { editor: Editor }) {
  return <TableActions editor={editor} />;
}
