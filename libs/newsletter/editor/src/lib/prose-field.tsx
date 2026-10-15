/**
 * A small rich-text editor for the blocks that hold prose.
 *
 * It stores the plain inline markup `src/email/inline.tsx` understands, one
 * paragraph per line, while showing bold as bold and a link as a link so nobody
 * has to type `**`. Storing the markup rather than a rich-text model is
 * deliberate: the text stays readable and diffable in the database, an editor who knows the
 * syntax can still type it, and there is no second model to keep in step with
 * what the email renderer can draw.
 *
 * Mailchimp merge tags ride along as ordinary characters: `*|FNAME|*` is text to
 * every function here and to the renderer, and only the sent mail ever shows a
 * value in its place. The picker below is therefore an insert button and nothing
 * more — see `merge-tags.ts` for where the list comes from.
 *
 * The bridge is two pure functions — `toHtml` for the markup the field is given,
 * `linesFrom` for the DOM the browser hands back. `linesFrom` is deliberately
 * lossy: a contenteditable produces far more than three forms of markup, so it
 * keeps what the newsletter can draw and drops the rest. Anything it kept but
 * `renderBlock` could not draw would show in the canvas and disappear in the
 * mail, which is the one failure a WYSIWYG field must not have.
 */
import type { CustomField } from '@puckeditor/core';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { inlineMarkup } from '@wepublish/newsletter/email';
import type { MergeTag, MergeTagCatalogue } from './merge-tags';
import { filterTags, loadMergeTags } from './merge-tags';

const BULLET = '- ';

/** Elements that end the current line. Everything else accumulates inline. */
const BLOCK = /^(P|DIV|UL|OL|LI|H[1-6]|BLOCKQUOTE|PRE|TABLE|TR|TD|LI)$/;

/* ------------------------------------------------------------------ markup → DOM */

const escapeHtml = (text: string): string =>
  text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/**
 * One stored line as the HTML the editor shows.
 *
 * The pattern comes from the renderer rather than being written again here: a
 * second copy would eventually recognise a form the mail does not draw, and the
 * field would then show formatting that never arrives in an inbox.
 */
