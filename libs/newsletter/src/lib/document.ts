import type { NewsletterBlock } from './blocks';

export interface NewsletterDocument {
  /** The inbox preview line. Not rendered visibly. */
  preheader: string;
  blocks: NewsletterBlock[];
}

/**
 * The legal notice a footer starts from. `*|IFNOT:ARCHIVE_PAGE|*…*|END:IF|*`
 * hides the postal address on the public archive page.
 */
export const DEFAULT_FOOTER_LEGAL: string[] = [
  '[Im Browser ansehen](*|ARCHIVE|*)',
  '*|IFNOT:ARCHIVE_PAGE|**|LIST:ADDRESSLINE|**|END:IF|*',
  '[Einstellungen ändern](*|UPDATE_PROFILE|*) oder [Vom Newsletter abmelden](*|UNSUB|*)',
];

/**
 * What a newsletter starts from when there is no previous issue to copy: the
 * masthead rows and a pinned footer, nothing medium-specific.
 */
export const DEFAULT_DOCUMENT: NewsletterDocument = {
  preheader: '',
  blocks: [
    { type: 'meta', left: 'Newsletter', right: '' },
    { type: 'heading', text: 'Newsletter' },
    { type: 'text', gutter: 'intro', paragraphs: [] },
    { type: 'rubric', name: '' },
    { type: 'divider' },
    { type: 'footer', title: '', lines: [] },
  ],
};
