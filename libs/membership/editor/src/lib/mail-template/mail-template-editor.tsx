import { memo, useCallback } from 'react';
import {
  createEditor,
  Descendant,
  Editor,
  Element as SlateElement,
  Transforms,
} from 'slate';
import {
  Editable,
  ReactEditor,
  RenderElementProps,
  RenderLeafProps,
  Slate,
  useSlate,
  withReact,
} from 'slate-react';
import { withHistory } from 'slate-history';
import { BlockFormat, InlineFormat, TextFormat } from '@wepublish/richtext';
import { Box, Chip, Divider, ToggleButton, Tooltip } from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  MdFormatBold,
  MdFormatItalic,
  MdFormatListBulleted,
  MdFormatListNumbered,
  MdFormatUnderlined,
  MdLink,
  MdStrikethroughS,
} from 'react-icons/md';
import { useTranslation } from 'react-i18next';
import { createPlaceholderNode, PLACEHOLDER_TYPE } from './mail-html';

const LIST_TYPES: string[] = [
  BlockFormat.UnorderedList,
  BlockFormat.OrderedList,
];

const EditorSurface = styled(Editable)`
  min-height: 360px;
  padding: 16px;
  outline: none;
  font-family: Arial, Helvetica, sans-serif;
  line-height: 1.5;

  & h1,
  & h2,
  & h3 {
    margin: 0 0 12px 0;
  }

  & p {
    margin: 0 0 12px 0;
  }

  & ul,
  & ol {
    margin: 0 0 12px 0;
    padding-left: 24px;
  }
`;

const Toolbar = styled(Box)`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
  padding: 6px;
  border-bottom: 1px solid ${({ theme }) => theme.palette.divider};
`;

const EditorWrapper = styled(Box)`
  border: 1px solid ${({ theme }) => theme.palette.divider};
  border-radius: 6px;
  background-color: #fff;
`;

const PlaceholderChip = styled(Chip)`
  font-family: monospace;
  height: 22px;
`;

export const withMailPlaceholders = <T extends Editor>(editor: T): T => {
  const { isInline, isVoid } = editor;

  editor.isInline = element => {
    const type = (element as never as { type?: string }).type;
    return type === PLACEHOLDER_TYPE || type === InlineFormat.Link ?
        true
      : isInline(element);
  };

  editor.isVoid = element => {
    const type = (element as never as { type?: string }).type;
    return type === PLACEHOLDER_TYPE ? true : isVoid(element);
  };

  return editor;
};

export const createMailEditor = (): Editor =>
  withMailPlaceholders(withHistory(withReact(createEditor())));

export const insertPlaceholder = (editor: Editor, key: string): void => {
  ReactEditor.focus(editor);
  Transforms.insertNodes(
    editor,
    createPlaceholderNode(key) as never,
    editor.selection ? undefined : { at: Editor.end(editor, []) }
  );
  Transforms.move(editor);
};

const isMarkActive = (editor: Editor, format: TextFormat): boolean => {
  const marks = Editor.marks(editor) as Record<string, unknown> | null;
  return marks ? marks[format] === true : false;
};

const toggleMark = (editor: Editor, format: TextFormat): void => {
  if (isMarkActive(editor, format)) {
    Editor.removeMark(editor, format);
  } else {
    Editor.addMark(editor, format, true);
  }
};

const isBlockActive = (editor: Editor, format: string): boolean => {
  const { selection } = editor;
  if (!selection) {
    return false;
  }
  const [match] = Array.from(
    Editor.nodes(editor, {
      at: Editor.unhangRange(editor, selection),
      match: n =>
        !Editor.isEditor(n) &&
        SlateElement.isElement(n) &&
        (n as never as { type?: string }).type === format,
    })
  );
  return !!match;
};

const toggleBlock = (editor: Editor, format: string): void => {
  const isList = LIST_TYPES.includes(format);
  const isActive = isBlockActive(editor, format);

  Transforms.unwrapNodes(editor, {
    match: n =>
      !Editor.isEditor(n) &&
      SlateElement.isElement(n) &&
      LIST_TYPES.includes((n as never as { type?: string }).type ?? ''),
    split: true,
  });

  Transforms.setNodes(editor, {
    type: (isActive ? BlockFormat.Paragraph
    : isList ? BlockFormat.ListItem
    : format) as never,
  });

  if (!isActive && isList) {
    Transforms.wrapNodes(editor, {
      type: format,
      children: [],
    } as never);
  }
};

const insertLink = (editor: Editor, url: string): void => {
  if (!url) {
    return;
  }
  if (editor.selection && !Editor.string(editor, editor.selection)) {
    Transforms.insertNodes(editor, {
      type: InlineFormat.Link,
      url,
      children: [{ text: url }],
    } as never);
    return;
  }
  Transforms.wrapNodes(
    editor,
    { type: InlineFormat.Link, url, children: [] } as never,
    { split: true }
  );
  Transforms.collapse(editor, { edge: 'end' });
};

