import {
  forwardRef,
  memo,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react';
import { Box } from '@mui/material';
import { styled } from '@mui/material/styles';
import CodeMirror, { ReactCodeMirrorRef } from '@uiw/react-codemirror';
import { html } from '@codemirror/lang-html';
import { EditorView } from '@codemirror/view';

// CodeMirror 6 manages caret + syntax highlighting in a single layer, so there
// is no overlay that can drift out of sync with the text (the cause of earlier
// cursor-alignment bugs).
const Wrapper = styled(Box)`
  height: 100%;
  min-height: 400px;
  border: 1px solid ${({ theme }) => theme.palette.divider};
  border-radius: 6px;
  overflow: hidden;
  background-color: #fff;

  /* The @uiw root div must fill the wrapper so .cm-editor's 100% height
     resolves and the scroller scrolls instead of overflowing. */
  & > div {
    height: 100%;
  }
  & .cm-editor {
    height: 100%;
  }
  & .cm-editor.cm-focused {
    outline: none;
  }
  & .cm-scroller {
    overflow: auto;
    font-family:
      'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
    font-size: 13px;
    line-height: 1.6;
  }
`;

export interface HtmlSourceEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export interface HtmlSourceEditorHandle {
  insertText: (text: string) => void;
}

const HtmlSourceEditorComponent = forwardRef<
  HtmlSourceEditorHandle,
  HtmlSourceEditorProps
>(function HtmlSourceEditor({ value, onChange }, ref) {
  const editorRef = useRef<ReactCodeMirrorRef>(null);

  const extensions = useMemo(() => [html(), EditorView.lineWrapping], []);

  useImperativeHandle(
    ref,
    () => ({
      insertText: (text: string) => {
        const view = editorRef.current?.view;
        if (!view) {
          return;
        }
        view.focus();
        // Replace the current selection (or insert at the caret) and place the
        // caret right after the inserted text.
        view.dispatch(view.state.replaceSelection(text));
      },
    }),
    []
  );

  const handleChange = useCallback(
    (next: string) => {
      onChange(next);
    },
    [onChange]
  );

  return (
    <Wrapper>
      <CodeMirror
        ref={editorRef}
        value={value}
        height="100%"
        style={{ height: '100%' }}
        extensions={extensions}
        onChange={handleChange}
        basicSetup={{
          lineNumbers: true,
          highlightActiveLine: true,
          highlightActiveLineGutter: true,
          foldGutter: false,
        }}
      />
    </Wrapper>
  );
});

export const HtmlSourceEditor = memo(HtmlSourceEditorComponent);
