/**
 * The document a new issue starts from: its title as the heading, a placeholder
 * paragraph to overwrite, and the closing block, which the editor pins and
 * which carries the legal notice Mailchimp requires (see
 * `DEFAULT_FOOTER_LEGAL`). An issue that should look like last week's is
 * duplicated from it instead (`NewsletterCampaignService.duplicate`), so no
 * tenant's masthead or rubrics are baked in here.
 */
import type { NewsletterBlock } from './blocks';
import type { NewsletterDocument } from './document';

/** The closing block with nothing filled in but the legal notice's default. */
export const BLANK_FOOTER: NewsletterBlock = {
  type: 'footer',
  title: '',
  lines: [],
};

const PLACEHOLDER =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.';

export const newIssueDocument = (title: string): NewsletterDocument => ({
  preheader: '',
  blocks: [
    { type: 'heading', text: title },
    { type: 'text', paragraphs: [PLACEHOLDER] },
    BLANK_FOOTER,
  ],
});
