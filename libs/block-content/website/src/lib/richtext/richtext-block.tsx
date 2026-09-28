import styled from '@emotion/styled';
import {
  BuilderRichTextBlockProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import {
  FullBlockFragment,
  FullRichTextBlockFragment,
} from '@wepublish/website/api';

export const isRichTextBlock = (
  block: Partial<Pick<FullBlockFragment, '__typename'>>
): block is FullRichTextBlockFragment => block.__typename === 'RichTextBlock';

export const RichTextBlockWrapper = styled('div')`
  position: relative;
  white-space: pre-wrap;
  overflow-wrap: break-word;
`;

export const RichTextBlock = ({
  className,
  richText,
}: BuilderRichTextBlockProps) => {
  const {
    richtext: { RenderRichtext },
  } = useWebsiteBuilder();

  return (
    <RichTextBlockWrapper className={className}>
      <RenderRichtext document={richText} />
    </RichTextBlockWrapper>
  );
};
