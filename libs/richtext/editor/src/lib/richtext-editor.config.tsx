import { TextStyleKit } from '@tiptap/extension-text-style';
import { UseEditorOptions } from '@tiptap/react';
import { ListKit } from '@tiptap/extension-list';

import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
import Superscript from '@tiptap/extension-superscript';
import Subscript from '@tiptap/extension-subscript';
import Link from '@tiptap/extension-link';
import { Placeholder } from '@tiptap/extensions';

import TextAlign from '@tiptap/extension-text-align';
import { SmilieReplacer } from './editor/extensions/emoji';
import Typography from '@tiptap/extension-typography';
import { TableKit } from '@tiptap/extension-table';
import { WePTableCell } from './editor/extensions/table-cell';
import { Commands } from './editor/extensions/commands';
import { suggestions } from './editor/extensions/suggestions';

const extensions = [
  TextStyleKit,
  StarterKit.configure({
    trailingNode: {
      node: 'paragraph',
    },
  }),
  ListKit,
  Highlight.configure({
    multicolor: true,
  }),
  Superscript,
  Subscript,
  TextAlign.configure({
    types: ['heading', 'paragraph'],
  }),
  Typography,
  TableKit.configure({
    table: { resizable: true },
  }),
  Link.configure({
    openOnClick: false,
    autolink: true,
    defaultProtocol: 'https',
    protocols: ['http', 'https', 'mailto'],
  }),
  Placeholder.configure({
    placeholder: ({ node }) => {
      console.log(node);

      if (node.type.name === 'heading') {
        return 'Untitled';
      }

      if (node.type.name === 'paragraph') {
        return 'The start of your paragraph';
      }

      return '';
    },
  }),
  // We.Publish Extensions
  SmilieReplacer,
  WePTableCell,
  Commands.configure({
    suggestions,
  }),
];

export const editorConfig: UseEditorOptions = {
  extensions,
  content: `
<h2>
  Hi there,
</h2>
<p>
  this is a <em>basic</em> example of <strong>Tiptap</strong>. Sure, there are all kind of basic text styles you’d probably expect from a text editor. But wait until you see the lists:
</p>
<ul>
  <li>
    That’s a bullet list with one …
  </li>
  <li>
    … or two list items.
  </li>
</ul>
<p>
  Isn’t that great? And all of that is editable. But wait, there’s more. Let’s try a code block:
</p>
<pre><code class="language-css">body {
  display: none;
}</code></pre>
<p>
  I know, I know, this is impressive. It’s only the tip of the iceberg though. Give it a try and click a little bit around. Don’t forget to check the other examples too.
</p>
<blockquote>
  Wow, that’s amazing. Good work, boy! 👏
  <br />
  — Mom
</blockquote>
<a href="https://google.com" id="abc">Google.com</a>
`,
  // Performance
  immediatelyRender: true,
  shouldRerenderOnTransaction: false,
};
