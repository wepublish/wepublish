import {
  EditorContent,
  EditorContext,
  useEditor,
  UseEditorOptions,
} from '@tiptap/react';

import { MenuBar } from './editor/menu-bar';
import styled from '@emotion/styled';
import { Box, css, Paper } from '@mui/material';
import { BubbleMenu } from './editor/bubble-menu';
import { editorConfig } from './richtext-editor.config';
import { DragHandle } from './editor/drag-handle';
import { FooterActions } from './editor/footer-actions';
import { RichtextJSONDocument } from '@wepublish/richtext';
import { forwardRef, useEffect, useMemo } from 'react';
import { equals } from 'ramda';

export const RichtextEditorWrapper = styled(Paper)``;

const Editor = styled(EditorContent)`
  .tiptap {
    padding: ${({ theme }) => theme.spacing(3, 3, 3, 7)};
    outline: none;

    &.resize-cursor {
      cursor: ew-resize;
      cursor: col-resize;
    }

    *:first-child {
      margin-top: 0;
    }
    *:last-child {
      margin-bottom: 0;
    }
  }

  pre {
    border-radius: 6px;
    padding: ${({ theme }) => theme.spacing(1.5)};
    background-color: ${({ theme }) => theme.palette.grey[800]};
    color: ${({ theme }) =>
      theme.palette.getContrastText(theme.palette.grey[800])};
  }

  // MUI theme
  p,
  li {
    ${({ theme }) => css(theme.typography.body1)}
  }

  h1 {
    ${({ theme }) => css(theme.typography.h1)}
  }

  h2 {
    ${({ theme }) => css(theme.typography.h2)}
  }

  h3 {
    ${({ theme }) => css(theme.typography.h3)}
  }

  h4 {
    ${({ theme }) => css(theme.typography.h4)}
  }

  h5 {
    ${({ theme }) => css(theme.typography.h5)}
  }

  h6 {
    ${({ theme }) => css(theme.typography.h6)}
  }

  // Blockquote
  blockquote {
    border-left: 3px solid ${({ theme }) => theme.palette.text.disabled};
    margin: 1.5rem 0;
    padding-left: 1rem;
  }

  // Tables
  table {
    border-collapse: collapse;
    margin: 0;
    overflow: hidden;
    table-layout: fixed;
    width: 100%;

    td,
    th {
      border: 1px solid #000;
      box-sizing: border-box;
      min-width: 1em;
      padding: 6px 8px;
      position: relative;
      vertical-align: top;

      p {
        margin: 0;
      }
    }

    th {
      background-color: ${({ theme }) => theme.palette.grey['300']};
      font-weight: bold;
      text-align: left;
    }
  }

  // Wrapper around tables by TipTap
  .tableWrapper {
    margin: 1.5rem 0;
    overflow-x: auto;
  }

  .selectedCell {
    border-style: dashed;
  }

  // Placeholder
  .is-empty::before {
    color: ${({ theme }) => theme.palette.grey[400]};
    content: attr(data-placeholder);
    float: left;
    height: 0;
    pointer-events: none;
  }

  .ProseMirror-selectednode:not(img):not(pre):not(.react-renderer) {
    background-color: #68cef822;
    border-radius: 0.5rem;

    &:is(blockquote) {
      border-top-left-radius: 0;
      border-bottom-left-radius: 0;
    }
  }
`;

type RichtextEditorProps = {
  defaultValue?: UseEditorOptions['content'];
  value?: UseEditorOptions['content'];
  disabled?: boolean;
  autofocus?: boolean;
  onChange?: (values: { json: RichtextJSONDocument; html: string }) => void;
};

export const RichtextEditor = forwardRef<HTMLDivElement, RichtextEditorProps>(
  ({ defaultValue, value, onChange, disabled, autofocus }, ref) => {
    const editor = useEditor(
      {
        ...editorConfig,
        content: null,
        autofocus,
        editable: !disabled,
        onUpdate: arg => {
          onChange?.({
            html: arg.editor.getHTML(),
            json: arg.editor.getJSON() as RichtextJSONDocument,
          });
        },
      },
      [disabled, autofocus]
    );
    const providerValue = useMemo(() => ({ editor }), [editor]);

    useEffect(() => {
      if (defaultValue) {
        editor.commands.setContent(defaultValue);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
      if (!equals(value, editor.getJSON()) && value) {
        editor.commands.setContent(value);
      }
    }, [value, editor]);

    return (
      <EditorContext.Provider value={providerValue}>
        <RichtextEditorWrapper
          variant="outlined"
          square={false}
        >
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: 0.5,
              p: 1,
              borderBottom: 1,
              borderColor: 'divider',
            }}
          >
            <MenuBar />
          </Box>

          <BubbleMenu />
          <DragHandle />

          <Editor
            editor={editor}
            ref={ref}
          />

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              height: 46,
              gap: 2,
              p: 1,
              m: 2,
              mt: 0,
              borderRadius: 2,
              border: 1,
              borderColor: 'divider',
              flexWrap: 'wrap',
              bgcolor: 'background.default',
              position: 'sticky',
              bottom: 16,
              '&:empty': {
                opacity: 0,
                pointerEvents: 'none',
              },
            }}
          >
            <FooterActions />
          </Box>
        </RichtextEditorWrapper>
      </EditorContext.Provider>
    );
  }
);
