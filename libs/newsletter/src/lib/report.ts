import type { NewsletterDocument } from './document';
import type { RequiredFooterTagKey } from './merge-tags';
import { missingRequiredFooterTags } from './merge-tags';

/**
 * Gmail clips a mail over 102 KB, and what it cuts is the end: the footer
 * with the unsubscribe link and the address in it. A weekly issue of forty
 * teasers renders around 85 KB, so this is a limit editors actually reach.
 */
export const CLIP_LIMIT_BYTES = 102 * 1024;

/**
 * Well under 1 because what Gmail weighs is larger than what is uploaded:
 * Mailchimp expands every merge tag and rewrites every link into a longer
 * tracking URL after the upload.
 */
export const CLIP_WARN_RATIO = 0.8;

export interface NewsletterReport {
  /** Bytes of the HTML Mailchimp receives, UTF-8. */
  bytes: number;
  missingFooter: RequiredFooterTagKey[];
  missingArticles: string[];
  missingImages: string[];
}

/** UTF-8 bytes, not `html.length`: every umlaut costs two. */
export const htmlBytes = (html: string): number =>
  new TextEncoder().encode(html).length;

export function newsletterReport(
  html: string,
  missingArticles: string[],
  missingImages: string[]
): NewsletterReport {
  return {
    bytes: htmlBytes(html),
    missingFooter: missingRequiredFooterTags(html).map(
      required => required.key
    ),
    missingArticles,
    missingImages,
  };
}

/**
 * Every string the document carries, joined: the browser's stand-in for the
 * rendered HTML when checking for the footer's required merge tags. Walking
 * every string rather than the footer's fields keeps the check from drifting
 * as blocks gain fields.
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
