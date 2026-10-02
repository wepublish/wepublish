/** Turns a newsletter document into the HTML that gets uploaded to Mailchimp. */
import { render } from '@react-email/render';
import type { NewsletterDocument } from './document';
import { Newsletter } from './document';

export async function renderNewsletter(
  document: NewsletterDocument
): Promise<string> {
  // Never pretty-print. The formatter writes end tags in Prettier's split form,
  // `<strong\n  >text</strong\n>`; iOS Mail and Thunderbird do not recognise a
  // closing tag with a newline before its `>`, so the tag is dropped and the bold
  // run or the link's underline bleeds through the rest of the block. It also
  // doubles the uploaded HTML.
  return render(<Newsletter document={document} />);
}
