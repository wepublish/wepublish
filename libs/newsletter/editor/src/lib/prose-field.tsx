import { useApolloClient } from '@apollo/client';
import type { CustomField } from '@measured/puck';
import { inlineMarkup } from '@wepublish/newsletter';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { MergeTag, MergeTagCatalogue } from './merge-tags';
import { filterTags, loadMergeTags } from './merge-tags';
import {
  Editable,
  Note,
  Popover,
  PopoverGroup,
  PopoverItem,
  PopoverList,
  PopoverSearch,
  SmallButton,
  SmallInput,
  Toolbar,
} from './styles';

/**
 * A small rich-text field that stores the inline markup the renderer
 * understands (one paragraph per line) while showing bold as bold and links
 * as links. `toHtml` draws the markup, `linesFrom` reads the DOM back and is
 * deliberately lossy: anything the newsletter cannot draw is dropped here
 * rather than shown in the canvas and lost in the mail.
 */

const BULLET = '- ';

const BLOCK = /^(P|DIV|UL|OL|LI|H[1-6]|BLOCKQUOTE|PRE|TABLE|TR|TD)$/;

const escapeHtml = (text: string): string =>
  text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

function inlineHtml(line: string): string {
  const pattern = inlineMarkup();
  let out = '';
  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(line)) !== null) {
    if (match[1] !== undefined) {
      continue;
    }

    out += escapeHtml(line.slice(last, match.index));

    if (match[2] !== undefined) {
      out += `<b>${escapeHtml(match[2])}</b>`;
    } else {
      out += `<a href="${escapeHtml(match[4] ?? '')}">${escapeHtml(match[3] ?? '')}</a>`;
    }

    last = pattern.lastIndex;
  }

  return out + escapeHtml(line.slice(last));
}

function toHtml(value: string): string {
  const lines = value.split('\n').filter(line => line.trim() !== '');
  const out: string[] = [];
  let bullets: string[] = [];

  const flushBullets = () => {
    if (bullets.length > 0) {
      out.push(
        `<ul>${bullets.map(item => `<li>${inlineHtml(item)}</li>`).join('')}</ul>`
      );
      bullets = [];
    }
  };

  lines.forEach(line => {
    if (line.startsWith(BULLET)) {
      bullets.push(line.slice(BULLET.length));

      return;
    }

    flushBullets();
    out.push(`<p>${inlineHtml(line)}</p>`);
  });

  flushBullets();

  return out.join('') || '<p><br></p>';
}

interface Walk {
  lines: string[];
  line: string;
  bullet: boolean;
}

const textFrom = (node: Node): string =>
  (node.textContent ?? '').replace(/\u00a0/g, ' ');

const collapse = (text: string): string => text.replace(/\s+/g, ' ').trim();

function flush(walk: Walk) {
  const text = collapse(walk.line);

  if (text !== '') {
    walk.lines.push(walk.bullet ? BULLET + text : text);
  }

  walk.line = '';
}

function bolded(text: string, bold: boolean): string {
  if (!bold || text.trim() === '') {
    return text;
  }

  const match = /^(\s*)([\s\S]*?)(\s*)$/.exec(text);

  return `${match?.[1] ?? ''}**${match?.[2] ?? text}**${match?.[3] ?? ''}`;
}

function isBold(element: HTMLElement): boolean {
  const weight = element.style.fontWeight;

  return (
    element.tagName === 'B' ||
    element.tagName === 'STRONG' ||
    weight === 'bold' ||
    weight === 'bolder' ||
    Number(weight) >= 600
  );
}

