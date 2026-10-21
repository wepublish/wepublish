/**
 * What an issue would actually ship: how large the mail is, and what would go
 * wrong with it in an inbox.
 *
 * Both failures are invisible in the editor and in the preview, and both are
 * found by a reader rather than by an editor if nothing says so before the send:
 *
 * - **Gmail clips a message over 102 KB.** What is past the limit is replaced by
 *   a «[Message clipped] View entire message» link, and what gets cut is the
 *   *end* of the mail — the closing block, with the unsubscribe link and the
 *   postal address in it. A weekly issue of forty teasers is not far off that.
 * - **A footer that lost its required merge tags.** The legal notice is editable
 *   prose, so `*|UNSUB|*` can be deleted like any other text. `publish` refuses
 *   such an issue, but only once the transfer is asked for — usually against a
 *   deadline.
 *
 * The size is *measured on the rendered HTML*, never estimated from the
 * document. A per-block estimate that reads 90 % when the truth is 105 % is
 * worse than no number at all: it is the number an editor would trust.
 */
import type { NewsletterDocument } from './document';
import { describeRequiredTag, missingRequiredFooterTags } from './merge-tags';

/** Where Gmail starts clipping, counted the way its own help text counts it. */
export const CLIP_LIMIT_BYTES = 102 * 1024;

/**
 * The share of the limit at which the editor is warned rather than congratulated.
 *
 * Deliberately well under 1, because the HTML we upload is *smaller* than what
 * Gmail measures and there is no way to compute the difference here. Mailchimp
 * expands every merge tag (`*|LIST:ADDRESSLINE|*` becomes a whole address),
 * rewrites every link into a longer tracking URL, and the mail is
 * transfer-encoded on the way out. An issue that measures 100 % here was already
 * clipped; one at 80 % has room for that expansion.
 */
export const CLIP_WARN_RATIO = 0.8;

export interface NewsletterReport {
  /** Bytes of the HTML Mailchimp receives — UTF-8, not characters. */
  bytes: number;
  /** What the footer of the rendered issue is missing, phrased for the editor. */
  missingFooter: string[];
  /** Article ids the CMS did not return. `publish` refuses an issue with any. */
  missingArticles: string[];
}

/**
 * The size of the HTML as the wire sees it.
 *
 * `html.length` counts UTF-16 code units, which is not what Gmail measures: an
 * issue is German, so every `ä`, `—` and `«` in it costs two or three bytes and
 * counts as one character. On a full newsletter that gap is a few percent of the
 * limit — exactly the margin this number exists to report.
 */
export const htmlBytes = (html: string): number =>
  new TextEncoder().encode(html).length;

export function newsletterReport(
  html: string,
  missingArticles: string[]
): NewsletterReport {
  return {
    bytes: htmlBytes(html),
    missingFooter: missingRequiredFooterTags(html).map(describeRequiredTag),
    missingArticles,
  };
}

/**
 * Every string the document carries, joined — the browser's stand-in for the
 * rendered HTML when checking for the footer's required merge tags.
 *
 * `missingRequiredFooterTags` searches finished HTML, which the editor does not
 * have: rendering the shell in the browser would pull the renderer's Prettier
 * and `html-to-text` dependencies into `editor.js` for a substring search.
 * Walking the document for *every* string instead of reading the footer block's
 * fields is what keeps this from drifting: a block type added later, or a field
 * added to an existing one, is just another string.
 *
 * The two checks can only disagree about a tag sitting in a field that is never
 * rendered — an alt text, a condition's compared value. That direction is
 * harmless: it reports the requirement as met, and `publish` still checks the
 * HTML itself before anything reaches Mailchimp. The reverse — a tag present in
 * the document but conditional in the mail — cannot happen for the footer, which
 * `parseDocument` refuses to let carry a condition.
 *
 * Joined with newlines so two adjacent fields cannot spell a tag between them.
 */
export function documentText(document: NewsletterDocument): string {
  const found: string[] = [];

  const walk = (value: unknown): void => {
    if (typeof value === 'string') {
      found.push(value);
    } else if (Array.isArray(value)) {
      value.forEach(walk);
    } else if (value && typeof value === 'object') {
      Object.values(value).forEach(walk);
    }
  };

  walk(document);

  return found.join('\n');
}
