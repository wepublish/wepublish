'use client'

import {type Value, TrailingBlockPlugin} from 'platejs'
import {type TPlateEditor, useEditorRef} from 'platejs/react'

import {AIKit} from '../editor/plugins/ai-kit'
import {AlignKit} from '../editor/plugins/align-kit'
import {AutoformatKit} from '../editor/plugins/autoformat-kit'
import {BasicBlocksKit} from '../editor/plugins/basic-blocks-kit'
import {BasicMarksKit} from '../editor/plugins/basic-marks-kit'
import {BlockMenuKit} from '../editor/plugins/block-menu-kit'
import {BlockPlaceholderKit} from '../editor/plugins/block-placeholder-kit'
import {CalloutKit} from '../editor/plugins/callout-kit'
import {CodeBlockKit} from '../editor/plugins/code-block-kit'
import {ColumnKit} from '../editor/plugins/column-kit'
import {CommentKit} from '../editor/plugins/comment-kit'
import {CopilotKit} from '../editor/plugins/copilot-kit'
import {CursorOverlayKit} from '../editor/plugins/cursor-overlay-kit'
import {DateKit} from '../editor/plugins/date-kit'
import {DiscussionKit} from '../editor/plugins/discussion-kit'
import {DndKit} from '../editor/plugins/dnd-kit'
import {DocxKit} from '../editor/plugins/docx-kit'
import {EmojiKit} from '../editor/plugins/emoji-kit'
import {ExitBreakKit} from '../editor/plugins/exit-break-kit'
import {FixedToolbarKit} from '../editor/plugins/fixed-toolbar-kit'
import {FloatingToolbarKit} from '../editor/plugins/floating-toolbar-kit'
import {FontKit} from '../editor/plugins/font-kit'
import {LineHeightKit} from '../editor/plugins/line-height-kit'
import {LinkKit} from '../editor/plugins/link-kit'
import {ListKit} from '../editor/plugins/list-kit'
import {MarkdownKit} from '../editor/plugins/markdown-kit'
import {MathKit} from '../editor/plugins/math-kit'
import {MediaKit} from '../editor/plugins/media-kit'
import {MentionKit} from '../editor/plugins/mention-kit'
import {SlashKit} from '../editor/plugins/slash-kit'
import {SuggestionKit} from '../editor/plugins/suggestion-kit'
import {TableKit} from '../editor/plugins/table-kit'
import {TocKit} from '../editor/plugins/toc-kit'
import {ToggleKit} from '../editor/plugins/toggle-kit'

export const EditorKit = [
  ...CopilotKit,
  ...AIKit,

  // Elements
  ...BasicBlocksKit,
  ...CodeBlockKit,
  ...TableKit,
  ...ToggleKit,
  ...TocKit,
  ...MediaKit,
  ...CalloutKit,
  ...ColumnKit,
  ...MathKit,
  ...DateKit,
  ...LinkKit,
  ...MentionKit,

  // Marks
  ...BasicMarksKit,
  ...FontKit,

  // Block Style
  ...ListKit,
  ...AlignKit,
  ...LineHeightKit,

  // Collaboration
  ...DiscussionKit,
  ...CommentKit,
  ...SuggestionKit,

  // Editing
  ...SlashKit,
  ...AutoformatKit,
  ...CursorOverlayKit,
  ...BlockMenuKit,
  ...DndKit,
  ...EmojiKit,
  ...ExitBreakKit,
  TrailingBlockPlugin,

  // Parsers
  ...DocxKit,
  ...MarkdownKit,

  // UI
  ...BlockPlaceholderKit,
  ...FixedToolbarKit,
  ...FloatingToolbarKit
]

export type MyEditor = TPlateEditor<Value, (typeof EditorKit)[number]>

export const useEditor = () => useEditorRef<MyEditor>()