function collect(node: Node, walk: Walk, bold: boolean) {
  if (node.nodeType === Node.TEXT_NODE) {
    walk.line += bolded(textFrom(node), bold);

    return;
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return;
  }

  const element = node as HTMLElement;

  if (element.tagName === 'BR') {
    flush(walk);

    return;
  }

  if (element.tagName === 'A') {
    const href = (element.getAttribute('href') ?? '').trim();
    const label = collapse(textFrom(element)).replace(/[[\]]/g, '');
    walk.line +=
      href === '' || label === '' ?
        label
      : `[${label}](${href.replace(/\s/g, '%20')})`;

    return;
  }

  const block = BLOCK.test(element.tagName);
  const outerBullet = walk.bullet;

  if (block) {
    flush(walk);
  }

  if (element.tagName === 'LI') {
    walk.bullet = true;
  }

  element.childNodes.forEach(child =>
    collect(child, walk, bold || isBold(element))
  );

  if (block) {
    flush(walk);
  }

  walk.bullet = outerBullet;
}

export function linesFrom(root: HTMLElement): string {
  const walk: Walk = { lines: [], line: '', bullet: false };

  root.childNodes.forEach(child => collect(child, walk, false));
  flush(walk);

  return walk.lines.join('\n').replace(/\*\*\*\*/g, '');
}

function anchorAt(
  root: HTMLElement,
  selection: Selection | null
): HTMLAnchorElement | null {
  const node = selection?.focusNode;

  if (!node || !root.contains(node)) {
    return null;
  }

  const element =
    node.nodeType === Node.ELEMENT_NODE ?
      (node as HTMLElement)
    : node.parentElement;

  return element?.closest('a') ?? null;
}

interface LinkState {
  open: boolean;
  url: string;
  existing: boolean;
}

const CLOSED: LinkState = { open: false, url: '', existing: false };

