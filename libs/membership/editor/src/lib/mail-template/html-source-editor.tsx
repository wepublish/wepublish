import {
  memo,
  useCallback,
  useMemo,
  useRef,
  useState,
  type UIEvent,
  type KeyboardEvent,
  type ChangeEvent,
} from 'react';
import { Box } from '@mui/material';
import { styled } from '@mui/material/styles';

const escapeHtml = (value: string): string =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const highlightAttributes = (attrs: string): string => {
  const re = /([\w:.-]+)(\s*=\s*)("[^"]*"|'[^']*')|([\w:.-]+)|(\s+)|([^\s]+)/g;
  let result = '';
  let match: RegExpExecArray | null;
  while ((match = re.exec(attrs)) !== null) {
    const [, name, eq, value, lone, ws, other] = match;
    if (name) {
      result += `<span class="tok-attr">${escapeHtml(
        name
      )}</span>${escapeHtml(eq)}<span class="tok-val">${escapeHtml(
        value
      )}</span>`;
    } else if (lone) {
      result += `<span class="tok-attr">${escapeHtml(lone)}</span>`;
    } else if (ws) {
      result += ws;
    } else if (other) {
      result += escapeHtml(other);
    }
  }
  return result;
};

const highlightTag = (tag: string): string => {
  const open = tag.startsWith('</') ? '</' : '<';
  let rest = tag.slice(open.length);

  let close = '';
  if (rest.endsWith('/>')) {
    close = '/>';
    rest = rest.slice(0, -2);
  } else if (rest.endsWith('>')) {
    close = '>';
    rest = rest.slice(0, -1);
  }

  const nameMatch = rest.match(/^([a-zA-Z][\w:-]*)/);
  if (!nameMatch) {
    return escapeHtml(tag);
  }

  const name = nameMatch[1];
  const attrs = rest.slice(name.length);

  return (
    `<span class="tok-punc">${escapeHtml(open)}</span>` +
    `<span class="tok-tag">${escapeHtml(name)}</span>` +
    highlightAttributes(attrs) +
    `<span class="tok-punc">${escapeHtml(close)}</span>`
  );
};

/**
 * Minimal, dependency-free HTML tokenizer producing highlighted markup. Every
 * piece of user text is escaped; only our own <span> wrappers are injected.
 */
const highlightHtml = (code: string): string => {
  let out = '';
  let i = 0;
  const n = code.length;

  while (i < n) {
    if (code.startsWith('<!--', i)) {
      const end = code.indexOf('-->', i + 4);
      const stop = end === -1 ? n : end + 3;
      out += `<span class="tok-comment">${escapeHtml(
        code.slice(i, stop)
      )}</span>`;
      i = stop;
    } else if (code[i] === '<') {
      const end = code.indexOf('>', i);
      const stop = end === -1 ? n : end + 1;
      out += highlightTag(code.slice(i, stop));
      i = stop;
    } else {
      const next = code.indexOf('<', i);
      const stop = next === -1 ? n : next;
      out += escapeHtml(code.slice(i, stop));
      i = stop;
    }
  }

  // Trailing newline keeps the last line visible in the highlight layer.
  return out + '\n';
};

const sharedTextStyles = `
  margin: 0;
  padding: 16px;
  box-sizing: border-box;
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  font-size: 13px;
  line-height: 1.6;
  tab-size: 2;
  white-space: pre-wrap;
  word-break: break-word;
  overflow-wrap: break-word;
`;

const Wrapper = styled(Box)`
  position: relative;
  min-height: 520px;
  border: 1px solid ${({ theme }) => theme.palette.divider};
  border-radius: 6px;
  background-color: #fff;
  overflow: hidden;

  & .tok-tag {
    color: #22863a;
  }
  & .tok-attr {
    color: #6f42c1;
  }
  & .tok-val {
    color: #032f62;
  }
  & .tok-comment {
    color: #6a737d;
    font-style: italic;
  }
  & .tok-punc {
    color: #24292e;
  }
`;

const Highlight = styled('pre')`
  ${sharedTextStyles};
  position: absolute;
  inset: 0;
  overflow: auto;
  pointer-events: none;
  color: #24292e;
`;

const SourceArea = styled('textarea')`
  ${sharedTextStyles};
  position: absolute;
  inset: 0;
  overflow: auto;
  resize: none;
  border: 0;
  outline: none;
  background: transparent;
  color: transparent;
  caret-color: #24292e;
`;

export interface HtmlSourceEditorProps {
  value: string;
  onChange: (value: string) => void;
}

function HtmlSourceEditorComponent({ value, onChange }: HtmlSourceEditorProps) {
  const [code, setCode] = useState(value);
  const highlightRef = useRef<HTMLPreElement>(null);

  const highlighted = useMemo(() => highlightHtml(code), [code]);

  const update = useCallback(
    (next: string) => {
      setCode(next);
      onChange(next);
    },
    [onChange]
  );

  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    update(event.target.value);
  };

  const handleScroll = (event: UIEvent<HTMLTextAreaElement>) => {
    if (highlightRef.current) {
      highlightRef.current.scrollTop = event.currentTarget.scrollTop;
      highlightRef.current.scrollLeft = event.currentTarget.scrollLeft;
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Tab') {
      event.preventDefault();
      const target = event.currentTarget;
      const { selectionStart, selectionEnd, value: current } = target;
      const next =
        current.slice(0, selectionStart) + '  ' + current.slice(selectionEnd);
      update(next);
      // Restore caret after the inserted indentation.
      requestAnimationFrame(() => {
        target.selectionStart = target.selectionEnd = selectionStart + 2;
      });
    }
  };

  return (
    <Wrapper>
      <Highlight
        ref={highlightRef}
        aria-hidden="true"
        dangerouslySetInnerHTML={{ __html: highlighted }}
      />
      <SourceArea
        value={code}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        onChange={handleChange}
        onScroll={handleScroll}
        onKeyDown={handleKeyDown}
      />
    </Wrapper>
  );
}

export const HtmlSourceEditor = memo(HtmlSourceEditorComponent);
