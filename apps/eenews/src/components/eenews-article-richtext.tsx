import styled from '@emotion/styled';
import { BlockFormat } from '@wepublish/richtext';
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

const isParagraph = (node: unknown): boolean =>
  (node as { type?: string })?.type === BlockFormat.Paragraph;

export const EenewsArticleRichText = ({
  className,
  richText,
}: BuilderRichTextBlockProps) => {
  const {
    richtext: { RenderRichtext },
  } = useWebsiteBuilder();

  const nodes = richText ?? [];
  const firstParagraph = nodes.findIndex(isParagraph);

  if (firstParagraph === -1) {
    return (
      <Wrapper className={className}>
        <RenderRichtext elements={nodes} />
      </Wrapper>
    );
  }

  const head = nodes.slice(0, firstParagraph + 1);
  const tail = nodes.slice(firstParagraph + 1);

  return (
    <Wrapper className={className}>
      <RenderRichtext elements={head} />
      <AdSlot>
        <Advertisement type="medium-rectangle" />
      </AdSlot>
      {tail.length > 0 && <RenderRichtext elements={tail} />}
    </Wrapper>
  );
};