const renderElement = (props: RenderElementProps) => {
  const { attributes, children, element } = props;
  const el = element as never as { type?: string; placeholderKey?: string };

  switch (el.type) {
    case PLACEHOLDER_TYPE:
      return (
        <span
          {...attributes}
          contentEditable={false}
          style={{ display: 'inline-block' }}
        >
          <PlaceholderChip
            size="small"
            color="info"
            variant="outlined"
            label={el.placeholderKey}
          />
          {children}
        </span>
      );
    case BlockFormat.H1:
      return <h1 {...attributes}>{children}</h1>;
    case BlockFormat.H2:
      return <h2 {...attributes}>{children}</h2>;
    case BlockFormat.H3:
      return <h3 {...attributes}>{children}</h3>;
    case BlockFormat.UnorderedList:
      return <ul {...attributes}>{children}</ul>;
    case BlockFormat.OrderedList:
      return <ol {...attributes}>{children}</ol>;
    case BlockFormat.ListItem:
      return <li {...attributes}>{children}</li>;
    case InlineFormat.Link:
      return (
        <a
          {...attributes}
          href={(element as never as { url?: string }).url}
          style={{ color: '#1a73e8' }}
        >
          {children}
        </a>
      );
    default:
      return <p {...attributes}>{children}</p>;
  }
};

const renderLeaf = ({ attributes, children, leaf }: RenderLeafProps) => {
  const mark = leaf as never as Record<string, boolean>;
  let node = children;
  if (mark[TextFormat.Bold]) {
    node = <strong>{node}</strong>;
  }
  if (mark[TextFormat.Italic]) {
    node = <em>{node}</em>;
  }
  if (mark[TextFormat.Underline]) {
    node = <u>{node}</u>;
  }
  if (mark[TextFormat.Strikethrough]) {
    node = <del>{node}</del>;
  }
  return <span {...attributes}>{node}</span>;
};

interface MarkButtonProps {
  format: TextFormat;
  label: string;
  icon: JSX.Element;
}

const MarkButton = ({ format, label, icon }: MarkButtonProps) => {
  const editor = useSlate();
  return (
    <Tooltip title={label}>
      <ToggleButton
        size="small"
        value={format}
        selected={isMarkActive(editor, format)}
        onMouseDown={event => {
          event.preventDefault();
          toggleMark(editor, format);
        }}
      >
        {icon}
      </ToggleButton>
    </Tooltip>
  );
};

interface BlockButtonProps {
  format: string;
  label: string;
  icon: JSX.Element;
}

const BlockButton = ({ format, label, icon }: BlockButtonProps) => {
  const editor = useSlate();
  return (
    <Tooltip title={label}>
      <ToggleButton
        size="small"
        value={format}
        selected={isBlockActive(editor, format)}
        onMouseDown={event => {
          event.preventDefault();
          toggleBlock(editor, format);
        }}
      >
        {icon}
      </ToggleButton>
    </Tooltip>
  );
};

const HeadingButton = ({
  format,
  label,
}: {
  format: string;
  label: string;
}) => {
  const editor = useSlate();
  return (
    <ToggleButton
      size="small"
      value={format}
      selected={isBlockActive(editor, format)}
      onMouseDown={event => {
        event.preventDefault();
        toggleBlock(editor, format);
      }}
    >
      {label}
    </ToggleButton>
  );
};

const LinkButton = () => {
  const editor = useSlate();
  const { t } = useTranslation();
  return (
    <Tooltip title={t('mailTemplates.editor.link')}>
      <ToggleButton
        size="small"
        value="link"
        onMouseDown={event => {
          event.preventDefault();
          const url = window.prompt(t('mailTemplates.editor.linkPrompt') ?? '');
          if (url) {
            insertLink(editor, url);
          }
        }}
      >
        <MdLink />
      </ToggleButton>
    </Tooltip>
  );
};

export interface MailTemplateEditorProps {
  editor: Editor;
  value: Descendant[];
  onChange: (value: Descendant[]) => void;
}

function MailTemplateEditorComponent({
  editor,
  value,
  onChange,
}: MailTemplateEditorProps) {
  const { t } = useTranslation();
  const renderElementCb = useCallback(renderElement, []);
  const renderLeafCb = useCallback(renderLeaf, []);

  return (
    <EditorWrapper>
      <Slate
        editor={editor}
        initialValue={value}
        onChange={onChange}
      >
        <Toolbar>
          <HeadingButton
            format={BlockFormat.H1}
            label="H1"
          />
          <HeadingButton
            format={BlockFormat.H2}
            label="H2"
          />
          <HeadingButton
            format={BlockFormat.H3}
            label="H3"
          />
          <Divider
            orientation="vertical"
            flexItem
          />
          <MarkButton
            format={TextFormat.Bold}
            label={t('mailTemplates.editor.bold')}
            icon={<MdFormatBold />}
          />
          <MarkButton
            format={TextFormat.Italic}
            label={t('mailTemplates.editor.italic')}
            icon={<MdFormatItalic />}
          />
          <MarkButton
            format={TextFormat.Underline}
            label={t('mailTemplates.editor.underline')}
            icon={<MdFormatUnderlined />}
          />
          <MarkButton
            format={TextFormat.Strikethrough}
            label={t('mailTemplates.editor.strikethrough')}
            icon={<MdStrikethroughS />}
          />
          <Divider
            orientation="vertical"
            flexItem
          />
          <BlockButton
            format={BlockFormat.UnorderedList}
            label={t('mailTemplates.editor.bulletedList')}
            icon={<MdFormatListBulleted />}
          />
          <BlockButton
            format={BlockFormat.OrderedList}
            label={t('mailTemplates.editor.numberedList')}
            icon={<MdFormatListNumbered />}
          />
          <Divider
            orientation="vertical"
            flexItem
          />
          <LinkButton />
        </Toolbar>

        <EditorSurface
          renderElement={renderElementCb}
          renderLeaf={renderLeafCb}
          spellCheck
          placeholder={t('mailTemplates.editor.placeholder') ?? ''}
        />
      </Slate>
    </EditorWrapper>
  );
}

export const MailTemplateEditor = memo(MailTemplateEditorComponent);
