/**
 * The page shell: everything that wraps the block list.
 *
 * Built from `@react-email/components` the way its documentation shows, so the
 * shell is the library's tested markup rather than ours: `Body` emits the
 * full-width outer table that clients stripping `<body>` still honour,
 * `Container` the centred fixed-width column, `Preview` the hidden inbox line —
 * including the padding characters that stop the first paragraph of the issue
 * from leaking into the preview next to the subject.
 *
 * Nothing in the layout depends on the `max-width: 480px` media query that
 * stacks the two-column teasers: a client that drops `<style>` still gets a
 * readable 660px issue rather than a broken one.
 */
import { Body, Container, Head, Html, Preview } from '@react-email/components';
import type { NewsletterBlock } from './blocks';
import { renderBlock } from './blocks';
import { EMAIL_CSS } from './css';
import { theme } from './theme';

export interface NewsletterDocument {
  /** The inbox preview line. Not rendered visibly. */
  preheader: string;
  blocks: NewsletterBlock[];
}

export function Newsletter({ document }: { document: NewsletterDocument }) {
  return (
    <Html
      lang="de"
      dir="ltr"
    >
      <Head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1"
        />
        {/* `Head` already emits the charset and `x-apple-disable-message-reformatting`
            (which stops iOS Mail bumping small text up to its own minimum size), so
            neither is repeated here. */}
        <style dangerouslySetInnerHTML={{ __html: EMAIL_CSS }} />
      </Head>
      <Body
        style={{ margin: 0, padding: 0, backgroundColor: theme.color.page }}
      >
        <Preview>{document.preheader}</Preview>

        <Container
          className="nl-container"
          // The `width` attribute, not just the CSS: Outlook renders through
          // Word, which honours the attribute and ignores `max-width`. Without
          // it the issue spans the whole window. `Container` spreads props over
          // its own `width="100%"`, so this replaces rather than duplicates it.
          width={theme.contentWidth}
          style={{
            width: `${theme.contentWidth}px`,
            // `Container` would otherwise cap the issue at its own 37.5em.
            maxWidth: '100%',
            // `Container` centres itself with `align="center"`, which Word needs;
            // this covers the clients that strip presentational attributes.
            margin: '0 auto',
            backgroundColor: theme.color.body,
          }}
        >
          {document.blocks.map((block, index) => renderBlock(block, index))}
        </Container>
      </Body>
    </Html>
  );
}
