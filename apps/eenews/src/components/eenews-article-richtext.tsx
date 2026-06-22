import styled from '@emotion/styled';
import {
  BuilderRichTextBlockProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';

import { Advertisement } from './advertisement';

const Wrapper = styled('div')`
  position: relative;
  white-space: pre-wrap;
  overflow-wrap: break-word;
`;

const AdSlot = styled('div')`
  margin: 32px 0;
  display: flex;
  justify-content: center;
`;

type RichTextValue = BuilderRichTextBlockProps['richText'];

export const EenewsArticleRichText = ({
  className,
  richText,
}: BuilderRichTextBlockProps) => {
  const {
    blocks: { RichText },
  } = useWebsiteBuilder();

  const nodes = (richText ?? []) as unknown as Array<{ type?: string }>;
  const firstParagraph = nodes.findIndex(node => node?.type === 'paragraph');

  if (firstParagraph === -1) {
    return (
      <Wrapper className={className}>
        <RichText richText={richText} />
      </Wrapper>
    );
  }

  const head = nodes.slice(0, firstParagraph + 1);
  const tail = nodes.slice(firstParagraph + 1);

  return (
    <Wrapper className={className}>
      <RichText richText={head as unknown as RichTextValue} />
      <AdSlot>
        <Advertisement type="medium-rectangle" />
      </AdSlot>
      {tail.length > 0 && (
        <RichText richText={tail as unknown as RichTextValue} />
      )}
    </Wrapper>
  );
};