function ProseEditor({
  value,
  onChange,
  id,
}: {
  value: string;
  onChange: (next: string) => void;
  id: string;
}) {
  const { t } = useTranslation();
  const client = useApolloClient();
  const ref = useRef<HTMLDivElement>(null);
  const drawn = useRef(false);
  const focused = useRef(false);
  const saved = useRef<Range | null>(null);
  const [link, setLink] = useState<LinkState>(CLOSED);
  const [active, setActive] = useState({
    bold: false,
    list: false,
    link: false,
  });
  const [picker, setPicker] = useState(false);
  const [query, setQuery] = useState('');
  const [tags, setTags] = useState<MergeTagCatalogue | null>(null);

  // While the caret is in this field the DOM is the truth: Puck re-renders
  // the field on every keystroke and a redraw mid-word would reset the caret.
  useEffect(() => {
    const root = ref.current;

    if (!root) {
      return;
    }

    if (!drawn.current) {
      drawn.current = true;
      root.innerHTML = toHtml(value);

      return;
    }

    if (focused.current) {
      return;
    }

    if (linesFrom(root) !== value) {
      root.innerHTML = toHtml(value);
    }
  }, [value]);

  const sync = useCallback(() => {
    const root = ref.current;

    if (root) {
      onChange(linesFrom(root));
    }
  }, [onChange]);

  const refresh = useCallback(() => {
    const root = ref.current;
    const selection = document.getSelection();

    if (!root || !selection?.focusNode || !root.contains(selection.focusNode)) {
      return;
    }

    const next = {
      bold: document.queryCommandState('bold'),
      list: document.queryCommandState('insertUnorderedList'),
      link: anchorAt(root, selection) !== null,
    };

    setActive(current =>
      (
        current.bold === next.bold &&
        current.list === next.list &&
        current.link === next.link
      ) ?
        current
      : next
    );
  }, []);

  useEffect(() => {
    document.addEventListener('selectionchange', refresh);

    return () => document.removeEventListener('selectionchange', refresh);
  }, [refresh]);

  const exec = (command: string, argument?: string) => {
    const root = ref.current;

    if (!root) {
      return;
    }

    root.focus();
    document.execCommand('styleWithCSS', false, 'false');
    document.execCommand(command, false, argument);
    sync();
    refresh();
  };

  const restore = (): Selection | null => {
    const root = ref.current;
    const selection = document.getSelection();

    if (root && selection && saved.current) {
      root.focus();
      selection.removeAllRanges();
      selection.addRange(saved.current);
    }

    return selection;
  };

  const selectAnchor = (selection: Selection, anchor: HTMLAnchorElement) => {
    const range = document.createRange();
    range.selectNodeContents(anchor);
    selection.removeAllRanges();
    selection.addRange(range);
  };

  const stash = (): boolean => {
    const root = ref.current;

    if (!root) {
      return false;
    }

    let selection = document.getSelection();

    if (!selection?.rangeCount || !root.contains(selection.focusNode)) {
      const range = document.createRange();
      range.selectNodeContents(root);
      range.collapse(false);

      root.focus();
      selection = document.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
    }

    if (!selection?.rangeCount) {
      return false;
    }

    saved.current = selection.getRangeAt(0).cloneRange();

    return true;
  };

  const openLink = () => {
    const root = ref.current;

    if (!root || !stash()) {
      return;
    }

    setPicker(false);
    const anchor = anchorAt(root, document.getSelection());
    setLink({
      open: true,
      url: anchor?.getAttribute('href') ?? 'https://',
      existing: anchor !== null,
    });
  };

  const linkTo = (selection: Selection, url: string, label: string) => {
    const root = ref.current;

    if (!root || url === '') {
      return;
    }

    const anchor = anchorAt(root, selection);

    if (anchor) {
      anchor.setAttribute('href', url);
      selectAnchor(selection, anchor);
      root.focus();
      sync();
      refresh();

      return;
    }

    if (selection.isCollapsed) {
      document.execCommand('insertText', false, label);
      const node = selection.focusNode;
      const end = selection.focusOffset;

      if (node?.nodeType === Node.TEXT_NODE && end >= label.length) {
        selection.setBaseAndExtent(node, end - label.length, node, end);
      }
    }

    root.focus();
    document.execCommand('styleWithCSS', false, 'false');
    document.execCommand('createLink', false, url);
    // Written back: `createLink` percent-encodes a merge tag's pipes and
    // `*%7CUNSUB%7C*` is a dead link in every copy of the mail.
    anchorAt(root, document.getSelection())?.setAttribute('href', url);
    sync();
    refresh();
  };

  const applyLink = () => {
    const selection = restore();
    const url = link.url.trim();

    setLink(CLOSED);

    if (selection) {
      linkTo(selection, url, url);
    }
  };

  const removeLink = () => {
    const root = ref.current;
    const selection = restore();

    setLink(CLOSED);

    if (root && selection) {
      const anchor = anchorAt(root, selection);

      if (anchor) {
        selectAnchor(selection, anchor);
      }

      exec('unlink');
    }
  };

  const openPicker = () => {
    if (!stash()) {
      return;
    }

    setLink(CLOSED);
    setQuery('');
    setPicker(true);
    void loadMergeTags(client, t).then(setTags);
  };

  const insertTag = (tag: MergeTag) => {
    const root = ref.current;
    const selection = restore();

    setPicker(false);

    if (!root || !selection) {
      return;
    }

    if (tag.kind === 'url') {
      linkTo(selection, tag.tag, tag.label);

      return;
    }

    root.focus();
    document.execCommand('insertText', false, tag.tag);
    sync();
    refresh();
  };

  const keepSelection = (event: { preventDefault: () => void }) =>
    event.preventDefault();

  const groups = filterTags(tags?.groups ?? [], query);

  return (
    <div>
      <Toolbar>
        <SmallButton
          type="button"
          data-active={active.bold}
          onMouseDown={keepSelection}
          onClick={() => exec('bold')}
          title={t('newsletter.prose.boldTitle')}
        >
          <strong>{t('newsletter.prose.bold')}</strong>
        </SmallButton>
        <SmallButton
          type="button"
          data-active={active.link}
          onMouseDown={keepSelection}
          onClick={openLink}
          title={t('newsletter.prose.link')}
        >
          {t('newsletter.prose.link')}
        </SmallButton>
        <SmallButton
          type="button"
          data-active={active.list}
          onMouseDown={keepSelection}
          onClick={() => exec('insertUnorderedList')}
          title={t('newsletter.prose.list')}
        >
          {t('newsletter.prose.list')}
        </SmallButton>
        <SmallButton
          type="button"
          data-active={picker}
          onMouseDown={keepSelection}
          onClick={picker ? () => setPicker(false) : openPicker}
          title={t('newsletter.prose.mergeTagTitle')}
        >
          {t('newsletter.prose.mergeTag')}
        </SmallButton>
      </Toolbar>

      {link.open ?
        <Toolbar>
          <SmallInput
            type="text"
            style={{ flex: 1 }}
            value={link.url}
            autoFocus
            placeholder="https://…"
            onChange={event =>
              setLink({ ...link, url: event.currentTarget.value })
            }
            onKeyDown={event => {
              if (event.key === 'Enter') {
                event.preventDefault();
                applyLink();
              } else if (event.key === 'Escape') {
                event.preventDefault();
                setLink(CLOSED);
              }
            }}
          />
          <SmallButton
            type="button"
            onMouseDown={keepSelection}
            onClick={applyLink}
          >
            {t('newsletter.prose.applyLink')}
          </SmallButton>
          {link.existing ?
            <SmallButton
              type="button"
              onMouseDown={keepSelection}
              onClick={removeLink}
            >
              {t('newsletter.prose.removeLink')}
            </SmallButton>
          : null}
        </Toolbar>
      : null}

      {picker ?
        <Popover>
          <PopoverSearch
            type="text"
            value={query}
            autoFocus
            placeholder={t('newsletter.prose.searchMergeTags')}
            onChange={event => setQuery(event.currentTarget.value)}
            onKeyDown={event => {
              if (event.key === 'Escape') {
                event.preventDefault();
                setPicker(false);
              }
            }}
          />
          {tags?.error ?
            <Note style={{ padding: '6px 8px' }}>{tags.error}</Note>
          : null}
          {tags === null ?
            <Note style={{ padding: '6px 8px' }}>
              {t('newsletter.prose.loadingMergeTags')}
            </Note>
          : null}
          {tags !== null && groups.length === 0 ?
            <Note style={{ padding: '6px 8px' }}>
              {t('newsletter.prose.noMergeTag')}
            </Note>
          : null}
          <PopoverList>
            {groups.map(group => (
              <div key={group.name}>
                <PopoverGroup>{group.name}</PopoverGroup>
                {group.tags.map(tag => (
                  <PopoverItem
                    key={tag.tag}
                    type="button"
                    title={tag.description}
                    onMouseDown={keepSelection}
                    onClick={() => insertTag(tag)}
                  >
                    <span>{tag.label}</span>
                    <code>{tag.tag}</code>
                  </PopoverItem>
                ))}
              </div>
            ))}
          </PopoverList>
        </Popover>
      : null}

      <Editable
        id={id}
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        onInput={sync}
        onFocus={() => {
          focused.current = true;
        }}
        onBlur={() => {
          focused.current = false;
          sync();
        }}
        onPaste={event => {
          // Plain text only: formatting from Word or a website would show in
          // the field and never reach the mail.
          event.preventDefault();
          document.execCommand(
            'insertText',
            false,
            event.clipboardData.getData('text/plain')
          );
          sync();
        }}
      />
      <Note>{t('newsletter.prose.hint')}</Note>
    </div>
  );
}

export function proseField(label: string): CustomField<string> {
  return {
    type: 'custom',
    label,
    render: ({ value, onChange, id }) => (
      <ProseEditor
        value={value ?? ''}
        onChange={onChange}
        id={id}
      />
    ),
  };
}
