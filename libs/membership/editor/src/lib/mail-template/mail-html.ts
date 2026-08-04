export const MAIL_BODY_MARKER = 'mail-body';

/** Default gray frame and content width of a freshly created email shell. */
export const DEFAULT_BACKGROUND_COLOR = '#f4f4f4';
export const DEFAULT_CONTENT_WIDTH = 600;

export interface ShellSettings {
  backgroundColor: string;
  contentWidth: number;
}

const HEX_COLOR_REGEX = /^#[0-9a-fA-F]{3,8}$/;

const readStyleProp = (style: string | null, prop: string): string | null => {
  const match = style?.match(new RegExp(`${prop}\\s*:\\s*([^;]+)`, 'i'));
  return match ? match[1].trim() : null;
};

// Set (or append) a single declaration in an inline style string, preserving
// the author's hex notation rather than going through the CSSOM (which would
// normalise colors to rgb()).
const setStyleProp = (
  style: string | null,
  prop: string,
  value: string
): string => {
  const declaration = `${prop}:${value}`;
  const existing = style ?? '';
  const regex = new RegExp(`${prop}\\s*:\\s*[^;]*;?`, 'i');
  if (regex.test(existing)) {
    return existing.replace(regex, `${declaration};`);
  }
  return existing ?
      `${existing.replace(/;?\s*$/, ';')}${declaration};`
    : `${declaration};`;
};

const innerContentTable = (doc: Document): HTMLElement | null =>
  doc.querySelector<HTMLElement>(`.${MAIL_BODY_MARKER}`)?.closest('table') ??
  null;

/**
 * Read the current background color and content width from an email shell,
 * falling back to the defaults when a template was authored differently.
 */
export const readShellSettings = (html: string): ShellSettings => {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const background = readStyleProp(
    doc.body?.getAttribute('style') ?? null,
    'background-color'
  );
  const maxWidth = readStyleProp(
    innerContentTable(doc)?.getAttribute('style') ?? null,
    'max-width'
  );
  const parsedWidth = maxWidth ? parseInt(maxWidth, 10) : NaN;
  return {
    backgroundColor:
      background && HEX_COLOR_REGEX.test(background) ?
        background
      : DEFAULT_BACKGROUND_COLOR,
    contentWidth:
      Number.isFinite(parsedWidth) ? parsedWidth : DEFAULT_CONTENT_WIDTH,
  };
};

/**
 * Apply background color (the gray frame) and content width to an existing
 * email shell, leaving the body content untouched.
 */
export const applyShellSettings = (
  html: string,
  settings: ShellSettings
): string => {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const setBackground = (element: HTMLElement | null) => {
    if (element) {
      element.setAttribute(
        'style',
        setStyleProp(
          element.getAttribute('style'),
          'background-color',
          settings.backgroundColor
        )
      );
    }
  };

  setBackground(doc.body);
  // The outer (full-width) table also carries the frame color.
  setBackground(doc.querySelector<HTMLElement>('body > table'));

  const contentTable = innerContentTable(doc);
  if (contentTable) {
    contentTable.setAttribute(
      'style',
      setStyleProp(
        contentTable.getAttribute('style'),
        'max-width',
        `${settings.contentWidth}px`
      )
    );
  }

  return `<!DOCTYPE html>\n${doc.documentElement.outerHTML}`;
};

/**
 * Wraps body content in a table-based, responsive (max-width 600px) email shell
 * using only constructs broadly supported by mail clients. The body cell is the
 * editable region in the visual editor.
 */
export const wrapInEmailShell = (body: string): string => `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
</head>
<body style="margin:0;padding:0;background-color:#f4f4f4;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;background-color:#f4f4f4;">
<tr>
<td align="center" style="padding:24px 12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background-color:#ffffff;border-radius:8px;">
<tr>
<td class="${MAIL_BODY_MARKER}" style="padding:32px;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.5;color:#222222;word-break:break-word;overflow-wrap:break-word;">
${body}
</td>
</tr>
</table>
</td>
</tr>
</table>
</body>
</html>`;

/**
 * Returns an empty email document used when creating a new template.
 */
export const createEmptyEmailHtml = (): string =>
  wrapInEmailShell('<p style="margin:0 0 16px 0;"><br /></p>');

/** The login-token placeholder, resolved per recipient when the mail is sent. */
export const JWT_QUERY_PARAM = 'jwt={{jwt}}';

/**
 * Appends the login token to a link so the recipient arrives logged in.
 *
 * Picks `?` or `&` depending on what the URL already carries, keeps any
 * fragment at the end where it belongs, and leaves a URL that already has a
 * `jwt` param untouched.
 */
export const appendJwtParam = (url: string): string => {
  const trimmed = url.trim();

  if (!trimmed || /[?&]jwt=/.test(trimmed)) {
    return trimmed;
  }

  const hashIndex = trimmed.indexOf('#');
  const base = hashIndex === -1 ? trimmed : trimmed.slice(0, hashIndex);
  const fragment = hashIndex === -1 ? '' : trimmed.slice(hashIndex);
  const separator = base.includes('?') ? '&' : '?';

  return `${base}${separator}${JWT_QUERY_PARAM}${fragment}`;
};

/** Whether the login token is already part of this URL. */
export const hasJwtParam = (url: string): boolean => /[?&]jwt=/.test(url);

/**
 * A URL that the caret sits directly at the end of. Excludes quotes and angle
 * brackets so an HTML tag (`</p>`) or a closed attribute never counts as one.
 */
const URL_AT_CARET = /(?:https?:\/\/|www\.|\/)[^\s"'<>]*$/i;

/**
 * What inserting the login-token placeholder should actually write at the
 * caret. Directly after a URL the whole query parameter is inserted with the
 * right separator; anywhere else (prose, a subject line) the bare placeholder
 * is, because a query parameter would be meaningless there.
 *
 * Returns an empty string when the URL already carries the token.
 */
export const jwtInsertionFor = (textBeforeCaret: string): string => {
  const url = textBeforeCaret.match(URL_AT_CARET)?.[0];

  if (!url) {
    return `{{jwt}}`;
  }

  if (hasJwtParam(url)) {
    return '';
  }

  return `${url.includes('?') ? '&' : '?'}${JWT_QUERY_PARAM}`;
};
