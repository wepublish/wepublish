import { ToggleButtonGroup, ToggleButton } from '@mui/material';
import {
  isTextSelection,
  useCurrentEditor,
  useEditorState,
} from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import { equals } from 'ramda';
import {
  MdFormatBold,
  MdFormatItalic,
  MdFormatUnderlined,
  MdFormatStrikethrough,
  MdSubscript,
  MdSuperscript,
} from 'react-icons/md';

export function MarkBubbleMenu() {
  const editor = useCurrentEditor().editor!;

  const editorState = useEditorState({
    editor,
    selector: ({ editor }) => {
      return {
        isBold: editor.isActive('bold') ?? false,
        canBold: editor.can().chain().toggleBold().run() ?? false,
        isItalic: editor.isActive('italic') ?? false,
        canItalic: editor.can().chain().toggleItalic().run() ?? false,
        isStrike: editor.isActive('strike') ?? false,
        canStrike: editor.can().chain().toggleStrike().run() ?? false,
        isUnderline: editor.isActive('underline') ?? false,
        canUnderline: editor.can().chain().toggleUnderline().run() ?? false,
        isSub: editor.isActive('subscript') ?? false,
        canSub: editor.can().chain().toggleSubscript().run() ?? false,
        isSup: editor.isActive('superscript') ?? false,
        canSup: editor.can().chain().toggleSuperscript().run() ?? false,
      };
    },
    equalityFn: equals,
  });

  return (
    <BubbleMenu
      tabIndex={-1}
      editor={editor}
      options={{ placement: 'bottom', offset: 8, flip: true }}
      shouldShow={({ state, from, to, editor, element, view }) => {
        const { doc, selection } = state;
        const { empty } = selection;

        // Sometime check for `empty` is not enough.
        // Doubleclick an empty paragraph returns a node size of 2.
        // So we check also for an empty text size.
        const isEmptyTextBlock =
          !doc.textBetween(from, to).length && isTextSelection(state.selection);

        // When clicking on a element inside the bubble menu the editor "blur" event
        // is called and the bubble menu item is focussed. In this case we should
        // consider the menu as part of the editor and keep showing the menu
        const isChildOfMenu = element.contains(document.activeElement);

        const hasEditorFocus = view.hasFocus() || isChildOfMenu;

        if (
          !hasEditorFocus ||
          empty ||
          isEmptyTextBlock ||
          !editor.isEditable
        ) {
          return false;
        }

        return editor.can().chain().toggleBold().run();
      }}
    >
      <ToggleButtonGroup
        tabIndex={-1}
        size="small"
        sx={{ background: '#fff' }}
        value={Object.entries({
          bold: editorState.isBold,
          italic: editorState.isItalic,
          strike: editorState.isStrike,
          underline: editorState.isUnderline,
          sub: editorState.isSub,
          sup: editorState.isSup,
        }).flatMap(([key, value]) => (value ? key : []))}
      >
        <ToggleButton
          value="bold"
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={!editorState.canBold}
        >
          <MdFormatBold size={18} />
        </ToggleButton>

        <ToggleButton
          value="italic"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={!editorState.canItalic}
        >
          <MdFormatItalic size={18} />
        </ToggleButton>

        <ToggleButton
          value="underline"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          disabled={!editorState.canUnderline}
        >
          <MdFormatUnderlined size={18} />
        </ToggleButton>

        <ToggleButton
          value="strike"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          disabled={!editorState.canStrike}
        >
          <MdFormatStrikethrough size={18} />
        </ToggleButton>

        <ToggleButton
          value="sub"
          onClick={() => editor.chain().focus().toggleSubscript().run()}
          disabled={!editorState.canSub}
        >
          <MdSubscript size={18} />
        </ToggleButton>

        <ToggleButton
          value="sup"
          onClick={() => editor.chain().focus().toggleSuperscript().run()}
          disabled={!editorState.canSup}
        >
          <MdSuperscript size={18} />
        </ToggleButton>
      </ToggleButtonGroup>
    </BubbleMenu>
  );
}
