import styled from '@emotion/styled';
import {
  BuilderRichTextBlockProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';

import { Advertisement } from './advertisement';
import { useArticleAdsSuppressed } from './article-ads-context';

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
type RichTextNode = { type?: string };

const getRichTextNodes = (richText: RichTextValue): RichTextNode[] => {
  if (Array.isArray(richText)) {
    return richText as unknown as RichTextNode[];
  }

  if (
    richText &&
    typeof richText === 'object' &&
    Array.isArray((richText as { content?: unknown }).content)
  ) {
    return (richText as { content: RichTextNode[] }).content;
  }

  return [];
};

const withRichTextNodes = (
  richText: RichTextValue,
  nodes: RichTextNode[]
): RichTextValue => {
  if (
    richText &&
    typeof richText === 'object' &&
    !Array.isArray(richText) &&
    Array.isArray((richText as { content?: unknown }).content)
  ) {
    return {
      ...(richText as Record<string, unknown>),
      content: nodes,
    } as unknown as RichTextValue;
  }

  return nodes as unknown as RichTextValue;
};

export const EenewsArticleRichText = ({
  className,
  richText,
}: BuilderRichTextBlockProps) => {
  const {
    blocks: { RichText },
  } = useWebsiteBuilder();
  const adsSuppressed = useArticleAdsSuppressed();

  const nodes = getRichTextNodes(richText);
  const firstParagraph = nodes.findIndex(node => node?.type === 'paragraph');

  if (adsSuppressed || firstParagraph === -1) {
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
      <RichText richText={withRichTextNodes(richText, head)} />
      <AdSlot>
        <Advertisement type="medium-rectangle" />
      </AdSlot>
      {tail.length > 0 && (
        <RichText richText={withRichTextNodes(richText, tail)} />
      )}
    </Wrapper>
  );
};
