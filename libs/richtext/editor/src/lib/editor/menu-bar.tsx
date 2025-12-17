import {
  Divider,
  FormControl,
  IconButton,
  MenuItem,
  Select,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import { Editor, useEditorState } from '@tiptap/react';
import {
  MdChecklist,
  MdFormatAlignCenter,
  MdFormatAlignLeft,
  MdFormatAlignRight,
  MdFormatBold,
  MdFormatColorFill,
  MdFormatColorText,
  MdFormatItalic,
  MdFormatListBulleted,
  MdFormatListNumbered,
  MdFormatStrikethrough,
  MdFormatUnderlined,
  MdRedo,
  MdSubscript,
  MdSuperscript,
  MdUndo,
} from 'react-icons/md';
import { Level } from '@tiptap/extension-heading';
import { equals } from 'ramda';
import { TbCodePlus, TbQuoteFilled, TbTablePlus } from 'react-icons/tb';

export function MenuBar({ editor }: { editor: Editor }) {
  const editorState = useEditorState({
    editor,
    selector: ctx => {
      const headingMap = [
        ctx.editor.isActive('paragraph'),
        ctx.editor.isActive('heading', { level: 1 }),
        ctx.editor.isActive('heading', { level: 2 }),
        ctx.editor.isActive('heading', { level: 3 }),
        ctx.editor.isActive('heading', { level: 4 }),
        ctx.editor.isActive('heading', { level: 5 }),
        ctx.editor.isActive('heading', { level: 6 }),
      ];

      const alignmentMap = {
        left: ctx.editor.isActive({ textAlign: 'left' }),
        center: ctx.editor.isActive({ textAlign: 'center' }),
        right: ctx.editor.isActive({ textAlign: 'right' }),
      };

      return {
        isBold: ctx.editor.isActive('bold') ?? false,
        canBold: ctx.editor.can().chain().toggleBold().run() ?? false,
        isItalic: ctx.editor.isActive('italic') ?? false,
        canItalic: ctx.editor.can().chain().toggleItalic().run() ?? false,
        isStrike: ctx.editor.isActive('strike') ?? false,
        canStrike: ctx.editor.can().chain().toggleStrike().run() ?? false,
        isUnderline: ctx.editor.isActive('underline') ?? false,
        canUnderline: ctx.editor.can().chain().toggleUnderline().run() ?? false,
        isSub: ctx.editor.isActive('subscript') ?? false,
        canSub: ctx.editor.can().chain().toggleSubscript().run() ?? false,
        isSup: ctx.editor.isActive('supscript') ?? false,
        canSup: ctx.editor.can().chain().toggleSuperscript().run() ?? false,

        alignment: Object.entries(alignmentMap).reduce(
          (curr, [key, value]) => (value ? [key] : curr),
          ['left']
        ),
        canAlign: ctx.editor.can().chain().setTextAlign('left').run() ?? false,

        headingLevel: headingMap.includes(true) ? headingMap.indexOf(true) : 0,

        color: ctx.editor.getAttributes('textStyle').color,
        background: ctx.editor.getAttributes('textStyle').backgroundColor,

        list: Object.entries({
          bullet: ctx.editor.isActive('bulletList'),
          ordered: ctx.editor.isActive('orderedList'),
          task: ctx.editor.isActive('taskList'),
        }).flatMap(([key, value]) => (value ? key : [])),

        canUndo: ctx.editor.can().chain().undo().run() ?? false,
        canRedo: ctx.editor.can().chain().redo().run() ?? false,

        isCodeBlock: ctx.editor.isActive('codeBlock') ?? false,
        isBlockquote: ctx.editor.isActive('blockquote') ?? false,
      };
    },
    equalityFn: equals,
  });

  return (
    <>
      <IconButton
        size="small"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editorState.canUndo}
      >
        <MdUndo size={18} />
      </IconButton>

      <IconButton
        size="small"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editorState.canRedo}
      >
        <MdRedo size={18} />
      </IconButton>

      <Divider
        orientation="vertical"
        flexItem
        sx={{ mx: 0.5 }}
      />

      <FormControl size="small">
        <Select
          value={editorState.headingLevel}
          displayEmpty
          sx={{ fontSize: '0.875rem', height: 32 }}
          onChange={event => {
            const level = +event.target.value as Level;

            if (level) {
              editor.chain().focus().toggleHeading({ level }).run();
            } else {
              editor.chain().focus().setParagraph().run();
            }
          }}
        >
          <MenuItem value={0}>Paragraph</MenuItem>
          <MenuItem value={1}>Heading 1</MenuItem>
          <MenuItem value={2}>Heading 2</MenuItem>
          <MenuItem value={3}>Heading 3</MenuItem>
          <MenuItem value={4}>Heading 4</MenuItem>
          <MenuItem value={5}>Heading 5</MenuItem>
          <MenuItem value={6}>Heading 6</MenuItem>
        </Select>
      </FormControl>

      <Divider
        orientation="vertical"
        flexItem
        sx={{ mx: 0.5 }}
      />

      <ToggleButtonGroup
        size="small"
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

      <Divider
        orientation="vertical"
        flexItem
        sx={{ mx: 0.5 }}
      />

      <IconButton
        size="small"
        onClick={() => editor.chain().focus().setColor('#faa').run()}
      >
        <MdFormatColorText
          size={18}
          style={{ color: editorState.color }}
        />
      </IconButton>

      <IconButton
        size="small"
        onClick={() => editor.chain().focus().setBackgroundColor('#faa').run()}
      >
        <MdFormatColorFill
          size={18}
          style={{ color: editorState.background }}
        />
      </IconButton>

      <Divider
        orientation="vertical"
        flexItem
        sx={{ mx: 0.5 }}
      />

      <ToggleButtonGroup
        size="small"
        value={editorState.list}
      >
        <ToggleButton
          value="bullet"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <MdFormatListBulleted size={18} />
        </ToggleButton>

        <ToggleButton
          value="ordered"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <MdFormatListNumbered size={18} />
        </ToggleButton>

        <ToggleButton
          value="task"
          onClick={() => editor.chain().focus().toggleTaskList().run()}
        >
          <MdChecklist size={18} />
        </ToggleButton>
      </ToggleButtonGroup>

      <Divider
        orientation="vertical"
        flexItem
        sx={{ mx: 0.5 }}
      />

      <ToggleButtonGroup
        size="small"
        value={editorState.alignment}
        disabled={!editorState.canAlign}
      >
        <ToggleButton
          value="left"
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
        >
          <MdFormatAlignLeft size={18} />
        </ToggleButton>

        <ToggleButton
          value="center"
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
        >
          <MdFormatAlignCenter size={18} />
        </ToggleButton>

        <ToggleButton
          value="right"
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
        >
          <MdFormatAlignRight size={18} />
        </ToggleButton>
      </ToggleButtonGroup>

      <Divider
        orientation="vertical"
        flexItem
        sx={{ mx: 0.5 }}
      />

      <IconButton
        size="small"
        onClick={() =>
          editor
            .chain()
            .focus()
            .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
            .run()
        }
      >
        <TbTablePlus size={18} />
      </IconButton>

      <IconButton
        size="small"
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
      >
        <TbCodePlus size={18} />
      </IconButton>

      <IconButton
        size="small"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        <TbQuoteFilled size={18} />
      </IconButton>
    </>
  );
}
