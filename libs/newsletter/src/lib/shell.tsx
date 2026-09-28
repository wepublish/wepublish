import { Body, Container, Head, Html, Preview } from '@react-email/components';
import { renderBlock } from './blocks';
import { EMAIL_CSS } from './css';
import type { NewsletterDocument } from './document';
import { theme } from './theme';

/**
 * The page shell around the block list. Not imported by the editor canvas,
 * which draws blocks alone.
 */
export function NewsletterShell({
  document,
}: {
  document: NewsletterDocument;
}) {
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
        <style dangerouslySetInnerHTML={{ __html: EMAIL_CSS }} />
      </Head>
      <Body
        style={{ margin: 0, padding: 0, backgroundColor: theme.color.page }}
      >
        <Preview>{document.preheader}</Preview>

        <Container
          className="nl-container"
          // The attribute as well as the CSS: Word honours `width` and
          // ignores `max-width`.
          width={theme.contentWidth}
          style={{
            width: `${theme.contentWidth}px`,
            maxWidth: '100%',
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
