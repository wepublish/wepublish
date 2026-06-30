import { styled } from '@mui/material';
import StarterKit from '@tiptap/starter-kit';
import { EditorContent, useEditor } from '@tiptap/react';
import { forwardRef, useImperativeHandle } from 'react';
import {
  MdFormatBold,
  MdFormatItalic,
  MdFormatListBulleted,
  MdFormatListNumbered,
  MdFormatQuote,
  MdFormatUnderlined,
  MdLink,
} from 'react-icons/md';
import { ButtonGroup, IconButton } from 'rsuite';

export interface EmailHtmlEditorRef {
  insertText: (text: string) => void;
}

interface EmailHtmlEditorProps {
  value: string;
  onChange: (html: string) => void;
  onFocus?: () => void;
}

const EditorWrapper = styled('div')`
  border: 1px solid #e5e5ea;
  border-radius: 6px;

  .editor-toolbar {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    padding: 6px;
    border-bottom: 1px solid #e5e5ea;
  }

  .ProseMirror {
    min-height: 280px;
    padding: 10px 12px;
    outline: none;
  }

  .ProseMirror p {
    margin: 0 0 0.6em;
  }

  .ProseMirror:focus {
    outline: none;
  }
`;

/**
 * A slim, email-safe WYSIWYG editor. It only enables tags that are safe to use
 * in transactional e-mails (paragraphs, headings 1-3, bold/italic/underline,
 * lists, blockquote and links) and round-trips plain HTML strings so the
 * composed mail stays raw HTML.
 */
export const EmailHtmlEditor = forwardRef<
  EmailHtmlEditorRef,
  EmailHtmlEditorProps
>(({ value, onChange, onFocus }, ref) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        codeBlock: false,
        code: false,
        horizontalRule: false,
        link: {
          openOnClick: false,
          autolink: true,
          defaultProtocol: 'https',
          protocols: ['http', 'https', 'mailto'],
        },
      }),
    ],
    content: value || '',
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    onFocus: () => onFocus?.(),
  });

  useImperativeHandle(
    ref,
    () => ({
      insertText: (text: string) =>
        editor?.chain().focus().insertContent(text).run(),
    }),
    [editor]
  );

  if (!editor) {
    return null;
  }

  const setLink = () => {
    const previous = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('URL', previous ?? 'https://');

    if (url === null) {
      return;
    }

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  const active = (name: string, attrs?: Record<string, unknown>) =>
    editor.isActive(name, attrs) ? 'primary' : 'subtle';

  return (
    <EditorWrapper>
      <div className="editor-toolbar">
        <ButtonGroup>
          <IconButton
            size="sm"
            icon={<MdFormatBold />}
            appearance={active('bold')}
            onClick={() => editor.chain().focus().toggleBold().run()}
          />
          <IconButton
            size="sm"
            icon={<MdFormatItalic />}
            appearance={active('italic')}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          />
          <IconButton
            size="sm"
            icon={<MdFormatUnderlined />}
            appearance={active('underline')}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
          />
        </ButtonGroup>

        <ButtonGroup>
          <IconButton
            size="sm"
            appearance={active('heading', { level: 1 })}
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 1 }).run()
            }
          >
            H1
          </IconButton>
          <IconButton
            size="sm"
            appearance={active('heading', { level: 2 })}
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
          >
            H2
          </IconButton>
          <IconButton
            size="sm"
            appearance={active('heading', { level: 3 })}
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 3 }).run()
            }
          >
            H3
          </IconButton>
        </ButtonGroup>

        <ButtonGroup>
          <IconButton
            size="sm"
            icon={<MdFormatListBulleted />}
            appearance={active('bulletList')}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          />
          <IconButton
            size="sm"
            icon={<MdFormatListNumbered />}
            appearance={active('orderedList')}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          />
          <IconButton
            size="sm"
            icon={<MdFormatQuote />}
            appearance={active('blockquote')}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
          />
          <IconButton
            size="sm"
            icon={<MdLink />}
            appearance={active('link')}
            onClick={setLink}
          />
        </ButtonGroup>
      </div>

      <EditorContent editor={editor} />
    </EditorWrapper>
  );
});
