import styled from '@emotion/styled';
import {
  BlockFormat,
  InlineFormat,
  TextFormat,
  toPlaintext,
} from '@wepublish/richtext';
import { pipe } from 'ramda';
import React, { memo, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  MdFormatBold,
  MdFormatItalic,
  MdFormatListBulleted,
  MdFormatListNumbered,
  MdFormatStrikethrough,
  MdFormatUnderlined,
  MdLink,
  MdMood,
  MdSubscript,
  MdSuperscript,
  MdTableChart,
} from 'react-icons/md';
import { createEditor, Editor, Location, Transforms } from 'slate';
import { Hotkeys } from 'slate-dom';
import { withHistory } from 'slate-history';
import { Editable, ReactEditor, Slate, withReact } from 'slate-react';

import { BlockProps } from '../../atoms/blockList';
import { EmojiPicker } from '../../atoms/emojiPicker';
import {
  H1Icon,
  H2Icon,
  H3Icon,
  SubMenuButton,
  Toolbar,
  ToolbarDivider,
} from '../../atoms/toolbar';
import { RichTextBlockValue } from '../types';
import { withNormalizeNode } from './editor/normalizing';
import { withRichText, withSoftBreak, withTable } from './editor/plugins';
import { renderElement, renderLeaf } from './editor/render';
import { WepublishEditor } from './editor/wepublishEditor';
import {
  EditorSubMenuButton,
  FormatButton,
  FormatIconButton,
} from './toolbar/buttons';
import { LinkMenu } from './toolbar/linkMenu';
import { TableMenu } from './toolbar/tableMenu';

const CharCount = styled.p`
  text-align: right;
`;

const AltPlaceholder = styled.div`
  color: #cad5e4;
`;

const Divider = styled(ToolbarDivider)`
  height: 1.8em;
`;

const SlateWrapper = styled.div`
  [contenteditable] {
    padding: 8px;
  }
`;

export interface RichTextBlockProps
  extends BlockProps<RichTextBlockValue['richText']> {
  displayOnly?: boolean;
  showCharCount?: boolean;
  displayOneLine?: boolean;
}

export const RichTextBlock = memo(function RichTextBlock({
  value,
  autofocus,
  disabled,
  onChange,
  displayOnly = false,
  showCharCount = false,
  displayOneLine = false,
}: RichTextBlockProps) {
  const editor = useMemo(
    () =>
      pipe(
        createEditor,
        withReact,
        withHistory,
        withNormalizeNode,
        withTable,
        withRichText,
        withSoftBreak
      )(),
    []
  );

  const [hasFocus, setFocus] = useState(false);
  const [location, setLocation] = useState<Location | null>(null);
  const [charCount, setCharCount] = useState(0);

  const editorKey = useMemo(() => toPlaintext(value), [value]);

  useEffect(() => {
    setCharCount(WepublishEditor.calculateEditorCharCount(editor));
  }, [editor.children]);

  const { t } = useTranslation();

  useEffect(() => {
    if (autofocus) {
      ReactEditor.focus(editor);
    }
  }, []);

  const focusAtPreviousLocation = (location: Location) => {
    Transforms.select(editor, location);
    ReactEditor.focus(editor);
  };

  const activateHotkey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (Hotkeys.isSoftBreak(e.nativeEvent)) {
      Editor.insertSoftBreak(editor);
      e.preventDefault();
      return;
    }

    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 'b': {
          e.preventDefault();
          WepublishEditor.toggleFormat(editor, TextFormat.Bold);
          break;
        }
        case 'i': {
          e.preventDefault();
          WepublishEditor.toggleFormat(editor, TextFormat.Italic);
          break;
        }
        case 'u': {
          e.preventDefault();
          WepublishEditor.toggleFormat(editor, TextFormat.Underline);
          break;
        }
        case 'x': {
          if (e.getModifierState('Shift')) {
            e.preventDefault();
            WepublishEditor.toggleFormat(editor, TextFormat.Strikethrough);
          }
          break;
        }
      }

      return;
    }
  };

  return (
    <SlateWrapper>
      <Slate
        key={editorKey}
        editor={editor}
        initialValue={
          value?.length ? value : WepublishEditor.createDefaultValue()
        }
        onChange={newValue => {
          setFocus(ReactEditor.isFocused(editor));
          if (value !== newValue) {
            onChange(newValue);
          }
        }}
      >
        {!displayOnly && (
          <>
            <Toolbar
              fadeOut={!hasFocus}
              onMouseDown={() => {
                if (!hasFocus && location) focusAtPreviousLocation(location);
              }}
            >
              <FormatButton format={BlockFormat.H1}>
                <H1Icon />
              </FormatButton>
              <FormatButton format={BlockFormat.H2}>
                <H2Icon />
              </FormatButton>
              <FormatButton format={BlockFormat.H3}>
                <H3Icon />
              </FormatButton>

              <Divider />

              <FormatIconButton
                icon={<MdFormatListBulleted />}
                format={BlockFormat.UnorderedList}
              />
              <FormatIconButton
                icon={<MdFormatListNumbered />}
                format={BlockFormat.OrderedList}
              />

              <Divider />

              <EditorSubMenuButton
                icon={<MdTableChart />}
                editorHasFocus={hasFocus}
              >
                <TableMenu />
              </EditorSubMenuButton>

              <Divider />

              <FormatIconButton
                icon={<MdFormatBold />}
                format={TextFormat.Bold}
              />
              <FormatIconButton
                icon={<MdFormatItalic />}
                format={TextFormat.Italic}
              />
              <FormatIconButton
                icon={<MdFormatUnderlined />}
                format={TextFormat.Underline}
              />
              <FormatIconButton
                icon={<MdFormatStrikethrough />}
                format={TextFormat.Strikethrough}
              />
              <FormatIconButton
                icon={<MdSuperscript />}
                format={TextFormat.Superscript}
              />
              <FormatIconButton
                icon={<MdSubscript />}
                format={TextFormat.Subscript}
              />

              <Divider />

              <SubMenuButton
                icon={<MdLink />}
                format={InlineFormat.Link}
              >
                <LinkMenu />
              </SubMenuButton>

              <Divider />

              <SubMenuButton icon={<MdMood />}>
                <EmojiPicker
                  setEmoji={emoji => {
                    editor.insertText(emoji);
                  }}
                />
              </SubMenuButton>
            </Toolbar>
            {WepublishEditor.isEmpty(editor) && ( // Alternative placeholder
              <AltPlaceholder onClick={() => ReactEditor.focus(editor)}>
                {t('blocks.richText.startWriting')}
              </AltPlaceholder>
            )}
          </>
        )}

        <Editable
          style={
            displayOneLine ?
              {
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }
            : undefined
          }
          readOnly={disabled || displayOnly}
          renderElement={renderElement}
          renderLeaf={renderLeaf}
          onBlur={() => {
            setLocation(editor.selection);
          }}
          onKeyDown={activateHotkey}
        />
        {showCharCount && (
          <CharCount>{t('blocks.richText.charCount', { charCount })}</CharCount>
        )}
      </Slate>
    </SlateWrapper>
  );
});

export function createDefaultValue(): RichTextBlockValue['richText'] {
  return WepublishEditor.createDefaultValue();
}