function inlineHtml(line: string): string {
  const pattern = inlineMarkup();
  let out = '';
  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(line)) !== null) {
    // A merge tag, consumed so the bold branch cannot see the `**` two adjacent
    // tags spell. Nothing is emitted and `last` stays put, so the characters
    // ride along in the next slice of escaped plain text.
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

/** The stored markup as the editable's initial DOM. */
export function toHtml(value: string): string {
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

  // An empty editable has nowhere to put the caret and collapses to a few
  // pixels high, so it starts as one empty paragraph rather than as nothing.
  return out.join('') || '<p><br></p>';
}

/* ------------------------------------------------------------------ DOM → markup */

interface Walk {
  lines: string[];
  line: string;
  bullet: boolean;
}

/** Contenteditable pads with non-breaking spaces; the mail wants ordinary ones. */
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

/**
 * `**` around the text but inside its whitespace — `** fett**` would put the
 * space in the `<strong>`, which shows as a double space in the mail.
 */
function bolded(text: string, bold: boolean): string {
  if (!bold || text.trim() === '') {
    return text;
  }

  const match = /^(\s*)([\s\S]*?)(\s*)$/.exec(text);

  return `${match?.[1] ?? ''}**${match?.[2] ?? text}**${match?.[3] ?? ''}`;
}

/** A pasted `<span style="font-weight: 600">` is bold too, not just `<b>`. */
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

/**
 * Walks one node into `walk`, appending finished lines as blocks end.
 *
 * The walk keys on *whether an element is a block* rather than on a list of
 * tags it expects, because the DOM here is not ours to choose: Chrome wraps
 * lines in `<div>` and Firefox in `<p>`, shift-Enter inserts a `<br>`, and a
 * paste can bring anything at all. Everything inline accumulates into the
 * current line; anything block-shaped ends it.
 */
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
    // Brackets and whitespace are what `INLINE_LINK` uses as delimiters, so a
    // label or a URL carrying them would truncate the link when it is read back.
    const label = collapse(textFrom(element)).replace(/[[\]]/g, '');
    // The link is emitted whole rather than inside the bold markers: the
    // renderer matches `**…**` *or* `[…](…)`, so `**[a](b)**` would reach the
    // mail as a bold run containing literal brackets.
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
    // Numbered lists become bullets: `renderParagraphs` draws one kind of list,
    // and a `<ol>` kept as one here would silently lose its numbers in the mail.
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

/** The editable's current content as the lines the document stores. */
export function linesFrom(root: HTMLElement): string {
  const walk: Walk = { lines: [], line: '', bullet: false };

  root.childNodes.forEach(child => collect(child, walk, false));
  flush(walk);

  // Two bold runs that meet — `**a****b**` from adjacent text nodes — are one
  // run to the reader and would parse as an empty one, so the seam is closed.
  return walk.lines.join('\n').replace(/\*\*\*\*/g, '');
}

/* ------------------------------------------------------------------ the field */

/** The `<a>` the selection sits in, if any. */
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
  /** Whether the selection sits in a link, which is what offers "Entfernen". */
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
  const ref = useRef<HTMLDivElement>(null);
  const drawn = useRef(false);
  // Whether the caret is in this field, from the field's own focus events
  // rather than from `document.activeElement`: the link popover's input is a
  // sibling of the editable, so "the active element is inside the editable" and
  // "this field is being edited" are not the same question.
  const focused = useRef(false);
  // The selection at the moment the link popover opened: focusing its input
  // takes the selection away from the editable, and `createLink` needs it back.
  const saved = useRef<Range | null>(null);
  const [link, setLink] = useState<LinkState>(CLOSED);
  const [active, setActive] = useState({
    bold: false,
    list: false,
    link: false,
  });
  // The tag picker: whether it is open, what its search box holds, and the list
  // itself once it has been fetched. `null` is "not loaded yet" rather than
  // "empty" — the two need different words in the popover.
  const [picker, setPicker] = useState(false);
  const [query, setQuery] = useState('');
  const [tags, setTags] = useState<MergeTagCatalogue | null>(null);

  /**
   * Draws the value into the editable — but only when it came from outside.
   *
   * While the caret is in this field the DOM is the truth and the prop is not:
   * Puck holds a field's value in local state and syncs it from its store, and
   * every keystroke here also re-renders the field (the caret moved, so the
   * toolbar state was recomputed). Those two land in either order, so a redraw
   * keyed on "the prop differs from what I last emitted" fires mid-word with
   * the *previous* value, replaces the paragraph the caret sits in, and leaves
   * the caret at the start of the field — where every further character then
   * goes. Skipping the redraw while focused is what keeps typing possible;
   * `onBlur` sends the finished text up, so nothing is lost by waiting.
   */
  useEffect(() => {
    const root = ref.current;

    if (!root) {
      return;
    }

    // First render: the editable is empty and has nothing to compare against.
    if (!drawn.current) {
      drawn.current = true;
      root.innerHTML = toHtml(value);

      return;
    }

    if (focused.current) {
      return;
    }

    // Against the editable's own content, not against the last emitted value:
    // the two differ exactly when the document changed elsewhere — another
    // block selected, an undo — which is when a redraw is actually wanted.
    if (linesFrom(root) !== value) {
      root.innerHTML = toHtml(value);
    }
  }, [value]);

  const sync = useCallback(() => {
    const root = ref.current;

    if (!root) {
      return;
    }

    onChange(linesFrom(root));
  }, [onChange]);

  /** What the caret currently sits in, which is what the toolbar shows. */
  const refresh = useCallback(() => {
    const root = ref.current;
    const selection = document.getSelection();

    // A selection elsewhere on the page says nothing about this field, so the
    // toolbar keeps what it last showed rather than reading another element's.
    if (!root || !selection?.focusNode || !root.contains(selection.focusNode)) {
      return;
    }

    const next = {
      bold: document.queryCommandState('bold'),
      list: document.queryCommandState('insertUnorderedList'),
      link: anchorAt(root, selection) !== null,
    };

    // Only on a real change: this runs on every caret move, and a fresh object
    // each time would re-render the field on every character typed.
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
    // On the document, not the field: `selectionchange` has no per-element form,
    // and a caret moved with the keyboard fires nothing else.
    document.addEventListener('selectionchange', refresh);

    return () => document.removeEventListener('selectionchange', refresh);
  }, [refresh]);

  const exec = (command: string, argument?: string) => {
    const root = ref.current;

    if (!root) {
      return;
    }

    root.focus();
    // `styleWithCSS` off: with it on, bold arrives as `<span style="font-weight:
    // bold">`, which reads back as bold only by the style sniffing in `isBold`.
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

  /** Selects the whole link, so a caret merely sitting in one can be edited. */
  const selectAnchor = (selection: Selection, anchor: HTMLAnchorElement) => {
    const range = document.createRange();
    range.selectNodeContents(anchor);
    selection.removeAllRanges();
    selection.addRange(range);
  };

  /**
   * Remembers where the caret is, which both popovers have to give back.
   *
   * A caret that is not in *this* field — the button pressed before the field
   * was ever clicked into, or while another one was being edited — is replaced
   * by one at the end of the text rather than refused. Doing nothing reads as a
   * broken button, and the end is where typing would have continued anyway.
   */
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

  /**
   * Makes the selection a link to `url`, inserting `label` when nothing is
   * selected.
   *
   * Shared by the link popover and the merge-tag picker, which differ only in
   * what they pass: a URL and itself, or `*|UNSUB|*` and the German name of what
   * it points at.
   */
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
      // Nothing selected: the label becomes its own link text and is left
      // selected, so typing replaces it — a link button that inserts nothing
      // visible reads as a button that did not work.
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
    // The href is written back rather than trusted: `createLink` hands the value
    // to the browser's URL parser, which percent-encodes the pipes of a merge
    // tag — `*%7CUNSUB%7C*` reaches Mailchimp unrecognised and the unsubscribe
    // link is then a dead relative path in every copy of the mail.
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
    // Fetched on the first open and kept for the session; `loadMergeTags` shares
    // one request across every prose field on the page.
    void loadMergeTags().then(setTags);
  };

  /**
   * Puts one merge tag where the caret was.
   *
   * A `url` tag becomes a link's *target* rather than text: `*|UNSUB|*` expands
   * to an address and nothing else, so dropped into a paragraph it reaches the
   * reader as a bare URL where a sentence should be.
   */
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

    // Inserted raw: `inlineMarkup` consumes merge tags before it looks for bold,
    // so two of them typed against each other no longer spell a `**` delimiter
    // and nothing has to be padded to keep them apart.
    root.focus();
    document.execCommand('insertText', false, tag.tag);
    sync();
    refresh();
  };

  // Toolbar buttons must not take the focus, or the selection they are about to
  // format is gone by the time the click handler runs.
  const keepSelection = (event: { preventDefault: () => void }) =>
    event.preventDefault();

  const groups = filterTags(tags?.groups ?? [], query);

  return (
    <div className="prose-field">
      <div className="prose-toolbar">
        <button
          type="button"
          data-active={active.bold}
          onMouseDown={keepSelection}
          onClick={() => exec('bold')}
          title={t('newsletter.prose.boldTitle')}
        >
          <strong>{t('newsletter.prose.bold')}</strong>
        </button>
        <button
          type="button"
          data-active={active.link}
          onMouseDown={keepSelection}
          onClick={openLink}
          title={t('newsletter.prose.link')}
        >
          {t('newsletter.prose.link')}
        </button>
        <button
          type="button"
          data-active={active.list}
          onMouseDown={keepSelection}
          onClick={() => exec('insertUnorderedList')}
          title={t('newsletter.prose.listTitle')}
        >
          {t('newsletter.prose.list')}
        </button>
        <button
          type="button"
          data-active={picker}
          onMouseDown={keepSelection}
          onClick={picker ? () => setPicker(false) : openPicker}
          title={t('newsletter.prose.mergeTagTitle')}
        >
          {t('newsletter.prose.mergeTag')}
        </button>
      </div>

      {link.open ?
        <div className="prose-link">
          <input
            type="text"
            className="prose-link-url"
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
          <button
            type="button"
            onMouseDown={keepSelection}
            onClick={applyLink}
          >
            {t('newsletter.prose.apply')}
          </button>
          {link.existing ?
            <button
              type="button"
              onMouseDown={keepSelection}
              onClick={removeLink}
            >
              {t('newsletter.prose.remove')}
            </button>
          : null}
        </div>
      : null}

      {picker ?
        <div className="prose-tags">
          <input
            type="text"
            className="prose-tags-search"
            value={query}
            autoFocus
            placeholder={t('newsletter.prose.searchTag')}
            onChange={event => setQuery(event.currentTarget.value)}
            onKeyDown={event => {
              if (event.key === 'Escape') {
                event.preventDefault();
                setPicker(false);
              }
            }}
          />

          {/* Loading, empty and "no contact fields" are three different things
              and each gets its own sentence: a picker that silently shows the
              system tags alone looks complete, and the editor would never learn
              that the audience's own fields are the ones missing. */}
          {tags?.error ?
            <p className="prose-tags-note">{tags.error}</p>
          : null}
          {tags === null ?
            <p className="prose-tags-note">
              {t('newsletter.prose.loadingTags')}
            </p>
          : null}
          {tags !== null && groups.length === 0 ?
            <p className="prose-tags-note">{t('newsletter.prose.noTag')}</p>
          : null}

          <div className="prose-tags-list">
            {groups.map(group => (
              <div key={group.name}>
                <p className="prose-tags-group">{t(group.name)}</p>
                {group.tags.map(tag => (
                  <button
                    key={tag.tag}
                    type="button"
                    className="prose-tags-item"
                    title={tag.description}
                    onMouseDown={keepSelection}
                    onClick={() => insertTag(tag)}
                  >
                    <span>{tag.label}</span>
                    <code>{tag.tag}</code>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      : null}

      <div
        id={id}
        ref={ref}
        className="prose-editor"
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
          // Plain text only. A paste from Word or a website brings fonts,
          // colours and tables that `linesFrom` would drop anyway — pasting them
          // in would show formatting in the field that never reaches the mail.
          event.preventDefault();
          document.execCommand(
            'insertText',
            false,
            event.clipboardData.getData('text/plain')
          );
          sync();
        }}
      />
      <p className="prose-hint">{t('newsletter.prose.hint')}</p>
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
