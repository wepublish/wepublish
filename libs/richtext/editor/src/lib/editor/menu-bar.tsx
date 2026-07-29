import {
  Divider,
  FormControl,
  IconButton,
  MenuItem,
  Select,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import {
  EditorStateSnapshot,
  useCurrentEditor,
  useEditorState,
} from '@tiptap/react';
import {
  MdFormatAlignCenter,
  MdFormatAlignLeft,
  MdFormatAlignRight,
  MdFormatBold,
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
import { BsParagraph } from 'react-icons/bs';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDebounceCallback } from 'usehooks-ts';
import { ColorPickerButton } from './color-picker-button';
import { ColorFillSwatchIcon, ColorTextSwatchIcon } from './color-swatch-icons';
import { LinkPopoverButton } from './link-popover';
import { useWebsiteThemeColors } from './use-website-theme-colors';

const selectMenuBarState = ({ editor }: EditorStateSnapshot) => {
  if (!editor || editor.isDestroyed) {
    return null;
  }

  const headingMap = [
    editor.isActive('paragraph'),
    editor.isActive('heading', { level: 1 }),
    editor.isActive('heading', { level: 2 }),
    editor.isActive('heading', { level: 3 }),
    editor.isActive('heading', { level: 4 }),
    editor.isActive('heading', { level: 5 }),
    editor.isActive('heading', { level: 6 }),
  ];

  const alignmentMap = {
    left: editor.isActive({ textAlign: 'left' }),
    center: editor.isActive({ textAlign: 'center' }),
    right: editor.isActive({ textAlign: 'right' }),
  };

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

    alignment: Object.entries(alignmentMap).reduce(
      (curr, [key, value]) => (value ? [key] : curr),
      ['left']
    ),
    canAlign: editor.can().chain().setTextAlign('left').run() ?? false,

    headingLevel: headingMap.includes(true) ? headingMap.indexOf(true) : 0,

    color: editor.getAttributes('textStyle').color,
    background: editor.getAttributes('textStyle').backgroundColor,

    list: Object.entries({
      bullet: editor.isActive('bulletList'),
      ordered: editor.isActive('orderedList'),
      task: editor.isActive('taskList'),
    }).flatMap(([key, value]) => (value ? key : [])),

    canUndo: editor.can().chain().undo().run() ?? false,
    canRedo: editor.can().chain().redo().run() ?? false,

    isCodeBlock: editor.isActive('codeBlock') ?? false,
    isBlockquote: editor.isActive('blockquote') ?? false,
    isLink: editor.isActive('link') ?? false,

    invisibleCharactersVisible: editor.storage.invisibleCharacters.visibility(),
  };
};

export function MenuBar() {
  const { t } = useTranslation();
  const editor = useCurrentEditor().editor!;
  const editorState = useEditorState({
    editor,
    selector: selectMenuBarState,
    equalityFn: equals,
  });
  const themeColors = useWebsiteThemeColors();

  const updateColor = useDebounceCallback(
    useCallback(
      (color: string | null) => {
        const chain = editor.chain().focus();

        if (editor.state.selection.empty) {
          chain.extendMarkRange('textStyle');
        }

        // Scoped clear: unsetColor() strips textStyle across containers
        if (color) {
          chain.setColor(color).run();
        } else if (editor.getAttributes('textStyle').backgroundColor) {
          chain.setMark('textStyle', { color: null }).run();
        } else {
          chain.unsetMark('textStyle').run();
        }
      },
      [editor]
    ),
    1
  );

  const updateBackgroundColor = useDebounceCallback(
    useCallback(
      (color: string | null) => {
        const chain = editor.chain().focus();

        if (editor.state.selection.empty) {
          chain.extendMarkRange('textStyle');
        }

        // Scoped clear: unsetBackgroundColor() strips textStyle across containers
        if (color) {
          chain.setBackgroundColor(color).run();
        } else if (editor.getAttributes('textStyle').color) {
          chain.setMark('textStyle', { backgroundColor: null }).run();
        } else {
          chain.unsetMark('textStyle').run();
        }
      },
      [editor]
    ),
    1
  );

  if (!editorState) {
    return null;
  }

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
          <MenuItem value={0}>{t('richtext.menuBar.paragraph')}</MenuItem>

          <MenuItem value={1}>
            {t('richtext.menuBar.heading', { level: 1 })}
          </MenuItem>

          <MenuItem value={2}>
            {t('richtext.menuBar.heading', { level: 2 })}
          </MenuItem>

          <MenuItem value={3}>
            {t('richtext.menuBar.heading', { level: 3 })}
          </MenuItem>

          <MenuItem value={4}>
            {t('richtext.menuBar.heading', { level: 4 })}
          </MenuItem>

          <MenuItem value={5}>
            {t('richtext.menuBar.heading', { level: 5 })}
          </MenuItem>

          <MenuItem value={6}>
            {t('richtext.menuBar.heading', { level: 6 })}
          </MenuItem>
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

      <ColorPickerButton
        value={editorState.color}
        onChange={updateColor}
        presetColors={themeColors}
      >
        <ColorTextSwatchIcon
          size={18}
          swatchColor={editorState.color}
        />
      </ColorPickerButton>

      <ColorPickerButton
        value={editorState.background}
        onChange={updateBackgroundColor}
        presetColors={themeColors}
      >
        <ColorFillSwatchIcon
          size={18}
          swatchColor={editorState.background}
        />
      </ColorPickerButton>

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

        {/* @TODO: Not supported yet */}
        {/* <ToggleButton
          value="task"
          onClick={() => editor.chain().focus().toggleTaskList().run()}
        >
          <MdChecklist size={18} />
        </ToggleButton> */}
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

      <LinkPopoverButton isLink={editorState.isLink} />

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

      <Divider
        orientation="vertical"
        flexItem
        sx={{ mx: 0.5 }}
      />

      <IconButton
        size="small"
        color={editorState.invisibleCharactersVisible ? 'primary' : undefined}
        onClick={() => editor.commands.toggleInvisibleCharacters()}
      >
        <BsParagraph size={18} />
      </IconButton>
    </>
  );
}
