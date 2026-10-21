/** Turns a newsletter document into the HTML that gets uploaded to Mailchimp. */
import { renderToStaticMarkup } from 'react-dom/server';
import type { NewsletterDocument } from './document';
import { Newsletter } from './document';

const DOCTYPE =
  '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">';

export async function renderNewsletter(
  document: NewsletterDocument
): Promise<string> {
  // Not `@react-email/render`: its output is this one plus React's stream
  // marker comments, and it loads Prettier and html-to-text, which nothing here
  // uses. Never pretty-print either: iOS Mail and Thunderbird drop Prettier's
  // split end tags, `</strong\n>`, and the bold run bleeds on.
  //
  // React hoists a preload link into `<head>` for every image; mail has no use
  // for it.
  return (
    DOCTYPE +
    renderToStaticMarkup(<Newsletter document={document} />).replace(
      /<link rel="preload" as="image"[^>]*>/g,
      ''
    )
  );
}
